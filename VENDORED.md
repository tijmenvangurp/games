# Vendored code: Wie was het?

Deze repository bevat twee 1:1 overgenomen stukken uit één upstream-project:

| Map                                        | Wat                                                                         | Bestanden |
| ------------------------------------------ | --------------------------------------------------------------------------- | --------- |
| `libs/entities/murdoku/model/engine/`      | pure TypeScript-engine: model, aanwijzingen, solver, level-io, generator    | 70        |
| `libs/features/murdoku-game/lib/vendored/` | canvas-renderlaag (bord, meubels, vloeren, portretten) en de tekst-renderer | 8         |

Onze eigen code staat daarbuiten: `libs/entities/murdoku/model/murdoku.ts`, `libs/entities/murdoku/index.ts`, `libs/features/murdoku-game/lib/{nl,text,palette,preview-level}.ts`, `libs/features/murdoku-game/ui/**` en `libs/pages/murdoku/**`. Zie [ADR 0031](docs/adr/0031-vendored-murdoku-engine.md) voor de afweging.

## Bron

- **Upstream:** <https://github.com/LifeValuable/murdoku>
- **Commit:** `efc3c3b9443ddb5573b98c649deef7e6c8d1779b` ("small mobile adjustments", 2026-07-09), de stand van `main` op het moment van overnemen
- **Kopieerdatum:** 2026-11-15 — engine in commit `3278c29`, renderlaag in commit `2d0e98b`
- **Licentie:** MIT, © 2026 TheApo

De volledige licentietekst staat in [`LICENSES/murdoku-MIT.txt`](LICENSES/murdoku-MIT.txt) en moet bij elke kopie of substantieel deel meegeleverd blijven.

## Licentie

MIT License

Copyright (c) 2026 TheApo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### Bestandsmapping

| Upstream               | Lokaal                                                |
| ---------------------- | ----------------------------------------------------- |
| `src/engine/**`        | `libs/entities/murdoku/model/engine/**`               |
| `src/game/*.ts`        | `libs/features/murdoku-game/lib/vendored/*.ts`        |
| `src/i18n/Renderer.ts` | `libs/features/murdoku-game/lib/vendored/renderer.ts` |

Niet overgenomen: `levels/` (deels bewerkingen van de boekzaken van Manuel Garand, dus geen MIT-inhoud), de i18n-bundels (alleen de `Renderer`-klasse), de React-app, de editor en de ontwikkel-CLI. De enige bitmap uit de bron, `armchair.png`, staat in `libs/features/murdoku-game/ui/assets/`.

## Lokale patches

De kopie is inhoudelijk gelijk aan upstream. Alle afwijkingen zijn hieronder opgesomd; een update mag er niet meer dan deze bevatten.

1. **`model/` heet lokaal `domain/`.** Steiger keurt een geneste `model`-map in een entities-slice af. Alleen de importpaden en één regel commentaar in `engine/index.ts` zijn aangepast; er is geen regel logica veranderd.
2. **Importpaden naar de repo.** De acht renderbestanden importeren `@entities/murdoku` in plaats van `../engine/index.ts`, en `boardRender.ts` haalt de palette uit `../palette.ts` (onze eigen, op de app-tokens gezette palette).
3. **Nederlands in `renderer.ts`.** De `objectEvery`-tak leest eerst een expliciete `objectEvery.*`-sleutel uit `nl.ts` en zet anders het lidwoord om (`een tafel` → `elke tafel`). Upstream laat die twee stappen sinds een latere refactor weg; wij hebben ze nodig voor de Nederlandse zinnen.
4. **Opmaak.** Alle vendored bestanden zijn met `oxfmt` geformatteerd, net als de rest van de repo (zie ADR 0031). Upstream gebruikt geen puntkomma's en enkele quotes; de diff daarvan is mechanisch.
5. **Lint.** Zeventien `oxlint`-meldingen zijn verholpen zonder gedrag te wijzigen: acht keer `unicorn(no-useless-spread)` (een `Set` direct in `for…of` in plaats van `[...set]`; verwijderen tijdens iteratie is veilig en de volgorde blijft gelijk), vijf keer `unicorn(no-new-array)` (`Array.from({ length: n }, …)` in plaats van `new Array(n).fill(…)`), en vier keer `unicorn(no-useless-fallback-in-spread)` (`...(x ?? {})` → `...x`, want een lege spread voegt niets toe).

De engine is verder byte-identiek aan upstream op commit `efc3c3b`; van de acht renderbestanden zijn zeven identiek op de importpaden na.

## Onderhoud

### Updaten

1. Kies de nieuwe upstream-commit en kopieer `src/engine/**` naar `libs/entities/murdoku/model/engine/**` (map `model` → `domain`) en de acht renderbestanden naar `libs/features/murdoku-game/lib/vendored/`.
2. Pas de lokale patches uit de lijst hierboven opnieuw toe.
3. Draai `corepack pnpm exec oxfmt libs/entities/murdoku/model/engine libs/features/murdoku-game/lib/vendored`.
4. Bekijk `git diff -w` per bestand en controleer dat er geen logica verandert; alleen opmaak, paden en de genoemde patches horen in de diff te staan.
5. Draai `corepack pnpm run test:coverage` en `corepack pnpm run quality`; werk daarna de commit, kopieerdatum en patchlijst in dit bestand bij.
6. Prun de dead-codebaseline met `corepack pnpm exec fallow baselines prune` als upstream exports heeft toegevoegd of verwijderd.

### Wat we niet doen

- **Geen eigen fixes in de vendored mappen** zonder ze hier te noteren. Een bug die ook upstream zit, melden we daar; lokaal patchen betekent een regel in de lijst hierboven.
- **Geen blanket-uitzonderingen.** Formatter en linter draaien mee zoals op onze eigen code; voor dead code bestaat een scoped baseline (`tools/fallow-dead-code-baseline.json`) en voor complexiteit een scoped health-override in `.fallowrc.json`, beide met een reden. Onze wrapper en UI vallen buiten alle vendor-uitzonderingen.
- **Geen regel-voor-regel coverage-eis.** De vendored mappen staan buiten de 80%-drempel; de paden die wij gebruiken (publieke API, solver, hints, generator, teksten, bord) worden end-to-end getest in `tests/node/murdoku-*.test.ts` en `tests/web/murdoku-board.test.tsx`. Zie ADR 0031.
