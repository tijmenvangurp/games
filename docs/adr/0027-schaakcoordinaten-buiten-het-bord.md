# ADR 0027: Schaakcoördinaten buiten het bord

- **Status:** Aangenomen
- **Datum:** 2026-10-20

## Context

react-chessboard tekent de coördinaten met `showNotation` in de hoek van de
velden zelf. Onze stukken vullen het hele veld, dus de letters en cijfers
verdwenen achter het stuk dat erop stond. Op een telefoon was dat het duidelijkst:
de "8" lag over de toren en de letters a tot en met h lagen onder de onderste
rij. Kinderen konden daardoor niet zien welk veld welk vak is.

Daarnaast vroeg de eigenaar om minder verticale ruimte boven het bord: de
paginakop met titel en ondertitel nam ruimte in die het bord beter kon gebruiken.
Een bord mag iets kleiner worden voor de coördinaten, als de cijfers en letters
maar leesbaar blijven.

## Beslissing

1. **De coördinaten staan buiten het bord.** Rijnnummers links in een smalle
   goot, kolomletters onder het bord. Elk cijfer staat verticaal gecentreerd op
   zijn rij en elke letter horizontaal gecentreerd onder zijn kolom, zodat ze
   nooit een stuk raken.
2. **De volgorde volgt de bordstand.** Staat wit onder, dan lezen de nummers
   van boven naar beneden 8 tot en met 1 en de letters van links naar rechts a
   tot en met h. Staat zwart onder (een omgedraaid bord), dan is dat 1 tot en
   met 8 en h tot en met a, net als op een echt bord.
3. **Eén gedeeld component.** `ChessBoard` in `libs/shared/ui` tekent het frame
   en het bord. De schaakpartij, de schaaktutorial en de schaakpuzzels gebruiken
   hetzelfde component; `chessBoardOptions` zet `showNotation` uit en de oude
   notatiestijlen zijn vervallen.
4. **Het bord levert de goot in, niet de pagina.** Het frame is even breed als
   voorheen; het bord zelf wordt ongeveer 1,25 rem smaller zodat de cijfers in
   de marge passen. De totale hoogte van het bordblok blijft gelijk, want de
   letterrij komt onder het bord in plaats van eroverheen.
5. **Compacte paginakop tijdens een partij.** De ondertitel van de schaakpartij
   verdwijnt zodra er gespeeld wordt (de statusregel noemt de partijvorm al) en
   de titel is op een telefoon één maat kleiner. De schaaklessen en puzzels
   houden hun ondertitel.

## Gevolgen

- De coördinaten zijn altijd leesbaar, ook op een smal scherm. De velden zijn
  op een telefoon ongeveer 41 px in plaats van 44 px; dat is de prijs van de
  goot en is met de eigenaar afgestemd.
- De e2e-tests vinden "a" en "8" nog steeds binnen de bordgroep, omdat de
  goot binnen hetzelfde `role="group"` valt.
- De notatiekleuren (`lightSquareNotationStyle`, `darkSquareNotationStyle`) en
  de lettergroottes zijn uit `chessBoardOptions` verdwenen; de coördinaten
  erven nu de rustige `muted-foreground`-kleur van het designsysteem.
- Op een tablet blijft de partijpagina scrollen: het bord is begrensd op
  `max-w-lg` en past met de spelerskaarten, status en knoppen niet in 768 px
  hoogte. Een bord-naast-HUD-indeling is een aparte ontwerpvraag.
