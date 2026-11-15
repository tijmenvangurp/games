# ADR 0022: Schaakbord — tikken is kijken, slepen is zetten

- **Status:** Accepted
- **Datum:** 2026-10-19
- **Vervangt:** de punten 9 en 10 van [ADR 0014](0014-schaaktutorial-een-opdracht-per-scherm.md)

## Context

In de schaaktutorial en de schaakpuzzels kon een kind een zet doen door op een
gemarkeerd veld te tikken. Daardoor leek één tik soms meteen een zet te zijn,
met een correctie of "die zet is niet de beste" als gevolg. Kinderen willen
juist rustig kunnen kijken: een stuk aantikken om te zien waar het heen kan,
zonder dat het bord verandert. Dat geldt ook voor de stukken van de
tegenstander; juist die helpen bij het leren lezen van de stelling.

## Beslissing

1. **Een tik speelt nooit een zet.** Een tik selecteert alleen het stuk op dat
   veld en toont de legale zetten als groene stippen. Nog een tik op hetzelfde
   veld deselecteert het stuk. Een tik op een leeg veld of een stuk zonder
   zetten wist de selectie.
2. **Tikken werkt voor beide kleuren.** De zetten worden getoond voor het
   stuk dat je aantikt, ook als dat van de tegenstander is. chess.js genereert
   alleen zetten voor de partij die aan zet is; daarom wordt voor de preview
   tijdelijk de beurt in de FEN omgezet. De echte zetvalidatie verandert niet.
3. **Zetten gaan via slepen en neerzetten.** Pas bij het neerzetten geeft de
   app feedback: goed, illegaal of (bij een puzzel) niet de oplossing. Tijdens
   het slepen gebeurt er niets.
4. **De kijk-preview blijft bestaan.** Elke les opent met blauwe stippen voor
   het lesstuk. Tikken op het lesstuk maakt daar groene stippen van. De knop
   "Kijk" zet de blauwe preview aan en uit.
5. **De coachteksten wijzen op slepen.** "Tik op het stuk om te kijken" en
   "Sleep naar een groene stip" vervangen de oude tik-instructies. Tikken op
   de ster geeft geen corrigerende feedback meer, want een tik is geen zet.

## Gevolgen

- Een kind kan vrij alle stukken verkennen, ook de zwarte koning of een stuk
  dat het niet mag verplaatsen.
- Slepen is de enige manier om te zetten. Toetsenbord- of tik-only-bediening
  is daarmee nog niet ondersteund; dat is een aparte toegankelijkheidsvraag.
- De gedeelde bordhulp `movesForPiece` in `libs/shared/lib` bevat de
  FEN-beurtwissel, zodat tutorial en puzzels dezelfde previewregels gebruiken.
- De e2e-tests simuleren zetten met echte sleepbewegingen in plaats van
  tikken.
