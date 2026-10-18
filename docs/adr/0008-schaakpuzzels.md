# ADR 0008: Schaakpuzzels uit de Lichess-database

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

Na de schaaktutorial wil de eigenaar korte schaakpuzzels aanbieden. De app is statisch, doet geen externe requests en gebruikt al `chess.js` en `react-chessboard`. Een runtime-koppeling met de Lichess-API is daarom geen optie. De Lichess-puzzeldatabase is publiek beschikbaar onder CC0 en bevat FEN, oplossingen, rating en thema's.

## Beslissing

1. **Een lokaal gebundelde selectie met drie niveaus.** De set bevat 34 puzzles: 12 makkelijk, 12 lastig en 10 uitdagend. De selectie staat in `libs/features/chess-puzzles/model/puzzles.ts`.
2. **Filter op kindvriendelijke puzzles.** De selectie is gefilterd op rating 400–1500, popularity ≥ 80, wit aan zet na de tegenzet en één spelerszet. Makkelijk bevat alleen mat-in-één (rating 400–470), lastig combineert mat-in-één met losse stukken slaan (703–883), en uitdagend bevat mat-in-één met een hogere rating (1100–1131).
3. **Het niveau is een expliciet redactioneel veld.** `difficulty` is `easy`, `medium` of `hard`. De indeling is niet alleen een ratinggrens: een drukke stelling kan lastiger zijn dan de rating suggereert. De UI toont drie grote niveauknoppen en filtert de puzzels.
4. **Geen nieuwe runtime-dependency.** De puzzelrunner gebruikt de bestaande `chess.js`- en `react-chessboard`-integratie. De Lichess-data wordt één keer offline verwerkt en daarna als TypeScript gebundeld.
5. **De tegenzet wordt eerst gespeeld.** Een Lichess-FEN is de stelling vóór de tegenzet. De runner past de eerste UCI-zet toe en laat daarna het kind puzzelen.
6. **Elke checkmate telt.** Voor `mateIn1` accepteert de runner iedere zet die checkmate geeft, niet alleen de in de database genoemde zet. Dat volgt de Lichess-regel dat alternate mates ook goed zijn.
7. **Fout is opnieuw proberen.** Een verkeerde zet verandert de stelling niet; het stuk snapt terug en het kind krijgt vriendelijke feedback. Er is geen harde fail-state.
8. **Hint en voortgang.** De hint markeert de volgende oplossingszet. Na succes gaat de pagina naar de volgende puzzel binnen het gekozen niveau; de selectie wordt lokaal in de bundle herhaald.

## Bron en filtering

- Bron: <https://database.lichess.org/#puzzles>, bestand `lichess_db_puzzle.csv.zst`, geraadpleegd op 18 oktober 2026.
- Licentie: CC0. Naamsvermelding is niet verplicht; de herkomst staat in de data (`gameUrl`) en in deze ADR.
- Velden: `PuzzleId`, `FEN`, `Moves` (UCI), `Rating`, `Themes`, `GameUrl`.
- Filter: `mateIn1` of `hangingPiece`, rating 400–1500, popularity ≥ 80, `Moves` bestaat uit twee zetten (tegenzet + spelerszet), en na de tegenzet is wit aan zet.
- Niveaus: `easy` = 12 mat-in-één (400–470), `medium` = 7 mat-in-één + 5 hanging pieces (703–883), `hard` = 10 mat-in-één (1100–1131).
- Controle: iedere opgenomen puzzel is met `chess.js` gevalideerd; matpuzzels eindigen in checkmate, hanging-piece-puzzels in een geldige slag.

## Gevolgen

- De set is volledig offline; de bundel groeit met enkele tientallen kB aan puzzeldata.
- De selectie is bewust niet representatief voor de hele Lichess-database en bevat geen dynamisch rating- of voortgangssysteem.
- Meer puzzels toevoegen betekent een nieuwe offline selectie maken, de juiste `difficulty` kiezen en de data/test bijwerken.
- De runner ondersteunt nu één spelerszet per puzzel. Latere tactics met meerdere zetten kunnen dezelfde engine gebruiken, maar vragen extra UI-feedback en tests.

## Vervolg

ADR 0015 breidt deze selectie uit met 90 gegenereerde Lichess-puzzels, waaronder mat-in-twee en tactieken met meer stukvariatie.
