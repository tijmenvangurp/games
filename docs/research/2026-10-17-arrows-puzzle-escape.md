# Arrows – Puzzle Escape: mechanica en implementatiemodel

- **Datum:** 2026-10-17
- **Status:** Onderzoek; de lijnenmaze is inmiddels geïmplementeerd in `libs/entities/arrow`, `libs/features/arrow-game` en `libs/pages/arrow`.
- **Aanleiding:** de screenshot van de echte game laat een lijnenmaze zien; de oude `Pijlen` in deze repo was een gridspel.
- **Doel:** vaststellen hoe de echte game werkt, wat daarvan reproduceerbaar is in deze statische React-app, en wat dat betekent voor de implementatie.

## Samenvatting

_Arrows – Puzzle Escape_ (Lessmore) is een **turn-based lijnenpuzzel**, geen gridspel met losse vakjes.

- Elk level is een **handgemaakt figuur** (hart, dier, voorwerp) op een stippenraster.
- Het figuur bestaat uit **pijlen als polylines**: een lijn met bochten en één pijlpunt.
- Je tikt op een pijl. De **hele polyline vliegt** in de richting van de pijlpunt naar buiten.
- Staat er een andere pijl in de baan van de pijlpunt, dan is de zet ongeldig en verlies je een hart.
- Je hebt **drie harten**; bij nul moet je opnieuw beginnen (in de commerciële app eventueel na een advertentie).
- Er is **geen timer**. Je wint door alle pijlen weg te halen.
- De levels zijn **handgemaakt**, niet procedureel gegenereerd. De commerciële app heeft honderden tot duizenden levels en dagelijkse puzzels.

Voor onze app betekent dit: **geen engine, geen canvas, geen DND**. React + SVG + pure geometrie is genoeg. De oude gridversie is inmiddels vervangen door deze lijnenmaze.

## 1. Bronnen en methode

Ik heb gebruikgemaakt van:

1. **Officiële storeteksten** van Google Play en de App Store.
2. **Officiële screenshots** van Google Play, in hoge resolutie bekeken.
3. **Gameplayvideo’s** van derden, waarvan ik frames heb uitgelezen met `yt-dlp` en `ffmpeg`.
4. **Reviews en gidsen** van derden, alleen als aanvulling op wat de officiële bronnen en video laten zien.
5. **De huidige code** in deze repo, om de kloof met onze implementatie te bepalen.

De belangrijkste video is [Arrows – Puzzle Escape: Level 1–15 Walkthrough](https://www.youtube.com/watch?v=h6fC76FuT94). De hieronder genoemde tijdstippen zijn bij benadering en dienen als verwijzing naar de frames.

### Wat zeker is

- Pijlen zijn lijnen met bochten en één pijlpunt.
- Een tik laat de hele pijl in de richting van de punt wegvliegen.
- De baan van de pijlpunt moet vrij zijn.
- Drie harten; een foute tik kost een hart.
- Geen timer; alle pijlen weg is het doel.
- Levels zijn figuren op een stippenraster.
- De levels zijn handgemaakt.

### Wat waarschijnlijk is, maar niet hard is bevestigd

- Een geblokkeerde pijl blijft staan; alleen de tik mislukt. De gidsen zeggen “the move fails” en “the arrow stays put”; de video bevat geen foutmoment.
- Alleen de **baan vóór de pijlpunt** telt voor collision. De gidsen beschrijven “trace the lane from the arrowhead”. **Correctie (2026-10-17):** dit volgen we nu. De pijl glijdt als een slang langs zijn eigen polyline naar buiten, dus hij bezet alleen nieuwe cellen vóór de punt; zie 5.2.
- De rode pijlen in de Play Store-screenshot met één hart zijn een **hint- of foutmarkering**. Niet duidelijk welke van de twee; in onze app kiezen we één eenduidige betekenis.
- Undo herstelt geen hart. Onbekend; we kiezen in onze app voor “undo herstelt de pijl, niet het hart”.

## 2. De kernlus

1. Level start met een figuur van pijlen en drie harten.
2. Speler tikt op een pijl.
3. De game controleert of de baan van de pijlpunt tot de rand vrij is.
4. Vrij: de hele polyline vliegt in die richting weg; de pijl verdwijnt; de progressie gaat omhoog.
5. Geblokkeerd: de pijl beweegt niet (of schudt kort); de speler verliest een hart.
6. Bij drie fouten is het level mislukt en moet de speler opnieuw beginnen.
7. Alle pijlen weg: korte viering (“Excellent!”, “Brilliant!”, confetti) en door naar het volgende level.

De officiële beschrijving noemt dit “extract each arrow without causing a collision”, “no timers” en “a hint system”. De App Store-review bevestigt drie harten en dat een verkeerde tik een hart kost.

## 3. Levelvorm en beeldtaal

De beste bron is de video en de Play Store-screenshots. Wat opvalt:

- **Stippenraster.** Achter de pijlen staat een regelmatig raster van kleine stippen. Dit is geen decoratie: het helpt de speler rijen en kolommen zien. Een App Store-review noemt dit expliciet.
- **Orthogonale lijnen.** De pijlen bestaan uit horizontale en verticale segmenten met 90°-bochten. De pijlpunten wijzen naar boven, rechts, onder of links.
- **Figuren.** De levels vormen herkenbare silhouetten: een hart, een vierkant, een dier, een voorwerp. De vormen zijn gevuld met pijlen, niet met losse tegels.
- **Minimalistisch.** Zwarte lijnen op wit, veel witruimte, geen drukke UI. Kleur wordt spaarzaam gebruikt: blauw voor een vliegende pijl, rood voor een hint/fout, groen voor succes.
- **Pijlen kunnen dicht bij elkaar liggen.** Daardoor is raken lastig; de reviews klagen over “per ongeluk de buurpijl raken”. Dat is een hit-target-probleem, geen spellogicaprobleem.

De video laat achtereenvolgens zien:

- ±0:00 – levelintro “Arrows / Level 1 / Play”, met Home, Level 10, Level 20 en Settings.
- ±0:10 – een paar pijlen op een stippenraster; één pijl licht blauw op en vliegt weg.
- ±0:20 – “Excellent!” na het leegmaken.
- ±0:50–1:30 – een dichter vierkant figuur; de figuur verdwijnt stukje bij beetje.
- ±1:40 – een hartvormig figuur.
- ±2:30–3:30 – hardere levels met “Hard” boven de harten en een voortgangsbalk.
- ±4:00 – één hart over, een rood omrande pijl en een blauwe pijl die wegvliegt.

De Play Store-screenshot met het hart laat goed zien hoe dicht de lijnen op elkaar kunnen zitten. De screenshot met één hart en rode pijlen lijkt een hint of foutfeedback te tonen; de exacte betekenis is niet hard te bevestigen.

## 4. UI, progressie en monetisatie

### Schermen

- **Levelintro:** logo, levelnummer, grote “Play”-knop. Onderaan een navigatiebalk met Home, Level 10, Level 20 en Settings. De levels zijn in tientallen gegroepeerd; verder gelegen checkpoints zijn op slot.
- **Speelscherm:** terugknop, undo/restart, drie harten, een dunne voortgangsbalk en soms een moeilijkheidslabel (“Hard”). Rechtsonder een instellingenknop.
- **Levelafsluiting:** korte tekst (“Excellent!”, “Brilliant!”) en confetti; daarna het volgende level.
- **Hints:** de storetekst noemt een hintsysteem. In de screenshot met één hart zijn twee pijlen rood omrand; dat is waarschijnlijk de hint- of foutweergave.

### Progressie

- De commerciële app heeft honderden tot duizenden levels. Een externe gids inventariseert 1000 levels en deelt ze in als easy, medium, hard en nightmare; dat is een gidsindeling, geen officiële indeling.
- Er zijn dagelijkse puzzels en checkpoints per 10 levels.
- Geen timer; de uitdaging zit in de volgorde, niet in snelheid.

### Monetisatie (niet overnemen)

- De app is gratis met advertenties en in-app aankopen.
- Bij lege harten kan de speler in de commerciële app een advertentie kijken om verder te gaan.
- Onze app is publiek, statisch en zonder tracking; **geen advertenties, geen IAP, geen analytics**. Wij kiezen voor gratis hints en opnieuw beginnen.

## 5. Implementatiemodel voor onze app

### 5.1 Datamodel

Een level is een set pijlen op een orthogonale lattice:

```ts
type Point = { x: number; y: number };

type ArrowDirection = "up" | "right" | "down" | "left";

interface MazeArrow {
  id: number;
  /** Punten op het raster; laatste punt is de pijlpunt. */
  points: readonly Point[];
  /** Afgeleid uit de laatste twee punten; apart opslaan mag, maar is dubbel. */
  direction: ArrowDirection;
}

interface MazeLevel {
  id: string;
  name: string;
  /** Raster in beeldpunten of lattice-eenheden. */
  width: number;
  height: number;
  spacing: number;
  arrows: readonly MazeArrow[];
}
```

Regels:

- Minimaal twee punten per pijl.
- Alle segmenten zijn horizontaal of verticaal.
- De richting is de richting van het laatste segment.
- Pijlen mogen elkaar visueel raken; dat is juist de bedoeling van de figuur.
- Pijlen mogen niet volledig over elkaar heen liggen; dat maakt hit-testing en collision onvoorspelbaar.

### 5.2 Collision

**Runtime (sinds 2026-10-17).** Een pijl glijdt als een slang langs zijn eigen polyline naar buiten: de kop schuift recht vooruit en het lijf volgt hetzelfde spoor. Daardoor bezet de pijl alleen nieuwe cellen in de **baan vóór de pijlpunt**, en een pijl kan weg zodra die baan vrij is. Een buur die de baan slechts in een hoekpunt raakt blokkeert niet; een buur die de baan echt kruist of er collineair vóór ligt wel. Zie `isArrowRemovable` in `libs/entities/arrow/model/geometry.ts`. Dit vervangt de eerdere regel “het volledige lichaam moet vrij baan hebben”, die te streng was: twee pijlen met naast elkaar liggende, loodrechte punten konden daardoor onnodig geblokkeerd raken.

**Levelgenerator (bijgewerkt).** De generator gebruikt dezelfde baan-regel als de runtime (`isArrowRemovable`). Eerder gebruikte hij een strengere starre sweep (`isArrowRemovableRigid`); die verwijderde onnodig veel pijlen en was een tweede regel die uit de pas kon lopen met het spel. Na het genereren controleert `buildLevel` met `solveMaze` dat het level oplosbaar is. Zo is er één bron van waarheid en is elk level gegarandeerd oplosbaar: de generator bewaart alleen pijlen in de volgorde waarin hij ze kon verwijderen.

Voor elk segment `S` van pijl `A` en elk segment `T` van een andere, nog aanwezige pijl:

1. Schuif `S` met `t ≥ 0` in richting `d` van de pijlpunt.
2. Bepaal of `S(t)` en `T` elkaar voor enige `t > 0` raken.
3. Zo ja, dan is de pijl geblokkeerd.

Omdat alle segmenten orthogonaal zijn, kan dit zonder algemene lijnalgebra:

- **Parallel:** twee horizontale segmenten op dezelfde `y` blokkeren als het bereik van `T` vóór `S` ligt in de schuifrichting; verticaal analoog. Bij loodrechte beweging blokkeert `T` zodra de bewegende lijn zijn `y` (of `x`) bereikt en de bereiken overlappen.
- **Loodrecht:** het kruispunt moet in de schuifrichting vóór `S` liggen en `T` moet `S` in zijn eigen richting echt snijden.

Gebruik een kleine marge voor lijndikte en gedeelde hoekpunten. Contact op `t ≈ 0` (pijlen die op hetzelfde rasterpunt eindigen) telt niet als botsing; zodra de pijl in beweging komt en een ander segment écht kruist, wel.

### 5.3 Solver en hints

Verwijderen kan alleen pijlen vrijmaken; het kan nooit nieuwe blokkades maken. Daarom is een greedy solver compleet:

```ts
function solve(level: MazeLevel): number[] | null {
  const removed = new Set<number>();
  const order: number[] = [];
  while (removed.size < level.arrows.length) {
    const next = level.arrows.find(
      (arrow) => !removed.has(arrow.id) && isRemovable(arrow, level, removed),
    );
    if (!next) return null;
    removed.add(next.id);
    order.push(next.id);
  }
  return order;
}
```

- **Hint:** geef de eerste verwijderbare pijl terug en markeer die in de UI.
- **Validatie:** elk handgemaakt level moet `solve()` succesvol doorlopen.
- **Undo:**houd een stapel verwijderde pijlen bij; undo zet de laatste terug. Herstel geen hart, tenzij we dat expliciet kid-vriendelijk willen.
- **Foutieve levels:** als `solve()` null teruggeeft, is het level onoplosbaar en mag het niet in de build.

### 5.4 Levelontwerp

De echte game is handgemaakt. Voor onze app is een kleine set originele figuren beter dan een random generator:

- Begin met 10–12 levels: hart, ster, vis, raket, boom, kat, huis, bloem.
- Teken de figuur eerst als silhouette op een raster; verdeel de lijnen daarna in pijlen.
- Zorg dat elke pijl precies één pijlpunt heeft en dat de figuur uit losse polylines bestaat.
- Valideer met de solver en met de hand: elke pijl moet ooit verwijderbaar zijn.
- Houd de eerste levels klein (5–10 pijlen), daarna 15–30 pijlen.
- Geen levels, shapes of artwork uit de commerciële game kopiëren. De mechanica mag je namaken; de figuren en levelbestanden niet.

Een levelbestand kan gewoon TypeScript zijn:

```ts
export const heartLevel: MazeLevel = {
  id: "heart-01",
  name: "Hart",
  width: 24,
  height: 24,
  spacing: 24,
  arrows: [
    {
      id: 1,
      direction: "up",
      points: [
        { x: 8, y: 18 },
        { x: 8, y: 8 },
      ],
    },
    // ...
  ],
};
```

Voor grotere aantallen is een klein editor-script handiger, maar dat is pas nodig als de set groeit.

### 5.5 Rendering en animatie

- **SVG**, geen canvas. Een level met 100–200 lijnen is voor SVG geen probleem.
- Achtergrond: `<pattern>` met kleine stippen, zoals de echte game.
- Per pijl een `<g>` met:
  - een zichtbare `<polyline>` of `<path>` met ronde of vierkante uiteinden;
  - een pijlpunt (marker of apart pad);
  - een onzichtbare, veel dikkere hit-area (`stroke="transparent"`, `strokeWidth={24–32}`) voor touch.
- Tik/klik op de groep start de vlucht:
  - CSS/WAAPI: `transform: translate(...)` in de pijlrichting tot buiten het scherm;
  - daarna uit de DOM verwijderen;
  - optioneel een korte trail of deeltjes.
- Bij een geblokkeerde tik: korte schud/rode flits, hart omlaag, pijl blijft staan.
- Bij winst: confetti/deeltjes en “Excellent!”.
- `prefers-reduced-motion`: geen lange vlucht, alleen fade.

### 5.6 Geluid

- Korte Web Audio-pop/whoosh bij een geslaagde zet.
- Lage fouttoon bij een geblokkeerde zet.
- Korte drieklank bij winst.
- Globale mute-toggle, zoals de bestaande `SoundToggle`.
- Geen audiobestanden nodig voor de basis; later kan een ambient loop als lokale asset.

### 5.7 Toegankelijkheid en touch

- De echte game is lastig te raken op kleine schermen. Wij moeten het beter doen:
  - hit-area minimaal 24–32 px rond de lijn, ook al is de zichtbare lijn 3–4 px;
  - geselecteerde pijl duidelijk highlighten;
  - 44 px waar knoppen dat toelaten;
  - zoom/pinch of een “pas aan scherm aan”-knop voor grote figuren;
  - toetsenbordnavigatie: elke pijl is een focusbare groep met Enter/Space;
  - `aria-label` met richting en positie.
- Undo en hint moeten altijd bereikbaar zijn; geen straf voor een verkeerde tik als het kind nog aan het leren is. Overweeg een “oefenmodus” zonder harten.

## 6. Gap met de oude gridimplementatie

De oude `Pijlen` in deze repo:

- `libs/entities/arrow` – gridmodel: `Arrow { row, col, direction }`, collision via rij/kolom.
- `libs/features/arrow-game` – Zustand-store, CSS-gridbord, hearts, hint, restart.
- `libs/pages/arrow` – pagina op `/pijlen`.

Dat model kon **niet** de figuren, bochten of vrije lijnposities van de echte game representeren. De concepten (verwijderen, blokkades, hearts, hint) zijn herbruikbaar, maar de entity en renderer moesten opnieuw.

Inmiddels is de gridversie verwijderd en vervangen door:

- een `arrow`-entity met punten, segments, ray-collision, solver en contour-gegenereerde figuren;
- een SVG-board met stippenraster en nearest-arrow hit-testing;
- levels uit originele silhouetten (hart, ster, vis, huis, boom, raket, kat, bloem, maan);
- een levelintro, levelselect, hearts, hint, undo en voortgang;
- dezelfde Web Audio-effecten als de rest van de app.

De levels zijn originele figuren. De mechanica is nagebouwd; er zijn geen levels of artwork uit de commerciële game overgenomen.

## 7. Prototype en implementatie

De eerste versie is geïmplementeerd volgens deze stappen:

1. **Static renderer:** SVG met stippenraster en hit-areas.
2. **Collision + solver:** pure functies en tests op alle levels.
3. **Interactie:** tikken, wegvliegen, hearts, hint, undo, winst en verlies.
4. **Figuren:** negen originele silhouetten plus een groter hart.
5. **Testen:** 390 px en 1024 px, touch, toetsenbord, reduced motion.
6. **Beslissing:** de lijnenmaze vervangt de grid-Pijlen.

Een volgende ronde kan de figuren dichter maken (meer contourlagen), meer originele silhouetten toevoegen en de levelprogressie verfijnen.

## 8. Open vragen

- **Hoeveel levels?** Beginnen met 10–12 figuren, of meteen een editor/generator? De eerste versie heeft 10 levels.
- **Dichtere figuren?** Meer contourlagen maken de figuren voller, maar ook moeilijker. Nu lopen de levels op van een outline naar een gevulde figuur.
- **Hints:** onbeperkt gratis (kindvriendelijk) of een beperkte voorraad?
- **Harten:** drie harten en opnieuw beginnen, of een vergevingsgezinde oefenmodus?
- **Zoom:** vaste fit-to-width, of pinch-to-zoom zoals de echte game?
- **Thema’s:** dieren, ruimte, zee, voertuigen? En welke originelen tekenen we zelf?
- **Undo en harten:** herstelt undo een hart of alleen de pijl? Ik adviseer alleen de pijl.

## Bronnen

### Primair

- Google Play, _Arrows – Puzzle Escape_: <https://play.google.com/store/apps/details?id=com.ecffri.arrows>
- App Store, _Arrows – Puzzle Escape_: <https://apps.apple.com/us/app/arrows-puzzle-escape/id6748397500>
- Lessmore, uitgever: <https://lessmore.games/>
- Play Store-screenshots (hoge resolutie): de screenshot-URL’s op de Play Store-pagina; in dit onderzoek opgeslagen als `shot1`–`shot5`.
- Gameplayvideo, _Arrows – Puzzle Escape: Level 1–15 Walkthrough_: <https://www.youtube.com/watch?v=h6fC76FuT94>
  - ±0:00 levelintro
  - ±0:10 eerste pijl vliegt weg
  - ±0:20 “Excellent!”
  - ±0:50–1:30 dichter figuur
  - ±1:40 hartfiguur
  - ±2:30–3:30 “Hard” en voortgangsbalk
  - ±4:00 één hart, rode markering

### Secundair (alleen als aanvulling)

- LumenPlays, review en beginnerstips: <https://lumenplays.com/games/com-ecffri-arrows>
- Arrows Puzzle Guide, 1000 levels en difficulty-tiers: <https://arrowspuzzleguide.com/>
- Arrow Puzzle, uitleg van het “arrow escape”-genre: <https://arrow-puzzle.com/guides/arrow-escape-game>
- App Store-review over drie harten en de stippenraster: zie de review-sectie op de App Store-pagina.

### Eigen code

- Huidige gridvariant: `libs/entities/arrow`, `libs/features/arrow-game`, `libs/pages/arrow`.
- Onderzoeksdocument dependencies: [2026-10-17-game-stack-dependencies.md](2026-10-17-game-stack-dependencies.md).
