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

function saveIVFormData() {
  const formData = {
    name: document.getElementById("pokemon-name").value,
    level: document.getElementById("pokemon-level").value,
    nature: document.getElementById("pokemon-nature").value,
    stats: document.getElementById("pokemon-stats").value,
  };
  localStorage.setItem(ivFormStorageKey, JSON.stringify(formData));
  console.log("Dati del form IV salvati.");
}

function loadIVFormData() {
  const savedData = localStorage.getItem(ivFormStorageKey);
  if (savedData) {
    const formData = JSON.parse(savedData);
    document.getElementById("pokemon-name").value = formData.name || "";
    document.getElementById("pokemon-level").value = formData.level || "";
    document.getElementById("pokemon-nature").value = formData.nature || "";
    document.getElementById("pokemon-stats").value = formData.stats || "";
    console.log("Dati del form IV caricati.");
  } else {
    console.log("Nessun dato del form IV salvato trovato.");
  }
}

// --- Funzione per calcolare una singola statistica (usata per verificare gli IV) ---
// Assume 0 EV per il calcolo del range IV
function calculateSingleStat(base, level, iv, natureMultiplier, isHp) {
  const ev = 0; // Assumiamo 0 EV per il calcolo del range IV
  const ivEvTerm = Math.floor(0.25 * ev);
  const baseIvEvTerm = 2 * base + iv + ivEvTerm;
  const levelTerm = Math.floor((baseIvEvTerm * level) / 100);

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

  if (stats.length !== 6) {
    alert(
      "Inserisci tutte e sei le statistiche (HP, Att, Dif, SpA, SpD, Vel) separate da virgole."
    );
    return;
  }
  if (level <= 0 || level > 100) {
    alert("Inserisci un livello valido (1-100).");
    return;
  }
  if (stats.some(isNaN)) {
    alert("Assicurati che tutte le statistiche siano numeri validi.");
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
        // Nessun IV tra 0 e 31 con EV=0 ha prodotto la statistica inserita.
        // Questo potrebbe significare che l'utente ha inserito una statistica errata,
        // o che il Pokémon ha EV, o che il livello è sbagliato.
        ivRanges.push({
          statName: statNames[i],
          min: -1,
          max: -1,
          actual: actualStat,
          base: baseStat,
        }); // Segnaliamo l'impossibilità
      } else {
        // Trovato almeno un IV che produce la statistica, il range è da minIV a maxIV.
        ivRanges.push({ statName: statNames[i], min: minIV, max: maxIV });
      }
    }

    // Mostra i risultati
    const resultsDiv = document.getElementById("iv-results");
    let resultsHTML = "<h3>Risultati IV</h3>";
    ivRanges.forEach((range) => {
      if (range.min === -1) {
        resultsHTML += `<p>${range.statName} IV: Impossibile ottenere stat ${
          range.actual
        } (Base ${
          range.base
        }) con EV=0 a Livello ${level}. Range possibile con EV=0: ${calculateSingleStat(
          range.base,
          level,
          0,
          range.statName === "HP"
            ? 1
            : natureData.increased_stat?.name ===
              pokemonData.stats[ivRanges.indexOf(range)].stat.name
            ? 1.1
            : natureData.decreased_stat?.name ===
              pokemonData.stats[ivRanges.indexOf(range)].stat.name
            ? 0.9
            : 1,
          range.statName === "HP"
        )} - ${calculateSingleStat(
          range.base,
          level,
          31,
          range.statName === "HP"
            ? 1
            : natureData.increased_stat?.name ===
              pokemonData.stats[ivRanges.indexOf(range)].stat.name
            ? 1.1
            : natureData.decreased_stat?.name ===
              pokemonData.stats[ivRanges.indexOf(range)].stat.name
            ? 0.9
            : 1,
          range.statName === "HP"
        )}</p>`;
      } else {
        resultsHTML += `<p>${range.statName} IV: ${range.min} - ${range.max}</p>`;
      }
    });

    resultsDiv.innerHTML = resultsHTML;
  } catch (error) {
    console.error("Errore:", error);
    const resultsDiv = document.getElementById("iv-results");
    resultsDiv.innerHTML = `<p style="color: red;">Si è verificato un errore: ${error.message}. Assicurati che il nome del Pokémon e la natura siano corretti.</p>`;
    //alert(`Si è verificato un errore durante il calcolo degli IV: ${error.message}.`);
  } finally {
    // Salva i dati del form dopo il tentativo di calcolo
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
