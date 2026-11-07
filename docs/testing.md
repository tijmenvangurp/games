# Testen

De repo gebruikt Vitest voor unit- en componenttests en Playwright voor e2e.
Dezelfde suites draaien lokaal en in CI.

## Lagen

| Laag | Locatie                        | Omgeving | Waarvoor                                            |
| ---- | ------------------------------ | -------- | --------------------------------------------------- |
| Node | `tests/node/**/*.test.ts`      | Node     | Pure regels, generators, parsers, catalogi.         |
| Web  | `tests/web/**/*.test.{ts,tsx}` | jsdom    | Stores, hooks, componenten, routes.                 |
| E2E  | `e2e/**/*.spec.ts`             | Chromium | De belangrijkste gebruikersreis in de gebouwde app. |

`vitest.config.ts` definieert de twee projecten `node` en `web`. De web-tests
gebruiken `tests/web/setup.ts` voor de DOM-opruiming.

## Commando's

```sh
corepack pnpm test              # Vitest in watchmodus
corepack pnpm test:run          # eenmalig, zonder coverage
corepack pnpm test:coverage     # eenmalig, met coverage-drempel
corepack pnpm run build
corepack pnpm run e2e           # Playwright tegen de preview
```

Eén test of één bestand:

```sh
corepack pnpm exec vitest run tests/node/math-generator.test.ts
corepack pnpm exec vitest run -t "naam van de test"
```

E2E in shards, zoals CI:

```sh
corepack pnpm run e2e -- --shard=1/2
corepack pnpm run e2e -- --shard=2/2
```

De Playwright-config start `vite preview` op `127.0.0.1:4173`. Draai dus eerst
`corepack pnpm run build`. `scripts/run-playwright.ts` zet optioneel
`LD_LIBRARY_PATH` en `FONTCONFIG_PATH` voor een lokale browserinstallatie; op
een normale machine zijn die niet nodig.

## Coverage

De drempel staat in `vitest.config.ts`:

| Metriek    | Minimum |
| ---------- | ------- |
| branches   | 80%     |
| functions  | 80%     |
| lines      | 80%     |
| statements | 80%     |

Coverage wordt gemeten over `apps/games/src/**` en `libs/**`. `main.tsx`,
`libs/entities/sudoku/model/types.ts` en `.d.ts`-bestanden zijn uitgezonderd.
Scripts vallen buiten de coverage; Fallow bewaakt daar de complexiteit en
dead code.

## Wat test je waar?

- **Pure regels** horen in `tests/node`. Geen React, geen DOM. Denk aan een
  generator, een winconditie, een niveau-opbouw of een adaptief model.
- **Store en UI** horen in `tests/web`. Reset de Zustand-store en
  `localStorage` in `beforeEach`, anders lekt state tussen tests.
- **Routes** test je met `createMemoryHistory` en `createAppRouter`, zoals in
  `tests/web/puzzle.test.tsx`.
- **E2E** alleen voor de reis die je echt in een browser wilt zien: drag-and-
  drop, audio, een volledige ronde of een route die je niet met jsdom kunt
  nabootsen.

## Afspraken

- Elke nieuwe pure regel krijgt een test in `tests/node`.
- Elke nieuwe gebruikersinteractie krijgt minimaal één test in `tests/web`.
- Een nieuwe game krijgt een e2e-specificatie als de kernreis niet al door een
  bestaande spec wordt gedekt.
- Gebruik fixtures in `tests/` in plaats van grote datablokken in de test.
- Test gedrag, niet implementatiedetails. Vermijd snapshots van complete DOM-
  bomen.
- Geen `.js`-testbestanden; alleen `.ts` en `.tsx`.
- Een test die tijdelijk skipped is, krijgt een verwijzing naar een issue of
  een duidelijke reden.

## Kwaliteitsgate

| Script         | Wat het doet                                                                |
| -------------- | --------------------------------------------------------------------------- |
| `quality`      | TypeScript-only, formatting, elementen, typecheck, coverage, build, Fallow. |
| `quality:full` | `quality` plus lint en Steiger.                                             |
| `quality:ci`   | `quality:full` plus e2e.                                                    |

Draai lokaal `quality:full` vóór je een pull request opent. De commit-hook
draait `quality`; CI draait `quality:full` en daarna e2e in twee shards.
