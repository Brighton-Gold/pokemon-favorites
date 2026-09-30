console.log("script.js is connected!");

let allPokemon = [];

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

function setupSearch(allPokemon) {
  const search = document.getElementById("search");

  search.addEventListener("input", () => {
    const query = search.value.toLowerCase().trim();
    const grid  = document.getElementById("pokemon-grid");

    grid.innerHTML = "";
    const filtered = allPokemon.filter(p => p.name.includes(query));
    displayPokemon(filtered);
    loadSelections();
    updateLeftSidebar();
  });
}

function displayPokemon(allPokemon) {
  const grid = document.getElementById("pokemon-grid");

  allPokemon.forEach((pokemon) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.name = pokemon.name; // Store the name for saving selections
    card.innerHTML = `
      <span class="card-id">#${String(pokemon.id).padStart(3, "0")}</span>
      <span class="card-indicator"></span>
      <img src="${pokemon.sprite}" alt="${pokemon.name}" />
      <p>${pokemon.name}</p>
      <div class="types">
        ${pokemon.types.map((t) => `<span class="type ${t}">${t}</span>`).join("")}
      </div>
    `;

    card.addEventListener("click", () => {
      const indicator = card.querySelector(".card-indicator");

      if (!card.dataset.state) {
        card.dataset.state = "fave";
        card.classList.add("fave");
        indicator.textContent = "❤️";
      } else if (card.dataset.state === "fave") {
        card.dataset.state = "dislike";
        card.classList.remove("fave");
        card.classList.add("dislike");
        indicator.textContent = "👎";
      } else {
        delete card.dataset.state;
        card.classList.remove("dislike");
        indicator.textContent = "";
      }

      // Save selections after every click
      saveSelections();
      updateLeftSidebar();
    });

    grid.appendChild(card);
  });
}

// ✅ Merge visible cards with already saved selections
function saveSelections() {
  // Start with what's already saved
  const selections = JSON.parse(localStorage.getItem("selections") || "{}");

  // Update only the cards currently visible in the DOM
  const cards = document.querySelectorAll(".card");
  cards.forEach(card => {
    if (card.dataset.state) {
      // Add or update this pokemon
      selections[card.dataset.name] = card.dataset.state;
    } else {
      // If card exists in DOM but has no state, remove it from saved
      delete selections[card.dataset.name];
    }
  });

  localStorage.setItem("selections", JSON.stringify(selections));
}

function loadSelections(allPokemon) {
  const saved = JSON.parse(localStorage.getItem("selections") || "{}");

  document.querySelectorAll(".card").forEach(card => {
    const state = saved[card.dataset.name];
    if (!state) return;

    const indicator = card.querySelector(".card-indicator");
    card.dataset.state = state;

    if (state === "fave") {
      card.classList.add("fave");
      indicator.textContent = "❤️";
    } else if (state === "dislike") {
      card.classList.add("dislike");
      indicator.textContent = "👎";
    }
  });
}

function updateLeftSidebar() {
  const faveList    = document.getElementById("fave-list");
  const dislikeList = document.getElementById("dislike-list");

  faveList.innerHTML    = "";
  dislikeList.innerHTML = "";

  // Read from localStorage instead of the DOM
  const saved = JSON.parse(localStorage.getItem("selections") || "{}");

  let faveCount    = 0;
  let dislikeCount = 0;

  Object.entries(saved).forEach(([name, state]) => {
    // Look up the sprite from allPokemon array
    const pokemon = allPokemon.find(p => p.name === name);
    if (!pokemon) return;

    const item = document.createElement("div");
    item.className = "selected-pokemon";
    item.innerHTML = `
      <img src="${pokemon.sprite}" alt="${name}" />
      <span>${name}</span>
      <button data-name="${name}">✕</button>
    `;

    item.querySelector("button").addEventListener("click", () => {
      // Remove from localStorage
      const selections = JSON.parse(localStorage.getItem("selections") || "{}");
      delete selections[name];
      localStorage.setItem("selections", JSON.stringify(selections));

      // Update the card in the DOM if it's currently visible
      const targetCard = document.querySelector(`.card[data-name="${name}"]`);
      if (targetCard) {
        delete targetCard.dataset.state;
        targetCard.classList.remove("fave", "dislike");
        targetCard.querySelector(".card-indicator").textContent = "";
      }

      updateLeftSidebar();
    });

    if (state === "fave") {
      faveList.appendChild(item);
      faveCount++;
    } else {
      dislikeList.appendChild(item);
      dislikeCount++;
    }
  });

  if (faveCount === 0)    faveList.innerHTML    = "<p class='empty-msg'>No favorites yet!</p>";
  if (dislikeCount === 0) dislikeList.innerHTML = "<p class='empty-msg'>No dislikes yet!</p>";
}

function setupSidebars() {
  const leftSidebar  = document.getElementById("left-sidebar");
  const rightSidebar = document.getElementById("right-sidebar");
  const leftTab      = document.getElementById("left-tab");
  const rightTab     = document.getElementById("right-tab");

  leftTab.addEventListener("click", () => {
    leftSidebar.classList.toggle("collapsed");
    leftTab.textContent = leftSidebar.classList.contains("collapsed") ? "»" : "«";
  });

  rightTab.addEventListener("click", () => {
    rightSidebar.classList.toggle("collapsed");
    rightTab.textContent = rightSidebar.classList.contains("collapsed") ? "«" : "»";
  });
}
// Run both functions together
async function init() {
  const allPokemon = await fetchPokemon();
  displayPokemon(allPokemon);
  loadSelections(); 
  setupSearch(allPokemon);
  setupSidebars();
  updateLeftSidebar();
}

init();
