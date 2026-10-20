# Onderzoek: boardgame.io voor de bordspellen

- **Datum:** 2026-10-20
- **Status:** Onderzocht, bewust niet toegevoegd. Herzieningsmomenten staan onderaan.
- **Vraag:** kan [boardgame.io](https://boardgame.io) Vier op een Rij en toekomstige
  bordspellen (Pionnenrace, Ganzenbord) simpeler maken, zodat we minder eigen code
  onderhouden?

## Wat is het

boardgame.io is een turn-based game-engine met een state model (`G` + `ctx`), `moves`,
beurtvolgorde, fasen, undo/redo, verborgen informatie per speler (`PlayerView`), multiplayer
via socket.io en een MCTS-bot. De nieuwste npm-release is **0.50.2 van 10 november 2022**. De
GitHub-repository is nog actief (dependabot en tooling-updates tot september 2026), maar er is
sinds 2022 geen release meer geweest.

## Wat ik heb getest

In een los proefproject (`/tmp`, buiten deze repository):

- boardgame.io 0.50.2 met **React 19.3.1** en **Vite 8.3.4**, productiebuild en een echte
  browser (Playwright).
- Een klein spel met één move, `maxMoves: 1` en een `endIf`.
- Resultaat: **het werkt**. Het bord rendert, een zet past `G` aan, de beurt wisselt en
  `client.undo()` werkt. Geen console-fouten. `tsc --strict` is groen.
- Eén valkuil: de React-API is een **factory**, geen component.

  ```tsx
  // Goed
  const App = Client({ game, board, debug: false });

  // Fout (en de React 19-typen wijzen dit terecht af)
  <Client game={game} board={board} />;
  ```

  De tweede vorm geeft een kale functie als React-child en rendert niets.

## Meting

| Wat                       | Uitkomst                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------- |
| React-client in de bundel | +130,6 kB minified, **+40,3 kB gzip**                                                   |
| Daarin ongebruikt         | socket.io-client, engine.io en websocket (ook bij lokaal spelen), redux, immer          |
| Vervangt                  | beurtwissel, undo/redo, eindcondities, fasen, spelersvalidatie, optioneel netwerk en AI |
| Vervangt niet             | spellogica (vallen, winstherkenning), bordopbouw, UI, lokale instellingen en stand      |

Voor Vier op een Rij is de vergelijking concreet:

- 297 regels entity (waarvan 109 pure bordregels die je met of zonder engine schrijft) en
  171 regels model.
- boardgame.io kan vooral `game.ts` (beurtwissel, undo, uitslag) en de store-acties
  `drop`/`undo` vervangen: **ongeveer honderd regels**.
- De UI (322 regels), de opslag (55 regels) en de spellogica blijven eigen werk.
- Netto: circa 10% minder eigen code, +40 kB gzip en een tweede stateparadigma naast Zustand.

## Waarom niet nu

1. **Deze spellen zijn hot-seat op één apparaat.** Geen server, geen netwerk, geen accounts;
   de kracht van de engine (transport, lobby, bots, verborgen informatie) blijft ongebruikt.
2. **De winst is klein.** Een beurtwissel is één veld in de store; undo is vijftien regels.
3. **Eén patroon voor alle spellen.** Zustand in `model/` en pure regels in `entities/` volgen
   de FSD-afspraken, de tests en de rest van de app. Een engine naast dat patroon betekent twee
   manieren om hetzelfde te doen.
4. **De bundel groeit** met 40 kB gzip, inclusief socket.io voor een transport dat we niet
   gebruiken.
5. **De release is vier jaar oud** en de React-laag heeft een eigenaardige factory-API.

## Wanneer opnieuw kijken

- Een spel met **verborgen informatie per speler** (kaarten, geheime rollen) waarbij
  `PlayerView` echt werk wegneemt.
- Een spel met **duidelijke fasen en drie of vier spelers**, zoals Pionnenrace.
- **Online of op twee apparaten** spelen. Dat vraagt eerst een ADR over een backend en mag nu
  niet.
- Als we **drie of meer turn-based bordspellen** hebben en dezelfde beurt-, undo- en
  uitslagcode zich begint te herhalen.

## Alternatieven

- **Zustand + pure regels (huidig).** Minste code, één patroon, geen extra bundel. Blijft de
  keuze voor Vier op een Rij, Pionnenrace en Ganzenbord.
- **`boardgame.io/core` zonder React-client.** Levert vooral typen en hulpfuncties; beurtwissel
  en undo moet je alsnog zelf schrijven. Geen winst.
- **`zundo`** (undo/redo-middleware voor Zustand, klein). Interessant zodra meer spellen undo
  krijgen; nu heeft alleen Vier op een Rij het nodig en daar is het vijftien regels.
- **XState.** Voor fase- en statusmachines; meer concepten en code dan deze spellen vragen.
- **motion (framer-motion).** Zou animaties kunnen vervangen, maar de bestaande CSS-keyframes
  zijn klein en de bibliotheek is groot. Niet nodig.

## Conclusie

Niet toevoegen. De engine lost een probleem op dat deze app niet heeft (netwerk, fasen,
verborgen informatie) en kost 40 kB gzip plus een tweede patroon voor ongeveer honderd regels
minder eigen code. De API-vorm van `G` en `Moves` blijft in `libs/entities/four-in-a-row` staan,
zodat een engine later alsnog kan worden ingepakt zonder de UI te wijzigen.
