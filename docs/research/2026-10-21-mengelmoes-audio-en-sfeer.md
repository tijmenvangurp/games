# Mengelmoes: audio, sfeer en visuele polish

- **Datum:** 2026-10-21
- **Status:** Onderzoek. Nog geen beslissing of implementatie.
- **Aanleiding:** een lijst met externe audio- en assetbronnen (Kenney, Freesound, Pixabay, Zapsplat, Poly Haven/ambientCG, itch.io, OpenGameArt, game-icons.net) en drie polish-ideeën: omgevingsgeluid, deeltjes en oppak-physics. De vraag is wat daarvan past bij de Spellen-app, met **Mengelmoes** als MVP.
- **Kader:** [AGENTS.md](../../AGENTS.md), [ADR 0001](../adr/0001-publieke-statische-spellen-app.md), [ADR 0005](../adr/0005-pokemon-assets.md), de [CSP in `_headers`](../../apps/games/public/_headers), [het design systeem](../design-system.md), [`libs/shared/lib/sound.ts`](../../libs/shared/lib/sound.ts) en het eerdere [Mengelmoes-assetonderzoek](2026-10-19-mengelmoes-assets.md).

## Samenvatting

1. **Dit is vooral een inkooplijst, geen gap-analyse.** Mengelmoes heeft voor de MVP geen externe audio of texturen nodig. De app heeft al een CSP-veilige synthesizer, een globale geluidstoggle, haptiek, confetti en een sparkle-icoon.
2. **De grootste audiogap is niet "mooiere samples", maar een ontbrekend geluid.** Een mislukte combinatie is nu volledig stil: `rejectCombination()` zet alleen een tekstmelding. De bestaande `wrong`-klank wordt door geen enkel spel gebruikt en kan dus zonder bijwerkingen voor Mengelmoes worden ingezet.
3. **Oppak-physics bestaat al.** De `DragOverlay` schaalt naar 105% en kantelt 3 graden ([`alchemy-play.tsx`](../../libs/features/alchemy-lab/ui/alchemy-play.tsx)). De voorgestelde 5% en 2–5 graden zijn dus al gehaald.
4. **Een deeltjesburst bestaat al voor de ontdekking.** `Confetti` is CSS-only, heeft geen dependency en respecteert reduced motion via de globale motion-laag. `Sparkles` op de ontdekkingskaart is een icoon, geen deeltjessysteem. `tsParticles` of Framer Motion toevoegen kost meer code en een dependency voor een effect van 300–450 ms.
5. **Voor audio is alleen CC0 probleemloos, en Kenney is de eenvoudigste bron.** Pixabay en Zapsplat verbieden herdistributie van losse bestanden; een publieke git-repo met de ruwe mp3's is precies dat. CC-BY-bronnen mogen wel, maar vragen attributie en administratie.
6. **Fotorealistische texturen en een donkere vignette passen niet.** Het design systeem kiest ivory, rust en geen achtergronddecoratie. Een 1K-fototextuur is bovendien enkele MB's; de bestaande CSS-stippen op de werkbank kosten niets.
7. **Advies:** geen externe assets voor de MVP. Maak een mislukte combinatie zacht hoorbaar, geef een nieuwe ontdekking eventueel een eigen chime, en houd ambience, fototexturen en nieuwe icoonfamilies buiten de eerste versie.

## 1. Wat Mengelmoes nu al doet

| Actie                 | Bestaand gedrag                                                                  | Bron                                                          |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Element oppakken      | `tap`-toon, haptiek, overlay op 105% met 3° kanteling en sterke schaduw          | `alchemy-play.tsx`, `use-alchemy-store.ts`                    |
| Op de werkbank leggen | `select`-toon en haptiek                                                         | `addToBoard()`                                                |
| Nieuwe combinatie     | `win`-toon, haptiek, confetti (28 stukken), sparkle-icoon en de ontdekkingskaart | `finishCombination()`, `discovery-dialog.tsx`, `confetti.tsx` |
| Bestaande combinatie  | `match`-toon en haptiek                                                          | `finishCombination()`                                         |
| Mislukte combinatie   | **Stil.** Alleen de tekst "Hm, dat mengt niet. Probeer iets anders."             | `rejectCombination()`                                         |
| Hint                  | `hint`-toon en haptiek                                                           | `showHint()`                                                  |
| Werkbank opruimen     | `tap`-toon                                                                       | `clearBoard()`                                                |
| Alles ontdekt         | Melding "Je hebt alle elementen ontdekt." zonder eigen geluid                    | `showHint()` → `feedback: "all-found"`                        |

De geluiden komen uit zeven patronen in [`sound.ts`](../../libs/shared/lib/sound.ts): `tap`, `select`, `match`, `wrong`, `hint`, `almost` en `win`. Ze worden met de Web Audio API gesynthetiseerd, dus er is geen bestand, geen fetch en geen CSP-uitzondering nodig. `media-src 'self'` staat lokale audiobestanden wel toe, maar de synthesizer heeft ze niet nodig.

De `wrong`-klank is nu dood: een zoekactie over `libs/` vindt geen enkele `playSound("wrong")`. Alleen Mengelmoes hoeft hem te gaan gebruiken, dus de klank kan op dit spel worden afgestemd zonder andere spellen te raken.

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

`Confetti` is al een dependency-vrije CSS-burst van 28 stukken. De ontdekkingskaart gebruikt daarnaast het `Sparkles`-icoon, maar er is nog geen deeltjessysteem. De globale motion-laag zet onder `prefers-reduced-motion` alle animaties op 0,01 ms.

Een extra "merge-spat" op het punt waar twee elementen samensmelten is de enige zinvolle toevoeging. Die is klein (8–12 stipjes, 300–450 ms) en kan met dezelfde CSS-aanpak. Let op: `AlchemyFeedback` bevat nu geen positie. Het combineerpunt wordt in `finishCombination()` wel berekend, dus de feedback kan worden uitgebreid met `x`/`y` zonder de spellogica te veranderen.

**Advies:** pas doen als playtesting laat zien dat de samensmelting te weinig impact heeft. Geen `tsParticles`, geen Framer Motion: dat is een nieuwe dependency en meer API dan het effect rechtvaardigt.

### 4.3 Oppak-physics

De suggestie (5% groter, 2–5 graden kantelen) is al geïmplementeerd:

```tsx
<div className="rotate-3 scale-105 drop-shadow-2xl">
  <ElementToken element={activeElement} variant="overlay" />
</div>
```

**Advies:** niets doen. Een extra sprong naar 108% of 4 graden is nauwelijks zichtbaar en maakt de sleepbeweging onrustiger.

## 5. Aanbevolen MVP-slice

In deze volgorde, van klein naar optioneel:

1. **Mislukte combinatie hoorbaar maken.** Roep in `rejectCombination()` `playSound("wrong")` en `playHaptic("wrong")` aan. Dit is één regel per soort feedback en sluit aan op de bestaande semantiek.
2. **De `wrong`-klank zachter maken.** Het huidige patroon is een square-golf van 220 Hz; dat klinkt als een foutmelding. Voor kinderen is een korte, dalende tweeklank met triangle-golven vriendelijker:
   ```ts
   wrong: [
     { frequency: 233, delay: 0, duration: 0.1, type: "triangle", volume: 0.03 },
     { frequency: 185, delay: 0.09, duration: 0.14, type: "triangle", volume: 0.03 },
   ],
   ```
   Omdat geen enkel ander spel `wrong` gebruikt, is dit veilig. Laat de eigenaar het wel beluisteren.
3. **Optioneel: een eigen ontdekkings-chime.** Voeg een `discover`-patroon toe (drie stijgende sine-noten, bijvoorbeeld 784 → 988 → 1319 Hz) en gebruik dat bij `isNew`. Houd `win` dan apart voor de eindmelding, die nu nog geen geluid heeft. Dit is alleen nodig als de huidige `win` te veel als "spel afgelopen" voelt.
4. **Optioneel: een korte wiebel bij een mislukte combinatie.** Geef de twee betrokken `instanceId`s mee in de `wrong`-feedback en laat alleen die twee munten 180 ms horizontalen. Respecteer de bestaande reduced-motion-laag. Dit is meer werk dan het geluid en voegt vooral tactiele duidelijkheid toe.
5. **Optioneel: merge-spat.** Alleen na playtesting, zoals beschreven in 4.2.

Alles hierboven blijft binnen de bestaande architectuur: `libs/shared/lib/sound.ts` voor de klank, `libs/shared/ui` voor een gedeeld effect, en de alchemy-feature voor de aanroep. Geen nieuwe dependency, geen CSP-wijziging, geen netwerk.

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
- Is een geluid bij een fout pedagogisch wenselijk, of liever alleen de visuele wiebel en de tekst?
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
- [`libs/shared/lib/sound.ts`](../../libs/shared/lib/sound.ts), [`libs/shared/lib/haptics.ts`](../../libs/shared/lib/haptics.ts), [`libs/features/alchemy-lab/model/use-alchemy-store.ts`](../../libs/features/alchemy-lab/model/use-alchemy-store.ts), [`libs/features/alchemy-lab/ui/alchemy-play.tsx`](../../libs/features/alchemy-lab/ui/alchemy-play.tsx), [`libs/shared/ui/confetti.tsx`](../../libs/shared/ui/confetti.tsx)
- [`docs/design-system.md`](../design-system.md) en [`docs/research/2026-10-19-mengelmoes-assets.md`](2026-10-19-mengelmoes-assets.md)
