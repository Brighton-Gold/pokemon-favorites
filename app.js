//get a list of original 151 pokemon
const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151'); // start with Gen 1!
const data = await res.json();
const pokemonList = data.results; // [{name: "bulbasaur", url: "..."}, ...]

//fetch details for each one (type, sprite, stats)
async function getPokemonDetails(url) {
  const res = await fetch(url);
  const data = await res.json();
  return {
    name: data.name,
    id: data.id,
    sprite: data.sprites.front_default,
    types: data.types.map(t => t.type.name),  // e.g. ["fire", "flying"]
    stats: data.stats.map(s => ({ name: s.stat.name, value: s.base_stat }))
  };
}

// create a card for each pokemon and the button to like/dislike
function createCard(pokemon) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="${pokemon.sprite}" alt="${pokemon.name}">
    <p>${pokemon.name}</p>
    <div class="types">${pokemon.types.map(t => `<span class="type ${t}">${t}</span>`).join('')}</div>
    <div class="buttons">
      <button onclick="markFavorite('${pokemon.name}')">❤️ Fave</button>
      <button onclick="markDislike('${pokemon.name}')">👎 Least Fave</button>
    </div>
  `;
  document.getElementById('pokemon-grid').appendChild(card);
}


// create the list of favorite and least favorite pokemon
const favorites = new Set();
const leastFavorites = new Set();

function markFavorite(name) {
  favorites.add(name);
  updateSimilarities();
}

function getSimilarities(targetList, allPokemon) {
  // Collect all types from your favorites
  const likedTypes = new Set(
    targetList.flatMap(name => pokemonMap[name].types)
  );

  // Score every pokemon by how many types match
  return allPokemon
    .map(p => ({
      ...p,
      score: p.types.filter(t => likedTypes.has(t)).length
    }))
    .filter(p => !favorites.has(p.name) && !leastFavorites.has(p.name))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // top 10 similar
}