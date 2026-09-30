// selections.js
// Responsible for saving, loading, and managing pokemon selections

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

function loadSelections() {
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

  const saved = JSON.parse(localStorage.getItem("selections") || "{}");

  let faveCount    = 0;
  let dislikeCount = 0;

  Object.entries(saved).forEach(([name, state]) => {
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
      const selections = JSON.parse(localStorage.getItem("selections") || "{}");
      delete selections[name];
      localStorage.setItem("selections", JSON.stringify(selections));

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
