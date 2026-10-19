# Onderzoek: voorlezen met TTS in de andere games

- **Datum:** 2026-10-19
- **Status:** Onderzoek en besluit; fundament, Schaakles, Schaakpuzzels, Rekenen en Woordzoeker zijn geïmplementeerd (zie [ADR 0023](../adr/0023-voorlezen-met-tts.md))
- **Vraag:** hoe kunnen we met TTS meer audiofeedback geven in de andere games, zodat een kind dat nog niet kan lezen de opdrachten, vragen en antwoordwoorden toch begrijpt?
- **Kader:** [AGENTS.md](../../AGENTS.md), [ADR 0001](../adr/0001-publieke-statische-spellen-app.md) en de [CSP in `_headers`](../../apps/games/public/_headers): publiek, statisch, alleen TypeScript, geen externe requests, geen backend.

## Kort advies

**Gebruik vooraf gegenereerde, lokale TTS-fragmenten met één Nederlandse stem, en bouw één gedeelde spraakspeler die per game alleen de kritieke woorden, vragen en feedback voorleest.**

- De app heeft al een bewezen pipeline voor Frans: 175 lokale MP3's, gegenereerd met de private TTS-skill en gecommit in `apps/games/public/audio/fr`. Die aanpak past binnen de CSP en de regel “geen externe requests”.
- Gebruik **geen** `speechSynthesis` in de browser. Stemmen verschillen per toestel, sommige stemmen synthetiseren via een netwerkdienst en je kunt de uitspraak niet reviewen of vastleggen.
- De TTS-dienst en de Nederlandse stem **Nathalie** bestaan al; Nathalie wordt gebruikt voor Letterpret. De Franse stem Tom is alleen voor Frans. Hergebruik Nathalie voor de andere games; een nieuwe stem kiezen is niet nodig.
- Lees niet alles voor. Spreek de **opdracht, de vraag, de antwoordopties (op verzoek) en de feedback** uit. Elk gesproken element krijgt een herhaalknop. De tekst blijft zichtbaar, zodat dove en slechthorende kinderen en schermlezergebruikers niets verliezen.
- Begin met de games waar tekst echt blokkerend is: **Schaakles**, **Schaakpuzzels**, **Rekenen** en **Woordzoeker**. Daarna volgen de visuelere games en het hoofdmenu. **Pokémon-quiz en Pokémon-namen slaan we voorlopig over.**

## Stand van de implementatie

De gedeelde speler, de catalogusontdekking, de audiolock en de coverage-poort staan in de repository. Schaakles, Schaakpuzzels, Rekenen en Woordzoeker hebben echte Nathalie-audio: samen 222 fragmenten, ongeveer 2,5 MB. Vlaggenreis, memory, zoeken, sudoku, pijlen en het hoofdmenu volgen later. Zie [ADR 0023](../adr/0023-voorlezen-met-tts.md) en het [plan](../plans/2026-10-19-voorlezen-in-alle-games.md).

## 1. Wat is er nu?

### 1.1 Geluidseffecten

`libs/shared/lib/sound.ts` speelt korte, gesynthetiseerde tonen via de Web Audio API. Er is één voorkeur (`games.sound.v1`) en één `SoundToggle`. De effecten zijn bewust klein en nooit nodig om te spelen.

### 1.2 Franse audio

De Franse lessen hebben al vooraf gegenereerde audio:

- 175 MP3-bestanden in `apps/games/public/audio/fr/`, samen ongeveer 3,2 MB;
- `scripts/generate-french-audio.ts` leest de curriculum, slaat niet-gereviewde items over en schrijft `<id>.mp3` en `<id>-example.mp3`;
- `libs/entities/french/model/audio.ts` bouwt de paden;
- `useFrenchAudio` hergebruikt één `HTMLAudioElement` voor de hele les;
- de content-contracttest controleert dat elk gepubliceerd item een audiobestand heeft.

Deze pipeline is de belangrijke referentie: **audio is data, geen runtime-dienst.**

### 1.3 Letterpret-audio

Het letterspel heeft al Nederlandse TTS-audio en is daarmee het tweede bewezen voorbeeld:

- stem `speaches-ai/piper-nl_BE-nathalie-medium` (voice `nathalie`, CC0-dataset), vastgelegd in [ADR 0017](../adr/0017-letterklanken-en-audio.md);
- 36 klankeenheden in `apps/games/public/audio/letters/v2/sounds/` en 15 woordopnames in `apps/games/public/audio/letters/v2/words/`;
- `scripts/generate-sounds.ts` genereert de fragmenten, heeft `--list-models`, `--only`, `--variant`, `--force` en `--dry-run`, en schrijft een manifest met de gekozen stem en bron;
- `LetterAudio` in `libs/features/letter-game/ui/letter-audio.tsx` hergebruikt één lokaal `audio`-element en heeft een “Luister”-knop als fallback;
- de woordopnames zijn expliciet prototype en worden vóór lancering vervangen door eigen opnames.

Deze set laat zien dat de TTS-dienst, de Nathalie-stem en de privé-helper al werken. Voor de andere games hoeven we dus geen nieuwe stem te zoeken, tenzij Nathalie bij langere zinnen tegenvalt.

### 1.4 Wat ontbreekt

- Geen gedeelde spraakspeler: `useFrenchAudio`, `usePokemonCry` en `LetterAudio` hebben allemaal hun eigen audio-element.
- Geen audio in de meeste Nederlandse games; alleen Letterpret en de Pokémon-cries hebben audio.
- Geen scheiding tussen “geluidseffecten” en “voorlezen”.
- Geen contentcontract dat UI-tekst en audiobestand aan elkaar koppelt.
- Geen generator die meerdere games en woordenschat aankan.

## 2. Welke techniek?

| Optie                              | Voordelen                                                        | Nadelen                                                                                                                   | Verdict     |
| ---------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Vooraf gegenereerde TTS**        | Deterministisch, offline, reviewbaar, cachebaar, past bij de CSP | Generatieworkflow, audiobestanden in de repo, tekstwijziging vereist regeneratie                                          | **Kiezen**  |
| Web Speech API (`speechSynthesis`) | Geen assets, werkt met willekeurige tekst                        | Stemmen verschillen per toestel; sommige stemmen gebruiken een netwerkdienst; geen controle over uitspraak; niet testbaar | **Niet**    |
| Menselijke opnames                 | Beste kwaliteit en warmte                                        | Honderden fragmenten inspreken, onderhouden en licentiëren; niet haalbaar voor deze fase                                  | **Niet nu** |
| TTS-server tijdens het spelen      | Volledig dynamisch                                               | Vraagt een backend of externe request; breekt de statische/privacyregels                                                  | **Niet**    |

De Web Speech API is extra riskant omdat de CSP `connect-src 'none'` niet kan garanderen dat een systeemstem lokaal synthetiseert. De spec laat zowel lokale als servergebaseerde synthese toe. Op een toestel zonder de juiste stem krijgt een kind bovendien een andere stem of helemaal geen audio. Voor een publieke app die op telefoon en tablet moet werken is dat geen betrouwbare basis.

## 3. Waar blokkeert tekst het spel?

| Game                     | Wat moet een kind lezen?                                  | Audio nodig om te kunnen spelen?                                | Wat is dynamisch?                          | Prioriteit |
| ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------ | ---------- |
| **Schaakles**            | instructie, coachfeedback, “Waarom?”-uitleg, hint, succes | **Ja**, vrijwel alles                                           | Nee, vaste tekst per les                   | **P1**     |
| **Wie is deze Pokémon?** | vraag en 3–5 antwoordnamen                                | **Ja**, de namen zijn de antwoorden                             | Namen vast (151), vraag/feedback vast      | **Later**  |
| **Woordzoeker**          | de te zoeken woorden en de status                         | **Ja**, de woordenlijst is de opdracht                          | Woorden vast (56 unieke), status dynamisch | **P1**     |
| **Rekenen**              | de som, feedback en uitleg                                | **Deels**: cijfers herkennen lukt vaak, symbolen en uitleg niet | Getallen en sommen dynamisch               | **P1/P2**  |
| **Schaakpuzzels**        | opdracht (“zet schaakmat”, “win een stuk”) en feedback    | **Ja**, het doel staat alleen in tekst                          | Vaste soorten, dynamische stelling         | **P2**     |
| **Vlaggenreis**          | vraag, land- of provincienaam en feedback                 | **Ja**, de namen zijn de antwoorden                             | Namen vast (~200), vragen vast             | **P2/P3**  |
| **Sudoku**               | setup, status, “nog één vakje”                            | **Nee**, het bord is visueel; uitleg wel                        | Status dynamisch                           | **P3**     |
| **Memory**               | instructie en status                                      | **Nee**, het spel is visueel                                    | Status dynamisch                           | **P3**     |
| **Waar is Wobbel?**      | instructie en status                                      | **Nee**, het spel is visueel                                    | Status dynamisch                           | **P3**     |
| **Pijlen**               | intro, levelnaam en status                                | **Nee**, het spel is visueel                                    | Status dynamisch                           | **P3**     |
| **Hoofdmenu**            | spelnamen en beschrijvingen                               | **Deels**, iconen helpen, maar niet genoeg                      | Vast                                       | **P3**     |
| **Frans**                | bestaande audio-first quiz                                | **Nee**, al opgelost                                            | Bestaand                                   | Migratie   |
| **Letterpret**           | klank, letter en woord                                    | **Nee**, al audio-first                                         | Bestaand                                   | Migratie   |

De volgorde is bewust: eerst de games waar een kind zonder audio vastloopt, daarna de games waar audio vooral uitleg en bevestiging toevoegt. **De Pokémon-quiz en de 151 Pokémon-namen laten we voorlopig liggen**; die quiz blijft voorlopig tekstgebaseerd. Dezelfde aanpak kan later alsnog worden toegepast.

## 4. Welke stem?

De infrastructuur is er al en er is ook al een Nederlandse stem: **Nathalie** (`speaches-ai/piper-nl_BE-nathalie-medium`, voice `nathalie`, CC0-dataset). Die stem wordt gebruikt voor alle audio in Letterpret en staat beschreven in [ADR 0017](../adr/0017-letterklanken-en-audio.md). Tom is de Franse stem en spreekt geen Nederlands.

**Hergebruik Nathalie voor alle Nederlandse games.** Er is dus geen nieuwe stemkeuze nodig. Doe wel een korte steekproef met langere zinnen, getallen en leenwoorden, want de Letterpret-set is deels prototype en bestaat vooral uit losse klanken en korte woorden. Alleen als Nathalie daar duidelijk ongeschikt voor blijkt, vallen we terug op Pim of Ronnie.

Met `scripts/generate-sounds.ts --list-models` kan de eigenaar zien welke stemmen de TTS-dienst aanbiedt; de private helper houdt de endpoint en sleutel buiten de chat.

Piper is MIT-gelicenseerd. De Nederlandse stemmen staan in `rhasspy/piper-voices`:

| Stem                    | Taal       | Kwaliteit | Datasetlicentie | Opmerking                                                         |
| ----------------------- | ---------- | --------- | --------------- | ----------------------------------------------------------------- |
| `nl_NL-pim-medium`      | Nederlands | medium    | **CC0**         | Fallback; mannenstem met Noord-Nederlandse uitspraak              |
| `nl_NL-ronnie-medium`   | Nederlands | medium    | **CC0**         | Fallback; nog niet vergeleken                                     |
| `nl_BE-nathalie-medium` | Vlaams     | medium    | **CC0**         | **Eerste keuze**; al in gebruik voor Letterpret                   |
| `nl_NL-mls-medium`      | Nederlands | medium    | CC BY 4.0       | Community meldt onverstaanbare output; niet zonder test gebruiken |

De Franse stem Tom gebruikt een AGPLv3-dataset. Nederlands gebruikt Nathalie (CC0); dat is al een bewuste verbetering ten opzichte van de Franse situatie. De stem en licentie staan in [ADR 0017](../adr/0017-letterklanken-en-audio.md); de uitbreiding naar alle games leggen we vast in [ADR 0023](../adr/0023-voorlezen-met-tts.md). Pim en Ronnie zijn alleen fallback als Nathalie bij langere zinnen niet voldoet.

**Luistertest vóór bulkgeneratie.** Genereer met Nathalie dezelfde korte set en beluister die op telefoon en tablet. Alleen als Nathalie niet bevalt, doe je dezelfde test met Pim en Ronnie:

1. “Welkom bij Spellen.”
2. “Tik op de pijl die vrij is.”
3. “Goed gedaan!”
4. “Het juiste antwoord is tweeëntwintig.”
5. “Honderd.”
6. “De toren rijdt recht over de lijnen.”
7. “Zoek het woord vijver.”
8. “Je bent wit. Zet de zwarte koning schaakmat.”
9. “Wat is tien plus vijf?”
10. “Het juiste antwoord is vijftien.”
11. “Schaakmat betekent: de koning wordt aangevallen en kan nergens meer naartoe.”
12. “Gedeeld door.”

Let op: Nederlandse tweeklanken (`ij`, `ui`, `eu`), getallen boven de twintig, lange woorden en leenwoorden. Kies één stem voor alle Nederlandse games. Wisselen per game klinkt rommelig en maakt het onderhoud onnodig groot.

**Uitspraakoverrides.** TTS kan coördinaten, symbolen of namen verkeerd uitspreken. Voeg per regel een optioneel `audioText`-veld toe, net als in het Franse model. Voorbeelden:

| Weergave | `audioText`      | Context          |
| -------- | ---------------- | ---------------- |
| `e1`     | `e één`          | schaakcoördinaat |
| `10 + 5` | `tien plus vijf` | rekenvraag       |
| `÷`      | `gedeeld door`   | delen            |
| `×`      | `keer`           | vermenigvuldigen |

Test de uitzonderingen en voeg alleen een override toe waar nodig. Zo blijft de catalogus leesbaar.

## 5. Ontwerpprincipes

1. **Spreek wat blokkeert.** De opdracht, de vraag, de antwoordopties (op verzoek) en de feedback. Niet elk label, elke teller of elke decoratieve tekst.
2. **Tekst blijft staan.** Audio is een aanvulling, geen vervanging. Een kind dat doof is, een schermlezer gebruikt of liever leest, verliest niets.
3. **Kort en concreet.** Eén idee per fragment, bij voorkeur onder de zes seconden. “Tik op de pijl die vrij is” is beter dan een alinea uitleg.
4. **Eén stem.** Geen verschillende personages of stemmen per game. Wel kan de stem per taal verschillen; Frans houdt Tom.
5. **Herhaalbaar.** Elk gesproken element heeft een zichtbare sprekerknop. Automatisch voorlezen is een gemak, geen gevangenis.
6. **Geen autoplay vóór de eerste tik.** Browsers blokkeren dat, en een kind moet eerst zelf een spel starten. Spreek pas na de start- of levelknop.
7. **Eén audio-element en één wachtrij.** Geen overlappende fragmenten. Stop bij navigatie, pauzeer bij een verborgen tab.
8. **Spreek niet door een geluidseffect of cry heen.** Spraak en effect horen bij dezelfde feedback; speel ze na elkaar, niet tegelijk.
9. **Positief en kort.** “Bijna!” in plaats van “Fout.” Na een goed antwoord is “Goed gedaan!” genoeg; de uitleg hoeft niet altijd voorgelezen te worden.
10. **Geen overdaad.** Spraak bij elke tik went snel en leidt af. Alleen bij een nieuwe vraag, een antwoord, een hint of een levelovergang.

Voor een kind dat nog niet leest is gesproken tekst geen doublure: het is het enige kanaal. Voor een kind dat al leest kan dezelfde spraak juist extra belasting geven. Daarom is een aparte voorleesstand belangrijk, liefst los van de geluidseffecten.

## 6. Technische haalbaarheid

### 6.1 Omvang

Een ruwe schatting van de Nederlandse catalogus:

| Groep                          | Aantal fragmenten | Toelichting                                      |
| ------------------------------ | ----------------: | ------------------------------------------------ |
| Algemene feedback              |               ~20 | “Goed gedaan!”, “Bijna!”, “Volgende”, “Opnieuw”  |
| Rekenen                        |              ~110 | Getallen 0–100, vier bewerkingen, korte feedback |
| Woordzoeker                    |               ~60 | 56 unieke woorden plus status                    |
| Schaakles                      |               ~65 | 9 levels × gemiddeld 6 regels plus coachtekst    |
| Schaakpuzzels                  |               ~20 | Drie doelen, prompts en status                   |
| Vlaggenreis (optioneel)        |              ~200 | Land- en provincienamen plus vragen              |
| Memory, zoeken, sudoku, pijlen |               ~40 | Vooral instructies en feedback                   |
| Hoofdmenu (optioneel)          |               ~20 | Namen en korte beschrijvingen                    |

Dat is ongeveer **330–350 fragmenten zonder Vlaggenreis**, of **530–550 als Vlaggenreis meedoet**. Bij een gemiddelde van 10–17 KB per fragment komt dat neer op **3–5 MB**, of **5–7 MB** met Vlaggenreis. De Franse set is 3,2 MB voor 175 fragmenten; korte woorden en getallen zijn kleiner dan complete zinnen.

Audio wordt pas opgehaald als het nodig is. Het zit niet in de JavaScript-bundel en vertraagt de eerste paginalading niet. `/audio/*` heeft al een cacheheader van zeven dagen.

### 6.2 Dynamische tekst

Niet alle tekst is vooraf te genereren:

- **Rekenen** heeft te veel sommen voor volledige zinnen. Los dit op met losse fragmenten voor getallen en bewerkingen: `3 + 4` wordt “wat is”, “drie”, “plus”, “vier”. De speler speelt ze na elkaar met een korte pauze. Getallen 0–100 zijn genoeg voor alle niveaus.
- **Schaakles** heeft vaste tekst per level. Geen compositie nodig.
- **Schaakpuzzels** hebben vaste prompts per soort en kleur. Geen compositie nodig.
- **Woordzoeker** heeft een vaste woordenlijst per thema. Geen compositie nodig.
- **Vlaggenreis** heeft vaste namen, maar de combinatie van vraag, opties en feedback verschilt. Dat is geen probleem: de namen en de vaste vragen zijn los beschikbaar.
- **Pokémon-quiz** laten we voorlopig buiten scope; de namen en vaste zinnen kunnen later op dezelfde manier worden toegevoegd.

### 6.3 Voorkomen dat audio veroudert

Als de UI-tekst verandert maar het audiobestand blijft staan, hoort een kind de oude zin. Dat is een reëel risico bij vaste `id`-bestandsnamen. Twee werkbare oplossingen:

1. **Een audiolock-bestand** met per fragment een hash van de gesproken tekst. De generator schrijft het lock-bestand; `audio:check` faalt als de tekst is gewijzigd maar het audiobestand niet opnieuw is gegenereerd.
2. **Een hash in de bestandsnaam**, bijvoorbeeld `instruction-8f31c2.mp3`. Dan is een gewijzigde tekst automatisch een nieuw bestand en dus een ontbrekend bestand.

Voor de leesbaarheid van de repository is een lock-bestand vriendelijker. De bestandsnamen blijven stabiel en een foutmelding kan precies zeggen welk fragment opnieuw moet.

### 6.4 Eén speler, meerdere games

De speler hoort in `libs/shared/lib`, niet in elke feature:

```text
SpeechLine      id, tekst, optionele audioText
SpeechCatalog   welke regels bij een game of domein horen
SpeechPlayer    één audio-element, wachtrij, stop, toggle
SpeechButton    sprekerknop met toegankelijk label
AudioGenerator  catalogus -> lokale MP3's, plus --check
```

De UI en de generator lezen dezelfde catalogus. Zo kan een tekst niet stilzwijgend afwijken van wat er wordt voorgelezen. De generator importeert alleen modelbestanden, nooit UI-componenten.

### 6.5 Nieuwe games

Schaalbaarheid is niet alleen een gedeelde speler. Drie afspraken zorgen dat een nieuwe game hetzelfde gedrag krijgt:

- **Conventie:** elke game heeft een `model/audio.ts` met `speechGroups`, op een vaste plek.
- **Ontdekking:** de generator scant `libs/**/model/audio.ts`; er is geen centrale lijst die handmatig bijgehouden moet worden.
- **Poort:** een coverage-test eist dat elke `available` game een spraakcatalogus heeft of expliciet `speech: { kind: "visual", reason }` verklaart. `audio:check` controleert daarnaast elk bestand en elke teksthash.

Een scaffold (`pnpm new:game`) neemt `model/audio.ts`, de spraakverklaring en de test meteen mee. Zo is audio de standaard en is “geen audio” een bewuste, zichtbare keuze.

## 7. Risico's en open vragen

| Risico                                           | Mitigatie                                                                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| TTS spreekt getallen of coördinaten verkeerd uit | Luistertest, `audioText`-overrides, steekproef per groep, bijzondere uitspraken beluisteren                       |
| Autoplay wordt geblokkeerd                       | Eerste spraak pas na een tik; één gedeeld audio-element; mislukte `play()` stil negeren                           |
| Schermlezer en voorlezen door elkaar             | Aparte voorleesstand, duidelijke toggle, testen met VoiceOver/TalkBack; tekst blijft de bron van waarheid         |
| Audio en geluidseffect/cry overlappen            | Spraak en effect na elkaar plannen, niet parallel                                                                 |
| Audio wordt te groot                             | Alleen kritieke fragmenten, mono MP3, geen volledige narratie, steekproef op echte toestellen                     |
| Audio veroudert                                  | Lock-bestand met teksthashes of hash in de bestandsnaam; `audio:check` in CI                                      |
| Te veel gesproken tekst                          | Ontwerpprincipe “spreek wat blokkeert”; maximaal één nieuwe spraak per spelstap                                   |
| Licentie- of herkomstvraag                       | Bestaande CC0-stem Nathalie gebruiken; Piper-licentie en stembron in ADR en credits vastleggen                    |
| Repo en CI worden traag                          | Audio niet in de bundel; CI controleert alleen bestanden, genereert niets; `--check` is een pure bestandscontrole |

Open vragen voor de eigenaar:

- Nathalie als vaste stem voor alle Nederlandse games? Zo ja, dan vervalt de keuze tussen Pim en Ronnie en blijft alleen een steekproef met langere zinnen en getallen over.
- Aparte voorleesknop naast de geluidseffecten, of één gecombineerde geluidsknop?
- Staat voorlezen standaard aan? Voor de doelgroep lijkt “aan” logisch, met een zichtbare knop om het uit te zetten.
- Moet het hoofdmenu ook voorgelezen worden, of is dat een latere fase?
- Willen we ook de “Waarom?”-uitleg in de schaakles voorlezen, of alleen de opdracht en feedback?
- Wat is het maximale audiobudget? Ons voorstel is 6 MB voor de eerste fasen en maximaal 8 MB als Vlaggenreis meedoet.

## 8. Bronnen

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — tekstalternatieven, audio controleren en duidelijke bediening.
- [MDN: Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) — `SpeechSynthesis` en de beperkingen van systeemstemmen.
- [Piper](https://github.com/rhasspy/piper) — MIT-engine.
- [Piper voices](https://huggingface.co/rhasspy/piper-voices) — stemmen en model cards.
- [Model card `nl_NL-pim-medium`](https://huggingface.co/rhasspy/piper-voices/raw/main/nl/nl_NL/pim/medium/MODEL_CARD) — CC0.
- [Model card `nl_NL-ronnie-medium`](https://huggingface.co/rhasspy/piper-voices/raw/main/nl/nl_NL/ronnie/medium/MODEL_CARD) — CC0.
- [Model card `nl_BE-nathalie-medium`](https://huggingface.co/rhasspy/piper-voices/raw/main/nl/nl_BE/nathalie/medium/MODEL_CARD) — CC0.
- [Home Assistant-community over Nederlandse Piper-stemmen](https://community.home-assistant.io/t/piper-dutch-language-whats-the-most-normal-one/630924) — ervaringen met `nl_NL` en `nl_BE`.
- [ADR 0017: Letterklanken en prototype-woordaudio](../adr/0017-letterklanken-en-audio.md) — de bestaande Nathalie-stem, de klankset en de prototype-status.
- [Onderzoek naar het Franse luisterspel](2026-10-18-frans-luisterspel.md) — de bestaande TTS-aanpak en stemvergelijking.
- [Plan: Franse lessen schaalbaar maken](../plans/2026-10-18-franse-lessen.md) — het curriculum- en audiocontract.
