# Onderzoek: open-source webgames om te integreren

- **Datum:** 2026-10-18
- **Status:** Onderzoek, geen beslissing
- **Vraag:** welke bestaande open-source webgames, game-engines, puzzelcollecties en spellendatasets kunnen we in deze app integreren (vendoren, porten of als dependency), en welke absoluut niet?
- **Kader:** de regels uit [`AGENTS.md`](../../AGENTS.md) en [ADR 0001](../adr/0001-publieke-statische-spellen-app.md): publiek, statisch, alleen TypeScript, geen externe requests, geen backend, strikte CSP in [`apps/games/public/_headers`](../../apps/games/public/_headers). Voor de omgang met andermans materiaal is [ADR 0005](../adr/0005-pokemon-assets.md) de bestaande praktijk.
- **Metingen:** de gemeten groottes en licentiescan zijn uitgevoerd op **2026-10-18 en 2026-10-19**. Bron-URL's staan in [Bronnen](#bronnen).
- **Vervolg:** het vlaggenspel uit advies 1 is gebouwd als **Vlaggenreis** (`/vlaggen`); zie [ADR 0015](../adr/0015-vlaggenspel.md) voor de gemaakte keuzes.

## Kort advies

**Integreer geen complete game. Neem data, regels en hooguit één kleine bibliotheek over — en geen engine.**

1. **Het rendement zit in open data, niet in andermans code.** De Lichess-puzzeldatabase (**CC0**, 6.157.341 schaakpuzzels) sluit direct aan op `/puzzels`, `lichess-org/chess-openings` (**CC0**) op een openingenspel, en `flag-icons` (MIT) + Natural Earth (publiek domein) + `world-atlas` (ISC) leveren samen een compleet landen- en kaartspel voor wereldoriëntatie zonder één externe request. Voor taal is de OpenTaal-woordenlijst (Revised BSD / CC BY 3.0) bruikbaar, maar alleen als subset.
2. **Geen engine.** De gemeten engines zijn 68–353 KB gzip en lossen niets op dat React + SVG + CSS + één canvas niet kan. Meerdere gebruiken `new Function` als feature-detectie (gemeten: PixiJS 5×, Phaser en Excalibur 1×). Bij Phaser en PixiJS zit dat in een `try/catch`, dus onder onze CSP valt de app stil terug op een alternatief pad — precies het soort verborgen gedrag dat je niet in een kinderspel wilt. WebAssembly is met `script-src 'self'` helemaal onbruikbaar. Zie [§3](#3-engines).
3. **Complete games zijn geen bruikbare bouwstenen.** 2048 (MIT) is ongeveer 200 regels eigen logica; Hextris heeft geen eenduidige licentie; Lichess (AGPL-3.0), Scratch GUI/VM (AGPL-3.0), chessground (GPL-3.0) en GCompris (GPL-3.0-or-later) mogen we niet zonder licentiegevolgen overnemen. **Simon Tatham's Puzzle Collection** (MIT-achtige licentietekst) is de enige echte schatkist, maar het is C: overzetten van regels en generatorideeën, niet vendoren.
4. **Computationeel denken kan zonder Blockly** (207 KB gzip, gemeten): eigen commando-blokken en een eigen interpreter passen beter bij de FSD-opzet en bij kinderen. Alleen als vrije code écht nodig is, is `JS-Interpreter` (Apache-2.0, `eval`-vrij) het overwegen waard.
5. **Leg vóór het overnemen vast wat je overneemt**, onder welke licentie en met welke attributie ([§7](#7-licentie-en-attributie)). De repo heeft op dit moment **geen eigen `LICENSE`**; dat maakt het overnemen van GPL/AGPL-code een beslissing van de eigenaar in plaats van een detail.

## 1. Methode en betrouwbaarheid

Getoetst is per kandidaat:

| Toets                     | Bron                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Licentie                  | de `LICENSE`/`LICENCE`/`LICENSES/*` in de repo zelf via `raw.githubusercontent.com`, en de npm-registry       |
| Actualiteit en omvang     | GitHub REST API (`license.spdx_id`, `pushed_at`, `archived`, `stargazers_count`)                              |
| Pakketversie en -licentie | `https://registry.npmjs.org/<pakket>/latest`                                                                  |
| Bundelgewicht             | npm-tarball uitgepakt in `/tmp/opencode/pkgs`, daarna `gzip -9` op het gemeten bestand                        |
| CSP-risico                | `grep` op `new Function`, `eval(` en `WebAssembly` in diezelfde bundels                                       |
| Data en omvang            | de dataset zelf opgehaald (bijvoorbeeld `wordlist.txt`, `countries-110m.json`, `flags/4x3/nl.svg`) en gemeten |

**Wat niet geverifieerd is:** een web-/Emscripten-build van de Simon Tatham-collectie (upstream gaf HTTP 403), de licentie van Kenney-assets (staat als CC0 op de site, hier niet gelezen) en de mate waarin Blockly Games `eval` gebruikt. Waar dat speelt staat het er expliciet bij.

De gemeten gzip-groottes zijn **ondergrenzen**: het zijn bestaande `dist`-bestanden die zijn gezipt, niet getreeshake bundels. Een echte integratie is meestal kleiner (treeshaking) of groter (extra features), dus behandel ze als orde van grootte.

## 2. Complete open-source games

| Game                                                                                                                            | Licentie (bron)                                                                                                                         | Laatste activiteit            | Tech     | Verdict                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [2048](https://github.com/gabrielecirulli/2048)                                                                                 | MIT ([API](https://api.github.com/repos/gabrielecirulli/2048))                                                                          | push 2024-10-24               | JS + DOM | **Mechanica overnemen, niet vendoren.** De spelregels zijn kleiner dan de integratiekosten.                                                    |
| [Simon Tatham's Puzzle Collection](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/)                                       | MIT-achtige licentietekst ([LICENCE](https://raw.githubusercontent.com/chrisboyle/sgtpuzzles/HEAD/LICENCE))                             | upstream via git.tartarus.org | C        | **Regels en generatorideeën overzetten.** Geen webcode; tientallen bewezen puzzels (Flood, Net, Signpost, Pearl) als bron voor eigen entities. |
| [PuzzleScript](https://github.com/increpare/PuzzleScript)                                                                       | MIT ([API](https://api.github.com/repos/increpare/PuzzleScript))                                                                        | push 2026-10-16               | JS       | **Alleen als ideeënbron.** Een eigen puzzel-DSL is een project op zich en past niet bij de FSD-lagen.                                          |
| [Blockly Games](https://github.com/google/blockly-games)                                                                        | Apache-2.0 ([API](https://api.github.com/repos/google/blockly-games))                                                                   | push 2024-07-19               | JS       | **Inspiratie voor Robo Route**, niet integreren (Blockly zelf is 207 KB gzip, zie §5).                                                         |
| [Hextris](https://github.com/Hextris/hextris)                                                                                   | geen SPDX-detectie (NOASSERTION)                                                                                                        | push 2023-05-13               | JS       | **Afraden.** Zonder duidelijke licentie is overnemen een risico dat niet opweegt tegen een eigen variant.                                      |
| [Lichess (lila)](https://github.com/lichess-org/lila)                                                                           | AGPL-3.0 ([API](https://api.github.com/repos/lichess-org/lila))                                                                         | push 2026-10-19               | TS       | **Code afraden, data wél.** De puzzel- en openingendata zijn CC0 en staan los van de AGPL-code.                                                |
| [Scratch GUI](https://github.com/scratchfoundation/scratch-gui) / [scratch-vm](https://github.com/scratchfoundation/scratch-vm) | AGPL-3.0 (beide gearchiveerd)                                                                                                           | push 2026-05                  | JS       | **Afraden.** AGPL plus een VM en blok-editor van ettelijke honderden KB's.                                                                     |
| [GCompris](https://github.com/KDE/gcompris)                                                                                     | GPL-3.0-or-later ([LICENSES/GPL-3.0-or-later.txt](https://raw.githubusercontent.com/KDE/gcompris/master/LICENSES/GPL-3.0-or-later.txt)) | push 2026-10-19               | QML/Qt   | **Afraden.** Desktop-/Qt-stack, GPL en honderden activiteiten met eigen art.                                                                   |

De conclusie is niet dat deze projecten slecht zijn, maar dat **spelregels geen overdraagbare code zijn**. Sudoku, pijlen, memory en woordzoeker in deze repo zijn allemaal klein genoeg gebleken om zelf te schrijven, en juist daardoor testbaar, Nederlandstalig en kindgericht. Dat patroon werkt hier beter dan een vreemde codebase met een eigen stijl, eigen state en eigen aannames over een server.

## 3. Engines

Gemeten op de `dist`-bestanden van het npm-pakket (2026-10-18), plus een scan op `new Function`, `eval(` en `WebAssembly`.

| Engine                                                      | Versie    | Licentie     | Min + gzip (gemeten) | `new Function` | WASM | Verdict                                                                                                                          |
| ----------------------------------------------------------- | --------- | ------------ | -------------------- | -------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Phaser](https://www.npmjs.com/package/phaser)              | 4.2.1     | MIT          | 353 KB               | 1              | 0    | Afraden. `new Function` en 353 KB voor iets dat CSS-animaties al doen.                                                           |
| [PixiJS](https://www.npmjs.com/package/pixi.js)             | 8.22.0    | MIT          | 231 KB               | 5              | 0    | Afraden. Vijf `new Function`-detecties en 231 KB voor iets dat met SVG of één canvas al kan.                                     |
| [Excalibur](https://www.npmjs.com/package/excalibur)        | 0.32.0    | BSD-2-Clause | 194 KB               | 1              | 0    | Afraden.                                                                                                                         |
| [Three.js](https://www.npmjs.com/package/three)             | 0.186.1   | MIT          | 128 KB               | 0              | 0    | Afraden. Geen 3D in deze app.                                                                                                    |
| [LittleJS](https://www.npmjs.com/package/littlejsengine)    | 1.27.2    | MIT          | 164 KB               | 0              | 0    | Afraden, ondanks het nette CSP-profiel.                                                                                          |
| [Kaplay](https://www.npmjs.com/package/kaplay)              | 3001.0.19 | MIT          | 68 KB                | 0              | 0    | **Dichtst bij bruikbaar** (klein, geen `new Function`, ES-module, 0 deps), maar nog steeds overbodig voor grid- en kaartspellen. |
| [Babylon.js](https://www.npmjs.com/package/@babylonjs/core) | 9.31.0    | Apache-2.0   | niet gemeten         | —              | —    | Afraden. 71,8 MB uitgepakt en 3D.                                                                                                |
| [melonJS](https://www.npmjs.com/package/melonjs)            | 20.9.0    | MIT          | niet gemeten         | —              | —    | Afraden.                                                                                                                         |
| [p5.js](https://www.npmjs.com/package/p5)                   | 2.3.4     | **LGPL-2.1** | niet gemeten         | —              | —    | Afraden op licentie: LGPL in een statisch gebundelde app vraagt een licentie-audit die niets oplevert.                           |

**Waarom geen engine.** Onze spellen zijn beurt-gebaseerd en 2D: sudoku, woordzoeker, memory, pijlen, rekenen, schaken. React rendert dat met SVG en CSS sneller en met betere toegankelijkheid dan een canvas-engine, en de bestaande tests draaien op pure functies in `libs/entities/*`. Een engine zou de logica naar een game-loop verplaatsen, de DOM-toegankelijkheid wegnemen en 68–353 KB gzip toevoegen. Als er ooit een echte actie- of physicsgame komt, is **Kaplay** de enige kandidaat die het onderzoek doorstaat — met een nieuwe ADR en een CSP-controle vooraf.

## 4. Data en assets — hier zit de winst

Dit is de categorie waarin een integratie écht tijd bespaart en direct aansluit op de gaten in [`docs/ideas/spelideeen.md`](../ideas/spelideeen.md) (wereldoriëntatie, computationeel denken).

| Bron                                                                                                                           | Wat                                                                                | Licentie                                                                                                                         | Omvang (gemeten)                                                       | Waar het past                                          |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| [Lichess open database](https://database.lichess.org/)                                                                         | 6.157.341 schaakpuzzels, met rating en thema-tags, als `lichess_db_puzzle.csv.zst` | **CC0** (expliciet op de pagina)                                                                                                 | dump van honderden MB's; wij hebben een subset van tienduizenden nodig | `/puzzels` uitbreiden met echte, gevarieerde puzzels   |
| [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings)                                                    | geopende varianten met namen                                                       | **CC0-1.0** (API)                                                                                                                | klein (data, geen binary's)                                            | een openingenspel of uitleg bij de schaaktutorial      |
| [Natural Earth](https://www.naturalearthdata.com/) via [natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) | wereldkaarten op drie schalen                                                      | publiek domein (repo: NOASSERTION)                                                                                               | groot; wij gebruiken alleen de vereenvoudigde laag                     | wereldkaart, topografie                                |
| [world-atlas](https://github.com/topojson/world-atlas)                                                                         | voorgebouwde TopoJSON uit Natural Earth                                            | ISC (API)                                                                                                                        | `countries-110m.json`: 105 KB raw, **ca. 38 KB gzip**                  | kaartspel zonder externe tiles                         |
| [flag-icons](https://github.com/lipis/flag-icons)                                                                              | alle landenvlaggen als SVG                                                         | MIT (API)                                                                                                                        | `flags/4x3/nl.svg` = **225 B**                                         | vlaggenquiz, provincies en landen                      |
| [OpenTaal/opentaal-wordlist](https://github.com/OpenTaal/opentaal-wordlist)                                                    | Nederlandse woordenlijst                                                           | Revised BSD **en/of** CC BY 3.0 ([LICENSE.txt](https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/LICENSE.txt)) | `wordlist.txt`: 5,1 MB raw, **1,37 MB gzip**, 413.937 woorden          | Woordbouw en woordspellen — alleen als subset bundelen |
| [Wikidata](https://www.wikidata.org/)                                                                                          | feiten, namen en labels in het Nederlands                                          | CC0                                                                                                                              | per query klein                                                        | hoofdsteden, inwonertallen, naamgeving                 |
| [Kenney.nl](https://kenney.nl/)                                                                                                | gratis 2D-assets                                                                   | CC0 (staat op de site; hier niet gelezen)                                                                                        | per pakket enkele MB's                                                 | prototypes en placeholders, niet voor de eindstijl     |

**Afgeraden data:** [Open Trivia DB](https://opentdb.com/) (CC BY-SA 4.0, share-alike én een runtime-API), Wikimedia-kaarten en verkeersborden (CC BY-SA, en de meeste borden zijn niet vrij te hergebruiken als ontwerp). Voor verkeersborden is de Nederlandse situatie bovendien onduidelijk: de RVV-borden zijn functioneel openbaar, maar de getekende uitvoeringen kennen vaak eigen rechten. Eigen SVG's tekenen is hier sneller en veiliger dan een licentieonderzoek.

**Praktische waarschuwing bij data:** de Lichess-dump is véél te groot om te bundelen (honderden MB's). Selecteer bij het genereren een subset — bijvoorbeeld puzzels met rating onder 1600 en een bekende thematag — en schrijf die als getypeerde TS of JSON in `libs/entities/`. Zet het selectiescript in `scripts/`, zodat de herkomst reproduceerbaar is.

## 5. Kleine spellogica-bibliotheken

| Bibliotheek                                                              | Versie | Licentie     | Gewicht / opmerking                                                                  | Verdict                                                                                                          |
| ------------------------------------------------------------------------ | ------ | ------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [chess.js](https://www.npmjs.com/package/chess.js)                       | 1.4.0  | BSD-2-Clause | al in gebruik                                                                        | Blijft.                                                                                                          |
| [react-chessboard](https://www.npmjs.com/package/react-chessboard)       | 5.12.1 | MIT          | al in gebruik                                                                        | Blijft.                                                                                                          |
| [sudoku-gen](https://www.npmjs.com/package/sudoku-gen)                   | 1.0.3  | MIT          | al in gebruik                                                                        | Blijft.                                                                                                          |
| [tonal](https://www.npmjs.com/package/tonal)                             | 6.5.1  | MIT          | 269 KB uitgepakt, **23 runtime-dependencies**                                        | Alleen bij noten lezen. Voor losse notennamen is een eigen tabel kleiner.                                        |
| [VexFlow](https://www.npmjs.com/package/vexflow)                         | 5.0.0  | MIT          | entry meet 433 B gzip, maar de volledige notatie plus Bravura-font is honderden KB's | Alleen als er een echte notenbalk met notatie nodig is.                                                          |
| [d3-geo](https://www.npmjs.com/package/d3-geo)                           | 3.1.1  | ISC          | 227 KB uitgepakt, 1 dependency                                                       | Nuttig voor projectie bij een wereldkaartspel; anders `world-atlas` direct in SVG.                               |
| [JS-Interpreter](https://github.com/neilfraser/JS-Interpreter)           | —      | Apache-2.0   | interpreter, geen `eval` nodig                                                       | Alleen voor Robo Route als kinderen vrije code mogen typen of slepen.                                            |
| [Blockly](https://www.npmjs.com/package/blockly)                         | 13.4.0 | Apache-2.0   | `blockly.min.js` = **207 KB gzip** (gemeten)                                         | Afraden; eigen blokken zijn kleiner en passen bij de bestaande UI.                                               |
| [@blex41/word-search](https://www.npmjs.com/package/@blex41/word-search) | 1.2.0  | MIT          | 11,9 KB gzip                                                                         | Al afgewogen in het [woordzoekeronderzoek](2026-10-18-woordzoeker-libraries.md); eigen generator bleef de keuze. |

## 6. Afgeraden, met reden

| Categorie                        | Voorbeelden                                                                              | Reden                                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Virale licenties                 | lila, Scratch GUI/VM (AGPL-3.0); chessground (GPL-3.0, npm); GCompris (GPL-3.0-or-later) | Zou de hele app onder die licentie brengen. Met een publieke repo en géén eigen LICENSE is dat een eigenaarsbesluit, geen bijeffect. |
| Share-alike data                 | Open Trivia DB, Wikimedia-kaarten en -borden                                             | CC BY-SA plant zich voort in onze bundel.                                                                                            |
| WebAssembly                      | Godot-webexport, WASM-ports                                                              | CSP heeft geen `wasm-unsafe-eval`; toevoegen zou de strengste regel van de app verzwakken.                                           |
| Engines                          | Phaser, PixiJS, Excalibur, Three.js, LittleJS, Babylon, melonJS                          | 68–353 KB gzip voor speltypen die React + SVG al dekken.                                                                             |
| Netwerkafhankelijke content      | Open Trivia DB, API-gedreven quizzen                                                     | Breekt offline spelen en stuurt bezoekers-IP's naar een derde partij.                                                                |
| Verkeerde doelgroep of stijl     | commerciële HTML5-ports, retro-arcade                                                    | Geweld, timers, levens en advertenties horen niet bij een app voor 6–12 jaar.                                                        |
| `eval`-gebaseerde gereedschappen | code-generatoren, JS-uitvoerders met `eval`                                              | Wordt door de CSP geblokkeerd; alleen `eval`-vrije varianten zijn bruikbaar.                                                         |

## 7. Licentie en attributie

De repo heeft **geen `LICENSE`-bestand** (gecontroleerd op 2026-10-18), en er is ook geen `NOTICE`. Dat is geen blokkade, maar het bepaalt wat verantwoord is:

- **MIT, BSD, ISC, Apache-2.0:** overnemen mag, mits de copyright- en licentietekst meegaat in de distributie. Leg per overgenomen bestand vast: naam, versie, licentie, bron-URL, datum en wat je hebt aangepast. Eén `NOTICE.md` met die tabel is genoeg; een regel in de bijbehorende ADR verwijst ernaar. Bij Apache-2.0 komt daar de `NOTICE`-plicht bij als het project er een heeft.
- **CC0 en publiek domein:** geen verplichtingen. Vermeld de bron alsnog, want dat is wat een latere update of correctie mogelijk maakt.
- **CC BY / CC BY-SA:** naamsvermelding is verplicht; bij SA ook share-alike op afgeleiden. Voor de OpenTaal-lijst (CC BY 3.0 óf BSD, dus je kunt de BSD-variant kiezen) is dat te regelen; voor Wikimedia-materiaal liever niet.
- **GPL/AGPL:** virale werking. Wil de eigenaar dat, dan hoort daar een expliciet ADR-besluit bij over de licentie van de hele app. Zolang dat besluit er niet is: niet overnemen.
- **Code en assets zijn niet hetzelfde.** ADR 0005 laat zien dat de eigenaar bewust niet-vrije Pokémon-assets bundelt voor een niet-commercieel familiewerk. Die afweging geldt niet automatisch voor code: bij code is er geen praktische noodzaak en wél een reële verplichting.

Controleer bij een overname ook de **transitieve** licenties (zoals de 23 dependencies van `tonal`): één LGPL- of GPL-pakket in de keten verandert het antwoord.

## 8. Aanbevolen vervolgstappen

1. **Schaakpuzzels verrijken (beste eerste stap).** Genereer een subset uit de Lichess CC0-dump via een script in `scripts/`, schrijf die als getypeerde data in `libs/entities/chess-puzzles`, en noteer herkomst en licentie. Laag risico, directe kwaliteitswinst op een bestaand spel.
2. **Wereldoriëntatie bouwen.** `flag-icons` (MIT) plus een vereenvoudigde kaart uit `world-atlas`/Natural Earth (ISC/publiek domein) plus een eigen Nederlandstalige vragenlijst. Let op: Natural Earth levert geometrie, geen Nederlandse namen — die lijst maak je zelf of haal je uit Wikidata (CC0).
3. **Woordbouw op een subset van OpenTaal.** Filter op 4–8 letters en veelvoorkomende woorden; bundel niet de volledige 1,37 MB gzip.
4. **Robo Route zonder Blockly.** Bouw eigen commandoblokken en een eigen grid-interpreter. Voeg `JS-Interpreter` pas toe als vrije code-invoer een eis wordt.
5. **Noten lezen zonder VexFlow, tenzij.** Een eigen notentabel plus WebAudio kost bijna niets; VexFlow en het Bravura-font zijn alleen nodig voor echte notatie.
6. **Zet de licentie-afspraak in de ADR** van elk spel dat iets overneemt, en houd de CSP ongewijzigd. Als een kandidaat de CSP wil verruimen, is dat een eigen ADR met een expliciete afweging — en tot nu toe is er geen kandidaat die dat waard is.

## Bronnen

Alle bronnen zijn geraadpleegd op 2026-10-18 en 2026-10-19.

**Games en gereedschappen**

- <https://github.com/gabrielecirulli/2048> en <https://api.github.com/repos/gabrielecirulli/2048>
- <https://www.chiark.greenend.org.uk/~sgtatham/puzzles/> en <https://raw.githubusercontent.com/chrisboyle/sgtpuzzles/HEAD/LICENCE>
- <https://github.com/increpare/PuzzleScript> en <https://api.github.com/repos/increpare/PuzzleScript>
- <https://github.com/google/blockly-games> en <https://api.github.com/repos/google/blockly-games>
- <https://github.com/Hextris/hextris> en <https://api.github.com/repos/Hextris/hextris>
- <https://github.com/lichess-org/lila> en <https://api.github.com/repos/lichess-org/lila>
- <https://github.com/scratchfoundation/scratch-gui>, <https://github.com/scratchfoundation/scratch-vm>
- <https://github.com/KDE/gcompris> en <https://raw.githubusercontent.com/KDE/gcompris/master/LICENSES/GPL-3.0-or-later.txt>
- <https://github.com/neilfraser/JS-Interpreter> en <https://api.github.com/repos/neilfraser/JS-Interpreter>

**Engines (npm-registry en licenties)**

- <https://registry.npmjs.org/phaser/latest>, <https://registry.npmjs.org/pixi.js/latest>, <https://registry.npmjs.org/kaplay/latest>
- <https://registry.npmjs.org/excalibur/latest>, <https://registry.npmjs.org/three/latest>, <https://registry.npmjs.org/littlejsengine/latest>
- <https://registry.npmjs.org/@babylonjs/core/latest>, <https://registry.npmjs.org/melonjs/latest>, <https://registry.npmjs.org/p5/latest>
- <https://registry.npmjs.org/blockly/latest>, <https://registry.npmjs.org/tonal/latest>, <https://registry.npmjs.org/vexflow/latest>
- <https://registry.npmjs.org/d3-geo/latest>, <https://registry.npmjs.org/chessground/latest>

**Data en assets**

- <https://database.lichess.org/> (puzzeldump en CC0-verklaring)
- <https://github.com/lichess-org/chess-openings> en <https://api.github.com/repos/lichess-org/chess-openings>
- <https://www.naturalearthdata.com/> en <https://github.com/nvkelso/natural-earth-vector>
- <https://github.com/topojson/world-atlas> en <https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json>
- <https://github.com/lipis/flag-icons> en <https://cdn.jsdelivr.net/npm/flag-icons@7.6.0/flags/4x3/nl.svg>
- <https://github.com/OpenTaal/opentaal-wordlist> en <https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/wordlist.txt>
- <https://www.wikidata.org/> en <https://kenney.nl/>
- <https://opentdb.com/> (afgeraden: CC BY-SA en runtime-API)

**Eigen kader**

- [`AGENTS.md`](../../AGENTS.md), [ADR 0001](../adr/0001-publieke-statische-spellen-app.md), [ADR 0005](../adr/0005-pokemon-assets.md)
- [`apps/games/public/_headers`](../../apps/games/public/_headers)
- [docs/ideas/spelideeen.md](../ideas/spelideeen.md) en [docs/research/2026-10-17-game-stack-dependencies.md](2026-10-17-game-stack-dependencies.md)
