/**
 * Calculates all possible Hidden Power types and base powers for given IV ranges,
 * provided as an array of arrays.
 *
 * @param {Array<Array<number>>} ivRangesArray - An array where each element is a
 * two-element array [min_iv, max_iv] for a stat. The order is HP, Atk, Def, SpA, SpD, Spe.
 * Example: [[9, 10], [18, 18], [21, 22], [19, 20], [24, 24], [6, 7]]
 * @returns {Array<object>} - An array of objects, each containing the IV combination,
 * the calculated Hidden Power type, and base power.
 * Example: [{ ivs: { hp: 9, atk: 18, def: 21, spa: 19, spd: 24, spe: 6 }, type: "Bug", power: 65 }, ...]
 */
function calculateHiddenPower(ivRangesArray) {
  const hpTypes = [
    "Fighting",
    "Flying",
    "Poison",
    "Ground",
    "Rock",
    "Bug",
    "Ghost",
    "Steel",
    "Fire",
    "Water",
    "Grass",
    "Electric",
    "Psychic",
    "Ice",
    "Dragon",
    "Dark",
  ];

  const results = [];
  // Define the order of stats corresponding to the input array order
  const statsKeys = ["hp", "atk", "def", "spa", "spd", "spe"];

  if (!Array.isArray(ivRangesArray) || ivRangesArray.length !== 6) {
    console.error(
      "Invalid input format. Expected an array of 6 arrays for HP, Atk, Def, SpA, SpD, Spe."
    );
    return [];
  }

  /**
   * Calculates the Hidden Power type index based on IVs.
   * @param {object} ivs - An object with specific IVs for each stat (keys: hp, atk, def, spa, spd, spe).
   * @returns {number} - The type index (0-15).
   */
  function getHpTypeIndex(ivs) {
    let typeBits = 0;
    if (ivs.hp % 2 !== 0) typeBits |= 0x01;
    if (ivs.atk % 2 !== 0) typeBits |= 0x02;
    if (ivs.def % 2 !== 0) typeBits |= 0x04;
    if (ivs.spe % 2 !== 0) typeBits |= 0x08; // Note: Speed bit is 8
    if (ivs.spa % 2 !== 0) typeBits |= 0x10; // Note: Special Attack bit is 16
    if (ivs.spd % 2 !== 0) typeBits |= 0x20; // Note: Special Defense bit is 32

    return Math.floor((typeBits * 15) / 63);
  }

  /**
   * Calculates the Hidden Power base power based on IVs.
   * @param {object} ivs - An object with specific IVs for each stat (keys: hp, atk, def, spa, spd, spe).
   * @returns {number} - The base power (30-70).
   */
  function getHpPower(ivs) {
    let powerBits = 0;
    if (Math.floor(ivs.hp / 2) % 2 !== 0) powerBits |= 0x01;
    if (Math.floor(ivs.atk / 2) % 2 !== 0) powerBits |= 0x02;
    if (Math.floor(ivs.def / 2) % 2 !== 0) powerBits |= 0x04;
    if (Math.floor(ivs.spe / 2) % 2 !== 0) powerBits |= 0x08; // Note: Speed bit is 8
    if (Math.floor(ivs.spa / 2) % 2 !== 0) powerBits |= 0x10; // Note: Special Attack bit is 16
    if (Math.floor(ivs.spd / 2) % 2 !== 0) powerBits |= 0x20; // Note: Special Defense bit is 32

    return Math.floor((powerBits * 40) / 63) + 30;
  }

  /**
   * Recursively generates all possible IV combinations and calculates Hidden Power.
   * @param {object} currentIVs - The current IV combination being built (using stat names as keys).
   * @param {number} index - The current index in the ivRangesArray and statsKeys.
   */
  function generateCombinations(currentIVs, index) {
    if (index === statsKeys.length) {
      // All IVs for all stats have been selected
      const typeIndex = getHpTypeIndex(currentIVs);
      const power = getHpPower(currentIVs);
      results.push({
        ivs: { ...currentIVs }, // Store a copy of the IVs
        type: hpTypes[typeIndex],
        power: power,
      });
      return;
    }

    const statName = statsKeys[index];
    const range = ivRangesArray[index];
    const minIV = range[0];
    const maxIV = range[1];

    for (let iv = minIV; iv <= maxIV; iv++) {
      currentIVs[statName] = iv;
      generateCombinations(currentIVs, index + 1);
    }
  }

  // Start the recursive process with an empty IV object and the first stat index (0)
  generateCombinations({}, 0);

  return results;
}

// // Example usage with your provided IV ranges in the new array format:
// const myIvRangesArray = [
//   [9, 10], // HP
//   [18, 18], // Attack
//   [21, 22], // Defense
//   [19, 20], // Special Attack
//   [24, 24], // Special Defense
//   [6, 7], // Speed
// ];

// const hiddenPowerPossibilitiesArray =
//   calculateHiddenPowerFromArray(myIvRangesArray);

// console.log("Possible Hidden Power combinations (using array input):");
// hiddenPowerPossibilitiesArray.forEach((result) => {
//   console.log(
//     `IVs: HP ${result.ivs.hp}, Atk ${result.ivs.atk}, Def ${result.ivs.def}, SpA ${result.ivs.spa}, SpD ${result.ivs.spd}, Spe ${result.ivs.spe} -> Type: ${result.type}, Power: ${result.power}`
//   );
// });

// // You can still process the results to get unique Type-Power combinations as before
// const uniqueCombinationsArray = new Map();
// hiddenPowerPossibilitiesArray.forEach((result) => {
//   const key = `${result.type} - ${result.power}`;
//   if (!uniqueCombinationsArray.has(key)) {
//     uniqueCombinationsArray.set(key, []);
//   }
//   uniqueCombinationsArray.get(key).push(result.ivs);
// });

// console.log(
//   "\nUnique Hidden Power Type - Power combinations and the IVs that produce them (using array input):"
// );
// uniqueCombinationsArray.forEach((ivsList, key) => {
//   console.log(`${key}:`);
//   ivsList.forEach((ivs) => {
//     console.log(
//       `  { HP: ${ivs.hp}, Atk: ${ivs.atk}, Def: ${ivs.def}, SpA: ${ivs.spa}, SpD: ${ivs.spd}, Spe: ${ivs.spe} }`
//     );
//   });
// });
