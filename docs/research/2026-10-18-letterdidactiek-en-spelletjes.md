# Onderzoek: letterdidactiek en spelletjes voor groep 1–3

- **Datum:** 2026-10-18
- **Status:** Onderzoek, geen beslissing
- **Vraag:** welke didactiek en welke spelletjes of spelvormen zijn effectief of goed onderbouwd rondom het leren van letters, zowel in de klas als digitaal, en welke concrete spelmechanieken passen bij een statisch letter-spel voor kinderen van ongeveer 4–7 jaar?
- **Kader:** de regels uit `AGENTS.md` en [ADR 0001](../adr/0001-publieke-statische-spellen-app.md): publiek, statisch, alleen TypeScript, geen externe requests, geen backend, strikte CSP, mobile-first en touch-targets van minimaal 44 px.

**Leeswijzer.** Waar een uitspraak uit onderzoek komt, staat **[W]**. Waar het gaat om wet, kerndoelen, overheidsadvies of een publieke standaard, staat **[C]**. Waar het gaat om een commerciële methode, uitgever, app of praktijkbron, staat **[M]**. Bronnen zijn genummerd als `[S1]` en staan met URL en raadpleegdatum in de [bronnenlijst](#bronnen). Een `[M]`-bron is geen onafhankelijk bewijs van effectiviteit; die bronnen gebruik ik om didactiek, spelvormen en producten te beschrijven.

**Verwante documenten.** Dit rapport bouwt voort op [Letters leren op de basisschool](2026-10-18-letters-leren-basisschool.md). Dat document behandelt de kerndoelen, de lettervolgordes van VLL en Lijn 3, het tempo, de meta-analyses van digitale interventies en de eerste ontwerpimplicaties. Hier gaat het dieper op didactiek, spelvormen, spelmechanieken, motivatie, ontwikkeling en toegankelijkheid. Waar iets daar al staat, verwijs ik ernaar in plaats van het te herhalen.

## Kort advies

**Bouw geen "leuk letterquizje", maar een kleine didactische oefenmachine met één vaste lus: voordoen → zelf doen → uitleg → gespreid terug.**

- **De werkzame kern is de cyclus, niet het spel.** Expliciete modeling, een actieve respons, specifieke correctieve feedback en gespreide herhaling hebben meer onderbouwing dan badges, levels of een adaptief algoritme [S20][S24][S23][S26]. Gamification levert kleine effecten op, maar is geen vervanging van didactiek [S46][S47][S49].
- **Klank eerst, letternaam als hulp.** De hoofdtaak is: hoor een klank en kies de letter. Maar letternamen zijn niet schadelijk: gecombineerde naam-en-klankinstructie hielp in één experiment juist bij het leren van klanken [S18]. Het bewijs is niet eenduidig; sommige studies vinden meer groei bij één focus [S19]. Vermijd dus de valse tegenstelling "alleen klank" versus "alleen naam".
- **GraphoGame is het beste bewijs dat een digitaal letter-spel kan werken, én het bewijs dat het niet vanzelf werkt.** De meta-analyse over 19 studies naar woordlezen vond overall geen effect (g = −0,02), maar met veel begeleiding van een volwassene wél (g = 0,48) [S51]. Individuele gecontroleerde studies bij risicokinderen laten positieve resultaten zien [S52][S53].
- **Guided play, geen vrij speelbord.** Begeleid spel is effectiever dan vrij spel, maar het bewijs voor een specifiek voordeel bij letters is zwak [S22][S7]. Een app moet dus doelen, volgorde en feedback hebben; een open letterzandbak is onvoldoende.
- **De grootste didactische risico's zijn gokken, snelheid en audio.** Drie antwoordopties geven 33% kans op goed gokken; twee opties 50%. Een timer zet snelheid boven accuratesse. TTS die letters als namen uitspreekt ("em", "es") ondermijnt de klank-letterkoppeling [S15][S16].
- **MVP: drie modi, 8–10 letters, 5–8 minuten.** Klank–letter, letterjacht en luister-en-wijs. Daarna woordbouw, lettermemory en een samenspeelmodus. Traceren en verhaal zijn nice-to-have, geen kern. Kies de letters uit de methode van school of uit de startset in het [vorige rapport](2026-10-18-letters-leren-basisschool.md).
- **Wat je niet bouwt:** geen leaderboard, geen streaks met verlies, geen timer voor 4–6 jaar, geen TTS, geen 26 letters tegelijk, geen drag-only opdrachten, geen confetti tijdens de vraag, geen dyslexieclaim en geen methode-artwork [S13][S44][S51].

## 1. Didactische principes, met bewijssterkte

### 1.1 "Een letter kennen" is drie dingen

Een kind kan een letter **zien** (vorm), **benoemen** (naam) en **verklanken** (klank). Dat zijn drie verschillende vaardigheden, met verschillende oefenvormen. De vorige rapportage beschrijft dit al; hier is de didactische consequentie. De SLO-inhoudslijn en de tussendoelen plaatsen dit in de fase groep 1–3: spelen met klanken en symbolen, ontdekken dat letters met klanken corresponderen [S1][S2][S4]. De toolkit jonge kind noemt voor aanpakken rond beginnende geletterdheid een gemiddelde leerwinst van ongeveer vier maanden, waarbij gerichte begeleiding in kleine groepen met name effectief is [S5].

| Vaardigheid | Wat je oefent                                         | Geschikte opdracht                                                 | Onvoldoende                         |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| Lettervorm  | Visuele discriminatie: `m` versus `n`, `b` versus `d` | Zoek dezelfde letter, letterjacht, memory met verschillende vormen | Alleen een letter tonen en benoemen |
| Letternaam  | De naam van de letter: "em", "es"                     | "Welke letter is dit?" met audio                                   | Denken dat de naam de klank is      |
| Letterklank | Foneem-grafeemkoppeling: `/m/` hoort bij `m`          | Hoor de klank, kies de letter; woord bouwen                        | Alleen de vorm of naam oefenen      |

Voor decoderen is de **klank** het belangrijkst, maar de naam kan een geheugensteun zijn. De didactiek "klank eerst" betekent dus niet "naam nooit". Het betekent: de taak waarin het kind de klank gebruikt, is de kern; de naam is ondersteunend [S15][S16][S18].

### 1.2 De principes

De tabel hieronder is de ruggengraat van dit rapport. "Bewijssterkte" is mijn inschatting, geen formele GRADE-beoordeling:

- **Sterk:** meerdere meta-analyses of RCT's, ook in de doelgroep of direct daaraan grenzend.
- **Matig:** consistent bewijs, maar vooral bij oudere leerlingen of in klassikale context.
- **Zwak:** klein, indirect of niet gerepliceerd bewijs.
- **Indirect:** theoretisch goed onderbouwd, maar geen directe studies voor letters bij 4–7-jarigen.

| Principe                                        | Wat het is                                                                                       | Bewijs                                                                                                                                                                                                                                                                                                                         | Sterkte                                   | Wat het betekent voor een spel                                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Expliciete directe instructie**               | De volwassene doet voor, legt uit, begeleidt, controleert en laat dan zelfstandig oefenen [S20]. | Alfieri et al. (2011): onbegeleide ontdekking doet het slechter dan expliciete instructie (d = −0,38); verrijkte ontdekking met feedback en scaffolding doet het beter (d = 0,30) [S21].                                                                                                                                       | Sterk (klas), matig (app)                 | Begin elke nieuwe letter met een korte modeledemo, niet met een vraag. Houd de uitleg kort en laat het kind daarna meteen doen.             |
| **Klank vóór letter, letternaam ernaast**       | Eerst het foneem, dan het grafeem; de naam is een hulplabel.                                     | NRP: fonemisch bewustzijnstraining werkt (d = 0,86 op fonemisch bewustzijn; d = 0,53 op lezen; d = 0,59 op spelling), en training **met letters** was bijna twee keer zo effectief voor lezen als training zonder letters (d = 0,67 versus 0,38) [S15]. Gecombineerde naam-en-klankinstructie hielp bij klankverwerving [S18]. | Sterk (klank), matig (volgorde)           | De hoofdtaak is "hoor /m/, kies m". De letternaam mag je erbij zeggen, maar niet als enige vraag.                                           |
| **Modeling en voordoen**                        | Voordoen met mondstand, klank en letter; daarna samen, dan zelf.                                 | Rosenshine: modeling, guided practice en check for understanding zijn kernprincipes [S20]. Cognitieve belastingstheorie: voorbeelden en scaffolding helpen beginners [S27].                                                                                                                                                    | Matig                                     | Laat bij een nieuwe letter eerst een klein filmpje/animatie zien (2–5 s) met de mondstand en de letter, en vraag daarna meteen een respons. |
| **Correctieve, specifieke feedback**            | Niet alleen "goed/fout", maar uitleggen wát goed of fout was en waarom.                          | Van der Kleij et al. (2015): elaborated feedback d = 0,49; alleen goed/fout d = 0,05; alleen het juiste antwoord d = 0,32 [S26]. NRP noemt correctieve feedback als werkzaam element [S15].                                                                                                                                    | Sterk (algemeen), matig (4–7)             | "Je hoorde /m/. Dit is de m." + klank opnieuw + opnieuw proberen. Geen rood kruis, geen puntverlies.                                        |
| **Retrieval practice**                          | Het kind moet het antwoord uit het geheugen halen, niet alleen herkennen of napraten.            | Adesope et al. (2017): practice testing g = 0,61 overall; 0,51 tegen herlezen [S24].                                                                                                                                                                                                                                           | Sterk (oudere leerlingen), matig (4–7)    | De vraag moet een actieve keuze of productie vragen; een letter die al zichtbaar naast de klank staat, is geen retrieval.                   |
| **Gespreide herhaling**                         | Dezelfde letter op toenemende tussenpozen terug laten komen, niet in één blok.                   | Cepeda et al. (2006): spacing-effect over 839 metingen; de optimale tussenpoos hangt samen met de retentietijd [S23]. Kennisrotonde (2026): hoger tempo werkt alleen met herhalingsrondes [S8]. Jones & Reutzel (2012): distributed cycles of review in 13 kleuterklassen [S31].                                               | Sterk (verbaal geheugen), matig (letters) | Laat een letter terugkomen na 1, 3, 7 en 14 dagen; fouten eerder. Dit is een ontwerpregel, geen gevalideerd SRS-algoritme.                  |
| **Interleaving**                                | Verschillende letters door elkaar oefenen in plaats van één letter lang blokken.                 | Brunmair & Richter (2019): overall g = 0,42, maar voor woordenlijsten juist negatief (g = −0,39) [S25].                                                                                                                                                                                                                        | Matig, deels negatief                     | Introduceer een letter in een klein blok, maar meng hem daarna met bekende letters. Meng niet meteen 26 letters.                            |
| **Kleine stappen en lage cognitieve belasting** | Eén ding tegelijk; geen overbodige informatie; segmenteren.                                      | Sweller et al. (2019) [S27]; Mayer (2020): coherence, signaling, redundancy en segmenting [S28]; Harp & Mayer (1998): afleidende details schaden leren [S29].                                                                                                                                                                  | Sterk (theorie), matig (app)              | Eén vraag per scherm; geen achtergrondpatroon; geen muziek tijdens klanktaken; niet tegelijk letter, woord, plaatje en confetti.            |
| **Hoge responskans**                            | Veel korte beurten waarin het kind actief antwoordt.                                             | MacSuga-Gage & Simonsen (2015): class-wide opportunities to respond verbeteren gedrag en leeruitkomsten [S30]; Rosenshine: veel check-for-understanding [S20].                                                                                                                                                                 | Matig (klas), indirect (app)              | Elke 5–10 seconden een tik of keuze; geen lange animaties of passieve video's.                                                              |
| **Bewegend leren**                              | Leren terwijl je beweegt, of beweging als pauze.                                                 | Kennisrotonde (2023): kleine effecten op concentratie en leeropbrengsten; beweging en leren hoeven niet geïntegreerd te zijn; in Fit & Vaardig geen effect op lezen [S9]. Kennisrotonde (2024): geen negatieve effecten; positief als beweging en inhoud bij elkaar passen [S10].                                              | Zwak voor letters                         | Gebruik beweging als energiegever of als "beeld de letter uit", niet als vervanging van klank-letteroefening.                               |
| **Multisensorisch aanbod**                      | Klank, vorm, tast en beweging combineren.                                                        | Schlesinger & Gray (2017): geen voordeel van multisensorische boven gestructureerde instructie (N = 11) [S32]. Methodes claimen een positief effect [M].                                                                                                                                                                       | Zwak                                      | Tasten en kleien zijn leuk en kunnen de vorm verankeren, maar claim geen superieure didactiek.                                              |
| **Begeleid spel boven vrij spel**               | Een volwassene of de app geeft een doel, hints en feedback binnen een speelse context.           | Skene et al. (2022): guided play beter dan directe instructie voor vroege wiskunde (g = 0,24), vormkennis (g = 0,63) en task switching (g = 0,40); **geen significant verschil voor andere uitkomsten**, waaronder geletterdheid [S22]. Onderwijskennis: begeleid spel effectiever dan vrij spel; bewijs is beperkt [S7].      | Matig, niet letterspecifiek               | De app moet sturen: een doel per sessie, een vaste volgorde, hints en feedback. Niet een open speelbord zonder opdracht.                    |

### 1.3 Wat niet bewezen is

Dit is de belangrijkste correctie op veel marketing en op sommige methodeclaims:

| Claim                                         | Status                       | Wat de bronnen wel zeggen                                                                                                                                                                                                   |
| --------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Multisensorisch is superieur voor letters"   | **Niet ondersteund**         | Eén kleine studie vond geen voordeel boven gestructureerde instructie [S32]. Tactiel aanbod kan de vorm verankeren, maar vervangt de klank-letteroefening niet.                                                             |
| "Bewegend leren verhoogt de leesprestaties"   | **Niet ondersteund**         | Er zijn kleine effecten op concentratie en leeropbrengsten; in Fit & Vaardig geen effect op lezen [S9]. Beweging moet inhoudelijk passen om iets toe te voegen [S10].                                                       |
| "Adaptiviteit maakt een leesapp beter"        | **Gemengd**                  | De ene meta-analyse noemt adaptiviteit als kenmerk van succesvolle interventies [S54], de andere vindt weinig meerwaarde voor gamification en adaptiviteit [S55].                                                           |
| "Gamification verhoogt het leren"             | **Klein effect, heterogeen** | Sailer & Homner (2020): cognitief g = 0,49, motivationeel g = 0,36, gedrag g = 0,25; de motivationele en gedragseffecten waren minder stabiel [S46]. Wouters et al. (2013) vonden geen significant motivatievoordeel [S49]. |
| "Eén letter per week is de juiste aanpak"     | **Niet ondersteund**         | Een hoger tempo met herhalingsrondes lijkt effectiever; het ideale tempo is niet bekend [S8][S31].                                                                                                                          |
| "Letternamen zijn schadelijk; alleen klanken" | **Niet ondersteund**         | Gecombineerde naam-en-klankinstructie hielp bij klankverwerving [S18]; één focus kan op het geoefende domein meer groei geven [S19]. De waarheid is genuanceerder dan de slogan.                                            |
| "Een dyslexie-font helpt"                     | **Niet ondersteund**         | Kuster et al. (2018) en Azzarello et al. (2026) vinden geen betrouwbaar voordeel [S35][S36].                                                                                                                                |

### 1.4 De didactische lus

Elke nieuwe letter doorloopt in de app dezelfde vijf stappen. Dat is de concrete vertaling van de principes hierboven:

| Stap        | Wat de app doet                                                               | Duur    | Didactisch principe                       |
| ----------- | ----------------------------------------------------------------------------- | ------- | ----------------------------------------- |
| 1. Voordoen | Laat de mondstand zien, speel de klank, toon de letter, zeg de naam één keer. | 3–5 s   | Modeling, explicit instruction [S20][S27] |
| 2. Samen    | Eerste item met een hint: de juiste letter licht kort op.                     | 1 item  | Scaffolding, hoge succeskans [S21]        |
| 3. Zelf     | 3–5 items zonder hint, 3 opties.                                              | 30–60 s | Retrieval practice [S24]                  |
| 4. Uitleg   | Directe, specifieke feedback bij goed en fout.                                | 2–4 s   | Elaborated feedback [S26]                 |
| 5. Terug    | De letter komt terug in deze sessie en na 1, 3, 7 en 14 dagen.                | later   | Spacing, distributed review [S23][S31]    |

Die lus is belangrijker dan de keuze tussen "memory" of "multiple choice". De spelvorm is de verpakking; de lus is het leren.

## 2. Spelvormen in de klas

### 2.1 Wat een spelvorm wel en niet doet

Een klassikaal letterspel is zelden op zichzelf effectief. Het werkt omdat het een combinatie van werkzame ingrediënten levert: **herhaalde blootstelling, een actieve respons, sociale interactie en corrective feedback van een volwassene**. Ontbreekt een van die elementen, dan wordt het al snel "leuk, maar weinig leerzaam".

Deze tabel is daarom geen ranglijst van effectiviteit. Voor de meeste van deze spelvormen bestaat geen gecontroleerd onderzoek. Ik beschrijf wat ze oefenen, waarom ze in de praktijk werken, en waar ze didactisch tekortschieten. De concrete spelbeschrijvingen komen uit publieke praktijkbronnen [S70][S71][S72][S73][S74][S75][S76]; de didactische principes uit sectie 1.

### 2.2 Inventarisatie

De kolom "Oefent" gebruikt de vaardigheden uit sectie 1.1: vorm, naam, klank, analyse (hakken) en synthese (plakken). De groep is indicatief; een sterke kleuter kan meer aan, en een zwakke groep 3-leerling kan baat hebben bij eenvoudiger vormen.

| Spelvorm                                               | Oefent                                                    | Groep | Materiaal                                | Waarom het werkt (of niet)                                                       | Valkuil                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------- | ----- | ---------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Letterbingo**                                        | Vorm en naam; soms klank als de leerkracht de klank noemt | 2–3   | Bingokaarten, letterkaartjes of digibord | Herhaalde blootstelling en actieve vergelijking; sociaal en overzichtelijk [S75] | Alleen vorm/naam; de eerste die vol is wint, dus veel wachttijd; kinderen kunnen op goed geluk afstrepen.                        |
| **Lettermemory**                                       | Vorm; met audio erbij ook klank                           | 2–3   | Kaartparen                               | Herhaling, visuele discriminatie, beurt nemen                                    | Te veel kaarten doet een beroep op werkgeheugen; paren van identieke letters leren geen klank; zonder audio is het een vormspel. |
| **Lettermuur / letter van de week**                    | Vorm, naam, klank                                         | 1–3   | Wand, letterkaart, voorwerpen            | Visueel anker en klassikale referentie; kinderen kunnen er zelf naar verwijzen   | Eén letter per week is traag [S8]; de muur wordt behang; passieve blootstelling zonder respons.                                  |
| **Letters zoeken in de klas**                          | Vorm in context                                           | 2–3   | Briefjes, labels, loep                   | Transfer naar environmental print; beweging en nieuwsgierigheid                  | Te veel visuele ruis; geen feedback; vaak alleen hoofdletters.                                                                   |
| **Letterdans / rad van fortuin**                       | Vorm en naam; vlotheid                                    | 2–3   | Muziek, spinner, letterkaarten           | Beweging en snelle respons; veel plezier                                         | Snelheid boven accuratesse; chaotisch; per kind weinig items.                                                                    |
| **Letterhengelen**                                     | Vorm en fijne motoriek                                    | 1–2   | Magneetletters, hengel                   | Spelvorm en tast; oefent ook de fijne motoriek                                   | Het vissen kost tijd; weinig leeritems per minuut; magneetletters kunnen omdraaien.                                              |
| **Zand, scheerschuim, scheuren**                       | Vorm en fijne motoriek                                    | 1–2   | Zand, scheerschuim, papier               | Tactiel en foutloos; sensomotorische input; lage drempel                         | Geen klankkoppeling; klieder; meestal niet zelfstandig.                                                                          |
| **Kleien**                                             | Vorm en fijne motoriek                                    | 1–2   | Klei, letterkaarten                      | 3D-representatie; tast; het kind maakt iets tastbaars [S72]                      | Tijdrovend; geen decoding; volume en fijnmotorische drempel.                                                                     |
| **Letterkoekjes**                                      | Vorm en plezier                                           | 1–2   | Deeg, uitstekers                         | Betekenisvolle context en trots; thuisbetrokkenheid                              | Weinig herhaling; hygiëne en allergieën; geen klank.                                                                             |
| **Stempelen**                                          | Vorm                                                      | 1–2   | Stempels, stempelkaarten                 | Motorische herhaling en visueel resultaat                                        | Stempelen zonder klank; rommelig; vaak veel stempelen en weinig lezen.                                                           |
| **Kringspel (doorgeven, raden, wie heeft de letter?)** | Naam en klank                                             | 1–2   | Kaart of voorwerp                        | Sociaal, herhaling, beurt nemen                                                  | Veel wachttijd; weinig respons per kind; kans op gokken.                                                                         |
| **Bewegend leren (letterparcours, levende letters)**   | Vorm en naam                                              | 2–3   | Hoepels, kaarten, pionnen                | Aandacht en energie; associatie van beweging met letters [S74]                   | Organisatietijd; geen effect op lezen [S9]; te veel ruis.                                                                        |
| **Digibordspel**                                       | Vorm en klank                                             | 1–3   | Digibord                                 | Gedeelde aandacht en directe feedback                                            | Een paar kinderen doen mee; klassikaal gokken; geen differentiatie.                                                              |

**Samengevat.** De sterkst onderbouwde spelvormen zijn die waarin het kind een **klank aan een letter** moet koppelen en **directe feedback** krijgt: klank–letter, luister-en-wijs en woordbouw. Spelvormen die alleen de **vorm** oefenen (memory, kleien, stempelen, hengelen) zijn nuttig als voorbereiding en voor de motoriek, maar niet als kern van het leesonderwijs. Spelvormen met veel wachttijd of snelheid (bingo, kringspel, letterdans) zijn vooral motiverend; didactisch zijn ze minder efficiënt. Dat volgt uit de principes in sectie 1, niet uit gecontroleerd onderzoek naar elke afzonderlijke spelvorm.

### 2.3 Wat de klas kan en de app niet kan

De klas heeft drie voordelen die een statische app niet heeft:

1. **Een volwassene die de klank kan voordoen en corrigeren.** Dat is precies de moderator die in de GraphoGame-meta-analyse het verschil maakte [S51].
2. **Echte materialen en beweging.** Kleien, zand en een letterparcours geven tactiele en motorische input die een touchscreen niet geeft [S33][S34].
3. **Sociale interactie.** Samen spelen, beurt nemen en elkaar helpen zijn motiverend en oefenen taal.

De app moet die voordelen niet nabootsen. Hij moet ze **aanvullen**: korte, herhaalde, geïndividualiseerde oefening met zuivere audio en directe feedback. De app is het oefenmoment; de klas is de instructie en de rijke context.

### 2.4 Van klas naar scherm

| Klassieke vorm     | Digitale vertaling                                  | Wat je overneemt                | Wat je weglaat                              |
| ------------------ | --------------------------------------------------- | ------------------------------- | ------------------------------------------- |
| Letterbingo        | Letterjacht: vind de doelletter in een raster       | Zoeken en visuele discriminatie | Wachttijd en winnaar/verliezer              |
| Lettermemory       | Memory met letter en audio-kaart                    | Herhaling en omdraaien          | Grote kaartenvelden en werkgeheugenoverload |
| Letter van de week | Letterintro met korte cyclus en gespreide herhaling | Visueel anker                   | Eén letter per week als star schema         |
| Letters zoeken     | Letterjacht in een rustige scène                    | Context en zoeken               | Drukke achtergrond en veel ruis             |
| Letterdans         | "Beweeg mee"-pauze tussen twee opdrachten           | Energie en plezier              | Snelheid als score                          |
| Hengelen           | Tik de letter die je hoort                          | Klank-letterkoppeling           | Competitief vissen en motorische drempel    |
| Kleien             | Optioneel traceren met de vinger                    | Vorm en motoriek                | Claims dat dit superieur is                 |
| Kringspel          | Samenspeelmodus met ouder                           | Beurt nemen en praten           | Wachttijd in een grote groep                |

## 3. Digitale letter-spellen: wat bestaat er en wat is bewezen?

### 3.1 De producten

Ik heb de publieke productpagina's bekeken, niet alle apps zelf uitgespeeld. Beschrijvingen van mechanieken kunnen in de actuele versie afwijken. "Bewijs" betekent: wat ik aan publiek verifieerbaar onderzoek vond, niet wat de maker belooft.

| Product          | Maker/land                               | Wat het doet                                                                                                                                  | Didactiek                                             | Bewijs                                                                                                                                                                                                                                                                | Oordeel                                                                                             |
| ---------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **GraphoGame**   | GraphoLearn, Universiteit Jyväskylä (FI) | Letter-klankkoppeling, decoderen, vlotheid; adaptief; weinig afleiding; geen advertenties [S56]                                               | Systematische sound-symbol mapping, adaptief          | Meta-analyse (McTigue et al. 2019): 28 studies, 19 in de meta-analyse, overall g = −0,02; met veel volwassenbegeleiding g = 0,48 [S51]. Gecontroleerde studies bij risicokinderen: Saine et al. (2011, N = 166) en Kyle et al. (2013, 12 weken) positief [S52][S53].  | Best onderzocht. Werkt vooral met begeleiding en bij risicokinderen; geen zelfstandig wondermiddel. |
| **Letterprins**  | Radboud Universiteit / NL                | Verhaal in een kasteel; letters, woorden en zinnen; adaptief; ouder of verzorger beoordeelt hardop [S57][S58]                                 | Psycholinguïstisch, ouder-kindinteractie, adaptief    | Ontwerpartikel beschrijft de principes [S58]. De Radboud-projectpagina zegt dat de eerste versie (2013) wetenschappelijk is getest en van toegevoegde waarde was [S57]. Ik vond geen volledig peer-reviewed RCT-verslag.                                              | Didactisch interessant door ouderbetrokkenheid en adaptiviteit; bewijs nog dun.                     |
| **LetterSchool** | LetterSchool (internationaal)            | Letters traceren: tik de stippen, traceer, schrijf; sterren en levels; directe feedback [S59]                                                 | Visueel-motorisch, handschrift, directe correctie     | De maker beschrijft een studie met 125 kleuters in North Texas, 12 weken, 58 experimenteel/67 controle [S60]. Een kleine quasi-experimentele studie (n = 40) vond betere leesbaarheid dan controle, zonder verschil tussen apps [S61].                                | Sterk voor lettervorm en motoriek; niet voor klank of decoderen.                                    |
| **Duolingo ABC** | Duolingo (US)                            | Phonics, handschrift, sight words, verhalen; korte lessen [S62]                                                                               | Op NRP gebaseerde phonics                             | De site citeert een rapport van Education Development Center: na 9 weken 28% betere literacy-scores [S62]. Dat is een rapport in opdracht, geen peer-reviewed RCT.                                                                                                    | Leuk en uitgebreid; bewijs is maker-gedreven.                                                       |
| **Reading Eggs** | Blake eLearning (AU/UK)                  | Lessen, games, assessments, beloningen                                                                                                        | Phonics en sight words                                | Lowery (2017): action research met 31 tweedeklassers, 6 weken, 60 minuten per week; beschreven op de site van Reading Eggs [S63].                                                                                                                                     | Zwak bewijs; niet generaliseerbaar.                                                                 |
| **Squla**        | Squla (NL)                               | Quizzen en games voor peuters tot groep 8; 15.000 games in de onderbouw, 50.000 in totaal; ouderdashboard; adaptief [S64]                     | Gamification, directe feedback, adaptief              | De maker citeert Homer et al. (2018): 120 kinderen, beloningen hielpen alleen in groep 5–6, niet in groep 3–4; motivatie steeg wel. Bai et al. (2020): positief maar heterogeen. Broekman et al. (2021): zomerdip 7 → 4 punten, door Squla "40% beter" genoemd [S64]. | Platform, geen specifieke letterdidactiek; bewijs is indirect en deels door de maker samengevat.    |
| **Juf Jannie**   | Juf Jannie (NL)                          | Letters leren lezen, letters flitsen, beginletters; zelf letterreeks kiezen; eenmalige aankoop, geen advertenties, geen dataverzameling [S65] | Eenvoudige, auditive oefening; aansluiting bij school | Ik vond geen gepubliceerd effectonderzoek.                                                                                                                                                                                                                            | Dicht bij deze app: lokaal, eenvoudig, audio. Bewijs ontbreekt.                                     |
| **Poio**         | Kahoot! / Noorwegen                      | Verkennend lezen in een spelwereld; letters en klanken; adaptief; ouder leest het vrijgespeelde verhaal [S66]                                 | Spelend leren, adaptief                               | Ik vond geen peer-reviewed effectonderzoek.                                                                                                                                                                                                                           | Mooi spelconcept; bewijs ontbreekt.                                                                 |
| **Nessy**        | Nessy (UK)                               | Gestructureerde literacy, games, gericht op dyslexie [S67]                                                                                    | Systematic synthetic phonics                          | Een academische kritiek van de Universiteit Southampton (2026) vindt weinig gepubliceerd onderzoek naar Nessy; korte-termijneffecten positief, lange termijn onduidelijk; motivatie kan op termijn dalen [S68].                                                       | Vooral voor zwakke lezers; bewijs beperkt.                                                          |
| **Letterstart**  | Letterstart (NL)                         | Rustige, audio-gedreven letterspelletjes voor 4–7; gratis, geen advertenties, geen in-app aankopen [S69]                                      | Klank en letter, eenvoudig                            | Ik vond geen onderzoek.                                                                                                                                                                                                                                               | Vergelijkbaar concept; nog geen bewijs.                                                             |

### 3.2 GraphoGame: de best onderzochte case

De meta-analyse van McTigue et al. (2019) is om drie redenen belangrijk:

1. **Het overall effect is nul.** Over 19 studies naar woordlezen was g = −0,02. Dat betekent niet dat GraphoGame niet werkt; het betekent dat de gemiddelde implementatie geen meetbaar voordeel opleverde boven de controleconditie [S51].
2. **Volwassenbegeleiding is de enige significante moderator.** Studies met veel interactie met een volwassene hadden gemiddeld g = 0,48. Taalcomplexiteit en duur van de interventie waren geen significante moderatoren [S51].
3. **Individuele gecontroleerde studies kunnen positief zijn.** Saine et al. (2011) vonden bij 166 Finse zevenjarigen met leesrisico dat computerondersteunde remedial reading met letter-naam- en letter-klanktraining sterk positief was, terwijl reguliere remedial reading minder succesvol was [S52]. Kyle et al. (2013) vonden bij 6–7-jarigen die zwak leesden dat twaalf weken GraphoGame Rime of Phoneme, vijf sessies per week, leidde tot winst in lezen, spelling en fonologische vaardigheden ten opzichte van een onbehandelde controlegroep; de winst bleef na vier maanden [S53].

De les is niet "GraphoGame werkt" of "GraphoGame werkt niet". De les is: **een digitaal letter-spel werkt in een gestructureerde context, met begeleiding, bij kinderen die oefening nodig hebben**. Dat sluit aan bij wat Verhoeven et al. (2022) uit de GraphoGame-literatuur overnemen: interactie met een volwassene doet ertoe [S54].

### 3.3 Wat de andere producten beweren

De commerciële apps zijn lastig te vergelijken omdat ze verschillende dingen meten:

- **LetterSchool** meet vooral handschrift en fijne motoriek, niet lezen. De studie met 125 kleuters is positief, maar de maker noemt geen peer-reviewed publicatie of auteurs [S60]. De kleine studie uit 2025 (n = 40) is quasi-experimenteel en verscheen in een laagdrempelig tijdschrift [S61]. Voor de vraag "leert een kind hier letters van lezen?" is dat onvoldoende.
- **Duolingo ABC** meet "literacy scores" na 9 weken in een rapport van EDC. De 28% is een relatieve verbetering, geen absoluut percentage en geen bewijs dat het kind beter leest dan met een andere goede methode [S62].
- **Reading Eggs** baseert zich op een action research met 31 kinderen en 6 weken, gepubliceerd als proefschrift en samengevat op de eigen site [S63]. Dat is zwak bewijs: kleine steekproef, korte duur, geen onafhankelijke replicatie.
- **Squla** citeert een reeks studies, maar de "40% beter" is een relatieve afname van de zomerdip (7 → 4 punten), geen 40% leervinst [S64]. De studies zijn deels in samenwerking met Squla uitgevoerd en worden op de eigen site samengevat.
- **Nessy** is een van de weinige producten waar een externe academische kritiek bestaat. Die concludeert dat er weinig gepubliceerd onderzoek is, dat korte-termijneffecten positief kunnen zijn, maar dat lange-termijnonderzoek ontbreekt [S68].
- **Juf Jannie, Poio en Letterstart** hebben voor zover ik kon vinden geen gepubliceerd effectonderzoek. Dat maakt ze niet slecht; het betekent dat de didactiek op papier moet kloppen en dat je geen effectclaim kunt doen.

### 3.4 Marketingclaims versus onderzoek

| Claim                        | Wat je kunt verifiëren                                            | Wat ontbreekt                                                                           |
| ---------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| "Wetenschappelijk bewezen"   | Er is een studie, een rapport of een meta-analyse                 | Onafhankelijkheid, peer review, replicatie, en of de uitkomst "lezen" of "motivatie" is |
| "Meest onderzochte leesgame" | GraphoGame heeft veel publicaties en een eigen meta-analyse [S51] | De meta-analyse is overall nul; volume is geen effect                                   |
| "Adaptief"                   | Het algoritme past items aan                                      | Bewijs dat adaptiviteit beter is dan een vaste goede volgorde [S55]                     |
| "28% betere leesvaardigheid" | Een rapport in opdracht [S62]                                     | Absolute versus relatieve groei, controlegroep, duur, onafhankelijkheid                 |
| "40% minder zomerdip"        | 7 → 4 punten op een rekentoets [S64]                              | Dat is een relatieve reductie; het gaat om rekenen, niet om letters                     |
| "Dyslexie-app"               | Gericht op zwakke lezers [S68]                                    | Onafhankelijk lange-termijnbewijs                                                       |

### 3.5 Wat je hieruit overneemt

1. **Begeleiding is geen nice-to-have.** De sterkste moderator in de GraphoGame-meta-analyse is volwasseninteractie [S51]. Bouw dus een ouder/verzorger-modus, ook als de app alleen speelbaar blijft.
2. **Risicokinderen kunnen het meest profiteren.** De positieve studies richten zich op kinderen met een leesrisico [S52][S53]. Een app voor alle kinderen moet differentiëren zonder te labelen.
3. **Meet letterkennis, niet alleen woorden.** GraphoGame meet woordlezen; voor een letter-spel zijn letterklank en letterherkenning de primaire uitkomsten.
4. **Wees terughoudend met effectclaims.** Geen enkele commerciële app die ik bekeek heeft een onafhankelijke, gerepliceerde RCT voor Nederlandse kinderen van 4–7.

## 4. Spelmechanieken: wat werkt, wat is riskant

### 4.1 De mechanismen

Een **spelvorm** is de klassikale activiteit (bingo, memory, kringspel). Een **mechanic** is de interactie op het scherm (tikken, slepen, omdraaien, traceren). Dezelfde mechanic kan in een goede of een slechte spelvorm zitten; de didactische waarde hangt af van wat het kind moet doen en welke feedback het krijgt.

| Mechanic                         | Oefent                            | Didactisch waardevol als                                                    | Risico                                                                                                        | Ontwerpregel                                                                                                      |
| -------------------------------- | --------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Multiple choice (3–4 opties)** | Herkenning, klank-letterkoppeling | De afleiders lijken op de juiste letter en de vraag vraagt een echte keuze  | Gokken: 33% bij 3 opties, 50% bij 2; herkenning is zwakker dan productie                                      | Minimaal 3 opties; afleiders uit dezelfde letterfamilie; geen score voor snelheid; bij fout opnieuw laten horen   |
| **Drag-and-drop**                | Matchen, woord bouwen             | De sleepafstand groot is en er een tap-alternatief is                       | Motoriek en accuratesse bij jonge kinderen; per ongeluk laten vallen; WCAG 2.5.7 vraagt een alternatief [S13] | Tik-eerst, sleep-optioneel; grote doelen; altijd een "tik om te kiezen, tik om te plaatsen"-route                 |
| **Memory**                       | Visuele vorm, werkgeheugen        | Er audio op de kaart zit en de paren letter-klank of klein-hoofdletter zijn | Werkgeheugenoverload; identieke vormen matchen leert geen klank                                               | 6–8 kaarten; audio bij elke flip; geen timer                                                                      |
| **Matchen letter–plaatje**       | Beginnende klank, betekenis       | De eerste klank eenduidig is en de plaatjes niet raadbaar                   | Ambigue plaatjes; gokken op visuele cues; `sch`, `ch`, `ij/ei`                                                | Alleen eenduidige onsetten; audio; 3 opties; geen `schaap` voor /s/                                               |
| **Traceren**                     | Lettervorm, fijne motoriek        | Het kind echt overtrekt met startpunt en richting                           | Valse precisie; touchscreen is niet hetzelfde als papier; frustratie                                          | Brede baan; startdot; richting; geen straf voor afwijking; na 3 pogingen voordoen; verwijs naar papier [S33][S34] |
| **Luisteren en klikken**         | Foneemdiscriminatie, klank-letter | De audio kort en zuiver is en er een herhaalknop is                         | Audio-afhankelijkheid; TTS met letternamen; slechthorende kinderen                                            | Menselijke opnames; replay; visuele fallback; geen audio-only vraag zonder visueel antwoord                       |
| **Woord bouwen**                 | Synthese, decoderen               | Pas na 4–5 letters; mkm-woorden; audio als model                            | Te vroeg; cognitieve overload; lange woorden                                                                  | Alleen klankzuivere mkm-woorden; audio model; letters slepen of tikken; fout → segmenteren                        |
| **Timed challenge**              | Vlotheid, automatische herkenning | Het kind de letters al kent en de timer optioneel is                        | Snelheid boven accuratesse; angst; meer fouten                                                                | Geen timer voor 4–6; voor 6–7 alleen als "rustig" en "vlot" apart; accuratesse eerst                              |
| **Streaks, badges, levels**      | Motivatie, volhouden              | De beloning aan mastery hangt, niet aan tijd of aanwezigheid                | Extrinsieke beloning ondermijnt intrinsieke motivatie; verliesangst; beloning voor verkeerd gedrag [S44]      | Geen verlies; geen leaderboard; mastery-badges; geen badge voor "10 minuten gespeeld"                             |
| **Narratief/verhaal**            | Betekenis, betrokkenheid          | Het verhaal dun blijft en de oefening centraal staat                        | Seductive details; lange animaties; verhaal overschaduwt leren [S29]                                          | 1–2 schermen context per sessie; geen video's; overslaan mogelijk                                                 |
| **Verzamelen**                   | Motivatie, terugkomen             | Het verzamelen aan beheerste letters of verhalen hangt                      | Verzamelen om het verzamelen; drukte; verliesangst                                                            | Collectie per beheerste letter; geen tijdelijke items; geen ruilhandel                                            |

### 4.2 De grootste valkuilen

**Gokken.** Een kind dat bij drie opties één letter aantikt, heeft 33% kans op succes zonder de klank te kennen. Als de app dat als "goed" telt, leert de app het kind dat gokken loont. Twee opties zijn nog erger: 50%. Daarom: minimaal drie opties, afleiders die didactisch zinvol zijn, en een fout die altijd een korte uitleg en een nieuwe poging oplevert. Een goed antwoord op één vraag is bovendien geen bewijs van beheersing; gebruik meerdere items en gespreide terugkomst [S24][S23].

**Snelheid boven accuratesse.** Een timer verandert de taak: het kind gaat sneller en maakt meer fouten. Voor vlotheid is tempo zinvol, maar pas als de letter al redelijk bekend is. Voor 4–6 jaar is een timer bijna altijd een verkeerde keuze. Bouw dus twee modi: "rustig" (geen tijd) en "vlot" (optioneel, voor gevorderden).

**Belonen voor verkeerd gedrag.** Een badge voor "10 minuten gespeeld" of een streak voor "elke dag ingelogd" beloont aanwezigheid, niet leren. Een kind kan de app opensen en weer sluiten. Beloon liever **mastery**: een letter die na een week nog goed gaat, levert een nieuwe letter of een verhaalfragment op.

**Fouten zijn leerzaam, maar niet gratis.** Metcalfe (2017) laat zien dat fouten in een veilige leersituatie kunnen helpen, mits ze direct gecorrigeerd worden [S37]. Voor beginnende lezers betekent dat niet "zo veel mogelijk fouten uitlokken": een kind van 5 dat vaak gokt, leert vooral dat gokken soms werkt. Houd de foutmarge laag, corrigeer meteen en laat het kind opnieuw proberen.

**Cognitieve overload.** Een scherm met een bewegende achtergrond, een mascotte, een letter, een woord, een plaatje, confetti en een voice-over is te veel. Mayer's coherence- en redundancy-principes zeggen: verwijder alles wat niet nodig is [S28][S29]. Eén vraag, één audio, drie antwoorden.

**Drag-only.** Voor jonge kinderen en voor kinderen met een motorische beperking is slepen moeilijker dan tikken. WCAG 2.2 vereist een alternatief voor dragging movements [S13]. Bouw dus altijd een tikroute.

**TTS met letternamen.** Dit is een inhoudelijke fout, geen stemmingskwestie. Een TTS die "m" als "em" uitspreekt, leert het kind de naam, niet de klank. Gebruik korte, gecontroleerde opnames [S15][S16].

**Eindeloos herhalen zonder retrieval.** Een kind dat dezelfde letter 20 keer ziet met de klank erbij, leert herkennen, niet ophalen. Wissel af: zien, horen, kiezen, bouwen, traceren.

### 4.3 Hoe je "actief" meet zonder analytics

Je hoeft geen analytics te bouwen om te weten of een sessie actief was. Lokaal kun je per sessie bijhouden:

- aantal items en aantal goede antwoorden;
- welke letters fout gingen en of de tweede poging goed was;
- of een letter na 1, 3, 7 en 14 dagen nog goed gaat;
- hoe vaak "luister nog eens" is gebruikt (een signaal van onzekerheid);
- of het kind zelf stopt of de sessie afmaakt.

Die gegevens blijven in `localStorage`. Ze zijn voor het kind en de ouder, niet voor een dashboard of een ranking.

## 5. Motivatie en spelbeleving

### 5.1 Zelfdeterminatietheorie

Ryan en Deci onderscheiden drie basisbehoeften: **autonomie**, **competentie** en **verbondenheid** [S43]. Voor een letter-spel betekent dat:

| Behoefte      | Wat het kind nodig heeft          | Concrete app-keuze                                                  | Wat je vermijdt                                               |
| ------------- | --------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| Autonomie     | Zelf kiezen en zelf stoppen       | Kies een letter-set of modus; grote stopknop; geen dwingende streak | Automatisch doorgaan; "nog één ronde" die niet te weigeren is |
| Competentie   | Ervaren dat je het kunt           | Succesvolle items, hints, mastery-feedback                          | Te moeilijke start; rode kruizen; vergelijking met anderen    |
| Verbondenheid | Samen met een ouder of leerkracht | Samenspeelmodus; ouder-tip na de sessie                             | Een app die het kind alleen laat                              |

### 5.2 Beloningen: het overjustification-debat

De klassieke bevinding is dat **tastbare beloningen de intrinsieke motivatie kunnen ondermijnen** als de taak al interessant is (overjustification) [S44]. Deci, Koestner en Ryan vonden in hun meta-analyse een substantieel ondermijnend effect van tastbare beloningen; verbale feedback en niet-controleerde beloningen deden dat veel minder [S44][S45]. Cameron en Pierce betwistten dat eerder, maar Deci et al. weerlegden die analyse [S45].

Voor een letter-spel is de praktische conclusie:

- **Geen munten, fiches of "koop"-systemen** als hoofd motivatie.
- **Wel informatieve feedback**: "Je hoorde /m/ en koos de m. Dat klopt." Dat is competentie-ondersteunend. Procesgerichte feedback ("je luisterde goed") werkt beter dan persoonsgerichte feedback ("je bent slim"), die bij tegenslag juist kan ondermijnen [S50].
- **Wel een verzameling** die aan mastery hangt: elke beheerste letter ontgrendelt een nieuw dier, een stukje verhaal of een letterkaart. Dat is een **informatieve** beloning, geen controle.
- **Geen verlies**: een streak die reset, een badge die verdwijnt of een level dat zakt, maakt van leren een verliesavontuur. Voor 4–7 is dat onnodige druk.

### 5.3 Gamification: klein en heterogeen

De meta-analyse van Sailer en Homner (2020) vond kleine positieve effecten: cognitief g = 0,49, motivationeel g = 0,36, gedrag g = 0,25. De motivationele en gedragseffecten waren minder stabiel dan het cognitieve effect [S46]. Bai et al. (2020) vinden eveneens een positief maar heterogeen beeld [S47]. Wouters et al. (2013) vonden in hun meta-analyse van serious games een leereffect van d ≈ 0,29, maar **geen significant motivatievoordeel** [S49]. Clark et al. (2016) vinden dat digitale games beter leren dan niet-gamecondities (g = 0,33), en dat **ontwerp** belangrijker is dan het medium [S48].

Dat betekent: gamification is een hefboom, geen fundament. Een goed ontworpen oefening met eenvoudige voortgang kan beter zijn dan een uitgebreid beloningssysteem met een zwakke didactiek.

### 5.4 Flow en uitdaging

Flow ontstaat bij een goede balans tussen uitdaging en vaardigheid. Voor een kind van 4–7 is die balans fragiel: te moeilijk → frustratie, te makkelijk → verveling. De app moet daarom:

- de moeilijkheid per letter aanpassen, niet per level;
- na twee fouten een hint geven;
- na drie goede antwoorden een iets moeilijker item;
- nooit een heel level opnieuw laten doen na één fout;
- de sessie laten eindigen terwijl het nog leuk is.

### 5.5 Zonder accounts, analytics of externe requests

De app-regels zijn hier een voordeel, geen beperking:

- **Geen sociale vergelijking.** Geen leaderboard, geen "je vrienden deden het beter", geen klasgenoten.
- **Geen pushnotificaties.** Geen streak die vraagt om terug te komen.
- **Geen cloudprofiel.** Voortgang in `localStorage`; een kind kan op elk apparaat opnieuw beginnen zonder dataverlies voor anderen.
- **Geen tracking.** Je kunt niet meten hoeveel tijd een kind besteedt; je kunt wel lokaal bijhouden welke letters geoefend zijn.
- **Oudertip in de app.** Na de sessie één concrete tip: "Noem de /m/ nog eens en laat je kind de letter op papier schrijven." Dat versterkt de volwassenbetrokkenheid die in de meta-analyse een moderator was [S51].

## 6. Leeftijd en ontwikkeling

### 6.1 Drie profielen

Dit zijn geen harde grenzen. Kinderen verschillen sterk, en de school bepaalt de overgang. De profielen zijn bedoeld om de **moeilijkheid en toon** per leeftijd te kiezen.

|                               | **4–5 jaar (groep 1)**                                                                                                                                                                                                                                                                        | **5–6 jaar (groep 2)**                                                    | **6–7 jaar (groep 3)**                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Aandacht**                  | Kort en sterk interesse-afhankelijk; enkele minuten tot ongeveer 5–10 minuten bij een aantrekkelijke taak (ontwerpinschatting). Er is geen betrouwbare rekenregel "aandachtsspanne = 3–5 minuten per jaar"; de volgehouden aandacht groeit in deze jaren en hangt sterk af van de taak [S41]. | Iets langer, maar nog steeds kort; afwisseling nodig.                     | Iets langer dan in groep 2; voor dit spel is 5–8 minuten genoeg.     |
| **Fijne motoriek**            | Grove greep; kan lijnen en cirkels natekenen; letters natrekken is nog moeilijk [S38].                                                                                                                                                                                                        | Driepuntsgreep ontwikkelt; kan eenvoudige letters schrijven [S38].        | Schrijft letters, maar grootte en verhouding wisselen nog [S38].     |
| **Letterkennis**              | Sommigen kennen letters van hun eigen naam; nog geen systematische letterkennis [S17][S16].                                                                                                                                                                                                   | Velen kennen een deel van de letters en klanken; grote verschillen [S17]. | De meesten kennen de letters; formeel leesonderwijs start [S1][S16]. |
| **Zelfregulatie**             | Heeft stap-voor-stap begeleiding nodig; kan nog niet lang zelfstandig [S39][S40].                                                                                                                                                                                                             | Kan 2–3 stappen onthouden; heeft nog begeleiding nodig [S39].             | Kan een korte zelfstandige taak doen en om hulp vragen [S39][S40].   |
| **Passende spelvormen**       | Klank beluisteren, letter aanwijzen, zoeken, memory met 4–6 kaarten, kleien en zand.                                                                                                                                                                                                          | Klank–letter kiezen, memory, letterjacht, woordbouw met 4–5 letters.      | Decoderen, woordbouw, vlotheid, optioneel traceren.                  |
| **Te moeilijk of te schools** | Decoderen, spelling, lange sessies, timers, twee-keuzevragen, werkbladen.                                                                                                                                                                                                                     | Lange woorden, spellingregels, toetsdruk, klassikale wedstrijdjes.        | Complexe spelling, lange teksten, prestatiedruk.                     |

### 6.2 Wat te schools is voor groep 1–2

De vorige rapportage beschrijft de spanning al: groep 1–2 is een fase van spel en brede ontwikkeling, groep 3 is schoolser [S11]. SLO noemt de inhoudskaarten voor het jonge kind bovendien expliciet **aanbodsdoelen**: een richting, geen verplichte leerstof per jaar [S3]. De volgende dingen horen niet in een app voor 4–6:

- **Een formeel lesschema** met "les 1, les 2" en een verplichte volgorde.
- **Toetsen of percentages.** Een kind van 5 hoeft niet te weten dat het 60% scoort.
- **Woorden lezen voordat de letters gekend zijn.** Dat is decoderen zonder bouwstenen.
- **Lange sessies.** 5–8 minuten is genoeg; liever dagelijks kort dan één keer lang.
- **Prestatietaal.** Geen "achterstand", "niveau", "je moet nog", "fout". Gebruik "nog niet", "probeer nog eens", "bijna".
- **Een leaderboard of competitie.** Voor deze leeftijd is samen spelen leuker en veiliger dan winnen.

### 6.3 Ontwerpprincipes per leeftijd

**4–5 jaar.** Oorzaak-gevolg en succes voorop. Grote knoppen, weinig tekst, veel audio, drie opties, geen timer. De app mag letters laten zien en horen, maar hoeft ze niet te laten schrijven. "Wat hoort bij elkaar?" is genoeg.

**5–6 jaar.** Nu kan de klank-letterkoppeling centraal staan. Memory, letterjacht en eenvoudige woordbouw met vier of vijf letters. Nog geen lange woorden en geen spellingregels. De app mag uitdagen, maar moet na twee fouten een hint geven.

**6–7 jaar.** Decoderen en woordbouw. Een optionele vlotheidsmodus voor kinderen die de letters al kennen. Traceren kan, maar is geen hoofddoel. De app moet aansluiten bij de methode van school; de ouder kan de letterreeks kiezen.

## 7. Inclusie en toegankelijkheid

### 7.1 Kleurenblindheid

Ongeveer 1 op de 12 mannen heeft een kleurzienstoornis [S77]. Voor een letter-spel betekent dat:

- **Nooit kleur als enige signaal.** Gebruik vorm, label, patroon of positie.
- **Klinkers en medeklinkers niet alleen met rood/blauw onderscheiden.** Als je kleur gebruikt, voeg een tweede signaal toe (bijvoorbeeld een streepje of een letterfamilielabel).
- **Contrast controleren.** Tekst minimaal 4,5:1; niet-tekstuele elementen minimaal 3:1 [S13].
- **Niet vertrouwen op "rood is fout, groen is goed".** Gebruik een icoon, tekst en audio.

### 7.2 Dyslexie en lettervorm

- **Geen dyslexie-font als oplossing.** Voor kinderen met en zonder dyslexie is geen betrouwbaar voordeel aangetoond [S35][S36].
- **Wel een schoon, ruim sans-serif** met duidelijke `a`, `g`, `t` en `l`; geen cursief; geen decoratieve letters.
- **Grote letters en ruime regelafstand.** Voor losse letters is eenvoud belangrijker dan een speciaal font.
- **Audio ondersteunt, maar vervangt niet.** Een kind met dyslexie heeft baat bij expliciete klank-letterinstructie en veel herhaling; de app is geen behandeling [S12].

### 7.3 Motorische beperking

- **Touch-targets minimaal 44 px** (app-regel), ruimer dan de WCAG-minimum van 24 px [S13].
- **Geen drag-only.** Tikken om te kiezen en tikken om te plaatsen is de standaard; slepen is een extra.
- **Geen precisie-traceren als toegangspoort.** Traceren is optioneel; de letter hoeft niet perfect binnen de lijnen.
- **Grote afstanden tussen antwoorden.** Voorkom mis-taps; gebruik geen kleine lettertjes in de hoek.
- **Werken met een stylus mogelijk maken**, maar niet vereisen.

### 7.4 Anderstalige kinderen en NT2

- **Ga niet uit van Nederlandse woordenschat.** Gebruik plaatjes en audio; vermijd idiomen en woorden die alleen in een Nederlandse context bekend zijn.
- **Letternamen kunnen in een andere taal anders zijn.** Een kind dat al een ander schrift kent, kan letters herkennen maar de klank nog niet kennen. De app moet klank en letter scheiden.
- **Letternaam-instructie kan juist helpen.** In een studie bij peuters en kleuters werd letternaam-instructie genoemd als mogelijk voordeel voor kinderen die het Engels als tweede taal leerden [S19]. Dat pleit voor een rustige uitleg waarin naam en klank allebei aan bod komen, niet voor extra tempo.
- **Geef de ouder de keuze** uit een letterreeks die bij school past; anders oefent het kind een andere volgorde dan de klas.

### 7.5 Spraak- en taalproblemen, slechthorendheid

- **Spraak-/taalstoornissen hangen samen met latere leesproblemen.** Pennington en Bishop beschrijven de overlap tussen spraak-, taal- en leesstoornissen [S42]. Extra herhaling en expliciete klankinstructie zijn dan belangrijk; de app mag geen diagnose stellen.
- **Vraag niet om een hardop antwoord.** Een kind met een spraakprobleem moet kunnen aanwijzen of tikken. "Zeg het eens na" is een optie, geen eis.
- **Audio-only is ontoegankelijk voor slechthorende kinderen.** Geef altijd een visueel alternatief: de letter, een plaatje, of een ouder die de klank voordoet. Een video met mondstand is nuttig, maar niet voldoende zonder tekst/letter.
- **Eén stem, geen achtergrondmuziek.** Voor kinderen met een taalstoornis is spraak in ruis extra moeilijk.

### 7.6 Checklist

| Aspect              | Eis                                                                        | Bron                                        |
| ------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| Contrast tekst      | Minimaal 4,5:1                                                             | [S13]                                       |
| Contrast niet-tekst | Minimaal 3:1                                                               | [S13]                                       |
| Touch-target        | Minimaal 44 px (app), WCAG-minimum 24 px                                   | [S13] + `AGENTS.md`                         |
| Drag                | Altijd een tik-alternatief                                                 | [S13] (2.5.7)                               |
| Kleur               | Nooit als enige signaal                                                    | [S13][S77]                                  |
| Beweging            | `prefers-reduced-motion` respecteren                                       | [S14]                                       |
| Audio               | Herhaalbaar, geen autoplay bij laden, visuele fallback                     | [S13]                                       |
| Tekst               | Sans-serif, kleine letters, ruime spatiëring; geen dyslexie-font als claim | Ontwerpkeuze; [S35][S36] voor het fontdebat |
| Feedback            | Kort, specifiek, geen rood kruis, geen puntverlies                         | [S26]                                       |
| Tijd                | Geen timer standaard; pauzeerbaar                                          | [S8][S11]                                   |

## 8. Concreet ontwerpvoorstel

### 8.1 Prioriteiten

| Prioriteit | Modus                  | Waarom nu                                                           |
| ---------- | ---------------------- | ------------------------------------------------------------------- |
| **Must**   | 1. Klank–letter        | De kern van decoderen: foneem → grafeem [S15][S17]                  |
| **Must**   | 2. Letterjacht         | Visuele discriminatie en herkenning, laagdrempelig [S31]            |
| **Must**   | 3. Luister en wijs     | Fonemisch bewustzijn en beginletter [S15][S6]                       |
| **Should** | 4. Woordbouw           | Synthese en elementaire leeshandeling, pas na 4–5 letters [S1][S15] |
| **Should** | 5. Lettermemory        | Herhaling en visuele vorm, met audio [S31]                          |
| **Should** | 6. Samen met een ouder | De moderator die in onderzoek het verschil maakt [S51]              |
| **Nice**   | 7. Teken de letter     | Motoriek en vorm, optioneel [S33][S34]                              |
| **Nice**   | 8. Letterverhaal       | Betrokkenheid en context, dun houden [S29]                          |

### 8.2 De modi

#### 1. Klank–letter (must)

- **Doel:** het kind hoort een foneem en kiest de bijbehorende kleine letter.
- **Mechanic:** audio-prompt, drie lettertegels, tik.
- **Wat het kind doet:** luistert, vergelijkt, tikt.
- **Goed-feedback:** de letter groeit kort, de klank klinkt opnieuw, "Ja, /m/. Dit is de m." Daarna volgende item.
- **Fout-feedback:** "Dit is de m. Luister: /m/." De juiste letter licht op, de klank klinkt opnieuw, het kind probeert nog eens. Geen rood kruis.
- **Voortgang:** per letter een teller; drie goede antwoorden in twee verschillende sessies, daarna gespreide terugkomst.
- **Waarom:** dit is de directe vertaling van de foneem-grafeemkoppeling [S15][S17]. Retrieval practice [S24] en elaborated feedback [S26] zitten in de lus.
- **Valkuil:** TTS die "em" zegt; twee opties; afleiders die visueel te verschillend zijn; een letter meteen als "beheerst" markeren.

#### 2. Letterjacht (must)

- **Doel:** de visuele vorm van een letter herkennen tussen andere letters.
- **Mechanic:** een raster van 6–9 letters; bovenaan de doelletter en de klank; tik de doelletter aan.
- **Wat het kind doet:** zoekt, vergelijkt, tikt.
- **Goed-feedback:** de doelletter pulseert, de klank klinkt, een nieuwe ronde.
- **Fout-feedback:** "Kijk naar de vorm: de m heeft twee bogen." De doelletter licht kort op; geen straf.
- **Voortgang:** aantal gevonden letters; geen timer; moeilijkheid via aantal en gelijkenis van afleiders.
- **Waarom:** visuele discriminatie en herhaalde blootstelling [S31]. Het is een goede voorbereiding op vlot lezen.
- **Valkuil:** `b` en `d` meteen samen; drukke achtergrond; alleen vorm en geen klank; te veel letters.

#### 3. Luister en wijs (must)

- **Doel:** de begin-, midden- of eindklank van een woord herkennen.
- **Mechanic:** audio van een woord, drie plaatjes of letters, tik.
- **Wat het kind doet:** luistert, analyseert, kiest.
- **Goed-feedback:** het woord wordt in klanken herhaald, de letter verschijnt.
- **Fout-feedback:** het woord wordt langzamer herhaald en gesegmenteerd; de eerste klank wordt benadrukt.
- **Voortgang:** per positie (begin, midden, eind) en per klank.
- **Waarom:** fonemisch bewustzijn is een van de sterkste voorspellers en training met letters werkt beter [S15][S6].
- **Valkuil:** ambigue plaatjes; woorden met `sch`, `ch`, `ij/ei`; regionale uitspraak; te veel woordenschat tegelijk.

#### 4. Woordbouw (should)

- **Doel:** losse klanken samenvoegen tot een klankzuiver woord.
- **Mechanic:** audio-model, letters tikken in vakjes, het woord klinkt.
- **Wat het kind doet:** luistert, kiest letters, bouwt, hoort het resultaat.
- **Goed-feedback:** het woord wordt vloeiend uitgesproken; korte viering.
- **Fout-feedback:** het woord wordt gesegmenteerd; de juiste letter wordt aangewezen; opnieuw.
- **Voortgang:** woordlijst per letter-set; pas na 4–5 letters.
- **Waarom:** synthese en elementaire leeshandeling [S1][S15].
- **Valkuil:** te vroeg; lange woorden; geen audio-model; alleen slepen.

#### 5. Lettermemory (should)

- **Doel:** letters en klanken koppelen via een geheugenspel.
- **Mechanic:** 6–8 kaarten; een letterkaart en een audio-kaart (of kleine/hoofdletter).
- **Wat het kind doet:** draait kaarten om, luistert, onthoudt.
- **Goed-feedback:** het paar blijft liggen; de klank klinkt.
- **Fout-feedback:** de kaarten draaien terug; bij de volgende flip klinkt de klank opnieuw.
- **Voortgang:** paren gevonden; geen timer; maximaal 8 kaarten.
- **Waarom:** herhaling en visuele discriminatie; met audio ook klank.
- **Valkuil:** te veel kaarten; paren van identieke letters; geen audio; competitie.

#### 6. Samen met een ouder (should)

- **Doel:** begeleide oefening met modeling en corrective feedback van een volwassene.
- **Mechanic:** de app geeft de ouder een korte prompt ("Wijs de m aan en zeg /m/"), het kind doet de taak, de ouder tikt "goed" of "nog eens".
- **Wat het kind doet:** luistert, wijst, zegt na, schrijft eventueel op papier.
- **Goed-feedback:** de ouder bevestigt; de app geeft een compliment en de volgende opdracht.
- **Fout-feedback:** de ouder zegt "nog eens"; de app speelt de klank opnieuw.
- **Voortgang:** sessieoverzicht voor de ouder; één tip per sessie.
- **Waarom:** volwasseninteractie was de enige significante moderator in de GraphoGame-meta-analyse [S51]; kleine-groepsinstructie is effectiever dan individuele tutoring [S17].
- **Valkuil:** de ouder moet Nederlands kunnen lezen; niet elke ouder is beschikbaar; maak de modus niet verplicht.

#### 7. Teken de letter (nice)

- **Doel:** de lettervorm en de fijne motoriek oefenen.
- **Mechanic:** overtrekken met de vinger of stylus; startdot en richting; brede baan.
- **Wat het kind doet:** volgt de baan, maakt de letter.
- **Goed-feedback:** de baan gloeit; de letter komt tot leven.
- **Fout-feedback:** geen straf; de ghost-letter blijft zichtbaar; na drie pogingen doet de app het voor.
- **Voortgang:** aantal letters getekend; optioneel.
- **Waarom:** handschrift en traceren ondersteunen letterherkenning [S33][S34].
- **Valkuil:** precisie-eisen; touchscreen is niet hetzelfde als papier; traceren als hoofdmodus; claims dat het superieur is.

#### 8. Letterverhaal (nice)

- **Doel:** letters in een betekenisvolle context herhalen en het kind betrokken houden.
- **Mechanic:** drie of vier schermen verhaal; op elk scherm moet het kind een letter kiezen om verder te komen; verzamelobjecten.
- **Wat het kind doet:** luistert, kiest, ziet het verhaal verdergaan.
- **Goed-feedback:** het verhaal gaat verder; een klein verzamelobject.
- **Fout-feedback:** een hint; opnieuw; het verhaal wacht.
- **Voortgang:** hoofdstukken ontgrendelen door mastery, niet door tijd.
- **Waarom:** narratief kan de betrokkenheid verhogen [S48], maar alleen als de oefening centraal blijft [S29].
- **Valkuil:** te veel animatie; verhaal belangrijker dan letters; lange laadtijd; verzamelobjecten los van leren.

### 8.3 Voortgang zonder account

Een eenvoudig lokaal model:

```text
letters.progress.v1
  per letter:
    exposures: number
    correct: number
    lastSeen: ISO date
    nextReview: ISO date
    stage: "nieuw" | "oefenen" | "bijna" | "vast"
```

- **Geen "fout"-status.** Een letter is "nieuw", "oefenen", "bijna" of "vast". Dat is minder stigmatiserend en didactisch eerlijker.
- **Mastery:** drie goede antwoorden in twee verschillende sessies, plus één goede na een week. Daarna blijft de letter in de reviewpool.
- **Review:** de scheduler is een eenvoudige regel, geen gevalideerd SRS-algoritme: 1, 3, 7 en 14 dagen; fouten eerder.
- **Weergave:** "Deze letters ken je al" en "Deze letters komen terug". Geen percentages, geen cijfers, geen vergelijking.
- **Ouder:** één regel per letter, geen dashboard met grafieken.

### 8.4 Audio

- **Menselijke opnames, geen runtime-TTS.** Neem per letter een korte klank op (`/m/`, niet "em") en laat de set door een leesspecialist beluisteren [S15][S16].
- **Geen schwa.** Vermijd "muh" en "suh"; die maken het samenvoegen moeilijker.
- **Eén stem, één volume, geen muziek** tijdens klanktaken.
- **Grote replay-knop** (44 px) en autoplay alleen na een tik.
- **Versiemap** `public/audio/letters/v1/` zodat een nieuwe stem geen oude cache oplevert.
- **Test:** elke letter heeft een bestand; geen bestand bevat een letternaam; geen dubbel bestand.

### 8.5 Visueel

- Kleine letters, eenvoudig sans-serif, geen cursief. Gebruik geen dyslexie-font als "oplossing": dat geeft geen betrouwbaar voordeel [S35][S36].
- Minimaal ongeveer 72 px op 390 px breed; ruime marge; geen drukke achtergrond.
- Kleur alleen als tweede signaal; contrast 4,5:1 voor tekst en 3:1 voor niet-tekst [S13].
- Eén vraag per scherm; geen decoratie die niet aan de vraag bijdraagt [S28][S29].
- `prefers-reduced-motion` respecteren: geen parallax, geen stuiterende mascotte, geen confettiregen [S14].

### 8.6 Wat je niet bouwt

- Geen leaderboard, geen klassement, geen "beste score".
- Geen streak die reset of een level dat zakt.
- Geen timer voor 4–6 jaar.
- Geen TTS die letters als namen uitspreekt.
- Geen 26 letters tegelijk; geen "alle letters" als eerste scherm.
- Geen drag-only opdrachten [S13].
- Geen confetti tijdens de vraag; feedback pas na het antwoord.
- Geen dyslexie- of "achterstand"-claim [S12].
- Geen personages, artwork of structureerwoorden van VLL, Lijn 3 of Klinkers kopiëren.
- Geen analytics, accounts of externe requests.

### 8.7 Technische inpassing

De slice-indeling uit het vorige rapport blijft geldig: `libs/entities/letters`, `libs/features/letter-game`, `libs/pages/letters` en een `available`-entry in de game-catalogus. De lettervolgorde en methodekeuze blijven daar ook; dit rapport voegt de didactische lus en de review-scheduler toe. Voeg twee dingen toe:

- **`reviewScheduler`** in de entity: pure functie die op basis van localStorage de volgende letter kiest.
- **`audioManifest`** in de feature: een gegenereerde lijst van letter → audiobestand, met een test dat elk bestand bestaat.

Audio staat in `apps/games/public/audio/letters/v1/`; voortgang in `localStorage`; geen runtime-TTS; `media-src 'self'` in `_headers`. UI: 44 px targets, één kolom op 390 px, twee op 1024 px, zichtbare focus, `aria-live` voor feedback.

### 8.8 Implementatie in stappen

| Fase    | Inhoud                                                                            | Waarom                                                                |
| ------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **MVP** | Klank–letter, letterjacht, luister en wijs; 8–10 letters; audio; lokale voortgang | De drie modi dekken klank, vorm en analyse; klein genoeg om te testen |
| **v2**  | Woordbouw, lettermemory, samenspeelmodus                                          | Synthese en ouderbetrokkenheid toevoegen                              |
| **v3**  | Teken de letter, letterverhaal, hoofdletters                                      | Motoriek en context, alleen als de kern staat                         |

## 9. Open vragen / nog verifiëren

1. **Ik vond geen Nederlandse RCT voor een thuisletterspel bij 4–7.** De effectgroottes komen uit bredere meta-analyses en buitenlandse studies. Een eigen pilot met voor- en nameting is nodig voordat je een effectclaim doet.
2. **Geen publiek toegankelijke Nederlandse verwarringsmatrix gevonden.** Ik vond geen studie die laat zien welke letters Nederlandse kinderen het vaakst verwarren. `b`/`d` is een methodische keuze, geen compleet beeld.
3. **Geen gevalideerd spacing-algoritme voor letters.** De intervallen 1, 3, 7 en 14 dagen zijn een ontwerpregel op basis van spacingonderzoek [S23], geen bewezen optimum.
4. **Touchscreen-traceren versus pen en papier.** De handschriftstudies gebruiken papier of fysiek traceren [S33][S34]; een touchscreen is een andere motorische taak.
5. **Letternaam versus klank in het Nederlands.** Piasta et al. (2010) vinden voordeel van gecombineerde instructie voor klankverwerving [S18]; Roberts et al. (2018) vinden meer groei bij één focus op het geoefende domein [S19]. De Nederlandse methodes verschillen; een Nederlandse replicatie ontbreekt.
6. **Hoe meet je mastery zonder te toetsen?** De drie-goed-in-twee-sessies-regel is een ontwerpkeuze. Of die betrouwbaar genoeg is, moet uit een pilot blijken.
7. **Effect van narratief en verzamelen bij 4–7.** De evidentie komt vooral uit oudere doelgroepen en algemene gamificationmeta-analyses [S46][S48]. Voor kleuters is het niet specifiek onderzocht.
8. **Lange-termijneffecten van beloningen.** Het debat tussen Deci et al. en Cameron en Pierce is niet beslecht [S44][S45]. Voor een app zonder accounts is terughoudendheid de veilige keuze.
9. **Adaptiviteit.** De meta-analyses spreken elkaar tegen [S54][S55]. "Adaptief" kan in de praktijk iets anders betekenen dan in de studies.
10. **NT2 en meertaligheid.** Ik vond één relevante studie met peuters/kleuters [S19], maar geen Nederlandse studie naar een letter-spel voor NT2-kinderen.
11. **Effectiviteit van de commerciële apps.** Voor LetterSchool, Duolingo ABC, Reading Eggs, Squla, Juf Jannie, Poio en Letterstart vond ik geen onafhankelijke, gerepliceerde RCT. De beschrijvingen zijn gebaseerd op publieke productpagina's.
12. **Toegankelijkheid voor slechthorende kinderen.** Een audio-first letter-spel is voor hen lastig. Ik vond geen onderzoek naar een goede visuele vervanging van klanktaken voor deze groep.

## Verantwoording

Dit is een bronnenonderzoek, geen eigen effectstudie. Ik heb gezocht via SLO, Onderwijskennis, Kennisrotonde, het Expertisecentrum Nederlands, Crossref, ERIC en publieke productpagina's. Ik heb geen systematische review met een vooraf vastgelegd zoekprotocol uitgevoerd; de bronnenlijst is een gerichte selectie, geen volledige literatuursearch. Ik heb waar mogelijk primaire bronnen gebruikt: SLO, Onderwijskennis, Kennisrotonde, het Expertisecentrum Nederlands, WCAG, peer-reviewed artikelen en meta-analyses. Commerciële methode- en productbronnen gebruik ik alleen om didactiek, spelvormen en producten te beschrijven; hun effectclaims zijn niet onafhankelijk en staan niet als bewijs in dit stuk. Ontwerpkeuzes die verder gaan dan de bronnen zijn als zodanig herkenbaar (bijvoorbeeld "ontwerpinschatting" of "ontwerpregel").

Ik heb niet alle besproken apps zelf uitgespeeld. De beschrijvingen van mechanieken komen uit publieke productpagina's en kunnen in de actuele versie afwijken. Waar ik geen volledig peer-reviewed verslag vond, staat dat expliciet. De volledige handleidingen van VLL en Lijn 3 zijn niet openbaar; voor de lettervolgorde verwijs ik naar het eerdere rapport.

## Bronnen

Alle bronnen hieronder zijn op **2026-10-18** geraadpleegd.

### Curriculum, overheid en publieke standaarden [C]

- **[S1]** SLO, _Inhoudslijn PO Nederlands – Lezen_ (06-2020). https://www.slo.nl/publish/pages/15247/inhoudslijnen_po_nederlands_lezen_def.pdf
- **[S2]** SLO, _Inhoudskaart taal jonge kind, fase 1_ (2020). https://www.slo.nl/publish/pages/4801/inhoudskaart-po-taal-fase110-2020.pdf
- **[S3]** SLO, _Doelen jonge kind_ (31 juli 2023). https://www.slo.nl/thema/meer/jonge-kind/doelen-jonge-kind/
- **[S4]** Expertisecentrum Nederlands, _Tussendoelen beginnende geletterdheid. Een leerlijn voor groep 1 tot en met 3_ (2013). https://dyslexiecentraal.nl/sites/default/files/media/document/2019-08/overzicht_tussendoelen_beginnende_geletterdheid.pdf
- **[S5]** Onderwijskennis (NRO), _Ontluikende/beginnende geletterdheid_ (Toolkit Jonge Kind). https://www.onderwijskennis.nl/toolkit-jonge-kind/ontluikende/beginnende-geletterdheid
- **[S6]** Onderwijskennis (NRO), _Hoe stimuleer je fonemisch bewustzijn?_ (28 maart 2022, geactualiseerd 17 maart 2026). https://www.onderwijskennis.nl/kennisbank/fonemisch-bewustzijn-fundament-voor-het-leren-lezen
- **[S7]** Onderwijskennis (NRO), _Spelend leren_ (thema). https://www.onderwijskennis.nl/themas/spelend-leren
- **[S8]** Kennisrotonde (NRO), _Is het effectiever om leerlingen in groep 2 één of meerdere letters per week aan te leren?_ (17 maart 2026). https://www.kennisrotonde.nl/vraag-en-antwoord/letters-leren-in-groep-2-en-effect-op-lezen
- **[S9]** Kennisrotonde (NRO), _Presteren kinderen beter door 'bewegend leren'?_ (geactualiseerd 2 februari 2023). https://www.kennisrotonde.nl/vraag-en-antwoord/presteren-kinderen-beter-door-bewegend-leren
- **[S10]** Kennisrotonde (NRO), _Is het effectief om te bewegen tijdens een cognitieve activiteit?_ (geactualiseerd 21 juni 2024). https://www.kennisrotonde.nl/vraag-en-antwoord/cognitieve-activiteit-en-gelijktijdig-bewegen
- **[S11]** Kennisrotonde (NRO), _Welke ontwikkelingskenmerken hangen samen met een succesvolle overgang van groep 2 naar groep 3?_ (21 maart 2023). https://www.kennisrotonde.nl/sites/kennisrotonde/files/media-files/PDF%20voor%20website-Kennisrotonde-antwoord%20VRAAG-1565.pdf
- **[S12]** Dyslexie Centraal, _Protocol Leesproblemen en Dyslexie primair onderwijs_ (geactualiseerde versie, september 2026). https://dyslexiecentraal.nl/materialen/protocol-po
- **[S13]** W3C, _Web Content Accessibility Guidelines (WCAG) 2.2_ (12 december 2024). https://www.w3.org/TR/WCAG22/
- **[S14]** MDN Web Docs, _`prefers-reduced-motion`_. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

### Wetenschappelijke literatuur [W]

- **[S15]** National Reading Panel, _Teaching Children to Read: An Evidence-Based Assessment of the Scientific Research Literature on Reading and Its Implications for Reading Instruction_ (2000). https://www.nichd.nih.gov/publications/pubs/nrp/report
- **[S16]** Ehri, L. C. (2023). _Phases of Development in Learning to Read and Spell Words_. American Educator. https://www.aft.org/ae/fall2023/ehri
- **[S17]** Piasta, S. B., & Wagner, R. K. (2010). Developing early literacy skills: A meta-analysis of alphabet learning and instruction. _Reading Research Quarterly, 45_(1), 8–38. https://doi.org/10.1598/RRQ.45.1.2
- **[S18]** Piasta, S. B., Purpura, D. J., & Wagner, R. K. (2010). Fostering alphabet knowledge development: A comparison of two instructional approaches. _Reading and Writing, 23_, 607–626. https://doi.org/10.1007/s11145-009-9174-x
- **[S19]** Roberts, T. A., Vadasy, P. F., & Sanders, E. A. (2018). Preschoolers' alphabet learning: Letter name and sound instruction, cognitive processes, and English proficiency. _Early Childhood Research Quarterly, 44_, 257–274. https://doi.org/10.1016/j.ecresq.2018.04.011
- **[S20]** Rosenshine, B. (2012). Principles of instruction: Research-based strategies that all teachers should know. _American Educator, 36_(1), 12–19, 39. https://www.aft.org/sites/default/files/Rosenshine.pdf
- **[S21]** Alfieri, L., Brooks, P. J., Aldrich, N. J., & Tenenbaum, H. R. (2011). Does discovery-based instruction enhance learning? _Journal of Educational Psychology, 103_(1), 1–18. https://doi.org/10.1037/a0021017
- **[S22]** Skene, K., O'Farrelly, C. M., Byrne, E. M., Kirby, N., Stevens, E. C., & Ramchandani, P. G. (2022). Can guidance during play enhance children's learning and development in educational contexts? A systematic review and meta-analysis. _Child Development, 93_(4), 1162–1180. https://doi.org/10.1111/cdev.13730
- **[S23]** Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. _Psychological Bulletin, 132_(3), 354–380. https://doi.org/10.1037/0033-2909.132.3.354
- **[S24]** Adesope, O. O., Trevisan, D. A., & Sundararajan, N. (2017). Rethinking the use of tests: A meta-analysis of practice testing. _Review of Educational Research, 87_(3), 659–701. https://doi.org/10.3102/0034654316689306
- **[S25]** Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. _Psychological Bulletin, 145_(11), 1029–1052. https://doi.org/10.1037/bul0000209
- **[S26]** Van der Kleij, F. M., Feskens, R. C. W., & Eggen, T. J. H. M. (2015). Effects of feedback in a computer-based learning environment on students' learning outcomes: A meta-analysis. _Review of Educational Research, 85_(4), 475–511. https://doi.org/10.3102/0034654314564881
- **[S27]** Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive architecture and instructional design: 20 years later. _Educational Psychology Review, 31_, 261–292. https://doi.org/10.1007/s10648-019-09465-5
- **[S28]** Mayer, R. E. (2020). _Multimedia Learning_ (3rd ed.). Cambridge University Press. https://doi.org/10.1017/9781316941355
- **[S29]** Harp, S. F., & Mayer, R. E. (1998). How seductive details do their damage: A theory of cognitive interest in science learning. _Journal of Educational Psychology, 90_(3), 414–434. https://doi.org/10.1037/0022-0663.90.3.414
- **[S30]** MacSuga-Gage, A. S., & Simonsen, B. (2015). Examining the effects of teacher-directed opportunities to respond on student outcomes: A systematic review of the literature. _Education and Treatment of Children, 38_(2), 211–239. https://files.eric.ed.gov/fulltext/EJ1070193.pdf
- **[S31]** Jones, C. D., & Reutzel, D. R. (2012). Enhanced alphabet knowledge instruction: Exploring a change of frequency, focus, and distributed cycles of review. _Reading Psychology, 33_(5), 448–464. https://doi.org/10.1080/02702711.2010.545260
- **[S32]** Schlesinger, N. W., & Gray, S. (2017). The impact of multisensory instruction on learning letter names and sounds, word reading, and spelling. _Annals of Dyslexia, 67_(3), 219–258. https://doi.org/10.1007/s11881-017-0140-z
- **[S33]** Longcamp, M., Zerbato-Poudou, M.-T., & Velay, J.-L. (2005). The influence of writing practice on letter recognition in preschool children: A comparison between handwriting and typing. _Acta Psychologica, 119_(1), 67–79. https://doi.org/10.1016/j.actpsy.2004.10.019
- **[S34]** Ibaibarriaga, G., Acha, J., & Perea, M. (2025). The impact of handwriting and typing practice in children's letter and word learning: Implications for literacy development. _Journal of Experimental Child Psychology, 253_, 106195. https://doi.org/10.1016/j.jecp.2025.106195
- **[S35]** Kuster, S. M., van Weerdenburg, M., Gompel, M., & Bosman, A. M. T. (2018). Dyslexie font does not benefit reading in children with or without dyslexia. _Annals of Dyslexia, 68_(1), 25–42. https://doi.org/10.1007/s11881-017-0154-6
- **[S36]** Azzarello, C., Paek, S., Hodge, C., Jameson, M., & Lewis, J. (2026). Does font improve reading in dyslexic children? A meta-analysis of dyslexia-friendly fonts and dyslexic children's reading performance. _Annals of Dyslexia_ (online first). https://doi.org/10.1007/s11881-026-00389-8
- **[S37]** Metcalfe, J. (2017). Learning from errors. _Annual Review of Psychology, 68_, 465–489. https://doi.org/10.1146/annurev-psych-010416-044022
- **[S38]** Feder, K. P., & Majnemer, A. (2007). Handwriting development, competency, and intervention. _Developmental Medicine & Child Neurology, 49_(4), 312–317. https://doi.org/10.1111/j.1469-8749.2007.00312.x
- **[S39]** Montroy, J. J., Bowles, R. P., Skibbe, L. E., McClelland, M. M., & Morrison, F. J. (2016). The development of self-regulation across early childhood. _Developmental Psychology, 52_(11), 1744–1762. https://doi.org/10.1037/dev0000159
- **[S40]** Best, J. R., & Miller, P. H. (2010). A developmental perspective on executive function. _Child Development, 81_(6), 1641–1660. https://doi.org/10.1111/j.1467-8624.2010.01499.x
- **[S41]** Ruff, H. A., & Capozzoli, M. C. (1990). Development of sustained, focused attention in young children during free play. _Developmental Psychology, 26_(1), 85–93. https://doi.org/10.1037/0012-1649.26.1.85
- **[S42]** Pennington, B. F., & Bishop, D. V. M. (2009). Relations among speech, language, and reading disorders. _Annual Review of Psychology, 60_, 283–306. https://doi.org/10.1146/annurev.psych.60.110707.163548
- **[S43]** Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. _American Psychologist, 55_(1), 68–78. https://doi.org/10.1037/0003-066X.55.1.68
- **[S44]** Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. _Psychological Bulletin, 125_(6), 627–668. https://doi.org/10.1037/0033-2909.125.6.627
- **[S45]** Deci, E. L., Koestner, R., & Ryan, R. M. (2001). Extrinsic rewards and intrinsic motivation in education: Reconsidered once again. _Review of Educational Research, 71_(1), 1–27. https://doi.org/10.3102/00346543071001001
- **[S46]** Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. _Educational Psychology Review, 32_, 77–112. https://doi.org/10.1007/s10648-019-09498-w
- **[S47]** Bai, S., Hew, K. F., & Huang, B. (2020). Does gamification improve student learning outcome? Evidence from a meta-analysis and synthesis of qualitative data in educational contexts. _Educational Research Review, 30_, 100322. https://doi.org/10.1016/j.edurev.2020.100322
- **[S48]** Clark, D. B., Tanner-Smith, E. E., & Killingsworth, S. S. (2016). Digital games, design, and learning: A systematic review and meta-analysis. _Review of Educational Research, 86_(1), 79–122. https://doi.org/10.3102/0034654315582065
- **[S49]** Wouters, P., van Nimwegen, C., van Oostendorp, H., & van der Spek, E. D. (2013). A meta-analysis of the cognitive and motivational effects of serious games. _Journal of Educational Psychology, 105_(2), 249–265. https://doi.org/10.1037/a0031311
- **[S50]** Mueller, C. M., & Dweck, C. S. (1998). Praise for intelligence can undermine children's motivation and performance. _Journal of Personality and Social Psychology, 75_(1), 33–52. https://doi.org/10.1037/0022-3514.75.1.33
- **[S51]** McTigue, E. M., Solheim, O. J., Zimmer, W. K., & Uppstad, P. H. (2019). Critically reviewing GraphoGame across the world: Recommendations and cautions for research and implementation of computer-assisted instruction for word-reading acquisition. _Reading Research Quarterly, 55_(1), 45–73. https://doi.org/10.1002/rrq.256
- **[S52]** Saine, N. L., Lerkkanen, M.-K., Ahonen, T., Tolvanen, A., & Lyytinen, H. (2011). Computer-assisted remedial reading intervention for school beginners at risk for reading disability. _Child Development, 82_(3), 1013–1028. https://doi.org/10.1111/j.1467-8624.2011.01580.x
- **[S53]** Kyle, F. E., Kujala, J., Richardson, U., Lyytinen, H., & Goswami, U. (2013). Assessing the effectiveness of two theoretically motivated computer-assisted reading interventions in the United Kingdom: GG Rime and GG Phoneme. _Reading Research Quarterly, 48_(1), 61–76. https://doi.org/10.1002/rrq.038
- **[S54]** Verhoeven, L., Voeten, M., & Segers, E. (2022). Computer-assisted word reading intervention effects throughout the primary grades: A meta-analysis. _Educational Research Review, 37_, 100486. https://doi.org/10.1016/j.edurev.2022.100486
- **[S55]** Vanbecelaere, S., Said-Metwaly, S., Van den Noortgate, W., Reynvoet, B., & Depaepe, F. (2023). The effectiveness of Tier 1 digital interventions for early reading: A meta-analysis. _British Journal of Educational Technology, 54_(5), 1397–1432. https://doi.org/10.1111/bjet.13351

### Digitale producten en productonderzoek [M]

- **[S56]** GraphoGame, _Reading is winning_ en _Evidence_. https://graphogame.com/ en https://graphogame.com/evidence/ en https://graphogame.com/products-services/
- **[S57]** Radboud Universiteit, _Letterprins_ (onderzoeksproject). https://www.ru.nl/onderzoek/onderzoeksprojecten/letterprins
- **[S58]** Steenbeek-Planting, E. G., Boot, M., de Boer, J., et al. (2013). Evidence-based psycholinguistic principles to remediate reading problems applied in the playful app Letterprins: A perspective of quality of healthcare on learning to read. In _Games for Health_ (pp. 281–291). Springer. https://doi.org/10.1007/978-3-658-02897-8_22
- **[S59]** LetterSchool, _Teach your kid to write and spell!_ en _How & Why_. https://www.letterschool.com/ en https://www.letterschool.com/en/how-why
- **[S60]** LetterSchool, _LetterSchool Enhances Young Learners' Handwriting and Manual Dexterity_ (blog). https://www.letterschool.com/blogs/letterschool-enhances-young-learners-handwriting-and-manual-dexterity
- **[S61]** Hussain, M. (2025). App-based handwriting instruction and handwriting legibility outcomes in students with learning disabilities: A controlled intervention experimental study using Handwriting Wizard, LetterSchool, and LetraKid. _International Journal of Social Sciences Bulletin, 3_(12), 508–526. https://ijssbulletin.com/index.php/IJSSB/article/view/1631
- **[S62]** Duolingo ABC, _Learning to read is hard. We made it fun!_ https://www.duolingo.com/abc
- **[S63]** Reading Eggs, _About_ en _Research Spotlight_. https://readingeggs.com/about/ en https://readingeggs.com/about/research/
- **[S64]** Squla, _Onderbouw_ en _Onderzoek_. https://www.squla.nl/onderbouw en https://www.squla.nl/onderzoek
- **[S65]** Juf Jannie, _Juf Jannie apps voor kinderen: leren lezen, rekenen en taal_. https://www.jufjannie.nl/juf-jannie-apps/
- **[S66]** Kahoot!, _Kahoot! Learn to Read by Poio_. https://kahoot.com/home/learning-apps/poio/
- **[S67]** Nessy, _The Science of Reading_ en _Nessy Research_. https://nessy.com/ en https://nessy.com/en-us/shop/research/
- **[S68]** Cramp, V. (2026, 31 juli). _Nessy Reading and Spelling: An Academic Critique_. University of Southampton Educational Psychology research blog. https://blog.soton.ac.uk/edpsych/2026/07/31/nessy-reading-and-spelling-an-academic-critique/
- **[S69]** Letterstart, _Spelletjes om letters en woordjes te oefenen (groep 2/3)_. https://letterstart.nl/

### Praktijkbronnen [M]

- **[S70]** Juf Anke, _Taal | Lesideeën voor kleuters_. https://jufanke.nl/taal-kleuters/
- **[S71]** Kleuteridee, _a,b,c, letters_. https://kleuteridee.nl/downloads-2/abc-letters/
- **[S72]** Letterkleien, _Letters leren door het gebruik van je zintuigen_. https://letterkleien.nl/
- **[S73]** Wij-spelen, _Letterrondo: een spel voor de beginnende geletterdheid_. https://wij-spelen.nl/letterrondo.php
- **[S74]** In Balans Leren, _7 activiteiten met letters en het alfabet_ (PDF, 2025). https://inbalansleren-online.nl/wp-content/uploads/2025/05/7-activiteiten-met-letters-min.pdf
- **[S75]** Juf Anja, _Letterbingo in feestelijke stijl_. https://jufanja.eu/letterbingo/
- **[S76]** Spelletjesplein, _Plein 41: Letterspelletjes_. https://www.spelletjesplein.nl/taal-letterspelletjes/

### Overige bron voor kleurzienstoornis [C]

- **[S77]** National Eye Institute (NIH), _Color Blindness_. https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/color-blindness
