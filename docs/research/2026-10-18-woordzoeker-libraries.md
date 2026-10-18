# Woordzoeker: bibliotheken voor een Nederlandse woordzoeker

- **Datum:** 2026-10-18
- **Status:** Onderzoek. De eerste implementatie gebruikte `@aydee-app/word-search`, maar die is vervangen door een eigen generator toen richtingniveaus nodig waren; zie [ADR 0011](../adr/0011-woordzoeker-richtingen.md). De vergelijking en alternatieven hieronder blijven geldig.
- **Aanleiding:** een nieuw spel “Woordzoeker” met de bestaande thema’s **Tuin** en **Onder water**, dezelfde thema’s als het zoekspel `Waar is Wobbel?`.
- **Vraag:** welke npm-bibliotheek genereert een Nederlandse woordzoeker met zo weinig mogelijk eigen code, en past die binnen een publieke, statische Nx/React-app zonder backend of externe requests?
- **Kader:** [AGENTS.md](../../AGENTS.md), [ADR 0001](../adr/0001-publieke-statische-spellen-app.md) en de [CSP in `_headers`](../../apps/games/public/_headers).

## Samenvatting

Geen van de onderzochte pakketten combineert **Nederlandse woorden, oplossingscoördinaten, richtingscontrole en een seed** in één browserveilige, getypeerde ESM-package. De meeste pakketten zijn óf Node/CLI-gereedschap, óf een kant-en-klare UI die niet in onze stijl past, óf ze geven alleen een grid terug zonder te vertellen waar de woorden liggen.

**Advies:**

1. **Eerste keuze: een eigen generator van ongeveer 100–130 regels** in `libs/entities/word-search`, met de bestaande `mulberry32`/`createSeed` uit `@shared/lib`. Dat is de enige optie die zonder meer deterministisch is, oplossingspaden teruggeeft en geen extra dependency, licentie of bundelgewicht toevoegt. De UI, selectie, gevonden-status en toegankelijkheid moeten we toch zelf bouwen; de bibliotheek bespaart alleen de plaatsingslus.
2. **Terugval: `@blex41/word-search`** als de voorkeur “geen plaatsingscode onderhouden” zwaarder weegt dan seed-determinisme. Het is het enige volwassen pakket met alle acht richtingen, uitschakelbare richtingen en `path`-coördinaten per woord. Nadelen: geen TypeScript-types, CJS in plaats van ESM, geen seed, 12 KB gzip en de laatste release is van 2021.
3. **Alleen als vooruit-only acceptabel is: `@aydee-app/word-search`.** Klein (1,8 KB gzip), ESM, TypeScript en nul runtime-dependencies, maar het plaatst alleen horizontaal, verticaal en diagonaal naar beneden-rechts, heeft geen seed en gooit een fout als een woord niet past.

**Uiteindelijk is een eigen generator gekozen**, omdat de richtingniveaus (makkelijk alleen vooruit, moeilijk alle acht richtingen) met `@aydee` niet te maken zijn. Zie [ADR 0011](../adr/0011-woordzoeker-richtingen.md).

Een eigen generator is hier geen “not invented here”-reflex: de plaatsingslogica is klein, de eisen zijn smal (10×10, 12×12 of 14×14, 8–12 woorden, twee thema’s) en de repo heeft al een deterministische PRNG en generator-tests. De bibliotheek kost ons vooral een extra abstractie, een licentie-audit en een bundel van 2–12 KB (geschat), zonder de UI te leveren.

## 1. Context en eisen

Het spel is een klassieke woordzoeker: een rechthoekig grid met letters, een woordenlijst ernaast en een gevonden-status per woord. De speler sleept over het woord; twee tikken blijven als alternatief. Bij een correcte selectie wordt het woord doorgestreept en blijven de cellen gemarkeerd.

| Eis          | Waarde                                                                         |
| ------------ | ------------------------------------------------------------------------------ |
| Woorden      | 8–12 Nederlandse woorden per puzzel, 3–8 letters                               |
| Thema’s      | `tuin` en `onderwater`, aansluitend bij `SEEK_THEMES`                          |
| Grid         | 10×10 (makkelijk), 12×12 (gemiddeld), 14×14 (moeilijk); vierkant is genoeg     |
| Richtingen   | horizontaal en verticaal; diagonaal en achteruit alleen op hogere moeilijkheid |
| Oplossing    | per woord de geordende cellen, nodig voor markeren, hint en “gevonden”         |
| Determinisme | liefst een seed, zodat tests en een herlaadde pagina dezelfde puzzel geven     |
| Platform     | browser, ESM, TypeScript, geen Node-built-ins, geen runtime-netwerk            |
| Licentie     | MIT of vergelijkbaar, compatibel met een publieke repo                         |
| UI           | touch-first, 44 px-targets waar mogelijk, toetsenbord en schermlezer           |
| Bundel       | liefst ≤ 5 KB gzip; het huidige JS-budget is ongeveer 123 KB gzip              |

De UI is hoe dan ook eigen werk: pointer/touch-selectie, een lijn of highlight over de cellen, de woordenlijst, gevonden-status, hint, viering, opslag en toegankelijkheid. Een generator levert alleen `grid` en `placements`.

## 2. Werkwijze en verificatie

Ik heb op **2026-10-18** het volgende gecontroleerd:

- npm-registrymetadata via `https://registry.npmjs.org/<pakket>` (versie, publicatiedatum, licentie, dependencies, `unpackedSize`, `fileCount`, `types`, `exports`);
- wekelijkse downloads via `https://api.npmjs.org/downloads/point/last-week/<pakket>` (venster **2026-10-10 t/m 2026-10-16**);
- de gepubliceerde tarballs uitgepakt en de bron/`dist` met de hand gelezen, inclusief `grep` op `require(`, `fs`, `path`, `crypto`, `window`, `document`, `Math.random` en `seed`;
- de generatoren lokaal in Node 24.21.0 aangeroepen met Nederlandse woorden;
- GitHub-repo’s, commits, open issues en archiefstatus via de GitHub-API;
- gzip-groottes met `gzip -9c <bestand> | wc -c` op het genoemde bestand, niet via Bundlephobia.

Belangrijk: **`word-search-generator`, `word-search` en `word-search-builder` bestaan op deze datum niet in het npm-register (HTTP 404).** De generator die in de praktijk “word-search-generator” heet, is het gescopete `@sbj42/word-search-generator`. `puzzle-maker` is geen woordzoeker maar een 9-cel-puzzel met Vue 2 en is daarom afgevallen.

## 3. Vergelijking

### 3.1 Pakket, licentie en onderhoud

| Pakket                         | Latest (publicatie) | Downloads/week | Licentie                                             | Runtime-deps                             | Module & types                                 |   Unpacked |                 Dist gzip | Onderhoud                                               |
| ------------------------------ | ------------------- | -------------: | ---------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- | ---------: | ------------------------: | ------------------------------------------------------- |
| `@blex41/word-search`          | 1.2.0 (2021-06-15)  |            472 | MIT (LICENSE aanwezig)                               | `lodash`, `diacritics`                   | CJS + UMD; **geen types**                      |    83,3 KB |                   11,9 KB | laatste commit default branch 2021-06-15; 12 open items |
| `@aydee-app/word-search`       | 0.1.1 (2025-01-20)  |              9 | MIT (LICENSE aanwezig)                               | geen                                     | ESM; types bundled                             |    14,6 KB |                    1,8 KB | laatste commit 2025-01-20; 2 sterren; 0 issues          |
| `@sbj42/word-search-generator` | 0.1.2 (2021-01-18)  |             38 | MIT (LICENSE aanwezig)                               | geen                                     | CJS; **geen types**                            |    26,3 KB |                    1,4 KB | laatste commit 2021-09-25; 3 dependabot-items           |
| `word-search-puzzle-generator` | 1.0.1 (2025-12-20)  |              7 | **geen licentieveld**; README zegt MIT; geen LICENSE | peer `react`, `react-dom`                | ESM-syntax, maar packaging stuk; types bundled |   224,9 KB | 1,7 KB (alleen generator) | 1 ster; 0 issues; 2 versies                             |
| `word-search-puzzle`           | 1.0.23 (2021-12-10) |             14 | MIT volgens `package.json`; geen LICENSE             | `react@16`, `react-dom@16` (gewone deps) | CJS/UMD; **geen types**                        |    36,2 KB |                    2,0 KB | laatste commit 2021-12-09; 4 sterren                    |
| `wordsearch`                   | 0.1.0 (2019-02-19)  |              7 | **geen licentieveld en geen LICENSE**                | `posix-getopt`, `latest` (CLI)           | CJS/UMD; **geen types**                        |    16,2 KB |                    1,8 KB | laatste commit 2020-01-14; 35 sterren                   |
| `wordsearch-generator`         | 1.3.3 (2018-09-14)  |             17 | MIT volgens `package.json`; geen LICENSE             | `lodash`                                 | CJS; **geen types**                            |    25,5 KB |                    2,3 KB | laatste commit 2018-09-14                               |
| `lettras`                      | 0.5.1 (2026-10-13)  |            465 | MIT-wrapper, **proprietary engine**                  | geen (eigen WASM)                        | ESM; types bundled                             | 1.158,8 KB |           402 KB (engine) | laatste commit 2026-10-15; 0 sterren                    |

Toelichting bij de groottes: bij `@blex41` is `dist/wordsearch.node.js` gemeten (36.649 B → 11.965 B gzip); bij `@aydee` `dist/index.js` (6.210 B → 1.840 B); bij `@sbj42` `dist/generator.js` (4.519 B → 1.379 B); bij `word-search-puzzle-generator` `dist/generator.js` (5.723 B → 1.687 B; de React-componenten zijn niet meegeteld); bij `word-search-puzzle` de root-entry (9.459 B → 2.020 B, inclusief geïnjecteerde CSS); bij `wordsearch` `wordsearch.js` (5.202 B → 1.815 B); bij `wordsearch-generator` `bin/index.js` (7.597 B → 2.347 B); bij `lettras` `engine/index.js` (1.097.037 B → 402.312 B). Dit zijn bestandsmetingen, geen volledige applicatiebundels.

Geen van de onderzochte repo’s was op 2026-10-18 gearchiveerd of als deprecated gemarkeerd. `@blex41` en `@sbj42` zijn wel stil: hun laatste release is van 2021.

### 3.2 API en spellogica

| Pakket                         | Eigen woorden                              | Oplossing                               | Richtingen                                            | Achteruit                       | Seed                | Vulletters                     | Nederlands/ASCII                                 |
| ------------------------------ | ------------------------------------------ | --------------------------------------- | ----------------------------------------------------- | ------------------------------- | ------------------- | ------------------------------ | ------------------------------------------------ |
| `@blex41/word-search`          | `dictionary: string[]`                     | `ws.words[].path` met `{x,y}`           | 8 (`N,S,E,W,NE,NW,SE,SW`), per richting uit te zetten | ja, `backwardsProbability`      | **nee** (issue #17) | A–Z, `upperCase`, `diacritics` | A–Z; accenten optioneel; `ij` = twee cellen      |
| `@aydee-app/word-search`       | `words: string[]`                          | `getPositions()` / `export().positions` | 3: horizontaal, verticaal, diagonaal                  | **nee**                         | **nee**             | A–Z                            | alleen `^[A-Za-z]+$`; geen accenten              |
| `@sbj42/word-search-generator` | `words: string[]`                          | **nee**, alleen `grid` en `words`       | 4 of 8 (`diagonals`), altijd inclusief achteruit      | ja, maar niet te sturen         | **nee**             | A–Z                            | `toUpperCase` per letter; filter werkt niet echt |
| `word-search-puzzle-generator` | `words: string[]`                          | `placedWords[].path` met `{row,col}`    | 8 (H/V/diagonaal, elk vooruit/achteruit)              | ja, `allowReverse`              | **nee**             | A–Z                            | `toUpperCase`; alleen ASCII                      |
| `word-search-puzzle`           | **nee**, krijgt een kant-en-klare `matrix` | **nee**, alleen UI-state                | 4 UI-paden                                            | ja (`right2left`, `bottom2top`) | n.v.t.              | n.v.t.                         | UI; geen generator                               |
| `wordsearch`                   | `words: string[]`                          | `solved`-matrix, **geen coördinaten**   | 4 (rechts, omlaag, diagonaal, omhoog-rechts)          | ja, 50% standaard               | **nee**             | `opts.letters`                 | alleen `^[a-z]+$`; geen hoofdletters/acenten     |
| `wordsearch-generator`         | `words: string[]`                          | **nee**, alleen `grid`                  | 3 (H/V/diagonaal)                                     | ja, willekeurig                 | **nee**             | `en`- of `es`-alfabet          | geen Nederlands; alleen en/es                    |
| `lettras`                      | `words: string[]`                          | `placements` met start, stap en lengte  | H/V/gemengd (8)                                       | ja                              | **ja**              | per taal, 6 talen              | **geen Nederlands**; accenten blijven            |

### 3.3 Overige pakketten die ik heb bekeken

Deze kwamen uit de npm search-API (`https://registry.npmjs.org/-/v1/search`) en zijn op dezelfde manier gecontroleerd.

| Pakket                                                                        | Omvang                                                          | Waarom niet                                                                                                                                                                                               |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `simple-wordsearch-generator` 1.0.0 (2026-06-17; 2 downloads/week)            | 66,4 KB unpacked; 27 KB aan `dist`-JS (niet als bundle gemeten) | Mooie API met `placements` en 8 richtingen, maar geen repository-URL, geen LICENSE-bestand, één versie en geen seed. De ESM-imports in `dist` zijn extensieloos, waardoor Node het pakket niet kan laden. |
| `@alejandrorm-dev/word-search-generator` 1.0.0 (2022-11-10; 6 downloads/week) | 8,5 KB unpacked; 2,9 KB entry                                   | Acht richtingen, maar alleen een `solution`-matrix zonder coördinaten per woord, geen types en geen seed.                                                                                                 |
| `puzzletide` 0.2.0 (2026-07-17; 31 downloads/week)                            | 194,8 KB unpacked                                               | CLI/PDF-generator met `commander` en `pdf-lib`; niet browser-first en veel te zwaar voor dit doel.                                                                                                        |
| `@webwriter/word-puzzle` 1.0.6 (2026-06-11; 14 downloads/week)                | 1,1 MB unpacked                                                 | Lit/Shoelace-webcomponent met veel UI-dependencies; past niet in React/FSD en levert een eigen UI.                                                                                                        |
| `puzzle-maker` 1.0.0 (2020-03-26; 0 downloads/week)                           | 724,9 KB unpacked                                               | Geen woordzoeker: “create a 9-cell-puzzle for mobile”, Vue 2 + core-js.                                                                                                                                   |

## 4. Bevindingen per serieuze kandidaat

### 4.1 `@blex41/word-search` — meest complete, maar stokoud en niet seedbaar

Dit is de enige bibliotheek die alles doet wat een echte woordzoeker nodig heeft:

- eigen woorden via `dictionary`;
- acht richtingen, met `disabledDirections` om richtingen uit te zetten;
- `backwardsProbability` voor achteruit geplaatste woorden;
- `maxWords`, `forbiddenWords` en `maxRetries`;
- `ws.grid` en `ws.words[].path` met de exacte cellen per woord;
- `dump()`/`load()` om een puzzel te bewaren;
- `read(start, end)` om een selectie te controleren;
- `upperCase` en `diacritics`.

In de browser is het pakket veilig: de CJS-build `dist/wordsearch.node.js` bevat geen onvoorwaardelijke Node-imports. De enige `require("util")` die ik vond zit in de meegebundelde lodash-code en is afgeschermd met `a && a.require`, zodat hij in een browser niet wordt uitgevoerd. Er is ook een UMD-build (`dist/wordsearch.min.js`), maar die verwijst op topniveau naar `window` en is dus alleen voor een `<script>`-tag geschikt.

De nadelen zijn echter precies de punten die voor ons zwaar wegen:

- **Geen TypeScript-types.** Er is geen `.d.ts` in het pakket en geen `@types/blex41__word-search` in het register. We moeten zelf een module-declaratie schrijven.
- **Geen ESM.** Het pakket is CJS; Vite kan het pre-bundelen, maar het is geen moderne ESM-package.
- **Geen seed.** Issue [#17](https://github.com/blex41/word-search/issues/17) vraagt al sinds 2022 om een configureerbare RNG; die is er niet. Alle plaatsing en shuffling gebruiken `Math.random`.
- **`load()` is niet betrouwbaar op een nieuwe instantie.** Issue [#26](https://github.com/blex41/word-search/issues/26) laat zien dat `new WordSearch().load(dump)` de grid-afmetingen niet overneemt; ik heb dat lokaal bevestigd: de uitkomst werd 10×10 in plaats van 8×8. Alleen `new WordSearch({cols, rows}).load(dump)` gaf het juiste resultaat. Beter slaan we daarom onze eigen DTO op en gebruiken we `load()` helemaal niet.
- **Woorden kunnen stil verdwijnen.** In mijn test op een 5×5-grid met `cactus`, `fiets`, `geit` en `huis` plaatste het pakket alleen `fiets`, `geit` en `huis`; `cactus` werd zonder fout weggelaten. We moeten dus zelf controleren of `ws.words.length` gelijk is aan de invoer en anders opnieuw genereren.
- **Onderhoud.** De laatste commit op de default branch is van 2021-06-15; de laatste push (inclusief dependabot-branches) is van 2022-12-30. Er staan 12 open items, waaronder de seed- en load-issues.

De API is wel prettig: `ws.words[].path` is een array van `{x, y}` (x = kolom, y = rij) en `ws.grid` is een `string[][]`. Met `disabledDirections: ["N","W","NW","SW","NE"]` en `backwardsProbability: 0` blijven alleen oost, zuid en zuid-oost over; dat is een goede “makkelijk”-stand. Let op: `backwardsProbability: 0` alléén is niet genoeg. Die optie bepaalt alleen de voorkeursvolgorde; als een woord vooruit niet past, probeert de generator alsnog de achteruit-richtingen. Wil je achteruit echt uitsluiten, dan moeten `N`, `W`, `NW` en `SW` (en voor strikt vooruit ook `NE`) in `disabledDirections` staan.

### 4.2 `@aydee-app/word-search` — klein, schoon, maar alleen vooruit

Dit is technisch de schoonste optie: ESM, TypeScript, nul runtime-dependencies, 1,8 KB gzip en een MIT-licentie met LICENSE-bestand. De hele generator is ongeveer 6 KB en gebruikt geen `window`, `document`, `fs` of netwerk.

De API is bewust minimaal:

```ts
const ws = new WordSearch({ words, size: 8, allowDiagonal: true, fillBlanks: true });
const grid = ws.generate();
ws.getPositions(); // Map<woord, {x,y}[]>
```

Beperkingen:

- **Alleen vooruit.** De richtingen zijn `horizontal`, `vertical` en `diagonal` (naar beneden-rechts). Achteruit plaatsen kan niet; er is ook geen `allowReverse`.
- **Geen seed.** `shuffleArray` en de plaatsing gebruiken `Math.random`.
- **Geen moeilijkheidsgraad.** Je kunt alleen `size` en `allowDiagonal` kiezen.
- **Gooit een fout als een woord niet past.** Na 300 pogingen stopt `generate()` met `Could not place word: …`; er is geen gedeeltelijk resultaat en geen `unplaced`-lijst.
- **Alleen vierkant.** `size` is één getal; rechthoekige grids kunnen niet.
- **Zeer jong project.** 9 downloads/week, 2 sterren, laatste commit op de dag van de release (2025-01-20). De code is klein genoeg om te forken, maar het is geen bewezen package.

Voor een kinderwoordzoeker is “alleen vooruit” verdedigbaar, maar dan nog steeds zonder seed. Dat maakt het voor tests en replay minder aantrekkelijk dan een eigen generator.

### 4.3 `@sbj42/word-search-generator` — klein en snel, maar geen oplossing

Dit is de generator achter de naam “word-search-generator”. Het is een CJS-pakket van 4,5 KB (1,4 KB gzip), MIT, zonder runtime-dependencies. De API is simpel:

```js
const puzzle = generator({ words, width: 10, height: 10, diagonals: true });
puzzle.grid; // string[]
puzzle.words; // alleen de geplaatste woorden, alfabetisch
```

Het grote probleem: **er zijn geen coördinaten**. Je krijgt een platte grid en een lijst woorden, maar niet waar ze liggen. Je kunt ze zelf terugzoeken, maar dat is precies de logica die je wilde vermijden. Bovendien:

- `require("fs")` wordt gebruikt als `words` ontbreekt (de ingebouwde 2.000-woordenlijst). Als we altijd `words` meegeven, wordt die code niet uitgevoerd, maar een bundler ziet de `require` wel.
- Geen TypeScript-types.
- Geen seed; `Math.random` bepaalt alles.
- Geen fijnmazige richtingscontrole: `diagonals` aan/uit, en achteruit zit er altijd bij.
- Woorden kunnen wegvallen; in mijn test op 5×5 werden 4 van de 5 woorden geplaatst.

Als je alleen een grid wilt printen, is dit prima. Voor een interactief spel met “gevonden”-status is het onvoldoende.

### 4.4 `word-search-puzzle-generator` — moderne React-component, kapotte publicatie

Dit pakket ziet op het eerste gezicht aantrekkelijk uit: TypeScript, React 18/19-peer, `generateGrid()` met `placedWords[].path`, acht richtingen, `allowReverse`, `allowDiagonal` en `fillBlanks`. De generator zelf is 5,7 KB (1,7 KB gzip).

Maar de publicatie is niet in orde:

- `package.json` heeft **geen `license`-veld**; alleen de README zegt MIT. Er zit geen LICENSE-bestand in de tarball en de GitHub-repo heeft geen detected license.
- `"module": "dist/index.mjs"` wijst naar een bestand dat **niet in het pakket zit**.
- `dist/index.js` bevat ESM-syntax (`export * from ...`), maar het pakket heeft **geen `"type": "module"`**; Node kan de entry niet laden. Vite zal het waarschijnlijk via esbuild redden, maar dit is geen betrouwbare packaging.
- `allowOverlap` staat in het type, maar wordt in de generator **nergens gebruikt**; overlaps zijn altijd toegestaan.
- De tarball is 225 KB en bevat een complete voorbeeldapp met `package-lock.json`, screenshots en voorbeeldassets.
- Geen seed; 7 downloads/week; twee versies (1.0.0 op 2025-12-02, 1.0.1 op 2025-12-20).

De bijgeleverde UI is bovendien niet wat we willen: eigen CSS-klassen, muis/touch-afhandeling en geen Nederlandse labels. We zouden alleen `generateGrid()` gebruiken, maar de index re-exporteert ook de React-componenten; de effectieve bundel kan dus groter zijn dan de 1,7 KB van de generator alleen. Daar komt het packaging- en licentierisico bij.

### 4.5 `word-search-puzzle` — alleen UI, en een agressieve globale CSS-reset

Dit is geen generator. Je geeft een `matrix` en een `answerWords`-lijst mee; de component regelt de selectie. De nadelen zijn groot:

- Het package heeft `react@16` en `react-dom@16` als **gewone dependencies**, niet als peer. In een React 19-app levert dat een tweede React-kopie of een conflict op.
- De bundel injecteert globale CSS, inclusief `* { user-select: none; }` en een `table, tr, td`-reset. Dat botst met de rest van de app.
- Geen TypeScript-types.
- Geen generator, dus we moeten alsnog zelf woorden plaatsen.
- Alleen muis/touch via `onMouseEnter`/`onMouseDown`; geen toetsenbord of ARIA.
- Geen LICENSE-bestand; alleen een MIT-veld in `package.json`.

Afgevallen.

### 4.6 `wordsearch` en `wordsearch-generator` — oude Node/CLI-generatoren

`wordsearch` (2019) is een IIFE/UMD-bestand van 5,2 KB. Het werkt in de browser en heeft een `solved`-matrix, maar:

- alleen vier richtingen (rechts, omlaag, diagonaal, omhoog-rechts);
- alleen lowercase `[a-z]+`; hoofdletters en accenten worden weggefilterd;
- geen coördinaten per woord, alleen een `solved`-grid met de letters van de oplossing;
- geen LICENSE-veld en geen LICENSE-bestand;
- geen types;
- de CLI-dependencies `posix-getopt` en `latest` zijn voor onze bundel irrelevant, maar maken het package onnodig Node-achtig.

`wordsearch-generator` (2018) is een Babel-CJS-module met lodash. Het plaatst horizontaal, verticaal en diagonaal, maar:

- alleen `en`- en `es`-alfabetten voor de vulletters;
- geen coördinaten;
- geen types;
- geen LICENSE-bestand;
- laatste commit 2018.

Beide zijn geen serieuze kandidaten.

### 4.7 `lettras` — seedbaar, maar proprietary engine en geen Nederlands

`lettras` is het enige gevonden pakket met **seed + placements + richtingen** in één API:

```ts
const puzzle = generate({ words, rows: 9, cols: 9, position: "mixed", seed: 8 });
puzzle.placements; // start, step, length
```

Het is ESM, heeft TypeScript-types en doet geen netwerkrequests: de engine zit als base64-WASM in `engine/index.js`. Maar:

- **Geen Nederlands.** De ondersteunde talen zijn `es`, `en`, `pt`, `fr`, `de`, `it`. Nederlandse woorden zouden als “Spaans” of “Engels” behandeld worden; de vulletters en taalregels kloppen dan niet.
- **Proprietary engine.** De wrapper is MIT, maar `engine/` heeft een eigen licentie: niet wijzigen, niet los distribueren, niet decompileren. Dat is een extra juridische verplichting in een publieke repo.
- **CSP.** De app heeft `script-src 'self'` zonder `'wasm-unsafe-eval'`. WebAssembly-compilatie wordt daardoor in productie geblokkeerd; de CSP aanpassen zou een ADR en een bewuste verzwakking vereisen.
- **Grootte.** De engine is 1,1 MB (402 KB gzip), plus de wrapper.
- **Zeer jong.** 0 sterren, 465 downloads/week, laatste release 2026-10-13.

Ondanks de seed is dit voor deze app geen optie.

## 5. Aanbeveling

### 5.1 Eerste keuze: eigen generator in `libs/entities/word-search`

Schrijf een kleine, pure generator met de bestaande deterministische PRNG. Dat is hier de betere call om vijf redenen:

1. **Determinisme is een harde eis voor tests en replay.** Geen enkele geschikte bibliotheek heeft een seed. `dump()`/`load()` of een opgeslagen DTO werkt achteraf, maar dan test je nog steeds geen verse generatie.
2. **We hebben de oplossingspaden nodig.** `@sbj42`, `wordsearch` en `wordsearch-generator` geven die niet; `@blex41` en `@aydee` wel, maar met de nadelen hierboven.
3. **De plaatsingslus is klein.** Voor 8–12 woorden op 10×10 tot 14×14 is “probeer een startpunt, controleer botsingen, schrijf letters, vul de rest” ongeveer 80 regels. De UI, selectie en gevonden-status zijn toch al eigen werk.
4. **De repo heeft de bouwstenen al.** `mulberry32`, `createSeed` en `shuffledIndexes` staan in [`libs/shared/lib/random.ts`](../../libs/shared/lib/random.ts); `createSeekScene` en de sudoku-generator laten zien hoe we zulke code testen. De bestaande `sudoku-gen` is een precedent voor een kleine generator, maar die is niet seedbaar; voor de woordzoeker kunnen we dat wel zijn.
5. **Geen extra licentie, dependency of bundel.** Een eigen generator is naar schatting ongeveer 2 KB gzip en hoeft niet door een licentie-audit.

De globale vorm:

```ts
// libs/entities/word-search/model/types.ts
export type WordSearchTheme = "tuin" | "onderwater";
export type WordSearchDifficulty = "makkelijk" | "gemiddeld" | "moeilijk";

export interface Cell {
  row: number;
  col: number;
}

export interface WordSearchPlacement {
  word: string;
  cells: readonly Cell[];
}

export interface WordSearchPuzzle {
  seed: number;
  theme: WordSearchTheme;
  difficulty: WordSearchDifficulty;
  size: number;
  grid: readonly (readonly string[])[];
  placements: readonly WordSearchPlacement[];
}
```

```ts
// libs/entities/word-search/model/generator.ts (schets, geen volledige implementatie)
import { mulberry32, shuffledIndexes } from "@shared/lib";

const DIRECTIONS = {
  makkelijk: [
    [0, 1],
    [1, 0],
  ],
  gemiddeld: [
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  moeilijk: [
    [0, 1],
    [1, 0],
    [1, 1],
    [0, -1],
    [-1, 0],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ],
} as const;

export function createWordSearch(
  theme: WordSearchTheme,
  difficulty: WordSearchDifficulty,
  seed: number,
): WordSearchPuzzle {
  const random = mulberry32(seed);
  const { size, wordCount } = WORD_SEARCH_CONFIG[difficulty];
  const pool = WORD_SEARCH_WORDS[theme];
  const words = shuffledIndexes(pool.length, random)
    .slice(0, wordCount)
    .map((index) => pool[index]);

  const grid = Array.from({ length: size }, () => Array<string>(size).fill(""));
  const placements = words.map((word) => placeWord(grid, word, DIRECTIONS[difficulty], random));
  fillBlanks(grid, random);

  return { seed, theme, difficulty, size, grid, placements };
}
```

Belangrijke details voor de implementatie:

- **Elk woord moet geplaatst worden.** Geen stille drop. Probeer per woord maximaal ~200 startpunten; lukt het niet, probeer de hele puzzel opnieuw met een nieuwe shuffle (bijvoorbeeld maximaal 5 pogingen) en gooi anders een duidelijke ontwikkelaarsfout. Test dit over 1.000 seeds per thema/moeilijkheid.
- **Schrijf geen letter over een andere letter heen**, tenzij hij gelijk is; dat geeft kruisingen.
- **Vulletters:** A–Z. Voor “makkelijk” kun je Q en X weglaten, maar dat is een speelbaarheidskeuze, geen technische noodzaak.
- **Geen `Math.random` in de generator.** Alleen de geïnjecteerde `random`-functie.
- **`createSeed()` alleen bij een nieuw spel**, niet bij het herladen van een opgeslagen spel.
- **Selectie-logica apart en puur:** `cellsBetween(start, end)` en `matchesPlacement(path, placement)`. Zo test je de UI-logica zonder DOM.

### 5.2 Terugval: `@blex41/word-search`

Kies dit alleen als het team expliciet geen plaatsingscode wil onderhouden en akkoord gaat met:

- een `.d.ts` van ~20 regels;
- een CJS-dependency in een verder ESM-project;
- geen seed (tests met een vaste fixture of `dump()`);
- 12 KB gzip en een verouderde dependency;
- een retry-lus als een woord niet geplaatst is.

Een dunne adapter in `libs/entities/word-search/model/generator.ts`:

```ts
import WordSearch from "@blex41/word-search";

const DISABLED: Record<WordSearchDifficulty, string[]> = {
  // Alleen oost en zuid.
  makkelijk: ["N", "W", "NW", "SW", "NE", "SE"],
  // Oost, zuid en zuid-oost.
  gemiddeld: ["N", "W", "NW", "SW", "NE"],
  // Alle acht richtingen, inclusief achteruit.
  moeilijk: [],
};

export function createWordSearch(
  theme: WordSearchTheme,
  difficulty: WordSearchDifficulty,
  seed: number,
): WordSearchPuzzle {
  const words = pickWords(theme, difficulty);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ws = new WordSearch({
      cols: SIZE[difficulty],
      rows: SIZE[difficulty],
      dictionary: words,
      disabledDirections: DISABLED[difficulty],
      backwardsProbability: difficulty === "moeilijk" ? 0.25 : 0,
      upperCase: true,
      maxWords: words.length,
    });

    if (ws.words.length === words.length) {
      return {
        seed,
        theme,
        difficulty,
        size: SIZE[difficulty],
        grid: ws.grid,
        placements: ws.words.map(({ word, path }) => ({
          word: word.toLowerCase(),
          cells: path.map(({ x, y }) => ({ row: y, col: x })),
        })),
      };
    }
  }
  throw new Error("Kon niet alle woorden plaatsen");
}
```

Let op: `backwardsProbability` is een kans op een voorkeursrichting, geen harde schakelaar. Met `0` probeert de generator eerst vooruit, maar als een woord vooruit niet past, kan hij alsnog een achteruit-richting kiezen. De `disabledDirections` hierboven doen het echte werk: “makkelijk” heeft alleen oost en zuid, “gemiddeld” oost, zuid en zuid-oost, en “moeilijk” alle acht richtingen. De `seed` in dit voorbeeld is alleen metadata; de generator gebruikt hem niet.

Als je `@blex41` kiest, sla dan **niet** `dump()` op, maar je eigen `{ grid, placements, seed, theme, difficulty }`. Dan hoef je niet met de kapotte `load()` te werken.

### 5.3 Wanneer een bibliotheek wél de betere keuze is

Een kant-en-klare generator wint zodra:

- je tientallen woorden en dichte kruisingen wilt, of een echte moeilijkheidsgraad op basis van plaatsingsheuristieken;
- je meerdere talen en alfabetten wilt ondersteunen;
- je een printable PDF of een export voor werkbladen wilt;
- je geen seeded tests of replays nodig hebt;
- je de plaatsingscode niet wilt testen en een bewezen, onderhouden algoritme belangrijker vindt dan een geschatte 2 KB bundel.

Voor deze app is geen van die punten aan de orde. De eisen zijn smal en de UI is het grootste werk.

### 5.4 Als “zo weinig mogelijk eigen code” een harde eis is

De eerste keuze hierboven is technisch de sterkste, maar het is wél ongeveer 100–130 regels eigen spellogica plus tests. Als de wens “zo weinig mogelijk eigen code” zwaarder weegt dan seed-determinisme, is **`@aydee-app/word-search` de beste bibliotheek**:

- MIT met LICENSE-bestand, ESM, TypeScript-types, nul runtime-dependencies en 1,8 KB gzip;
- `getPositions()` en `export()` geven per woord de coördinaten, dus de gevonden-status en hint kunnen zonder extra scan;
- de adapter is ongeveer 20 regels: woorden uit het thema kiezen, `size` meegeven, `generate()` aanroepen en de posities omzetten naar `{ row, col }`;
- de beperkingen zijn voor een kinderwoordzoeker acceptabel: alleen vooruit (horizontaal, verticaal en diagonaal naar beneden-rechts) en geen seed. Moeilijkheid komt dan uit gridgrootte en het aantal woorden, niet uit achteruit of omhoog.

Wat je dan bewust opgeeft:

- **Seed:** sla niet alleen een seed op, maar de hele puzzel (`size`, `grid`, `placements`) in `localStorage`. Dan is een herlaadde pagina nog steeds identiek. Voor tests gebruik je een vaste fixture of mock je `Math.random`.
- **Plaatsingsgarantie:** het pakket gooit een fout als een woord niet past. Vang die fout op en probeer het enkele keren opnieuw; kies daarna een korter woord of een groter grid. Met 8–12 woorden van 3–8 letters op 10×10 tot 14×14 is dat in de praktijk zeldzaam.
- **Onderhoud:** het pakket is jong (0.1.1, 9 downloads/week). Pin de exacte versie, commit de lockfile en houd de bron klein genoeg om te kunnen forken. De hele generator is ongeveer 6 KB.

`@blex41/word-search` is alleen de betere bibliotheekkeuze als je per se alle acht richtingen en `read()` wilt. Het is completer, maar ouder, CJS, zonder types, 12 KB en nog steeds niet seedbaar. Voor de eerste versie van een Nederlandse kinderwoordzoeker weegt dat niet op tegen `@aydee`.

Kort:

| Prioriteit                                        | Keuze                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| Technisch beste, deterministisch, alle richtingen | Eigen generator in `libs/entities/word-search`                      |
| Zo weinig mogelijk eigen code, moderne stack      | `@aydee-app/word-search`                                            |
| Alle acht richtingen uit een bibliotheek          | `@blex41/word-search`                                               |
| Geen coördinaten nodig, alleen een grid           | `@sbj42/word-search-generator` (niet geschikt voor gevonden-status) |

## 6. Integratieschets in deze repo

### 6.1 Bestanden en lagen

Nieuwe Nx-projecten, volgens dezelfde opzet als `entities-hidden-object` en `features-seek-and-find`:

```text
libs/entities/word-search/
  model/types.ts          # Cell, Placement, Puzzle, thema's, moeilijkheden
  model/config.ts         # groottes, richtingen, woorden per thema
  model/generator.ts      # createWordSearch(theme, difficulty, seed)
  model/selection.ts      # cellsBetween, matchesPlacement
  index.ts                # public API
  project.json            # tags: layer:entities, scope:word-search, type:model
  tsconfig.json

libs/features/word-search/
  model/settings.ts       # defaults en opties voor de setup
  model/storage.ts        # localStorage: games.word-search.v1
  model/use-word-search-store.ts
  ui/word-search-board.tsx
  ui/word-search-word-list.tsx
  ui/word-search-play.tsx
  ui/word-search-setup.tsx
  index.ts
  project.json            # tags: layer:features, scope:word-search, type:feature
  tsconfig.json

libs/pages/word-search/
  ui/word-search-page.tsx
  index.ts
  project.json            # tags: layer:pages, scope:word-search, type:page
  tsconfig.json
```

Verder:

- `apps/games/src/app/router.tsx`: route `/woordzoeker` toevoegen.
- `libs/entities/game/model/game-catalog.ts`: catalogusentry toevoegen en het `to`-uniontype uitbreiden met `"/woordzoeker"`.
- `libs/pages/word-search` gebruikt `GameShell`, `CelebrationDialog` en `Button` uit `@shared/ui`.
- Geen import van een lagere laag naar een hogere laag; alleen via de public API’s en de aliassen `@entities/...`, `@features/...`, `@pages/...`, `@shared/...`.

### 6.2 Zustand-store en opslag

De store lijkt op `useSeekStore`: een `puzzle`, een `found`-lijst en instellingen. De seed wordt bij een nieuw spel met `createSeed()` gemaakt en daarna bewaard.

```ts
interface WordSearchStore {
  puzzle: WordSearchPuzzle | null;
  found: readonly string[];
  hintWord: string | null;
  settings: WordSearchSettings;
  start: () => void;
  select: (path: readonly Cell[]) => void;
  showHint: (word: string) => void;
  clearHint: () => void;
  newPuzzle: () => void;
  chooseTheme: (theme: WordSearchTheme) => void;
  chooseDifficulty: (difficulty: WordSearchDifficulty) => void;
}
```

`select(path)`:

1. zet de geselecteerde cellen om naar een string;
2. vergelijk met elk nog niet gevonden `placement`, zowel vooruit als achteruit;
3. bij een match: voeg `word` toe aan `found`, speel een geluidje via `playSound` en tril eventueel via `vibrate`;
4. bij geen match: laat de highlight kort rood worden en daarna verdwijnen.

Opslag, in de trant van [`storage.ts` van het zoekspel](../../libs/features/seek-and-find/model/storage.ts):

```ts
const STORAGE_KEY = "games.word-search.v1";

interface StoredWordSearch {
  seed: number;
  theme: WordSearchTheme;
  difficulty: WordSearchDifficulty;
  found: string[];
}
```

Bij het laden:

- valideer `theme` en `difficulty` tegen de `as const`-arrays;
- valideer dat `seed` een eindig getal is;
- genereer de puzzel opnieuw met `createWordSearch(theme, difficulty, seed)`;
- filter `found` op woorden die echt in `puzzle.placements` voorkomen;
- bij corrupte data: terug naar de defaults, net als `loadSeekSettings()`.

Het opslaan van alleen de seed (in plaats van de hele grid) houdt de opslag klein en maakt de puzzel reproduceerbaar. Dat is precies waarom een seedbare generator de voorkeur heeft.

Kies je voor `@aydee-app/word-search`, dan is er geen seed. Sla in dat geval de gegenereerde puzzel zelf op:

```ts
interface StoredWordSearch {
  theme: WordSearchTheme;
  difficulty: WordSearchDifficulty;
  size: number;
  grid: string[][];
  placements: { word: string; cells: Cell[] }[];
  found: string[];
}
```

Dat is nog steeds klein (een grid van 10×10 tot 14×14 plus een handvol paden), maar het betekent wel dat je de opslagversie moet ophogen als het puzzelformaat verandert. Valideer bij het laden de afmetingen, de letters en de `placements` voordat je ze aan de UI geeft.

### 6.3 UI en interactie

`WordSearchBoard`:

- een CSS-grid van echte `<button>`-elementen, één per cel, met `data-row` en `data-col`;
- slepen is de primaire route in de passende stand: de cellen tussen start en huidige cel lichten op. Twee tikken (eerste en laatste letter) blijven werken, ook met het toetsenbord; een ongeldige lijn (geen rechte lijn) wordt genegeerd;
- op desktop mag slepen als extra gemak, maar het tikpad blijft de primaire en toegankelijke route;
- in de passende stand: `touch-action: manipulation`; in de vergrote stand: `touch-action: pan-x pan-y`, zodat het bord horizontaal en verticaal kan scrollen;
- `user-select: none` en `-webkit-touch-callout: none` alleen op de board, niet globaal;
- highlight de cellen van de huidige selectie met een duidelijke achtergrond + outline;
- gevonden woorden krijgen een vaste markering en een ✓, niet alleen een kleur;
- na een gevonden woord: korte animatie, daarna blijft de markering staan;
- een **Vergroot**-knop wisselt tussen passend en minstens 44 px per cel;
- `CelebrationDialog` zodra `found.length === placements.length`.

`WordSearchWordList`:

- elk woord is een knop met `aria-pressed={found.includes(word)}`;
- gevonden woorden krijgen een streep en een ✓;
- een klik op een nog niet gevonden woord toont een hint (bijvoorbeeld de eerste letter of de hele path kort oplichten);
- de lijst is ook de toegankelijke route als slepen lastig is.

Toegankelijkheid:

- gebruik `role="grid"`, `role="row"` en `role="gridcell"` (of een tabel met buttons) en geef elke cel een `aria-label` als “rij 3, kolom 4, letter F”;
- roving tabindex: pijltjestoetsen verplaatsen de focus, Space/Enter start en beëindigt een selectie, Escape annuleert;
- een `aria-live="polite"`-status meldt “Bloem gevonden”;
- instructies vooraf, bijvoorbeeld “Tik de eerste en de laatste letter”;
- `prefers-reduced-motion`: geen schud-animatie of confetti, of een rustige variant;
- kleurcontrast minimaal WCAG AA; de gevonden-status mag niet alleen van kleur afhangen.

Mobiel:

- Op 390 px is 10×10 zonder zoom ongeveer 37 px per cel, 12×12 ongeveer 30 px en 14×14 ongeveer 26 px. Daarmee haal je de 44 px-richtlijn niet. Daarom heeft het bord twee standen: **Passend** (het hele bord in beeld) en **Vergroot** (cellen minstens 44 px, horizontaal scrollen).
- In de passende stand sleep je over het woord. In de vergrote stand staan pannen en twee tikken voorop, zodat schuiven en selecteren elkaar niet in de weg zitten.
- Op tablet past 14×14 met 44 px-cellen ruim, dus daar is de zoomstand zelden nodig.
- Test op 390 px en 1024 px, met touch en toetsenbord, zoals `AGENTS.md` voorschrijft.

### 6.4 Woordenlijsten

De woorden zijn kleine letters in de data, A–Z, zonder accenten. De generator zet ze in de grid om naar hoofdletters; de woordenlijst blijft leesbaar in kleine letters.

```ts
export const WORD_SEARCH_WORDS = {
  tuin: [
    "bloem",
    "boom",
    "gras",
    "tulp",
    "slak",
    "bij",
    "vijver",
    "roos",
    "blad",
    "hark",
    "schop",
    "zon",
    "water",
    "vogel",
    "nest",
    "zaad",
  ],
  onderwater: [
    "vis",
    "krab",
    "zee",
    "boot",
    "zand",
    "koraal",
    "octopus",
    "walvis",
    "water",
    "golf",
    "haai",
    "kwal",
    "schelp",
    "zeester",
    "dolfijn",
    "bubbel",
  ],
} as const;
```

Voorstel per moeilijkheid:

| Moeilijkheid | Grid  | Woorden | Richtingen                                                          |
| ------------ | ----- | ------- | ------------------------------------------------------------------- |
| Makkelijk    | 10×10 | 8       | horizontaal + verticaal                                             |
| Gemiddeld    | 12×12 | 10      | + diagonaal naar beneden-rechts                                     |
| Moeilijk     | 14×14 | 12      | + achteruit (eigen generator of `@blex41`); `@aydee` blijft vooruit |

De woorden komen uit de twee bestaande thema's van `Waar is Wobbel?`: **Tuin** en **Onder water**. `vijver` en `bij` testen de Nederlandse `ij`-digraaf, `schop` en `schelp` testen medeklinkerclusters, en `octopus`, `zeester` en `dolfijn` zijn de langste woorden (7 letters) en passen nog in 10×10. De unit tests mogen daarnaast losse randgevallen zoals `cactus` of `ijs` gebruiken; die hoeven niet in de themalijsten te staan.

### 6.5 Tests

Node-tests (Vitest, `tests/node/word-search-generator.test.ts`):

- bij een eigen generator: dezelfde seed geeft twee keer exact dezelfde `grid` en `placements`; bij `@aydee` test je de invarianten hieronder en gebruik je een vaste fixture;
- elk woord uit de woordlijst komt precies één keer voor in `placements`;
- elke `placement.cells` ligt binnen het grid en spelt het woord;
- de cellen van één placement zijn opeenvolgend in één van de toegestane richtingen;
- geen enkel veld is leeg na `fillBlanks`;
- alle letters zijn A–Z;
- woorden zijn niet langer dan `size`;
- over 100 gegenereerde puzzels per thema/moeilijkheid: geen fout, geen gemiste woorden;
- een te klein grid of een te lang woord faalt met een duidelijke fout in plaats van stil te slagen.

Web-tests (`tests/web/word-search.test.tsx`):

- het grid rendert `size × size` cellen;
- twee tikken (eerste en laatste letter) markeren het woord als gevonden;
- een verkeerde selectie markeert niets;
- de woordenlijst toont de gevonden-status;
- de hint markeert de juiste cellen;
- de store reset bij een nieuw spel;
- `aria-live` meldt een gevonden woord.

Opslagtest (`tests/web/word-search-storage.test.ts`):

- round-trip van `{settings, puzzle, found}`;
- corrupte JSON en onbekende thema’s/moeilijkheden vallen terug op defaults;
- `localStorage.setItem` die gooit, laat het spel niet crashen.

Playwright (optioneel lokaal, verplicht in CI): twee tikken op 390 px van de eerste naar de laatste letter van een bekend woord, plus een toetsenbordpad.

## 7. Risico’s en open vragen

| Risico                               | Wat ik heb geverifieerd                                                                                                                                                                         | Mitigatie                                                                                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Licentie**                         | `@blex41` en `@aydee` zijn MIT met LICENSE-bestand. `word-search-puzzle-generator`, `wordsearch` en `wordsearch-generator` hebben geen LICENSE-bestand; `lettras` heeft een proprietary engine. | Alleen MIT-pakketten met een echt LICENSE-bestand overwegen; eigen generator vermijdt het probleem.                                                           |
| **Onderhoud**                        | `@blex41`: laatste release 2021, laatste default-branch-commit 2021-06-15, 12 open items. `@aydee`: 6 versies, laatste op 2025-01-20, 2 sterren. `@sbj42`: laatste commit 2021-09-25.           | Eigen generator heeft geen upstream-afhankelijkheid; bij een library de code vendoren of een fork accepteren.                                                 |
| **Determinisme**                     | Geen van de geschikte kandidaten heeft een seed. `lettras` wel, maar is om andere redenen ongeschikt. `@blex41` heeft alleen `dump()`/`load()` (met een bug).                                   | Eigen `mulberry32`-generator; seed in de opslag; tests met vaste seeds.                                                                                       |
| **Nederlandse “ij”**                 | Alle generatoren behandelen letters als losse tekens. `ij` is dus I + J in twee cellen; dat is precies wat een woordzoeker wil. Geen enkele bibliotheek maakt er één cel van.                   | Woorden als `ijs` en `bij` gewoon als drie tekens opslaan; niet met grapheme-clusters of een ligatuur werken.                                                 |
| **Accenten**                         | `@blex41` kan accenten strippen (`diacritics: false`); `@aydee` accepteert alleen `[A-Za-z]`; `@sbj42` doet geen echte normalisatie.                                                            | Deze woordenlijsten zijn ASCII. Als later “café” of “een” met accenten komt: normaliseren en de displayvorm apart houden.                                     |
| **Mobiele selectie**                 | Geen van de generators levert UI; `word-search-puzzle` en `word-search-puzzle-generator` doen dat wel, maar met muis/touch-specifieke code en eigen CSS.                                        | Twee tikken (eerste en laatste letter) als basis; in de passende stand kan slepen als extra. De woordenlijst blijft een toegankelijke route.                  |
| **44 px-targets**                    | 10×10 op 390 px geeft ~37 px per cel; 12×12 ~30 px; 14×14 ~26 px.                                                                                                                               | Standaard passend; zoomstand met minstens 44 px-cellen en scrollen. De woordenlijst biedt altijd 44 px-knoppen als fallback.                                  |
| **Toegankelijkheid**                 | Veel generator-pakketten leveren geen UI; de UI-pakketten gebruiken muis-events en geen ARIA.                                                                                                   | `role="grid"`, roving tabindex, `aria-live`, zichtbare focus, kleur + icoon, reduced motion.                                                                  |
| **Geen externe requests**            | Alle onderzochte generatoren werken lokaal. `@sbj42` leest alleen een lokaal bestand via `fs` als je geen woorden meegeeft. `lettras` gebruikt WASM.                                            | Woorden altijd meegeven; geen `fetch`; bij `lettras` zou de CSP moeten worden verzwakt, dus niet doen.                                                        |
| **Bundel**                           | `@blex41` 11,9 KB gzip; `@aydee` 1,8 KB; eigen generator naar schatting ~2 KB.                                                                                                                  | Eigen generator of `@aydee`; `@blex41` alleen als de volledige richtingscontrole echt nodig is.                                                               |
| **Toevallige woorden in vulletters** | Willekeurige A–Z kan per ongeluk een ongewenst Nederlands woord vormen. `@blex41` heeft `forbiddenWords`, maar de andere niet.                                                                  | Kleine blocklist scannen op rijen/kolommen/diagonalen, of een kindvriendelijke letterverdeling kiezen. Dit is een kleine extra stap, geen bibliotheekfeature. |
| **Woorden die niet passen**          | `@blex41` laat woorden stil weg; `@aydee` gooit een fout; `@sbj42` laat woorden weg.                                                                                                            | Eigen generator: bounded retry en duidelijke fout; test over veel seeds.                                                                                      |

Open vragen:

1. **Startstand op mobiel:** standaard het hele bord passend tonen, of direct vergroot openen zodat de cellen 44 px zijn?
2. **Achteruit op “moeilijk”:** is dat leuk voor de doelgroep, of maken we het moeilijker met meer woorden en diagonalen?
3. **Hints:** onbeperkt gratis (kindvriendelijk) of een beperkte voorraad? Het zoekspel heeft al een hint-knop.
4. **Filler:** volledig A–Z, of Q/X weglaten op “makkelijk”?
5. **Blocklist:** willen we random letterreeksen scannen op ongewenste woorden, of is dat voor deze doelgroep niet nodig?
6. **Thema-uitbreiding:** komen er meer thema’s? Dan is een aparte woordenlijst per thema in `config.ts` genoeg; de generator blijft hetzelfde.
7. **`ij`-weergave:** tonen we woorden in kleine letters (“bloem”, “bij”) of in hoofdletters (“BLOEM”, “BIJ”)? In de grid zijn ze altijd hoofdletters; de woordenlijst kan kleine letters houden.

## Bronnen

### npm-registry en downloads

- `@blex41/word-search`: <https://registry.npmjs.org/@blex41%2Fword-search> · <https://api.npmjs.org/downloads/point/last-week/@blex41%2Fword-search> · <https://www.npmjs.com/package/@blex41/word-search>
- `@aydee-app/word-search`: <https://registry.npmjs.org/@aydee-app%2Fword-search> · <https://api.npmjs.org/downloads/point/last-week/@aydee-app%2Fword-search> · <https://www.npmjs.com/package/@aydee-app/word-search>
- `@sbj42/word-search-generator`: <https://registry.npmjs.org/@sbj42%2Fword-search-generator> · <https://api.npmjs.org/downloads/point/last-week/@sbj42%2Fword-search-generator> · <https://www.npmjs.com/package/@sbj42/word-search-generator>
- `word-search-puzzle-generator`: <https://registry.npmjs.org/word-search-puzzle-generator> · <https://api.npmjs.org/downloads/point/last-week/word-search-puzzle-generator> · <https://www.npmjs.com/package/word-search-puzzle-generator>
- `word-search-puzzle`: <https://registry.npmjs.org/word-search-puzzle> · <https://api.npmjs.org/downloads/point/last-week/word-search-puzzle> · <https://www.npmjs.com/package/word-search-puzzle>
- `wordsearch`: <https://registry.npmjs.org/wordsearch> · <https://api.npmjs.org/downloads/point/last-week/wordsearch> · <https://www.npmjs.com/package/wordsearch>
- `wordsearch-generator`: <https://registry.npmjs.org/wordsearch-generator> · <https://api.npmjs.org/downloads/point/last-week/wordsearch-generator> · <https://www.npmjs.com/package/wordsearch-generator>
- `lettras`: <https://registry.npmjs.org/lettras> · <https://api.npmjs.org/downloads/point/last-week/lettras> · <https://www.npmjs.com/package/lettras>
- `simple-wordsearch-generator`: <https://registry.npmjs.org/simple-wordsearch-generator> · <https://api.npmjs.org/downloads/point/last-week/simple-wordsearch-generator> · <https://www.npmjs.com/package/simple-wordsearch-generator>
- `puzzletide`: <https://registry.npmjs.org/puzzletide> · <https://api.npmjs.org/downloads/point/last-week/puzzletide>
- `@alejandrorm-dev/word-search-generator`: <https://registry.npmjs.org/@alejandrorm-dev%2Fword-search-generator> · <https://api.npmjs.org/downloads/point/last-week/@alejandrorm-dev%2Fword-search-generator>
- `@webwriter/word-puzzle`: <https://registry.npmjs.org/@webwriter%2Fword-puzzle> · <https://api.npmjs.org/downloads/point/last-week/@webwriter%2Fword-puzzle>
- `puzzle-maker`: <https://registry.npmjs.org/puzzle-maker> · <https://api.npmjs.org/downloads/point/last-week/puzzle-maker>
- Niet bestaand op 2026-10-18 (HTTP 404): <https://registry.npmjs.org/word-search-generator>, <https://registry.npmjs.org/word-search>, <https://registry.npmjs.org/word-search-builder>
- Geen DefinitelyTyped-pakketten op 2026-10-18 (HTTP 404): <https://registry.npmjs.org/@types%2Fword-search>, <https://registry.npmjs.org/@types%2Fblex41__word-search>, <https://registry.npmjs.org/@types%2Fwordsearch-generator>
- npm search-API: <https://registry.npmjs.org/-/v1/search?text=word%20search%20generator>

### Gepubliceerde tarballs (broninspectie)

- `@blex41`: <https://registry.npmjs.org/@blex41/word-search/-/word-search-1.2.0.tgz>
- `@aydee`: <https://registry.npmjs.org/@aydee-app/word-search/-/word-search-0.1.1.tgz>
- `@sbj42`: <https://registry.npmjs.org/@sbj42/word-search-generator/-/word-search-generator-0.1.2.tgz>
- `word-search-puzzle-generator`: <https://registry.npmjs.org/word-search-puzzle-generator/-/word-search-puzzle-generator-1.0.1.tgz>
- `word-search-puzzle`: <https://registry.npmjs.org/word-search-puzzle/-/word-search-puzzle-1.0.23.tgz>
- `wordsearch`: <https://registry.npmjs.org/wordsearch/-/wordsearch-0.1.0.tgz>
- `wordsearch-generator`: <https://registry.npmjs.org/wordsearch-generator/-/wordsearch-generator-1.3.3.tgz>
- `lettras`: <https://registry.npmjs.org/lettras/-/lettras-0.5.1.tgz>

### GitHub: repo’s, commits en issues

- `@blex41/word-search`: <https://github.com/blex41/word-search> · commits: <https://github.com/blex41/word-search/commits>
- seed-verzoek: <https://github.com/blex41/word-search/issues/17>
- `load()`-bug: <https://github.com/blex41/word-search/issues/26>
- `@aydee-app/word-search`: <https://github.com/aydee-app/word-search>
- `@sbj42/word-search-generator`: <https://github.com/sbj42/word-search-generator>
- `word-search-puzzle-generator`: <https://github.com/woles/word-search-puzzle-generator>
- `word-search-puzzle`: <https://github.com/gurkanucar/word_search_puzzle>
- `wordsearch`: <https://github.com/bahamas10/wordsearch.js>
- `wordsearch-generator`: <https://github.com/toddhibbs/wordsearch>
- `lettras`: <https://github.com/Artificialss/lettras-sdk>

### Achtergrond

- MDN, Pointer events: <https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events>
- MDN, `touch-action`: <https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action>
- MDN, `prefers-reduced-motion`: <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
- MDN, CSP `script-src` en WebAssembly (`'wasm-unsafe-eval'`): <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_webassembly_execution>
- W3C WAI-ARIA Authoring Practices, grid pattern: <https://www.w3.org/WAI/ARIA/apg/patterns/grid/>
- Nederlandse `ij`-digraaf (achtergrond): <https://nl.wikipedia.org/wiki/IJ_(digraaf)>

### Eigen code en afspraken

- [AGENTS.md](../../AGENTS.md)
- [ADR 0001 — publieke, statische spellen-app](../adr/0001-publieke-statische-spellen-app.md)
- [CSP en `_headers`](../../apps/games/public/_headers)
- [Deterministische PRNG `mulberry32`](../../libs/shared/lib/random.ts)
- [Zoekspel-generator](../../libs/entities/hidden-object/model/generator.ts)
- [Zoekspel-store](../../libs/features/seek-and-find/model/use-seek-store.ts)
- [Zoekspel-opslag](../../libs/features/seek-and-find/model/storage.ts)
- [Spelcatalogus](../../libs/entities/game/model/game-catalog.ts)
- [Router](../../apps/games/src/app/router.tsx)
- [Eerder dependencyonderzoek](2026-10-17-game-stack-dependencies.md)
