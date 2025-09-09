/***********************
 *  CONFIG
 ***********************/
const API_KEY = window.APP_CONFIG?.TMDB_API_KEY || "";
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

/***********************
 *  CARD + GRID
 ***********************/
function cardHTML(item) {
  const title = item.title || item.name || "Untitled";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "—";
  const poster = imgUrl(item.poster_path);

  return `
    <article class="card" data-id="${item.id}">
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

/***********************
 *  MODAL
 ***********************/
function setupModalListeners() {
  document.body.addEventListener("click", async (e) => {
    const card = e.target.closest(".card");
    if (!card) return;

    const movieId = card.dataset.id;
    if (!movieId) return;

    try {
      const res = await fetch(withKey(`/movie/${movieId}`));
      const data = await res.json();

      $id("modalTitle").textContent = data.title || "No title";
      $id("modalDate").textContent = data.release_date || "N/A";
      $id("modalTagline").textContent = data.tagline || "—";
      $id("modalOverview").textContent = data.overview || "No overview";
      $id("modalGenres").textContent = (data.genres || []).map(g => g.name).join(", ");
      $id("modalRating").textContent = data.vote_average?.toFixed(1) || "—";
      $id("modalPoster").src = imgUrl(data.poster_path);

      // Mostrar el modal con animación
      const modal = $id("movieModal");
      modal.classList.remove("show");
      modal.classList.add("show");
    } catch (err) {
      console.error("Modal error:", err);
    }
  });

  $id("closeModal").addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === $id("movieModal")) {
      closeModal();
    }
  });

  function closeModal() {
    const modal = $id("movieModal");
    modal.classList.remove("show");
    modal.classList.add("hidden");
  }
}


/***********************
 *  GENRES
 ***********************/
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

/***********************
 *  CAROUSEL
 ***********************/
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
  if (sinEl) {
    const fullOverview = m.overview || "No synopsis available.";
    const shortOverview = fullOverview.length > 200
      ? fullOverview.slice(0, 200) + "..."
      : fullOverview;
    sinEl.textContent = shortOverview;
  }
  }

function setupCarouselControls() {
  const prev = $id("prevBtn");
  const next = $id("nextBtn");

  if (prev)
    prev.addEventListener("click", () => {
      if (!carousel.items.length) return;
      carousel.i = (carousel.i - 1 + carousel.items.length) % carousel.items.length;
      updateCarouselView();
    });

  if (next)
    next.addEventListener("click", () => {
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

/***********************
 *  SECTIONS
 ***********************/
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

/***********************
 *  NAV ACTIVE LINK
 ***********************/
(function markActiveNav() {
  const current = (location.pathname.split("/").pop() || "movies.html").toLowerCase();
  $$(".nav__link").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    a.classList.toggle("is-active", href.endsWith(current));
  });
})();

/***********************
 *  SEARCH
 ***********************/
function setupSearchInPill() {
  const navEl = $(".nav");
  const searchInput = $id("searchInput");
  const openBtn = $(".js-open-search");
  const closeBtn = $(".js-close-search");
  const navSearchForm = $id("navSearchForm");

  if (openBtn) openBtn.addEventListener("click", () => {
    navEl?.classList.add("search-open");
    setTimeout(() => searchInput?.focus(), 10);
  });

  if (closeBtn) closeBtn.addEventListener("click", () => {
    navEl?.classList.remove("search-open");
    if (searchInput) searchInput.value = "";
  });

  if (navSearchForm) {
    navSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = (new FormData(navSearchForm).get("q") || "").toString().trim();
      if (!q) return;
      const base = navSearchForm.getAttribute("action") || "search.html";
      window.location.href = `${base}?q=${encodeURIComponent(q)}`;
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") navEl?.classList.remove("search-open");
  });
}

/***********************
 *  THEME TOGGLE
 ***********************/
function setupThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleNav');
  const body = document.body;

  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const isDark = body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode', !isDark);
    toggleBtn.classList.toggle('light-mode', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    body.classList.add('light-mode');
    toggleBtn.classList.add('light-mode');
  } else {
    body.classList.add('dark-mode');
    toggleBtn.classList.remove('light-mode');
  }
}

/***********************
 *  INIT
 ***********************/
function init() {
  setupThemeToggle();
  setupCarouselControls();
  loadCarousel();
  loadGenres();
  loadTopRated();
  loadNewReleases();
  loadNowPlaying();
  setupSearchInPill();
  setupModalListeners();
}

document.addEventListener("DOMContentLoaded", init);

