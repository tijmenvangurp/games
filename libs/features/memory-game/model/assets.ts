import type { Pokemon } from "@entities/memory";

const POKEMON_ASSET_ROOT = "/pokemon";

/** Local official artwork. Bundled so the app never calls a third-party host. */
export function pokemonArtworkSrc(pokemon: Pick<Pokemon, "id">): string {
  return `${POKEMON_ASSET_ROOT}/artwork/${pokemon.id}.webp`;
}

/** Local cry, sourced from Pokémon Showdown for consistent browser support. */
export function pokemonCrySrc(pokemon: Pick<Pokemon, "slug">): string {
  return `${POKEMON_ASSET_ROOT}/cries/${pokemon.slug}.mp3`;
}

/** Local animated sprite shown after a successful match. */
export function pokemonAnimatedSrc(pokemon: Pick<Pokemon, "slug">): string {
  return `${POKEMON_ASSET_ROOT}/animated/${pokemon.slug}.gif`;
}
