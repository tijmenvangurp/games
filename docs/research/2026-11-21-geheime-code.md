# Geheime Code: symbolen als letters decoderen

- **Datum:** 2026-11-21
- **Status:** Onderzoek. Geen implementatie en geen nieuwe dependencies. De voorgestelde code-engine is buiten de app in een kleine proef getest.
- **Aanleiding:** Een werkblad “Geheime code” met een legenda van twaalf symbolen en letters. Het kind schrijft onder elk symbool de juiste letter en leest zo zes woorden.
- **Vraag:** Is dit een zelfstandig spel voor Spellen, welke bestaande onderdelen en libraries kunnen we hergebruiken, en wat is een afgebakende eerste versie?
- **Kader:** [AGENTS.md](../../AGENTS.md), [ADR 0001](../adr/0001-publieke-statische-spellen-app.md), [ADR 0026](../adr/0026-adaptief-niveaumodel.md), het [design system](../design-system.md) en de [CSP](../../apps/games/public/_headers).

## Kort advies

Bouw **Geheime Code** als een nieuw spel met een **zichtbare codekaart**: een legenda van symbolen die steeds naar dezelfde letter verwijzen. Het kind decodeert korte Nederlandse woorden door letters te tikken. Dat is precies de oefening op het werkblad, maar dan met directe feedback, zonder pen en papier.

- **Geen nieuwe library voor de spellogica.** De engine is klein: een letter-symbooltabel, een controle per letter, givens en een hinttrap. Geen onderzocht pakket levert die combinatie voor Nederlandse kinderwoorden. De rest van de stack dekt alles al.
- **Geen nieuwe dependency voor de UI.** Gebruik `@phosphor-icons/react` voor de symbolen, `zustand` voor de ronde, `mulberry32`/`createSeed` voor de code, `motion` voor de feedback, `playSound` voor geluid en `CelebrationDialog` voor de afsluiting. Die staan al in de repo.
- **Curateer de woordensets.** De legenda is de vereniging van de letters van de woorden in de ronde. Laat een generator niet zelf woorden kiezen op letterzuinigheid: dan verdwijnen de woorden die het thema juist leuk maken. De engine maakt de code bij een vaste, met de hand gekozen set.
- **Eerste versie:** drie niveaus, 4–6 woorden per ronde, thema’s **Sinterklaas**, **Tuin** en **Onder water**: 3 × 3 × 2 = 18 rondes. Liever kleiner: 2 thema’s × 3 niveaus × 2 rondes = 12. Niveau 3 (1–2 verborgen letters) hoort erbij, anders is het spel te veel overschrijven.
- **Spraak:** begin met `speech: { kind: "visual" }` als de audio-pass niet in de eerste PR past. Een kleine `code`-spraakgroep met de instructie en de woorden is daarna een kleine toevoeging via de bestaande TTS-pijplijn.
- **Beeldrichting:** D’s rustige een-woordlayout, A’s serif voor titel en letters, en B’s kleur als zachte tint per symbool. De tinten komen uit de bestaande tokens; indigo blijft de actiekleur. Gebruik de bestaande Phosphor-iconen als basis en kopieer het werkblad niet.

## Het werkblad: wat voor spel is dit?

De codekaart op het werkblad koppelt twaalf symbolen aan twaalf letters:

| Symbool | Letter | Symbool | Letter | Symbool  | Letter | Symbool   | Letter |
| ------- | ------ | ------- | ------ | -------- | ------ | --------- | ------ |
| mijter  | S      | staf    | T      | cadeau   | P      | pepernoot | O      |
| schoen  | A      | wortel  | K      | zak      | J      | boek      | E      |
| ster    | I      | boot    | B      | letter N | N      | hart      | F      |

De zes opdrachten zijn:

1. mijter – ster – N – staf → **SINT**
2. cadeau – ster – boek – staf → **PIET**
3. boot – pepernoot – pepernoot – staf → **BOOT**
4. cadeau – schoen – wortel – zak – boek → **PAKJE**
5. mijter – staf – schoen – hart → **STAF**
6. hart – ster – boek – staf – mijter → **FIETS**

Twee dingen vallen op.

1. **De legenda is precies de vereniging van de letters in de zes woorden.** De woorden gebruiken samen twaalf verschillende letters: `a b e f i j k n o p s t`. Daarom heeft de codekaart ook twaalf vakjes. Dat is geen toeval: het houdt de legenda klein en zorgt dat elk symbool minstens één keer terugkomt.
2. **Het symbool is niet de beginletter van het plaatje.** De mijter staat voor S, de staf voor T, de pepernoot voor O. Een kind dat “mijter → M” denkt, komt niet uit. De codekaart is de baas. Dat is meteen het grootste didactische risico van deze vorm: zonder uitleg proberen kinderen de beginletter van het plaatje te gebruiken.

### Verwante speltypen

“De code kraken” wordt in het Nederlands voor meer dingen gebruikt. Het is belangrijk ze niet door elkaar te halen.

| Vorm                         | Wat het kind doet                                                  | Voorbeeld                          | Wat het oefent                         |
| ---------------------------- | ------------------------------------------------------------------ | ---------------------------------- | -------------------------------------- |
| **Legendacode** (dit blad)   | Zoekt bij elk symbool de letter op en schrijft het woord over.     | mijter-ster-N-staf → SINT          | Letterherkenning, woordbeeld, spelling |
| **Beginlettercode**          | Neemt de beginletter van elk plaatje en vormt daarmee een woord.   | vis – aap – sok → VAS              | Foneem-grafeemkoppeling, beginletters  |
| **Echte codekraker**         | Kraakt een verborgen cijfer-lettercode met patronen en frequentie. | een kruiswoordrooster waarin 3 = E | Patroonherkenning, taalstatistiek      |
| **Mastermind / codebreaker** | Raadt een geheime kleurcode met zwart-witte feedback.              | vier kleuren, tien beurten         | Logisch redeneren, hypothesen          |

Het werkblad is de **legendacode**. De eerste versie van het spel moet ook die vorm hebben. De “echte codekraker” is een latere variant voor oudere kinderen; Mastermind is een ander spel en hoort hier niet bij.

### Wat leert het kind?

De legendacode is geen leesmethode en geen vervanging van klankonderwijs: de koppeling tussen symbool en letter is willekeurig. Wat het spel wel oefent:

- **Letterherkenning en het unieke letterpatroon van een woord.** De SLO noemt voor groep 3–4 onder meer “herkennen van het unieke letterpatroon van (leen)woorden” en “woordidentificatietechnieken” ([SLO, kerndoel 4](https://www.slo.nl/thema/meer/tule/nederlands/kerndoel-4-0/)).
- **Eén-op-één redeneren.** Elk symbool hoort bij precies één letter; dezelfde letter komt overal terug. Dat is de kern van een code.
- **Nauwkeurig kijken en volhouden.** Een verkeerde letter maakt het woord onleesbaar; het kind moet controleren en corrigeren.
- **Spelling en woordvorm.** De volgorde van de letters is het woord; verwisselen levert een ander woord op.
- **Themawoordenschat.** Sinterklaas, tuin en onder water geven woorden betekenis.
- **In de latere variant:** patronen gebruiken, letters wegstrepen en systematisch hypothese toetsen.

De leeftijd voor de eerste versie is **6–8 jaar (groep 3–4)**, met hulp vanaf 5 jaar. Voor 9–12 jaar is de verborgen-codevariant interessanter. Het spel moet geen “leerresultaat” beloven dat er niet is; het is een puzzel die lezen, spellen en aandacht ondersteunt.

## Spelconcept en afbakening

### Eén ronde

1. Het kind kiest een thema en een niveau.
2. De codekaart staat bovenaan: elk symbool met zijn letter. Het toetsenbord toont het hele alfabet; de codekaart is de enige hint.
3. Het eerste woord verschijnt als een rij symbolen, met daaronder lege vakjes. Geen letters vooraf en geen opgelicht symbool. Het kind tikt een letter; die vult het eerste lege vakje.
4. **Goed:** de letter blijft staan, het vakje wordt rustig groen en de volgende lege plek wordt actief. **Fout:** de letter gaat terug, het vakje wordt amber en het bijbehorende vakje in de codekaart licht kort op. Geen rood kruis, geen foutgeluid en geen levens.
5. Na twee fouten op dezelfde plek licht de symboolcel in de codekaart op; niet de letter. Na vier fouten pas vult de app de letter in met een neutrale “kijk, deze letter”-melding. Zo blijft de opgave een code, geen invuloefening.
6. Is het woord klaar, dan verschijnt het in gewone letters, klinkt het woord (als er spraak is) en verschijnt **Volgende**. Geen automatische sprong, zodat het kind kan lezen wat het gemaakt heeft.
7. Na 4–6 woorden opent de viering met het aantal woorden dat in één keer goed ging.

### Feedback

De feedback volgt [ADR 0026](../adr/0026-adaptief-niveaumodel.md):

- **Fouten zijn informatie.** Geen foutgeluid, geen scoreverlies, geen aftellende timer en geen “game over”.
- **De hinttrap is zichtbaar.** Eerst de symboolcel in de codekaart laten oplichten, dan de juiste letter aanwijzen, pas daarna voordoen. Het kind houdt de laatste handeling zoveel mogelijk zelf.
- **Complimenten gaan over aanpak.** “Je keek goed naar de code” in plaats van “knap” of “slim”.
- **Kleur is niet de enige drager.** Goed krijgt een gesloten vakje en een vinkje; fout een gestippelde rand en een amberkleurige gloed. De letter blijft altijd leesbaar.

### Moeilijkheid

| Niveau    | Codekaart                           | Woorden                  | Toetsenbord  | Hulp                                       |
| --------- | ----------------------------------- | ------------------------ | ------------ | ------------------------------------------ |
| 1         | Zichtbaar, vaste volgorde           | 4 woorden, 3–4 letters   | Hele alfabet | Symboolcel na twee fouten                  |
| 2         | Zichtbaar, geschudde volgorde       | 6 woorden, 3–6 letters   | Hele alfabet | Symboolcel na twee fouten                  |
| 3         | 1–2 letters verborgen als `?`       | 5–6 woorden, 3–6 letters | Hele alfabet | Eén gegeven voorkomen per verborgen letter |
| 4 (later) | Geen volledige kaart; enkele givens | 5–7 woorden of één zin   | Hele alfabet | Patronen en herhaalsymbolen                |

De volgorde van de codekaart is een bewuste moeilijkheidsknop. Het kind zoekt **van symbool naar letter**, niet andersom. Sorteren op letter helpt dus niet; niveau 1 gebruikt daarom een vaste, herkenbare volgorde (de catalogusvolgorde), niveau 2 een geschudde volgorde. Als de kaart op letter zou worden gesorteerd, moet het kind alsnog alle symbolen scannen.

Op niveau 3 verbergt de kaart een of twee letters. In de woorden staat van elke verborgen letter één voorkomen al ingevuld. Het kind vult dat vakje, de codekaart onthult de letter, en daarna kan het de andere woorden verder decoderen. Zo is de puzzel oplosbaar zonder dat het kind het woord al kent, en zonder extra plaatjes of audio. Dat is de eerste echte “kraak”-stap.

### Aannames en eerste versie

- Het kind leest Nederlands en kent de meeste letters; een ouder of leerkracht kan helpen.
- Touch-first, met muis en fysiek toetsenbord als extra invoer. Geen verplicht schermtoetsenbord met QWERTY-layout.
- Geen account, geen backend, geen analytics; voortgang staat lokaal.
- Geen tijdsdruk en geen competitie.
- De eerste versie bevat niveau 1–3, de thema’s **Sinterklaas**, **Tuin** en **Onder water**, en twee rondes per thema per niveau (18 rondes). Voor een kleinere eerste PR: 2 thema’s × 3 niveaus × 2 rondes = 12. Niveau 4 (echte codekraker) is een aparte onderzoeksstap.

## Bestaand hergebruik in de repo

| Onderdeel            | Hergebruik                                                     | Waar                                                                    |
| -------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Scherm en opbouw     | `GameShell`, `PageHeader`, `game-panel`, `SetupActions`        | `libs/widgets/game-shell`, `libs/shared/ui`                             |
| Keuzes               | `ChoiceCard`, `OptionPicker`                                   | `libs/shared/ui`                                                        |
| Afsluiting           | `CelebrationDialog`, `Confetti`                                | `libs/shared/ui`                                                        |
| Spelicoon            | `GameIcon` met een nieuwe Phosphor-icoon                       | `libs/shared/ui/game-icon.tsx`                                          |
| Symbolen             | `@phosphor-icons/react`, al in de bundel                       | `libs/shared/ui`, `package.json`                                        |
| State                | `zustand` met een store per feature                            | `libs/features/typepret/model/use-typepret-store.ts`                    |
| Determinisme         | `mulberry32`, `createSeed`, `shuffledIndexes`                  | `libs/shared/lib/random.ts`                                             |
| Opslag               | `readStoredJson` / `writeStoredJson`, versie 2 met `profileId` | `libs/shared/lib/storage.ts`, `libs/features/typepret/model/storage.ts` |
| Geluid               | `playSound("tap" \| "match" \| "hint" \| "almost" \| "win")`   | `libs/shared/lib/sound.ts`                                              |
| Beweging             | `motion/react`, `AnimatePresence`, `useReducedMotion`          | `libs/features/alchemy-lab`, `libs/features/ganzenbord`                 |
| Spraak               | `speechGroups`, `SpeechLine`, TTS-generator                    | `libs/features/word-search/model/audio.ts`, `scripts/generate-audio.ts` |
| Woorden              | `WORD_SEARCH_WORDS.tuin` en `.onderwater`                      | `libs/entities/word-search/model/config.ts`                             |
| Eenvoudige woorden   | `WORDS`, `TRAIN_WORDS` van Letterpret                          | `libs/entities/letter/model/data.ts`                                    |
| Toetsaanslagen       | `react-hotkeys-hook`                                           | `libs/features/typepret/ui/typepret-play.tsx`                           |
| Voortgang en sterren | Het model uit ADR 0026 en de bestaande opslagconventie         | `libs/entities/*/model/progress.ts`                                     |

De woordenschat van Woordzoeker is bruikbaar, maar niet één-op-één: de themalijsten zijn divers en gebruiken samen vaak meer dan twaalf letters. Voor Geheime Code kiezen we per ronde een compacte set, bijvoorbeeld:

- **Sinterklaas, niveau 1:** `sint, piet, boot, staf, zak, boek` → 12 letters.
- **Sinterklaas, niveau 2:** `pakje, fiets, snoep, schoen, sint, boot` → 14 letters.
- **Tuin:** `bloem, boom, gras, slak, roos, hark` → 11 letters.
- **Onder water:** `vis, krab, boot, koraal, walvis, alg` → 12 letters.

Die sets zijn met de hand gekozen: ze vertellen een thema, bevatten korte en langere woorden, en blijven binnen de legenda. De engine hoeft alleen nog de symbolen aan de letters te koppelen.

## Vergelijking: libraries en andere bronnen

Ik heb op **2026-11-21** gezocht in het npm-register en op GitHub, en de metadata en README’s van de kandidaten bekeken. De zoektermen waren onder meer `cryptogram`, `substitution cipher`, `cipher puzzle`, `pigpen cipher`, `decoder ring`, `cryptogram puzzle` en `geheimschrift`. Daarna heb ik de npm-pakketten en GitHub-repo’s van de serieuze treffers vergeleken.

### De spellogica

| Kandidaat                                                                                                                                                                                         | Wat het levert                                                                        | Oordeel                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Eigen engine in `libs/entities/geheime-code`**                                                                                                                                                  | Symbool-lettertabel, givens, controle per letter, deterministische code               | **Voorkeur.** Ongeveer 80–120 regels, geen dependency, precies de gewenste regels en goed testbaar.                                                               |
| [`@apiverve/cryptogram`](https://www.npmjs.com/package/@apiverve/cryptogram)                                                                                                                      | Een HTTP-API die een letter-substitutiepuzzel genereert.                              | **Afgevallen.** De generator draait op hun server; `axios` en een API-key horen niet in een statische app. Dit breekt de CSP en de regel “geen externe requests”. |
| [`mez-encryption`](https://github.com/MoonesMezher/mez-encryption)                                                                                                                                | Caesar- en Pigpen-codering van tekst, met educatieve uitleg.                          | **Afgevallen.** Het levert geen legenda, geen woorden en geen UI. De Pigpen-tekens zijn Unicode-benaderingen, geen nette SVG’s.                                   |
| [`substitutioncipher-js`](https://github.com/SubramanyaKS/substitutioncipher)                                                                                                                     | Simpele substitutie van letters.                                                      | **Afgevallen.** Alleen encoderen/decoderen; geen symbolen, geen legenda, geen spel. De engine is kleiner dan de dependency.                                       |
| [`cryptogram`](https://www.npmjs.com/package/cryptogram) 0.0.0                                                                                                                                    | Een oude solver-hulp uit 2015.                                                        | **Afgevallen.** Geen generator, geen browser-API, geen onderhoud.                                                                                                 |
| [`puzzleloom`](https://github.com/btahir/puzzleloom) (MIT)                                                                                                                                        | Een complete maker voor kruiswoord, woordzoeker, woorden scrambelen en cryptogrammen. | **Alleen referentie.** Mooi MIT-project, maar geen gepubliceerd npm-pakket en veel breder dan dit spel. Niet als dependency opnemen.                              |
| [`chrono-cipher`](https://github.com/ctkrug/chrono-cipher) (MIT)                                                                                                                                  | Een dagelijkse cryptogram-game met frequentieanalyse.                                 | **Alleen referentie.** Nuttig voor de latere “echte codekraker”-variant, maar te complex en te tekstueel voor groep 3–4.                                          |
| [`cipherly`](https://github.com/TomerAberbach/cipherly)                                                                                                                                           | Een cryptogram-solver.                                                                | **Afgevallen.** Het npm-pakket noemt MIT, maar de GitHub-repo heeft geen LICENSE-bestand; het lost puzzels op in plaats van ze te maken.                          |
| [`GameHelix/cryptogram`](https://github.com/GameHelix/cryptogram), [`1ukoi1ik/Cryptogram2`](https://github.com/1ukoi1ik/Cryptogram2), [`lettercrack`](https://github.com/bighatclick/lettercrack) | Web- of React Native-cryptogramspellen.                                               | **Alleen referentie.** Geen licentie vermeld, dus de code is niet herbruikbaar. Als sfeerreferentie kunnen ze wel helpen.                                         |
| [`crossword-layout-generator`](https://www.npmjs.com/package/crossword-layout-generator)                                                                                                          | Een kruiswoordraster uit een woordenlijst.                                            | **Uitgesteld.** Nodig voor een latere kruiswoordvariant; laatste release 2020, geen TypeScript-types. Niet voor de eerste versie.                                 |
| [`@jaredreisinger/react-crossword`](https://www.npmjs.com/package/@jaredreisinger/react-crossword)                                                                                                | Een kant-en-klare React-kruiswoordcomponent.                                          | **Uitgesteld.** React 18-era, `styled-components`, `immer` en `prop-types`; te zwaar en een eigen UI. Alleen relevant voor niveau 4.                              |

**Conclusie:** er is geen pakket dat “legenda van symbolen + Nederlandse kinderwoorden + invoer + feedback” als geheel levert. De bestaande pakketten zijn óf een externe dienst, óf een tekstcipher, óf een complete puzzel-app met een eigen UI. Zelf de engine schrijven is hier de kortste route, niet een “not invented here”-reflex: de regels zijn klein, de eisen zijn smal en de repo heeft al een deterministische PRNG en een testcultuur. Dat is de bewuste uitzondering op “bibliotheken eerst”; ik noteer haar hier zodat de volgende zoektocht niet opnieuw begint.

### Metadata en browsercompatibiliteit

De versies hieronder zijn de latest op 2026-11-21. “Browser” betekent: geen Node-builtins, geen netwerk tijdens gebruik en te bundelen met Vite.

| Kandidaat                         | Versie (datum)     | Licentie                              | Module en types          | Runtime-deps                               | Browser                       |
| --------------------------------- | ------------------ | ------------------------------------- | ------------------------ | ------------------------------------------ | ----------------------------- |
| `@apiverve/cryptogram`            | 1.2.6 (2026-11-16) | MIT                                   | CJS, eigen `.d.ts`       | `axios`, `form-data`                       | **Nee**, doet een HTTP-call   |
| `mez-encryption`                  | 1.0.0 (2025-11-08) | MIT                                   | ESM, geen types          | geen                                       | Ja, maar alleen tekstcipher   |
| `substitutioncipher-js`           | 1.0.6 (2024-03-05) | MIT                                   | CJS, eigen `.d.ts`       | geen                                       | Ja, maar alleen encode/decode |
| `cryptogram`                      | 0.0.0 (2015-04-29) | MIT                                   | CJS, geen types          | `latest`, `posix-getopt`                   | Nee, CLI/Node                 |
| `puzzleloom`                      | GitHub 2026-10-01  | MIT                                   | TS-monorepo, niet op npm | eigen pakketten                            | Alleen referentie             |
| `chrono-cipher`                   | GitHub 2026-07-03  | MIT                                   | TS/Vite-app, niet op npm | app-deps                                   | Alleen referentie             |
| `cipherly`                        | 0.1.3 (2025-12-21) | MIT volgens npm; geen LICENSE in repo | ESM, eigen `.d.ts`       | geen                                       | Ja, maar solver               |
| `GameHelix/cryptogram`            | GitHub 2026-03-10  | geen                                  | Next.js/TS-app           | app-deps                                   | Alleen referentie             |
| `1ukoi1ik/Cryptogram2`            | GitHub 2026-05-29  | geen                                  | React/TS/Vite-app        | app-deps                                   | Alleen referentie             |
| `lettercrack`                     | GitHub 2026-11-12  | geen                                  | Expo/React Native        | app-deps                                   | Alleen referentie             |
| `crossword-layout-generator`      | 0.1.1 (2020-01-02) | MIT                                   | CJS, geen types          | geen                                       | Ja, maar sinds 2020 stil      |
| `@jaredreisinger/react-crossword` | 5.2.0 (2022-12-16) | MIT                                   | CJS, eigen `.d.ts`       | `immer`, `prop-types`, `styled-components` | Ja, maar zwaar en oud         |

De bestaande stack is al in eerdere onderzoeken gecontroleerd en voldoet: `react-simple-keyboard` 3.8.295 (MIT, ESM/CJS, types), `react-hotkeys-hook` 5.3.3 (MIT, ESM, types), `@phosphor-icons/react` 2.1.10 (MIT, ESM/CJS, types), `motion` 14.9.0 (MIT), `canvas-confetti` 1.9.4 (ISC) en `zustand` 5.0.16 (MIT). Geen daarvan doet een netwerkcall. Voor statische SVG’s is `@iconify-json/ph` 1.2.2 (MIT, dev-only) aanwezig; de React-componenten zijn hier eenvoudiger.

### Invoer en UI

| Onderdeel          | Keuze                                                                                                       | Waarom                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Letters tikken     | Een eigen raster van 12 of 26 letterknoppen met `Button`/`game-panel`.                                      | Simpel, toegankelijk en precies de gewenste volgorde. `react-simple-keyboard` is gebouwd voor een volledig toetsenbord met een layout-API; voor een letterkiezer is dat omwegen. |
| Fysiek toetsenbord | `react-hotkeys-hook`, zoals Typepret.                                                                       | Al aanwezig; werkt op desktop en tablet met toetsenbord.                                                                                                                         |
| Slepen             | Niet nodig. `@dnd-kit/core` is aanwezig, maar tikken is voor jonge kinderen en toetsenbordgebruikers beter. | Minder motorische eisen en eenvoudiger te testen.                                                                                                                                |
| Feedback           | `motion/react` met `useReducedMotion`; korte schaal- en kleurtransities.                                    | Al in de repo; geen constante animaties.                                                                                                                                         |
| Viering            | `CelebrationDialog` en `Confetti`.                                                                          | Bestaande, gerichte viering.                                                                                                                                                     |
| Geluid             | `playSound("tap")` bij een toets, `"match"` bij goed, `"almost"` bij een woord, `"win"` bij de ronde.       | Bestaande gesynthetiseerde set; geen nieuwe audiobestanden.                                                                                                                      |

De letterkiezer is bewust **geen** volledig toetsenbord. Op niveau 1 ziet het kind alleen de letters die in de codekaart staan, in een rustige volgorde. Dat verlaagt de cognitieve last: het kind hoeft niet tussen 26 letters te zoeken. Op niveau 2 komt het hele alfabet. Een eigen raster is dan ook minder code dan een library met een eigen layout-API en CSS.

### Iconen

`@phosphor-icons/react` is al een dependency en heeft alle kandidaten voor een neutrale symbolenset. De iconen zijn MIT-gelicenseerd; de licentie staat al in [`LICENSES/phosphor-MIT.txt`](../../LICENSES/phosphor-MIT.txt).

| Symbool | Phosphor-icoon | Nederlandse naam |
| ------- | -------------- | ---------------- |
| ster    | `Star`         | ster             |
| hart    | `Heart`        | hart             |
| maan    | `Moon`         | maan             |
| sleutel | `Key`          | sleutel          |
| kroon   | `Crown`        | kroon            |
| vis     | `Fish`         | vis              |
| bloem   | `Flower`       | bloem            |
| boot    | `Boat`         | boot             |
| cadeau  | `Gift`         | cadeau           |
| boek    | `Book`         | boek             |
| wortel  | `Carrot`       | wortel           |
| tas     | `Bag`          | tas              |
| bel     | `Bell`         | bel              |
| anker   | `Anchor`       | anker            |
| boom    | `Tree`         | boom             |
| huis    | `House`        | huis             |
| kat     | `Cat`          | kat              |
| raket   | `Rocket`       | raket            |

Deze set is bewust **niet** Sinterklaas-specifiek. Daardoor werkt dezelfde engine het hele jaar, en is er geen nieuwe tekenopdracht nodig. De woorden kunnen wel thematisch zijn. Een seizoensset met eigen mijter-, staf-, pepernoot- en schoentekeningen is een latere uitbreiding; die tekenen we dan zelf in dezelfde lijnstijl, of we gebruiken alleen bronnen met een duidelijke CC0/MIT-licentie.

Belangrijk voor de toegankelijkheid: elk symbool krijgt een Nederlandse naam. Een schermlezer kan dan “ster” zeggen en de codekaart voorlezen als “ster: letter s”. Zonder die namen is het spel voor een schermlezer niet te spelen. De naam mag niet de letter verklappen; daarom is het verstandig om in de generator te vermijden dat de beginletter van de naam gelijk is aan de letter (ster → S). Dat is een kleine regel die een verkeerde strategie voorkomt.

### Illustratierichting: hoe houden we het leuk?

Een losse HTML-proef met vier telefoonschermen testte dezelfde codekaart in vier beeldtalen. Hetzelfde woord (PAKJE), dezelfde code, geen letters vooraf en geen opgelicht symbool. De proef staat buiten de app en is throwaway; ze is bedoeld om de richting te kiezen, niet om zo te mergen.

| Richting              | Idee                                                                   | Illustraties                                                         | Wat het oplevert                                          |
| --------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| **A · Inkt & papier** | Als het werkblad, maar zachter. Ivoor, inkt en één rood accent.        | Monolijn, licht wiebelig, geen fill.                                 | Rust, herkenbaarheid en aansluiting op het design system. |
| **B · Stickerpret**   | Meer app en meer viering. Kleur als leerinhoud.                        | Stickers met dikke inktlijn, kleur en een kleine tilt.               | De leukste en snelst herkenbare symbolen.                 |
| **C · Speurdersclub** | Dossier, stempel en typemachine.                                       | Rode stempels en inkt, ruwe rand.                                    | De sterkste “geheime code”-sfeer.                         |
| **D · Prentenboek**   | D als basis: één woord tegelijk, veel lucht. Serif van A, kleur van B. | Zachte tokens met een vaste tint per symbool; inkt blijft de drager. | De gekozen basis.                                         |

De proef laat vier dingen zien die belangrijker zijn dan de exacte stijl:

1. **Kleur moet een eigenschap van het symbool zijn, niet van de plek.** In de eerste versie van B kreeg dezelfde sleutel in de woordrij een andere kleur dan in de codekaart. Dan lijkt kleur op een tweede code. De oplossing is simpel: leg per symbool één kleur vast in de symboolcatalogus en gebruik die overal. Voor dezelfde reden mag kleur nooit de enige drager van betekenis zijn.
2. **Eén symboolfamilie, één grammatica.** Kies vóór het tekenen: lijn- of vlakstijl, lijndikte, hoeken, perspectief, wel of geen schaduw, wel of geen kleur. Meng daarna geen lijniconen, emoji en foto’s door elkaar. De codekaart is leerinhoud, dus kleur mag; de UI-chrome blijft rustig ivoor, inkt en indigo.
3. **Een symbolensheet is de review-eenheid.** Beoordeel de symbolen niet één voor één in de UI, maar allemaal naast elkaar op 24, 32 en 48 px, met hun Nederlandse naam. Wat op 48 px schattig is, kan op 24 px een vlek zijn. Voeg pas daarna de context van de codekaart toe.
4. **Test met kinderen, niet met onszelf.** Laat een kind een symbool in twee seconden benoemen en een ander symbool aanwijzen. Vraag daarna pas of het “leuk” is. Een symbool dat niet herkenbaar is, is niet leuk, hoe mooi de tekening ook is.

De voorkeursroute is **D als basis**: D’s rust en lucht, A’s serif voor de titel en de letters, en B’s kleur als zachte tint per symbool. De tinten komen uit de bestaande pion- en accentkleuren; het indigo blijft de actiekleur. C is een sterke optie voor een latere “moeilijke” of seizoensmodus. De definitieve set wordt in de gekozen richting getekend of geselecteerd; de prototypes gebruiken bestaande Phosphor-iconen als plaatsvervanger.

Praktische borging voor “leuke illustraties”:

- **Art-direction-brief per spel:** drie sfeerwoorden, een klein palet, lijndikte, vormregels en expliciete “niet dit”-voorbeelden.
- **Symboolcatalogus met id, Nederlandse naam, bron, licentie en vaste kleur.** De engine en de UI lezen alleen die catalogus.
- **Symbolensheet als artifact:** één pagina met alle symbolen op echte groottes, als onderdeel van de review en later als visuele regressietest.
- **Licentiepoort:** eigen werk, MIT of CC0; geen gekopieerd werkblad, geen onduidelijke “gratis” downloads. Herkomst en attributie in `LICENSES/`.
- **Lokale assets:** SVG’s in de repo of gebundelde iconen; geen externe requests, geen CDN, geen webfonts.
- **Screenshots op 390 en 1024 px** van de codekaart, de woordrij en de hintstaat; controleren op contrast, touch-targets en of de symbolen niet dichtslibben.
- **Geen decoratie zonder functie.** De illustraties zijn de code; voeg geen losse sterretjes, slingers of achtergrondfiguren toe die niets betekenen.

### Spraak en audio

De repo heeft een complete, lokale TTS-pijplijn: de Nederlandse stem Nathalie (CC0) uit Piper (MIT), vooraf gegenereerde WAV-bestanden en een catalogus die per game ontdekt wordt ([ADR 0017](../adr/0017-letterklanken-en-audio.md), [ADR 0023](../adr/0023-voorlezen-met-tts.md)). Voor Geheime Code zijn twee soorten regels nuttig:

- **Korte feedback:** “Kraak de code.”, “Goed.”, “Bijna.” Geen symboolnaam inspreken; dat zou de opdracht verklappen.
- **Woordregels:** elk woord één keer, zodat het kind het gedecodeerde woord hoort. Dat is vooral waardevol voor woorden die het nog niet kent.

De woorden van **Tuin** en **Onder water** hebben al audio in de Woordzoeker-catalogus (`libs/features/word-search/model/audio.ts`). Die regels staan onder de folder `words` met id’s als `word-fiets`. Om dubbele id’s in de audiocatalogus te voorkomen, is er een kleine refactor nodig: verplaats de woordregels naar de entity die de woorden al bezit (`libs/entities/word-search/model/audio.ts`) en laat zowel Woordzoeker als Geheime Code daaruit putten. De audiocatalogus scant alle `libs`, dus een audio-module in een entity wordt ook gevonden. Voor de Sinterklaaswoorden zijn nieuwe regels nodig.

Als de audio-pass niet in de eerste PR past, is `speech: { kind: "visual" }` een geldige tussenstand. De catalogus en de `speech-coverage`-test eisen alleen een expliciete keuze. De codekaart en de woordrij zijn dan visueel; er komt geen extra instructietekst bij.

### Woorden en content

De woordensets zijn het echte ontwerpwerk, niet de engine. Daarom:

- **Per ronde één compacte set.** De legenda is de vereniging van de letters. Houd die op 12–14 voor niveau 1–2, anders wordt de codekaart op een telefoon te hoog.
- **Mix korte en langere woorden.** Niveau 1: 3–4 letters. Niveau 2 en 3: 3–6 letters met een paar gedeelde letters, zodat de givens nuttig zijn.
- **Herhaal letters binnen de set.** `boot` heeft twee o’s; dat leert dat hetzelfde symbool altijd dezelfde letter is.
- **Vermijd verwarrende symbolen.** Een ster, hart, maan en sleutel zijn duidelijk verschillend. Twee verschillende bladvormen of twee soorten vissen zijn dat niet.
- **Wees terughoudend met “piet”.** Het woord kan als woord in een Sinterklaassset, zonder afbeelding van personen. Wil de maintainer gevoeligheden vermijden, dan zijn `mijter`, `staf`, `baard`, `boot`, `pakje`, `schoen`, `snoep` en `boek` voldoende. Dit is een open vraag, geen technische eis.
- **Geen lange woorden in de eerste versie.** `pepernoot`, `schoorsteen` en `cadeautje` zijn leuk, maar maken de woordrij op 390 px te breed. Bewaar ze voor niveau 4 of een tablet-only variant.

### Hoeveel rondes en combinaties?

De huidige woordlijsten zijn klein, maar het aantal bruikbare sets is al groot. Als je per ronde 4, 5 of 6 woorden kiest en de letters binnen 12 symbolen houdt, zijn dit de aantallen:

| Thema                    | 4 woorden ≤12 | 5 woorden ≤12 | 6 woorden ≤12 | 6 woorden ≤14 |
| ------------------------ | ------------: | ------------: | ------------: | ------------: |
| Sinterklaas (12 woorden) |           227 |           102 |            25 |           247 |
| Tuin (16 woorden)        |         1.131 |           743 |           183 |         2.193 |
| Onder water (16 woorden) |           862 |           495 |            86 |         1.379 |

Dit zijn alleen de sets uit de huidige korte lijsten; met een grotere themalijst groeit het aantal snel. De code zelf is al helemaal geen beperking: voor een set van 12 letters met 12 symbolen zijn er **12! = 479.001.600** verschillende codes. Kies je 12 symbolen uit een catalogus van 18, dan zijn er **P(18,12) ≈ 8,9 biljoen** mogelijkheden. De echte beperking is dus niet het aantal combinaties, maar de kwaliteit van de woorden, de audio en of een kind de set herkent.

Voor de eerste versie is daarom een kleine, gecureerde set genoeg:

- **3 thema’s:** Sinterklaas, Tuin, Onder water.
- **3 niveaus:** kijk & schrijf, zoek & schrijf, kraak de code (1–2 verborgen letters).
- **2 rondes per thema per niveau:** 18 rondes, elk 4–6 woorden.
- Liever kleiner: **2 thema’s × 3 niveaus × 2 rondes = 12 rondes**; de derde thema is de eerste uitbreiding.

De niveaus sluiten aan bij de groepindeling die je online ziet: Minipret maakt codekrakers voor groep 3–4, 5–6 en 7–8, met kortere woorden en eenvoudiger symbolen in de onderbouw. Verder vond ik geen bron die een vast aantal thema’s of levels voorschrijft; dat is een ontwerpkeuze, geen standaard.

## Herbruikbaar beeld en geluid

| Bron                              | Licentie   | Gebruik                                                                                      | Attributie                                                                                      |
| --------------------------------- | ---------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Phosphor Icons                    | MIT        | De 18 symbolen in de codekaart en de woordrij.                                               | [`LICENSES/phosphor-MIT.txt`](../../LICENSES/phosphor-MIT.txt)                                  |
| Fluent Emoji Flat                 | MIT        | Optioneel voor leerinhoud, bijvoorbeeld een voorwerp op een themakaart; niet voor UI-chrome. | [`LICENSES/fluent-emoji-MIT.txt`](../../LICENSES/fluent-emoji-MIT.txt)                          |
| Piper (MIT) + Nathalie-stem (CC0) | MIT / CC0  | Vooraf gegenereerde woord- en instructieaudio.                                               | [ADR 0017](../adr/0017-letterklanken-en-audio.md), [ADR 0023](../adr/0023-voorlezen-met-tts.md) |
| Eigen SVG’s                       | Eigen werk | Alleen voor een latere Sinterklaassset (mijter, staf, pepernoot, schoen).                    | Geen externe bron; teken in dezelfde lijnstijl als Phosphor.                                    |
| Playwright-thumbnail              | Eigen werk | 800 × 500 JPEG van het speelscherm, met contenthash in de naam.                              | Zoals bij de andere spellen.                                                                    |

Het werkblad zelf is **geen** bron voor beeld. De tekeningen, de titelstijl en de lay-out zijn van de maker; we nemen alleen de mechanic en de gewone woorden over. De mechanic (een legenda van symbolen naar letters) is algemeen; de specifieke tekeningen en vormgeving nemen we niet over.

## Integratieschets

### Nieuwe slices

```text
libs/entities/geheime-code/
  model/types.ts          Symbol, WordSet, Puzzle, Attempt, Progress
  model/symbols.ts        18 symbolen met id, Nederlandse naam en Phosphor-naam
  model/words.ts          curated sets per thema en niveau
  model/puzzle.ts         buildPuzzle(), checkLetter(), applyLetter(), hintFor()
  model/progress.ts       sterren, log, niveau; version 2 met profileId
  index.ts

libs/features/geheime-code/
  model/use-geheime-code-store.ts
  model/storage.ts
  model/audio.ts          optioneel; speechGroups
  ui/code-table.tsx
  ui/code-word.tsx
  ui/alphabet-keyboard.tsx
  ui/geheime-code-setup.tsx
  ui/geheime-code-play.tsx
  index.ts

libs/pages/geheime-code/
  ui/geheime-code-page.tsx
  index.ts
```

### Datastroom

1. De pagina leest de store en toont de setup of de ronde.
2. De setup kiest een thema en niveau; de store roept `buildPuzzle(set, seed)` aan.
3. De engine kiest een willekeurige bijectie tussen de letters van de set en de symbolen. Dezelfde letter krijgt overal hetzelfde symbool; verschillende letters krijgen verschillende symbolen.
4. De engine bouwt de rijen: per woord een array van `{ letter, symbol }`. Op niveau 3 markeert hij de givens en de verborgen legendaletters.
5. De UI toont de codekaart en de actieve woordrij. Elke tik gaat naar de store; de store controleert en geeft de nieuwe toestand terug.
6. Bij het laatste woord schrijft de store het resultaat naar `localStorage` en opent de pagina de viering.

De engine is puur: geen React, geen `localStorage`, geen `Date.now()` in de regels. De store geeft de seed en de tijd mee. Daardoor zijn de tests deterministisch en kan dezelfde code later ook een printbare werkblad-export of een “maak je eigen code”-modus bedienen.

### App en catalogus

- **Route:** `/geheime-code` in `apps/games/src/app/router.tsx`, als gewone `gameRoute`.
- **Catalogus:** `id: "geheime-code"`, naam **Geheime Code**, beschrijving “Kraak de code: zoek elke letter bij het juiste symbool.”, `to: "/geheime-code"`, lokale thumbnail, `speech: { kind: "visual" }` of `{ kind: "group", folders: ["code"] }`.
- **Spelicoon:** `geheime-code: Detective` in `libs/shared/ui/game-icon.tsx` (Phosphor). Als de naam te “volwassen” voelt, is `LockKey` of `Fingerprint` een alternatief.
- **Thumbnail:** 800 × 500 JPEG, lokaal gerenderd met Playwright, contenthash in de bestandsnaam.
- **Geen nieuwe dependency.** De bundel groeit alleen met de nieuwe code en de al aanwezige Phosphor-iconen (tree-shaken).

### Tests en kwaliteitsgate

- **Entity-tests** in `tests/node/geheime-code.test.ts`:
  - elke set heeft unieke woorden en alleen `a–z`;
  - de vereniging van de letters is ≤ het maximum van het niveau;
  - de mapping is een bijectie (geen dubbele letters of symbolen);
  - elk woord is volledig codeerbaar;
  - dezelfde seed geeft dezelfde puzzel;
  - elke verborgen letter heeft minstens één given;
  - de givens zijn uniek per verborgen letter.
- **Feature-tests** met Testing Library: een goede letter blijft staan, een foute letter gaat terug, de hint verschijnt na twee fouten, een woord en een ronde sluiten af.
- **E2E** in `e2e/geheime-code.spec.ts`: start een ronde, decodeer één woord, controleer de viering en test op 390 px en 1024 px op horizontale overflow.
- **Kwaliteitsgate:** `pnpm run quality`, daarna `pnpm run fsd` en `boundaries` voor de nieuwe slices. Reken op de gebruikelijke Fallow-regels; houd de UI in de feature en de entity puur, dan zijn er geen uitzonderingen nodig.
- **Spraak:** als er een `code`-groep komt, `pnpm run audio:nl` en `audio:check`; de `speech-coverage`-test dekt de catalogusentry.

## Verificatie

### Proef buiten de app

Ik heb de belangrijkste aanname — dat de code-engine klein en deterministisch kan zijn — getest in een los TypeScript-bestand buiten de repo, met **Node 24.22.3** en **tsx 4.23.15**. De proef:

- bouwt een puzzel uit een woordenlijst, een maximumaantal symbolen en een seed;
- kiest een willekeurige bijectie tussen de letters en de symbolen;
- codeert alle woorden en controleert de terugweg;
- herhaalt dat voor 1000 seeds;
- test een te klein maximum.

Uitkomst:

- **1000 seeds, Sinterklaas, 6 woorden, maximaal 12 symbolen:** elke ronde geldig; de legenda werd 10 of 12 letters groot. De selectie koos echter niet altijd de meest thematische woorden: `snoep` won van `pakje` omdat het minder nieuwe letters kostte. Dat bevestigt dat de woordkeuze bij de ontwerper moet blijven.
- **1000 seeds, Tuin, 6 woorden, maximaal 12 symbolen:** elke ronde geldig.
- **8 symbolen voor 6 woorden uit de brede Sinterklaaslijst:** terecht geweigerd; de woorden hebben samen meer letters.
- De bijectie, de codering en de teruggave waren in alle gevallen correct.

De proef is niet in de app gedraaid en zegt niets over de UI, de 390 px-layout, de schermlezer of de spraak. Die moeten in de implementatie worden getest.

### Waarom de woordenset zo belangrijk is

Ik heb alle combinaties van 6 woorden uit een brede Sinterklaaslijst van 12 woorden geteld. De vereniging van de letters loopt ver uiteen:

| Aantal verschillende letters | Aantal combinaties (van 924) |
| ---------------------------- | ---------------------------: |
| 10                           |                            1 |
| 11                           |                            3 |
| 12                           |                           21 |
| 13                           |                           58 |
| 14                           |                          164 |
| 15                           |                          214 |
| 16                           |                          263 |
| 17                           |                          167 |
| 18                           |                           33 |

Alleen **25 van de 924** combinaties passen binnen 12 letters; 247 passen binnen 14. De oorspronkelijke zes woorden van het werkblad zijn dus geen willekeurige greep: ze zijn zo gekozen dat de legenda precies twaalf vakjes heeft. Een generator die willekeurig zes woorden kiest, krijgt meestal een legenda van 15–17 symbolen. Dat is op een tablet nog te doen, maar op een telefoon te veel.

Daarom: **de woorden worden gecureerd, de code wordt gegenereerd.** De engine kan daarnaast een letterzuinige selectie doen als er later veel content is, maar de eerste versie heeft vaste sets per thema en niveau. Dat houdt de legenda klein, de woorden herkenbaar en de tests eenvoudig.

### Wat nog niet is getest

- De echte React-rendering, de focusvolgorde en de schermlezer.
- De layout op 390 px en 1024 px met 12 en 14 symbolen.
- De TTS-uitspraak van `sint`, `piet`, `mijter`, `schoen`, `snoep`, `gedicht` en `cadeau`.
- Of kinderen de regel “het plaatje is niet de beginletter” meteen begrijpen.
- Of niveau 1 met alleen de 12 letters te makkelijk is, en niveau 2 met 26 letters te groot.
- Of de hinttrap in de praktijk niet te veel verklapt.

## Risico’s en open vragen

1. **De beginletter-val.** Een kind kan “mijter → M” denken. Onderscheid de legendacode daarom expliciet van de beginlettercode, met een korte eerste uitleg en een voorbeeld. Overweeg om in de generator te vermijden dat de Nederlandse naam van een symbool met dezelfde letter begint als de letter die het voorstelt.
2. **Het spel is vooral overschrijven.** Met een zichtbare legenda is het een lookup-oefening, geen cryptogram. Dat is voor 6–8 jaar precies goed, maar voor 9+ te makkelijk. Niveau 3 (verborgen legendaletters) en niveau 4 (echte codekraker) zijn nodig om de belofte “code kraken” waar te maken.
3. **De legenda op een telefoon.** 12 symbolen passen; 14–16 wordt krap. Cap de eerste versie op 12–14 en test de hoogte op 390 × 844. Als de kaart te hoog wordt, is een compacte kaart met alleen de symbolen van het huidige woord een alternatief, maar dan verliest het kind het overzicht.
4. **De woordkeuze is het grootste werk.** De engine is klein; de thema’s, de lettervereniging en de givens zijn dat niet. Elke set moet met de hand worden gecontroleerd en getest.
5. **“Piet”.** Het woord kan als woord voorkomen, maar de keuze vraagt aandacht. Geen afbeeldingen van personen; de maintainer beslist of het woord in de Sinterklaassset blijft.
6. **Spraak en dubbele audio.** De Woordzoeker heeft al woordaudio. Als Geheime Code dezelfde woorden gebruikt, moeten de regels naar een gedeelde module, anders krijgt de audiocatalogus dubbele id’s. Dat is een kleine refactor, geen blokkade.
7. **Adaptief of vaste niveaus.** [ADR 0026](../adr/0026-adaptief-niveaumodel.md) maakt adaptief de standaard waar een zinvolle as bestaat. Die as is er: woordlengte, legenda-orde en givens. De eerste versie kan met vaste niveaus starten, maar log de pogingen (woord, goed/fout, hints, tijd) al wel volgens het ADR-model, zodat de ladder later zonder migratie kan worden aangezet.
8. **Hoofdletters of kleine letters.** Het werkblad gebruikt hoofdletters; de app en het lezen in groep 3 gebruiken vooral kleine letters. Kies kleine letters voor de woorden en de legenda, of maak het een niveau-instelling. Test het met kinderen voordat het definitief wordt.
9. **Schermlezer.** Elk symbool heeft een Nederlandse naam nodig; de codekaart moet als lijst of tabel leesbaar zijn; de woordrij moet “ster, leeg” zeggen en niet de letter verklappen. Dit is extra ontwerpwerk, maar het maakt het spel inclusief.
10. **Geen bewijs van leereffect.** Dit is een puzzel, geen interventie. We claimen hooguit dat het letterherkenning, spelling en aandacht oefent; niet dat het lezen versnelt.

### Open vragen voor de maintainer

- Eerst **Sinterklaas** (seizoensgebonden) of eerst **Tuin/Onder water** (het hele jaar)?
- Moet de code per ronde wisselen, of per thema vast blijven zodat het kind hem leert kennen?
- Moet het kind ook de codekaart zelf kunnen invullen, of alleen de woorden?
- Willen we een **printbare werkblad-export** (dezelfde code, als PDF of print-CSS)? Dat sluit aan op de papieren bron, maar is een aparte feature.
- Willen we een **“maak je eigen code”**-modus? Dat is leuk voor ouders, maar vraagt invoervalidatie en mogelijk opslag; geen eerste versie.
- Moet niveau 3 in de eerste release zitten, of is niveau 1–2 genoeg om te testen?

## Bronnen

- [SLO, TULE Nederlands kerndoel 4: technisch lezen, groep 3 en 4](https://www.slo.nl/thema/meer/tule/nederlands/kerndoel-4-0/) — geraadpleegd 2026-11-21.
- [Minipret, Codekraker werkbladen](https://www.minipret.nl/codekraker-werkbladen) en [Lente Codekraker groep 3–4](https://www.minipret.nl/lente-codekraker-groep-3-4-werkblad) — voorbeelden van de werkbladvorm.
- [Puzzelmomentje, Codekraker](https://puzzelmomentje.nl/nl/puzzels/codekraker) — uitleg van de klassieke cijfer-lettercodekraker.
- [Eduki, Kraak de code](https://eduki.com/nl/material/1514764/kraak-de-code-1) — de beginlettervariant met plaatjes.
- [Vanjufmarjan, Geheimschrift](https://vanjufmarjan.nl/2022/01/15/geheimschrift/) en [Groepsspellen, Geheimschrift](https://groepsspellen.nl/geheimschrift/) — lesideeën en varianten.
- [Phosphor Icons](https://phosphoricons.com) — MIT; lokale licentie in [`LICENSES/phosphor-MIT.txt`](../../LICENSES/phosphor-MIT.txt).
- [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) — MIT; lokale licentie in [`LICENSES/fluent-emoji-MIT.txt`](../../LICENSES/fluent-emoji-MIT.txt).
- [@apiverve/cryptogram](https://www.npmjs.com/package/@apiverve/cryptogram) — HTTP-API; afgevallen.
- [mez-encryption](https://github.com/MoonesMezher/mez-encryption) — Caesar/Pigpen; afgevallen.
- [substitutioncipher-js](https://github.com/SubramanyaKS/substitutioncipher) — encode/decode; afgevallen.
- [puzzleloom](https://github.com/btahir/puzzleloom) — MIT-referentie voor een bredere puzzelmaker.
- [chrono-cipher](https://github.com/ctkrug/chrono-cipher) — MIT-referentie voor een cryptogramspel.
- [cipherly](https://github.com/TomerAberbach/cipherly), [GameHelix/cryptogram](https://github.com/GameHelix/cryptogram), [1ukoi1ik/Cryptogram2](https://github.com/1ukoi1ik/Cryptogram2), [lettercrack](https://github.com/bighatclick/lettercrack) — alleen ter inspiratie; geen bruikbare licentie.
- [crossword-layout-generator](https://www.npmjs.com/package/crossword-layout-generator) en [@jaredreisinger/react-crossword](https://www.npmjs.com/package/@jaredreisinger/react-crossword) — voor een latere kruiswoordvariant.
- [ADR 0017: letterklanken en audio](../adr/0017-letterklanken-en-audio.md), [ADR 0023: voorlezen met TTS](../adr/0023-voorlezen-met-tts.md), [ADR 0026: adaptief niveaumodel](../adr/0026-adaptief-niveaumodel.md).
- [Onderzoek Woordzoeker-libraries](2026-10-18-woordzoeker-libraries.md) — voorbeeld van de vergelijkingsaanpak en de bestaande woordenschat.
- [Onderzoek Typepret](2026-11-07-typepret.md) — voorbeeld van een game met een eigen, kleine engine en een bestaande UI-stack.
