# ADR 0008: Schaakpuzzels uit de Lichess-database

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

Na de schaaktutorial wil de eigenaar korte schaakpuzzels aanbieden. De app is statisch, doet geen externe requests en gebruikt al `chess.js` en `react-chessboard`. Een runtime-koppeling met de Lichess-API is daarom geen optie. De Lichess-puzzeldatabase is publiek beschikbaar onder CC0 en bevat FEN, oplossingen, rating en thema's.

## Beslissing

1. **Een kleine, lokaal gebundelde selectie.** De eerste slice bevat 25 puzzles: 20 `mateIn1` en 5 `hangingPiece` met één spelerszet. De selectie staat in `libs/features/chess-puzzles/model/puzzles.ts`.
2. **Filter op kindvriendelijke puzzles.** De gebruikte selectie is gefilterd op rating 400–900, popularity ≥ 85, popularity, wit aan zet na de tegenzet en één spelerszet. De eerste 20 zijn allemaal makkelijke mat-in-één-stellingen; de laatste 5 zijn eenvoudige slagen op een los stuk.
3. **Geen nieuwe runtime-dependency.** De puzzelrunner gebruikt de bestaande `chess.js`- en `react-chessboard`-integratie. De Lichess-data wordt één keer offline verwerkt en daarna als TypeScript gebundeld.
4. **De tegenzet wordt eerst gespeeld.** Een Lichess-FEN is de stelling vóór de tegenzet. De runner past de eerste UCI-zet toe en laat daarna het kind puzzelen.
5. **Elke checkmate telt.** Voor `mateIn1` accepteert de runner iedere zet die checkmate geeft, niet alleen de in de database genoemde zet. Dat volgt de Lichess-regel dat alternate mates ook goed zijn.
6. **Fout is opnieuw proberen.** Een verkeerde zet verandert de stelling niet; het stuk snapt terug en het kind krijgt vriendelijke feedback. Er is geen harde fail-state.
7. **Hint en voortgang.** De hint markeert de volgende oplossingszet. Na succes gaat de pagina naar de volgende puzzel; de selectie wordt lokaal in de bundle herhaald.

## Bron en filtering

- Bron: <https://database.lichess.org/#puzzles>, bestand `lichess_db_puzzle.csv.zst`, geraadpleegd op 18 oktober 2026.
- Licentie: CC0. Naamsvermelding is niet verplicht; de herkomst staat in de data (`gameUrl`) en in deze ADR.
- Velden: `PuzzleId`, `FEN`, `Moves` (UCI), `Rating`, `Themes`, `GameUrl`.
- Filter: `mateIn1` of `hangingPiece`, rating 400–900, popularity ≥ 85, `Moves` bestaat uit twee zetten (tegenzet + spelerszet), en na de tegenzet is wit aan zet.
- Controle: iedere opgenomen puzzel is met `chess.js` gevalideerd; matpuzzels eindigen in checkmate, hanging-piece-puzzels in een geldige slag.

## Gevolgen

- De eerste slice is klein en volledig offline; de bundel groeit met enkele tientallen kB aan puzzeldata.
- De selectie is bewust niet representatief voor de hele Lichess-database en bevat geen rating- of voortgangssysteem.
- Meer puzzels toevoegen betekent een nieuwe offline selectie maken en de data/test bijwerken.
- De runner ondersteunt nu één spelerszet per puzzel. Latere tactics met meerdere zetten kunnen dezelfde engine gebruiken, maar vragen extra UI-feedback en tests.
