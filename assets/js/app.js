
const API_KEY = "188356d0963bdb52332917e32d378c70"; 
const TMDB = "https://api.themoviedb.org/3";
const withKey = (path) =>
  `${TMDB}${path}${path.includes("?") ? "&" : "?"}api_key=${API_KEY}&language=en-US`;
const imgUrl = (p) =>
  p ? `https://image.tmdb.org/t/p/w500${p}` : "https://via.placeholder.com/500x750?text=No+Image";
const bgUrl = (p) =>
  p ? `https://image.tmdb.org/t/p/original${p}` : ""; 


const $ = (sel) => document.querySelector(sel);
const $id = (id) => document.getElementById(id);

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


function init() {
  setupCarouselControls();
  loadCarousel();
  loadGenres();
  loadTopRated();
  loadNewReleases();
  loadNowPlaying();
}

document.addEventListener("DOMContentLoaded", init);
