# ADR 0016: Schaakpuzzeloverzicht met lokale voortgang

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

De schaakpuzzelset groeide naar 124 puzzels, maar de pagina opende altijd puzzel 1 van het gekozen niveau. Er was geen overzicht en geen geheugen: een kind kon niet zien welke puzzels het al had opgelost en begon na een herlaadbeurt weer vooraan.

## Beslissing

1. **Het overzicht is het startscherm.** De pagina toont eerst het gekozen niveau, de voortgang en een raster met alle puzzelnummers. Een puzzel aantikken opent die puzzel.
2. **Alleen opgeloste puzzels worden bewaard.** De opslag bevat een lijst met puzzel-ID's onder `games.chess-puzzles.v1`. Er is geen account, sync of extern verkeer. Onbekende of oude ID's worden bij het laden genegeerd.
3. **De speelscherm meldt succes aan de pagina.** `PuzzlePlay` roept `onSolved` één keer per puzzel aan; de pagina zet de puzzel in de opgeloste set en schrijft die lokaal weg.
4. **Het raster is visueel en toegankelijk.** Elke knop toont het puzzelnummer, een groene vink bij een opgeloste puzzel en een aria-label als "Puzzel 3, opgelost" of "Puzzel 3, nog niet opgelost". De knoppen zijn minimaal 44 px hoog.
5. **"Verder" gaat naar de eerste onopgeloste puzzel.** Zijn alle puzzels opgelost, dan heet de knop "Nog een keer" en opent hij de eerste puzzel. Het speelscherm houdt een "Overzicht"-knop en een "Volgende puzzel"-knop.
6. **Alleen oplossen telt.** Een puzzel die alleen geopend is, verschijnt niet als opgelost. Er is bewust geen aparte "gezien"-status; dat zou extra opslag en uitleg vragen zonder de kernvraag te beantwoorden.

## Gevolgen

- Voortgang is lokaal en apparaatgebonden. Een andere browser of het wissen van sitegegevens begint opnieuw.
- De pagina heeft geen backend, account of extra dependency nodig.
- De puzzeldata blijft dezelfde; alleen de presentatie en lokale opslag zijn nieuw.
- Bij nieuwe puzzels blijft oude voortgang geldig; de opgeslagen ID's worden tegen de bekende set gefilterd.
