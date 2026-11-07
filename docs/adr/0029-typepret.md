# ADR 0029: Typepret met eigen invoerlogica

- **Status:** Aangenomen
- **Datum:** 2026-11-07
- **Gerelateerd:** [ADR 0026](0026-adaptief-niveaumodel.md) (foutvriendelijke feedback en lokaal log), [ADR 0001](0001-publieke-statische-spellen-app.md)

## Context

Kinderen willen leren blind typen. De eisen:

- Nederlandstalig, stap voor stap, op een fysiek QWERTY-toetsenbord;
- geen tijdslimiet, geen levens en geen foutgeluid ([ADR 0026](0026-adaptief-niveaumodel.md));
- volledig statisch, zonder backend of externe requests;
- dezelfde vormgeving en bediening als de andere spellen.

Het onderzoek stelde `react-typing-game-hook` 1.4.2 voor voor de typestatus. Een proef buiten de app liet zien dat het pakket alleen CommonJS levert (`main: dist/index.js`, geen `module` of `exports`) en sinds maart 2023 niet is bijgewerkt. Het is bovendien gebouwd voor lopende tekst; Typepret werkt met één doelteken tegelijk.

## Beslissing

1. **Geen typing-library; een kleine pure engine in `libs/entities/typepret`.** `pressKey(state, key)` verwerkt één toets en geeft een nieuwe toestand terug. De library zou de eis "alleen ESM" breken en bespaart weinig: de logica is een paar tientallen regels.
2. **Invoer via `event.key`, hoofdletterongevoelig.** Dat werkt ook op een AZERTY-toetsenbord. De vingerzones gaan uit van QWERTY en dat zeggen we op het scherm. Shift, Backspace, spatie en functietoetsen doen niets.
3. **Acht lessen:** F/J, D/K, S/L, A/`;`, G/H, de hele basisrij en twee woordlessen. Een ronde heeft precies 20 doeltekens. Oefenreeksen bestaan uit groepen van twee tekens; woordrondes uit eigen woorden die alleen basisrij-letters bevatten.
4. **Fout = informatie.** Het doelteken blijft staan, de tekst blijft rustig en er is geen geluid. Een fout telt één keer mee per doelteken. Na drie fouten op hetzelfde doelteken komt de vingerzone groter in beeld.
5. **Ontgrendelen bij minstens 80% nauwkeurigheid in één ronde.** Onder 70% stellen we dezelfde les nog eens voor; ertussen zeggen we "bijna". Geen sterren of cijfers in de UI.
6. **Eigen SVG-toetsenbord** met een vaste kleur én een tekstlabel per vinger, zodat de aanwijzing niet van kleur alleen afhangt. Geen externe afbeeldingen.
7. **Geen schermtoetsenbord.** Op een aanraakscherm zonder toetsaanslag tonen we een melding dat een toetsenbord nodig is.
8. **Lokaal, profielklaar log** onder `games.typepret.v2` met `profileId: "local"`, afgeronde lessen, beste nauwkeurigheid per les en maximaal 200 rondes, volgens ADR 0026. Er is geen backend en geen analytics.
9. **Geen spraak of geluid in de eerste versie** (`speech: visual`).

## Gevolgen

- Geen nieuwe dependency; de bundel groeit alleen met eigen code.
- Spaties, zinnen, de bovenste en onderste rij en hoofdletters horen niet bij deze versie.
- De drempels (`UNLOCK_ACCURACY`, `RETRY_ACCURACY`) staan als constanten in de entity en zijn na een speelsessie met kinderen aan te passen.
- Keybr (AGPL-3.0) blijft alleen een referentie voor een latere adaptieve lesopbouw; er is niets van overgenomen.
