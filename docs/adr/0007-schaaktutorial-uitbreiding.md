# ADR 0007: Schaaktutorial uitbreiden naar de complete basis

- **Status:** Accepted
- **Datum:** 2026-10-18

## Context

ADR 0006 introduceerde drie geïsoleerde lessen: toren, paard en pion. De eigenaar wil de tutorial doortrekken naar de complete schaakbasis. Naast de ontbrekende stukken moet het kind ook kennismaken met rokade, schaak zetten en schaakmat.

De bestaande levelvorm had één doelmechanisme: een doelveld plus een minimumaantal zetten. Dat is niet genoeg voor opdrachten als “zet schaak” of “zet schaakmat”, waarbij het resultaat van de zet belangrijker is dan het veld.

## Beslissing

1. **Negen levels in één tutorial.** De volgorde is: toren, loper, dame, paard, koning, pion, rokade, schaak zetten, schaakmat.
2. **Een optionele `goal` naast `targetSquare`.** `goal` is een gesloten union: `check`, `checkmate`, `castle-kingside` of `castle-queenside`. Zonder `goal` telt het doelveld, zoals in de eerste drie levels.
3. **De engine beoordeelt het resultaat met chess.js.** Schaak en schaakmat worden na de zet via `chess.isCheck()` en `chess.isCheckmate()` bepaald. Rokade wordt via de move-flags van chess.js herkend.
4. **Castlingrechten blijven bewaard.** `rearmWhite` reset de beurt naar wit, maar laat het castlingveld uit de FEN staan. Zo kan de rokadeles werken en verliest een king- of rookzet automatisch de rechten via chess.js.
5. **Koningen alleen waar nodig.** De stuklessen blijven geïsoleerd en worden met `skipValidation` geladen. De lessen voor rokade, schaak en schaakmat hebben beide koningen en gebruiken de normale schaakregels.
6. **De UI leidt de opdracht en het succesbericht uit het level af.** Een doelveld krijgt een ster; speciale opdrachten krijgen een eigen tekst. De levelkiezer gebruikt op mobiel twee kolommen en op grotere schermen drie.

## Gevolgen

- De tutorial dekt nu alle stukken en de eerste speciale schaakregels.
- Er is nog steeds geen volledig schaakspel: zwart antwoordt niet en er is geen win/loss-state.
- Nieuwe speciale doelen vragen een uitbreiding van `TutorialGoal` en de bijbehorende engine- en UI-tak.
- De voorbeeldstellingen voor schaak en schaakmat zijn bewust kort en controleerbaar; ze zijn geen volledige partij.
