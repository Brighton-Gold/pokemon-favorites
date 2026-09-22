console.log("script.js is connected!");

async function fetchPokemon() {
  const cached = localStorage.getItem("pokemonData");
  if (cached) {
    const allPokemon = JSON.parse(cached);
    console.log("Loaded from cache! Total:", allPokemon.length);
    return allPokemon;
  }

  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
  const data = await res.json();
  const promises = data.results.map((p) => fetch(p.url).then((r) => r.json()));
  const details = await Promise.all(promises);

  const allPokemon = details.map((d) => ({
    id: d.id,
    name: d.name,
    sprite: d.sprites.front_default,
    types: d.types.map((t) => t.type.name),
    stats: d.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
  }));

  localStorage.setItem("pokemonData", JSON.stringify(allPokemon));
  console.log("Fetched and cached! Total:", allPokemon.length);
  return allPokemon;
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
    });

    grid.appendChild(card);
  });
}

function saveSelections() {
  const cards = document.querySelectorAll(".card");
  const selections = {};

  cards.forEach(card => {
    if (card.dataset.state) {
      selections[card.dataset.name] = card.dataset.state;
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

// Run both functions together
async function init() {
  const allPokemon = await fetchPokemon();
  displayPokemon(allPokemon);
  loadSelections(); 
}

init();
