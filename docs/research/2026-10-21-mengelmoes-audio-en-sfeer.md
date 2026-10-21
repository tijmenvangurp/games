# Mengelmoes: audio, sfeer en visuele polish

- **Datum:** 2026-10-21
- **Status:** Onderzoek en eerste implementatie. `canvas-confetti` en `motion` zijn toegevoegd; de `wrong`-klank is verwijderd.
- **Aanleiding:** een lijst met externe audio- en assetbronnen (Kenney, Freesound, Pixabay, Zapsplat, Poly Haven/ambientCG, itch.io, OpenGameArt, game-icons.net) en drie polish-ideeën: omgevingsgeluid, deeltjes en oppak-physics. De vraag is wat daarvan past bij de Spellen-app, met **Mengelmoes** als MVP.
- **Kader:** [AGENTS.md](../../AGENTS.md), [ADR 0001](../adr/0001-publieke-statische-spellen-app.md), [ADR 0005](../adr/0005-pokemon-assets.md), de [CSP in `_headers`](../../apps/games/public/_headers), [het design systeem](../design-system.md), [`libs/shared/lib/sound.ts`](../../libs/shared/lib/sound.ts) en het eerdere [Mengelmoes-assetonderzoek](2026-10-19-mengelmoes-assets.md).

## Samenvatting

1. **Dit is vooral een inkooplijst, geen gap-analyse.** Mengelmoes heeft voor de MVP geen externe audio of texturen nodig. De app heeft al een CSP-veilige synthesizer, een globale geluidstoggle, haptiek, confetti en een sparkle-icoon.
2. **De stilte bij een fout is beleid, geen gap.** [ADR 0026](../adr/0026-adaptief-niveaumodel.md) zegt: fouten zijn informatie, geen straf. Geen foutgeluid dus. De winst zit in **vieringen**: de eigenaar keurt `canvas-confetti` goed, en die vervangt nu de handgeschreven CSS-burst in alle spellen.
3. **Oppak-physics bestaat al.** De `DragOverlay` schaalt naar 105% en kantelt 3 graden ([`alchemy-play.tsx`](../../libs/features/alchemy-lab/ui/alchemy-play.tsx)). De voorgestelde 5% en 2–5 graden zijn dus al gehaald.
4. **Vieren kan nu rijker.** `Confetti` gebruikt `canvas-confetti`, laadt de bibliotheek pas bij een viering en respecteert reduced motion. Het is gedeeld door Mengelmoes, de afsluitdialoog en sudoku; de oude CSS-burst is verwijderd. `Sparkles` blijft een icoon, geen deeltjessysteem. Daarnaast gebruiken de dialogen en de feedbackregel nu **Motion** (`motion.dev`) met `LazyMotion` + `m`, zodat de handgeschreven `animate-pop` daar weg is.
5. **Voor audio is alleen CC0 probleemloos, en Kenney is de eenvoudigste bron.** Pixabay en Zapsplat verbieden herdistributie van losse bestanden; een publieke git-repo met de ruwe mp3's is precies dat. CC-BY-bronnen mogen wel, maar vragen attributie en administratie.
6. **Fotorealistische texturen en een donkere vignette passen niet.** Het design systeem kiest ivory, rust en geen achtergronddecoratie. Een 1K-fototextuur is bovendien enkele MB's; de bestaande CSS-stippen op de werkbank kosten niets.
7. **Advies:** geen externe audio of texturen voor de MVP. Wel rijkere vieringen via `canvas-confetti`, geen foutgeluid, en ambience, fototexturen en nieuwe icoonfamilies buiten de eerste versie.

## 1. Wat Mengelmoes nu al doet

| Actie                 | Bestaand gedrag                                                                                                      | Bron                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Element oppakken      | `tap`-toon, haptiek, overlay op 105% met 3° kanteling en sterke schaduw                                              | `alchemy-play.tsx`, `use-alchemy-store.ts`                    |
| Op de werkbank leggen | `select`-toon en haptiek                                                                                             | `addToBoard()`                                                |
| Nieuwe combinatie     | `win`-toon, haptiek, confetti (28 stukken), sparkle-icoon en de ontdekkingskaart                                     | `finishCombination()`, `discovery-dialog.tsx`, `confetti.tsx` |
| Bestaande combinatie  | `match`-toon en haptiek                                                                                              | `finishCombination()`                                         |
| Mislukte combinatie   | **Stil**, in lijn met ADR 0026: geen foutgeluid. Alleen de neutrale tekst "Hm, dat mengt niet. Probeer iets anders." | `rejectCombination()`                                         |
| Hint                  | `hint`-toon en haptiek                                                                                               | `showHint()`                                                  |
| Werkbank opruimen     | `tap`-toon                                                                                                           | `clearBoard()`                                                |
| Alles ontdekt         | Melding "Je hebt alle elementen ontdekt." zonder eigen geluid                                                        | `showHint()` → `feedback: "all-found"`                        |

De geluiden komen uit zes patronen in [`sound.ts`](../../libs/shared/lib/sound.ts): `tap`, `select`, `match`, `hint`, `almost` en `win`. Ze worden met de Web Audio API gesynthetiseerd, dus er is geen bestand, geen fetch en geen CSP-uitzondering nodig. `media-src 'self'` staat lokale audiobestanden wel toe, maar de synthesizer heeft ze niet nodig.

De `wrong`-klank en de bijbehorende haptiek zijn uit de gedeelde modules verwijderd: [ADR 0026](../adr/0026-adaptief-niveaumodel.md) verbiedt een foutgeluid, en geen enkel spel gebruikte ze nog.

## 2. Audio-bronnen

### 2.1 Kenney

| Pack             | Omvang | Licentie | Wat het is                                        |
| ---------------- | ------ | -------- | ------------------------------------------------- |
| Interface Sounds | 100    | CC0      | UI-clicks, pops en bevestigingen (2020)           |
| UI Audio         | 50     | CC0      | Knoppen, switches en clicks (2012)                |
| RPG Audio        | 50     | CC0      | Foley: voetstappen, wapens, algemene RPG-geluiden |

Kenney zegt zelf: alle assets zijn public domain (CC0), commercieel gebruik mag, attributie is niet verplicht, en de bestanden mogen worden herverdeeld. De Interface Sounds-zip is ±0,8 MB, de RPG Audio-zip ±1,0 MB.

**Beoordeling:** technisch de beste externe bron. Geen attributie, geen share-alike, geen juridische administratie. Maar de packs zijn niet speciaal magisch: RPG Audio is vooral foley en geen pakket met toverchimes. Wil je één echt materiaalgeluid dat synthese niet overtuigend nabootst (glas, kurk, hout), dan is Kenney de eerste keuze. Neem dan 2–4 bestanden, niet het hele pack.

### 2.2 Freesound

Freesound gebruikt drie Creative Commons-licenties en heeft daarnaast de oude Sampling+-licentie:

- **CC0** — vrijwel alles mag, ook herverdelen; geen attributie.
- **CC-BY** — attributie per geluid verplicht.
- **CC-BY-NC** — attributie én geen commercieel gebruik.
- **Sampling+** — oude, extra beperkende licentie; vermijden.

De CC0-filter is bruikbaar, maar geen kwaliteits- of rechtenkeuring: gebruikers uploaden zelf en Freesound garandeert niet dat elk bestand echt vrij is. Elk bestand moet dus apart worden beluisterd, gecontroleerd en gedocumenteerd. De stijl en opnamekwaliteit lopen sterk uiteen.

**Beoordeling:** niet voor de MVP. Als er later een specifiek natuurlijk geluid nodig is, alleen CC0 nemen, één bestand tegelijk, met de bron-URL en licentiedatum in `LICENSES/`.

### 2.3 Pixabay

De Pixabay Content License staat gratis gebruik en aanpassing toe, zonder attributie. Maar dezelfde licentie verbiedt:

> "You cannot sell or distribute Content (either in digital or physical form) on a Standalone basis. Standalone means where no creative effort has been applied to the Content and it remains in substantially the same form as it exists on our website."

Een publieke repository met de ruwe mp3's is precies die standalone-verspreiding: iedereen kan het bestand rechtstreeks downloaden. Dat de app het geluid daarna in een spel gebruikt, verandert niets aan de bestanden in de repo.

**Beoordeling:** niet gebruiken zolang de repo openbaar is.

### 2.4 Zapsplat

De gratis Standard License vereist attributie ("ZapSplat" in de credits) en verbiedt herdistributie expliciet:

> "You may not, under any circumstances: [...] Redistribute our sounds in any form (e.g., sound libraries, file sharing, apps, social networks, or physical media [...])."

Ook mogen de geluiden niet de primaire waarde van een product vormen (zoals een soundboard of geluidjes-app). Een publieke repo met de losse bestanden is opnieuw het probleem.

**Beoordeling:** niet bruikbaar voor deze repo, ook niet met attributie.

### 2.5 OpenGameArt en itch.io (audio)

Beide platforms geven **per bestand of per pack** een licentie. OpenGameArt staat CC0, CC-BY, CC-BY-SA, GPL en enkele andere licenties toe; itch.io heeft geen eigen standaardlicentie en elke maker kiest zijn eigen voorwaarden. Soms is een pack gratis maar niet vrij te herverdelen, of juist CC-BY-SA.

**Beoordeling:** geen bron voor de MVP. De licentiecontrole per bestand kost meer tijd dan drie zelfgesynthetiseerde geluiden.

## 3. Visuele bronnen

### 3.1 Poly Haven en ambientCG

Beide zijn CC0 en mogen worden herverdeeld, ook in een publieke repo. Poly Haven zegt dat expliciet; ambientCG ook. Dat is dus geen juridisch probleem.

Het probleem is de combinatie van **omvang en stijl**:

- Eén 1K-JPG-materiaal is al snel enkele MB's. Het eerste voorbeeld dat ik bij ambientCG opende, was een download van ±7 MB voor alleen de 1K-JPG-variant.
- Het design systeem kiest "ivoor papier, inkt en één accentkleur", "geen gradients of losse achtergronddecoratie" en "beweging is feedback, geen constante animaties".
- Een fotorealistische houten tafel met een donkere radiale vignette trekt de aandacht naar de achtergrond en maakt tekstcontrast onvoorspelbaar. Mengelmoes gebruikt nu een lichte werkbank met CSS-stippen en gekleurde elementmunten; dat is consistent en goedkoop.

**Beoordeling:** niet voor de MVP. Wil je toch wat textuur, genereer dan een kleine naadloze ruistegel (SVG of data-URI, < 2 KB) en houd de opacity laag. Dat is geen fotografie en geen licentie.

### 3.2 itch.io en OpenGameArt (achtergronden)

Complete lab- of tovenaarsachtergronden zijn verleidelijk, maar ze brengen een eigen art direction mee. Daarmee vervang je de bestaande rustige stijl, en je moet per pack de licentie, attributie en share-alike controleren. Voor een MVP die al een werkende visuele taal heeft, is dat een stap terug.

**Beoordeling:** niet doen.

### 3.3 game-icons.net

CC-BY 3.0, attributie verplicht, en de iconen zijn monochroom. De app gebruikt al twee families: Fluent Emoji Flat voor de elementen en Phosphor voor UI-iconen. Een derde familie maakt de set minder samenhangend en levert alleen winst voor abstracte begrippen die Fluent Emoji niet dekt.

**Beoordeling:** niet voor de MVP. Als er echt een gat is, teken dan één eigen SVG in dezelfde platte stijl, zoals het eerdere assetonderzoek al voorstelde.

## 4. De drie polish-ideeën

### 4.1 Omgevingsgeluid (ambience)

Een loop van een haardvuur of pruttelende ketel vult stiltes, maar heeft nadelen:

- **Autoplay.** De Web Audio API mag pas na een gebruikersactie starten. De app doet dat al netjes per geluid; een loop zou na de eerste tik kunnen starten, maar dan verrast hij alsnog.
- **Kosten.** Een loop van 30–60 seconden is honderden KB's tot MB's, speelt continu en kost op een tablet batterij.
- **Rust.** Het design systeem wil rust en geen constante beweging. Constant geluid is de auditieve versie daarvan.
- **Controle.** De bestaande `SoundToggle` is globaal. Een ambience zou een aparte "sfeer"-schakelaar moeten krijgen, standaard uit.

**Advies:** niet in de MVP. Als het later komt, procedureel (gefilterde ruis met zachte, willekeurige crackles), standaard uit, fade-in na de eerste tik en pauzeren bij `visibilitychange`. Geen audiobestand.

### 4.2 Deeltjes

`Confetti` gebruikt nu `canvas-confetti` op een eigen canvas, laadt de bibliotheek pas bij een viering en slaat bij `prefers-reduced-motion` het tekenen helemaal over. De ontdekkingskaart gebruikt daarnaast het `Sparkles`-icoon.

Een extra "merge-spat" op het punt waar twee elementen samensmelten is nu de enige zinvolle extra deeltjestoevoeging. Die is klein (8–12 stipjes, 300–450 ms) en kan met dezelfde canvas-aanpak. Let op: `AlchemyFeedback` bevat nu geen positie. Het combineerpunt wordt in `finishCombination()` wel berekend, dus de feedback kan worden uitgebreid met `x`/`y` zonder de spellogica te veranderen.

**Advies:** pas doen als playtesting laat zien dat de samensmelting te weinig impact heeft. Geen `tsParticles`, geen Framer Motion: dat is een nieuwe dependency en meer API dan het effect rechtvaardigt.

### 4.3 Oppak-physics

De suggestie (5% groter, 2–5 graden kantelen) is al geïmplementeerd:

```tsx
<div className="rotate-3 scale-105 drop-shadow-2xl">
  <ElementToken element={activeElement} variant="overlay" />
</div>
```

**Advies:** niets doen. Een extra sprong naar 108% of 4 graden is nauwelijks zichtbaar en maakt de sleepbeweging onrustiger.

## 5. Beslissingen en MVP-slice

### 5.1 Geen foutgeluid

De eigenaar wil geen `wrong`-klank, en dat is precies wat [ADR 0026](../adr/0026-adaptief-niveaumodel.md) voorschrijft: **"Fouten zijn informatie, geen straf."** Geen foutgeluid, geen levens, geen scoreverlies en neutrale copy. De stilte bij een mislukte combinatie is dus geen gap maar beleid.

De `wrong`-klank en de bijbehorende haptiek zijn verwijderd. Ze hoorden niet bij de MVP en druisten tegen ADR 0026 in. De neutrale tekst "Hm, dat mengt niet. Probeer iets anders." blijft de feedback.

### 5.2 Wel: rijkere vieringen met `canvas-confetti`

De eigenaar keurt een confettidependency goed om vieringen in meerdere spellen sterker te maken. `canvas-confetti` 1.9.4 (ISC) vervangt de handgeschreven CSS-burst:

- **Lui geladen.** De component importeert de bibliotheek pas als er echt gevierd wordt, dus het startscherm blijft klein.
- **Lokaal en CSP-veilig.** De bibliotheek tekent op een eigen canvas; er is geen afbeelding, fetch of worker nodig. `useWorker: false` voorkomt een blob-worker en houdt de CSP ongewijzigd.
- **Toegankelijk.** Bij `prefers-reduced-motion` wordt er niets getekend; daarnaast staat `disableForReducedMotion` aan en is het canvas `aria-hidden`.
- **Meer vormen.** Dezelfde component ondersteunt een enkele burst en een bredere `shower` met twee zijwaartse bursts. De ontdekkingskaart en de afsluitdialoog gebruiken de `shower`; sudoku houdt de rustige burst.
- **Minder eigen code.** De oude `@keyframes confetti-burst` en `.confetti-piece` zijn verwijderd.

De `Confetti`-API blijft `pieces` en `data-confetti`, zodat bestaande tests en schermen blijven werken.

### 5.3 Motion voor dialogen en feedback

De eigenaar wil minder zelfgeschreven animaties. Daarom is **`motion` 14.4.0** (motion.dev, MIT) toegevoegd. De integratie blijft bewust klein:

- `MotionProvider` in `libs/shared/ui` wrapped de app met `LazyMotion features={domAnimation}` en `MotionConfig reducedMotion="user"`.
- Componenten gebruiken de lichte `m`-primitive, niet de volledige `motion`-component. Zo blijft de feature-bundel beperkt.
- Motion doet nu de entree van de ontdekkingskaart, het labboek en de afsluitdialoog, plus het in- en uitfaden van de feedbackregel via `AnimatePresence`.
- De handgeschreven `animate-pop`-klasse is op die panelen verdwenen. Voor de overige spellen blijft de CSS-klasse voorlopig staan; die kan later stap voor stap worden vervangen.
- Slepen blijft bij dnd-kit. Motion en dnd-kit tegelijk op hetzelfde element zou de transformatie overschrijven.
- **Kosten:** de main chunk groeit uncompressed van ±1,0 MB naar ±1,1 MB. Dat is de prijs voor minder eigen animatiecode; de confetti blijft juist in een apart lazy chunk van ±11 KB.

### 5.4 Extra effecten in de tweede PR

De tweede PR bouwt voort op dezelfde basis en voegt vier korte effecten toe, zonder nieuwe dependency:

- **Oppakken:** de `DragOverlay` veert met Motion van 96% naar 108% en van -2° naar 3°.
- **Mengen:** het resultaat krijgt een eenmalige pop (0,5 → 1,0, -10° → 0°) op de plek waar de twee elementen samensmolten. De store bewaart daarvoor `lastMergedId`; na de animatie wordt die gewist.
- **Ontdekken:** de ontdekkingskaart gebruikt stervormige confetti in goud en violet, en het element zelf popt met een korte glow.
- **Labboek:** de voortgangsbalk veegt met een spring naar het juiste percentage.

Alle effecten respecteren `prefers-reduced-motion` via `MotionConfig` en de confetti-guard. Er komen geen dependencies of opslagschema-wijzigingen bij; `lastMergedId` is tijdelijke UI-state.

### 5.5 De andere voorgestelde dependencies

| Package           | Verdict          | Onderbouwing                                                                                                                                                                                                          |
| ----------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `canvas-confetti` | **Ja**           | Kleine, gerichte bibliotheek; goedgekeurd en geïmplementeerd.                                                                                                                                                         |
| `motion`          | **Ja**           | motion.dev; goedgekeurd en geïmplementeerd met `LazyMotion` + `m` voor dialogen en feedback.                                                                                                                          |
| `zustand`         | **Al aanwezig**  | Stond al in `package.json` (5.0.15) en wordt door alle features gebruikt. Geen actie.                                                                                                                                 |
| `immer`           | **Nee**          | De stores zijn klein en gebruiken expliciete immutable updates. Immer voegt een tweede stijl en bundlegewicht toe zonder dat het een concreet probleem oplost.                                                        |
| `use-sound`       | **Nee**          | Dit is een Howler-wrapper voor audiobestanden. De app synthetiseert bewust met Web Audio en heeft geen audiobestanden nodig; use-sound zou juist naar gelicentieerde assets duwen.                                    |
| `howler`          | **Nee, nu niet** | MIT en ±7 KB gzip, maar de SFX zijn gesynthetiseerd en spraak/lessen spelen al via één herbruikbare `HTMLAudioElement`. Sprites, fades en spatial audio hebben we niet nodig; de laatste release (2.2.4) is van 2023. |
| `nanoid`          | **Nee**          | Bordinstanties leven alleen binnen één sessie en worden niet bewaard. De bestaande teller (`board-1`, `board-2`, ...) is genoeg en deterministisch testbaar.                                                          |

### 5.6 Wat verder ongewijzigd blijft

- Geen ambience in de MVP.
- Geen fotorealistische texturen of donkere vignette.
- Geen nieuwe icoonfamilie.
- Geen extra deeltjessysteem naast `canvas-confetti`; een merge-spat is pas aan de orde na playtesting.
- Geen nieuwe audio-assets; de synthesizer blijft de standaard.

## 6. Als er later toch externe audio komt

- Alleen **CC0**, of **CC-BY** met een echte creditspagina. Geen NC, geen Sampling+, geen "gratis" site met eigen voorwaarden.
- Voorkeur voor **Kenney** (CC0, geen attributie, kleine selectie).
- Houd de bron-zip buiten de repo. Commit alleen de gekozen, bijgesneden en genormaliseerde bestanden.
- Normaliseer op dezelfde luidheid als de synthesizer (de bestaande tonen zitten rond 0,03–0,05 gain); een sample uit een pack is al snel veel luider.
- Zet ze in `apps/games/public/audio/sfx/` en leg herkomst, licentie, datum en bestandsnamen vast in `LICENSES/<bron>.txt`.
- Geef bestanden een semantische naam en een versie of contenthash; `/audio/*` wordt één week gecachet.
- `media-src 'self'` staat lokaal geluid al toe; de CSP hoeft niet te worden verzwakt.
- Voeg een test toe die controleert dat elk geluid dat de code noemt ook echt bestaat, net als de spraakdekkingstest.
- Budget: liefst ≤ 300 KB totaal en ≤ 50 KB per effect; laad pas na de eerste interactie.

## 7. Open vragen

- Willen we überhaupt een ambience, of is stilte beter voor concentratie en ouderlijke acceptatie?
- Is een neutrale visuele wiebel bij een mislukte combinatie wenselijk, of is de tekst genoeg?
- Willen we per categorie variëren in toonhoogte (water hoog, aarde laag), of blijft elk geluid hetzelfde?
- Wie luistert en keurt de klanken goed: de eigenaar, kinderen, of beiden?
- Blijft de geluidstoggle globaal, of krijgt sfeer een eigen schakelaar?

## Bronnen

- [Kenney — Interface Sounds (100 bestanden, CC0)](https://kenney.nl/assets/interface-sounds)
- [Kenney — UI Audio (50 bestanden, CC0)](https://kenney.nl/assets/ui-audio)
- [Kenney — RPG Audio (50 bestanden, CC0)](https://kenney.nl/assets/rpg-audio)
- [Kenney — support: alle assets CC0, geen attributie vereist](https://kenney.nl/support)
- [Freesound — FAQ over licenties (CC0, CC-BY, CC-BY-NC, Sampling+)](https://freesound.org/help/faq/#licenses)
- [Pixabay — Content License Summary](https://pixabay.com/service/license-summary/) (geraadpleegd via het [Wayback-archief van 16 oktober 2026](https://web.archive.org/web/20261016153634/https://pixabay.com/service/license-summary/), omdat de site geautomatiseerde toegang blokkeert)
- [Zapsplat — Standard License Agreement](https://www.zapsplat.com/license-type/standard-license/)
- [Poly Haven — Asset License (CC0, herverdeling toegestaan)](https://polyhaven.com/license)
- [ambientCG — License (CC0, herverdeling toegestaan)](https://docs.ambientcg.com/license/)
- [OpenGameArt — FAQ over licenties per inzending](https://opengameart.org/content/faq)
- [game-icons.net — CC BY 3.0 en attributie](https://game-icons.net/about.html)
- [MDN — Autoplay guide voor media en Web Audio](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [canvas-confetti — GitHub, ISC](https://github.com/catdad/canvas-confetti)
- [Motion — documentatie](https://motion.dev/) en [GitHub, MIT](https://github.com/motiondivision/motion)
- [Howler.js — documentatie](https://howlerjs.com/) en [GitHub, MIT](https://github.com/goldfire/howler.js)
- [ADR 0026 — adaptief niveaumodel en foutvriendelijke feedback](../adr/0026-adaptief-niveaumodel.md)
- [`libs/shared/ui/motion-provider.tsx`](../../libs/shared/ui/motion-provider.tsx), [`libs/shared/ui/confetti.tsx`](../../libs/shared/ui/confetti.tsx), [`libs/shared/lib/sound.ts`](../../libs/shared/lib/sound.ts), [`libs/shared/lib/haptics.ts`](../../libs/shared/lib/haptics.ts), [`libs/features/alchemy-lab/model/use-alchemy-store.ts`](../../libs/features/alchemy-lab/model/use-alchemy-store.ts), [`libs/features/alchemy-lab/ui/alchemy-play.tsx`](../../libs/features/alchemy-lab/ui/alchemy-play.tsx)
- [`docs/design-system.md`](../design-system.md) en [`docs/research/2026-10-19-mengelmoes-assets.md`](2026-10-19-mengelmoes-assets.md)
