
const API_KEY = window.APP_CONFIG?.TMDB_API_KEY || ""; // ← ya no está hardcodeada
const TMDB = "https://api.themoviedb.org/3";
const withKey = (path) =>
  `${TMDB}${path}${path.includes("?") ? "&" : "?"}api_key=${API_KEY}&language=en-US`;
const imgUrl = (p) =>
  p ? `https://image.tmdb.org/t/p/w500${p}` : "https://via.placeholder.com/500x750?text=No+Image";
const bgUrl = (p) =>
  p ? `https://image.tmdb.org/t/p/original${p}` : "";

/***********************
 *  HELPERS
 ***********************/
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const $id = (id) => document.getElementById(id);

function debounce(fn, ms = 400) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/*CARD + GRID*/
function cardHTML(item) {
  const title = item.title || item.name || "Untitled";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "—";
  const poster = imgUrl(item.poster_path);

  return `
    <article class="card">
      <img class="card__poster"
           src="${poster}"
           alt="${title} poster"
           onerror="this.onerror=null;this.src='https://via.placeholder.com/500x750?text=No+Image';">
      <div class="card__meta">
        <p class="card__title">${title}</p>
        <p class="card__sub">${year || "—"} • ★ ${rating}</p>
      </div>
    </article>
  `;
}

function renderGrid(containerId, items) {
  const root = $id(containerId);
  if (!root) return;
  root.innerHTML = (items || []).map(cardHTML).join("");
}

/* GENRES*/
async function loadGenres() {
  try {
    const res = await fetch(withKey("/genre/movie/list"));
    const data = await res.json();
    const box = $id("genreList");
    if (!box) return;
    const list = (data.genres || []).slice(0, 12);
    box.innerHTML = list.map((g) => `<div class="genre">${g.name}</div>`).join("");
  } catch (e) {
    console.error("Genres error:", e);
  }
}

/*CAROUSEL*/
const carousel = { items: [], i: 0 };

function updateCarouselView() {
  if (!carousel.items.length) return;
  const m = carousel.items[carousel.i];

  const hero = $id("hero");
  const titleEl = $id("mainTitle");
  const sinEl = $id("mainOverview");

  if (hero) {
    const bg = bgUrl(m.backdrop_path || m.poster_path);
    hero.style.backgroundImage = bg ? `url(${bg})` : "none";
  }
  if (titleEl) titleEl.textContent = m.title || m.name || "Untitled";
  if (sinEl) sinEl.textContent = m.overview || "No synopsis available.";
}

function setupCarouselControls() {
  const prev = $id("prevBtn");
  const next = $id("nextBtn");
  if (prev) prev.addEventListener("click", () => {
    if (!carousel.items.length) return;
    carousel.i = (carousel.i - 1 + carousel.items.length) % carousel.items.length;
    updateCarouselView();
  });
  if (next) next.addEventListener("click", () => {
    if (!carousel.items.length) return;
    carousel.i = (carousel.i + 1) % carousel.items.length;
    updateCarouselView();
  });
}

async function loadCarousel() {
  try {
    const res = await fetch(withKey("/trending/movie/day"));
    const data = await res.json();
    carousel.items = (data.results || []).slice(0, 6);
    carousel.i = 0;
    updateCarouselView();
  } catch (e) {
    console.error("Carousel error:", e);
  }
}

/*SECTIONS*/
async function loadTopRated() {
  try {
    const res = await fetch(withKey("/movie/top_rated?page=1"));
    const data = await res.json();
    renderGrid("topRated", data.results || []);
  } catch (e) {
    console.error("Top rated error:", e);
  }
}

async function loadNewReleases() {
  try {
    const res = await fetch(withKey("/movie/upcoming?page=1"));
    const data = await res.json();
    renderGrid("newReleases", data.results || []);
  } catch (e) {
    console.error("Upcoming error:", e);
  }
}

async function loadNowPlaying() {
  try {
    const res = await fetch(withKey("/movie/now_playing?page=1"));
    const data = await res.json();
    renderGrid("nowPlaying", data.results || []);
  } catch (e) {
    console.error("Now playing error:", e);
  }
}


(function markActiveNav() {
  const file = location.pathname.split("/").pop() || "movies.html";
  const map = {
    "movies.html": "movies",
    "tv.html": "tv",
    "about.html": "about"
  };
  const activeKey = map[file] || "movies";
  $$(".nav__link").forEach(a => a.classList.toggle("is-active", a.dataset.nav === activeKey));
})();


const searchInput       = $id("searchInput");
const searchSection     = $id("searchSection");
const searchResultsRoot = $id("searchResults");
const navEl             = $(".nav");
const openBtn           = $(".js-open-search");
const closeBtn          = $(".js-close-search");
const navSearchForm     = $id("navSearchForm");

async function tmdbSearch(query, page = 1) {
  const url = withKey(`/search/multi?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`);
  const res = await fetch(url);
  const data = await res.json();
  return (data.results || []).filter(
    r => (r.media_type === "movie" || r.media_type === "tv") && (r.poster_path || r.backdrop_path)
  );
}

async function handleSearch(q) {
  if (!q || q.trim().length < 2) {
    if (searchResultsRoot) searchResultsRoot.innerHTML = "";
    if (searchSection) searchSection.hidden = true;
    return;
  }
  try {
    const results = await tmdbSearch(q.trim());
    if (searchResultsRoot) {
      searchResultsRoot.innerHTML = results.length
        ? results.map(cardHTML).join("")
        : `<p style="padding:0 20px;opacity:.8">No results for “${q}”.</p>`;
    }
    if (searchSection) searchSection.hidden = false;
  } catch (e) {
    console.error("Search error:", e);
  }
}

const onSearchInput = debounce((e) => handleSearch(e.target.value), 450);

function openSearch() {
  navEl?.classList.add("search-open");
  setTimeout(() => searchInput?.focus(), 10);
}
function closeSearch() {
  navEl?.classList.remove("search-open");
  if (searchInput) searchInput.value = "";
  if (searchSection) searchSection.hidden = true;
}

function setupSearchInPill() {
  if (!openBtn || !closeBtn || !searchInput) return;
  openBtn.addEventListener("click", openSearch);
  closeBtn.addEventListener("click", closeSearch);
  navSearchForm?.addEventListener("submit", (e) => { e.preventDefault(); handleSearch(searchInput.value); });
  searchInput.addEventListener("input", onSearchInput);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navEl?.classList.contains("search-open")) closeSearch();
  });
  
}


function init() {
  setupCarouselControls();
  loadCarousel();
  loadGenres();
  loadTopRated();
  loadNewReleases();
  loadNowPlaying();

  setupSearchInPill(); 
}

document.addEventListener("DOMContentLoaded", init);

const resultsSection = document.getElementById('searchResults');

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function showResults(items = [], query = "") {
  document.body.classList.add('is-searching');

  const title = query ? `Results for “${escapeHtml(query)}”` : "Results";
  const grid = (items || []).map(cardHTML).join("");

  resultsSection.innerHTML = `
    <h2>${title}</h2>
    <div class="movie-grid">${grid}</div>
  `;

  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearResults() {
  document.body.classList.remove('is-searching');
  resultsSection.innerHTML = "";
}


