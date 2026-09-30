console.log("script.js is connected!");

let allPokemon = [];


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

// Run all functions together
async function init() {
  const allPokemon = await fetchPokemon();
  displayPokemon(allPokemon);
  loadSelections(); 
  setupSearch(allPokemon);
  setupSidebars();
  updateLeftSidebar();
}

init();
