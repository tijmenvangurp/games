# ADR 0031: 1:1 vendored murdoku-engine en renderlaag

- **Status:** Accepted
- **Datum:** 2026-11-15
- **Bouwt voort op:** [ADR 0002](0002-kwaliteitsgate.md) (kwaliteitsgate), [ADR 0004](0004-nx-monorepo.md) (Nx en FSD)

## Context

**Wie was het?** is een logicamysterie: sudoku met één persoon per rij en kolom, kamers, meubels en aanwijzingen die samen één dader aanwijzen. De engine bestaat uit een model, 73 aanwijzingstypes, 25 deductietechnieken, een solver, level-io en een generator. Zelf schrijven betekent duizenden regels puzzellogica onderhouden, met een reëel risico op ongemerkte fouten in de zeldzame technieken.

[`LifeValuable/murdoku`](https://github.com/LifeValuable/murdoku) is een complete TypeScript-implementatie onder de MIT-licentie, met een engine van 70 bestanden en een canvas-renderlaag van acht bestanden. De code compileert ongewijzigd onder onze `tsconfig`, gebruikt geen netwerk, geen DOM buiten `canvas` en heeft geen runtime-dependencies.

Alternatieven:

- **Zelf een engine schrijven.** Volledige controle, maar honderden uren werk en een solver die je zelf moet bewijzen. Valt af: de mechanica is niet ons onderscheidende werk, de zaken en de Nederlandse teksten wel.
- **`EverywhereSafety/murdoku-lab` of `Seyronh/MurdokuGen`.** AGPL-3.0; dat zou de hele publieke app onder AGPL brengen. Valt af.
- **`martineberlein/murdoku-solver`, `lluisaliano/MurdokuSolver`.** Geen licentie, dus alle rechten voorbehouden. Valt af.
- **Een commerciële of boekversie nabouwen.** De naam Murdoku is een merk en de boekzaken zijn auteursrechtelijk beschermd. Valt af.

Binnen de MIT-repo zijn de levels deels bewerkingen van de boekzaken van Manuel Garand; de MIT-licentie dekt die inhoud niet. Daarom nemen we alleen code en procedurele art over, nooit levels, namen of teksten.

## Beslissing

1. **1:1 overname, geen fork.** De engine staat in `libs/entities/murdoku/model/engine/**` (70 bestanden) en de renderlaag in `libs/features/murdoku-game/lib/vendored/**` (8 bestanden), gekopieerd van commit `efc3c3b` op 2026-11-15. De map `model` heet lokaal `domain`, omdat Steiger een geneste `model`-map afkeurt; dat is de enige structurele ingreep. Alle afwijkingen staan in [`VENDORED.md`](../VENDORED.md).
2. **Eigen public API als grens.** De app praat alleen met `@entities/murdoku` (`loadMurdokuLevel`, `checkMurdokuLevel`, `countMurdokuSolutions`, `findMurdokuMurderer`, `validateMurdokuPlacement`, `placementOf`, `generateMurdokuLevel`) en met de UI van `@features/murdoku-game`. De renderlaag leest het bord rechtstreeks, omdat een canvas-renderer een bord nodig heeft; die exports staan expliciet in de public API.
3. **Formatter en linter gelden ook hier.** Er zijn geen `oxfmt`-uitzonderingen en geen `oxlint`-suppressies voor de vendored mappen. De 1:1-kopie is één keer geformatteerd en de zeventien `unicorn`-meldingen zijn gedragsneutraal verholpen. Zo blijft de code leesbaar naast onze eigen code en voorkomt de gate dat een update stilletjes rommel binnenhaalt.
4. **Coverage: end-to-end, niet regel voor regel.** Beide vendored mappen staan buiten de 80%-drempel in `vitest.config.ts`. Wat wij gebruiken wordt end-to-end getest via de publieke API: laden, aanwijzingen, solver, hints, generator, dader, teksten en bord. Onze wrapper, teksten, palette en UI vallen wél onder de drempel.
5. **Fallow: scoped, met een reden.** Geen blanket `ignoreExports` en geen `unused-types`/`unused-class-members`-off meer. In plaats daarvan:
   - een dead-codebaseline in `tools/fallow-dead-code-baseline.json` met de findings die horen bij een volledige engine waarvan wij een deel gebruiken; nieuwe findings in vendored code of in onze wrapper falen, tenzij de baseline bewust opnieuw wordt vastgelegd met de reden in de commit (zoals wanneer onze eigen pagina een engine-export niet meer gebruikt);
   - een health-override per vendored map met de gemeten upstream-maxima plus een kleine marge (`130/260/3700/540` voor de engine, `90/150/1700/640` voor de renderlaag), met een reden die naar dit ADR en `VENDORED.md` verwijst;
   - de bestaande duplicatie-uitzondering voor procedurele art, omdat het kopieerwerk in de tekencode van upstream is.
6. **Onderhoudsafspraak.** Updaten betekent: nieuwe upstream-commit kiezen, de twee mappen opnieuw kopiëren, de patches uit `VENDORED.md` toepassen, `oxfmt` draaien, `git diff -w` beoordelen en `pnpm run quality` halen. Daarna worden commit, kopieerdatum en patchlijst bijgewerkt en wordt de baseline geprund. Een lokale bugfix in vendored code is alleen toegestaan als hij in de patchlijst staat.

## Gevolgen

- **Minder eigen code, meer afhankelijkheid van een externe bron.** De engine is niet van ons; we volgen upstream of patchen bewust. Elke update kost een review van een grote mechanische diff.
- **De kopie is niet meer byte-gelijk aan upstream.** De formatter- en lintronde plus de `domain`-rename zorgen voor ruis bij een update. Daarom is `git diff -w` onderdeel van de procedure en staat de volledige patchlijst in `VENDORED.md`.
- **Dead code kan zich verschuilen.** De baseline maakt bestaande ongebruikte exports onzichtbaar; hij is shrink-only te onderhouden met `fallow baselines prune`, en nieuwe dode code faalt. Onze wrapper valt buiten de baseline.
- **Licentie en attributie.** De MIT-tekst staat in `LICENSES/murdoku-MIT.txt` en in `VENDORED.md`; de bron staat in de README. Bij een update blijft de copyright-regel ongewijzigd meegeleverd.
- **Geen gevolgen voor privacy, CSP of deployment.** De engine draait client-side, doet geen netwerkrequests en gebruikt geen externe fonts of afbeeldingen. De generator draait build-time en gaat niet mee de client in. De enige bitmap, `armchair.png`, wordt via Vite gebundeld.

## Bronnen

- <https://github.com/LifeValuable/murdoku> — MIT, © 2026 TheApo; commit `efc3c3b9443ddb5573b98c649deef7e6c8d1779b`
- [`LICENSES/murdoku-MIT.txt`](../LICENSES/murdoku-MIT.txt)
- [`VENDORED.md`](../VENDORED.md) — bron, kopieerdatum, patchlijst en updateprocedure
- [`docs/research/2026-11-15-murdoku.md`](../research/2026-11-15-murdoku.md) — regels, licentievergelijking en de afweging om alleen code en art over te nemen
- [`docs/tooling.md`](../tooling.md) — Fallow, de Nx-daemon en de baseline

## Checklist

- [x] Titel, status en datum kloppen.
- [x] Context noemt de alternatieven.
- [x] Beslissing is concreet en toetsbaar.
- [x] Gevolgen noemen privacy, CSP, assets en tests waar relevant.
- [x] Bronnen en licenties zijn compleet.
- [x] `docs/README.md` en `docs/adr/README.md` zijn bijgewerkt.
