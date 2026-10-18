/**
 * Groups of Generation 1 Pokémon whose silhouettes look alike.
 *
 * The harder quiz levels pick their wrong answers from the target's group
 * instead of the whole Pokédex, so every name stays plausible. Each Pokémon
 * belongs to exactly one group and every group has at least five members, so
 * there are always enough names for four distractors.
 */
export const POKEMON_LOOKALIKE_GROUPS: readonly (readonly number[])[] = [
  // Bulbasaur, Oddish, Bellsprout, Exeggcute and Tangela: round or leafy plants.
  [1, 2, 3, 43, 44, 45, 69, 70, 71, 102, 103, 114],
  // Charmander, Vulpix, Growlithe, Ponyta and Magmar: fire creatures.
  [4, 5, 6, 37, 38, 58, 59, 77, 78, 126],
  // Squirtle, Poliwag, Tentacool, Slowpoke, Horsea and Lapras: water bodies.
  [7, 8, 9, 60, 61, 62, 72, 73, 79, 80, 116, 117, 131],
  // Caterpie, Weedle, Paras, Venonat, Scyther and Pinsir: insects.
  [10, 11, 12, 13, 14, 15, 46, 47, 48, 49, 123, 127],
  // Pidgey, Spearow, Farfetch'd, Doduo, Aerodactyl and the legendary birds.
  [16, 17, 18, 21, 22, 83, 84, 85, 142, 144, 145, 146],
  // Rattata, Pikachu, Sandshrew, Meowth, Tauros and Eevee: small mammals.
  [19, 20, 25, 26, 27, 28, 52, 53, 128, 133, 134, 135, 136],
  // Ekans, Diglett, Geodude, Onix, Cubone and Rhyhorn: ground and rock.
  [23, 24, 50, 51, 74, 75, 76, 95, 104, 105, 111, 112],
  // Clefairy, Jigglypuff, Lickitung, Chansey, Snorlax and Ditto: round and pink.
  [35, 36, 39, 40, 108, 113, 143, 132],
  // Abra, Drowzee, Mr. Mime, Jynx, Mewtwo and Mew: psychic humanoids.
  [63, 64, 65, 96, 97, 122, 124, 150, 151],
  // Mankey, Machop, Hitmonlee, Hitmonchan, Kangaskhan and Electabuzz.
  [56, 57, 66, 67, 68, 106, 107, 115, 125],
  // Psyduck, Seel, Shellder, Krabby, Goldeen, Staryu and the fossils.
  [54, 55, 86, 87, 90, 91, 98, 99, 118, 119, 120, 121, 138, 139, 140, 141],
  // Magnemite, Voltorb and Porygon: geometric and electric.
  [81, 82, 100, 101, 137],
  // The two Nidoran lines look almost identical.
  [29, 30, 31, 32, 33, 34],
  // Zubat, Grimer, Gastly and Koffing: spooky and amorphous.
  [41, 42, 88, 89, 92, 93, 94, 109, 110],
  // Magikarp, Gyarados and the Dratini line: long, snake-like dragons.
  [129, 130, 147, 148, 149],
];

const LOOKALIKES_BY_ID = new Map<number, readonly number[]>(
  POKEMON_LOOKALIKE_GROUPS.flatMap((group) => group.map((id) => [id, group] as const)),
);

/** Returns the lookalike group for a Pokémon, or an empty list when unknown. */
export function lookalikeIdsFor(pokemonId: number): readonly number[] {
  return LOOKALIKES_BY_ID.get(pokemonId) ?? [];
}
