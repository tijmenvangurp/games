# ADR 0017: Het Molenspel

- **Status:** Accepted
- **Datum:** 2026-10-20

## Context

De eigenaar wil het molenspel (Nine Men's Morris) in de app. Het is een eeuwenoud bordspel voor twee spelers, in Nederland ook wel _mûne_ (Frijs) of _merels_ genoemd. Het spel staat op de Nederlandse Wikipedia en in de Boek der Spelen van koning Alfons X uit 1283.

De spelregels en de bordvorm zijn niet uit mijn hoofd overgenomen maar uit de bordtekening op de Nederlandse Wikipedia (`Moelle.svg`) en het officiële bordbestand op Wikimedia Commons gehaald en met een script nagerekend. Zo is vastgelegd:

- Het bord heeft **24 punten**: drie concentrische vierkanten van elk 8 punten (hoekpunten en zijmiddens) plus vier verbindingen tussen de ringen.
- De lijnen vormen **32 verbindingen** tussen punten.
- Er zijn **16 molentjes**: 8 horizontale en 8 verticale drietalen.

De app is statisch, doet geen externe requests en kent geen backend. Het spel moet dus volledig client-side draaien en met touch op telefoon en tablet te spelen zijn.

## Beslissing

1. **Het klassieke molenspel, geen variant.** De puntposities, de 32 verbindingen en de 16 molentjes staan als data in `libs/entities/molenspel/model/board.ts`. De molentjes worden uit de verbindingen afgeleid (drie collineaire punten met de middelste in het midden), niet los handmatig ingetypt. Een test controleert dat er er precies zestien zijn, acht horizontaal en acht verticaal.
2. **Alle regels in `entities`.** `libs/entities/molenspel/model/rules.ts` bevat de pure spelregels: plaatsen, schuiven, vliegen, molentjes herkennen, stenen pakken, winnen en gelijkspel. De laag heeft geen React en geen toegang tot de DOM, dus de regels zijn los testbaar.
3. **Drie fasen, zoals in het originele spel.**
   - _Plaatsen_: de spelers leggen om en om een steen op een leeg punt.
   - _Schuiven_: zodra alle stenen op het bord liggen, schuift een speler een steen naar een naburig punt.
   - _Vliegen_: met nog drie stenen mag een speler met elke steen naar elk vrij punt springen.
4. **Een molentje geeft het recht om één steen te pakken.** Losse stenen gaan voor; als alle stenen van de tegenstander in een molentje liggen, mag elke steen weg. Dat volgt de Nederlandse en Engelse Wikipedia en de gebruikelijke regels.
5. **Winnen op twee manieren.** De tegenstander verliest als er nog maar twee stenen over zijn, of als hij geen enkele zet meer kan doen. "Nog maar twee stenen" telt de stenen in de hand mee, zodat een speler die nog aan het leggen is niet verloren zit.
6. **Gelijkspel na tien beurten.** Zodra beide spelers nog drie stenen hebben, mogen zij tien beurten spelen om te winnen. Daarna is het gelijkspel.
7. **Twee spelers op één apparaat.** Het originele spel is een spel voor twee. De app voegt geen computertegenstander toe; dat zou een apart spelontwerp zijn en de regels uitrekken.
8. **De voortgang blijft lokaal.** Het bord en de instellingen staan in `localStorage` onder `games.molenspel.v1`. Er gaat niets naar een server.
9. **Het bord is SVG.** De 24 punten zijn schaalbare cirkels met een treftarget van 0,45 rastereenheid, ruim boven de 44 px op een telefoon. Het bord past dus op 390 px (mobiel) en 1024 px (tablet) zonder scrollen.

## Gevolgen

- De spelpakketten blijven offline; er komt geen runtime-dependency bij.
- Het bord is met 24 punten en 16 molentjes klein genoeg om volledig op één scherm te tonen, ook op een telefoon.
- De spelregels zijn een jaar of ouder en kunnen veranderen; de ADR en de tests in `tests/node/molenspel-rules.test.ts` leggen de huidige interpretatie vast.
- Er is geen computertegenstander. Wil de eigenaar die later, dan is dat een eigen spelregelschijf en een eigen ADR.

## Alternatieven

- **Een puzzelvariant met een molenbord.** Afgewezen: dat is een ander spel dan de klassieker die de eigenaar wilde.
- **De diagonalen van het klassieke bord meenemen.** De bordtekening op Wikipedia heeft geen diagonalen tussen de hoekpunten van de buitenste ring en de middelste ring. Ik heb de tekening gevolgd, want dat is het bord waar de eigenaar naar verwees. Een variant mét diagonalen kent extra verbindingen en dus andere zetten.
- **Een AI-tegenstander.** Uitgesteld; het originele spel is voor twee mensen.
