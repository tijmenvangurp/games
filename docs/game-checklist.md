# Checklist: een spel toevoegen of uitbreiden

Deze checklist volgt de route die de bestaande spellen gebruiken. Wijk je af,
leg dan in de pull request uit waarom.

## 1. Bepaal de lagen

| Laag                   | Wat je er neerzet                                              |
| ---------------------- | -------------------------------------------------------------- |
| `libs/entities/<spel>` | Pure regels, types en data. Geen React, geen opslag.           |
| `libs/features/<spel>` | Zustand-store, opslag, speech en de UI van de feature.         |
| `libs/pages/<spel>`    | Het scherm dat de feature samenstelt.                          |
| `libs/shared/ui`       | Alleen als een component door meerdere spellen wordt gebruikt. |

Een laag mag alleen van lager gelegen lagen importeren. Zie
`docs/architecture.md` en ADR 0004.

## 2. Voeg de Nx-projecten toe

Elke slice heeft een eigen `project.json`, `tsconfig.json` en `index.ts`.
Controleer daarna:

- de alias in `tsconfig.base.json`;
- de alias in `tools/aliases.ts`;
- de zone in `.fallowrc.json`;
- de Nx-tags (`layer:*`, `scope:*`, `type:*`);
- `corepack pnpm run graph` en `corepack pnpm run fsd`.

## 3. Sluit het spel aan op de app

- Voeg de route toe in `apps/games/src/app/router.tsx`.
- Voeg het spel toe aan `gameCatalog` in
  `libs/entities/game/model/game-catalog.ts`.
- Werk het `to`-union in `GameCatalogEntry` bij.
- Voeg een icoon toe in `libs/shared/ui/game-icon.tsx`.
- Maak een thumbnail van 800 × 500 JPEG met een contenthash in de naam en zet
  hem in `apps/games/public/thumbnails/`.
- Kies een `speech`-verklaring: `group`, `visual`, `pending` of `legacy`.

## 4. Spraak en audio

- Zet de spraakregels in `libs/features/<spel>/model/audio.ts` (of in de
  entities als de regels daar horen).
- Exporteer `speechGroups` en de regels via de public API van de slice.
- Gebruik `SpeechLine` uit `@shared/lib`; de catalogus vindt de groepen zelf.
- Draai:

  ```sh
  corepack pnpm run audio:check
  ```

- De test `tests/node/speech-coverage.test.ts` faalt als een `available`-spel
  geen geldige spraakverklaring heeft of als een audiogroep nergens bij hoort.
- Audio is lokaal en vooraf gegenereerd. Geen runtime-TTS. De privé-TTS-helper
  is alleen voor de eigenaar; zie `docs/agent-harness.md` en `docs/audio.md`.

## 5. Tests

| Soort       | Locatie                     | Wat                                                 |
| ----------- | --------------------------- | --------------------------------------------------- |
| Pure regels | `tests/node/<spel>.test.ts` | Generators, wincondities, niveaus, adaptief model.  |
| UI en store | `tests/web/<spel>.test.tsx` | Interactie, routes, localStorage, feedback.         |
| E2E         | `e2e/<spel>.spec.ts`        | De belangrijkste gebruikersreis op een echt scherm. |

Dekking is minimaal 80% op branches, functions, lines en statements. Zie
`docs/testing.md` voor de details.

## 6. Leg de beslissing vast

Een nieuw spel of een nieuwe mechanic krijgt een ADR in `docs/adr/`, met:

- status en datum;
- context en alternatieven;
- de beslissing;
- gevolgen voor assets, privacy, CSP, opslag en tests;
- bronnen en licenties van nieuwe assets.

Werk daarna `docs/README.md` en `docs/adr/README.md` bij. Gebruik
`spellen-adr`.

## 7. Controleer op een toestel

- 390 px: geen horizontale overflow, alles leesbaar, touch-targets ≥ 44 px.
- 1024 px: de compositie blijft kloppen.
- Safe areas: `pt-safe`/`pb-safe` waar nodig.
- Toetsenbord en schermlezer: knoppen hebben een naam en focus is zichtbaar.
- `prefers-reduced-motion`: beweging is optional.
- Geen hover-only interactie.

## 8. De kwaliteitsgate

```sh
corepack pnpm run quality:full
```

Die draait TypeScript-only, formatting, elementen, typecheck, coverage, build,
Fallow, lint en Steiger. E2E is lokaal optioneel en verplicht in CI:

```sh
corepack pnpm run build
corepack pnpm run e2e
```
