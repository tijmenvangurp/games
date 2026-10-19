# Ideeën: letter-spelletjes voor groep 1–3

- **Datum:** 2026-10-18
- **Status:** MVP-prototype met twee lessen (Letterronde en Woordlezen). De TTS-klankset met Nathalie is gekozen (36 klankeenheden; de lessen gebruiken de 10 startletters). Zie [ADR 0017](../adr/0017-letterklanken-en-audio.md).
- **Kader:** de regels uit `AGENTS.md` en [ADR 0001](../adr/0001-publieke-statische-spellen-app.md): publiek, statisch, alleen TypeScript, geen externe requests, geen backend, strikte CSP, mobile-first en touch-targets van minimaal 44 px.
- **Onderbouwing:** [methodiek](../research/2026-10-18-letters-leren-basisschool.md) en [didactiek en spelletjes](../research/2026-10-18-letterdidactiek-en-spelletjes.md).

## Waarom

De twee onderzoeken geven een duidelijke richting:

- De **didactische lus** is belangrijker dan de verpakking: voordoen → samen → zelf → uitleg → gespreid terug.
- **Klank eerst**: het kind hoort een klank en kiest de letter. De letternaam is een hulplabel, geen hoofddoel.
- **Herhaling met tussenpozen** en **correctieve feedback** doen meer dan badges, levels of een adaptief algoritme.
- **Een volwassene doet ertoe**: in de GraphoGame-meta-analyse was begeleiding de enige significante moderator.
- **Kort, rustig en foutloos leren**: geen timer voor 4–6 jaar, geen verliesstreaks, geen leaderboard, geen TTS die letters als namen uitspreekt.

Dit document vertaalt die principes naar spelconcepten. Het is een ideeënlijst, geen implementatieplan.

## Kort advies

**Bouw één dagelijkse "Letterronde" als ruggengraat, met drie kernspellen. Houd het daarna klein.**

- **MVP:** Letterronde + Klank & Letter + Letterjacht + Klankvanger, met 8–10 letters en 5 minuten per sessie.
- **Daarna:** Woordlezen, Woordtrein, Lettermemory en Samen aan tafel.
- **Later:** Teken de Letter, Tweelingletters, Geheime Brief en het Letterboek.
- **Eén set engines, veel varianten.** Klank & Letter, Klankvanger en Rijmrad delen dezelfde audiokeuze-engine. Letterjacht en Tweelingletters delen het zoekveld. Woordtrein en Geheime Brief delen de woordbouw-engine. Zo blijft de code klein.
- **Geen "26 letters"-spel.** Begin met een verdedigbare startset en laat de ouder of leerkracht de methode van school kiezen.

## De ruggengraat: Letterronde

De Letterronde is geen apart spelletje, maar de sessie die de andere spellen aanstuurt. Elke ronde duurt ongeveer 5 minuten en volgt de didactische lus.

| Stap         | Duur    | Wat er gebeurt                                                    | Spel                                       |
| ------------ | ------- | ----------------------------------------------------------------- | ------------------------------------------ |
| 1. Terug     | 60 s    | Twee eerder geleerde letters worden opgehaald.                    | Klank & Letter                             |
| 2. Nieuw     | 30 s    | Eén nieuwe letter: mondstand, klank, letter, naam één keer.       | Modeling                                   |
| 3. Samen     | 30 s    | Eerste item met een hint; de juiste letter licht kort op.         | Klank & Letter                             |
| 4. Zelf      | 2–3 min | Drie tot vijf items zonder hint, afgewisseld met een andere vorm. | Klank & Letter, Letterjacht of Klankvanger |
| 5. Toepassen | 60 s    | Eén woord bouwen of één klankpositie herkennen.                   | Woordtrein of Klankvanger                  |
| 6. Afsluiten | 15 s    | Toon wat het kind al kent; één tip voor de ouder.                 | Letterboek                                 |

De scheduler kiest de letters: eerst wat bijna vergeten is, dan de nieuwe letter, dan een succesvolle afsluiter. De regels zijn bewust eenvoudig: **1, 3, 7 en 14 dagen**, fouten eerder. Dat is een ontwerpregel, geen gevalideerd algoritme.

**Waarom dit de ruggengraat is:** het kind hoeft niet elke keer een modus te kiezen, de app mengt oefenvormen, en elke sessie eindigt met een succes. Dat past bij de leeftijd en bij de onderzoeksbevinding dat de lus belangrijker is dan het spelletje.

## Zes engines, tien spellen

| Engine     | Spellen                              | Oefent                             | Prioriteit | Effort |
| ---------- | ------------------------------------ | ---------------------------------- | ---------- | ------ |
| Audiokeuze | Klank & Letter, Klankvanger, Rijmrad | Klank–letter, beginletter, rijm    | Must       | S      |
| Zoekveld   | Letterjacht, Tweelingletters         | Lettervorm, visuele discriminatie  | Must       | S      |
| Woordbouw  | Woordtrein, Geheime Brief            | Synthese, decoderen, spelling      | Should     | M      |
| Memory     | Lettermemory                         | Vorm en klank, herhaling           | Should     | S      |
| Traceren   | Teken de Letter                      | Lettervorm, fijne motoriek         | Nice       | M      |
| Oudercoach | Samen aan tafel                      | Modeling, correctie, betrokkenheid | Should     | S      |

"Effort" is een ruwe inschatting: **S** is een kleine feature op een bestaande engine, **M** vraagt nieuwe content of UI, **L** is een aparte beleving. Het Letterboek is geen engine maar een dunne laag over de voortgang.

## De spellen in detail

### 1. Klank & Letter (must)

**Pitch:** "Hoor de klank. Welke letter is het?"

- **Doel:** foneem → grafeem. Dit is de kern van decoderen.
- **Hoe het werkt:** het kind hoort `/m/`, ziet drie lettertegels en tikt de juiste aan. De klank is altijd opnieuw te beluisteren met een grote luidsprekerknop.
- **Didactiek:** korte modeling bij een nieuwe letter, daarna retrieval. De afleiders komen uit dezelfde letterfamilie of lijken qua vorm, zodat het kind echt moet luisteren.
- **Feedback:** "Ja, /m/. Dit is de m." Bij fout: "Dit is de m. Luister: /m/." De juiste letter licht op, de klank klinkt opnieuw, het kind probeert nog eens. Geen rood kruis.
- **Voortgang:** drie goede antwoorden in twee verschillende sessies, daarna terug op 1, 3, 7 en 14 dagen.
- **Let op:** geen TTS die "em" zegt; minimaal drie opties; niet meteen als "beheerst" markeren; geen 26 letters tegelijk.
- **Hergebruik:** nieuwe engine, maar de UI lijkt op de bestaande quiz- en rekenflow.

### 2. Klankvanger (must)

**Pitch:** "Hoor het woord. Welke letter hoort vooraan?"

- **Doel:** auditieve analyse van de begin-, midden- of eindklank.
- **Hoe het werkt:** het kind hoort een woord (bijvoorbeeld `maan`), ziet drie letters en kiest de eerste klank. Later komen de midden- en eindklank erbij.
- **Didactiek:** fonemisch bewustzijn is een van de sterkste voorspellers; de combinatie met letters werkt beter dan klanktraining zonder letters.
- **Feedback:** bij een fout wordt het woord langzamer herhaald en gesegmenteerd: `/m/ – /aa/ – /n/`. De eerste klank wordt benadrukt.
- **Content:** alleen klankzuivere woorden met een eenduidige onset. Geen `sch-`, `ch-`, `ij/ei`-verwarring of stomme letters vooraan.
- **Let op:** geen ambigue plaatjes nodig; letters zijn genoeg. Geen woorden die het kind nog niet kent als de taak over klanken gaat.
- **Hergebruik:** dezelfde engine als Klank & Letter, met een andere promptsoort.

### 3. Letterjacht (must)

**Pitch:** "Zoek alle m's tussen de andere letters."

- **Doel:** visuele lettervorm herkennen en discrimineren.
- **Hoe het werkt:** een raster van 6–9 letters; bovenaan staat de doelletter, met de klank erbij. Het kind tikt alle doelletters aan. Daarna volgt een nieuwe ronde.
- **Didactiek:** herhaalde blootstelling en visuele discriminatie. Het is een goede voorbereiding op vlot lezen, maar geen vervanging van klank–letter.
- **Feedback:** de doelletter pulseert en de klank klinkt. Bij een fout: "Kijk naar de vorm: de m heeft twee bogen." De doelletter licht kort op.
- **Moeilijkheid:** eerst grote visuele verschillen, later `m/n`, `b/d` en `p/q`. Geen timer; moeilijkheid via aantal en gelijkenis.
- **Let op:** geen drukke achtergrond; niet alleen vorm zonder klank; `b` en `d` niet meteen samen.
- **Hergebruik:** het zoekveld van "Waar is Wobbel?" is een goede basis.

### 4. Woordtrein (should)

**Pitch:** "Bouw het woord. De trein gaat rijden als het klopt."

- **Doel:** losse klanken samenvoegen tot een klankzuiver woord.
- **Hoe het werkt:** het kind hoort een woord, ziet evenveel vakjes als letters en tikt de letters in de goede volgorde. Daarna klinkt het woord vloeiend en rijdt de trein verder.
- **Didactiek:** synthese en de elementaire leeshandeling. Pas zinvol na 4–5 letters.
- **Feedback:** bij een fout wordt het woord gesegmenteerd en wijst de app de juiste letter aan. Het kind probeert opnieuw; de trein wacht.
- **Content:** mkm-woorden die passen bij de gekozen letterreeks (`ik`, `is`, `mis`, `kim`, `aap`, `vis`, `pet`, `maan`).
- **Let op:** niet te vroeg; geen lange woorden; audio-model vooraf; tikken in plaats van alleen slepen.
- **Hergebruik:** dezelfde engine als Geheime Brief.

### 4b. Woordlezen (must, gebouwd)

**Pitch:** "Luister naar het woord. Welk woord lees je?"

- **Doel:** van losse letters naar geschreven woorden: het kind koppelt een bekend woord aan de geschreven vorm.
- **Hoe het werkt:** het kind hoort een woord uit de bestaande woordlijst, ziet drie geschreven woorden en tikt het juiste aan. Zes woorden per ronde, geen twee keer hetzelfde woord.
- **Didactiek:** de stap na klank–letter. De afleiders beginnen bij voorkeur met een andere letter, zodat de beginletter alleen niet genoeg is; het kind moet het hele woord lezen.
- **Feedback:** "Ja! Dit is vis." Bij fout: "Bijna. Dit woord is vis." Het woord klinkt opnieuw via de replay-knop.
- **Voortgang:** Woordlezen is oefenen en raakt de lettervoortgang niet aan. De afsluiting toont daarom geen "deze letters ken je al", maar een leescompliment.
- **Let op:** geen nieuwe audio nodig; gebruik de bestaande woordopnames. Alleen woorden die het kind al als klank kent.
- **Leskeuze:** Letterronde en Woordlezen staan samen op één spelkaartje en één pagina. De keuzelijst is data-gedreven (`LETTER_LESSONS`), zodat een volgende les erbij past zonder een nieuw spelkaartje.

### 5. Geheime Brief (should, 6–7 jaar)

**Pitch:** "Lees de woorden en maak de brief open."

- **Doel:** decoderen in een betekenisvolle context, als transfertaak.
- **Hoe het werkt:** het kind bouwt drie korte woorden. Elk goed woord onthult een stukje van een tekening of een korte boodschap. Aan het eind is de brief leesbaar.
- **Didactiek:** dezelfde woordbouw-engine, maar met een uitdagender frame en een duidelijke beloning die aan mastery hangt.
- **Feedback:** het woord wordt eerst gesegmenteerd, dan vloeiend uitgesproken. Een fout kost geen stukje van de tekening.
- **Let op:** het verhaal mag de oefening niet overschaduwen; geen lange animaties; overslaan mogelijk.
- **Hergebruik:** Woordtrein met een andere presentatie en een kleine woordlijst.

### 6. Lettermemory (should)

**Pitch:** "Zoek de letter en de klank bij elkaar."

- **Doel:** lettervorm en klank herhalen via een geheugenspel.
- **Hoe het werkt:** 6–8 kaarten. Een paar bestaat uit een letterkaart en een luidsprekerkaart; bij het omdraaien klinkt de klank. Later kan een paar uit kleine letter en hoofdletter bestaan.
- **Didactiek:** herhaling en visuele discriminatie. Zonder audio is het vooral een vormspel; met audio oefent het de koppeling.
- **Feedback:** het paar blijft liggen en de klank klinkt nog eens. Bij een fout draaien de kaarten terug; bij de volgende flip klinkt de klank opnieuw.
- **Let op:** maximaal 8 kaarten; geen timer; geen competitie; geen paren van identieke letters.
- **Hergebruik:** de bestaande memory-feature, maar met een eigen, eenvoudiger kaartset.

### 7. Samen aan tafel (should)

**Pitch:** "Doe het samen: de app fluistert wat jij kunt vragen."

- **Doel:** modeling en correctieve feedback door een ouder of verzorger.
- **Hoe het werkt:** de app geeft de ouder korte prompts: "Wijs de m aan en zeg /m/. Laat je kind de letter op tafel schrijven." Het kind doet de taak; de ouder tikt "goed" of "nog eens".
- **Didactiek:** volwasseninteractie was de enige significante moderator in de GraphoGame-meta-analyse. Dit is de goedkoopste manier om die moderator toe te voegen.
- **Feedback:** de ouder bevestigt; de app geeft een compliment en de volgende opdracht. Na de sessie één concrete tip.
- **Let op:** niet verplicht; de ouder moet Nederlands kunnen lezen, dus bied ook audio-instructies. Geen diagnose, geen score.
- **Hergebruik:** een dunne laag over de andere spellen, geen aparte game-engine.

### 8. Teken de Letter (nice)

**Pitch:** "Trek de letter over. De letter komt tot leven."

- **Doel:** lettervorm en fijne motoriek.
- **Hoe het werkt:** het kind volgt een brede baan met een startdot en richting. Na drie pogingen doet de app het voor. Geen straf voor afwijking.
- **Didactiek:** handschrift en traceren ondersteunen letterherkenning beter dan typen. Een touchscreen is wel een andere motorische taak dan pen en papier; claim dus geen superieure didactiek.
- **Feedback:** de baan gloeit; de letter groeit. Geen "fout", alleen "nog eens" en een voorbeeld.
- **Let op:** geen precisie-eisen; geen hoofdmodus; verwijs naar schrijven op papier.
- **Hergebruik:** nieuwe SVG-letterpaden; goed te combineren met de letterdata.

### 9. Tweelingletters (nice, later)

**Pitch:** "Let op: b of d?"

- **Doel:** visueel sterk lijkende letters onderscheiden.
- **Hoe het werkt:** korte rondes met paren als `b/d`, `m/n`, `p/q`. Het kind hoort de klank en kiest de juiste letter, of ziet een letter en kiest de klank.
- **Didactiek:** visuele discriminatie en klank–letter. De methode-keuze om `b` en `d` uit elkaar te houden is pragmatisch, niet bewezen als optimale aanpak.
- **Feedback:** de app benoemt het verschil in vorm en klank. Geen snelheidsscore.
- **Let op:** pas aanbieden als beide letters al redelijk bekend zijn; niet als eerste kennismaking.
- **Hergebruik:** Letterjacht of Klank & Letter met een speciale lettercombinatie.

### 10. Rijmrad (nice, 4–5 jaar)

**Pitch:** "Welk woord rijmt op maan?"

- **Doel:** fonologisch bewustzijn, als voorbereiding op letters.
- **Hoe het werkt:** het kind hoort een doelwoord en drie andere woorden, en kiest het rijmwoord. Alles is audio; geen tekst nodig.
- **Didactiek:** rijmen is een onderdeel van fonologisch bewustzijn. Het is geen letteroefening, maar een goede voorbereiding voor 4–5-jarigen.
- **Feedback:** het doelwoord en het gekozen woord worden samen uitgesproken, zodat het rijm hoorbaar wordt.
- **Let op:** drie opties, geen ja/nee-vraag (50% gok); geen woorden met regionale uitspraakverschillen.
- **Hergebruik:** de audiokeuze-engine.

### 11. Letterboek (nice, frame)

**Pitch:** "Elke letter die je kent, krijgt een plek in je boek."

- **Doel:** motivatie en zichtbare voortgang zonder scorebord.
- **Hoe het werkt:** een eenvoudig boek met 26 pagina's (of alleen de gekozen letters). Een pagina komt vrij als een letter echt beheerst is, niet als de sessie is afgerond. Elke pagina toont de letter, een klein origineel dier of voorwerp en de klank.
- **Didactiek:** een informatieve beloning die aan mastery hangt. Geen munten, geen streaks met verlies, geen vergelijking.
- **Let op:** geen lange animaties; geen verzamelobjecten die losstaan van letters; geen methode-personages of artwork kopiëren.
- **Hergebruik:** een dunne laag over de voortgang; geen nieuwe engine.

## Wat je niet maakt

- **Geen 26-letterquiz** als eerste scherm. Begin met 8–10 letters en een gekozen reeks.
- **Geen timer** voor 4–6 jaar. Voor 6–7 alleen als aparte, optionele "vlot"-modus.
- **Geen leaderboard, klassement of "beste score".**
- **Geen streak die reset** of een level dat zakt.
- **Geen TTS die letters als namen uitspreekt.** "em" is de naam, `/m/` is de klank.
- **Geen drag-only opdrachten.** Tikken om te kiezen en tikken om te plaatsen is de standaard.
- **Geen letterbenoeming als hoofddoel.** De kern is "welke letter hoort bij deze klank?".
- **Geen confetti tijdens de vraag.** Feedback pas na het antwoord.
- **Geen dyslexie- of achterstandsclaim.** Een spel is geen protocol en geen diagnose.
- **Geen methode-personages, artwork of structureerwoorden kopiëren.** De lettervolgorde is feitelijk; de uitwerking en het beeldmateriaal niet.
- **Geen analytics, accounts of externe requests.**

## Technische bouwstenen

### Letterdata

Een letter is niet altijd één teken. `aa`, `ee`, `oo`, `uu`, `oe`, `ij`, `ei`, `au`, `ou`, `eu`, `ui` en `ie` zijn twee tekens maar één klankeenheid. Het datamodel moet daarom werken met een **grafeem**:

```text
Letter {
  id: string;            // "m", "aa", "ij"
  glyph: string;         // wat je toont
  kind: "consonant" | "short-vowel" | "long-vowel" | "diphthong";
  soundFile: string;     // /m/, niet "em"
  order: Record<"vll-kim" | "vll-zoem" | "lijn3" | "vrij", number>;
}
```

- **Geen `char`-aanname** in de UI of in de scheduler.
- **Geen dubbele ids**; een test controleert dat elke letter een uniek id en een bestaand audiobestand heeft.
- **Geen methode-inhoud kopiëren**; alleen de feitelijke volgorde als orde-hint.

### Audio

- **Huidige set:** TTS van Piper Nathalie (CC0), per klank gekozen. `f, l, m, s, v, z` zijn 100 ms knips uit een woord; `ng` en `ch` zijn hele woorden. Zie [ADR 0017](../adr/0017-letterklanken-en-audio.md). De volledige 36-klankbibliotheek staat in `apps/games/public/audio/letters/v1/sounds/`.
- **Menselijke opnames of gecontroleerde TTS**, geen runtime-TTS.
- **Per letter één korte klank**, zonder schwa ("muh", "suh").
- **Per woord één opname** voor Klankvanger en Woordtrein.
- **Eén stem, één volume, geen achtergrondmuziek** tijdens klanktaken.
- **Grote replay-knop** (44 px); autoplay alleen na een tik.
- **Versiemap** `public/audio/letters/v1/`, zodat een nieuwe stem geen oude cache oplevert.
- **Laat de set door een leesspecialist beluisteren.** Dit is de grootste inhoudelijke risicofactor.

#### Open audiobronnen

Er is **geen kant-en-klare open set met zuivere Nederlandse letterklanken** die je zonder meer kunt gebruiken. Dit is wat er wel is:

| Bron                                          | Wat je krijgt                                                           | Licentie                 | Geschikt?                                                                                                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rhasspy `dataset-voice-nathalie`**          | 1.131 uitingen met fonemale uitlijning, één vrouwelijke spreker (nl_BE) | CC0 1.0                  | Beste open startpunt. Knip de klank uit de uitlijning, normaliseer stress, fade in/out en laat een leesspecialist luisteren. Let op het Belgische accent en de korte segmenten (0,03–0,15 s). |
| **Rhasspy `dataset-voice-flemishguy`**        | 1.139 uitingen, mannelijke spreker (Vlaams)                             | CC0 1.0                  | Alternatief; Vlaams accent.                                                                                                                                                                   |
| **IFA Corpus**                                | 8 sprekers, handmatig gesegmenteerd, 50.000 woorden                     | GPL                      | Inhoudelijk sterk, maar GPL past niet bij een niet-GPL app.                                                                                                                                   |
| **GCompris voices**                           | Volledig Nederlands alfabet                                             | GPL 2+                   | Niet bruikbaar tenzij de app GPL is; bovendien letternamen, geen losse fonemen.                                                                                                               |
| **Wikimedia Commons `Nl-A.ogg` … `Nl-Z.ogg`** | Letternamen, diverse sprekers                                           | CC BY-SA 3.0             | Geen fonemen: `Nl-M.ogg` is /ɛm/, niet /m/. Attributie en share-alike.                                                                                                                        |
| **Wikimedia Commons Help:IPA/Dutch**          | Voorbeeldwoord per foneem, drie sprekers                                | CC BY-SA 3.0 per bestand | Prototype; zelf trimmen; veel attributie.                                                                                                                                                     |
| **MLCommons MSWC**                            | 1-seconde woordclips Nederlands, 1,13 GB                                | CC BY 4.0                | Woordaudio, geen losse fonemen; coverage en kwaliteit checken.                                                                                                                                |
| **Common Voice NL**                           | Zinnen                                                                  | CC0 1.0                  | Geen letters; extractie kost werk.                                                                                                                                                            |
| **Lingua Libre**                              | Woordopnames                                                            | CC BY-SA 4.0             | Woorden, geen fonemen; kan zelf opnemen.                                                                                                                                                      |
| **Piper `nl_NL-mls-medium`**                  | TTS, 52 sprekers                                                        | CC BY 4.0                | Woorden genereren; geen betrouwbare losse fonemen; kwaliteit wisselt.                                                                                                                         |
| **Piper `nl_BE-nathalie`**                    | TTS                                                                     | CC0 1.0                  | Zelfde dataset; woorden genereren; Belgisch accent.                                                                                                                                           |
| **Eigen opname**                              | 8–10 fonemen + 30 woorden                                               | Eigen                    | Beste kwaliteit en consistentie; 1–2 uur werk.                                                                                                                                                |

**Advies:**

- **Voor de MVP:** neem 8–10 letters op met één stem (leerkracht of logopedist), plus 30 woorden. Dat is minder werk dan een corpus cureren en geeft precies de klank die je wilt.
- **Voor een prototype:** gebruik Rhasspy Nathalie of Piper. Label het als prototype en vervang de audio voordat je het als eindproduct presenteert.
- **Als je per se een open set wilt:** Rhasspy Nathalie is de enige CC0-set met fonemale uitlijning die ik vond. De eerste letterreeks is ruim vertegenwoordigd; /œy/ is schaars (9 tokens). Test het accent en de knipkwaliteit.
- **Licentiehygiëne:** leg elke bron vast in `ATTRIBUTIONS.md`. CC0 vraagt geen attributie, maar bronvermelding is netjes; CC BY vraagt attributie; CC BY-SA vraagt share-alike; GPL vermijd je tenzij de app zelf GPL is.
- **Ontwerpontsnapping:** als losse fonemen te lastig zijn, maak **Klankvanger** (woord → eerste letter) de kern. Woordaudio is makkelijker te vinden. Modelleer de losse klank nog steeds met een mens of een korte opname.

### Voortgang

```text
letters.progress.v1
  per letter:
    exposures: number
    correct: number
    lastSeen: ISO date
    nextReview: ISO date
    stage: "nieuw" | "oefenen" | "bijna" | "vast"
```

- **Geen "fout"-status.** De app zegt "nog niet" of "bijna", niet "fout".
- **Mastery:** drie goede antwoorden in twee verschillende sessies, plus één goede na een week.
- **Review:** 1, 3, 7 en 14 dagen; fouten eerder. Geen gevalideerd SRS-algoritme.
- **Weergave:** "Deze letters ken je al" en "Deze letters komen terug". Geen percentages.
- **Ouder:** één regel per letter, geen dashboard met grafieken.

### Hergebruik in de app

| Bestaand                                   | Nieuwe bestemming                        |
| ------------------------------------------ | ---------------------------------------- |
| `libs/features/seek-and-find`              | Zoekveld voor Letterjacht                |
| `libs/features/memory-game`                | Basis voor Lettermemory                  |
| `libs/widgets/game-shell`                  | Frame voor de Letterronde                |
| `libs/features/math-trainer`               | Antwoordflow en feedbackpatroon          |
| `libs/entities/game/model/game-catalog.ts` | Nieuwe `available`-entry voor `/letters` |

De FSD-indeling blijft: `libs/entities/letter` voor data en pure regels, `libs/features/letter-game` voor de engine en de store, `libs/pages/letter` voor de sessie en de hub.

## Roadmap

| Fase              | Inhoud                                                                  | Waarom nu                                           |
| ----------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| **0. Content**    | 8–10 letters, klankopnames, 30–40 mkm-woorden, lettervolgordes          | Zonder goede audio en woorden is elk spel zwak      |
| **1. MVP**        | Letterronde, Klank & Letter, Letterjacht, Klankvanger, lokale voortgang | Drie kernvaardigheden, klein genoeg om te testen    |
| **2. Uitbreiden** | Woordlezen (gebouwd), Woordtrein, Lettermemory, Samen aan tafel         | Lezen van woorden, synthese, herhaling en de ouder  |
| **3. Verdiepen**  | Teken de Letter, Tweelingletters, Geheime Brief, Letterboek             | Motoriek, discriminatie, transfer en motivatie      |
| **4. Testen**     | 5–8 kinderen, twee sessies, observatie en ouderfeedback                 | Vaststellen of de lus werkt voordat je verder bouwt |

## Toetsen met kinderen

Geen effectclaim na een paar sessies. Wel kun je observeren:

- Begrijpt het kind de opdracht zonder uitleg van een volwassene?
- Welke letters en klanken worden verward?
- Hoe vaak wordt "luister nog eens" gebruikt?
- Stopt het kind zelf, of stopt het omdat de sessie klaar is?
- Wat vindt de ouder van de tip en de samenmodus?
- Duurt een sessie echt 5 minuten, of lijkt dat alleen zo?

Leg vooraf vast wat je observeert en gebruik geen "wetenschappelijk bewezen" in de communicatie. Een pilot met 5–8 kinderen is een ontwerptest, geen effectstudie.

## Open vragen

1. **Welke letterreeks wordt de standaard?** VLL Kim, VLL Zoem, Lijn 3 of een eigen startset. De ouder moet kunnen kiezen; de schoolmethode blijft leidend.
2. **Menselijke opnames of gecontroleerde TTS?** Losse consonanten zijn met TTS lastig; een leerkracht of logopedist is waarschijnlijk betrouwbaarder.
3. **Hoe groot is de eerste woordlijst?** 30–40 mkm-woorden is genoeg voor de eerste versie, mits de onsets eenduidig zijn.
4. **Is de oudermodus haalbaar?** Niet elke ouder is beschikbaar of leest Nederlands. De modus moet optioneel en audio-ondersteund zijn.
5. **Hoe voorkom je dat het Letterboek een verkapt puntensysteem wordt?** Alleen mastery, geen tijd of aanwezigheid.
6. **Welke letters zijn het eerst aan de beurt in de vrije modus?** De startset uit het methodiekonderzoek, of de reeks van school.
7. **Willen we een verhaal of alleen een dunne verzameling?** Verhaal kan afleiden; begin met het Letterboek en voeg pas een verhaal toe als de kern staat.
