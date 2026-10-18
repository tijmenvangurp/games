# ADR 0015: Schaakpuzzels uitbreiden met mat-in-twee en meer stukken

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

ADR 0008 legde 34 Lichess-puzzels vast. Die set is vooral mat-in-één en een paar losse stukken slaan, meestal met toren of dame. De eigenaar wil veel meer puzzels, ook mat-in-twee en opdrachten waarin paarden, lopers, pionnen en dames de hoofdrol spelen. De runner ondersteunt al meerdere zetten, maar de data en tests gingen uit van één spelerszet.

## Beslissing

1. **De 34 bestaande puzzels blijven de handmatige basis.** Ze staan in `puzzles.ts` en zijn met de hand gecontroleerd.
2. **Daarnaast komen 90 gegenereerde Lichess-puzzels.** Ze staan in `puzzles-extra.ts`; de totale set is 124 puzzels, 42 makkelijk, 42 lastig en 40 uitdagend.
3. **De selectie is offline en reproduceerbaar.** `scripts/generate-chess-puzzles.ts` leest `lichess_db_puzzle.csv.zst`, filtert en valideert met `chess.js`, en schrijft de extra data. De generator draait niet in CI en vereist de `zstd`-CLI; de uitvoer wordt gecommit.
4. **Filter en verdeling.** Rating 400–1600, popularity ≥ 85, minimaal 500 partijen, twee of vier halve zetten, en thema's `mateIn1`, `mateIn2`, `hangingPiece`, `fork`, `pin`, `skewer`, `discoveredAttack` of `sacrifice`. Beide kleuren mogen aan zet zijn. Per niveau worden de stukken zoveel mogelijk gespreid over pion, paard, loper, toren en dame.
5. **Niveaus.** Makkelijk is rating 400–800 met mat-in-één of een hangend stuk. Lastig is 801–1200 met mat-in-twee of tactiek. Uitdagend is 1201–1600 met mat-in-twee of tactiek.
6. **Een nieuwe `tactic`-soort.** Naast `mate` en `capture` krijgen puzzels waarin de beste zet geen directe slag of mat is de soort `tactic`. De UI zegt dan "Vind de beste zet!" en "Gelukt! Je hebt de beste zet gevonden."
7. **De engine blijft gelijk.** De bestaande `remainingMoves`-lus speelt tegenzet en spelerszet om de beurt. Er komen tests bij voor een volledige mat-in-twee en voor de nieuwe data.

## Bron en controle

- Bron: <https://database.lichess.org/#puzzles>, bestand `lichess_db_puzzle.csv.zst`, geraadpleegd op 18 oktober 2026.
- Licentie: CC0. De herkomst staat per puzzel in `gameUrl`.
- Controle: iedere opgenomen regel is met `chess.js` doorlopen. `mate` eindigt in schaakmat, `capture` eindigt op een slag en `tactic` is een geldige lijn zonder mat of slag als eindzet.
- De generator is deterministisch voor dezelfde database: populariteit, rating en PuzzleId bepalen de selectie.

## Gevolgen

- De bundel groeit met ongeveer 40 kB aan puzzeldata; er komen geen runtime-requests of dependencies bij.
- Kinderen zien meer variatie en kunnen nu ook mat-in-twee en tactieken tegenkomen.
- De moeilijkheidsgraad blijft redactioneel; de rating is een hulpmiddel, geen garantie.
- Een nieuwe Lichess-database vraagt opnieuw een offline run van de generator en een controle van de tests.
