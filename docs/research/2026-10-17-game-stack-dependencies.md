# Onderzoek: dependencies voor de game-stack

- **Datum:** 2026-10-17
- **Status:** Onderzoek, geen beslissing. Let op: `AGENTS.md` zegt sinds 2026-10-20 dat je altijd eerst een bestaande library zoekt en dat een nieuwe library toevoegen mag zonder toestemming, ook met een grotere bundel. "Voeg nu niets toe" hieronder is daarom een momentopname van 2026-10-17, geen regel.
- **Vraag:** welke dependencies kunnen we toevoegen voor drag-and-drop, animatie, geluid en aanverwante game-UI?
- **Kader:** de regels uit `AGENTS.md` en [ADR 0001](../adr/0001-publieke-statische-spellen-app.md): publiek, statisch, alleen TypeScript, geen externe requests, geen backend, strikte CSP.

## Kort advies

**Voeg nu niets toe.** De vijf huidige spellen (sudoku, pijlen, memory, zoeken, quiz) hebben geen drag-and-drop, animatiebibliotheek of audiolibrary nodig. De bestaande CSS-animaties, SVG en de native `HTMLAudioElement` in `use-pokemon-cry.ts` voldoen en kosten 0 KB extra.

Als een volgend spel het wél nodig heeft:

| Nodig voor                  | Package                               | Versie         | Licentie | Gemeten JS min + gzip                     | Advies                                                                 |
| --------------------------- | ------------------------------------- | -------------- | -------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Drag-and-drop               | `@dnd-kit/core` + `@dnd-kit/sortable` | 6.3.1 / 10.0.0 | MIT      | 14,6 KB                                   | Voorlopig de stabiele keuze.                                           |
| Drag-and-drop (nieuw)       | `@dnd-kit/react`                      | 0.5.1          | MIT      | 34,8–39,4 KB                              | **Nog niet.** 0.x en een open StrictMode-bug.                          |
| Complexe animatie           | `motion`                              | 14.3.0         | MIT      | 35,6 KB (LazyMotion) / 50,2 KB (volledig) | Alleen bij layout-, exit- of gesture-choreografie.                     |
| Lijst/kaarten laten bewegen | `@formkit/auto-animate`               | 0.10.0         | MIT      | 3,3 KB                                    | Goedkope optie voor toevoegen/verwijderen/verplaatsen.                 |
| Geluid                      | geen package                          | —              | —        | 0 KB                                      | Native `HTMLAudioElement` of Web Audio; geen Howler.                   |
| Haptische feedback          | geen package                          | —              | —        | 0 KB                                      | Native `navigator.vibrate`; iOS Safari heeft geen webhaptics.          |
| Geluid met sprites/pooling  | `howler`                              | 2.2.4          | MIT      | 10,2 KB                                   | Alleen met `html5: true`; standaard Web Audio is geblokkeerd door CSP. |
| Feesteffect                 | `canvas-confetti`                     | 1.9.4          | ISC      | 4,4 KB                                    | Optioneel; CSS/emoji is al genoeg.                                     |

**Vermijden voor deze app:** `tone`, `use-sound`, `react-dnd`, GSAP, PixiJS, Phaser, Three.js/R3F en de nieuwe `@dnd-kit/react` zolang de StrictMode-bug niet is opgelost. Ze zijn te zwaar, lossen geen actueel probleem op, of botsen met de CSP.

## Meetmethode

De versies, licenties en publicatiedata komen uit de npm-registry op 2026-10-17. De bundelgroottes zijn zelf gemeten met esbuild 0.28.2:

```sh
esbuild entry.ts --bundle --minify --format=esm \
  --external:react --external:react-dom --outfile=out.mjs
gzip -9c out.mjs | wc -c
```

React en React DOM zijn extern gehouden, omdat de app die al heeft. De getallen zijn de geïmporteerde API's, niet de volledige npm-pakketten. Het zijn indicaties; meet na integratie opnieuw met `pnpm run build` en `gzip`.

Ter vergelijking, de huidige build van `apps/games/dist`:

| Bestand       |  Minified |      Gzip |
| ------------- | --------: | --------: |
| `index-*.js`  | 392.914 B | 123.143 B |
| `index-*.css` |  35.909 B |   7.174 B |

Een extra bibliotheek van 15–50 KB gzip is dus een stijging van ongeveer 12–40% van de huidige JS-bundel. Dat is niet automatisch te veel, maar het is wel de reden om pas te kiezen als een spel de functie echt nodig heeft.

## 1. Drag-and-drop

### Wat we nu hebben

Geen van de huidige spellen sleept. Sudoku, memory, zoeken en de quiz werken met klikken/tikken. Drag-and-drop is dus een **feature voor een toekomstig spel**, niet een ontbrekende basisvoorziening.

### `@dnd-kit/core` (stabiel)

- MIT, peer `react >= 16.8`, keyboard- en pointersensoren, ARIA-ondersteuning en sortable via `@dnd-kit/sortable`.
- Laatste release: 6.3.1 op 2024-12-05. De API is stabiel; de actieve ontwikkeling zit in de nieuwe `@dnd-kit/react`-generatie.
- Gemeten: 12,7 KB gzip voor `DndContext` + `useDraggable` + `useDroppable`; 14,6 KB met `SortableContext` + `useSortable` + `arrayMove`.
- Een rooktest met React 19.3.1, `StrictMode` en jsdom liet de initiële mount zonder fouten renderen. Test echte sleepinteracties alsnog in de browser en met Playwright; jsdom simuleert geen pointergeometrie.

### `@dnd-kit/react` (nieuw)

- MIT, peer `react ^18 || ^19`, actief ontwikkeld. 0.5.1 verscheen op 2026-10-15; de 0.1.x-reeks startte in april 2025 als beta.
- Alleen `@dnd-kit/react` installeren is genoeg; `@dnd-kit/dom`, `@dnd-kit/abstract`, `@dnd-kit/state`, `@dnd-kit/geometry` en `@dnd-kit/collision` komen als dependencies mee. Voor sortable heb je daarnaast `@dnd-kit/helpers` nodig.
- Gemeten: 34,8 KB gzip voor `DragDropProvider` + `useDraggable` + `useDroppable`; 39,4 KB met `useSortable` + `move`. Dat is twee tot drie keer zo veel als de stabiele core.
- **Blocker:** er is een open bug voor React 19 + `StrictMode` ([#2116](https://github.com/clauderic/dnd-kit/issues/2116), 2026-07-31). De `DragDropProvider` kan na de development-only effect replay een vernietigde manager houden, waardoor slepen later faalt. Deze app gebruikt `StrictMode` in `apps/games/src/app/main.tsx`. De fix staat in [PR #2117](https://github.com/clauderic/dnd-kit/pull/2117) maar is nog niet gemerged.
- Daarom: **niet kiezen tot de fix in een release zit**. Daarna is het een goede kandidaat als je de nieuwe, framework-agnostische architectuur wilt.

### Alternatieven

- **Pragmatic Drag and Drop** (`@atlaskit/pragmatic-drag-and-drop` 4.0.0, Apache-2.0): core ongeveer 4,7 KB volgens de documentatie; in onze meting 7,4 KB gzip voor de element-adapter. Framework-agnostisch, snel, maar de accessibility-tooling is optioneel en vraagt eigen bedrading. Voor een kleine React-app is dnd-kit eenvoudiger. Apache-2.0 vraagt bovendien om het bewaren van notices.
- **Motion drag**: leuk voor vrije slepen, maar het heeft geen droppable-registry, geen sortable-model en geen keyboard-DND. Geen vervanging voor dnd-kit.
- **Native HTML5 drag-and-drop**: onbetrouwbaar op touch en slecht toegankelijk. Niet gebruiken; de app is primair voor tablets en mobiel.
- **`react-dnd`**: oude architectuur, extra backend-concepten en touch/a11y-uitdagingen. Niet shortlisten.

**Advies:** gebruik `@dnd-kit/core` + `@dnd-kit/sortable` voor het eerste echte sleepspel. Test op 390 px en 1024 px, met touch, muis en toetsenbord, en met minimaal 44 px touch-targets. Houd de optie open om later naar `@dnd-kit/react` te migreren.

## 2. Animatie

### Wat we nu hebben

De app gebruikt CSS-keyframes en transities in `apps/games/src/app/styles/index.css`:

- `animate-pop` en `animate-rise` voor schermen en feedback;
- een 3D-flip voor memory-kaarten;
- `animate-ping` voor de zoekmarkering;
- een globale `prefers-reduced-motion`-regel die animaties vrijwel uitzet.

Voor de huidige spellen is dat voldoende. Een animatielibrary voegt pas waarde toe bij:

- layout-animaties of gedeelde elementen tussen schermen;
- exit-animaties bij het verwijderen van kaarten of rijen;
- gecombineerde sleep-, hover- en tapgebaren;
- choreografie die met CSS onbeheersbaar wordt.

### Motion (motion.dev)

- MIT, actief (14.3.0 op 2026-10-15; 14.0.0 op 2026-10-02). Peer `react ^18 || ^19`. De 14.x-major is nog maar twee weken oud; wil je stabiliteit boven nieuwheid, overweeg dan 13.5.x of wacht op een patchrelease.
- Hybride engine: waar mogelijk Web Animations API en ScrollTimeline, met JavaScript-fallback voor spring, onderbroken keyframes en gestures.
- API's: `motion`/`m` componenten, `AnimatePresence`, `layout`/`layoutId`, `useScroll`, `useAnimate`, drag/tap/hover.
- Respecteert reduced motion via `<MotionConfig reducedMotion="user">` en `useReducedMotion()`. De bestaande CSS-regel alleen is niet genoeg, omdat Motion zelf JS-animaties draait.
- Tree-shakable en er is een kleine ingang: `motion/react-m` met `LazyMotion`.

Gemeten:

| Import                                                  |    Min + gzip |
| ------------------------------------------------------- | ------------: |
| `motion` + `AnimatePresence` + `useReducedMotion`       |       50,2 KB |
| `m` + `LazyMotion` + `domAnimation` + `AnimatePresence` |       35,6 KB |
| Alleen `useReducedMotion` (volgens de Motion-docs)      | ongeveer 1 KB |

De documentatie noemt ongeveer 5 KB voor de eerste render met `m`, plus 24 KB voor `domAnimation` (sync of async). `domMax` is nodig voor drag en layout en is groter. In een kleine SPA zonder server-side rendering moet je de feature-chunk dus niet vergeten; anders betaal je alsnog de volledige prijs.

Voorbeeld van de zuinige opzet:

```tsx
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import * as m from "motion/react-m";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
```

`strict` laat per ongeluk een zware `motion`-import in een `LazyMotion`-boom falen. Gebruik `m.div` in plaats van `motion.div`. Heb je drag of layout nodig, vervang `domAnimation` dan door `domMax`.

**Advies:** alleen toevoegen als een spel layout-, exit- of gesture-choreografie nodig heeft. Gebruik dan `m` + `LazyMotion` en wrap de app één keer in `MotionConfig reducedMotion="user"`. Laat eenvoudige hover-, flip- en knopanimaties in CSS; meng CSS en Motion niet voor dezelfde property.

### AutoAnimate

- `@formkit/auto-animate` 0.10.0, MIT, 3,3 KB gzip.
- Eén functie of `useAutoAnimate`-ref op een parent; animeert toevoegen, verwijderen en verplaatsen van directe kinderen.
- Respecteert `prefers-reduced-motion` automatisch.
- Geen layout-, exit- of gesture-API; het is een aanvulling, geen vervanging van Motion.

**Advies:** kies AutoAnimate als het enige probleem een lijst of raster is dat soepel moet herschikken. Voor memory-kaarten die alleen omdraaien is het niet nodig.

### React Spring

- `@react-spring/web` 10.1.2, MIT, 17,7 KB gzip.
- Natuurkundige springs, goede keuze als spring-fysica het centrale ontwerp is.
- Importeer niet het rootpakket `react-spring`: dat trekt ook de native-, three-, konva- en zdog-adapters mee. Gebruik `@react-spring/web`.

**Advies:** alleen overwegen als je echt spring-first wilt werken. Motion biedt meer voor minder.

### GSAP

- Krachtig, maar niet MIT (eigen licentie). Voor deze publieke repo vraagt dat een extra licentie- en attributieafweging.
- Geen meerwaarde boven CSS of Motion voor de huidige spellen.

**Advies:** niet toevoegen.

## 3. Geluid

### Wat we nu hebben

`libs/entities/pokedex/model/use-pokemon-cry.ts` gebruikt één hergebruikt `HTMLAudioElement`:

- het bestand staat lokaal in `apps/games/public/pokemon/cries/`;
- de CSP staat media toe via de fallback naar `default-src 'self'`;
- mislukte playback (autoplay, codec) wordt stil genegeerd;
- er is geen library en geen externe request.

Dat is precies goed voor de cries. Het nadeel: één element betekent dat een nieuwe cry de vorige afkapt, en er is geen pooling, fade of sprite-ondersteuning.

### Zonder dependency: Web Audio voor UI-effecten

Korte klik-, goed- en foutgeluiden kun je synthetiseren met de Web Audio API. Dat kost 0 KB aan dependencies, gebruikt geen bestanden en doet geen fetch, dus de CSP blijft ongewijzigd. De context moet pas na een gebruikersactie worden gemaakt of hervat.

```ts
let context: AudioContext | null = null;

function getAudioContext() {
  context ??= new AudioContext();
  return context;
}

export function playTone(frequency: number, duration = 0.12) {
  const audio = getAudioContext();
  if (audio.state === "suspended") void audio.resume();

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const now = audio.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}
```

Dit is een voorbeeld, geen definitieve API. Voeg een globale mute-instelling toe (bijvoorbeeld in de bestaande settings per feature of in een gedeelde store) en respecteer die vóór je een context opent.

Voor lokale audiobestanden met Web Audio-effecten kun je een `<audio>`-element via `createMediaElementSource` routeren. Ook dat doet geen fetch en blijft binnen de CSP, maar het is meer code dan nu nodig is.

### Howler

- `howler` 2.2.4, MIT, 10,2 KB gzip (de documentatie noemt ongeveer 7 KB), geen dependencies, `@types/howler` als dev-dependency.
- Sterk in sprites, pooling, fades, rate en mobiele audio-unlock.
- **CSP-probleem:** Howler laadt audiobestanden in de standaard Web Audio-modus via `XMLHttpRequest`. Deze CSP heeft `connect-src 'none'`, dus die request wordt geblokkeerd. Howler valt niet automatisch terug naar HTML5 Audio als de XHR faalt.
- Workaround: elk `Howl` met `html5: true` maken. Dan gebruikt het een `<audio>`-element en is er geen XHR. Je levert wel een deel van de Web Audio-voordelen in.
- Alternatief is de CSP verruimen naar `connect-src 'self'`. Dat is een beveiligingswijziging en volgens `AGENTS.md` niet toegestaan zonder ADR. Voor deze app is dat niet nodig.
- Laatste release is van 2023-09-19; de repo is nog actief, maar de releasecadans is laag.

**Advies:** niet toevoegen. Als je later sprites of pooling nodig hebt, is `howler` met `html5: true` de enige CSP-veilige route zonder ADR. Gebruik `use-sound` niet: dat is een dunne wrapper om Howler en erft hetzelfde probleem.

### Tone.js en andere

- `tone` 15.1.22, MIT, 5,4 MB unpacked plus `standardized-audio-context`. Bedoeld voor muziek, sequencing en synths. Te zwaar voor korte effecten.
- `use-sound` 5.0.0: wrapper om Howler, geen eigen meerwaarde.
- `standardized-audio-context` / worklets: extra complexiteit en mogelijk extra CSP- en browserafhankelijkheden. Niet nodig.

**Advies:** geen audiolibrary. Houd de cries op `HTMLAudioElement` en voeg eventueel een kleine Web Audio-helper toe voor effecten. Geen `data:`-URI's voor audio: `media-src` valt terug op `default-src 'self'`, en daar zit `data:` niet in. Lokale bestanden zijn het eenvoudigst.

### Haptics

De app heeft al een kleine wrapper in `libs/shared/lib/haptics.ts`: `vibrate(pattern)` voor ruwe patronen en `playHaptic(name)` voor dezelfde semantische namen als `playSound` (`tap`, `select`, `match`, `wrong`, `hint`, `almost`, `win`). Sudoku en Pijlen gebruiken die helper; er is **geen package** nodig.

Wat werkt in oktober 2026:

- **Android/Chromium:** `navigator.vibrate(number | number[])` werkt na een gebruikersactie. Er is geen intensiteit, golfvorm of betrouwbare hardwaredetectie; desktop-Chrome heeft de API maar meestal geen motor.
- **Firefox:** `Navigator.vibrate` is in Firefox 129 verwijderd. Niet op ondersteuning rekenen.
- **iOS/iPadOS Safari:** de Vibration API is nooit geïmplementeerd. De enige native tik is de systeemhaptiek van een `<input type="checkbox" switch>` (Safari 17.4+). Sinds iOS 26.5 speelt die alleen nog bij een echte tik op de switch of het bijbehorende label; een click uit JavaScript is niet genoeg.
- **Toekomst:** de Web Haptics API (`navigator.playHaptics(effect, intensity)` en CSS `@haptic`) is in 2026 voorgesteld, maar nog door geen stabiele browser uitgerold.

Voor iOS bestaan libraries zoals [`@mxerf/tappt`](https://github.com/mxerf/tappt), [`browser-haptic`](https://github.com/KemalEmirhan/browser-haptic) en [`ios-haptics`](https://github.com/tijnjh/ios-haptics). Ze leggen een transparant label met een verborgen switch over een knop. Dat geeft op iOS één vaste tik per echte tap, geen patroon en geen feedback na een `await`. Voor het SVG-bord van Pijlen is zo'n overlay ongeschikt: hij onderschept de pointer-events en de uitkomst (vrij of geblokkeerd) is op dat moment nog niet bekend. Voor losse HUD-knoppen zou het kunnen, maar dat is een aparte proef en geen algemene game-stack-oplossing.

**Advies:** geen haptics-library toevoegen. Houd `playHaptic` als enige ingang, zodat een toekomstige Web Haptics API in één bestand kan worden ingehangen. Als echte iPhone-haptics een producteis worden, prototyp dan `tappt` op losse knoppen en leg de beperkingen in een ADR vast.

## 4. Optionele extra's

| Package                        | Versie          | Licentie     | Min + gzip | Waarvoor               | Advies                                                                  |
| ------------------------------ | --------------- | ------------ | ---------: | ---------------------- | ----------------------------------------------------------------------- |
| `canvas-confetti`              | 1.9.4           | ISC          |     4,4 KB | Viering                | Optioneel; nu doen emoji en CSS het al. Zet het uit bij reduced motion. |
| `@use-gesture/react`           | 10.3.1          | MIT          |     7,2 KB | Gestures               | Niet nodig naast Motion of dnd-kit.                                     |
| `matter-js`                    | 0.20.0          | MIT          |    27,5 KB | 2D-fysica              | Alleen voor een echt fysicaspel; vraagt `@types/matter-js`.             |
| `chess.js`                     | 1.4.0           | BSD-2-Clause |    12,8 KB | Schaakregels           | Alleen als schaken een spel wordt; bord en DND komen er dan bij.        |
| `pixi.js`                      | 8.22.0          | MIT          |      groot | Canvas/WebGL-rendering | Niet nu.                                                                |
| `phaser`                       | 4.2.1           | MIT          |      groot | Volledige 2D-engine    | Niet nu.                                                                |
| `three` + `@react-three/fiber` | 0.186.1 / 9.8.2 | MIT          |      groot | 3D                     | Niet nu.                                                                |
| `kaplay`                       | 3001.0.19       | MIT          |      groot | Arcade-engine          | Niet nu.                                                                |
| `idb-keyval`                   | 6.3.0           | Apache-2.0   |     0,5 KB | IndexedDB              | Niet nodig zolang `localStorage` volstaat.                              |

De engine- en 3D-pakketten zijn niet automatisch verkeerd, maar ze veranderen de architectuur: een canvas/WebGL-spel valt buiten de DOM- en FSD-UI van de rest en vraagt een eigen pagina, inputlaag en testaanpak. Daarvoor is een aparte ADR nodig, niet alleen een dependency.

### Wat is een engine?

Met **engine** bedoel ik een bibliotheek die de spellus en het tekenen overneemt. Hij maakt een canvas- of WebGL-context, draait elke frame `update`/`render`, en beheert scenes, sprites, input, camera, collisions en assets. Je spel leeft dan in de wereld van die bibliotheek.

Voorbeelden:

- **Phaser** — volledige 2D-engine met scenes, physics, input, tilemaps en audio.
- **PixiJS** — snelle 2D-renderer; je schrijft de spellus en spellogica zelf.
- **Kaplay** — lichte 2D-engine voor snelle arcade-achtige spellen.
- **Three.js / React Three Fiber** — 3D-renderer, geen 2D-spelengine.

Dat is iets anders dan de andere lagen:

| Soort         | Voorbeeld              | Wat het overneemt                            | React blijft eigenaar van                       |
| ------------- | ---------------------- | -------------------------------------------- | ----------------------------------------------- |
| Engine        | Phaser, PixiJS, Kaplay | Renderloop, canvas, scenes, input, assets    | Weinig; meestal alleen de mount en communicatie |
| Animatie      | Motion, AutoAnimate    | Overgangen en gestures binnen de DOM         | De DOM, state en componenten                    |
| Drag-and-drop | dnd-kit                | Slepen, droppen, sorteren en toetsenbord-DND | De DOM en de spellogica                         |
| Fysica        | Matter.js              | Botsingen en beweging van lichamen           | De DOM, state en rendering                      |
| Spellogica    | eigen TypeScript       | Regels, zetten, score, generatie             | Alles                                           |

Een engine is dus geen synoniem voor "een spel bouwen". Het is een specifieke keuze om de render- en inputlaag uit handen te geven.

### Geval: Arrows – Puzzle Escape

**Correctie (2026-10-17):** de echte _Arrows – Puzzle Escape_ (Lessmore) is **geen gridspel met losse vakjes**. Het is een **lijnenmaze**: elk level is een handgemaakt figuur (hart, dier, voorwerp) op een stippenraster, opgebouwd uit gebogen pijllijnen. Elke pijl is een polyline met één pijlpunt; een tik laat de hele polyline in de richting van de punt wegvliegen. Als een andere pijl in de baan van de punt staat, kost dat een hart. De speler haalt alle pijlen weg; er is geen timer.

De oude `Pijlen` in deze repo was een **vereenvoudigde gridvariant**. Die is inmiddels verwijderd en vervangen door de lijnenmaze in `libs/entities/arrow`, `libs/features/arrow-game` en `libs/pages/arrow`.

Wat dit betekent voor de architectuur:

- **Geen engine, maar wel SVG.** React + SVG is genoeg voor 100–200 lijnen per level; geen canvas, PixiJS of Phaser.
- **Geometrie in de entity-laag.** Nodig zijn punten, segments, een ray van de pijlpunt naar de rand en segment-intersectie. De vuistregel blijft: verwijderen kan alleen anderen vrijmaken, dus een greedy solver is genoeg.
- **Handgemaakte levels.** De echte game gebruikt duizenden handgemaakte figuren, geen generator. Voor onze app is een kleine set originele figuren (hart, ster, vis, raket, dier) logischer dan een random generator.
- **Hit-targets.** De echte game krijgt kritiek omdat dunne lijnen lastig te raken zijn. Voor kinderen moeten we juist grote onzichtbare hit-areas, zoom en een duidelijke selectie hebben.
- **Geen DND, geen Motion nodig.** Tikken, een CSS/WAAPI-vluchtanimatie en Web Audio voor de plop/whoosh zijn genoeg.

De volledige analyse staat in [Arrows – Puzzle Escape: mechanica en implementatiemodel](2026-10-17-arrows-puzzle-escape.md).

### Wanneer is een engine wél logisch?

Kies een engine alleen als minstens twee van deze punten echt waar zijn:

- er is een doorlopende realtime loop (geen beurten);
- honderden bewegende objecten of deeltjes tegelijk;
- botsingen of fysica moeten elke frame worden berekend;
- de wereld is groter dan het scherm en heeft een camera;
- je hebt custom shaders, tilemaps of een echte sprite-pipeline;
- je wilt scenes, transitions en een asset-loader als vaste structuur.

Voor "allemaal simpele spelletjes" is dat zelden het geval. De complexiteit zit dan in de **regels en levels**, niet in het renderen. Houd die regels in pure TypeScript-entities; dan blijven ze testbaar, en kun je de UI later nog vervangen zonder de spellogica te herschrijven.

## 5. Wat we niet toevoegen

- **Analytics, trackers, CDN's, externe fonts of remote images.** In strijd met ADR 0001 en de CSP.
- **Backend-, account- of multiplayersdk's.** Vraagt een nieuwe ADR en een privacyontwerp.
- **`react-dnd`.** Oude architectuur en geen voordeel boven dnd-kit.
- **GSAP.** Geen MIT-licentie en geen meerwaarde voor deze UI.
- **Howler in de standaardmodus.** Botst met `connect-src 'none'`.
- **Nieuwe `@dnd-kit/react` 0.5.1.** Open StrictMode-bug in een app die StrictMode gebruikt.
- **Lottie/Rive.** Alleen zinvol met echte animatie-assets van een ontwerper; anders betaal je runtime voor niets.

## 6. Impact op de kwaliteitsgate

- Nieuwe packages zijn build-time dependencies; ze doen geen runtime-request en veranderen de CSP niet. Uitzondering is een library die zelf bestanden via `fetch`/XHR laadt, zoals Howler.
- De hierboven aanbevolen kandidaten (Motion, dnd-kit, AutoAnimate, Howler) zijn met de hand te bundelen en hebben geen install-scripts nodig. `pnpm-workspace.yaml` staat alleen builds toe voor `esbuild`, `nx` en `workerd`; controleer bij elke nieuwe package dat er geen postinstall nodig is.
- Voeg alleen dependencies toe via `corepack pnpm add`, commit de lockfile en laat `pnpm run quality:full` draaien.
- Nieuwe code moet via de public API van de slice en binnen de FSD-regels blijven. Een Motion-provider hoort in `apps/games/src/app` (of een eigen provider-slice), een DND-provider per feature, en een audio-helper in `libs/shared/lib`.
- Test drag-and-drop in Playwright, niet alleen in jsdom. jsdom heeft geen echte layout en pointergeometrie.
- Houd de bundel in de gaten. Een redelijke werkregel: maximaal ongeveer 30 KB gzip extra per nieuwe functie, tenzij een spel aantoonbaar meer nodig heeft.

## 7. Installatie (pas bij behoefte)

```sh
# Drag-and-drop
corepack pnpm add @dnd-kit/core @dnd-kit/sortable

# Complexe animatie
corepack pnpm add motion

# Alleen als sprites/pooling echt nodig zijn, met html5: true
corepack pnpm add howler
corepack pnpm add -D @types/howler
```

Gebruik geen `pnpm add` voor de optionele extra's zonder eerst een spel te hebben dat ze nodig heeft. Elke toevoeging moet door `pnpm run quality:full` en de lockfile hoort in de commit.

## 8. Aanbevolen volgorde

1. **Nu:** niets toevoegen. Blijf CSS en de bestaande `HTMLAudioElement` gebruiken.
2. **Bij het eerste sleepspel:** `@dnd-kit/core` + `@dnd-kit/sortable`. Test React 19 StrictMode, touch, toetsenbord en 44 px-targets. Overweeg `@dnd-kit/react` pas na de StrictMode-fix.
3. **Bij complexe animaties:** `motion` met `LazyMotion` + `m` + `domAnimation`, en `MotionConfig reducedMotion="user"`.
4. **Bij geluidseffecten:** een kleine Web Audio-helper in `shared/lib`; geen package. Voeg een mute-instelling toe.
5. **Alleen bij bewezen noodzaak:** Howler met `html5: true`, of een engine/3D-package met een eigen ADR.

## Open vragen

- Welk spel komt hierna? Dat bepaalt of DND en Motion überhaupt nodig zijn.
- Is de volgende game touch-first (tablet/mobiel) of muis-first? Dat beïnvloedt de DND-keuze en de testmatrix.
- Willen we geluid standaard aan of uit, en waar staat die instelling? Nu heeft elke feature een eigen settingsopslag.
- Wat is het bundelbudget? De huidige JS is 123 KB gzip; zonder budget wordt elke toevoeging achteraf moeilijk te beoordelen.
- Moet de app echt offline werken? De assets zijn lokaal, maar er is geen service worker. Dat is een aparte beslissing, geen dependency.

## Bronnen

### Drag-and-drop

- dnd-kit documentatie: <https://dndkit.com/>
- dnd-kit React-quickstart: <https://dndkit.com/react/quickstart>
- dnd-kit changelog: <https://dndkit.com/changelog>
- dnd-kit issue #2116 (React 19 StrictMode): <https://github.com/clauderic/dnd-kit/issues/2116>
- dnd-kit PR #2117 (fix): <https://github.com/clauderic/dnd-kit/pull/2117>
- Pragmatic Drag and Drop: <https://atlassian.design/components/pragmatic-drag-and-drop/about>
- npm: <https://www.npmjs.com/package/@dnd-kit/core>, <https://www.npmjs.com/package/@dnd-kit/react>, <https://www.npmjs.com/package/@atlaskit/pragmatic-drag-and-drop>

### Animatie

- Motion quick start: <https://motion.dev/docs/react-quick-start>
- Motion bundle size: <https://motion.dev/docs/react-reduce-bundle-size>
- Motion LazyMotion: <https://motion.dev/docs/react-lazy-motion>
- Motion accessibility/reduced motion: <https://motion.dev/docs/react-accessibility>
- Motion gestures: <https://motion.dev/docs/react-gestures>
- AutoAnimate: <https://auto-animate.formkit.com/>
- React Spring: <https://www.react-spring.dev/>
- npm: <https://www.npmjs.com/package/motion>, <https://www.npmjs.com/package/@formkit/auto-animate>, <https://www.npmjs.com/package/@react-spring/web>

### Geluid

- MDN Web Audio API: <https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API>
- MDN Autoplay policy: <https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide>
- Howler.js: <https://howlerjs.com/> en <https://github.com/goldfire/howler.js>
- Howler XHR-loadpad: <https://github.com/goldfire/howler.js/blob/master/src/howler.core.js#L2408>
- npm: <https://www.npmjs.com/package/howler>, <https://www.npmjs.com/package/tone>, <https://www.npmjs.com/package/use-sound>

### Haptics

- MDN `Navigator.vibrate()`: <https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate>
- Wingo UI, webhaptics in oktober 2026: <https://wingo-ui.com/blog/web-vibration-api-haptic-feedback>
- Safari `switch`-haptiek en de beperking sinds iOS 26.5: <https://github.com/mxerf/tappt>, <https://github.com/tijnjh/ios-haptics>, <https://github.com/KemalEmirhan/browser-haptic>
- Pulsar Web SDK (vibratiepatronen plus audiosimulatie): <https://docs.swmansion.com/pulsar/sdk/web/>

### Overig

- MDN Content-Security-Policy `connect-src`: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src>
- MDN `prefers-reduced-motion`: <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
- npm-registry (versies, licenties, publicatiedata): <https://www.npmjs.com/>
