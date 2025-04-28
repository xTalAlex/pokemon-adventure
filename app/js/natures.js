const natureStorageKey = "pokemonNatureCheckboxes";
const ivFormStorageKey = "pokemonIVFormData";

function saveNatureCheckboxState() {
  const checkboxes = document.querySelectorAll(
    '#natures-list input[type="checkbox"]'
  );
  const state = {};
  checkboxes.forEach((checkbox) => {
    state[checkbox.id] = checkbox.checked;
  });
  localStorage.setItem(natureStorageKey, JSON.stringify(state));
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
  } else {
    console.log("Nessuno stato checkbox Nature salvato trovato.");
  }
}

function saveIVFormData() {
  const formData = {
    name: document.getElementById("pokemon-name").value,
    level: document.getElementById("pokemon-level").value,
    nature: document.getElementById("pokemon-nature").value,
    stats: document.getElementById("pokemon-stats").value,
    evs: document.getElementById("pokemon-evs").value, // Aggiungi le EV
  };
  localStorage.setItem(ivFormStorageKey, JSON.stringify(formData));
}

function loadIVFormData() {
  const savedData = localStorage.getItem(ivFormStorageKey);
  if (savedData) {
    const formData = JSON.parse(savedData);
    document.getElementById("pokemon-name").value = formData.name || "";
    document.getElementById("pokemon-level").value = formData.level || "";
    document.getElementById("pokemon-nature").value = formData.nature || "";
    document.getElementById("pokemon-stats").value = formData.stats || "";
    document.getElementById("pokemon-evs").value = formData.evs || ""; // Carica le EV
  } else {
    console.log("Nessun dato del form IV salvato trovato.");
  }
}

// --- Funzione per calcolare una singola statistica (usata per verificare gli IV) ---
// Modifica la funzione per calcolare una singola statistica includendo le EVs
function calculateSingleStat(base, level, iv, ev, natureMultiplier, isHp) {
  // Calcola il termine base + IV + EV
  const ivEvTerm = Math.floor(0.25 * ev); // Floor(0.25 * EV)
  const baseIvEvTerm = 2 * base + iv + ivEvTerm; // 2 * Base + IV + Floor(0.25 * EV)
  const levelTerm = Math.floor((baseIvEvTerm * level) / 100); // Floor(0.01 * (2 * Base + IV + Floor(0.25 * EV)) * Level)

  if (isHp) {
    // Formula HP: Floor(0.01 * (2 * Base + IV + Floor(0.25 * EV)) * Level) + Level + 10
    return levelTerm + level + 10;
  } else {
    // Formula altre statistiche: Floor(Floor(0.01 * (2 * Base + IV + Floor(0.25 * EV)) * Level) + 5) * Nature_Multiplier
    return Math.floor((levelTerm + 5) * natureMultiplier);
  }
}

async function calculateIV(event) {
  event.preventDefault(); // Previene il ricaricamento della pagina

  const name = document.getElementById("pokemon-name").value.toLowerCase();
  const level = parseInt(document.getElementById("pokemon-level").value, 10);
  const nature = document.getElementById("pokemon-nature").value.toLowerCase();
  const stats = document
    .getElementById("pokemon-stats")
    .value.split(",")
    .map((stat) => parseInt(stat.trim(), 10));

  // Controlla se l'input delle EV è vuoto e assegna un array di zeri se necessario
  const evInput = document.getElementById("pokemon-evs").value.trim();
  const evs = evInput
    ? evInput.split(",").map((ev) => parseInt(ev.trim(), 10))
    : [0, 0, 0, 0, 0, 0];

  if (stats.length !== 6 || evs.length !== 6) {
    alert(
      "Inserisci tutte e sei le statistiche (HP, Att, Dif, SpA, SpD, Vel) e le EVs separate da virgole."
    );
    return;
  }
  if (level <= 0 || level > 100) {
    alert("Inserisci un livello valido (1-100).");
    return;
  }
  if (stats.some(isNaN) || evs.some(isNaN)) {
    alert("Assicurati che tutte le statistiche e le EVs siano numeri validi.");
    return;
  }

  try {
    // Ottieni i dati del Pokémon da PokeAPI
    const pokemonResponse = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${name}`
    );
    if (!pokemonResponse.ok) throw new Error("Pokémon non trovato.");
    const pokemonData = await pokemonResponse.json();

    // Ottieni i moltiplicatori della natura
    const natureResponse = await fetch(
      `https://pokeapi.co/api/v2/nature/${nature}`
    );
    if (!natureResponse.ok) throw new Error("Natura non trovata.");
    const natureData = await natureResponse.json();

    const baseStats = pokemonData.stats.map((stat) => stat.base_stat);
    const statNames = ["HP", "Attacco", "Difesa", "SpA", "SpD", "Velocità"];
    const ivRanges = [];

    // Calcola il range di IV per ogni statistica
    for (let i = 0; i < 6; i++) {
      const baseStat = baseStats[i];
      const actualStat = stats[i]; // La statistica inserita dall'utente
      const ev = evs[i]; // Le EVs inserite dall'utente
      const isHp = i === 0;
      const natureMultiplier = isHp
        ? 1
        : natureData.increased_stat?.name === pokemonData.stats[i].stat.name
        ? 1.1
        : natureData.decreased_stat?.name === pokemonData.stats[i].stat.name
        ? 0.9
        : 1;

      let minIV = 32; // Inizializza a un valore non possibile
      let maxIV = -1; // Inizializza a un valore non possibile

      // Itera su tutti i possibili valori di IV da 0 a 31
      for (let iv = 0; iv <= 31; iv++) {
        const calculatedStat = calculateSingleStat(
          baseStat,
          level,
          iv,
          ev,
          natureMultiplier,
          isHp
        );

        if (calculatedStat === actualStat) {
          // Se la statistica calcolata con questo IV corrisponde a quella inserita,
          // allora questo IV è un valore possibile.
          if (minIV > 31) {
            // Se è il primo IV che corrisponde
            minIV = iv;
          }
          maxIV = iv; // Aggiorna sempre il massimo IV trovato finora
        }
      }

      // Dopo aver controllato tutti gli IV da 0 a 31
      if (minIV > 31 || maxIV < 0) {
        ivRanges.push({ statName: statNames[i], min: -1, max: -1 });
      } else {
        ivRanges.push({ statName: statNames[i], min: minIV, max: maxIV });
      }
    }

    // Mostra i risultati
    const resultsDiv = document.getElementById("iv-results");
    let resultsHTML = "<h3>Risultati IV</h3>";
    ivRanges.forEach((range, index) => {
      if (range.min === -1) {
        const base = pokemonData.stats[index]?.base_stat || "undefined";
        const actual = stats[index] || "undefined";
        const ev = evs[index] || 0;

        resultsHTML += `<p class="text-error">${
          range.statName
        } IV: Impossibile ottenere stat ${actual} (Base ${base}) con EV=${ev} a Livello ${level}. Range possibile con EV=${ev}: ${calculateSingleStat(
          base,
          level,
          0,
          ev,
          range.statName === "HP"
            ? 1
            : natureData.increased_stat?.name ===
              pokemonData.stats[index]?.stat.name
            ? 1.1
            : natureData.decreased_stat?.name ===
              pokemonData.stats[index]?.stat.name
            ? 0.9
            : 1,
          range.statName === "HP"
        )} - ${calculateSingleStat(
          base,
          level,
          31,
          ev,
          range.statName === "HP"
            ? 1
            : natureData.increased_stat?.name ===
              pokemonData.stats[index]?.stat.name
            ? 1.1
            : natureData.decreased_stat?.name ===
              pokemonData.stats[index]?.stat.name
            ? 0.9
            : 1,
          range.statName === "HP"
        )}</p>`;
      } else {
        resultsHTML += `<p>${range.statName} IV: ${range.min} - ${range.max}</p>`;
      }
    });

    resultsDiv.innerHTML = resultsHTML;

    const ivRangesArray = ivRanges.map((range) => [range.min, range.max]);
    const hiddenPowerPossibilitiesArray = calculateHiddenPower(ivRangesArray);
    const sortedAndGroupedHiddenPowerPossibilities = sortAndGroupByType(
      hiddenPowerPossibilitiesArray
    );

    const uniqueCombinationsArray = new Map();
    hiddenPowerPossibilitiesArray.forEach((result) => {
      const key = `${result.type} - ${result.power}`;
      if (!uniqueCombinationsArray.has(key)) {
        uniqueCombinationsArray.set(key, []);
      }
      uniqueCombinationsArray.get(key).push(result.ivs);
    });

    Object.entries(sortedAndGroupedHiddenPowerPossibilities).forEach(
      async ([type, group]) => {
        const typeResponse = await fetch(
          `https://pokeapi.co/api/v2/type/${type.toLowerCase()}/`
        );
        if (!typeResponse.ok)
          throw new Error(`Impossibile ottenere i dati per il tipo ${type}.`);
        const typeData = await typeResponse.json();
        const typeIcon =
          typeData.sprites["generation-iii"]["emerald"]["name_icon"] ?? "";

        const sectionHTML = `
            <tr>
              <td colspan="3" class="type-header">
                <img src="${typeIcon}" alt="${type}" class="type-icon" onerror="this.style.display='none';">
              </td>
            </tr>
            `;

        // Aggiungi la sezione alla tabella
        document
          .getElementById("hidden-power-table-body")
          .insertAdjacentHTML("beforeend", sectionHTML);

        // Aggiungi le righe per ogni combinazione di potenza
        group.forEach((entry) => {
          const ivsDescriptions = `{ HP: ${entry.ivs.hp}, Atk: ${entry.ivs.atk}, Def: ${entry.ivs.def}, SpA: ${entry.ivs.spa}, SpD: ${entry.ivs.spd}, Spe: ${entry.ivs.spe} }`;

          const rowHTML = `
        <tr>
        <td class="sr-only">${type}</td>
        <td>${entry.power}</td>
        <td>${ivsDescriptions}</td>
        </tr>
      `;

          document
            .getElementById("hidden-power-table-body")
            .insertAdjacentHTML("beforeend", rowHTML);
        });
      }
    );

    // Rendi visibile la sezione Hidden Power Results
    const hiddenPowerResultsDiv = document.getElementById(
      "hidden-power-results"
    );
    hiddenPowerResultsDiv.classList.remove("hidden");
  } catch (error) {
    console.error("Errore:", error);
    const resultsDiv = document.getElementById("iv-results");
    resultsDiv.innerHTML = `<p style="color: red;">Si è verificato un errore: ${error.message}. Assicurati che il nome del Pokémon e la natura siano corretti.</p>`;
  } finally {
    saveIVFormData();
  }
}

// --- Inizializzazione all'avvio ---
document.addEventListener("DOMContentLoaded", () => {
  // Carica lo stato delle checkbox delle nature (se rilevante per altre parti del tuo HTML non mostrate)
  loadNatureCheckboxState();
  // Carica i dati del form IV
  loadIVFormData();

  // Aggiungi listener per salvare lo stato delle nature al cambio (se rilevante)
  const natureCheckboxes = document.querySelectorAll(
    '#natures-list input[type="checkbox"]'
  );
  natureCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", saveNatureCheckboxState);
  });

  // Aggiungi listener per salvare i dati del form IV al cambio
  const ivForm = document.getElementById("iv-form");
  // Usiamo 'input' per salvare a ogni modifica, non solo submit
  ivForm.addEventListener("input", saveIVFormData);

  // Aggiungi listener per il submit del form
  ivForm.addEventListener("submit", calculateIV);
});
