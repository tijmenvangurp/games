# Ganzenbord: libraries en resources voor bord, dobbelsteen en regels

- **Datum:** 2026-11-05
- **Status:** Onderzoek. Nog geen implementatie, keuze of ADR.
- **Aanleiding:** [ADR 0025](../adr/0025-vier-op-een-rij.md) noemt Ganzenbord als mogelijk volgende bordspel na Vier op een Rij. Het eerdere [boardgame.io-onderzoek](2026-10-20-boardgame-io.md) noemt het spel al als kandidaat.
- **Vraag:** welke bestaande libraries en bronnen besparen werk voor een Ganzenbord in deze app, en welke passen binnen de statische opzet zonder backend of externe requests?
- **Kader:** [AGENTS.md](../../AGENTS.md), [ADR 0001](../adr/0001-publieke-statische-spellen-app.md), [ADR 0025](../adr/0025-vier-op-een-rij.md) en de [CSP in `_headers`](../../apps/games/public/_headers).
- **Taal:** ik ga uit van **ganzenbord** (Engels: _Game of the Goose_), niet van een apart spel met de naam “gabzenbord”.

## Samenvatting

1. **Er bestaat geen volwaardige Ganzenbord-library.** Het enige npm-pakket dat zich zo noemt, [`goose-game`](https://www.npmjs.com/package/goose-game), is een CJS-oefening van vier bestanden: geen typen, geen UI, geen beurten, geen Nederlandse regels, een globale module-state en `Math.random`. Spelers gaan als eenvoudige array naar binnen; de standaardregels van het bord ontbreken. Het levert niets dat we niet in een paar honderd regels eigen code kwijt kunnen.
2. **Spelregels en toestand worden eigen werk.** Een pure entity (`createGame`, `roll`, `applyRoll`, `resolveLanding`) past bij het patroon van Vier op een Rij en is met de bestaande `mulberry32`-PRNG deterministisch te testen. Geen engine, geen server, geen `boardgame.io` (zie het eerdere onderzoek: +40 kB gzip en een tweede stateparadigma).
3. **Voor de dobbelsteen is er één serieuze kandidaat: `react-dice-complete` 2.3.2.** ISC, 4,3 kB gzip, TypeScript-typen, twee dobbelstenen, een `rollAll(values)`-API waarmee we de uitkomst uit onze eigen PRNG kunnen forceren, en in een jsdom-test met React 19.3.1 zonder fouten gerenderd. Kanttekeningen: de peer-range noemt React 16–18, de CSS is globaal geïnjecteerd en de UMD-bundel gebruikt `self` (alleen relevant voor SSR).
4. **Het bord hoeft geen library.** 63 vakjes in een spiraal of slangvorm is een korte pure functie plus CSS/SVG. `motion` 14 staat al in de app voor de pion-animatie; `canvas-confetti` voor de finish. `react-spiral-grid` is overwogen en afgevallen: 17 downloads per week, React 17-peer, begint in het midden en sleepbaar/scrollend, zonder nummering of spelbetekenis.
5. **Beeld kan lokaal en vrij.** Fluent Emoji Flat (MIT) heeft `goose`, `duck`, `bridge-at-night`, `castle`, `skull`, `locked` en `star`; Phosphor heeft `Bird`, `Bridge`, `CastleTurret`, `Skull` en `DiceFive`. Voor de pionnen zijn er **publiek-domein-ganzensilhouetten** (`Goose (flipped).svg`, de NIH BioArt-gans) die je per speler kunt tinten. Voor het bord is het **Oud Hollands Ganzenbord** uit het Rijksmuseum gekozen: publiek domein, Nederlands en met alle 63 vakjes. `Ganzenbord_pd.svg` en de andere complete borden (`Game of the Goose.svg`, Scholz, Veluwe) blijven gedocumenteerd als terugvaloptie. Kenney heeft een CC0 _Board Game Pack_ en CC0 casino-audio als we toch kant-en-klare pionnen of dobbelgeluiden willen.
6. **Geluid blijft gesynthetiseerd.** De app heeft al `tap`, `select`, `match`, `hint`, `almost` en `win` in `libs/shared/lib/sound.ts`. Een `roll`-patroon toevoegen is goedkoper en consistenter dan een audiobestand bundelen; het respecteert bovendien de bestaande geluidstoggle.
7. **Kies de regels bewust.** De Nederlandse en Engelse standaard verschillen op kleine punten (doolhof terug naar 37 of 39, wel of niet wisselen bij een bezet vakje, gevangenis als put of als drie beurten overslaan). Voor twee spelers kan de put/gevangenis bovendien in een gelijkspel eindigen. Dat is geen bibliotheekvraag, maar het moet vóór de implementatie worden vastgelegd.

## 1. Context en eisen

Ganzenbord is een klassiek roll-and-move-spel: elke speler gooit, verzet de pion en ondergaat wat er op het vakje gebeurt. De standaardversie heeft 63 vakjes, twee dobbelstenen en 2–6 spelers. In deze app spelen kinderen op één telefoon of tablet, dus hot-seat is genoeg.

| Eis              | Waarde                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Spelers          | 2–4 op één apparaat (het spel zelf ondersteunt 2–6)                                           |
| Leeftijd         | vanaf ongeveer 5 jaar                                                                         |
| Bord             | 63 genummerde vakjes, spiraal- of slangvormig, van buiten naar binnen                         |
| Dobbelsteen      | 2× d6 volgens de standaardregels; 1× d6 is een eenvoudiger variant                            |
| Speciale vakjes  | brug (6), herberg (19), put (31), doolhof (42), gevangenis (52), dood (58), finish (63)       |
| Beurt            | hot-seat, één “Gooi”-knop, daarna automatisch verzetten                                       |
| Platform         | browser, ESM, TypeScript, geen Node-built-ins, geen runtime-netwerk                           |
| CSP              | `default-src 'self'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data:`              |
| Opslag           | `localStorage`, zoals `games.vier-op-een-rij.v1`                                              |
| Toegankelijkheid | 44 px touch-targets, toetsenbord, `aria-live` voor worp en beurt, reduced motion              |
| Bundel           | klein budget; een dobbelsteenlib van 4 kB is acceptabel, 40 kB of meer alleen met goede reden |

De UI is hoe dan ook eigen werk: bord, pionnen, beurtwissel, uitleg, viering en opslag. Een library kan alleen de dobbelsteenanimatie of een engine leveren.

## 2. Werkwijze en verificatie

Op **2026-11-05** heb ik het volgende gecontroleerd:

- npm-registrymetadata via `https://registry.npmjs.org/<pakket>` (versie, publicatiedatum, licentie, dependencies, `peerDependencies`, `types`, `exports`, `unpackedSize`, `fileCount`);
- wekelijkse downloads via `https://api.npmjs.org/downloads/point/last-week/<pakket>`;
- de gepubliceerde tarballs uitgepakt en de dist-bestanden gelezen, inclusief `grep` op `defaultProps`, `PropTypes`, `Math.random`, `new Worker`, `blob:` en `require(`;
- gzip-groottes met `gzip -9c <bestand> | wc -c`, niet via een externe bundle-analyzer;
- GitHub-repo’s, licenties, laatste push en open issues via de GitHub-API;
- een rendered test met **React 19.3.1** en **jsdom** voor de twee kleinste dobbelsteen-componenten;
- de Nederlandse en Engelse Wikipedia-artikelen, de Rijksmuseum- en Wikimedia Commons-metadata en de verwijzing naar het SIAM-artikel over de kansverdeling;
- een eigen simulatie van 30.000 potjes per variant met de regels uit §3, met een vaste `mulberry32`-seed. Die simulatie is **geen bron** voor de spelregels; ze is alleen bedoeld om de speelduur en het gelijkspelrisico in te schatten.

Niet getest: de echte CSS-animatie in een browser, touchgedrag, een productiebuild met Vite en de interactie met de bestaande reduced-motion-provider. Dat zijn logische vervolgstappen vóór de definitieve keuze.

## 3. Regels en bord

De standaardindeling is steeds dezelfde: 63 vakjes, in een spiraal van buiten naar binnen. De Nederlandse Wikipedia noemt 2–6 spelers, twee dobbelstenen en deze speciale vakjes:

| Vakje | Naam       | Werking                                                                     |
| ----: | ---------- | --------------------------------------------------------------------------- |
|     6 | brug       | Ga verder naar 12.                                                          |
|    19 | herberg    | Sla één beurt over.                                                         |
|    31 | put        | Blijf staan tot een andere speler op 31 komt; die neemt de plaats over.     |
|    42 | doolhof    | Terug naar 37 (de Engelse standaard zegt 39).                               |
|    52 | gevangenis | Meestal hetzelfde als de put; sommige edities laten drie beurten overslaan. |
|    58 | dood       | Terug naar het begin.                                                       |
|    63 | finish     | Wie hier als eerste aankomt, wint — mits de worp precies uitkomt.           |

Daarnaast zijn er **ganzenvakjes** op 5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54 en 59. Kom je daarop, dan ga je hetzelfde aantal ogen nog eens vooruit. Dat kan ketenen: 9 → 18 → 27 → 36 → 45 → 54 → 63. Daarom bestaat de bijzondere eerste worp: met twee dobbelstenen en een eerste worp van 6 + 3 ga je naar 26, en met 5 + 4 naar 53. Zonder die regel zou een eerste worp van 9 via de ganzen meteen kunnen winnen.

Gooi je voorbij 63, dan ga je vanaf 63 het overschot terug. Kom je bij dat terugtellen op een gans, dan geldt dezelfde extra verplaatsing achteruit. De Nederlandse Wikipedia noemt verder geen wisselregel bij een bezet vakje; de Engelse standaard zegt dat twee spelers niet op hetzelfde vakje mogen staan en van plaats wisselen.

### Varianten die je bewust moet kiezen

| Variant             | Nederlands gebruik                                | Gevolg voor de app                                                    |
| ------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| Aantal dobbelstenen | Twee is de klassieke standaard; één komt ook voor | Twee is sneller en minder gelijkspelgevoelig; één is simpeler rekenen |
| Doolhof             | Terug naar 37 (NL) of 39 (EN)                     | Kies één waarde en toon die in de spelregels                          |
| Bezet vakje         | Wisselen (EN) of niets (NL)                       | Wisselen is speels, maar maakt de state en de uitleg ingewikkelder    |
| Put en gevangenis   | Overslaan tot iemand je aflost, of vaste beurten  | De aflosregel kan bij twee spelers in een gelijkspel eindigen         |
| Eerste worp 9       | 26 of 53, afhankelijk van de ogen                 | Nodig zodra je twee dobbelstenen en ganzenketens gebruikt             |
| Finish              | Precies gooien, anders terugtellen                | Maakt de laatste beurt spannend; geen “einde bij overschrijden”       |

De **gelijkspelregel** is belangrijk voor een kinderspel. De Nederlandse Wikipedia noemt een kans van ongeveer 23% dat een potje met twee spelers eindigt doordat de één in de put en de ander in de gevangenis zit. Mijn simulatie komt met de hierboven gekozen regels op ongeveer 25% bij één dobbelsteen en 13% bij twee dobbelstenen. De orde van grootte is duidelijk: dit is geen zeldzaam randgeval. Kies dus een huisregel, bijvoorbeeld “na twee beurten ben je vrij”, of detecteer het gelijkspel en bied meteen een nieuw potje aan. Leg de gekozen regel vast in een ADR en toon hem in de app.

### Speelduur (eigen simulatie)

Gemiddeld aantal rondes tot een winnaar, 30.000 potjes per variant, inclusief ganzenketens, terugtellen en de put/gevangenis:

| Spelers | Dobbelstenen | Gemiddeld | Mediaan |  p95 | Gelijkspel |
| ------: | -----------: | --------: | ------: | ---: | ---------: |
|       2 |            1 |      22,4 |    17,5 | 49,5 |      24,8% |
|       2 |            2 |      18,1 |      13 |   48 |      13,2% |
|       4 |            1 |      17,8 |    15,5 | 34,5 |         0% |
|       4 |            2 |      11,7 |     9,3 | 27,3 |         0% |
|       6 |            1 |      14,6 |    13,8 | 22,8 |         0% |
|       6 |            2 |       8,9 |       8 | 17,8 |         0% |

De simulatie gebruikt geen wisselregel bij een bezet vakje, wel de eerste-worp-regel en de echte put/gevangenis-blokkade. De cijfers zijn indicatief. Ze laten vooral zien dat twee dobbelstenen het spel bij vier spelers ongeveer twee keer zo snel maken, en dat de klassieke put/gevangenis bij twee spelers vaak op een gelijkspel uitloopt.

## 4. Kant-en-klare code

### 4.1 npm

| Pakket                      | Wat het is                                                         | Licentie | Omvang / onderhoud                                 | Geschikt?                                                                        |
| --------------------------- | ------------------------------------------------------------------ | -------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`goose-game`][goose]       | Simulatie met `start`, `run` en `somebodyWon`; standaard 70 vakjes | MIT      | 4 bestanden, CJS, geen typen, 9 downloads/week     | **Nee.** Geen UI, geen beurten, globale state, `Math.random`, geen regels        |
| [`boardgame.io`][bgi]       | Turn-based engine met fasen, beurten, undo en netwerk              | MIT      | 0.50.2 (2022), React-client +40,3 kB gzip          | **Nee.** Al onderzocht en verworpen in [dit rapport](2026-10-20-boardgame-io.md) |
| [`@gamepark/rules-api`][gp] | Moderne rules-API voor bordspellen                                 | ISC      | 7.10.0 (2026), 570 kB unpacked, 139 downloads/week | **Nee.** De React-laag hangt aan een Game Park-server, Datadog en i18n over HTTP |
| [`dices`][dices]            | `Math.random()` in elf regels                                      | MIT      | 1.2.0, geen typen                                  | **Nee.** Geen seed, geen meerwaarde                                              |

De conclusie is niet “zelf doen omdat het kan”, maar “er is geen pakket dat de spellogica, de beurten en de Nederlandse regels tegelijk levert”. De spellogica is bovendien klein en goed te testen; dat is precies het deel dat je niet aan een verouderde engine wilt uitbesteden.

### 4.2 GitHub-implementaties

| Repository                                                                                        | Licentie     | Wat het is                                                              | Bruikbaar?                                                                         |
| ------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`rikharink/funcontrol-ganzenbord`](https://github.com/rikharink/funcontrol-ganzenbord)           | MIT          | React + TypeScript, eigenaardige regels, gebruikt `react-dice-complete` | **Als referentie.** Kleine hobby-implementatie, geen tests, geen algemene library. |
| [`TVke/KdGanzenbord`](https://github.com/TVke/KdGanzenbord)                                       | Geen LICENSE | HTML/CSS/JS-schoolproject met een eigen bord                            | **Nee.** Zonder licentie geen hergebruik; alleen naar kijken.                      |
| [`louie1966/ganzenbord`](https://github.com/louie1966/ganzenbord)                                 | Geen LICENSE | Angular 2 uit 2017                                                      | **Nee.** Verouderd en niet gelicenseerd.                                           |
| [`bocaletto-luca/Goose-Game-Two-Player`](https://github.com/bocaletto-luca/Goose-Game-Two-Player) | GPL-3.0      | Browserimplementatie met JS                                             | **Nee.** GPL-3.0 past niet bij de gewenste permissieve opzet.                      |
| [`Finn-Saal/Ganzenborden`](https://github.com/Finn-Saal/Ganzenborden)                             | MIT          | C#-consoleversie                                                        | **Nee.** Verkeerde taal en platform.                                               |

Er is dus geen onderhouden TypeScript-bibliotheek om te adopteren. De MIT-referentie is nuttig om te zien hoe iemand anders de speciale vakjes en de beurtwissel modelleert, maar de code is klein genoeg om zelf op te schrijven en de regels wijken af.

## 5. Dobbelsteen-libraries

### 5.1 Vergelijking

| Pakket                                | Latest (publicatie) | Licentie |                                   Gzip | Typen | React 19 gerenderd | Meerdere dobbelstenen / uitkomst forceren | Onderhoud                          | Verdict          |
| ------------------------------------- | ------------------- | -------- | -------------------------------------: | ----- | ------------------ | ----------------------------------------- | ---------------------------------- | ---------------- |
| [`react-dice-complete`][rdc]          | 2.3.2 (2026-06-23)  | ISC      |                                 4,3 kB | ja    | ja                 | ja / `rollAll(values)`                    | repo-actief, 84 sterren, 18 issues | **Eerste keuze** |
| [`react-dice-roll`][rdr]              | 1.2.2 (2022-05-14)  | MIT      |                                 2,8 kB | ja    | ja                 | één dobbelsteen / `cheatValue`            | laatste push 2024, 41 sterren      | Terugval         |
| [`react-dice-pro`][rdp]               | 1.1.0 (2026-03-12)  | MIT      |                                28,2 kB | ja    | niet getest        | één dobbelsteen                           | 0 sterren, 6 downloads/week        | Nee              |
| [`roll-a-die`][rad]                   | 2.0.1 (2022-06-26)  | MIT      |                                23,6 kB | nee   | n.v.t.             | één dobbelsteen, geen React               | 182 downloads/week                 | Nee              |
| [`@3d-dice/dice-box`][db]             | 1.1.4 (2024-08-24)  | MIT      | 38,7 kB + 84,7 kB world + 11 MB assets | nee   | n.v.t.             | ja, maar 3D/Babylon                       | 5.592 downloads/week, 29 issues    | Nee              |
| [`@randsum/roller`][rand]             | 4.0.0 (2026-07-09)  | MIT      |                        337 kB unpacked | ja    | n.v.t.             | alleen notatie en worpen, geen UI         | 1.410 downloads/week               | Nee              |
| [`@dice-roller/rpg-dice-roller`][rpg] | 5.5.1 (2025-02-08)  | MIT      |                        589 kB unpacked | ja    | n.v.t.             | alleen notatie en worpen, `mathjs`-dep    | 8.451 downloads/week               | Nee              |

De maten zijn van de gepubliceerde dist-bestanden, niet van een online analyzer. `react-dice-complete` is inclusief de geïnjecteerde CSS; `react-dice-roll` is inclusief zijn 3D-CSS.

### 5.2 Wat de test opleverde

Ik heb beide kleine React-componenten in een jsdom-omgeving met React 19.3.1 gerenderd:

- **`react-dice-complete`:** rendert een dobbelsteen van 60 px met `role="button"` en `tabIndex=0`. Geen console-fouten. De UMD-bundel verwijst bij het laden naar `self`; in de browser is dat normaal, in Node moet je het polyfillen. Met `disableIndividual` verdwijnen rol en tabindex, zodat alleen onze eigen “Gooi”-knop de interactie is. `rollAll([3, 5])` forceert de twee waarden en `rollDone(total, values)` geeft ze terug.
- **`react-dice-roll`:** rendert een echte `<button>` met een 3D-dobbelsteen. Geen console-fouten. Het component is één dobbelsteen; twee losse componenten naast elkaar kunnen, maar dan moet je twee `cheatValue`-waarden zetten en twee animaties coördineren. De API heet de forced value `cheatValue`, wat in een kinderspel geen mooie naam is, maar het werkt.

Beide pakketten zijn in deze test niet met een echte Vite-build, touch of reduced motion getest. De conclusie “rendert met React 19” is dus een renderbewijs, geen volledige compatibiliteitsgarantie.

### 5.3 Advies

**Neem `react-dice-complete` als eerste keuze.** Het is klein, heeft typen, ondersteunt twee dobbelstenen, kan de uitkomst van buitenaf krijgen (belangrijk voor een seed en voor tests) en is recent nog onderhouden. De peer-range noemt React 19 niet; pnpm zal daarom waarschijnlijk een waarschuwing geven. Dat is een bekend teken dat de package React 19 niet officieel claimt, niet dat hij niet werkt. Voeg hem pas toe na een korte echte build en een test op 390 px en 1024 px.

Aandachtspunten bij de integratie:

- zet `disableIndividual` aan, zodat de dobbelsteen zelf geen knop is;
- houd de “Gooi”-knop van de app de enige trigger;
- zet `rollTime` op ongeveer 0,6–0,8 seconde in plaats van de standaard 2 seconden;
- geef `rollAll([d1, d2])` de waarden uit `mulberry32`, zodat de worp deterministisch is;
- controleer of de globale klassen `.die`, `.face` en `.dot` nergens botsen (in de huidige code gebeurt dat niet);
- test met `prefers-reduced-motion`; de bibliotheek heeft geen eigen reduced-motion-optie.

**Terugval:** `react-dice-roll` als je één dobbelsteen wilt en een echte `<button>` belangrijk vindt (let op: dit pakket noemt alleen React 16 als peer en heeft geen LICENSE-bestand in de GitHub-repo), of een eigen CSS-dobbelsteen van ongeveer veertig regels als de peer-waarschuwing of de globale CSS toch een probleem blijkt. Een eigen dobbelsteen is geen “not invented here”-reflex: het is een kleine visuele component met zes stipindelingen, en de worp- en spelregels zitten toch al in onze entity.

## 6. Bord, pionnen en animatie

### 6.1 Bord

Een Ganzenbord heeft 63 vakjes. Dat is precies 9 × 7, dus een rechthoekig raster met een spiraal- of slangnummering is de eenvoudigste vorm. De nummering is een pure functie:

```ts
// Schets: een 9×7-raster met de nummers in een spiraal.
// De exacte richting en het startpunt zijn een ontwerpkeuze.
function spiralCells(width: number, height: number): Array<{ x: number; y: number }> {
  // ...

  return [];
}
```

Geen library nodig. `react-spiral-grid` (0.1.9, 2021, 17 downloads/week, peer React 17) legt kinderen in een spiraal neer, maar begint in het midden, maakt het geheel sleepbaar/scrollend en heeft geen nummering of spelbetekenis. Het is een galerijcomponent, geen bord.

Voor de visuele verbinding tussen de vakjes zijn er twee eenvoudige routes:

1. **CSS Grid met 63 cellen** en een absolute pion die per vakje een `transform` krijgt. Het bord is niet interactief, dus de cellen hoeven geen 44 px touch-target te zijn; 36–40 px op een telefoon is genoeg als de “Gooi”-knop groot is.
2. **Eén SVG-pad** door de celcentra, met de pion die via `offset-path` of Motion over het pad beweegt. Dat geeft een mooie kronkelende lijn, maar is meer werk en minder eenvoudig toegankelijk.

Begin met route 1. Een SVG-pad kan later als decoratie worden toegevoegd.

### 6.2 Pion en animatie

- `motion` 14 staat al in de app, met `LazyMotion` en `MotionConfig reducedMotion="user"` in `libs/shared/ui/motion-provider.tsx`. Gebruik de lichte `m`-primitive en animeer de pion met `transform` of `x`/`y`.
- De pion moet van vakje naar vakje kunnen lopen, niet in één sprong. Een kleine `setTimeout`/`animate`-reeks per vakje is visueel leuk, maar moet overslaanbaar zijn en tegen dubbel tikken kunnen.
- `canvas-confetti` is al beschikbaar via `libs/shared/ui/confetti.tsx` voor de finish.
- `@dnd-kit/core` is niet nodig: de speler gooit en de app verzet de pion. Slepen zou alleen verwarring toevoegen.
- Gebruik de bestaande `mulberry32`/`createSeed` uit `@shared/lib/random` voor de worpen. Geen `Math.random` in de spellogica; anders zijn tests en herlaadbare potjes niet deterministisch.

## 7. Beeld- en geluidsbronnen

### 7.1 Iconen

De app heeft drie lokale families. Alle drie zijn al als dependency aanwezig of worden via `@shared/ui` geëxporteerd; er is geen runtime-request nodig.

| Familie           | Licentie | Nuttige namen                                                                                           | Gebruik                                            |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Fluent Emoji Flat | MIT      | `goose`, `duck`, `bridge-at-night`, `castle`, `skull`, `locked`, `star`, `horse`, `circus-tent`, `ship` | Kleurrijke, kindvriendelijke bordvakjes en de gans |
| Phosphor          | MIT      | `Bird`, `Bridge`, `CastleTurret`, `Skull`, `DiceFive`, `DiceSix`, `Trophy`, `Lock`, `Anchor`            | Game-icoon en eenvoudige UI-iconen                 |
| Lucide            | ISC      | `Dice1`–`Dice6`, `Dices`, `Bird`, `Castle`, `Lock`, `Flag`, `Trophy`                                    | UI, knoppen en de “Gooi”-actie                     |

Let op: de bestaande `scripts/build-element-sprites.ts` is gekoppeld aan de Mengelmoes-elementen en schrijft naar `apps/games/public/elements/`. Voor Ganzenbord is een eigen klein lijstje of een aparte generator nodig; je kunt niet zomaar `fluent-emoji-flat:goose` in `ELEMENT_ICONS` zetten zonder de betekenis van die lijst te vermengen. Een losse SVG uit hetzelfde pakket kopiëren mag (MIT, licentie staat al in `LICENSES/`), of je gebruikt Phosphor/Lucide rechtstreeks via React.

### 7.2 Ganzen als pion en als bordversiering

Ja, er zijn bruikbare ganzensilhouetten in het publieke domein en onder CC0. Dat is prettiger dan een eigen tekening: de vorm is herkenbaar, schaalt goed en is meestal één pad dat je per speler kunt tinten.

| Bron                                                                                                                                   | Licentie           | Formaat               | Wat het is                                     | Geschikt voor                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [Goose (flipped).svg](<https://commons.wikimedia.org/wiki/File:Goose_(flipped).svg>)                                                   | **Publiek domein** | SVG 170 × 190, 25 kB  | Eén zwart pad; staande gans, kijkt naar rechts | **Eerste keuze voor de pion.** Vervang `fill:#000000` door `currentColor` en tint hem per speler. |
| [Goose silhouette 02.svg](https://commons.wikimedia.org/wiki/File:Goose_silhouette_02.svg)                                             | **CC0**            | SVG 396 × 504, 17 kB  | Zwarte gans met witte details                  | Alternatief; natuurlijker, maar lastiger egaal te tinten door de witte delen.                     |
| [Goose Silhouette (NIH BioArt 177 - 630230)](<https://commons.wikimedia.org/wiki/File:Goose_Silhouette_(NIH_BioArt_177_-_630230).svg>) | **Publiek domein** | SVG 512 × 512, 3 kB   | Strakke zwarte silhouet                        | Compact alternatief; klein genoeg om ook als favicon of thumbnail te gebruiken.                   |
| [GoosePiece.svg](https://commons.wikimedia.org/wiki/File:GoosePiece.svg)                                                               | **CC BY 1.0**      | SVG 800 × 800, 1,2 kB | Zelfde vorm als de goose van game-icons.net    | Alleen als je die stijl wilt; attributie verplicht.                                               |
| Fluent Emoji Flat `goose`                                                                                                              | **MIT**            | 32 × 32, kleur        | Bruin/oranje gans, vriendelijk en zacht        | Mascotte, bordversiering of thumbnail; minder geschikt als pion omdat hij niet egaal tint.        |
| [Twemoji `1fabf`](https://github.com/jdecked/twemoji)                                                                                  | **CC BY 4.0**      | 36 × 36, kleur        | Witte gans met oranje snavel                   | Vriendelijk kleurenalternatief; attributie verplicht.                                             |
| [OpenMoji `1FABF`](https://openmoji.org/)                                                                                              | **CC BY-SA 4.0**   | 72 × 72, lijn         | Lijnstijl                                      | Liever niet: share-alike maakt de licentie-administratie onnodig ingewikkeld.                     |
| [Openclipart “Goose” 354989](https://openclipart.org/detail/354989/goose)                                                              | **CC0**            | SVG, cartoon          | Grappige cartoon-gans                          | Optioneel; leuk voor een mascotte, minder leesbaar op 32 px.                                      |
| [Openclipart “Goose” 886](https://openclipart.org/detail/886/goose)                                                                    | **Publiek domein** | SVG, gravure          | Fijne etsachtige gans                          | Niet voor kleine pionnen; te veel detail.                                                         |

**Advies voor de pion:** gebruik `Goose (flipped).svg` als bron, optimaliseer hem (SVGO) en zet hem als wit silhouet op een ronde token in de spelerskleur. Dat is precies de klassieke ganzenpion, maar dan vlak en leesbaar. Dezelfde silhouet kan ook de ganzenvakjes op het bord vullen: wit op een gekleurde cel of donker op een lichte cel. Eén publiek-domeinbestand dekt dus zowel de pion als de borddecoratie.

Als je een kleurige, minder strenge gans wilt, is Fluent Emoji Flat (MIT) de veiligste keuze: die licentie staat al in de repo en de stijl past bij Mengelmoes. Twemoji is een goed alternatief, maar vraagt een extra attributiebestand.

Voor de zes gevaren zijn er drie bruikbare families. Fluent is kleurrijk maar heeft geen doolhof; Phosphor is MIT en zit al in de app; game-icons heeft de meest exacte symbolen, maar vraagt attributie.

| Vak           | Fluent Emoji Flat (MIT) | Phosphor (MIT) | game-icons.net (CC BY 3.0)        |
| ------------- | ----------------------- | -------------- | --------------------------------- |
| 6 brug        | `bridge-at-night`       | `Bridge`       | `lorc/bridge`                     |
| 19 herberg    | `bed`                   | `Bed`          | `delapouite/bed` of `tavern-sign` |
| 31 put        | `droplet`               | `Drop`         | `delapouite/well`                 |
| 42 doolhof    | — (geen maze-emoji)     | `Path`         | `lorc/maze`                       |
| 52 gevangenis | `locked`                | `Lock`         | `lorc/imprisoned`                 |
| 58 dood       | `skull`                 | `Skull`        | `lorc/skull-crossed-bones`        |
| 63 finish     | `trophy`                | `Trophy`       | `lorc/trophy`                     |

Voor een kinderspel is de combinatie **Fluent voor de gans en de sfeer, Phosphor voor de gevaren** het eenvoudigst: beide zijn MIT, beide staan al in de repo en je houdt één visuele familie per rol. Wil je de exacte put, het doolhof en de gevangenis, dan zijn de game-icons-symbolen het duidelijkst; voeg dan één attributiebestand toe en gebruik ze als set, niet door elkaar met Phosphor.

### 7.3 Complete borden om te hergebruiken

Er zijn complete Ganzenbord-vectorbestanden in het publieke domein en onder CC0. Ze zijn bruikbaar, maar geen van alle is meteen een eindproduct: ze hebben Engelse tekst, een andere stijl of afwijkende spelregels.

| Bron                                                                                                                                                                                  | Licentie           | Formaat               | Wat het is                                                                                          | Direct bruikbaar?                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [Game of the Goose.svg](https://commons.wikimedia.org/wiki/File:Game_of_the_Goose.svg)                                                                                                | **CC0**            | SVG 744 × 957, 229 kB | Complete 63-vakskaart met grote vector-gans; eigen “roll again”/“go to”-vakjes en Engelse “START”   | **Voor een prototype of als mascottebron.** Geen standaard Nederlandse regels.                               |
| [Ganzenbord_pd.svg](https://commons.wikimedia.org/wiki/File:Ganzenbord_pd.svg)                                                                                                        | **Publiek domein** | SVG 956 × 684, 630 kB | Klassiek kleurrijk bord met standaardgevaren en ganzen; Engelse “Start” en tekst in Times New Roman | **Als referentie of bewerkbare basis.** Niet direct: taal, font en stijl wijken af.                          |
| [Openclipart “Game of the Goose / Ganzenbord” 16559](https://openclipart.org/detail/16559/game-of-the-goose-ganzenbord)                                                               | **Publiek domein** | SVG 117 kB            | Zwart-wit 63-vaks-spiraal; nummers als paden, geen gevaren of ganzen                                | **Als geometrisch sjabloon.** Schoon, maar zelf inkleuren en iconen toevoegen.                               |
| [Rijksmuseum, RP-P-1906-150](https://commons.wikimedia.org/wiki/File:Ganzenbord,_RP-P-1906-150.jpg)                                                                                   | **CC0**            | JPEG 6644 × 5790      | Historisch gedrukt bord                                                                             | **Inspiratie of “museum”-skin**; niet als moderne UI.                                                        |
| [Rijksmuseum, RP-P-1893-A-18144](<https://commons.wikimedia.org/wiki/File:Ganzenbord_met_spelregels_Het_nieuw_en_vermaeckelyck_ghanse-spel_(titel_op_object),_RP-P-1893-A-18144.jpg>) | **CC0**            | JPEG 6520 × 5682      | 17e-eeuwse prent met spelregels                                                                     | **Inspiratie**; de prent zelf is te druk en te oud voor een kinderscherm.                                    |
| [Oud Hollands Ganzenbord](https://commons.wikimedia.org/wiki/File:Oud_Hollands_Ganzenbord,_objectnr_A_41258.tif)                                                                      | **Publiek domein** | TIFF 3508 × 2634      | 20e-eeuws Nederlands bord                                                                           | **Gekozen als bord.** De scan is uitgesneden tot WebP en de 63 vakken zijn met de hand gekalibreerd.         |
| [Joseph Scholz — Ganzenbordspel](https://commons.wikimedia.org/wiki/File:Joseph_Scholz_-_Ganzenbordspel,_Mainz,_circa.jpg)                                                            | **Publiek domein** | JPEG 1218 × 1080      | 19e-eeuws Duits/Nederlands gedrukt bord                                                             | **Terugvaloptie voor een vintage skin.** Authentiek, maar kleine cijfers en veel tekst.                      |
| [Veluwe-spel](https://commons.wikimedia.org/wiki/File:Veluwe-spel.jpg)                                                                                                                | **Publiek domein** | JPEG 1200 × 921       | Nederlands promotiebord met 63 duidelijke vakjes                                                    | **Terugvaloptie voor een retro-Nederlandse skin.** De reclame-illustraties passen minder bij een kinderspel. |
| [Catchpenny print, PRENT 0138](https://commons.wikimedia.org/wiki/File:Het_nieuw_vermakelijk_ganzenspel-Catchpenny_print-PRENT_0138.jpeg)                                             | **Publiek domein** | JPEG 1500 × 1769      | 19e-eeuwse centsprent                                                                               | **Inspiratie.**                                                                                              |

De Rijksmuseum-collectie bevat meerdere CC0-ganzenborden van 5.600 tot 10.600 px; de bovenstaande zijn de meest bruikbare voorbeelden. Ze zijn allemaal te zwaar en te druk voor de app zelf, maar uitstekend om de vakindeling, de ganzenposities en de sfeer op te zoeken.

**Gekozen op 2026-11-06: het Oud Hollands Ganzenbord uit het Rijksmuseum.** De eigenaar koos deze scan als mooiste bord: Nederlands, warm gedrukt en met alle klassieke vakken. Het beeld is uitgesneden tot `apps/games/public/ganzenbord/board.webp` (1800 px breed, ca. 630 kB). De 63 celposities zijn met de hand gekalibreerd en staan in `board-points.ts`; via `/ganzenbord/bord` kunnen ze per toestel worden bijgesteld. `Ganzenbord_pd.svg` blijft in de tabel staan als vectorterugvaloptie, net als de andere borden.

**Advies voor het bord:** het oorspronkelijke advies was een eigen SVG/HTML-bord te tekenen. Dat is niet gevolgd: de eigenaar koos de Oud-Hollandse scan, en die bleek na uitsnijden en handmatige kalibratie goedkoper en mooier dan een eigen vectorkaart. De les voor een volgende kaart: kies eerst het beeld, kalibreer de cellen daarna met een kleine klik- of schuiftool, en houd de posities als percentages zodat ze onafhankelijk van de schermgrootte blijven.

### 7.4 Kant-en-klare assets

| Set                                                               | Licentie  | Wat het levert                                     | Nuttig?                                                             |
| ----------------------------------------------------------------- | --------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| [Kenney Board Game Pack](https://kenney.nl/assets/boardgame-pack) | **CC0**   | 490 bestanden met dobbelstenen, kaarten en pionnen | Optioneel voor pionnen of een testbord; de stijl is minder eigen    |
| [Kenney Casino Audio](https://kenney.nl/assets/casino-audio)      | **CC0**   | 50 geluiden, inclusief dobbelstenen                | Optioneel; de app heeft al een eigen gesynthetiseerd geluidssysteem |
| [game-icons.net](https://game-icons.net/about.html)               | CC BY 3.0 | Monochrome speliconen, onder meer een gans         | Alleen als Fluent/Phosphor niet volstaan; attributie nodig          |

### 7.5 Geluid

De app gebruikt `playSound` met zes patronen. Voeg eventueel een `roll`-patroon toe aan `libs/shared/lib/sound.ts`:

- een korte ratel van drie of vier korte tikken, gevolgd door een lagere “klik”;
- geen bestand, geen netwerk;
- automatisch stil als het kind het geluid heeft uitgezet.

Een audiofragment van Kenney is niet nodig en zou de bestaande mute-instelling omzeilen als je het rechtstreeks afspeelt. Houd het bij de Web Audio-route.

## 8. Aanbevolen opzet

Als de eigenaar na dit onderzoek wil bouwen, is dit de kleinste opzet die bij de repo past:

| Laag                                       | Inhoud                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `libs/entities/ganzenbord`                 | Pure regels: `createGame`, `rollDice`, `applyRoll`, `resolveLanding`, `isFinished`, de veldentabel en de ganzenlijst. Geen React, geen DOM. |
| `libs/features/ganzenbord`                 | Zustand-store, opslag (`games.ganzenbord.v1`), bord, pionnen, dobbelsteen, HUD, spelregelblad en setup.                                     |
| `libs/pages/ganzenbord`                    | Het scherm dat de feature samenstelt.                                                                                                       |
| `apps/games/src/app/router.tsx`            | Route `/ganzenbord`.                                                                                                                        |
| `libs/entities/game/model/game-catalog.ts` | Naam, beschrijving, status, thumbnail en `speech`-metadata.                                                                                 |
| `libs/shared/ui/game-icon.tsx`             | Voeg `ganzenbord: Bird` toe aan `GAME_ICONS`.                                                                                               |
| `docs/adr/00xx-ganzenbord.md`              | Regelkeuze (dobbelstenen, doolhof, put/gevangenis, wisselen), assetlicenties en de gekozen dobbelsteen-library.                             |

De entity volgt het patroon van `libs/entities/four-in-a-row`: een readonly game-object, pure functies en een `rolls`-historie zodat ongedaan maken en tests eenvoudig blijven. De feature volgt `use-four-in-a-row-store.ts`: de store roept de pure functies aan, speelt geluid en haptiek, en bewaart alleen instellingen en stand, niet de volledige partij.

### Voorgestelde regelkeuze voor v1

- **Twee dobbelstenen**, zoals de klassieke standaard. Dat maakt het spel korter en vermindert het gelijkspelrisico.
- **Precies op 63**, met terugtellen bij overschrijding.
- **Ganzenketens** toestaan, inclusief de eerste-worp-regel (9 → 26 of 53).
- **Doolhof terug naar 37** (Nederlandse variant).
- **Put en gevangenis:** twee beurten overslaan, daarna vrij. Dat is een huisregel die het gelijkspel voorkomt; toon hem in het spelregelblad. Alternatief: de klassieke aflosregel plus een expliciete “gelijkspel”-melding.
- **Geen wisselen** bij een bezet vakje in v1. Het is een extra regel om uit te leggen en te testen; later toe te voegen als de kinderen het missen.
- **Geen computertegenstander.** Ganzenbord is bijna volledig geluk; een automaat voegt weinig toe en vraagt wel een beurt-engine. Hot-seat is het doel.

### Testplan

- Pure unit tests per vakje: 6 → 12, 19 → beurt overslaan, 31/52 → vast en aflossen, 42 → 37, 58 → 0, 63 → finish.
- Eigenschapstests: een worp van 2–12 verplaatst altijd 2–12 vakjes, behalve bij een gans, een speciaal vakje of terugtellen.
- Seed-determinisme: dezelfde seed geeft dezelfde reeks worpen.
- Grensgevallen: worp voorbij 63, gans bij het terugtellen, drie ganzen achter elkaar, laatste speler die iedereen aflost.
- Een integratietest voor de store: beurtwissel, undo, opslag en herladen.
- Playwright op 390 px en 1024 px: “Gooi” is minstens 44 px, de pion beweegt zichtbaar, de beurt wisselt en de finish viert.

## 9. Risico’s en open vragen

- **Regelvarianten.** Er is geen één officiële Ganzenbord-regel. Zonder expliciete keuze ontstaat discussie aan tafel en onduidelijke tests. Leg de keuze vast in een ADR.
- **Gelijkspel.** De klassieke put/gevangenis kan bij twee spelers vastlopen. Kies een huisregel of detecteer het en bied een nieuw potje aan.
- **Peer-range van `react-dice-complete`.** De package noemt React 19 niet. Hij rendert in de test, maar een echte Vite-build en een browsercontrole blijven nodig.
- **Globale CSS.** De dobbelsteen injecteert `.die`, `.face` en `.dot`. In de huidige code zijn er geen exacte conflicten, maar een future component met dezelfde klassenaam kan verrassen.
- **Licenties.** De Rijksmuseum-print en de gekozen ganzensilhouet zijn publiek domein of CC0; Fluent/Phosphor zijn MIT. Voeg bij elk gebundeld bestand de bron en licentie toe. Gebruik je Twemoji (CC BY 4.0) of game-icons (CC BY 3.0/1.0), dan is een extra attributiebestand verplicht. Bij een eigen bord en een eigen getekende gans is dat niet nodig.
- **Bundel.** Een eigen SVG-bord met 63 cellen en wat paden is waarschijnlijk groter dan de dobbelsteen-library. Houd het bord als één SVG of als CSS-grid, niet als 63 losse afbeeldingen.
- **Toegankelijkheid.** Het bord is visueel en niet interactief; de belangrijke bediening is de “Gooi”-knop. Zorg voor een `aria-live`-melding als “Jij gooide 8, je staat op 27” en respecteer `prefers-reduced-motion` bij de pion.
- **Naam en merk.** “Ganzenbord” is de generieke Nederlandse naam; er is geen merknaam of logo nodig. Gebruik geen bestaand commercieel bord als huisstijl.
- **Spelersnamen.** Als de setup namen accepteert, behandel ze als tekst en zet ze nooit als HTML in de DOM. Een vaste kleur en “Speler 1” is voor jonge kinderen genoeg.

## Bronnen

- [Ganzenbord — Nederlandse Wikipedia](https://nl.wikipedia.org/wiki/Ganzenbord) (regels, speciale velden, ganzen, eerste worp, gelijkspel)
- [Game of the Goose — English Wikipedia](https://en.wikipedia.org/wiki/Game_of_the_Goose) (geschiedenis, bord, internationale varianten)
- J.F. Groote, F. Wiedijk en H. Zantema, _A Probabilistic Analysis of the Game of the Goose_, SIAM Review 58(1):143–155, 2016, [doi:10.1137/140983781](https://doi.org/10.1137/140983781); [pdf via Nieuw Archief voor Wiskunde](https://www.nieuwarchief.nl/serie5/pdf/naw5-2014-15-4-234.pdf)
- [Rijksmuseum-print RP-P-1893-A-18144 op Wikimedia Commons — CC0](<https://commons.wikimedia.org/wiki/File:Ganzenbord_met_spelregels_Het_nieuw_en_vermaeckelyck_ghanse-spel_(titel_op_object),_RP-P-1893-A-18144.jpg>)
- [Ganzenbord_pd.svg op Wikimedia Commons — publiek domein](https://commons.wikimedia.org/wiki/File:Ganzenbord_pd.svg)
- [Game of the Goose.svg op Wikimedia Commons — CC0](https://commons.wikimedia.org/wiki/File:Game_of_the_Goose.svg)
- [Goose (flipped).svg op Wikimedia Commons — publiek domein](<https://commons.wikimedia.org/wiki/File:Goose_(flipped).svg>)
- [Goose silhouette 02.svg op Wikimedia Commons — CC0](https://commons.wikimedia.org/wiki/File:Goose_silhouette_02.svg)
- [Goose Silhouette (NIH BioArt 177 - 630230) — publiek domein](<https://commons.wikimedia.org/wiki/File:Goose_Silhouette_(NIH_BioArt_177_-_630230).svg>)
- [GoosePiece.svg op Wikimedia Commons — CC BY 1.0](https://commons.wikimedia.org/wiki/File:GoosePiece.svg)
- [Openclipart “Game of the Goose / Ganzenbord” 16559 — publiek domein](https://openclipart.org/detail/16559/game-of-the-goose-ganzenbord)
- [Openclipart “Game of the Goose” 297355 — CC0](https://openclipart.org/detail/297355/game-of-the-goose)
- [Openclipart “Goose” 354989 — CC0](https://openclipart.org/detail/354989/goose)
- [Openclipart “Goose” 886 — publiek domein](https://openclipart.org/detail/886/goose)
- [Rijksmuseum, Ganzenbord RP-P-1906-150 — CC0](https://commons.wikimedia.org/wiki/File:Ganzenbord,_RP-P-1906-150.jpg)
- [Rijksmuseum, Oud Hollands Ganzenbord — publiek domein](https://commons.wikimedia.org/wiki/File:Oud_Hollands_Ganzenbord,_objectnr_A_41258.tif)
- [Joseph Scholz, Ganzenbordspel — publiek domein](https://commons.wikimedia.org/wiki/File:Joseph_Scholz_-_Ganzenbordspel,_Mainz,_circa.jpg)
- [Veluwe-spel — publiek domein](https://commons.wikimedia.org/wiki/File:Veluwe-spel.jpg)
- [Catchpenny print PRENT 0138 op Wikimedia Commons — publiek domein](https://commons.wikimedia.org/wiki/File:Het_nieuw_vermakelijk_ganzenspel-Catchpenny_print-PRENT_0138.jpeg)
- [Twemoji — graphics CC BY 4.0](https://github.com/jdecked/twemoji)
- [OpenMoji — CC BY-SA 4.0](https://openmoji.org/)
- [`goose-game` op npm](https://www.npmjs.com/package/goose-game) en [`dices` op npm](https://www.npmjs.com/package/dices)
- [`react-dice-complete` op npm](https://www.npmjs.com/package/react-dice-complete) en [GitHub](https://github.com/AdamTyler/react-dice-complete)
- [`react-dice-roll` op npm](https://www.npmjs.com/package/react-dice-roll) en [GitHub](https://github.com/avaneeshtripathi/react-dice-roll)
- [`react-dice-pro` op npm](https://www.npmjs.com/package/react-dice-pro)
- [`roll-a-die` op npm](https://www.npmjs.com/package/roll-a-die)
- [`@3d-dice/dice-box` op npm](https://www.npmjs.com/package/@3d-dice/dice-box) en [GitHub](https://github.com/3d-dice/dice-box)
- [`@randsum/roller` op npm](https://www.npmjs.com/package/@randsum/roller)
- [`@dice-roller/rpg-dice-roller` op npm](https://www.npmjs.com/package/@dice-roller/rpg-dice-roller)
- [`@gamepark/rules-api` op npm](https://www.npmjs.com/package/@gamepark/rules-api)
- [`rikharink/funcontrol-ganzenbord` — MIT](https://github.com/rikharink/funcontrol-ganzenbord)
- [Microsoft Fluent Emoji — MIT](https://github.com/microsoft/fluentui-emoji)
- [Phosphor Icons — MIT](https://github.com/phosphor-icons/core)
- [Lucide — ISC](https://lucide.dev/)
- [Kenney Board Game Pack — CC0](https://kenney.nl/assets/boardgame-pack)
- [Kenney Casino Audio — CC0](https://kenney.nl/assets/casino-audio)
- [game-icons.net — CC BY 3.0](https://game-icons.net/about.html)
- Interne bronnen: `libs/shared/lib/random.ts`, `libs/shared/lib/sound.ts`, `libs/shared/ui/motion-provider.tsx`, `libs/shared/ui/confetti.tsx`, `libs/entities/four-in-a-row`, `libs/features/four-in-a-row-game`, `libs/entities/game/model/game-catalog.ts`

[goose]: https://www.npmjs.com/package/goose-game
[bgi]: https://www.npmjs.com/package/boardgame.io
[gp]: https://www.npmjs.com/package/@gamepark/rules-api
[dices]: https://www.npmjs.com/package/dices
[rdc]: https://www.npmjs.com/package/react-dice-complete
[rdr]: https://www.npmjs.com/package/react-dice-roll
[rdp]: https://www.npmjs.com/package/react-dice-pro
[rad]: https://www.npmjs.com/package/roll-a-die
[db]: https://www.npmjs.com/package/@3d-dice/dice-box
[rand]: https://www.npmjs.com/package/@randsum/roller
[rpg]: https://www.npmjs.com/package/@dice-roller/rpg-dice-roller
