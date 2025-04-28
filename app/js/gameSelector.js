document.addEventListener("DOMContentLoaded", () => {
  // Mappa dei giochi Pokémon
  const POKEMON_GAMES = {
    "red-blue": "Rosso/Blu (Gen 1)",
    yellow: "Giallo (Gen 1)",
    "gold-silver": "Oro/Argento (Gen 2)",
    crystal: "Cristallo (Gen 2)",
    "ruby-sapphire": "Rubino/Zaffiro (Gen 3)",
    emerald: "Smeraldo (Gen 3)",
    "diamond-pearl": "Diamante/Perla (Gen 4)",
    platinum: "Platino (Gen 4)",
    "black-white": "Bianco/Nero (Gen 5)",
    "black-2-white-2": "Bianco 2/Nero 2 (Gen 5)",
    "x-y": "X/Y (Gen 6)",
    "sun-moon": "Sole/Luna (Gen 7)",
    "ultra-sun-ultra-moon": "Ultrasole/Ultraluna (Gen 7)",
    "sword-shield": "Spada/Scudo (Gen 8)",
    "scarlet-violet": "Scarlatto/Violetto (Gen 9)",
  };

  const selectedGameElement = document.getElementById("selected-game");
  const changeGameBtn = document.getElementById("change-game-btn");
  const gameModal = document.getElementById("game-modal");
  const gameSelector = document.getElementById("game-selector");
  const saveGameBtn = document.getElementById("save-game-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");

  // Popola la select con le opzioni dai giochi Pokémon
  Object.entries(POKEMON_GAMES).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    gameSelector.appendChild(option);
  });

  // Recupera il gioco selezionato dal localStorage
  const savedGame = localStorage.getItem("selectedGame");
  if (savedGame && POKEMON_GAMES[savedGame]) {
    selectedGameElement.textContent = `${POKEMON_GAMES[savedGame]}`;
    gameSelector.value = savedGame;
  }

  // Mostra il modal per cambiare gioco
  changeGameBtn.addEventListener("click", () => {
    gameModal.classList.add("modal-open");
  });

  // Salva il gioco selezionato
  saveGameBtn.addEventListener("click", () => {
    const selectedGame = gameSelector.value;
    if (POKEMON_GAMES[selectedGame]) {
      localStorage.setItem("selectedGame", selectedGame);
      selectedGameElement.textContent = `${POKEMON_GAMES[selectedGame]}`;
      gameModal.classList.remove("modal-open");
    }
  });

  // Chiudi il modal
  closeModalBtn.addEventListener("click", () => {
    gameModal.classList.remove("modal-open");
  });
});
