# Onderzoek: Frans luisterspel met flipcards, sorteren en TTS

- **Datum:** 2026-10-18
- **Status:** Onderzoek, geen beslissing
- **Vraag:** welk nieuw spel kunnen we bouwen waarin een kind Franse woorden en zinnen hoort en de juiste Nederlandse vertaling kiest, met flipcards en sorteeroefeningen?
- **Kader:** de regels uit `AGENTS.md` en [ADR 0001](../adr/0001-publieke-statische-spellen-app.md): publiek, statisch, alleen TypeScript, geen externe requests, geen backend, strikte CSP.

## Kort advies

**Bouw een listening-first Frans spel voor 9–12 jaar (A1.2), met eigen lesinhoud en vooraf gegenereerde audio.**

- Geen bestaand npm-pakket of open lespakket levert kant-en-klare Frans-Nederlandse lessen met audio. De bruikbare bronnen zijn losse woordlijsten, woordenboeken en corpora; die zijn te rommelig om ongefilterd te gebruiken.
- Gebruik de bestaande TTS-integratie in de homelab om **offline audiofragmenten** te genereren en commit die als statische bestanden. De app doet daarna geen enkele externe request.
- **Mannenstem:** `fr_FR-tom-medium` werkt via Speaches, klinkt mannelijk en is 44,1 kHz. De stemdataset is AGPLv3; gebruik hem alleen als die licentie acceptabel is. `fr_FR-gilles-low` is het CC0-alternatief, maar 16 kHz/low. `fr_FR-upmc-medium` heeft wel een mannelijke spreker (`pierre`), maar Speaches negeert de `voice`-parameter, dus via de huidige service krijg je de vrouwelijke standaardstem. `fr_FR-mls-medium` bleek in de test onbruikbaar.
- **Vrouwenstem / referentie:** Piper `fr_FR-siwis-medium` (CC-BY 4.0) en Kokoro `ff_siwis` (Apache-2.0). Kokoro is sterker in hele zinnen, zwakker in losse woorden.
- Geen nieuwe runtime-dependency nodig. De memory-kaart heeft al een CSS-flip; sorteren kan met tikken in plaats van drag-and-drop. Dat is beter voor touch en accessibility.
- Begin met **6 thema's × 10 woorden + 5 zinnen = 90 items**. Dat is genoeg voor een echte eerste versie en houdt de audio onder de ~5 MB.
- Laat de inhoud door een Nederlandstalige met kennis van Frans reviewen. Tatoeba bevat te veel volwassen, rare en naamgebonden zinnen om zonder handmatige selectie te importeren.

## 1. Wat bestaat er al?

### 1.1 npm-pakketten

De npm-registry is op 2026-10-18 doorzocht op `french vocabulary`, `french words`, `french lessons`, `learn french`, `duolingo`, `french conjugation` en `cefr french`.

| Pakket                        | Versie        | Licentie | Wat het is                                | Bruikbaar?                                           |
| ----------------------------- | ------------- | -------- | ----------------------------------------- | ---------------------------------------------------- |
| `an-array-of-french-words`    | 2.0.0         | MIT      | ~336.000 Franse woorden, 4,57 MB unpacked | Alleen als spellings-/woordenlijst; geen vertalingen |
| `word-list-fr`                | 1.0.2         | MIT      | ~3,9 MB Franse woorden                    | Idem                                                 |
| `syllabify-fr`                | 1.0.1         | MIT      | Frans lettergrepen splitsen               | Niet nodig voor de eerste versie                     |
| `conjugation-fr`              | 0.3.4         | GPL-2.0  | Franse werkwoordsvervoegingen             | Vermijden: GPL-2.0 en niet nodig voor A1             |
| `duolingo` / `duolingo-api`   | 1.2.4 / 1.0.2 | onbekend | Onofficiële Duolingo-clients              | Vermijden: netwerk, ToS en geen lesinhoud            |
| `@myfrenchllc/conjugaison-fr` | 1.0.0         | onbekend | Client voor een externe vervoegings-API   | Vermijden: externe request                           |

**Conclusie:** er is geen npm-pakket dat een kindvriendelijke Frans-Nederlandse woordenschat, zinnen, vertalingen en audio meelevert. De woordlijsten zijn bruikbaar als hulpmiddel bij het controleren van spelling, maar niet als lesinhoud.

### 1.2 Open datasets en lespakketten

| Bron                                                                                  | Wat het biedt                                                                          | Licentie              | Geschikt voor                                                                                   |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| [Lexique 4](https://www.lexique.org/)                                                 | 140.000 Franse woorden met frequentie, woordsoort, geslacht, lettergrepen en fonologie | CC BY-SA 4.0          | Frequentie en metadatacontrole; geen vertalingen                                                |
| [FLELex](https://cental.uclouvain.be/cefrlex/flelex/)                                 | Franse woordfrequenties per CEFR-niveau (A1–C2)                                        | CC BY-NC-SA 4.0       | Niveau-indeling; geen vertalingen en niet commercieel                                           |
| [Tatoeba](https://tatoeba.org/en/downloads)                                           | 30.585 Frans-Nederlandse zinsparen (OPUS v2026-07-08)                                  | CC BY 2.0 FR (tekst)  | Bron van voorbeeldzinnen, mits handmatig geselecteerd                                           |
| [WikDict](https://www.wikdict.com/page/download)                                      | Wiktionary-woordenboeken, directe `fr-nl`- en `nl-fr`-SQLite (9,7 MB / 8,1 MB)         | CC BY-SA 4.0          | Kandidaten voor woordvertalingen; meerdere betekenissen per woord                               |
| [FreeDict `fra-nld`](https://github.com/freedict/fd-dictionaries/tree/master/fra-nld) | 9.604 trefwoorden, editie 0.2 uit 2017                                                 | GPL-2.0+              | Te klein, te oud en copyleft; niet aanbevolen                                                   |
| [PanLex](https://panlex.org/)                                                         | Zeer brede lexicale vertaaldatabase (CC0)                                              | CC0                   | Alleen als kandidatengenerator; te ruisrijk                                                     |
| [Open Multilingual Wordnet](https://omwn.org/)                                        | Frans en Nederlands wordnet, gekoppeld via synsets                                     | wisselend per wordnet | Basisbegrippen; dekt niet genoeg voor een lespakket                                             |
| [Lingua Libre](https://lingualibre.org/)                                              | Menselijke uitspraakopnames                                                            | CC BY-SA 4.0          | Alternatief voor TTS; kwaliteit en dekking wisselen                                             |
| [Français interactif](https://coerll.utexas.edu/coerll/oer/francais-interactif/)      | Complete eerstejaars Franse methode                                                    | CC BY 4.0             | Structuur en thema's; vertalingen zijn Engels en het niveau is hoger                            |
| [LibreLingo FR-from-EN](https://github.com/LibreLingoCommunity/LibreLingo-FR-from-EN) | Zogenaamd een Franse cursus                                                            | CC BY-NC-SA 4.0       | **Niet bruikbaar:** de repo is een template met Spaanse placeholders (`ratón`, `¡Buenos días!`) |
| [UniversalCEFR](https://universalcefr.github.io/)                                     | CEFR-gelabelde teksten in 13 talen                                                     | onderzoekslicenties   | Niet nodig; geen woordenschatlijst                                                              |

**Belangrijke observatie over Tatoeba.** De 30.585 paren zijn een bruikbare controlebron, maar de kwaliteit is niet gegarandeerd. Een willekeurige steekproef bevatte expliciete/volwassen zinnen, namen van personen, formele en informele aanspreekvormen door elkaar en vertalingen die niet één-op-één natuurlijk klinken. Ook de lengte en het niveau lopen sterk uiteen.

Dat betekent: geen automatische import. Een klein, handmatig geselecteerd en gereviewd corpus is nodig, of we schrijven de zinnen zelf.

### 1.3 Wat dit betekent voor de lesinhoud

De beste route is **eigen, korte, kindvriendelijke lesinhoud**:

- 6 thema's die aansluiten bij de belevingswereld: groeten, dieren, familie, eten, school, vrije tijd/weer.
- Per thema 10 woorden en 5 korte zinnen.
- Elke zin gebruikt alleen woorden uit dat thema of uit eerdere thema's.
- Nederlandse vertalingen worden door een mens gecontroleerd; geen machinevertaling publiceren zonder review.
- Lexique/FLELex alleen gebruiken om te controleren of een woord bij A1 past, niet als bron van de les zelf. Zo blijven we weg van de share-alike- en non-commercialverplichtingen.

## 2. TTS op deze server

De homelab heeft al twee OpenAI-compatibele TTS-diensten: Kokoro en Piper via Speaches. Beide hebben een `/v1/audio/speech`-endpoint en kunnen MP3 of WAV leveren. Speaches ondersteunt geen Opus of AAC; MP3 is de praktische keuze.

### 2.1 Kokoro

- Model: `Kokoro-82M`, Apache-2.0.
- Frans: één stem, `ff_siwis`, vrouwelijk.
- Frans trainingsmateriaal: minder dan 11 uur; de modelkaart geeft een overall grade **B-**.
- De modelkaart waarschuwt dat korte uitingen (minder dan 10–20 tokens) zwakker zijn. Dat is precies het geval bij losse woorden.
- Geschikt voor hele zinnen, minder zeker voor losse woorden.

### 2.2 Piper

Piper is MIT-software. De Franse stemmen staan in `rhasspy/piper-voices` en zijn ook als Speaches-modellen beschikbaar.

| Stem                                   | Sprekers | Sample rate | Datasetlicentie | Opmerking                                                            |
| -------------------------------------- | -------- | ----------- | --------------- | -------------------------------------------------------------------- |
| `speaches-ai/piper-fr_FR-siwis-medium` | 1        | 22,05 kHz   | CC-BY 4.0       | Vrouwenstem; schoon en geschikt voor korte woorden                   |
| `speaches-ai/piper-fr_FR-upmc-medium`  | 2        | 22,05 kHz   | CC-BY-SA 4.0    | `jessica` (0) en `pierre` (1); Speaches negeert `voice`, dus jessica |
| `speaches-ai/piper-fr_FR-tom-medium`   | 1        | 44,1 kHz    | AGPLv3          | Mannenstem; werkt in de test; alleen na expliciete licentiekeuze     |
| `speaches-ai/piper-fr_FR-gilles-low`   | 1        | 16 kHz      | CC0             | Mannenstem; werkt, maar lage kwaliteit                               |
| `speaches-ai/piper-fr_FR-mls-medium`   | 125      | 22,05 kHz   | CC-BY 4.0       | Standaardstem 0; in de test onverstaanbaar; niet gebruiken           |
| `speaches-ai/piper-fr_FR-mls_1840-low` | 1        | 16 kHz      | CC BY 4.0       | Niet getest; lage kwaliteit                                          |

**Advies:** gebruik voor de spike `tom-medium`: mannelijk, 44,1 kHz en werkend via Speaches. Is de AGPLv3-datasetlicentie niet acceptabel, kies dan `gilles-low` (CC0, 16 kHz) of `siwis`/Kokoro als vrouwelijke stem. `pierre` kan alleen met een aparte Piper-run of een aangepaste Speaches-versie. Kies één stem voor het hele spel; wisselen per oefening klinkt rommelig.

### 2.2.1 Testresultaten van de spike (2026-10-18)

Dezelfde vijf zinnen zijn met vijf stemmen gegenereerd. Daarna is de gemiddelde toonhoogte (F0) gemeten en zijn de fragmenten met Whisper getranscribeerd om de verstaanbaarheid te controleren.

| Stem               | F0 (gemiddeld) | Uitkomst                                                                                |
| ------------------ | -------------: | --------------------------------------------------------------------------------------- |
| `upmc` (standaard) |        ~233 Hz | Vrouwelijk; de `voice`-parameter wordt genegeerd                                        |
| `siwis`            |        ~210 Hz | Vrouwelijk; goed verstaanbaar                                                           |
| `tom`              |        ~136 Hz | Mannelijk; goed verstaanbaar                                                            |
| `gilles`           |        ~107 Hz | Mannelijk; verstaanbaar, maar 16 kHz/low                                                |
| `mls`              |        ~104 Hz | Mannelijk, maar de output was onverstaanbaar (Whisper gaf herhaalde nonsense); afwijzen |

De les `Les animaux` is met `tom` gegenereerd: 15 MP3's, samen ongeveer 230 KB, in `apps/games/public/audio/fr/`. De app leest die bestanden lokaal; tijdens het spelen is er geen TTS-aanroep.

### 2.3 Audio genereren

- Genereer de fragmenten **bij development**, niet in de browser en niet in CI.
- Commit de MP3's in `apps/games/public/audio/fr/`. De app leest ze als gewone statische bestanden.
- Het generatiescript is TypeScript (geen Python/JavaScript) en leest de endpoint-URL, het model en de stem uit environment variables. Zet **geen** interne hostname, token of `.env`-waarde in de publieke repo.
- Het script:
  1. leest de lesdefinities;
  2. slaat items met `reviewed: false` over;
  3. vraagt per item `POST /v1/audio/speech` aan met `response_format: "mp3"`;
  4. schrijft `apps/games/public/audio/fr/<id>.mp3`;
  5. controleert dat het bestand niet leeg is en begint met een MP3-frame;
  6. ondersteunt `--only=<id>`, `--force` en `--dry-run`.
- Een eerste request kan het Piper-model op de TTS-server laten downloaden (ongeveer 60 MB). Daarna staat het in de cache.
- Voeg een `_headers`-regel toe voor `/audio/*` met een lange cacheduur. Gebruik eventueel een versiemap (`audio/fr/v1/`) zodat je bij een nieuwe stem of uitspraak geen oude bestanden uit de cache houdt.

### 2.4 CSP en autoplay

- De huidige CSP heeft geen expliciete `media-src`; die valt terug op `default-src 'self'`. Lokale audiobestanden werken dus, net als de bestaande Pokémon-cries via `HTMLAudioElement`.
- Voeg `media-src 'self'` expliciet toe aan `apps/games/public/_headers` om de bedoeling vast te leggen. Dat is een verscherping, geen verzwakking.
- Autoplay is op iOS/Chrome pas toegestaan na een gebruikershandeling. De quiz start met een knop; dat is genoeg. Als `play()` toch wordt geweigerd, toon je een grote "Tik om te luisteren"-knop in plaats van een foutmelding.
- Hergebruik één `HTMLAudioElement`, zoals `use-pokemon-cry.ts` doet. Pauzeer het vorige fragment voordat je het volgende start.

## 3. Spelconcept

### 3.1 Kern: luisteren en de juiste vertaling kiezen

Dit is de hoofdmodus en precies wat de opdracht vraagt:

1. Het kind hoort een Frans woord of een hele zin.
2. Het kiest uit 3–5 Nederlandse vertalingen.
3. Na het antwoord ziet het de Franse tekst, de Nederlandse vertaling en eventueel een korte uitleg.
4. Het kan het fragment opnieuw beluisteren, ook langzaam (0,75×).
5. Bij een fout antwoord: geen straf, maar het item komt sneller terug.

Belangrijk voor de kwaliteit:

- **Woorden krijgen hun lidwoord**: `le chat`, `la maison`. Zo leert het kind meteen het geslacht.
- **Zinnen zijn kort**: 3–7 woorden in de eerste levels.
- **Afleiders zijn plausibel**: dezelfde woordsoort, hetzelfde thema en bij zinnen slechts één verschil (onderwerp, werkwoord of object). Niet drie willekeurige woorden.
- **Geen dubbele juiste antwoorden**: één primaire vertaling per item; alternatieven alleen voor de flipcard, niet als quizoptie.
- **Tekst pas na het antwoord** (of via een "toon tekst"-knop), zodat het kind echt luistert. Voor accessibility is de tekst altijd bereikbaar.

### 3.2 Flashcard-oefening

- Voorkant: Frans woord of zin, emoji/afbeelding en een speakerknop.
- Achterkant: Nederlandse vertaling, lidwoord/gender en een voorbeeldzin.
- Twee knoppen: "Nog oefenen" en "Ken ik". Die sturen de spatiëring.
- Gebruik de bestaande CSS-3D-flip uit de memory-game. Bij `prefers-reduced-motion` wordt het een fade.
- Geen drag, geen swipe-verplichting; gewoon tikken.

### 3.3 Sorteren

Twee varianten, in volgorde van prioriteit:

1. **Zin bouwen**: de woorden van een Franse zin staan door elkaar. Het kind tikt ze in de juiste volgorde. Dit oefent zinsbouw en luisterherkenning.
2. **Categorieën**: sleep of tik woorden naar "dieren", "eten", "familie" of "le/la". Voor de eerste versie is tikken voldoende; drag-and-drop is niet nodig.

Waarom tikken in plaats van slepen:

- beter voor jonge kinderen en touch;
- geen extra dependency;
- toetsenbord en screenreader blijven werken;
- geen last van de open StrictMode-bug in `@dnd-kit/react`.

Als er later echt gesleept moet worden, is `@dnd-kit/core` + `@dnd-kit/sortable` (MIT, ~14,6 KB gzip) de stabiele keuze. Niet in de MVP.

### 3.4 Voortgang en motivatie

- Per item: een box (0–5), `dueAt` en een reeks goede antwoorden.
- Goed bij de eerste poging: box + 1, volgende keer na 0, 1, 3, 7, 14 of 30 dagen.
- Fout: box terug naar 0 of 1 en het item komt in dezelfde sessie terug.
- Per les: 1 ster voor afronden, 2 sterren voor ≥80% eerste-poging goed, 3 sterren voor 100%.
- Geen harten, levens of harde straf. Wel een rustige "nog eens proberen"-knop.
- Alles in `localStorage`; geen accounts, geen server.

## 4. Technische inpassing

### 4.1 Nieuwe slices

| Laag      | Project                                    | Inhoud                                                        |
| --------- | ------------------------------------------ | ------------------------------------------------------------- |
| Entity    | `libs/entities/french`                     | types, lesdefinities, SRS-regels, audio-padhelper             |
| Feature   | `libs/features/french-listening`           | Zustand-store, vraaggenerator, quiz-, flipcard- en sorteer-UI |
| Page      | `libs/pages/french`                        | leskeuze, modekeuze en `GameShell`                            |
| App       | `apps/games/src/app/router.tsx`            | route `/frans`                                                |
| Catalogus | `libs/entities/game/model/game-catalog.ts` | nieuwe `available`-entry met `to: "/frans"`                   |

Deze indeling volgt de bestaande FSD-structuur. De entity bevat geen React; de feature bevat de store en UI. De page stelt alleen samen.

### 4.2 Datamodel

```ts
type FrenchKind = "word" | "phrase";
type FrenchLevel = "A1.1" | "A1.2";

interface FrenchItem {
  id: string;
  fr: string; // wat de speler leest
  audioText?: string; // wat TTS zegt; bijvoorbeeld "vingt et un" in plaats van "21"
  nl: string; // primaire vertaling
  nlAlt?: string[]; // alternatieven voor de flipcard
  kind: FrenchKind;
  theme: FrenchThemeId;
  level: FrenchLevel;
  emoji?: string;
  note?: string; // korte uitleg na het antwoord
  reviewed: boolean; // alleen reviewed items komen in de quiz
}
```

`audioSrc(item)` geeft `/audio/fr/${item.id}.mp3`. De generator en de app gebruiken dezelfde functie, zodat een ontbrekend bestand meteen opvalt.

### 4.3 Vraaggeneratie

- Kies een doelitem op basis van SRS: eerst items die nu aan de beurt zijn, daarna nieuwe items.
- Kies afleiders uit dezelfde les en hetzelfde `kind`. Bij voorkeur uit een handmatige `contrastGroup` (bijvoorbeeld `chat`/`chien`/`lapin`).
- Vul aan met andere items uit hetzelfde thema als er te weinig afleiders zijn.
- Schud de opties met de bestaande `mulberry32`/`shuffledIndexes`-helpers.
- Geen twee opties met dezelfde `nl`-tekst.
- Bewaar het `seed` in de vraag voor reproduceerbare tests.

### 4.4 Audio-ervaring

- Eén herbruikbare `HTMLAudioElement` in een `useFrenchAudio`-hook.
- `play(item, { rate })`, `stop()`, `preload(items)`.
- Bij een nieuwe vraag: preload de huidige en de volgende twee fragmenten.
- Houd de `play()`-promise bij: bij een autoplay-fout blijft de speakerknop actief.
- Toon nooit een kapotte audio-ervaring zonder fallback: na het antwoord is de tekst altijd zichtbaar.

### 4.5 Routing en UI

- Home → Frans → leskeuze.
- Leskaart: emoji, titel, aantal items, sterren.
- Binnen een les: "Luister & kies" als primaire knop, "Oefen met kaarten" en "Bouw de zin" als secundaire knoppen.
- `GameShell` verzorgt de terugknop en "nieuw spel".
- Houd de bediening groot: minimaal 44 px, veilige marges, één kolom op 390 px en twee kolommen op 1024 px.
- `aria-live="polite"` voor feedback; `aria-label` op elke speakerknop; zichtbare focusringen.

### 4.6 Tests

- Node-tests voor:
  - unieke item-id's en geldige audio-paden;
  - elk `reviewed` item heeft een bestaand audiobestand;
  - afleiders zijn uniek, bevatten het doelitem en hebben dezelfde `kind`;
  - SRS-overgangen (goed/fout, due-datums).
- Web-tests voor:
  - quizflow: vraag → antwoord → feedback → volgende;
  - flipcard: voor/achterkant en "ken ik"/"nog oefenen";
  - zin bouwen: tikken, verwijderen en controleren.
- Mock `HTMLAudioElement.play()` in jsdom; jsdom speelt geen audio.
- E2E optioneel: start een les, controleer dat het `<audio>`-element een lokaal pad heeft en dat de voortgang in `localStorage` staat.

## 5. Licenties, privacy en attributie

- **Eigen lesinhoud** is de eenvoudigste route: geen share-alike, geen non-commercial, geen bronvermelding per zin.
- **TTS**: Piper is MIT. Kokoro is Apache-2.0.
  - Bij `siwis`: "Audio gegenereerd met Piper (MIT), stem SIWIS (CC BY 4.0)."
  - Bij `upmc`/`pierre`: "Audio gegenereerd met Piper (MIT), stem UPMC Pierre (CC BY-SA 4.0)." In de huidige Speaches-service is `pierre` niet selecteerbaar.
  - Bij `gilles`: "Audio gegenereerd met Piper (MIT), stem Gilles (CC0)."
  - Bij Kokoro: "Kokoro-82M (Apache-2.0)."
  - Bij `tom`: "Audio gegenereerd met Piper (MIT), stem Tom (dataset AGPLv3)." Als de audio als afgeleid werk wordt gezien, moet de audio onder AGPLv3 worden gedeeld. Leg dit vast in de credits en laat de eigenaar de licentie expliciet goedkeuren.
  - `mls` is afgevallen: de output was onverstaanbaar.
- **Tatoeba**, als er toch een enkele zin wordt overgenomen: CC BY 2.0 FR, met bronlink en vermelding. Niet nodig als we alles zelf schrijven.
- **Lexique/FLELex**, als alleen ter controle gebruikt: geen data kopiëren; wel noemen in de onderzoeksnotitie. Zodra we hun data in de app opnemen, gelden CC BY-SA 4.0 respectievelijk CC BY-NC-SA 4.0.
- **Audio**: geen Tatoeba-audio gebruiken; de licenties verschillen per opname en sommige staan hergebruik niet toe. Eigen TTS is veiliger en consistenter.
- **Privacy**: geen namen, foto's of persoonsgegevens in de lesinhoud. Fictieve namen zijn eventueel oké, maar liever helemaal vermijden.
- **Publieke repo**: geen interne TTS-URL, token of `.env`-waarde. Het generatiescript leest alles uit environment variables.

## 6. Risico's en hoe we ze klein houden

| Risico                                                 | Mitigatie                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Verkeerde of onnatuurlijke vertaling                   | Menselijke review; `reviewed`-flag; liever 90 goede items dan 500 matige                                |
| TTS klinkt robotachtig of leest korte woorden verkeerd | A/B-test Piper vs. Kokoro; woorden met lidwoord inspreken; steekproef beluisteren op telefoon en tablet |
| Verkeerde uitspraak door TTS (liaison, stomme letters) | `audioText` apart houden; voorbeeldzinnen door een Franstalige laten controleren                        |
| Autoplay geblokkeerd                                   | Start met een knop; fallback "Tik om te luisteren"                                                      |
| Audio te groot                                         | 90–150 clips, MP3, mik op <5–8 MB; geen lange verhalen                                                  |
| Cloudflare-limiet                                      | 20.000 bestanden free / 100.000 paid; 25 MiB per bestand. Honderden clips passen ruim                   |
| Cache veroudert na nieuwe stem                         | Versiemap (`audio/fr/v1/`) of korte cacheduur                                                           |
| Kindvriendelijkheid                                    | Geen Tatoeba-import; eigen zinnen; geen geweld, scheldwoorden, volwassen thema's                        |
| Accessibility                                          | Tekstfallback, 44 px, toetsenbord, reduced motion, geen kleur als enige signaal                         |
| Frans uit Frankrijk vs. België                         | Kies bewust `fr_FR`; vermijd getallen/uitdrukkingen die sterk verschillen of noteer ze                  |

## 7. Gefaseerd plan

### Fase 0 — spike (uitgevoerd)

1. Vijf stemmen getest: `upmc` (standaard), `siwis`, `tom`, `gilles` en `mls`. `mls` is afgevallen; `tom` is de werkende mannenstem.
2. De les `Les animaux` met 10 woorden en 5 zinnen is met `tom` gegenereerd (15 MP3's, ~190 KB).
3. De quiz `Luister & kies` en de flipcard-oefening zijn gebouwd.
4. **Nog te doen:** op telefoon (390 px) en tablet (1024 px) beluisteren en de stem/het volume definitief kiezen.

**Beslispunt:** `tom` houden (AGPLv3-dataset) of naar `gilles` (CC0, 16 kHz) gaan; en `fr_FR` versus een Belgische stem als die beschikbaar is.

### Fase 1 — MVP (2–3 dagen)

- 6 thema's × 10 woorden + 5 zinnen = 90 items.
- Quiz "Luister & kies" met SRS en sterren.
- Flipcard-oefening.
- Leskeuze, voortgang in `localStorage`, credits.
- Node- en web-tests; quality gate; test op 390/1024 px.

### Fase 2 — uitbreiden

- Zin bouwen (sorteren).
- Meer thema's en een "meester"-level met langere zinnen en snellere audio.
- Extra oefenvorm: "kies de juiste Franse zin bij de Nederlandse betekenis".
- Optioneel: meerdere lokale profielen voor broers/zussen.

### Fase 3 — alleen als het nodig blijkt

- Drag-and-drop met `@dnd-kit/core` + `@dnd-kit/sortable`.
- Menselijke audio-opnames in plaats van TTS.
- Export/import van voortgang (lokaal bestand, geen server).

## 8. Open vragen

1. **Leeftijd/niveau:** 9–12 jaar (A1.2), woorden én zinnen. (Bevestigd.)
2. **Thema's:** welke zes thema's eerst? Groeten, dieren, familie, eten, school en weer/vrije tijd is een logische start.
3. **Stem:** mannelijke `tom` (Piper, dataset AGPLv3) of `gilles` (Piper, CC0, 16 kHz), of toch `siwis`/Kokoro? En Frans uit Frankrijk of België?
4. **Tekst:** mag de Franse tekst meteen zichtbaar zijn, of pas na het antwoord? (Advies: pas na het antwoord, met een "toon tekst"-knop.)
5. **Profielen:** één lokale speler of meerdere kinderen op hetzelfde apparaat?
6. **Review:** is er iemand die de Nederlandse vertalingen en de Franse uitspraak kan controleren voordat we publiceren?
7. **Naam:** "Bonjour !", "Frans luisteren" of iets anders?

## Bronnen

- [Lexique 4](https://www.lexique.org/) — CC BY-SA 4.0, 140.000 Franse woorden.
- [FLELex](https://cental.uclouvain.be/cefrlex/flelex/) — CC BY-NC-SA 4.0, CEFR-frequenties.
- [Tatoeba downloads](https://tatoeba.org/en/downloads) — CC BY 2.0 FR; audio licenties verschillen per opname.
- [OPUS Tatoeba fr-nl](https://opus.nlpl.eu/) — 30.585 paren, v2026-07-08.
- [WikDict downloads](https://www.wikdict.com/page/download) — CC BY-SA 4.0, directe `fr-nl`-SQLite.
- [FreeDict fra-nld](https://github.com/freedict/fd-dictionaries/tree/master/fra-nld) — GPL-2.0+, 9.604 trefwoorden.
- [PanLex](https://panlex.org/) — CC0.
- [Lingua Libre](https://lingualibre.org/) — CC BY-SA 4.0.
- [Français interactif](https://coerll.utexas.edu/coerll/oer/francais-interactif/) — CC BY 4.0.
- [LibreLingo FR-from-EN](https://github.com/LibreLingoCommunity/LibreLingo-FR-from-EN) — CC BY-NC-SA 4.0, template.
- [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) — Apache-2.0; `VOICES.md` voor `ff_siwis`.
- [Piper voices](https://huggingface.co/rhasspy/piper-voices) — MIT; model cards voor de Franse stemmen.
- [Speaches](https://github.com/speaches-ai/speaches) — MIT; OpenAI-compatibele TTS.
- [Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI) — Apache-2.0.
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) — 20.000/100.000 statische bestanden, 25 MiB per bestand.
