// compare.js
// Responsible for all comparison logic between favorites and dislikes

function comparePokemon() {
  const saved = JSON.parse(localStorage.getItem("selections") || "{}");

  const faves    = allPokemon.filter(p => saved[p.name] === "fave");
  const dislikes = allPokemon.filter(p => saved[p.name] === "dislike");

  if (faves.length === 0 || dislikes.length === 0) {
    document.getElementById("comparison-results").innerHTML = `
      <p class="empty-msg">You need at least one favorite and one least favorite to compare!</p>
    `;
    return;
  }

  const faveTypes    = countTypes(faves);
  const dislikeTypes = countTypes(dislikes);

  const faveStats    = averageStats(faves);
  const dislikeStats = averageStats(dislikes);

  const faveGen    = mostCommonGen(faves);
  const dislikeGen = mostCommonGen(dislikes);

  document.getElementById("comparison-results").innerHTML = `
    <div class="comparison-section">
      <h3>🎨 Types</h3>
      <div class="comparison-row">
        <div class="comparison-col">
          <p class="col-label">❤️ You like</p>
          ${renderTypes(faveTypes)}
        </div>
        <div class="comparison-col">
          <p class="col-label">👎 You dislike</p>
          ${renderTypes(dislikeTypes)}
        </div>
      </div>
    </div>

    <div class="comparison-section">
      <h3>📊 Average Stats</h3>
      <div class="comparison-row">
        <div class="comparison-col">
          <p class="col-label">❤️ Favorites</p>
          ${renderStats(faveStats)}
        </div>
        <div class="comparison-col">
          <p class="col-label">👎 Least Favorites</p>
          ${renderStats(dislikeStats)}
        </div>
      </div>
    </div>

    <div class="comparison-section">
      <h3>🕹️ Generation</h3>
      <div class="comparison-row">
        <div class="comparison-col">
          <p class="col-label">❤️ Favorites</p>
          <p class="gen-result">Mostly Gen ${faveGen}</p>
        </div>
        <div class="comparison-col">
          <p class="col-label">👎 Least Favorites</p>
          <p class="gen-result">Mostly Gen ${dislikeGen}</p>
        </div>
      </div>
    </div>
  `;
}

// ── Helper functions ───────────────────────────────────────────

function countTypes(pokemonList) {
  const counts = {};
  pokemonList.forEach(p => {
    p.types.forEach(t => {
      counts[t] = (counts[t] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function averageStats(pokemonList) {
  const totals = {};
  const counts = {};

  pokemonList.forEach(p => {
    p.stats.forEach(s => {
      totals[s.name] = (totals[s.name] || 0) + s.value;
      counts[s.name] = (counts[s.name] || 0) + 1;
    });
  });

  return Object.entries(totals).map(([name, total]) => ({
    name,
    avg: Math.round(total / counts[name])
  }));
}

function mostCommonGen(pokemonList) {
  const counts = {};
  pokemonList.forEach(p => {
    counts[p.generation] = (counts[p.generation] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function renderTypes(typeCounts) {
  return typeCounts.map(([type, count]) => `
    <div class="stat-row">
      <span class="type ${type}">${type}</span>
      <span class="stat-count">×${count}</span>
    </div>
  `).join("");
}

function renderStats(stats) {
  return stats.map(s => `
    <div class="stat-row">
      <span class="stat-name">${s.name}</span>
      <span class="stat-value">${s.avg}</span>
    </div>
  `).join("");
}