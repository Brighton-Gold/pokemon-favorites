// ── State ──────────────────────────────────────────────────────
const favorites   = new Set(JSON.parse(localStorage.getItem('faves')    || '[]'));
const dislikes    = new Set(JSON.parse(localStorage.getItem('dislikes')  || '[]'));
let   allPokemon  = [];   // full detail objects
let   filtered    = [];   // currently shown

const TOTAL = 151; // Gen 1 — change to 251, 386, etc. for more generations

// ── DOM refs ───────────────────────────────────────────────────
const grid       = document.getElementById('pokemon-grid');
const loading    = document.getElementById('loading');
const searchEl   = document.getElementById('search');
const typeFilter = document.getElementById('type-filter');
const resultsBtn = document.getElementById('show-results-btn');
const overlay    = document.getElementById('modal-overlay');
const closeBtn   = document.getElementById('close-modal');
const faveRes    = document.getElementById('fave-results');
const dislikeRes = document.getElementById('dislike-results');

// ── Fetch all Pokémon ──────────────────────────────────────────
async function loadPokemon() {
  // Check cache first
  const cached = localStorage.getItem('pokemonData');
  if (cached) {
    allPokemon = JSON.parse(cached);
    buildTypeFilter();
    render(allPokemon);
    return;
  }

  // Fetch list
  const listRes  = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${TOTAL}`);
  const listData = await listRes.json();

  // Fetch details in parallel (batches of 30 to be polite to the API)
  const details = [];
  const urls    = listData.results.map(p => p.url);

  for (let i = 0; i < urls.length; i += 30) {
    const batch = await Promise.all(
      urls.slice(i, i + 30).map(url => fetch(url).then(r => r.json()))
    );
    details.push(...batch);
  }

  allPokemon = details.map(d => ({
    id:     d.id,
    name:   d.name,
    sprite: d.sprites.front_default,
    types:  d.types.map(t => t.type.name),
    stats:  Object.fromEntries(d.stats.map(s => [s.stat.name, s.base_stat])),
  }));

  // Cache for next visit
  localStorage.setItem('pokemonData', JSON.stringify(allPokemon));

  buildTypeFilter();
  render(allPokemon);
}

// ── Build type <select> ────────────────────────────────────────
function buildTypeFilter() {
  const types = [...new Set(allPokemon.flatMap(p => p.types))].sort();
  types.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    typeFilter.appendChild(opt);
  });
}

// ── Render grid ────────────────────────────────────────────────
function render(list) {
  loading.classList.add('hidden');
  grid.classList.remove('hidden');
  grid.innerHTML = '';
  filtered = list;

  list.forEach(p => {
    const card = document.createElement('div');
    card.className  = 'card';
    card.dataset.id = p.id;

    if (favorites.has(p.name)) card.classList.add('fave');
    if (dislikes.has(p.name))  card.classList.add('dislike');

    card.innerHTML = `
      <span class="card-id">#${String(p.id).padStart(3,'0')}</span>
      <img src="${p.sprite}" alt="${p.name}" loading="lazy" />
      <p class="card-name">${p.name}</p>
      <div class="types">
        ${p.types.map(t => `<span class="type ${t}">${t}</span>`).join('')}
      </div>
      <div class="card-buttons">
        <button class="btn-fave    ${favorites.has(p.name) ? 'active' : ''}" data-name="${p.name}" data-action="fave">❤️ Fave</button>
        <button class="btn-dislike ${dislikes.has(p.name)  ? 'active' : ''}" data-name="${p.name}" data-action="dislike">👎 Nope</button>
      </div>
    `;
    grid.appendChild(card);
  });

  updateResultsBtn();
}

// ── Button clicks (event delegation) ──────────────────────────
grid.addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const { name, action } = btn.dataset;
  const card = grid.querySelector(`.card[data-id="${allPokemon.find(p=>p.name===name)?.id}"]`);

  if (action === 'fave') {
    if (favorites.has(name)) {
      favorites.delete(name);
      card?.classList.remove('fave');
      btn.classList.remove('active');
    } else {
      favorites.add(name);
      dislikes.delete(name);          // can't be both
      card?.classList.add('fave');
      card?.classList.remove('dislike');
      btn.classList.add('active');
      card?.querySelector('.btn-dislike')?.classList.remove('active');
    }
  } else {
    if (dislikes.has(name)) {
      dislikes.delete(name);
      card?.classList.remove('dislike');
      btn.classList.remove('active');
    } else {
      dislikes.add(name);
      favorites.delete(name);         // can't be both
      card?.classList.add('dislike');
      card?.classList.remove('fave');
      btn.classList.add('active');
      card?.querySelector('.btn-fave')?.classList.remove('active');
    }
  }

  // Persist
  localStorage.setItem('faves',    JSON.stringify([...favorites]));
  localStorage.setItem('dislikes', JSON.stringify([...dislikes]));
  updateResultsBtn();
});

// ── Results button ─────────────────────────────────────────────
function updateResultsBtn() {
  resultsBtn.disabled = favorites.size === 0 && dislikes.size === 0;
  resultsBtn.textContent = `⚡ Show Similarities (${favorites.size + dislikes.size} selected)`;
}

// ── Similarity engine ──────────────────────────────────────────
function getSimilar(sourceNames, excludeNames) {
  // Gather types + average stats from source set
  const sourcePokemon = allPokemon.filter(p => sourceNames.has(p.name));
  if (sourcePokemon.length === 0) return [];

  const typeFreq = {};
  sourcePokemon.forEach(p =>
    p.types.forEach(t => { typeFreq[t] = (typeFreq[t] || 0) + 1; })
  );

  // Stat averages
  const statKeys  = ['hp','attack','defense','speed','special-attack','special-defense'];
  const avgStats  = {};
  statKeys.forEach(k => {
    avgStats[k] = sourcePokemon.reduce((s,p) => s + (p.stats[k]||0), 0) / sourcePokemon.length;
  });

  // Score every other pokemon
  return allPokemon
    .filter(p => !sourceNames.has(p.name) && !excludeNames.has(p.name))
    .map(p => {
      // Type score: sum frequency of matching types (0–4)
      const typeScore = p.types.reduce((s,t) => s + (typeFreq[t]||0), 0) * 2;

      // Stat distance score (inverse — closer = higher)
      const statDist  = statKeys.reduce((s,k) => s + Math.abs((p.stats[k]||0) - avgStats[k]), 0);
      const statScore = Math.max(0, 100 - statDist / statKeys.length);

      return { ...p, score: typeScore * 10 + statScore, typeScore, statScore };
    })
    .sort((a,b) => b.score - a.score)
    .slice(0, 12);
}

// ── Modal ──────────────────────────────────────────────────────
resultsBtn.addEventListener('click', () => {
  const faveList    = getSimilar(favorites, dislikes);
  const dislikeList = getSimilar(dislikes,  favorites);

  renderResults(faveRes,    faveList,    favorites.size    === 0 ? "Select some favorites first!" : null);
  renderResults(dislikeRes, dislikeList, dislikes.size     === 0 ? "Select some least favorites first!" : null);

  overlay.classList.remove('hidden');
});

function renderResults(container, list, emptyMsg) {
  container.innerHTML = '';
  if (emptyMsg || list.length === 0) {
    container.innerHTML = `<p style="color:var(--muted);font-size:0.85rem">${emptyMsg || 'No matches found.'}</p>`;
    return;
  }
  list.forEach(p => {
    const el = document.createElement('div');
    el.className = 'result-card';
    el.innerHTML = `
      <img src="${p.sprite}" alt="${p.name}" />
      <p>${p.name}</p>
      <div class="types" style="justify-content:center">
        ${p.types.map(t=>`<span class="type ${t}">${t}</span>`).join('')}
      </div>
      <span class="match-score">Score: ${Math.round(p.score)}</span>
    `;
    container.appendChild(el);
  });
}

closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });

// ── Search & Filter ────────────────────────────────────────────
function applyFilters() {
  const q    = searchEl.value.toLowerCase();
  const type = typeFilter.value;
  const list = allPokemon.filter(p =>
    p.name.includes(q) &&
    (type === '' || p.types.includes(type))
  );
  render(list);
}

searchEl.addEventListener('input',  applyFilters);
typeFilter.addEventListener('change', applyFilters);

// ── Boot ───────────────────────────────────────────────────────
loadPokemon();