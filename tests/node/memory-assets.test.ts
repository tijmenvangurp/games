import { describe, expect, it } from "vitest";
import {
  getPokemon,
  pokemonAnimatedSrc,
  pokemonArtworkSrc,
  pokemonCrySrc,
} from "@entities/pokedex";

describe("local pokémon assets", () => {
  it("builds paths without contacting a third-party host", () => {
    const pikachu = getPokemon(25);
    if (!pikachu) {
      throw new Error("Pikachu is missing");
    }

    expect(pokemonArtworkSrc(pikachu)).toBe("/pokemon/artwork/25.webp");
    expect(pokemonCrySrc(pikachu)).toBe("/pokemon/cries/pikachu.mp3");
    expect(pokemonAnimatedSrc(pikachu)).toBe("/pokemon/animated/pikachu.gif");
    expect(pokemonArtworkSrc(pikachu).startsWith("http")).toBe(false);
    expect(pokemonCrySrc(pikachu).startsWith("http")).toBe(false);
    expect(pokemonAnimatedSrc(pikachu).startsWith("http")).toBe(false);
  });
});
