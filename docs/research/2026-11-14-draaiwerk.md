# Draaiwerk: een pegboard-puzzel met een nieuw ingrediënt per level

- **Datum:** 2026-11-14
- **Status:** Voorstel, de eerste 16 levels zijn gebouwd. De compacte as, rupsband, tandheugel en de combinatielevels 17–24 staan op de roadmap. De maintainer koos de naam **Draaiwerk**, wil veel variatie en elke level een nieuw ingrediënt. De liggende as, riem, ketting en rupsband horen meteen in de eerste release.
- **Aanleiding:** Een kinderspel over tandwielen. Twee vaste tandwielen moeten met elkaar verbonden worden door losse onderdelen op een gaatjesbord te zetten. De levels worden moeilijker, maar vooral **anders**: een liggende as met een groot en een klein tandwiel, een compacte as, een snelheidsmeter, een generator die een lamp laat branden, een lift, een riem, een ketting, een rupsband en een tandheugel.
- **Vraag:** Hoe houden we de mechaniek leerzaam en gevarieerd zonder dat levels hetzelfde trucje herhalen, en welke onderdelen en libraries zijn nodig binnen de statische app zonder backend of externe requests?
- **Kader:** [AGENTS.md](../../AGENTS.md), de [CSP](../../apps/games/public/_headers), Feature-Sliced Design, de regel "bibliotheken eerst" en het [design system](../design-system.md).

## Kort advies

Bouw **Draaiwerk** als een **deterministische pegboard-puzzel** met één grafmodel en veel soorten verbindingen. Elk level voegt precies één nieuw ingrediënt toe: een tussenwiel, een open riem, een ketting, een gekruiste riem, een liggende as, een compacte as, een snelheidsmeter, een generator, een lift, een rupsband of een tandheugel. Geen level is "hetzelfde met meer tandwielen".

De eerste release heeft **16 levels in vier hoofdstukken**. De eerste twaalf zijn samen een speelbaar prototype: tandwielen, riem, ketting, gekruiste riem, maatverschil, de liggende as en de snelheidsmeter. De levels 13–16 (lamp, lift, splitsing en twee snelheden) horen bij dezelfde release. De 24-levelreis hieronder is de roadmap; de compacte as, klem, rupsband, tandheugel en combinaties zijn de volgende slice.

De motor van de puzzel is één graaf met zeven verbindingstypes:

| Verbinding     | Richting | Verhouding                |
| -------------- | -------- | ------------------------- |
| Tandcontact    | keert om | `N1/N2`                   |
| Starre as      | gelijk   | `1`                       |
| Open riem      | gelijk   | `r1/r2`                   |
| Gekruiste riem | keert om | `r1/r2`                   |
| Ketting        | gelijk   | `N1/N2`                   |
| Rupsband       | gelijk   | `r1/r2`, lineaire uitvoer |
| Tandheugel     | lineair  | `v = ω·r`                 |

De tandwielvorm komt uit een MIT-referentie met echte involute tanden ([`mechanism-lab`](https://github.com/jacobplee/mechanism-lab)); we porten daar ongeveer 120 regels van naar TypeScript. De rest van de onderdelen is eenvoudige SVG of een Phosphor-icoon. Er is **geen nieuwe runtime-dependency nodig**.

Voeg bij implementatie een ADR toe, bijvoorbeeld `0031-draaiwerk.md`, omdat het deterministische model, de as-varianten, de riem/ketting-verbindingen en de snelheidsdoelen architectuurkeuzes zijn.

## Spelconcept

### Wat het kind leert

- Tandwielen geven beweging door als hun tanden elkaar raken.
- Bij elk contact draait het volgende tandwiel de **andere kant** op.
- Een tussenwiel verandert de richting, maar niet de snelheid van het doel.
- Een groot tandwiel draait langzamer dan een klein tandwiel.
- Een **as met twee tandwielen** verandert de snelheid wél: groot erop, klein eraf vertraagt; klein erop, groot eraf versnelt.
- Een **liggende as** en een **compacte as** doen hetzelfde op een andere manier: een lange stang of een kleine kast.
- Een **open riem** en een **ketting** draaien twee wielen dezelfde kant op; een **gekruiste riem** keert de richting om.
- Een **rupsband** en een **tandheugel** zetten draaien om in schuiven.
- Snelheid en kracht zijn elkaars tegenpool: een langzame as kan een zware lift omhoog krijgen.
- Een gesloten lus met een oneven aantal tandwielen kan niet draaien: dan slaat de machine vast.

De eerste release richt zich op al deze punten. Alleen een planetair stelsel en echte physics blijven buiten scope; de wormas is later toegevoegd (zie de update onderaan).

### Eén ronde

1. Het bord toont een gaatjesbord met een vaste **motor** (donker, met een motorteken) en een vast **doel**: een tandwiel met een richtingpijl, een generator met een lamp, een lift, een rupsband of een tandheugel.
2. In de bak liggen losse onderdelen: tandwielen in drie maten, een liggende as, een compacte as, een riem, een gekruiste riem, een ketting, een rupsband en een tandheugel. Per level is maar een deel beschikbaar.
3. De speler sleept een onderdeel naar een gaatje, of tikt eerst het onderdeel en dan het gaatje. Een liggende as heeft twee gaatjes nodig; een riem of ketting spant de speler tussen twee bestaande wielen.
4. Zodra er contact is, gaat de aangesloten reeks draaien. De motor draait altijd; losse onderdelen staan stil.
5. Het doel geeft feedback: de pijl wordt groen, de lamp gaat branden, de lift komt omhoog, de rupsband transporteert een kistje of de tandheugel schuift open. Er is geen "verloren".
6. Na twee mislukte pogingen licht een hint een geldig gaatje of een geldige verbinding op. Het level blijft oplosbaar zonder hint.

Er is **geen timer**. "Moeilijker" betekent: een nieuw onderdeel, een nieuwe beperking of een nieuw doel, niet tijdsdruk.

### Doel en feedback

| Doel                 | Voorwaarde                                       | Feedback                                                       |
| -------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| **Doel-tandwiel**    | Draait de kant op die de pijl aangeeft           | Pijl en tandwiel worden groen; korte viering                   |
| **Generator + lamp** | Draait sneller dan een drempel                   | Lamp gloeit warm op; bij te weinig snelheid knippert hij flauw |
| **Lift**             | Draait langzaam genoeg, dus met genoeg kracht    | Lift beweegt omhoog; bij te snel draaien blijft hij hangen     |
| **Rupsband**         | De band beweegt de goede kant op en ver genoeg   | Kistje schuift naar de overkant; band stopt bij het einde      |
| **Tandheugel**       | De heugel schuift de goede kant op en ver genoeg | Lade of hamertje beweegt; heugel stopt bij de aanslag          |
| **Twee doelen**      | Beide doelen tegelijk                            | Elk doel geeft apart feedback                                  |
| **Snelheidsmeter**   | Het gemeten doel staat in de groene zone         | Meter kleurt groen; buiten de zone amber                       |

De generator, de lift, de rupsband en de tandheugel zijn geen decoratie: ze maken snelheid, kracht en lineaire beweging tot een **doel**. Daarmee wordt elk onderdeel een echt puzzelstuk.

### Regels, speelbaar gemaakt

Het bord is een regelmatig gaatjesraster met afstand `s`. De drie maten hebben een steekstraal van `1s`, `2s` en `3s`. Twee tandwielen raken elkaar als de afstand tussen hun gaatjes gelijk is aan de som van hun stralen. Alle rechte verbindingen zijn dan een heel aantal gaatjes: `2s` tot en met `6s`. Schuine verbindingen werken alleen als de afstand precies uitkomt; levels gebruiken in de eerste versie vooral horizontale en verticale paden.

De rotatie is een graaf met zeven verbindingstypes:

| Verbinding     | Richting | Verhouding                | Fase                            |
| -------------- | -------- | ------------------------- | ------------------------------- |
| Tandcontact    | `-1`     | `N1/N2`                   | Tandfase nodig                  |
| Starre as      | `+1`     | `1` (zelfde hoeksnelheid) | Star, geen tandcontact          |
| Open riem      | `+1`     | `r1/r2`                   | Geen tandfase; band beweegt mee |
| Gekruiste riem | `-1`     | `r1/r2`                   | Geen tandfase; band kruist      |
| Ketting        | `+1`     | `N1/N2`                   | Geen tandfase; schakels         |
| Rupsband       | `+1`     | `r1/r2`                   | Geen tandfase; lineaire uitvoer |
| Tandheugel     | lineair  | `v = ω·r`                 | Geen tandfase; lineaire uitvoer |

- De richting van een tandwiel is de richting van de motor, vermenigvuldigd met het richtingsgetal van elke verbinding.
- De snelheid is het product van de verhoudingen. Tussenwielen veranderen de snelheid van het doel niet, alleen de richting.
- Een **liggende as** is een starre stang tussen twee tandwielen. De tandwielen raken elkaar **niet**: de stang is de koppeling, geen tandcontact. Daarom is de hartafstand groter dan `r1 + r2`; anders zouden de tandwielen zelf in elkaar grijpen.
- Een **compacte as** is één knooppunt met twee concentrische tandwielen. Beide hebben dezelfde hoeksnelheid; een buur grijpt aan op de grote of de kleine ring.
- Een **riem** of **ketting** verbindt twee bestaande wielen. De speler kiest het onderdeel en tikt beide wielen aan. Een open riem en een ketting draaien dezelfde kant op; een gekruiste riem keert de richting om.
- Een **rupsband** is een gesloten band om twee wielen; het bovenvlak beweegt lineair. Een **tandheugel** is een rechte lat met tanden die door een tandwiel heen en weer schuift.
- Komt een onderdeel via twee paden met een verschillende richting of snelheid binnen, dan is er een **conflict**: het bord slaat vast. Dat gebeurt bijvoorbeeld in een driehoek van drie tandwielen. Dit is een leerzaam moment, geen foutmelding.
- Een tandwiel dat nergens mee verbonden is, staat stil en telt niet mee.

Deze regels zijn pure functies: geen physics, geen willekeur en dus goed te testen en te hinten.

### De as: twee varianten en een rekenvoorbeeld

**Liggende as.** Een metalen stang over twee gaatjes, met aan elk uiteinde een tandwiel. De tandwielen zitten op dezelfde as en draaien dus even snel. Ze raken elkaar niet: de stang overbrugt de afstand. Voorbeeld: een groot tandwiel van 28 tanden (straal 56 px) en een klein van 14 tanden (straal 28 px) staan 4 gaatjes van 28 px uit elkaar, dus 112 px. De som van de stralen is 84 px; er blijft 28 px stang over. Zo blijft de koppeling zichtbaar en lopen de tanden niet in elkaar.

**Compacte as.** Eén gaatje, twee tandwielen op elkaar: groot achter, klein voor. Dezelfde hoeksnelheid, maar in een kleine ruimte. Dit is de fysieke bovenaanzicht-versie van de as.

De overbrenging is bij beide hetzelfde. Met een motor van 14 tanden en een doel van 14 tanden:

- **Groot erop, klein eraf:** de motor drijft het grote tandwiel aan. De as draait `14/28 = 0,5×` zo snel. Het kleine tandwiel drijft het doel aan: `14/14 = 1×`. Het doel draait dus **0,5×** zo snel als de motor, in dezelfde richting (twee contacten).
- **Klein erop, groot eraf:** de motor drijft het kleine tandwiel aan. De as draait `14/14 = 1×`. Het grote tandwiel drijft het doel aan: `28/14 = 2×`. Het doel draait dus **2×** zo snel als de motor, in dezelfde richting.

Die twee getallen zijn de kern van hoofdstuk 3. De snelheidsmeter maakt ze zichtbaar zonder dat een kind de breuken hoeft te kennen.

### Geen repetitie: één nieuw ingrediënt per level

Dit is een ontwerpregel, geen hoop. Elk level krijgt in de data een uniek `introduces`-veld: `"idler"`, `"open-belt"`, `"lying-as-slow"`, `"generator"`, `"track"`, enzovoort. Een test controleert dat geen twee levels hetzelfde ingrediënt introduceren. Een level dat alleen "meer tandwielen" toevoegt, bestaat niet.

De variatie zit niet alleen in het aantal onderdelen, maar in de **soort overbrenging**: tandwiel, starre as, riem, gekruiste riem, ketting, rupsband of tandheugel. Elk hoofdstuk wisselt die af, zodat een kind niet tien keer hetzelfde sleepje doet.

Bij de start van een level verschijnt één korte regel met het nieuwe onderdeel, bijvoorbeeld:

> **Nieuw: de liggende as.** Twee tandwielen op één stang draaien samen. Groot erop, klein eraf: dan gaat het doel langzamer.

De uitleg is één regel, geen les. De rest leert het kind door te spelen. De levelnaam verwijst naar het ingrediënt: "Tussenwiel", "De riem", "De liggende as", "De meter", "Lamp aan", "De rupsband".

### Levelreis

| #   | Hoofdstuk  | Level                | Nieuw ingrediënt   | Doel                                     |
| --- | ---------- | -------------------- | ------------------ | ---------------------------------------- |
| 1   | Doorgeven  | Eerste tand          | Eerste contact     | Eén tandwiel verbindt motor en doel      |
| 2   | Doorgeven  | Tussenwiel           | Tussenwiel         | Eén extra wiel; richting om              |
| 3   | Doorgeven  | De riem              | Open riem          | Twee poelies, zelfde richting            |
| 4   | Doorgeven  | De ketting           | Ketting            | Over een lange afstand, zelfde richting  |
| 5   | Richting   | Gekruist             | Gekruiste riem     | Richting om zonder tandwiel              |
| 6   | Richting   | Twee tussenwielen    | Pariteit           | Zelfde richting als de motor             |
| 7   | Richting   | De omweg             | Geblokkeerd gaatje | Om een blokkade heen                     |
| 8   | Richting   | Andersom             | Omgekeerde motor   | Alles moet de andere kant op             |
| 9   | Maat en as | Groot en klein       | Maatverschil       | Het kleine wiel draait zichtbaar sneller |
| 10  | Maat en as | De liggende as       | Liggende as, traag | Doel op 0,5× snelheid                    |
| 11  | Maat en as | De liggende as, snel | Liggende as, snel  | Doel op 2× snelheid                      |
| 12  | Maat en as | De meter             | Snelheidsmeter     | Wijzer in de groene zone                 |
| 13  | Kracht     | Lamp aan             | Generator + lamp   | Lamp brandt boven een drempel            |
| 14  | Kracht     | De lift              | Kracht             | Lift omhoog met een langzame as          |
| 15  | Kracht     | Twee kanten op       | Splitsing          | Twee doelen tegelijk                     |
| 16  | Kracht     | Snel en langzaam     | Twee snelheden     | Snelle lamp en langzame lift             |
| 17  | Roadmap    | De compacte as       | Compacte as        | Zelfde verhouding in één gaatje          |
| 18  | Roadmap    | Klem                 | Oneven lus         | Een vastgelopen lus weer losmaken        |
| 19  | Roadmap    | De rupsband          | Rupsband           | Een kistje naar de overkant              |
| 20  | Roadmap    | De tandheugel        | Tandheugel         | Een lade openen                          |
| 21  | Roadmap    | Riem met maat        | Riemverhouding     | Twee poelies van verschillende maat      |
| 22  | Roadmap    | Ketting en as        | Ketting + as       | Lange afstand en snelheidsverandering    |
| 23  | Roadmap    | Twee machines        | Twee aandrijvingen | Riem en ketting in één level             |
| 24  | Roadmap    | Vrij draaien         | Werkbank           | Alle onderdelen, geen doel               |

De eerste twaalf levels (tot en met de snelheidsmeter) zijn samen een speelbaar prototype: tandwielen, riem, ketting, gekruiste riem, maatverschil, de liggende as en de meter. De levels 13–16 (lamp, lift, splitsing en twee snelheden) horen bij dezelfde release. De levels 17–24 in de tabel zijn de roadmap en worden pas gebouwd als de eerste zestien goed spelen.

**Buiten scope:**

- Een planetair stelsel of een differentieel.
- Een physics-engine of echte botsende tanden.
- Een levelgenerator of dagelijkse puzzel.
- Accounts, sync of een backend.
- Een timer of verliesconditie.
- Een volledige sandbox met vrije muren en gewichten; level 24 is een eenvoudige werkbank.

## Hergebruik in de repo

| Nodig                       | Al aanwezig                                               | Waar                                                                                                                                             |
| --------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Slepen en neerzetten        | `@dnd-kit/core` 6.3.1, met `MouseSensor` en `TouchSensor` | [`alchemy-play.tsx`](../../libs/features/alchemy-lab/ui/alchemy-play.tsx), [`word-search`](../../libs/features/word-search)                      |
| Sleepvoorbeeld en animatie  | `motion` 14.9.0                                           | [`alchemy-play.tsx`](../../libs/features/alchemy-lab/ui/alchemy-play.tsx)                                                                        |
| Spelstate en voortgang      | `zustand` 5, `persist`, genormaliseerde opslag            | [`use-arrow-store.ts`](../../libs/features/arrow-game/model/use-arrow-store.ts), [`storage.ts`](../../libs/features/arrow-game/model/storage.ts) |
| Scherm en kop               | `GameShell`, `PageHeader`, `Button`, `SoundToggle`        | [`game-shell.tsx`](../../libs/widgets/game-shell/ui/game-shell.tsx)                                                                              |
| Geluid en trilfeedback      | `playSound`, `playHaptic`                                 | [`sound.ts`](../../libs/shared/lib/sound.ts)                                                                                                     |
| Gaatjesbord                 | De stippenachtergrond van de werkbank                     | [`alchemy-board.tsx`](../../libs/features/alchemy-lab/ui/alchemy-board.tsx)                                                                      |
| Levelkeuze en voortgang     | `MazeLevelSelect`, opslagpatroon                          | [`maze-level-select.tsx`](../../libs/features/arrow-game/ui/maze-level-select.tsx)                                                               |
| Viering                     | `CelebrationDialog`, `Confetti`                           | [`libs/shared/ui`](../../libs/shared/ui)                                                                                                         |
| Spelidentiteit              | `GameIcon` met een Phosphor-tandwiel                      | [`game-icon.tsx`](../../libs/shared/ui/game-icon.tsx)                                                                                            |
| Menukaart, route, thumbnail | `gameCatalog`, router, lokale JPEG                        | [`game-catalog.ts`](../../libs/entities/game/model/game-catalog.ts), [`router.tsx`](../../apps/games/src/app/router.tsx)                         |
| Testpatronen                | pure regels in `tests/node`, componenttest met router     | [`tests/web/arrows.test.tsx`](../../tests/web/arrows.test.tsx)                                                                                   |

De stippenachtergrond van Mengelmoes is precies wat een pegboard nodig heeft; er is geen nieuwe achtergrondafbeelding nodig.

## Libraries en andere bronnen

### Wat we gebruiken

| Keuze                    | Versie                                                   | Waarom                                                                                                   |
| ------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `@dnd-kit/core`          | 6.3.1, al in de repo                                     | Sleepbaar maken van de bak, dropzones per gaatje, `DragOverlay`. Zelfde sensoren als Mengelmoes.         |
| `motion`                 | 14.9.0, al in de repo                                    | Overlay, viering en kleine feedbackanimaties. De continue draaiing en bandbeweging doen CSS, niet React. |
| `zustand`                | 5, al in de repo                                         | Level, plaatsingen, verbindingen, hint, voortgang.                                                       |
| Eigen `gear-geometry.ts` | TypeScript-port van `mechanism-lab`, ongeveer 150 regels | Echte involute tandprofielen, gedeelde module, fase en de open-riem-tangenten. MIT, met attributie.      |
| Eigen `gear-rules.ts`    | eigen code, ongeveer 150 regels                          | Graaf met zeven verbindingstypes, richting, snelheid, as, conflict en overwinning.                       |
| Eigen `speed-gauge.tsx`  | eigen code, ongeveer 40 regels                           | Kleine wijzer met drie zones, precies in de stijl van de app.                                            |

Er is **geen nieuwe runtime-dependency nodig**. De geometrie wordt geport uit MIT-code; de licentie en attributie komen in `LICENSES/mechanism-lab-MIT.txt`.

### Waarom geen kant-en-klare npm-library, maar wel een MIT-referentie

| Kandidaat                                                              | Stand                                             | Beoordeling                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`mechanism-lab`](https://github.com/jacobplee/mechanism-lab)          | 0.1.0, MIT, pure ESM, geen dependencies, 77 tests | **Gekozen als bron.** `spurGear` geeft een echte involute outline; `gearTrain` geeft de fase en verhouding per contact; `openBelt` geeft de exacte tangenten voor een open riem. De tests controleren onder meer dat de tanden elkaar niet raken en dat de verhouding exact is. |
| [`gearworks`](https://github.com/Artem1bar/gearworks)                  | MIT, één HTML-bestand, Canvas                     | **Referentie voor de as en het vastlopen.** Het heeft fasevergrendelde tandwielen, gestapelde tandwielen op één as, overbrengingsverhoudingen en jam-detectie. Geen package, maar de solver is compact en leesbaar.                                                             |
| [`gearforge`](https://github.com/1400130-collab/gearforge)             | MIT, zero dependencies, browser                   | Standaards-correcte ISO 21771-profielen met echte trochoïde wortelfillet. Mooier dan nodig voor een spel; wel de reserve als de eenvoudige outline op groot scherm te grof blijkt.                                                                                              |
| [`svg-gear-generator`](https://github.com/kamiyo/svg-gear-generator)   | 1.1.5, MIT, 2022, React 18                        | Afgevallen. Klein en ononderhouden; de winst is enkele tientallen regels, terwijl we de fase en het module-systeem toch zelf moeten bepalen.                                                                                                                                    |
| [`gears-react`](https://www.npmjs.com/package/gears-react)             | 1.0.37, ISC, 2023, geen documentatie              | Afgevallen. Brengt `axios`, `mobx`, `i18next` en `react-router-dom` mee; het is een applicatiekit, geen tandwielcomponent.                                                                                                                                                      |
| [`makerjs`](https://github.com/microsoft/maker.js)                     | 0.19.2, MIT, Microsoft                            | Mature 2D-CAD-bibliotheek, maar zonder kant-en-klaar tandwielmodel. Voor deze puzzel te veel abstractie.                                                                                                                                                                        |
| [`planck.js`](https://github.com/piqnt/planck.js), `matter-js`, Rapier | onderhouden physics-engines                       | Afgevallen. Een physics-engine maakt de uitkomst afhankelijk van tijdstap en botsinstellingen. Dat is slecht voor hints, tests en voorspelbaarheid, en het is veel meer code dan een graaf.                                                                                     |

We nemen de **vorm** over, niet de applicatie: de involute outline, de faseformule en de open-riem-tangenten. De spellogica, de as-varianten, de doelen en de levels blijven eigen. `gearworks` dient als referentie voor de as en de jam-detectie. De port komt als TypeScript in de repo, met de MIT-tekst en een bronvermelding; voor zover we de as-solver van `gearworks` overnemen, komt daar ook een MIT-vermelding bij. Er komt geen `.js`-bestand in de repo.

### Waarom een eigen snelheidsmeter

| Kandidaat                                                                      | Stand                          | Beoordeling                                                                                                                 |
| ------------------------------------------------------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| [`react-gauge-component`](https://www.npmjs.com/package/react-gauge-component) | 2.0.29, MIT, React 19          | Onderhouden, maar brengt `d3` 7 mee voor een klein onderdeel. De standaardstijl past niet bij de rustige app.               |
| [`svg-gauge`](https://www.npmjs.com/package/svg-gauge)                         | 1.0.7, MIT, geen dependencies  | Klein, maar geen React-wrapper of typen en sinds 2022 niet bijgewerkt. De wrapper kost ongeveer evenveel als de gauge zelf. |
| Eigen `speed-gauge.tsx`                                                        | eigen code, ongeveer 40 regels | **Gekozen.** Drie zones, een wijzer en een `aria-label`; geen extra bundel, geen externe stijl.                             |

Er is geen npm-package dat de hele puzzel oplost. De tandwielgeometrie komt uit `mechanism-lab`; de gauge en de spellogica blijven eigen, omdat ze klein en specifiek zijn.

### Referentiespellen

| Spel                                                                                                           | Wat het leert of doet                                                                                            | Waarom relevant                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [Sprocketry](https://gameeduhub.com/sprocketry.html)                                                           | 40 machines op een houten pegboard; motor, groene doelen met richtingpijlen, drie maten, vasthangende tandwielen | **Dichtstbijzijnde referentie.** De kern "twee vaste tandwielen verbinden met losse tandwielen" komt hier vandaan. |
| [Crazy Gears](https://apps.apple.com/us/app/crazy-gears/id967327312)                                           | 99 levels met een echte mechanische engine; tandwielen, kettingen, katrollen en gewichten                        | Bewijst dat jonge kinderen richting en overbrenging kunnen leren zonder tekst.                                     |
| [Gear Puzzle](https://plays.org/gear-puzzle/)                                                                  | 30 levels; sleep tandwielen en verbind ze met het draaiende wiel, met timer                                      | Zelfde sleepmechaniek, maar zonder richtingdoel en met tijdsdruk.                                                  |
| [Gears: Logic Puzzles](https://play.google.com/store/apps/details?id=org.stropin.gearslogicpuzzles)            | Verplaats tandwielen van verschillende grootte tot alle rode wielen draaien                                      | Goede referentie voor maatverschil en het "alle doelen"-model.                                                     |
| [8 tandwielen](https://www.spelletjes.nl/spel/8-tandwielen)                                                    | Machines repareren door tandwielen op de juiste plek te zetten                                                   | Nederlandse vindbaarheid; reclames maken het minder geschikt als voorbeeld voor de eigen UI.                       |
| [Connect IT](https://www.engineering.com/games/connect-it/)                                                    | Tandwielen verbinden tot het systeem loopt                                                                       | Eenvoudige, reclamevrije variant.                                                                                  |
| [Computermeester — Tandwielen](https://www.computermeester.be/tandwielen.htm)                                  | Draairichting en snelheid voorspellen                                                                            | Didactische volgorde voor de Nederlandse basisschool.                                                              |
| [TinyTap — Soorten tandwielen](https://www.tinytap.com/activities/g549r/play/soorten-tandwielen)               | Het juiste tandwiel kiezen, met gesproken vraag                                                                  | Voorbeeld van taalarme, gesproken instructie.                                                                      |
| [Tinybop — Simple Machines](https://tinybop.com/apps/simple-machines)                                          | Katrollen, hefbomen, schroeven                                                                                   | Geen tandwielen, maar dezelfde rustige ontdekmethode.                                                              |
| [Korbo](https://www.caperom.nl/nl/p/korbo-tandwielen-420-delig/)                                               | Houten bouwset met grondplaten, pinnen en tandwielen                                                             | Fysieke referentie voor het gaatjesbord en de "klik" van een tandwiel op een pin.                                  |
| [Technopolis — Aan de slag met tandwielen](https://www.technopolis.be/nl/proefjes/aan-de-slag-met-tandwielen/) | Tanden tellen en ontdekken waarom een klein wiel sneller draait                                                  | Lesproef voor de klas, naast het spel.                                                                             |

## Herbruikbaar beeld en geluid

Er worden **geen externe of beschermde assets** overgenomen. De tandwielen, de as, de meter, de lamp, de lift, de riem, de ketting, de rupsband en de tandheugel worden als SVG en CSS gemaakt; de vormgeving sluit aan op het [design system](../design-system.md).

| Onderdeel                           | Bron                                                            | Licentie of afspraak                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Tandwielen, as, pijlen, gaatjesbord | Eigen SVG en CSS                                                | Eigen werk; geen attributie nodig.                                                                                    |
| Involute tandprofiel                | [`mechanism-lab`](https://github.com/jacobplee/mechanism-lab)   | MIT; port met bronvermelding en `LICENSES/mechanism-lab-MIT.txt`.                                                     |
| Riem, ketting, rupsband             | Eigen SVG op basis van de open-riem-tangenten                   | Eigen werk; geen externe afbeelding.                                                                                  |
| Snelheidsmeter                      | Eigen SVG                                                       | Eigen werk; geen extra library.                                                                                       |
| Generator, lamp, lift               | Eigen SVG met Phosphor-iconen                                   | Icons MIT, via `@phosphor-icons/react`.                                                                               |
| Spelicoon                           | [Phosphor Icons](https://phosphoricons.com) `Gear` of `GearSix` | MIT, al aanwezig; geen nieuwe licentie.                                                                               |
| Geluidseffecten                     | `playSound` met de Web Audio API                                | Eigen gesynthetiseerde tonen; geen audiobestanden en geen netwerk.                                                    |
| Spraak (optioneel)                  | Bestaande Nathalie-stem uit de TTS-pijplijn                     | CC0-stem, zoals beschreven in [ADR 0023](../adr/0023-voorlezen-met-tts.md); alleen als er echte instructietekst komt. |
| Thumbnail                           | Lokaal gerenderde schermafbeelding, 800 × 500 JPEG              | Eigen werk, contenthash in de bestandsnaam, zoals bij de andere games.                                                |
| Hout- of papiertextuur              | CSS, geen externe afbeelding                                    | Houdt de CSP en de "geen externe requests"-regel intact.                                                              |

De kleuren volgen de betekenis uit het design system. De motor is **donker**, niet rood, want rood betekent in deze app "fout". Het doel gebruikt het accent en wordt pas groen als het goed draait. De lamp is warm geel; groen blijft voorbehouden aan succes. De lift, de rupsband en de tandheugel gebruiken dezelfde neutrale materialen als de rest van het bord.

### Wat je zelf tekent en wat een generator doet

De tandwielen worden **niet met de hand getekend**. `spurGear` rekent per tandenaantal een echte involute contour uit; wij zetten die punten om naar één SVG-path. De andere onderdelen zijn geen illustraties maar eenvoudige vormen:

| Onderdeel      | Hoe het ontstaat                                                                   |
| -------------- | ---------------------------------------------------------------------------------- |
| Tandwiel       | Involute generator (`mechanism-lab`) + eigen SVG-path en kleur                     |
| Liggende as    | Twee gegenereerde tandwielen + een metalen stang en twee hubs                      |
| Compacte as    | Twee gegenereerde tandwielen concentrisch, groot achter/klein voor                 |
| Motor          | Cirkel + `Lightning`-icoon uit Phosphor                                            |
| Generator      | Cirkel + `Lightning`-icoon                                                         |
| Lamp           | `Lightbulb`-icoon + CSS-glow                                                       |
| Lift           | Eigen kooi en kabel + `ArrowUp`-icoon                                              |
| Riem           | Twee raaklijnen en twee bogen (open) of een X (gekruist); de band is een dikke pad |
| Ketting        | Hetzelfde pad als de riem, met schakelmarkeringen                                  |
| Rupsband       | Een gesloten band met een profieltextuur                                           |
| Tandheugel     | Rechte lat met gegenereerde tanden                                                 |
| Snelheidsmeter | Eigen cirkelboog, drie zones en een wijzer                                         |
| Gaatjesbord    | De bestaande stippenachtergrond uit Mengelmoes                                     |

Er is dus **geen open-source sprite-set nodig** voor de mechaniek. Wil je later meer textuur of decoratie, dan kunnen CC0-sets zoals [Kenney](https://kenney.nl/assets) of [Game-icons.net](https://game-icons.net/) (CC BY 3.0) voor losse props worden gebruikt, maar de tanden zelf moeten parametrisch blijven: alleen dan grijpen ze op elke maat in elkaar.

## Integratieschets

### FSD-indeling

```text
libs/entities/gear/
  model/types.ts          Level, Hole, GearSize, As, Connection, Output, Ingredient
  model/geometry.ts       TypeScript-port van spurGear/gearTrain/openBelt (MIT), SVG-pad, fase
  model/rules.ts          graaf met zeven verbindingstypes, richting, snelheid, conflict, solve
  model/levels.ts         16 levels + oplossingen + introduces
  index.ts

libs/features/draaiwerk/
  model/use-draaiwerk-store.ts level, tray, placements, connections, status, hint, voortgang
  model/storage.ts        genormaliseerde localStorage
  ui/draaiwerk-play.tsx   DndContext, sensors, DragOverlay
  ui/draaiwerk-board.tsx  SVG-bord, gaatjes, vaste en geplaatste onderdelen
  ui/draaiwerk-tray.tsx   bak met losse onderdelen
  ui/draaiwerk-hud.tsx    level, hint, opnieuw, voortgang, "nieuw"-regel
  ui/connection-layer.tsx riem, ketting, rupsband en tandheugel
  ui/speed-gauge.tsx      kleine meter met drie zones
  ui/output-feedback.tsx  lamp, lift, rupsband, tandheugel en pijl
  ui/draaiwerk-result.tsx viering en volgende level

libs/pages/draaiwerk/
  ui/draaiwerk-page.tsx   intro, levelkeuze, spelen, resultaat
```

### Datamodel

```ts
type GearSize = 1 | 2 | 3; // steekstraal in gaatjesafstanden

type EdgeKind = "mesh" | "rigid" | "open-belt" | "crossed-belt" | "chain" | "track" | "rack";

type Ingredient =
  | "first-mesh"
  | "idler"
  | "open-belt"
  | "chain"
  | "crossed-belt"
  | "parity"
  | "blocked-hole"
  | "reverse-motor"
  | "size"
  | "lying-as-slow"
  | "lying-as-fast"
  | "speed-gauge"
  | "generator"
  | "lift"
  | "two-speeds"
  | "compact-as"
  | "split"
  | "jam"
  | "track"
  | "rack"
  | "belt-ratio"
  | "chain-as"
  | "two-drives"
  | "sandbox";

interface Hole {
  id: string;
  col: number;
  row: number;
}

interface GearPlacement {
  kind: "gear";
  holeId: string;
  size: GearSize;
}

interface LyingAsPlacement {
  kind: "lying-as";
  holeA: string;
  holeB: string;
  sizeA: GearSize;
  sizeB: GearSize;
}

interface CompactAsPlacement {
  kind: "compact-as";
  holeId: string;
  big: GearSize;
  small: GearSize;
}

interface BeltPlacement {
  kind: "open-belt" | "crossed-belt" | "chain";
  fromHoleId: string;
  toHoleId: string;
}

interface TrackPlacement {
  kind: "track";
  fromHoleId: string;
  toHoleId: string;
}

interface RackPlacement {
  kind: "rack";
  holeId: string;
  axis: "x" | "y";
}

type Placement =
  | GearPlacement
  | LyingAsPlacement
  | CompactAsPlacement
  | BeltPlacement
  | TrackPlacement
  | RackPlacement;

interface Output {
  kind: "target" | "generator" | "lift" | "track" | "rack";
  holeId: string;
  gearSize: GearSize;
  direction?: 1 | -1;
  minSpeed?: number;
  maxSpeed?: number;
  travel?: number;
}

interface GearLevel {
  id: string;
  name: string;
  chapter: 1 | 2 | 3 | 4 | 5 | 6;
  introduces: Ingredient;
  cols: number;
  rows: number;
  holes: Hole[];
  blockedHoleIds: string[];
  motor: { holeId: string; size: GearSize };
  outputs: Output[];
  tray: Placement[];
  solution: Placement[];
}
```

### Pure regels

```ts
buildGraph(level, placements): Graph
drive(level, placements): {
  rotation: Map<PortId, 1 | -1>;
  speed: Map<PortId, number>;
  linear: Map<string, number>;
  jammed: boolean;
}
outputSatisfied(output, drive): boolean
evaluate(level, placements): "playing" | "solved" | "jammed"
validateLevel(level): string[]
// dubbele gaatjes, overlap, as-afstand, riem-afstand, heugel-aansluiting,
// onoplosbaar, dubbele introduces
```

De UI roept alleen deze functies aan. Daardoor kunnen de levels, de hint en de tests dezelfde waarheid gebruiken.

### De as in de graaf

- Een **liggende as** is één starre koppeling tussen twee poorten op twee verschillende gaatjes. Beide poorten hebben dezelfde hoeksnelheid; de richting tussen de twee is `+1`. De twee tandwielen mogen elkaar niet raken: de hartafstand is groter dan `rA + rB`.
- Een **compacte as** is één starre koppeling tussen twee poorten op hetzelfde gaatje: groot en klein concentrisch. Ook hier is de richting `+1` en de snelheid gelijk.
- Een buur grijpt aan op de poort die bij zijn afstand past. Bij een liggende as is dat het tandwiel aan het uiteinde; bij een compacte as de grote of de kleine ring.
- Als een as twee keer wordt aangedreven, moeten beide paden dezelfde snelheid en richting opleveren. Zo niet, dan is er een conflict. Levels geven een as daarom in de eerste versie één ingang en één uitgang.

### Riem, ketting, rupsband en tandheugel

- Een **open riem** loopt over twee poelies en draait beide dezelfde kant op. De verhouding is `r1/r2`; de band zelf heeft geen tandfase. De tangenten komen uit `openBelt` van `mechanism-lab`.
- Een **gekruiste riem** loopt als een X en keert de richting om. De verhouding blijft `r1/r2`.
- Een **ketting** loopt over twee kettingwielen, draait dezelfde kant op en heeft dezelfde verhouding als een tandcontact. Er is geen tandfase nodig; de schakels bewegen mee.
- Een **rupsband** is een gesloten band om twee wielen. Het bovenvlak beweegt lineair; de snelheid is `ω·r`. Een kistje op de band is het doel.
- Een **tandheugel** is een rechte lat met tanden. Een tandwiel drijft de lat lineair aan: `v = ω·r`. De lat heeft een aanslag; als hij het einde bereikt, is het doel gehaald.
- Een riem of ketting kan over een geblokkeerd gaatje heen; een tandwiel of as niet. Dat maakt de routekeuze interessant.

### Rotatie en fase

Elk tandwiel krijgt een statische fase en een CSS-animatie:

- Buitenste `<g>`: `translate(x, y) rotate(phase)`.
- Binnenste rotor: `animation: gear-spin var(--period) linear infinite`, met `animation-direction: reverse` voor een oneven aantal contacten.
- `--period` volgt uit de hoeksnelheid; voor een gewoon tandwiel is die evenredig met het aantal tanden. De motor is de referentie.
- De fase wordt via een spanning tree vanaf de motor berekend, zodat een tand van het ene wiel in een tandholte van het andere valt. De formule komt uit `gearTrain`: `phi2 = k·phi1 + C` met `k = -N1/N2` en `C = hoek + π - π/N2 - k·hoek`, waarbij `hoek` de richting van het ene naar het andere middelpunt is.
- De as heeft twee rotoren met dezelfde periode en richting, maar een eigen fase per tandwiel.
- Een oneven lus geeft een richtingsconflict en dus een vasthang-animatie. Een gesloten even lus vermijden de eerste levels; fasecorrecte lussen zijn een latere uitbreiding.

Riemen, kettingen en rupsbanden hebben geen tandfase. Hun beweging is een `stroke-dashoffset`-animatie op de bandpad, met dezelfde snelheid als de poelies. Een tandheugel schuift met een korte CSS-transitie tot de aanslag. Zo blijft de animatie op de GPU en hoeft React niet per frame te renderen. `prefers-reduced-motion` vervangt de beweging door een stilstaande stand met richtingpijlen.

### Schermen en navigatie

- Route: `/draaiwerk`.
- `gameCatalog`: `id: "draaiwerk"`, naam "Draaiwerk", korte uitleg, lokale thumbnail, `speech: { kind: "visual", reason: ... }` of een spraakgroep als de instructie definitief is.
- `GameIcon`: voeg `draaiwerk: GearSix` toe.
- `GameShell` met `title="Draaiwerk"`, `onBack`, `onNewGame` en `fitViewport` voor tablet.
- Op mobiel: bord boven, bak onder. Op tablet/landscape: bord links, bak rechts, zoals Mengelmoes.
- Levelkeuze en resultaat volgen het patroon van Pijlen.
- De "nieuw"-regel is een klein `game-panel` boven het bord, niet een modale les.

### Toegankelijkheid en mobiel

- **Tikken is de hoofdroute**, slepen is een extra. Eerst een onderdeel in de bak kiezen, dan een gaatje of twee wielen. Elk gaatje krijgt een onzichtbaar touch-target van minimaal 44 × 44 px.
- Gaatjes waar het gekozen onderdeel past, lichten op. Dat is zowel uitleg als hulp.
- Richting is nooit alleen kleur: pijlen, draaiing en tekst ("linksom", "rechtsom") dragen de betekenis.
- De snelheidsmeter heeft een `aria-label` met de waarde en de zone, bijvoorbeeld "Snelheid 0,5, traag; doel is 1,0".
- `aria-label` per onderdeel en gaatje; een live-regio meldt "Vastgelopen", "Lamp brandt", "Lift omhoog" en "Kistje aan de overkant".
- Toetsenbord: tab naar de bak, pijltjes tussen gaatjes, Enter plaatst. Dit kan later, maar de DOM-structuur moet het nu al toelaten.
- Test op 390 px en 1024 px, met `env(safe-area-inset-*)`.

## Verificatie

**Eigen proef, 2026-11-14, buiten de app.** Ik heb met Node 24.22.2 en `sharp` 0.35.5 een SVG gerenderd met drie tandwielen:

- module 4 px, 12/18/24 tanden, steekstralen 24/36/48 px;
- middelpunten op 0, 60 en 144 px, dus exact `r1 + r2` en `r1 + 2r2 + r3`;
- een statische fase berekend via de contactpunten;
- daarna geroteerd met 10°, -6,667° en -5°, volgens de verhouding van de tanden.

De tanden bleven op beide standen in elkaar grijpen; er was geen zichtbare botsing of naad. De proefbestanden staan alleen in `/tmp` en zijn niet in de repo opgenomen. Dit bevestigt dat de fase- en rotatieberekening klopt voor een reeks, maar niet dat de animatie in een echte browser soepel loopt.

**Eigen proef met `mechanism-lab`, 2026-11-14.** Ik heb de repository gekloond en `node --test` gedraaid: **77 tests, 0 failures**. Daar zitten ook de checks voor de open riem bij. Daarna heb ik met `spurGear` en `gearTrain` een reeks van 14/28/14 tanden met module 4 gerenderd, op `phi0 = 0` en `phi0 = 0,17`. Over 48 tussenstanden was de kleinste gemeten speling `-1,75e-6` (effectief nul, binnen de tolerantie van de bibliotheek); de tanden bleven zichtbaar in elkaar grijpen. Dit bewijst dat de involute-vorm en de faseformule bruikbaar zijn. De proef staat alleen in `/tmp`.

**Beeldproef voor de compacte as, 2026-11-14.** Ik heb dezelfde SVG-methode gebruikt voor een as met een groot tandwiel (28 tanden, achter) en een klein tandwiel (14 tanden, voor). Links raakt een blauw tandwiel de grote ring, rechts raakt een paars tandwiel de kleine ring. Het grote wiel is lichter en heeft een slagschaduw; het kleine wiel en de rechterbuur staan ervoor. In de statische render is de gelaagdheid leesbaar: je ziet dat de rechterbuur op de kleine ring aangrijpt en vóór het grote wiel ligt. De streeplijnen zijn hulplijnen; in de app horen die alleen bij het slepen of bij een hint zichtbaar te zijn. Ook deze proef staat alleen in `/tmp`.

**Beeldproef voor de liggende as, 2026-11-14.** Een grote 28T (straal 56 px) en een kleine 14T (straal 28 px) staan 112 px uit elkaar, met een metalen stang van 28 px zichtbaar tussen de tandwielen. De tanden raken elkaar niet; de stang leest als de starre koppeling. Met een label erbij is het verschil met een riem duidelijk. Nog niet getest met animatie of op 390 px.

**Nog niet getest:**

- De port van `mechanism-lab` in de app, met animatie en op 390 px.
- De liggende en compacte as in de app, met animatie en op 390 px.
- CSS-animatie met veel tandwielen op een iPad of een oudere telefoon.
- De levelgeometrie op een echte 390 px-viewport.
- De snelheidsmeter, de generator, de lamp en de lift in de browser.
- Riem, ketting, rupsband en tandheugel in de browser.
- Een gesloten even lus met fasecorrecte sluiting.
- Spraak en de audio-coverage-poort.

**Risico's:**

- **Levelgeometrie is streng.** Een gaatje te veel of te weinig en een tandwiel raakt niet. Daarom zijn levels handgemaakt en valideert een test elk level en elke oplossing.
- **De liggende as is lang.** De twee tandwielen mogen elkaar niet raken, dus de as beslaat minstens `rA + rB + m` en daarmee meerdere gaatjes. Op een klein bord kan dat veel ruimte kosten. De compacte as is het antwoord voor krappe levels.
- **De as is visueel lastig.** De compacte as staat in bovenaanzicht concentrisch; de grote ring achter, de kleine voor, met een slagschaduw en een duidelijke hub. De statische beeldproef leest goed, maar de app moet nog laten zien of dat met animatie en op een klein scherm zo blijft.
- **Riem en ketting zijn geen tandwielen.** Ze hebben geen tandfase; de animatie moet duidelijk maken dat de band of ketting meebeweegt. Een open riem en een ketting mogen niet als hetzelfde lezen; gebruik een dunne band versus duidelijke schakels.
- **De tandheugel heeft een aanslag nodig.** Anders schuift hij van het bord. De leveldata bepaalt de slag; de animatie stopt bij de aanslag.
- **Snelheid tunen.** De waarden 0,5×, 1× en 2× moeten duidelijk voelbaar zijn in de animatie. Te kleine verschillen zien kinderen niet; te grote verschillen worden onrustig.
- **Contentproductie.** Vierentwintig levels met elk een nieuw ingrediënt is meer werk dan vierentwintig varianten van hetzelfde. De leveltabel is daarom leidend; een level dat geen nieuw ingrediënt heeft, komt niet in de release.
- **De generator, de lift, de rupsband en de tandheugel mogen geen decoratie worden.** Ze moeten een andere strategie vragen dan een richtingdoel. De lift vraagt om een langzame as; de lamp om een snelle as; de rupsband en de heugel om lineaire beweging.
- **Kleurgebruik.** Een rode motor zou als fout lezen. Daarom is de motor donker en is groen echt succes.
- **Geen nieuwe runtime-dependency, maar wel een port.** De involute- en fasecode komt uit `mechanism-lab` (MIT). We nemen de MIT-tekst en de bron op; de TypeScript-port blijft onder eigen onderhoud. Dat is minder werk dan de vorm helemaal zelf bedenken, maar het is geen dependency die vanzelf meelift.
- **Sampling en prestaties.** De outline van 42 tanden heeft bij de standaardinstelling al snel honderden punten. Voor de game verlagen we `flankPoints`, `tipPoints` en `rootPoints`, en we berekenen elke outline één keer per tandenaantal. De rotatie blijft CSS, dus er is geen per-frame meetkunde.

## Open vragen

1. **Leeftijd:** ik ga uit van groep 5–8 (8–12 jaar), met de eerste levels speelbaar vanaf groep 3. Klopt dat?
2. **Levelaantal:** de eerste 16 staan; wil je daarna de compacte as, klem, rupsband en tandheugel als volgende slice?
3. **As-varianten:** beide (liggend en compact) of alleen de liggende as?
4. **Tandheugel:** wel of niet meenemen, of liever alleen riem, ketting en rupsband?
5. **Riem en ketting:** als verbinding tussen twee bestaande wielen (zoals nu), of als een kant-en-klaar onderdeel dat je in één keer neerzet?
6. **Uitvoer:** zijn generator + lamp, de lift, de rupsband en de tandheugel de juiste doelen, of wil je liever een ventilator, bel of draaimolen?
7. **Snelheidsmeter:** een kleine wijzer met drie zones, of alleen "traag / goed / snel" als tekst?
8. **Spraak:** korte gesproken instructie toevoegen, of alles visueel houden?
9. **Stijl:** licht papier en hout, of een donkere werkplaats zoals Sprocketry? Ik neig naar licht, passend bij de rest van de app.

## Update 2026-11-15: wormas en tweetraps riem

De eerste release heeft de liggende as vervangen door een **wormas**. Dat is
een bewuste wijziging ten opzichte van de oorspronkelijke scope hierboven:

- De as met twee tandwielen op één starre stang is weg. De wormas is één
  onderdeel met een horizontale schroef en een wormwiel, zoals op de
  referentiefoto.
- De wormas wordt met één tik of drag geplaatst. De app zoekt zelf de tweede
  plek en de kant die het best bij de motor en het doel passen; de speler wijst
  nooit twee gaatjes aan.
- De worm is eenrichtingsverkeer en vertraagt (0,5× of 0,25×). De oude
  "snelle as" bestaat daarom niet meer; de levels 10, 11, 13, 14 en 16 zijn
  herschreven. Een worm kan niet versnellen.
- Een riem of ketting hangt na de eerste drop los om één wiel. Een tweede drag
  aan het losse uiteinde, of een tweede tik op een ander wiel, maakt pas daarna
  de verbinding. Dit vervangt de eerdere "één drag over twee wielen".

De deterministische graaf, de involute-tandwielen, de lokale opslag en de
CSP blijven ongewijzigd. Zie het addendum in
[ADR 0031](../adr/0031-draaiwerk.md).

## Update 2026-11-16: wormas ligt horizontaal op twee gelijke wielen

Na het spelen van level 10 bleek de wormas nog steeds verkeerd te liggen. Het
gewenste beeld is één schroefas die over twee even grote tandwielen ligt en ze
samen verbindt. Daarvoor is de mechanica opnieuw bekeken:

- **Assen.** Een worm en een wormwiel hebben assen die loodrecht op elkaar
  staan. In het bovenaanzicht van het spel staan de wielassen loodrecht op het
  bord en ligt de wormas in het bordvlak. Een rechte wormas kan meerdere
  wielen langs zijn lengte raken.
- **Ongelijke wielen.** Een rechte as raakt twee ongelijke wielen alleen op een
  schuine gemeenschappelijke raaklijn. Op het bord leek de as daardoor boven het
  kleine wiel te zweven en maar één wiel echt te raken. Dat is meetkundig
  juist, maar visueel niet leesbaar voor een kind.
- **Gelijke wielen.** Twee even grote wielen leggen de as horizontaal op beide
  bovenkanten. Daarom is de wormas nu een **compacte wormkast met een vaste
  vertraging** (0,5× of 0,25×) over twee gelijke wielen. De verhouding komt uit
  het onderdeel, niet uit de wieldiameters. Dat is een bewuste abstractie: in
  het echt bepalen het aantal schroefgangen en de tanden van het wormwiel de
  ratio.
- **Plaatsing.** De as ligt horizontaal op `straal + WORM_SHAFT_CLEARANCE` boven
  beide steekcirkels. De speler tikt één wiel; de app kiest het tweede even
  grote wiel. Een as over een derde wiel, over meshende wielen of buiten het
  bord wordt geweigerd.
- **Ribbels.** De as krijgt duidelijke diagonale schroefdraden, een metalen
  gradient, lagers en een contactpatch waar de tanden van beide wielen over de
  as heen zichtbaar blijven.
- **Bronnen.** [Worm drive](https://en.wikipedia.org/wiki/Worm_drive),
  [RoyMech](https://www.roymech.co.uk/Useful_Tables/Drive/Worm_Gears.html) en
  een bestaande [dubbele-uitgang-wormkast](https://tramec.it/en/product/double-output-worm-gearboxes-series-vm)
  met één wormas en twee wormwielen.

De vaste 0,5×/0,25×-ratio's en het eenrichtingsverkeer zijn terug. Level 10 en
11 gebruiken twee even grote wielen; level 12 en 13 houden de ketting als
1×-oplossing en de wormas als te langzame instinker. Zie het addendum in
[ADR 0031](../adr/0031-draaiwerk.md).

## Bronnen

- [Sprocketry — Game Edu Hub](https://gameeduhub.com/sprocketry.html)
- [Crazy Gears — App Store](https://apps.apple.com/us/app/crazy-gears/id967327312)
- [Crazy Gears — Common Sense Media](https://www.commonsensemedia.org/app-reviews/crazy-gears)
- [Gear Puzzle — Plays.org](https://plays.org/gear-puzzle/)
- [Gears: Logic Puzzles — Google Play](https://play.google.com/store/apps/details?id=org.stropin.gearslogicpuzzles)
- [8 tandwielen — Spelletjes.nl](https://www.spelletjes.nl/spel/8-tandwielen)
- [Connect IT — Engineering.com](https://www.engineering.com/games/connect-it/)
- [Computermeester — Tandwielen](https://www.computermeester.be/tandwielen.htm)
- [TinyTap — Soorten tandwielen](https://www.tinytap.com/activities/g549r/play/soorten-tandwielen)
- [Tinybop — Simple Machines](https://tinybop.com/apps/simple-machines)
- [Korbo tandwielen](https://www.caperom.nl/nl/p/korbo-tandwielen-420-delig/)
- [Technopolis — Aan de slag met tandwielen](https://www.technopolis.be/nl/proefjes/aan-de-slag-met-tandwielen/)
- [Techniek in het basisonderwijs — Tandwielen](http://www.techniekinhetbo.nl/lessen/bovenbouw/tandwielen.htm)
- [@dnd-kit/core op npm](https://www.npmjs.com/package/@dnd-kit/core)
- [mechanism-lab op GitHub](https://github.com/jacobplee/mechanism-lab)
- [gearworks op GitHub](https://github.com/Artem1bar/gearworks)
- [gearforge op GitHub](https://github.com/1400130-collab/gearforge)
- [Maker.js op GitHub](https://github.com/microsoft/maker.js)
- [gears-react op npm](https://www.npmjs.com/package/gears-react)
- [svg-gear-generator op GitHub](https://github.com/kamiyo/svg-gear-generator)
- [planck.js op GitHub](https://github.com/piqnt/planck.js)
- [react-gauge-component op npm](https://www.npmjs.com/package/react-gauge-component)
- [svg-gauge op npm](https://www.npmjs.com/package/svg-gauge)
