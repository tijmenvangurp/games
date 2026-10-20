# ADR 0024: Vier op een Rij als lokaal tweespelersspel

- **Status:** Aangenomen
- **Datum:** 2026-10-20

## Context

De app had alleen spellen voor één speler. De kinderen van de eigenaar (6 en 8 jaar) spelen
graag samen op één tablet of telefoon. Gevraagd is een klassiek bordspel met eigen, Nederlandse
namen, zonder merknamen of logo's, met de spellogica in de vorm van boardgame.io's `G` en
`Moves`: een pure toestand en pure functies, zodat een engine er later omheen kan.

Vier op een Rij is de eerste kandidaat: de regels zijn in één zin uit te leggen, een potje duurt
kort en er is geen verborgen informatie. Pionnenrace (mens-erger-je-niet) en Ganzenbord volgen
mogelijk later.

De eisen:

- twee spelers op hetzelfde apparaat, om de beurt;
- een stand die een reeks potjes bijhoudt;
- twee bordgroottes, zodat de jongste op een kleiner bord kan spelen;
- fully client-side: geen backend, geen netwerk, binnen de CSP;
- de regels staan in de app zelf, want een kind van zes leest geen handleiding.

## Beslissing

1. **Het spel heet _Vier op een Rij_.** Dat is de generieke Nederlandse naam; er is geen
   merknaam, logo of beschermde vormgeving in het spel, de iconen of de thumbnail.
2. **Twee bordgroottes.** `groot` is 7 × 6 (het standaardbord) en `klein` is 6 × 5 voor de
   jongste speler. Vier op een rij wint horizontaal, verticaal of diagonaal. Het bord is
   kolom-georiënteerd (`board[kolom][rij]`, rij 0 onderaan); een tik op een kolom laat de schijf
   op de laagste vrije rij vallen.
3. **Geen game-engine als dependency.** De toestand en de zetten staan als pure functies in
   `libs/entities/four-in-a-row` (`createGame`, `applyDrop`, `undoDrop`, `isFinished`,
   `winnerOf`, `startingPlayerAfter`); de UI gebruikt de bestaande Zustand-store van de feature.
   `boardgame.io` (0.50.2, november 2022) is overwogen en in een proefproject getest: het werkt
   met React 19 en Vite, maar de React-client kost 40 kB gzip (inclusief een ongebruikte
   socket.io-transport) en vervangt ongeveer honderd regels beurt- en undocode. De spellogica,
   de UI en de opslag blijven eigen werk, en de engine is op netwerk, fasen en verborgen
   informatie gericht, die deze app niet gebruikt. De API-vorm van `G` en `Moves` blijft
   behouden, zodat een engine later alsnog kan worden ingepakt. Zie
   [research/2026-10-20-boardgame-io.md](../research/2026-10-20-boardgame-io.md) en
   **Bibliotheken eerst** in `AGENTS.md`.
4. **De stand staat lokaal.** De feature bewaart `{ settings, score }` onder
   `games.vier-op-een-rij.v1`; bij het laden wordt de opslag gevalideerd en anders genegeerd.
   Ongedaan maken verandert de stand niet.
5. **De verliezer begint de volgende partij.** Dat houdt het eerlijk tussen twee kinderen zonder
   dat iemand hoeft te onderhandelen. Bij gelijkspel wisselt de starter. De allereerste partij
   begint speler één (Blauw).
6. **De speler die aan de beurt is, krijgt neutrale nadruk.** Indigo is de kleur van speler één
   (`--player-one`), niet van "actief"; de actieve kaart gebruikt daarom een donkere rand en het
   `muted`-vlak. Speler twee is klei (`--player-two`). Groen, amber en rood blijven gereserveerd
   voor feedback.
7. **De uitslag komt pas na 600 ms.** De winnende rij licht eerst op, daarna opent het
   vieringsvenster met "Nog een potje", "Andere grootte" en "Naar het menu".
8. **Geen spraak.** Er is geen leertekst om voor te lezen; het bord en de schijven zijn visueel.
   De catalogus vast dat met `speech: { kind: "visual", reason: … }` en de pagina zet
   `showSpeech={false}`.
9. **De thumbnail is lokaal.** Een 800 × 500 JPEG in `apps/games/public/thumbnails`, met de
   eerste acht tekens van de sha256 in de bestandsnaam, vastgelegd met Playwright.

## Gevolgen

- De app blijft statisch: geen backend, geen account, geen netwerkverkeer tijdens het spelen.
- De stand is per apparaat en per browser. Delen tussen apparaten kan pas met de optionele sync
  uit ADR 0012/0013 en valt buiten dit spel.
- De pure regels zijn los te testen (21 unit-tests) en later door een engine te vervangen; de
  feature kent alleen `start`, `drop`, `undo` en `resetScore`.
- `Ongedaan maken` is alleen beschikbaar zolang een partij loopt en verandert de stand niet; na
  een gewonnen partij blijft de uitslag staan tot de volgende start.
- Een tweede bordgrootte is alleen een andere `BOARD_SHAPES`-waarde; nieuwe groottes vragen geen
  wijziging in de UI.
- De kwaliteitsgate dekt de entity, feature, page, route, catalogusentry, opslag, thumbnail en
  de e2e-flow op 390 px en 1024 px, inclusief tikdoelen van minimaal 44 px.
