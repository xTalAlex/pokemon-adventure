// --- Nuovo Script per la Lista Pokémon ---
const pokemonStorageKey = "pokemonTeam";
const pokemonListElement = document.getElementById("pokemon-list");
const pokemonNameInput = document.getElementById("pokemon-name-input");
const addPokemonBtn = document.getElementById("add-pokemon-btn");

// Funzione per salvare la lista Pokémon nel localStorage
function savePokemonTeam(team) {
  localStorage.setItem(pokemonStorageKey, JSON.stringify(team));
}

// Funzione per caricare la lista Pokémon dal localStorage
async function loadPokemonTeam() {
  const savedTeam = localStorage.getItem(pokemonStorageKey);
  if (savedTeam) {
    const team = JSON.parse(savedTeam);

    for (const pokemonData of team) {
      // Controlla se i dati sono completi (ad esempio, se mancano le base stats o le immagini)
      if (
        !pokemonData.base_stats ||
        !pokemonData.front_sprite ||
        !pokemonData.back_sprite
      ) {
        const updatedData = await getPokemonData(pokemonData.name);
        if (updatedData) {
          Object.assign(pokemonData, updatedData); // Aggiorna i dati mancanti
        }
      }
      addPokemonToList(pokemonData); // Aggiunge ogni Pokémon (aggiornato o meno) alla UI
    }
    return team;
  }
  console.log("Nessuna squadra Pokémon salvata trovata.");
  return []; // Ritorna un array vuoto se non ci sono dati salvati
}

// Funzione per ottenere i dati Pokémon dalla PokeAPI (include ora l'artwork ufficiale)
async function getPokemonData(name) {
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`
    );
    if (!response.ok) {
      throw new Error(`Pokémon "${name}" non trovato.`);
    }
    const data = await response.json();

    // Ottieni i tipi con le icone
    const types = await Promise.all(
      data.types.map(async (typeInfo) => {
        const typeResponse = await fetch(typeInfo.type.url);
        const typeData = await typeResponse.json();
        return {
          name: typeInfo.type.name,
          icon: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-iii/emerald/${typeData.id}.png`, // URL dell'icona basato sull'ID del tipo
        };
      })
    );

    const selectedGame = localStorage.getItem("selectedGame") || ""; // Preleva il valore salvato o usa "emerald" come default

    return {
      name: data.name.charAt(0).toUpperCase() + data.name.slice(1), // Capitalizza il nome
      id: data.id,
      front_sprite: data.sprites.front_default,
      back_sprite: data.sprites.back_default,
      shiny_sprite: data.sprites.front_shiny,
      official_artwork:
        data.sprites.other && data.sprites.other["official-artwork"]
          ? data.sprites.other["official-artwork"].front_default
          : null,
      dream_world_artwork:
        data.sprites.other && data.sprites.other["dream_world"]
          ? data.sprites.other["dream_world"].front_default
          : null,
      base_stats: data.stats.map((stat) => ({
        name: stat.stat.name,
        value: stat.base_stat,
      })), // Ottieni le statistiche base
      abilities: data.abilities.map((ability) => ability.ability.name), // Ottieni le abilità
      types, // Aggiungi i tipi con le icone
      cry: `https://play.pokemonshowdown.com/audio/cries/${data.name.toLowerCase()}.ogg`, // URL del verso
      levelUpMoves: data.moves
        .filter((move) =>
          move.version_group_details.some(
            (detail) =>
              detail.move_learn_method.name === "level-up" &&
              detail.version_group.name.includes(selectedGame) // Usa il valore salvato da gameSelector
          )
        )
        .map((move) => ({
          name: move.move.name,
          level: move.version_group_details.find(
            (detail) =>
              detail.move_learn_method.name === "level-up" &&
              detail.version_group.name.includes(selectedGame)
          ).level_learned_at,
        }))
        .sort((a, b) => a.level - b.level), // Ordina per livello
    };
  } catch (error) {
    console.error("Errore nel recupero dati Pokémon:", error);
    alert(`Errore: ${error.message}`);
    return null;
  }
}

// Funzione per aggiungere un Pokémon alla lista UI
function addPokemonToList(pokemonData) {
  const listItem = document.createElement("div");
  listItem.classList.add(
    "collapse",
    "collapse-arrow",
    "border",
    "border-base-300",
    "bg-base-100",
    "rounded-box"
  );
  listItem.setAttribute("tabindex", "0");
  listItem.dataset.pokemonId = pokemonData.id;
  listItem.dataset.pokemonCry = pokemonData.cry; // Salva l'URL del verso
  listItem.pokemonData = pokemonData;

  const initialTitleSprite = pokemonData.back_sprite || "";
  const expandedContentImage =
    pokemonData.dream_world_artwork ||
    pokemonData.official_artwork ||
    pokemonData.front_sprite ||
    null;

  // Genera HTML per le base stats
  const baseStatsHTML = pokemonData.base_stats
    ? pokemonData.base_stats
        .map(
          (stat) => `
          <div class="flex items-center gap-2">
            <span class="w-24 capitalize font-medium">${stat.name}:</span>
            <progress class="progress progress-primary w-full" value="${stat.value}" max="255"></progress>
            <span class="ml-2">${stat.value}</span>
          </div>
        `
        )
        .join("")
    : "<p>Statistiche non disponibili.</p>";

  // Genera HTML per le abilità
  const abilitiesHTML = pokemonData.abilities
    .map(
      (ability) => `
      <span class="badge badge-outline capitalize">${ability}</span>
    `
    )
    .join("");

  // Genera HTML per i tipi con icone
  const typesHTML = pokemonData.types
    .map(
      (type) => `
      <div class="flex items-center gap-2">
        <img src="${type.icon}" alt="${type.name}" class="w-6 h-6">
        <span class="capitalize">${type.name}</span>
      </div>
    `
    )
    .join("");

  const movesHTML =
    Array.isArray(pokemonData.levelUpMoves) && pokemonData.levelUpMoves.length
      ? pokemonData.levelUpMoves
          .map(
            (move) => `
        <div class="flex justify-between">
          <span class="capitalize">${move.name.replace("-", " ")}</span>
          <span>Lv. ${move.level}</span>
        </div>
      `
          )
          .join("")
      : "<p>Nessuna mossa disponibile.</p>";

  listItem.innerHTML = `
<div class="collapse-title text-xl font-medium flex items-center justify-between">
  <div class="flex items-center">
    ${
      initialTitleSprite
        ? `<img src="${initialTitleSprite}" alt="${pokemonData.name} sprite" class="pokemon-sprite mr-2 pokemon-title-sprite">`
        : ""
    }
    <span>${pokemonData.name} (#${pokemonData.id})</span>
  </div>
  <button class="btn btn-sm btn-error remove-pokemon-btn" onclick="handleRemovePokemon(event)">Rimuovi</button>
</div>
<div class="collapse-content flex flex-col justify-center gap-4 p-4">
  <div class="flex items-center justify-center gap-4">
    ${
      expandedContentImage
        ? `<img src="${expandedContentImage}" alt="${
            pokemonData.name
          } image" class="${
            pokemonData.official_artwork ? "pokemon-artwork" : "pokemon-sprite"
          }">`
        : "<p>Immagine non disponibile.</p>"
    }
    ${
      pokemonData.shiny_sprite
        ? `<img src="${pokemonData.shiny_sprite}" alt="${pokemonData.name} shiny sprite" class="pokemon-sprite">`
        : "<p>Shiny sprite non disponibile.</p>"
    }
  </div>
  <div class="types-container mt-4">
    <h3 class="text-lg font-semibold mb-2">Tipi</h3>
    <div class="flex flex-col gap-2">
      ${typesHTML}
    </div>
  </div>
  <div class="abilities-container mt-4">
    <h3 class="text-lg font-semibold mb-2">Abilità</h3>
    <div class="flex flex-wrap gap-2">
      ${abilitiesHTML}
    </div>
  </div>
  <div class="stats-container mt-4">
    <h3 class="text-lg font-semibold mb-2">Statistiche Base</h3>
    <div class="flex flex-col gap-2">
      ${baseStatsHTML}
    </div>
  </div>
  <div class="moves-container mt-4">
    <h3 class="text-lg font-semibold mb-2">Mosse</h3>
    <div class="flex flex-col gap-2">
      ${movesHTML}
    </div>
  </div>
</div>
`;

  pokemonListElement.appendChild(listItem);

  // Evita che il collapse si chiuda quando si clicca su elementi interni
  listItem.querySelectorAll("button, img").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });
}

// Funzione per rimuovere un Pokémon dalla lista UI e dal localStorage
function removePokemon(pokemonId) {
  // Rimuovi l'elemento dalla UI
  const itemToRemove = pokemonListElement.querySelector(
    `[data-pokemon-id="${pokemonId}"]`
  );
  if (itemToRemove) {
    pokemonListElement.removeChild(itemToRemove);

    // Rimuovi il Pokémon dal team salvato nel localStorage
    let currentTeam = JSON.parse(
      localStorage.getItem(pokemonStorageKey) || "[]"
    );
    currentTeam = currentTeam.filter((p) => p.id !== parseInt(pokemonId)); // Filtra per ID
    savePokemonTeam(currentTeam);
  }
}

// Gestore evento per l'aggiunta Pokémon
async function handleAddPokemon() {
  const pokemonName = pokemonNameInput.value.trim();
  if (pokemonName === "") {
    alert("Per favore, inserisci il nome di un Pokémon.");
    return;
  }

  const currentTeam = JSON.parse(
    localStorage.getItem(pokemonStorageKey) || "[]"
  );

  const pokemonData = await getPokemonData(pokemonName);

  if (pokemonData) {
    // Controlla se il Pokémon è già nella lista (basato sull'ID ottenuto dall'API)
    if (currentTeam.some((p) => p.id === pokemonData.id)) {
      alert(`"${pokemonData.name}" è già nella tua squadra.`);
      pokemonNameInput.value = "";
      return;
    }

    addPokemonToList(pokemonData);

    // Aggiorna il team salvato nel localStorage
    currentTeam.push(pokemonData);
    savePokemonTeam(currentTeam);

    pokemonNameInput.value = ""; // Pulisci l'input
  }
}

// Listener per gestire il cambio di sprite manipolando l'URL e la rimozione
pokemonListElement.addEventListener("click", function (event) {
  // Se il click non era sul bottone di rimozione, controlla se era nel titolo
  const collapseTitle = event.target.closest(".collapse");
  if (collapseTitle) {
    const listItem = collapseTitle.closest(".collapse");
    if (listItem) {
      // Assicurati che l'elemento del collasso esista
      const titleSpriteImg = listItem.querySelector(".pokemon-title-sprite");

      if (titleSpriteImg) {
        const pokemonData = listItem.pokemonData; // Recupera i dati del Pokémon
        // Cambia lo sprite al front quando espanso
        titleSpriteImg.src = pokemonData.front_sprite || "";
        titleSpriteImg.alt = `${pokemonData.name} front sprite`;
      }
    }
  }

  const collapseItem = event.target.closest(".collapse");
  if (collapseItem) {
    // Controlla se l'elemento è stato espanso
    const isExpanded = collapseItem.getAttribute("tabindex") === "0";
    if (isExpanded) {
      const cryUrl = collapseItem.dataset.pokemonCry;
      if (cryUrl) {
        const audio = new Audio(cryUrl);
        audio.play();
      }
    }
  }
});

// Funzione handler per la rimozione di un Pokémon
function handleRemovePokemon(event) {
  const collapseElement = event.target.closest(".collapse");
  if (collapseElement && collapseElement.pokemonData) {
    const pokemonData = collapseElement.pokemonData;
    const confirmRemoval = confirm(
      `Sei sicuro di voler rimuovere ${pokemonData.name} dalla tua squadra?`
    );
    if (confirmRemoval) {
      removePokemon(pokemonData.id);
    }
  }
}

// Cambia sprite degli elementi collassati
document.addEventListener("click", function (event) {
  const expandedItems = document.querySelectorAll(".collapse[tabindex='0']");
  expandedItems.forEach((listItem) => {
    // Se l'elemento è espanso e il click è esterno, aggiorna lo sprite
    if (!listItem.contains(event.target)) {
      const titleSpriteImg = listItem.querySelector(".pokemon-title-sprite");

      if (titleSpriteImg) {
        const pokemonData = listItem.pokemonData;
        // Cambia lo sprite al back quando collassato
        titleSpriteImg.src = pokemonData.back_sprite || "";
        titleSpriteImg.alt = `${pokemonData.name} back sprite`;
      }
    }
  });
});

// --- Inizializzazione all'avvio ---
document.addEventListener("DOMContentLoaded", (event) => {
  // Carica la squadra Pokémon salvata
  loadPokemonTeam();

  // Aggiungi listener al bottone per aggiungere Pokémon
  addPokemonBtn.addEventListener("click", handleAddPokemon);

  // Permetti di aggiungere Pokémon premendo Invio nell'input field
  pokemonNameInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Evita il submit del form (se presente)
      handleAddPokemon();
    }
  });

  // Il listener per la rimozione e il cambio sprite è gestito dalla delegazione eventi su pokemonListElement più in alto.
});
