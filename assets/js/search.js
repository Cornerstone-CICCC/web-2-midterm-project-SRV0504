/***********************
 *  CONFIG & HELPERS
 ***********************/
const API_KEY = window.APP_CONFIG?.TMDB_API_KEY || "";
const TMDB = "https://api.themoviedb.org/3";
const withKey = (path) =>
  `${TMDB}${path}${path.includes("?") ? "&" : "?"}api_key=${API_KEY}&language=en-US`;

const imgUrl = (p) =>
  p ? `https://image.tmdb.org/t/p/w500${p}` : "https://via.placeholder.com/500x750?text=No+Image";

const $  = (s) => document.querySelector(s);
const $id = (id) => document.getElementById(id);

/***********************
 *  UI
 ***********************/
function cardHTML(item) {
  const title  = item.title || item.name || "Untitled";
  const year   = (item.release_date || item.first_air_date || "").slice(0, 4);
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

function renderResults(list) {
  const grid  = $id("searchResults");
  const empty = $id("searchEmpty");
  if (!grid) return;

  if (!list?.length) {
    grid.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";
  grid.innerHTML = list.map(cardHTML).join("");
}

/***********************
 *  SEARCH
 ***********************/
async function runSearch(q) {
  const err = $id("searchError");
  if (err) err.style.display = "none";

  // Validaciones básicas
  if (!API_KEY) {
    if (err) {
      err.textContent = "Missing TMDB API key. Make sure assets/js/config.local.js is loaded.";
      err.style.display = "block";
    }
    return;
  }
  if (!q) {
    renderResults([]);
    return;
  }

  try {
    const url = withKey(`/search/multi?query=${encodeURIComponent(q)}&page=1&include_adult=false`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const results = (data.results || [])
      .filter(x => (x.media_type === "movie" || x.media_type === "tv") && (x.poster_path || x.backdrop_path));

    renderResults(results);
  } catch (e) {
    console.error("Search error:", e);
    if ($id("searchError")) $id("searchError").style.display = "block";
  }
}

/***********************
 *  INIT
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  // Marcar activo (opcional)
  document.querySelectorAll(".nav__link").forEach(a => {
    a.classList.toggle("is-active", a.getAttribute("href") === "movies.html"); // ajusta si quieres marcar alguno
  });

  // Leer ?q del URL
  const params = new URLSearchParams(location.search);
  const q = (params.get("q") || "").trim();

  const title = $id("searchTitle");
  if (title) title.textContent = q ? `Results for “${q}”` : "Results";

  const input = $id("searchInput");
  if (input) input.value = q;

  // Búsqueda inicial si vino con ?q
  runSearch(q);

  // Submit en esta misma página (permite buscar sin recargar si quieres)
  const form = $id("navSearchForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const newQ = (new FormData(form).get("q") || "").toString().trim();
      if (!newQ) return;

      // Opción A: recargar con ?q (más simple y consistente)
      window.location.href = `${form.getAttribute("action") || "search.html"}?q=${encodeURIComponent(newQ)}`;

      // Opción B (sin recargar): comenta la línea de arriba y usa:
      // if (title) title.textContent = `Results for “${newQ}”`;
      // runSearch(newQ);
    });
  }

  // Botón de limpiar
  const closeBtn = document.querySelector(".js-close-search");
  if (closeBtn && input) {
    closeBtn.addEventListener("click", () => {
      input.value = "";
      input.focus();
      // Limpia resultados si quieres:
      // renderResults([]);
      // if (title) title.textContent = "Results";
      // history.replaceState({}, "", "search.html");
    });
  }
});
