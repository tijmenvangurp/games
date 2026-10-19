# Plan: Voorlezen met TTS in de andere games

- **Datum:** 2026-10-19
- **Status:** P1 geïmplementeerd: fundament, Schaakles, Schaakpuzzels, Rekenen en Woordzoeker. Productiechecklist en overige games staan nog open.
- **Doel:** een kind dat nog niet kan lezen kan de opdrachten, vragen en antwoordwoorden van de Nederlandse games volgen, zonder dat de app een backend of externe requests krijgt.
- **Onderzoek:** [Voorlezen met TTS in de andere games](../research/2026-10-19-voorlezen-met-tts.md)

## Uitgangspunt

De app heeft al een werkende, statische audiopipeline voor Frans en Letterpret. De Nederlandse stem Nathalie bestaat en is bewezen in Letterpret. Die breiden we uit naar één gedeelde voorleeslaag voor alle games:

```text
SpeechLine      één zin of woord met een stabiel id en optionele uitspraaktekst
SpeechCatalog   de regels die bij een game of domein horen
SpeechPlayer    één audio-element, wachtrij, stop en voorkeur
SpeechButton    sprekerknop om een regel opnieuw te horen
AudioGenerator  catalogus -> lokale MP3's, plus --check
```

De UI en de generator lezen dezelfde catalogus. Een kind hoort dus precies wat er op het scherm staat, en een tekstwijziging kan niet stilzwijgend een oud audiobestand achterlaten.

## Scope

**Wel:**

- Nederlandse audio voor de vragen, opdrachten, antwoordopties en feedback.
- Eén Nederlandse stem voor alle games: Nathalie (CC0), dezelfde stem als Letterpret.
- Een voorleesstand die los van de geluidseffecten aan en uit kan.
- Herhaalknoppen bij elk gesproken element.
- Audio voor de P1-games: Schaakles, Schaakpuzzels, Woordzoeker en Rekenen.
- Daarna de P2/P3-games en het hoofdmenu, met Vlaggenreis als optionele uitbreiding.

**Niet:**

- Geen `speechSynthesis` of TTS-server tijdens het spelen.
- Geen backend, account of cloudopslag.
- **Pokémon-quiz en Pokémon-namen vallen voorlopig buiten scope.** De quiz blijft voorlopig tekstgebaseerd; later kan dezelfde aanpak alsnog worden toegepast.
- Geen voice-over van elk label, elke teller of elke decoratieve tekst.
- Geen stemkeuze per game of per kind (één stem is genoeg voor deze fase).
- Geen automatische vertaling naar andere talen.
- Geen nieuwe npm-dependency; de speler gebruikt de native `Audio`-API.
- Geen vervanging van de bestaande tekst; audio is een aanvulling.

## Schaalbaarheid: nieuwe games krijgen audio standaard

“Automatisch” betekent hier drie dingen:

1. **De game erft de speler en de knop.** Nieuwe games gebruiken `GameShell` en de gedeelde spraakcomponenten; ze bouwen geen eigen audio-element.
2. **De generator vindt de nieuwe zinnen zelf.** Elke game heeft een `model/audio.ts` op een vaste plek. De generator scant die bestanden; er is geen centrale lijst die iemand kan vergeten.
3. **CI weigert een game zonder audio.** Een nieuwe game moet een spraakcatalogus hebben of expliciet als visueel spel worden aangemerkt. Stilte is geen geldige standaard.

### 1. Erven via de shell

- `GameShell` bevat de `SpeechToggle` als de game spraak heeft, en stopt spraak bij unmount en routewissel.
- `SpokenText` toont tekst en een sprekerknop, en kan automatisch voorlezen.
- `SpokenChoice` wikkelt een antwoordoptie: de sprekerknop leest voor, maar selecteert niet.
- `useAutoSpeech(key, lines)` regelt automatisch voorlezen bij een nieuwe stap, inclusief de eerste-tik-regel en annuleren.
- Een nieuwe game hoeft alleen deze componenten te gebruiken; de globale speler, voorkeur en foutafhandeling zitten al in `shared`.

### 2. Conventie: één audiocatalogus per game

Elke game krijgt een puur databestand:

```ts
// libs/features/mijn-spel/model/audio.ts
import type { SpeechGroup } from "@shared/lib";

export const speechGroups = [
  {
    folder: "mijn-spel",
    lines: [
      { id: "mijn-spel-instructie", text: "Tik op de juiste kaart." },
      { id: "mijn-spel-goed", text: "Goed gedaan!" },
      { id: "mijn-spel-bijna", text: "Bijna! Probeer nog eens." },
    ],
  },
] satisfies readonly SpeechGroup[];
```

- Geen React, geen UI-imports: alleen data.
- ID's beginnen met de game-id, zodat ze uniek en herkenbaar zijn.
- De UI gebruikt `line.text`; er staat geen tweede kopie van de zin in de component.
- Algemene zinnen zoals “Goed gedaan!” en “Opnieuw” staan één keer in `shared/lib/speech-lines.ts`.
- Dynamische delen krijgen een kleine composer, bijvoorbeeld `numberSpeech(10)` of `wordSpeech("vijver")`.

### 3. Generator vindt de catalogi zelf

`scripts/generate-audio.ts`:

- loopt met Node’s `readdir` over `libs/**/model/audio.ts`;
- importeert elke `speechGroups` of `speechGroup`;
- controleert op dubbele id's;
- vergelijkt de teksthash met `scripts/audio.lock.json`;
- genereert met `--changed` alleen nieuwe of gewijzigde fragmenten;
- schrijft nooit een centrale lijst die handmatig bijgehouden moet worden.

Een nieuwe game toevoegen is dus: één `model/audio.ts` toevoegen en `pnpm audio:nl --changed` draaien. De generator pakt hem automatisch op.

### 4. CI als poort

Twee controles zorgen dat een game niet zonder audio de deur uit gaat:

- **`speech-coverage`-test:** elke `available` game in `gameCatalog` heeft een spraakverklaring: een groep, of expliciet `speech: "visual"` met een reden.
- **`audio:check`:** elke regel heeft een bestand, de teksthash klopt, het MP3-bestand is geldig en er zijn geen dubbele id's.

Beide draaien mee in `pnpm run quality`. Een pull request met een nieuwe game zonder audio of zonder expliciete visuele uitzondering faalt. Dat is de belangrijkste stap: schaalbaarheid is niet alleen een component, maar ook een poort.

### 5. Nieuwe game in vijf stappen

1. `pnpm new:game <naam>` (volgt) draait een lokale Nx-generator of scaffold en maakt pagina, feature, `model/audio.ts`, een `speech`-verklaring en een test.
2. De ontwikkelaar zet alle opdrachten, vragen en feedback in `speechGroups`.
3. De UI gebruikt `SpokenText`, `SpokenChoice` en `useAutoSpeech`; geen eigen `Audio`-element.
4. `pnpm audio:nl --changed` genereert de nieuwe fragmenten; de ontwikkelaar beluistert ze.
5. `pnpm run quality:full` en CI controleren de rest.

### 6. Bewust geen spraak

Niet elk spel hoeft gesproken uitleg. Een puur visueel spel mag daarom expliciet kiezen voor:

```ts
{
  id: "mijn-spel",
  status: "available",
  speech: { kind: "visual", reason: "Het spel is volledig visueel." },
}
```

De coverage-test accepteert alleen zo’n expliciete keuze. Zo blijft “geen audio” een bewuste beslissing en geen vergeetfout.

### 7. Wat niet automatisch kan

- De generator kan geen goede didactische zinnen bedenken; de ontwikkelaar schrijft de tekst één keer in de catalogus.
- Bijzondere uitspraken en namen kunnen een handmatige `audioText`-override nodig hebben.
- De luistertest op echte toestellen blijft menselijk werk.
- De eerste keer genereert de TTS-server de clips; daarna is alles lokaal en statisch.

## Architectuur

### Bestanden

```text
libs/shared/lib/
  speech.ts              speler, wachtrij, voorkeur, hook
  speech-lines.ts        korte, herbruikbare feedbackzinnen
  audio-src.ts           /audio/nl/<groep>/<id>.mp3

libs/shared/ui/
  speech-button.tsx      sprekerknop met toegankelijk label
  speech-toggle.tsx      voorleesstand aan/uit

# Catalogi per domein of feature
libs/entities/math/model/number-words.ts
libs/features/chess-tutorial/model/audio.ts
libs/features/chess-puzzles/model/audio.ts
libs/features/word-search/model/audio.ts
libs/features/math-trainer/model/audio.ts
libs/features/memory-game/model/audio.ts
libs/features/seek-and-find/model/audio.ts
libs/features/sudoku-game/model/audio.ts
libs/features/arrow-game/model/audio.ts

scripts/
  lib/tts.ts             TTS-request en MP3-validatie, gedeeld met Frans en Letterpret
  lib/audio-catalog.ts   SpeechLine, groepen, lock-bestand
  generate-audio.ts      catalogus -> apps/games/public/audio/nl
  generate-french-audio.ts  blijft, gebruikt lib/tts
  generate-sounds.ts     blijft voor Letterpret; migratie naar lib/tts volgt

apps/games/public/audio/nl/
  ui/                    algemene feedback
  math/                  getallen en bewerkingen
  words/                 woordzoeker
  chess/                 schaakles en puzzels
  flags/                 optioneel: land- en provincienamen
  seek/ memory/ sudoku/ arrows/

scripts/audio.lock.json  teksthashes voor --check
```

De generator importeert alleen modelbestanden, nooit UI-componenten. Daardoor kan hij in Node draaien zonder React of DOM.

### Contentcontract

```ts
export interface SpeechLine {
  /** Stabiel id; ook de bestandsnaam zonder .mp3. */
  readonly id: string;
  /** De tekst die het kind ziet. */
  readonly text: string;
  /** Wat TTS zegt als dat afwijkt van text, bijvoorbeeld bij namen. */
  readonly audioText?: string;
}

export interface SpeechGroup {
  /** Map onder apps/games/public/audio/nl. */
  readonly folder: string;
  readonly lines: readonly SpeechLine[];
}
```

Een feature exporteert één of meer groepen. De UI gebruikt `line.text`; de speler en generator gebruiken hetzelfde object. Voorbeeld:

```ts
export const CHESS_FEEDBACK = defineSpeechGroup({
  folder: "chess",
  lines: [
    { id: "coach-illegal", text: "Die mag niet. Kies een groene stip." },
    { id: "coach-blocked", text: "Nog niet! Kies eerst een blauwe stip." },
    { id: "coach-hint", text: "Kijk! Sleep naar de groene stip." },
  ],
});
```

### Hoe komen de uitlegzinnen erin?

Er zijn drie soorten spraak: **vaste zinnen**, **samengestelde zinnen** en **dynamische uitleg**. De eerste twee zijn eenvoudig; de derde vraagt een kleine wachtrij. In de tabel staan de concrete varianten.

| Soort                      | Voorbeeld                                      | Aanpak                                                                                                                     |
| -------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Vaste uitleg**           | “Zet de koning schaakmat.”                     | Eén `SpeechLine` per zin. De generator maakt één MP3; de UI toont dezelfde tekst en speelt die bij het openen van de stap. |
| **Vaste opdracht**         | “Je bent wit. Zet de zwarte koning schaakmat.” | Idem, per combinatie van puzzelsoort en kleur.                                                                             |
| **Samengestelde vraag**    | “Wat is 10 plus 5?”                            | Losse clips voor “wat is”, de getallen en de bewerking. De speler speelt ze na elkaar.                                     |
| **Samengestelde feedback** | “Het juiste antwoord is 15.”                   | Een vaste prefix plus de getalclip.                                                                                        |
| **Dynamische uitleg**      | “Tel verder vanaf 10.”                         | Nog niet voorlezen in de eerste versie; later opbouwen uit vaste fragmenten of overslaan.                                  |

#### Schaakles en schaakpuzzels

De schaakles heeft de tekst al als data: `instruction`, `preview`, `explanation`, `hint`, `nextStep` en `success`. De audiocatalogus maakt daar per level regels van:

```ts
{ id: "checkmate-instruction", text: "Sluit de koning in." }
{ id: "checkmate-explanation", text: "Schaakmat betekent: ..." }
{ id: "puzzle-mate-white", text: "Je bent wit. Zet de zwarte koning schaakmat." }
```

- Bij het openen van een level speelt automatisch de `instruction`.
- De coachbubbel krijgt een sprekerknop om dezelfde zin te herhalen.
- Na een zet speelt de korte feedback, bijvoorbeeld “Goed! Nog één zet naar de ster.”
- “Waarom?” speelt pas na een tik de uitleg en de tip. Zo wordt de les niet meteen een gesproken lap tekst.
- Schaakpuzzels hebben drie soorten en twee kleuren; dat zijn zes vaste promptzinnen plus vaste statuszinnen.

#### Rekenen

Een som als “Wat is 10 plus 5?” wordt niet als complete zin gegenereerd. Dat zou honderden tot duizenden audiobestanden kosten. In plaats daarvan maken we:

- getalclips voor **0–100**;
- clips voor **plus**, **min**, **keer** en **gedeeld door**;
- een clip voor **“Wat is”**;
- een clip voor **“Het juiste antwoord is”**.

De speler speelt bijvoorbeeld:

```text
[wat-is] [tien] [plus] [vijf]
```

Met een korte pauze tussen de fragmenten klinkt dat als “Wat is tien plus vijf?”. Dezelfde getalclips hergebruiken we voor de antwoorden en voor feedback als “Het juiste antwoord is vijftien.”

De lange uitleg van `explanationFor` (“Tel verder vanaf 10”) laten we in de eerste versie nog weg. Die is dynamischer en zou de wachtrij en het aantal clips onnodig ingewikkeld maken. De som, de antwoordopties en de korte feedback zijn het minimum om te kunnen spelen.

#### Woordzoeker, zoeken, memory, sudoku en pijlen

Deze games hebben vooral korte, vaste opdrachten en feedback. Die gaan allemaal als één `SpeechLine` de catalogus in. Woorden in de woordzoeker krijgen daarnaast een eigen woordclip, zodat een kind het woord kan horen voordat het gaat zoeken.

### Speler

`libs/shared/lib/speech.ts` krijgt een kleine interface:

```ts
speak(line | readonly line[]): Promise<void>;
stopSpeech(): void;
useAutoSpeech(key, lines): void;
useSpeechEnabled(): boolean;
```

- Eén `HTMLAudioElement` voor de hele app.
- Een wachtrij voor samengestelde vragen, bijvoorbeeld rekenen.
- `speak` annuleert de vorige wachtrij en speelt de nieuwe reeks.
- De promise resolvet als de reeks klaar is, of direct als voorlezen uit staat. Daarmee kan een game eerst de feedback spreken en daarna een geluidseffect of cry starten.
- `play()`-fouten worden stil genegeerd; een spel werkt altijd door.
- Stop bij unmount, routewissel en wanneer het tabblad verborgen wordt.
- `preload="none"`; fragmenten worden pas opgehaald als ze nodig zijn.

### Voorkeur

Voorlezen krijgt een eigen sleutel, bijvoorbeeld `games.speech.v1`, naast `games.sound.v1`.

- Aanbeveling: een aparte `SpeechToggle` naast de bestaande `SoundToggle`.
- Een ouder kan zo de piepjes uitzetten en het voorlezen aan laten, of andersom.
- De voorkeur staat standaard aan, met een zichtbare knop om hem uit te zetten.
- De toggle is minimaal 44 × 44 px en heeft een expliciet label: “Voorlezen uitzetten” / “Voorlezen aanzetten”.

Als de eigenaar één gecombineerde knop prettiger vindt, kan dat later; de speler houdt de twee voorkeuren dan alsnog intern gescheiden.

## Interactiepatronen

Er zijn drie patronen. Niet meer, anders wordt de UI onvoorspelbaar.

### 1. Gesproken opdracht of vraag

- Spreekt automatisch wanneer een nieuwe vraag, een nieuw level of een nieuwe puzzel actief wordt.
- Alleen na de eerste tik van het kind (startknop, levelknop of spelkeuze).
- Heeft altijd een sprekerknop om te herhalen.
- Voorbeelden: “Tik op de Wobbel met de ster.”, “Rijd met de toren naar de ster.”, “Drie plus vier. Hoeveel is dat?”

### 2. Gesproken antwoordoptie

- Elke optie heeft een kleine sprekerknop die alleen de naam of het woord voorleest.
- De knop selecteert de optie niet; dat voorkomt dat een kind per ongeluk antwoordt.
- De knop heeft een label als “Beluister Pikachu” en een touch-target van minimaal 44 px.
- Voorbeelden: woorden in de woordzoeker, dierennamen in sudoku en land- of provincienamen in Vlaggenreis.

### 3. Gesproken feedback

- Spreekt bij een goed of fout antwoord, een hint, een gevonden woord of een opgelost level.
- Kort: “Goed gedaan!”, “Bijna!”, “Gevonden!”, “Nog één vakje!”
- Na een fout antwoord nooit alleen “Fout”; noem het juiste antwoord of de volgende stap.
- Spraak en een geluidseffect of cry na elkaar, niet tegelijk.

## Fasering

### Fase 0 — stem bevestigen en besluit vastleggen

- [x] Bevestig **Nathalie** (`speaches-ai/piper-nl_BE-nathalie-medium`, CC0) als vaste stem. Die stem is al in gebruik voor Letterpret; zie [ADR 0017](../adr/0017-letterklanken-en-audio.md).
- [ ] Doe een steekproef met langere zinnen, getallen 0–100, `ij`/`ui`/`eu`, leenwoorden en lange woorden op telefoon en tablet.
- [x] Alleen als Nathalie duidelijk tegenvalt: luistertest met `nl_NL-pim-medium` en `nl_NL-ronnie-medium`. (Nog niet nodig gebleken.)
- [x] Kies één snelheid: 0,95.
- [x] Leg de cross-game keuze vast in **ADR 0023**: vooraf gegenereerde TTS, Nathalie/CC0, geen runtime-TTS, aparte voorleesstand.
- [x] Voeg de stem en licentie toe aan de credits in `README.md` of de audiodocumentatie.
- [x] Geen testbestanden committen.

**Klaar als:** de Nederlandse stem, snelheid, licentie en het voorleesgedrag zijn vastgelegd en door de eigenaar goedgekeurd. De technische set staat; de luistertest op echte toestellen is nog open.

### Fase 1 — gedeelde basis

- [x] `SpeechLine`, `SpeechGroup` en `audioSrc` toevoegen.
- [x] `speech.ts` bouwen met één audio-element, wachtrij, stop en voorkeur.
- [x] `SpokenText` en `useAutoSpeech` toevoegen. `SpokenChoice` volgt zodra een game hem nodig heeft.
- [x] `SpeechButton` en `SpeechToggle` toevoegen aan `@shared/ui`; `GameShell` stopt spraak bij unmount en routewissel.
- [x] `SpeechToggle` integreren in `GameShell`. De losse pijlen-schermen volgen bij de audio voor pijlen.
- [x] `GameCatalogEntry` uitbreiden met een spraakverklaring: een groep, `visual`, `pending` of `legacy`.
- [x] `speech-coverage`-test toevoegen die elke `available` game controleert.
- [x] `scripts/lib/tts.ts` uit `generate-french-audio.ts` halen; het Franse script gebruikt nu dezelfde client. `generate-sounds.ts` volgt later.
- [x] `scripts/generate-audio.ts` bouwen met `--check`, `--only`, `--group`, `--force` en `--dry-run`; standaard worden alleen nieuwe of gewijzigde fragmenten gegenereerd.
- [x] `scripts/audio.lock.json` met teksthashes toevoegen; `--check` faalt bij ontbrekende of verouderde audio.
- [x] `package.json` uitbreiden met `audio:nl` en `audio:check`.
- [ ] Een lokale scaffold `pnpm new:game` toevoegen die `model/audio.ts` en de spraakverklaring meteen meeneemt.
- [x] Tests voor de speler, de wachtrij, de toggle, de coverage en het lock-bestand.
- [ ] Bestaande `useFrenchAudio` en `LetterAudio` laten aansluiten op de gedeelde speler, of bewust laten staan met een notitie.

**Klaar als:** een testpagina of pilot één regel lokaal kan afspelen, herhalen, stoppen en dempen, `audio:check` zonder TTS-server werkt en een nieuwe game zonder audio of expliciete visuele keuze door de coverage-test wordt tegengehouden.

### Fase 2 — pilot Schaakles

Schaakles is de beste pilot: de tekst is volledig vast, de leesafhankelijkheid is hoog en de game heeft al een duidelijke coachbubbel.

- [x] `features/chess-tutorial/model/audio.ts` met per level: instructie, preview, uitleg, hint, volgende stap en succes.
- [x] Algemene coachregels toevoegen: illegaal, geblokkeerd, hint, goede zet en stuck.
- [x] `CoachBubble` voorzien van een sprekerknop en automatisch voorlezen bij een nieuwe coachtekst.
- [x] `WhyCard` voorzien van sprekerknoppen voor de uitleg en de tip.
- [x] Levelwissel stopt de oude spraak en spreekt de nieuwe instructie.
- [x] Ongeveer 60 fragmenten genereren.
- [x] Test: instructie bij start, feedback na een zet, hint, “Waarom?”, dempen en herhalen.
- [ ] Laat een kind dat nog niet leest de eerste twee levels spelen en noteer waar het vastloopt.

**Klaar als:** een kind de eerste twee schaaklessen kan starten en begrijpen met alleen de gesproken coach en de visuele hint. De code en audio staan; de kindtest op een echt toestel is nog open.

### Fase 3 — uitleg, opdrachten en vragen

Deze fase draait om de zinnen die een kind nodig heeft om te weten wat het moet doen. **Pokémon-quiz en Pokémon-namen blijven voorlopig buiten scope.**

#### Schaakpuzzels

- [x] `features/chess-puzzles/model/audio.ts` met de drie doelen en twee kleuren: zes vaste promptzinnen plus statuszinnen.
- [x] `PuzzleHeader` en `PuzzleStatusBanner` voorzien van een sprekerknop.
- [x] De prompt automatisch voorlezen bij een nieuwe puzzel.
- [x] Na een zet de korte feedback spreken, bijvoorbeeld “Die zet is niet de beste. Probeer nog eens.”
- [x] Test: “Je bent wit. Zet de zwarte koning schaakmat.” is hoorbaar en herhaalbaar.

#### Rekenen

- [x] `libs/entities/math/model/number-words.ts` met een getest `dutchNumberWord(0..100)`.
- [x] Tests voor 0, 1, 8, 11, 12, 20, 21, 22, 30, 40, 50, 60, 70, 80, 90, 99 en 100.
- [x] Audiofragmenten voor getallen 0–100, “wat is”, “plus”, “min”, “keer”, “gedeeld door” en “het juiste antwoord is”.
- [x] `libs/entities/math/model/audio.ts` en `features/math-trainer/model/use-math-speech.ts` die per som een reeks clips samenstellen.
- [x] Voorbeeld `10 + 5`: `[wat-is] [tien] [plus] [vijf]`.
- [x] De som automatisch voorlezen bij een nieuwe vraag; sprekerknop bij de som om te herhalen.
- [x] Feedback spreken: “Goed gerekend!” of “Het juiste antwoord is” + de getalclip.
- [x] De lange uitleg (`explanationFor`, bijvoorbeeld “Tel verder vanaf 10”) nog niet voorlezen; die is dynamischer en volgt later.
- [x] Test: een kind hoort de som, kiest een antwoord en hoort of het goed is.

#### Woordzoeker

- [x] `features/word-search/model/audio.ts` met de 31 unieke woorden uit de Nederlandse thema’s en de statuszinnen.
- [x] Een woordchip leest het woord voor via een aparte sprekerknop; de bestaande hintknop blijft de hint voor het volgende woord geven.
- [x] Na een gevonden woord: woord + “gevonden” spreken.
- [x] Bij “alle woorden gevonden”: korte viering.
- [x] Het Pokémon-thema van de woordzoeker krijgt voorlopig geen eigen naamclips.
- [x] Test: een kind kan een woord kiezen, hoort het en zoekt het in het bord.

**Klaar:** een kind de schaakpuzzel-opdracht, de rekensom en de woordzoeker-opdracht kan horen en herhalen, `audio:check` groen is en de drie games samen minstens 160 nieuwe fragmenten hebben.

### Fase 4 — overige games

- [ ] **Vlaggenreis:** vraag, land- of provincienaam en feedback voorlezen; naamopties krijgen een sprekerknop. Dit is optioneel en kan het audiobudget met 2–3 MB verhogen.
- [ ] **Memory:** alleen de instructie en “gevonden” bij een match voorlezen; geen Pokémon-namen.
- [ ] **Waar is Wobbel?:** instructie, hint, “nog niet” en “gevonden”.
- [ ] **Sudoku:** status, “nog één vakje”, “opgelost” en eventueel de dierennamen bij selectie.
- [ ] **Pijlen:** intro-instructie, geblokkeerde pijl, hint en levelopgelost.
- [ ] **Letterpret:** bestaande Nathalie-klanken en -woorden niet opnieuw genereren; `LetterAudio` wel op de gedeelde speler zetten.
- [ ] Hergebruik waar mogelijk de algemene feedback.
- [ ] Per game een korte luistertest en een test met de muis/touch.

### Fase 5 — hoofdmenu en afwerking

- [ ] Spelkaarten in het hoofdmenu voorleesbaar maken zonder een knop in een link te nesten.
- [ ] Een sprekerknop per kaart, of één “Lees het menu voor”-knop.
- [ ] Franse audio volledig op de gedeelde speler zetten als dat in fase 1 niet is gebeurd.
- [ ] Cache- en laadtijdgedrag controleren; geen audio in de JS-bundel.
- [ ] Documentatie bijwerken: `docs/README.md`, ADR, credits.
- [ ] Laatste controle op mobiel (390 px), tablet (1024 px), iOS Safari en Android Chrome.
- [ ] `quality:full` en `e2e` draaien.

## Testen en kwaliteit

### Geautomatiseerd

- **Unit:** speler speelt één clip, wachtrij speelt clips na elkaar, `stop` breekt af, uitgeschakelde stand doet niets, `play()`-fout breekt niet.
- **Unit:** `dutchNumberWord` voor de lastige getallen.
- **Unit:** catalogi hebben unieke id's, niet-lege tekst en geldige `audioText`.
- **Unit:** `speech-coverage` ziet dat elke `available` game een spraakverklaring heeft, en accepteert alleen een expliciete `visual`-opt-out.
- **Unit:** `audio:check` ziet ontbrekende bestanden, lege bestanden, verkeerde MP3-headers en een verouderde teksthash.
- **UI:** `SpeechButton` speelt de juiste clip en heeft een toegankelijk label.
- **UI:** een sprekerknop in een woordchip of naamoptie selecteert de optie niet.
- **UI:** een nieuwe rekenvraag start de juiste reeks; dempen voorkomt spraak.
- **E2E:** na start bestaat een `audio`-element met de verwachte lokale `src`; echte geluidsweergave is niet nodig.
- **CI:** `pnpm run audio:check` en de bestaande kwaliteitsgate. CI genereert nooit audio.

### Handmatig

- [ ] Telefoon (390 px) en tablet (1024 px).
- [ ] iOS Safari en Android Chrome.
- [ ] Geluid aan/uit, voorlezen aan/uit, stille schakelaar.
- [ ] Snel meerdere keren tikken; oude spraak stopt.
- [ ] Navigeren tijdens spraak; spraak stopt.
- [ ] Fout antwoord, goed antwoord, hint en levelovergang.
- [ ] VoiceOver en TalkBack: geen dubbele of overlappende aankondigingen.
- [ ] DevTools: geen requests naar externe hosts; alleen `/audio/nl/...`.
- [ ] Audiobestanden controleren op grootte en verstaanbaarheid.

## Definition of done

- Een kind dat nog niet leest kan met voorlezen aan de eerste ronde van Schaakles, Schaakpuzzels, Woordzoeker en Rekenen starten en spelen zonder dat een volwassene de tekst voorleest.
- Elk kritiek element heeft een lokaal audiobestand en een herhaalknop.
- `pnpm run audio:check` is groen; ontbrekende of verouderde audio faalt in CI.
- Voorlezen en geluidseffecten zijn apart te bedienen en de voorkeur blijft bewaard.
- Een nieuwe game kan niet zonder spraakverklaring worden toegevoegd: de coverage-test en `audio:check` bewaken dit.
- Een nieuwe game erft de speler, toggle en `SpokenText`/`SpokenChoice` via de gedeelde shell en hoeft geen eigen audio-element te bouwen.
- Er is geen autoplay vóór de eerste tik; spraak stopt bij navigatie en een verborgen tab.
- Een mislukte `play()` of een ontbrekend bestand breekt nooit een spel.
- Alle gesproken tekst blijft zichtbaar; er is niets dat alleen via audio beschikbaar is.
- De CSP en de regel “geen externe requests” zijn ongewijzigd.
- Stem, licentie en architectuur staan in een ADR en in de credits.
- `pnpm run quality:full` en `pnpm run e2e` zijn groen.

## Risico's

| Risico                                | Mitigatie                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Verkeerde uitspraak                   | Luistertest per groep, `audioText`-overrides, bijzondere uitspraken controleren                                          |
| Automatische spraak wordt geblokkeerd | Eerste spraak na een tik, één gedeeld audio-element, fouten stil negeren                                                 |
| Audio en geluidseffect overlappen     | Spraak en effect/cry na elkaar; `speak` geeft een promise terug                                                          |
| Schermlezer dubbelt                   | Aparte voorleesstand, testen met VoiceOver/TalkBack, tekst blijft de bron                                                |
| Audio veroudert                       | Lock-bestand met teksthashes; `audio:check` faalt bij wijziging                                                          |
| Te veel tekst wordt voorgelezen       | Ontwerpprincipe “spreek wat blokkeert”; één nieuwe spraak per spelstap                                                   |
| Audiobestanden maken de repo zwaar    | Alleen kritieke fragmenten, mono MP3, ongeveer 6 MB voor P1/P2 en maximaal 8 MB met Vlaggenreis, audio niet in de bundel |
| Nieuwe complexiteit in elke feature   | Eén gedeelde speler en één cataloguspatroon; geen game-specifieke audio-implementaties                                   |

## Productiechecklist

**Blokkerend**

- [ ] Luistertest op een echte telefoon en tablet: alle 170 clips, met extra aandacht voor de getallen, de samengestelde rekenvraag en de schaakcoördinaten (`e1`, `g1`).
- [ ] VoiceOver/TalkBack, dempen, autoplay, snel tikken en navigeren tijdens spraak controleren.
- [x] Een e2e-audiosmoke toevoegen: na de start van Schaakles of Rekenen wordt een lokaal `/audio/nl/...`-bestand opgevraagd en de toggle stopt de weergave.
- [x] Bepalen of de release “Schaakles + Rekenen” is of dat Schaakpuzzels en Woordzoeker eerst af moeten zijn. **P1 is nu compleet.**
- [x] De voorleesknop verbergen of uitleggen in games zonder spraak (`visual`, `pending`, `legacy`).
- [x] Cachebeleid vastleggen: audio cachet één dag (`max-age=86400`). Bij een nieuwe stem is een oude clip daardoor maximaal één dag zichtbaar; voor een volgende stem kunnen we de paden versieren.
- [ ] Branch, pull request, groene CI en expliciete toestemming van de eigenaar (“merge mag”).
- [ ] Na de deploy de productie-URL op telefoon en tablet controleren.

**Belangrijk, maar niet blokkerend**

- [x] Schaakpuzzels en Woordzoeker voorzien van audio.
- [ ] `pnpm new:game` toevoegen dat `model/audio.ts` en de spraakverklaring meeneemt.
- [ ] `audio:check` expliciet in de quality-opdracht zetten; nu draait dezelfde controle via `tests/node/speech-audio.test.ts`.
- [ ] `useFrenchAudio` en `LetterAudio` op de gedeelde speler zetten.

**Kan later**

- [ ] Audio voor memory, zoeken, sudoku, pijlen, Vlaggenreis en het hoofdmenu.
- [ ] Een langzame voorleesstand.
- [ ] Meer stemmen of een stemkeuze voor ouders.

## Open beslissingen

1. **Stem:** Nathalie (`nl_BE-nathalie-medium`, CC0) hergebruiken, net als Letterpret? Aanbeveling: ja; alleen bij duidelijke problemen vallen we terug op Pim of Ronnie.
2. **Toggle:** aparte voorleesknop of één gecombineerde geluidsknop? Aanbeveling: apart.
3. **Standaard:** voorlezen standaard aan of uit? Aanbeveling: aan, met een duidelijk zichtbare knop.
4. **Volgorde:** eerst Schaakles als pilot, daarna Schaakpuzzels, Rekenen en Woordzoeker. Akkoord?
5. **Uitleg:** alleen de korte opdracht automatisch, en de lange “Waarom?”-uitleg pas na een tik? Aanbeveling: ja.
6. **Hoofdmenu:** nu meenemen of in fase 5 laten? Aanbeveling: fase 5.
7. **Budget:** ongeveer 6 MB voor de eerste fasen en maximaal 8 MB als Vlaggenreis meedoet? Akkoord?
8. **Langzaam:** een aparte “Langzaam”-stand zoals bij Frans, of één snelheid? Aanbeveling: één snelheid in de eerste versie.
