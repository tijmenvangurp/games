import { useTexts } from "@shared/i18n";
import { pokedexTexts } from "./texts";

export function PokemonAssetsCredits() {
  const t = useTexts(pokedexTexts);

  return (
    <details className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
      <summary className="cursor-pointer font-semibold">{t.creditsSummary}</summary>
      <p className="mt-2">
        {t.creditsIntro}{" "}
        <a
          className="font-semibold underline"
          href="https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon/other/official-artwork"
          rel="noreferrer"
          target="_blank"
        >
          PokeAPI artwork
        </a>{" "}
        {t.and}{" "}
        <a
          className="font-semibold underline"
          href="https://play.pokemonshowdown.com/sprites/ani/"
          rel="noreferrer"
          target="_blank"
        >
          {t.showdown}
        </a>
        .
      </p>
    </details>
  );
}
