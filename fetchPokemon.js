// fetchPokemon.js
// Responsible for all API calls and caching

/**************************************************************
 * Determines the generation of a Pokémon based on its ID.
 * @param {number} id - The Pokémon's ID.
 * @returns {number} The generation to which the Pokémon belongs.
 * Evidently the pokemon API doesnt provide generation data, so we 
 * have to determine it based on the ID ranges for each generation. Weird.
 *****************************************************************/
function getGeneration(id) {
  if (id <= 151)  return 1;
  if (id <= 251)  return 2;
  if (id <= 386)  return 3;
  if (id <= 493)  return 4;
  if (id <= 649)  return 5;
  if (id <= 721)  return 6;
  if (id <= 809)  return 7;
  if (id <= 905)  return 8;
  return 9;
}

/**********************************************************
* This Fetches the Pokémon data from the API and caches it in localStorage for future use. 
* It also sets up the search functionality and displays the Pokémon cards on the page.
***********************************************************/
async function fetchPokemon() {
  const cached = localStorage.getItem("pokemonData");
  if (cached) {
    allPokemon = JSON.parse(cached);
    console.log("Loaded from cache! Total:", allPokemon.length);
    return allPokemon;
  }

/**********************************************************
* This section fetches the Pokémon data from the API. It first fetches the list of Pokémon, 
* then fetches the details for each Pokémon in parallel using Promise.all. The details are then
* mapped to a simpler structure and cached in localStorage for future use.
***********************************************************/
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=10000"); // Adjust the limit as needed. 151 = gen 1, 251 = gen 2
  const data = await res.json();
  const promises = data.results.map((p) => fetch(p.url).then((r) => r.json()));
  const details = await Promise.all(promises);

  // Pokémon information that we want to store in localStorage for future use. This includes the id, name, sprite, types, stats, and generation of each Pokémon.
  allPokemon = details.map((d) => ({
    id: d.id,
    name: d.name,
    sprite: d.sprites.front_default,
    types: d.types.map((t) => t.type.name),
    stats: d.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
    generation: getGeneration(d.id),
  }));

  localStorage.setItem("pokemonData", JSON.stringify(allPokemon));
  console.log("Fetched and cached! Total:", allPokemon.length);
  return allPokemon;
}