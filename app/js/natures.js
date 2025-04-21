const natureStorageKey = "pokemonNatureCheckboxes";

function saveNatureCheckboxState() {
  const checkboxes = document.querySelectorAll(
    '#natures-list input[type="checkbox"]'
  );
  const state = {};
  checkboxes.forEach((checkbox) => {
    state[checkbox.id] = checkbox.checked;
  });
  localStorage.setItem(natureStorageKey, JSON.stringify(state));
  console.log("Stato checkbox Nature salvato.");
}

function loadNatureCheckboxState() {
  const savedState = localStorage.getItem(natureStorageKey);
  if (savedState) {
    const state = JSON.parse(savedState);
    const checkboxes = document.querySelectorAll(
      '#natures-list input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
      if (state.hasOwnProperty(checkbox.id)) {
        checkbox.checked = state[checkbox.id];
      }
    });
    console.log("Stato checkbox Nature caricato.");
  } else {
    console.log("Nessuno stato checkbox Nature salvato trovato.");
  }
}

// --- Inizializzazione all'avvio ---
document.addEventListener("DOMContentLoaded", (event) => {
  // Carica lo stato delle checkbox delle nature
  loadNatureCheckboxState();
  // Aggiungi listener per salvare lo stato delle nature al cambio
  const natureCheckboxes = document.querySelectorAll(
    '#natures-list input[type="checkbox"]'
  );
  natureCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", saveNatureCheckboxState);
  });
});
