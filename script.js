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
