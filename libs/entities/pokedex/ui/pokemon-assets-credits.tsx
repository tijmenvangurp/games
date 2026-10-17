export function PokemonAssetsCredits() {
  return (
    <details className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
      <summary className="cursor-pointer font-semibold">Bronnen en credits</summary>
      <p className="mt-2">
        Pokémon © Nintendo, Creatures en GAME FREAK. Fanproject zonder officiële band. Assets:{" "}
        <a
          className="font-semibold underline"
          href="https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon/other/official-artwork"
          rel="noreferrer"
          target="_blank"
        >
          PokeAPI artwork
        </a>
        ,{" "}
        <a
          className="font-semibold underline"
          href="https://play.pokemonshowdown.com/audio/cries/"
          rel="noreferrer"
          target="_blank"
        >
          Showdown-audio
        </a>{" "}
        en{" "}
        <a
          className="font-semibold underline"
          href="https://play.pokemonshowdown.com/sprites/ani/"
          rel="noreferrer"
          target="_blank"
        >
          Showdown-sprites
        </a>
        .
      </p>
    </details>
  );
}
