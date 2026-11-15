# Onderzoek: letters leren op de basisschool

- **Datum:** 2026-10-18
- **Status:** Onderzoek, geen beslissing
- **Vraag:** hoe leren kinderen in het Nederlandse basisonderwijs letters, welke didactiek en volgorde gebruiken gangbare methodes, wat zegt onderzoek over effectieve letterinstructie, en wat betekent dat voor een digitaal letter-spel voor thuis (groep 1–3, ongeveer 4–7 jaar)?
- **Kader:** de regels uit `AGENTS.md` en [ADR 0001](../adr/0001-publieke-statische-spellen-app.md): publiek, statisch, alleen TypeScript, geen externe requests, geen backend, strikte CSP, mobile-first en touch-targets van minimaal 44 px.

**Leeswijzer.** Waar een uitspraak uit onderzoek komt, staat **[W]**. Waar het gaat om wet, kerndoelen of overheidsadvies, staat **[C]**. Waar het gaat om een commerciële methode of uitgever, staat **[M]**. Bronnen zijn genummerd als `[S1]` en staan met URL en raadpleegdatum in de [bronnenlijst](#bronnen). Een `[M]`-bron is geen onafhankelijk bewijs van effectiviteit; die bronnen gebruik ik alleen om didactiek en volgorde te beschrijven.

## Kort advies

**Bouw een klein, statisch letter-spel voor groep 2–3 dat het leesonderwijs op school aanvult, niet vervangt.**

- **Kern is klank → letter, niet letterbenoeming.** De hoofdoefening is: het kind hoort een klank en kiest de bijbehorende kleine letter. Daarna volgen letter → plaatje, auditieve analyse en pas later woorden bouwen. Memory met hoofdletters is een aparte, latere oefening.
- **Gebruik geen "landelijke" lettervolgorde die niet bestaat.** Veilig Leren Lezen (VLL) start met `i, k, m, s`; Lijn 3 start in de instapweek met `i, n, k`. Een pragmatische startset van 4–5 letters die samen woorden maken (`ik`, `is`, `mis`, `kim`) is verdedigbaar, mits je de ouder de optie geeft om bij de methode van school aan te sluiten.
- **Liever meerdere letters per week met veel herhaling dan één letter per week.** Dat is de strekking van het Kennisrotonde-overzicht uit 2026 en van Sunde et al. (2019) [S14][S41]. Let op: dat onderzoek gaat over letteraanbod in groep 2, niet over vervroegd formeel leesonderwijs.
- **Verwacht kleine tot matige effecten van digitaal oefenen.** De meta-analyses komen uit op effectgroottes van ongeveer 0,19–0,37 [S44][S45][S46][S48]. Gamification en adaptiviteit zijn geen bewezen wondermiddelen; expliciete instructie, correctieve feedback, herhaling en betrokkenheid van een volwassene lijken belangrijker [S45][S46].
- **Audio is het grootste inhoudelijke risico.** TTS-systemen kunnen letters als namen uitspreken ("em", "es") in plaats van als klanken (`/m/`, `/s/`). Gebruik korte, gecontroleerde klankopnames en laat ze door een leesspecialist controleren.
- **Visueel en technisch:** kleine letters, eenvoudig sans-serif, geen cursief, geen Dyslexie-font (voor lezen is daar geen voordeel van aangetoond) [S53][S54]. Kleur alleen als tweede signaal. Statische audio in `public/`, voortgang in `localStorage`, geen externe requests, 44 px touch-targets.

## 1. Begrippen en kader

### 1.1 Waar gaat het over?

De fase van **beginnende geletterdheid** loopt in Nederland van groep 1 tot en met groep 3. In die fase oriënteren kinderen zich op geschreven taal, ontdekken ze het alfabetisch principe en leren ze de elementaire lees- en spellinghandeling [S10][S11]. **Aanvankelijk lezen** is het deel waarin het alfabetisch principe en de elementaire leeshandeling centraal staan; het leesonderwijs in groep 3 is daar sterk op gericht [S11]. **Technisch lezen** begint volgens de SLO-leerlijn expliciet "vanaf groep 3" [S3].

Dat betekent niet dat er in groep 1–2 niets met letters gebeurt. De SLO-inhoudslijn zet "fonemisch bewustzijn en alfabetisch principe" in fase 1 (groep 1–3) en beschrijft dat als spelen met klanken en symbolen, woorden verklanken, het alfabetisch principe in een speelse context ontdekken en ontdekken dat letters met klanken corresponderen [S3]. De inhoudskaart voor het jonge kind noemt "aanvankelijk lezen" daarentegen pas vanaf groep 3 [S5]. De bedoeling is dus: **spelend verkennen in groep 1–2, systematisch leren decoderen in groep 3**.

### 1.2 Begrippenlijst

| Begrip                     | Betekenis                                                                                                                                                                                                                         | Waarom het voor het spel uitmaakt                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Ontluikende geletterdheid  | De fase waarin peuters en kleuters geschreven taal verkennen; de term wordt in programmaoverzichten voor peuters/kleuters gebruikt [S8].                                                                                          | Bepaalt de toon: verkennen, niet overhoren.                                      |
| Beginnende geletterdheid   | De fase groep 1–3 waarin kinderen zich oriënteren op geschreven taal en het alfabetisch principe ontdekken [S10][S11].                                                                                                            | Dit is de doelgroep van het spel.                                                |
| Aanvankelijk lezen         | De fase waarin kinderen het alfabetisch principe en de elementaire leeshandeling leren [S11].                                                                                                                                     | Formeel vooral groep 3 [S3][S5].                                                 |
| Letterkennis               | Letters herkennen (vorm), benoemen (naam) en aan klanken koppelen (klank) [S39][S40].                                                                                                                                             | "Letters kennen" is meer dan alleen de vorm herkennen.                           |
| Fonologisch bewustzijn     | Bewustzijn van de klankstructuur van taal: rijmen, lettergrepen, klanken onderscheiden [S10].                                                                                                                                     | Brede paraplu; het spel oefent een deel ervan.                                   |
| Fonemisch bewustzijn       | Het kunnen onderscheiden en manipuleren van de kleinste klanken (fonemen) in woorden, zoals `p-e-n` [S10].                                                                                                                        | Dit is de vaardigheid achter "hoor je de /m/ vooraan?".                          |
| Alfabetisch principe       | Het inzicht dat woorden uit klanken bestaan en dat letters met die klanken corresponderen [S10].                                                                                                                                  | De brug tussen gesproken en geschreven taal.                                     |
| Klankzuiver woord          | Woord waarin je hoort hoe je het schrijft; elke klank heeft een eigen letter, zoals `pet`, `vis`, `maan` [S3][S32].                                                                                                               | Geschikt voor de eerste lees- en spellingoefeningen.                             |
| Auditieve analyse          | Een gesproken woord in klanken verdelen: `maan` → `/m/ /aa/ /n/` [S10][S38].                                                                                                                                                      | Nodig om te kunnen spellen en om klanken in woorden te herkennen.                |
| Auditieve synthese         | Losse klanken samenvoegen tot een woord: `/m/ /aa/ /n/` → `maan` [S31].                                                                                                                                                           | Nodig om te kunnen lezen; samen met analyse de kern van decoderen.               |
| Elementaire leeshandeling  | Een klankzuiver woord van links naar rechts ontcijferen: letter → klank → samenvoegen → betekenis [S31].                                                                                                                          | Het "echte" lezen dat groep 3 nastreeft.                                         |
| Leesrichting               | Van voor naar achter, boven naar beneden, regels van links naar rechts [S10].                                                                                                                                                     | Moet visueel kloppen: geen rechter-naar-links- of door-elkaar-opdrachten.        |
| Structureerwoord           | Woord dat als kapstok dient voor een nieuwe letter; VLL leert steeds één nieuwe letter in combinatie met eerder geleerde letters [S19][S23].                                                                                      | Verklaart de VLL-volgorde; niet overdraagbaar zonder de woorden en prenten.      |
| Zoemend lezen              | Bij het lezen van een woord klanken aanhouden en direct met de volgende klank verbinden, in plaats van los hakken en plakken [S27].                                                                                               | Alternatief voor spellend lezen; pas zinvol als letters gekend zijn.             |
| Letterkleur                | Kleurcodering van letters in lesmaterialen; in veel losse materialen zijn klinkers rood en medeklinkers blauw, maar voor zover ik kon vinden is dat geen landelijke standaard. VLL deelt letters in vier letterfamilies in [S24]. | Handig als tweede signaal, maar kleur is niet landelijk uniform.                 |
| Kapitaal vs. kleine letter | Hoofdletter en kleine letter zijn verschillende tekens; SLO plaatst de term "hoofdletter" bij groep 3–4 [S7].                                                                                                                     | Leesmethodes starten met kleine letters; hoofdletters zijn een aparte conventie. |

### 1.3 "Een letter kennen" is niet één vaardigheid

Een kind kan een letter visueel herkennen zonder de klank te kennen, de naam kennen zonder de klank te kunnen gebruiken, of de klank kennen maar de vorm nog niet kunnen schrijven. De wetenschappelijke literatuur onderscheidt daarom lettervorm, letternaam en letterklank [S39][S40]. Voor decoderen is vooral de **klank** van belang; de naam kan helpen als geheugensteun, maar is niet hetzelfde als de klank [S38][S39]. Dit is een van de belangrijkste ontwerpkeuzes voor het spel: **oefen de klank, niet alleen de naam**.

## 2. Wettelijk en curriculair kader [C]

### 2.1 De nieuwe kerndoelen (sinds augustus 2026)

Sinds augustus 2026 gelden voor Nederlands de nieuwe kerndoelen uit 2025 [S2]. De wettelijke basis staat in de Wet op het primair onderwijs: het onderwijs is gericht op het realiseren van kerndoelen, en die kerndoelen hebben betrekking op lezen, schrijven en rekenen [S9]. De nieuwe kerndoelen Nederlands zijn breed geformuleerd: ze gaan over taalcompetentie, teksten begrijpen en produceren, gesprekken voeren, inzicht in taal als systeem en literatuur [S1]. Er staat geen lettervolgorde, geen weekplanning en geen didactiek in.

De SLO zegt daarover expliciet: "Kerndoelen beschrijven geen leerstof per schooljaar en schrijven geen vorm van pedagogiek, didactiek of onderwijstijd voor" [S2]. Een letter-spel kan dus niet claimen "de kerndoelen te dekken". Het kan wel een kleine, afgebakende bijdrage leveren aan het deelgebied beginnende geletterdheid.

### 2.2 SLO-leerlijnen: fase 1 versus "vanaf groep 3"

De SLO-inhoudslijn Lezen kent een categorie "fonemisch bewustzijn en alfabetisch principe" in fase 1 (groep 1–3) en een categorie "technisch lezen (vanaf groep 3)":

- **Fonemisch bewustzijn en alfabetisch principe**: spelen met klanken en symbolen, woorden verklanken, het alfabetisch principe in een speelse context ontdekken, deelnemen aan woord- en klankspelletjes, ontdekken dat letters met klanken corresponderen, rijmwoorden herkennen en de structuur van taal (tekst, zin, woord) ontdekken [S3].
- **Technisch lezen (vanaf groep 3)**: de elementaire leeshandeling oefenen, klankzuivere woorden decoderen, lettercombinaties en spellingpatronen herkennen, lettergrepen herkennen [S3].

SLO heeft voor het jonge kind inhoudskaarten met aanbodsdoelen per leergebied ontwikkeld [S6]. De inhoudskaart voor het jonge kind noemt "aanvankelijk lezen (vanaf groep 3)" en "aanvankelijk schrijven (vanaf groep 3)" [S5]. De tussendoelen beginnende geletterdheid formuleren het einddoel van de fase zo: "Kinderen kennen de meeste letters; ze kunnen de letters fonetisch benoemen" en "Kinderen kunnen klankzuivere (km-, mk- en mkm-) woorden ontsleutelen" [S10]. Ook staan daar de leesrichting (voor → achter, boven → beneden, links → rechts) en het onderscheiden van fonemen als `p-e-n` [S10].

**Conclusie [C]:** het curriculum schrijft geen exact moment voor waarop een specifieke letter aan bod komt. Het beschrijft een fase (groep 1–3) en markeert technisch lezen als iets dat vanaf groep 3 systematisch wordt aangeboden. Scholen en methodes maken de concrete invulling.

### 2.3 Groep 2 versus groep 3

De overgang van groep 2 naar groep 3 is in Nederland de overgang van meer spelend, informeel leren naar meer schools, formeel leren [S15]. Groep 3 heeft een sterke nadruk op technisch lezen; letterkennis en fonemisch bewustzijn zijn daarvoor belangrijke voorspellers [S15][S42]. Er is geen officiële leeftijdsgrens voor de overgang; de school beslist op basis van de ontwikkeling van het kind [S15].

Dat betekent niet dat groep 2 een "voorbereidende groep 3" moet worden. De Kennisrotonde beschrijft groep 1–2 juist als een fase met veel ruimte voor beweging, spel en ontdekkend leren, en groep 3 als een fase met meer instructie, langere concentratiemomenten en schoolse vaardigheden [S15]. De kunst is dus: **in groep 2 spelenderwijs letters aanbieden als het kind ervoor openstaat, zonder de structuur en toetsdruk van groep 3 na te bootsen**.

|          | Groep 1–2                                                                       | Groep 3                                                                    |
| -------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Karakter | Spelend, thematisch, informeel [S15]                                            | Schoolser, systematischer, meer instructie [S15]                           |
| Letters  | Verkennen, herkennen, klanken koppelen; geen vaste landelijke volgorde [S3][S5] | Systematisch aanbod, één nieuwe letter per keer, veel herhaling [S19][S30] |
| Doel     | Beginnende geletterdheid, brede ontwikkeling [S10]                              | Technisch lezen, elementaire leeshandeling [S3][S11]                       |
| Toetsing | Observeren en volgen van de ontwikkeling [S15]                                  | Signalering en methodegebonden toetsen [S12]                               |

### 2.4 Wat de Inspectie wel en niet meet

De Inspectie van het Onderwijs peilt leesvaardigheid aan het einde van het (speciaal) basisonderwijs en in het voortgezet onderwijs. De peiling 2020–2021 liet een daling zien ten opzichte van tien jaar daarvoor; de peiling 2025–2026 richt zich op leesbegrip in groep 8 en is naar verwachting eind 2027 gepubliceerd [S17]. **Ik vond geen aparte peiling van de Inspectie over letterkennis in groep 1–3.** Voor dat deel van het curriculum zijn de SLO-leerlijnen, de tussendoelen en de protocollen van het Expertisecentrum Nederlands de relevante bronnen.

## 3. Didactiek: hoe wordt een letter aangeboden? [M + W]

### 3.1 De vijf stappen van Veilig Leren Lezen

VLL Kim beschrijft het leren lezen in vijf stappen [S19]:

1. De nieuwe letter **alzijdig verkennen**.
2. De nieuwe letter meteen in **wisselende combinaties** met bekende letters oefenen.
3. Bekende letters **blijvend herhalen** in woorden en zinnen.
4. Nieuwe woorden oefenen met bekende woorddelen om te **automatiseren**.
5. De geautomatiseerde leesvaardigheid **toepassen** in vloeiend lezen van teksten.

Bij stap 1 doen kinderen meer dan kijken naar de vorm: ze luisteren naar de klank, voelen wat er gebeurt met hun mond, lippen, neus of keel bij het uitspreken, bekijken de vorm en schrijven de letter na [S19]. VLL koppelt lezen en spelling bewust: door een gelezen woord direct te spellen, moet het kind elke klank actief omzetten in een letter [S19]. Als leesstrategie gebruikt VLL **zoemend lezen**: klanken aanhouden en onmiddellijk met de volgende klank verbinden [S27].

### 3.2 Klank → letter, auditief → visueel

De didactiek is in de kern: **eerst de klank, dan de letter, dan het woord**. Dat sluit aan bij de fasetheorie van Ehri. In de pre-alphabetische fase lezen kinderen woorden vooral via visuele of contextuele cues; om naar de partieel-alphabetische fase te gaan, moeten ze lettervormen, letternamen en letterklanken leren en leren om de kleinste klanken in gesproken woorden te onderscheiden [S39]. In de volledig-alphabetische fase verwerven ze de belangrijkste grafeem-foneemrelaties en de decodeervaardigheid om letters te verklanken en de klanken tot woorden samen te voegen [S39].

Het National Reading Panel vond dat fonemisch bewustzijnstraining effectief is (d = 0,86 op fonemisch bewustzijn, d = 0,53 op lezen, d = 0,59 op spelling) [S38]. Belangrijker voor het spel: **training met letters was bijna twee keer zo effectief voor lezen als training zonder letters** (d = 0,67 versus 0,38) [S38]. De combinatie van klank en letter is dus niet een extraatje, maar het werkzame deel.

### 3.3 Schrijven en motoriek

VLL en Lijn 3 koppelen lezen en schrijven [S19][S30]. De SLO beschrijft voorbereidend schrijven in fase 1 als spelen met lettertekens, de eigen naam schrijven en woorden schrijven bij tekeningen [S4]. Lijn 3 doet dat met de schrijfmethode Klinkers: het kind leert een letter lezen en schrijft diezelfde dag dezelfde letter; een week later volgt de spelling [S30][S32]. Klinkers is geschikt voor zowel verbonden schrift als blokschrift [S32]. VLL werkt met "leesletters" en "schrijfletters" en besteedt in kern Start aandacht aan het verschil daartussen [S20]. Pennenstreken is de schrijfmethode die Zwijsen aan VLL en Schatkist koppelt; de publieke pagina benadrukt een doorgaande lijn in schrijfpatronen en lettervormen [S29]. Of een school verbonden schrift of blokschrift aanleert, is een schrijfkeuze. Voor het spel: toon de leesletter (blokvorm), niet het verbonden schrift, omdat de leesboeken die vorm gebruiken.

Onderzoek laat zien dat handschrift en traceren van letters het leren van letters beter ondersteunen dan typen. Longcamp et al. (2005) vonden bij oudere kleuters een betere letterherkenning na handschrift dan na typen [S51]. Ibaibarriaga et al. (2025) vonden in een experiment met 50 kleuters dat kinderen die letters met de hand overschreven of traceerden, beter presteerden op benoemen, schrijven en visuele identificatie dan kinderen die typten [S52]. Dat pleit ervoor om **schrijven op papier niet te vervangen door een spel**. Een digitale traceer-oefening kan een aanvulling zijn, maar is geen substituut voor pen en papier.

### 3.4 Liedjes, gebaren en multisensorisch aanbod

Lijn 3 biedt nieuwe letters auditief, visueel en tactiel aan: kinderen maken de letter met de vinger op tafel of op elkaars rug [S31]. Klankgebaren zijn optioneel; de methode zegt dat een multisensorische benadering een positief effect heeft op het leren van letters, omdat klank, vorm en beweging samen meer hersenactiviteit geven dan alleen de vorm [S31]. Dat is een plausibele didactische redenering, maar het bewijs is niet sterk.

Een gerichte studie die ik vond, vergeleek multisensorische gestructureerde taalinstructie met gestructureerde taalinstructie zonder multisensorische elementen bij Amerikaanse kinderen uit second grade (ongeveer 7–8 jaar) met en zonder dyslexie (N = 11). De multisensorische variant gaf **geen voordeel** boven de gestructureerde variant; beide hadden wel effect [S50]. Mijn conclusie: **gebaren, liedjes en beweging zijn prima voor betrokkenheid en geheugen, maar ze vervangen de expliciete klank-letterinstructie niet**. Voor een spel zijn ze een nice-to-have, geen bewijs van superieure didactiek.

### 3.5 "Letter van de week"?

De letter van de week is een veelgebruikte aanpak, maar niet de meest efficiënte. De Kennisrotonde (2026) concludeert dat een hoger tempo dan één letter per week waarschijnlijk effectiever is: kinderen die in een hoger tempo letters leren, presteren beter op letterkennis, woordlezen en spelling, en juist de zwakste leerlingen profiteren [S14]. Sunde et al. (2019) vonden in een natuurlijk experiment onder Noorse zesjarigen dat een sneller tempo van letteraanbod betere resultaten gaf op letterkennis, woordlezen en spelling; de laagst presterende kinderen profiteerden het meest [S41].

De keerzijde: het ideale tempo is niet bekend, en dit onderzoek gaat over **groep 2-achtige letterinstructie**, niet over de vraag of formele leesinstructie naar groep 2 moet worden verplaatst [S14]. Voor het spel betekent het vooral: **geen star "één letter per week"-slot**. Gebruik korte cycli waarin letters terugkomen, en herhaal liever vaker dan dat je eindeloos bij één letter blijft hangen.

## 4. Volgorde en tempo [M]

### 4.1 Veilig Leren Lezen (Kim-versie)

VLL Kim werkt met kernen: elke kern draait om een thema en een set **structureerwoorden** [S23]. De eerste letters in groep 3 zijn `i, k, m, s`; daarmee lezen kinderen meteen woorden als `ik`, `kim` en `mis` [S20]. Daarna volgt kern 1 met `p, aa, r, e, v` en woorden als `kip`, `aap`, `raak`, `rem`, `vis` [S21]. Kern 2 heeft de structureerwoorden `maan`, `pet`, `meet`, `been`, `boot`; de nieuwe letters daarin zijn `n, t, ee, b, oo` [S23]. Kern 3 voegt `d, oe, z, ij, h` toe [S22].

De structuur is dus: **één nieuwe letter per structureerwoord, en dat woord is meteen leesbaar met de letters die het kind al kent**. De wandplaten laten per kern zien welke structureerwoorden centraal staan: `ik – kim – sim`, `kip – aap – raak – rem – vis`, `maan – pet – meet – been – boot`, `doos – doek – zee – ijs – haar`, `wip – zon – zak – bus – jas`, `jeuk – ziek – lijm – hout – vuur`, `mug – saus – muis – duif – geit` [S23]. Per kern komen ongeveer vijf letters aan bod [S21][S22].

De nieuwste VLL-versie is **Zoem**; de Kim-versie is de vorige generatie [S18][S25]. Zoem start volgens de publieke didactiekpagina met `i, k, m, s, aa`, werkt met acht ankers in plaats van elf kernen, en heeft als expliciete wijziging dat de letters `b` en `d` verder uit elkaar liggen [S25][S26]. Dat is een mooie aanwijzing dat de methode zelf rekening houdt met visuele verwarring.

### 4.2 Lijn 3 (tweede editie)

Lijn 3 zet niet het hele woord, maar **de letter centraal**. De methode stelt dat leren lezen met kapstokwoorden het risico heeft dat kinderen zich de elementaire leeshandeling onvoldoende eigen maken; daarom is de letter het startpunt [S30]. Lijn 3 werkt met acht thema's van vier weken en een instapweek. In de instapweek leren kinderen `i, n, k`; in thema 1 komen onder meer `s, d, ee, aa, t, r, l, oo, e, m` aan bod [S30]. De exacte dagvolgorde staat in de betaalde handleiding en in de pakketwijzer; publiek is die niet volledig te verifiëren [S34].

Lijn 3 biedt letters auditief, visueel en tactiel aan [S31]. De methode werkt met directe instructie, hardop denkend voordoen, samen lezen en voor-koor-door-lezen [S30]. Lezen, schrijven en spelling zijn gekoppeld: de letter wordt dezelfde dag gelezen en geschreven (Klinkers) en een week later gespeld [S30][S32]. De lettervolgorde, liniatuur, jaarplanning en thema's van Lijn 3 en Klinkers zijn op elkaar afgestemd [S30].

### 4.3 Vergelijking van de start

| Aspect          | VLL Kim                                                                  | VLL Zoem                                                 | Lijn 3 (2e editie)                                                                       |
| --------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Eerste letters  | `i, k, m, s` [S20]                                                       | `i, k, m, s, aa` [S26]                                   | `i, n, k` in de instapweek [S30]                                                         |
| Eerste woorden  | `ik`, `kim`, `mis` [S20]                                                 | Niet publiek volledig te verifiëren                      | Niet publiek volledig te verifiëren                                                      |
| Structuur       | Kernen met structureerwoorden [S23]                                      | Acht ankers [S25]                                        | Acht thema's van vier weken [S30]                                                        |
| Nieuwe letters  | Ongeveer vijf per kern [S21][S22]                                        | Per anker, exacte aantallen niet publiek [S25]           | Meerdere per thema; exacte dagvolgorde in de handleiding [S30][S34]                      |
| Didactiek       | Vijf stappen, klank/articulatie/vorm/schrijven, zoemend lezen [S19][S27] | Alzijdig verkennen, klankbewustzijn, klankenzoeker [S26] | Letter centraal, directe instructie, voor-koor-door, auditief/visueel/tactiel [S30][S31] |
| Schrijven       | Geïntegreerd; Pennenstreken sluit aan [S29]                              | Geïntegreerd [S26]                                       | Klinkers, dezelfde dag [S30][S32]                                                        |
| Letternabijheid | Niet publiek gespecificeerd                                              | `b` en `d` verder uit elkaar [S25]                       | Niet publiek gespecificeerd                                                              |

**Belangrijk:** dit zijn de startpunten. De volledige handleidingen zijn commercieel en niet openbaar; ik heb alleen de publieke voorlichtingspagina's, brochures en wandplaten kunnen gebruiken. De exacte volgorde per dag en de verantwoording daarachter kan ik niet onafhankelijk verifiëren.

### 4.4 Waarom deze volgorde?

De publieke bronnen geven geen eenduidige verantwoording. Bij VLL is de volgorde zichtbaar gekoppeld aan de **structureerwoorden**: elk structureerwoord bevat één nieuwe letter en is meteen leesbaar met de bekende letters [S19][S23]. Dat is een didactische logica (van woord naar letter en terug), geen frequentielijst. Bij Lijn 3 zegt de brochure dat de lettervolgorde is afgestemd op de schrijfmethode Klinkers en op de thema's, maar geeft ze geen frequentie- of verwarringsanalyse [S30].

De SLO schrijft geen volgorde voor [S2][S3]. Er is dus geen "nationale" juiste volgorde. Wel zijn er een paar algemene ontwerpprincipes te verdedigen:

- **Begin met letters waarmee je meteen woorden kunt maken.** Dat is de kracht van de VLL-start `i, k, m, s` (`ik`, `is`, `mis`, `kim`) [S20].
- **Houd visueel sterk lijkende letters uit elkaar.** Zwijsen doet dat in Zoem met `b` en `d` [S25]. Dat is een pragmatische ontwerpkeuze; ik vond geen Nederlandse studie die aantoont dat een specifieke afstand optimaal is. Voor `m` en `n` vond ik geen publieke aanwijzing dat de methodes ze bewust uit elkaar houden; dat betekent niet dat kinderen ze niet verwarren, alleen dat de bronnen er niets over zeggen.
- **Introduceer klinkers vroeg.** Zonder klinkers kun je geen woorden lezen; VLL en Lijn 3 doen dat dan ook [S3][S20][S30].
- **Baseer de volgorde niet op "frequentie" zonder bron.** De publieke methodebronnen geven geen frequentieonderbouwing; wie dat wel claimt, moet de handleiding laten zien.

### 4.5 Tempo

De Kennisrotonde (2026) zegt dat één letter per week of één letter per twee weken op veel scholen gebruikelijk is, maar dat een hoger tempo effectiever lijkt. Het noemt als ruwe richting dat het effectief lijkt om binnen drie tot vier maanden het hele alfabet te doorlopen, met daarna herhalingsrondes; het ideale tempo is niet bekend [S14]. Sunde et al. (2019) vonden eveneens dat een sneller tempo beter werkte, vooral voor de zwakste leerlingen [S41].

De gangbare methodes zitten daar dichter bij dan bij één letter per week: VLL doet ongeveer vijf letters per kern [S21][S22], Lijn 3 meerdere letters per thema [S30]. Een ruwe schatting op basis van de publieke structuur is **1,5–2,5 nieuwe letters per week**, maar dat is een berekening van mij, geen gepubliceerd gegeven. Belangrijker dan het exacte getal: **plan herhaling in**. Een hoger tempo werkt alleen als de letters daarna terugkomen [S14].

### 4.6 Wat doen de groep 1–2-methodes?

De grote groep 1–2-methodes die ik heb bekeken, zijn brede, thematische programma's waarin taal, spel en ontwikkeling centraal staan; geen ervan publiceert een vaste lettervolgorde zoals VLL of Lijn 3. Letters komen zijdelings aan bod. Dat is precies de fase waarin het spel zijn plek moet vinden: **als aanvulling op een breed kleuterprogramma, niet als vervanging daarvan**.

| Methode                              | Aanbieder       | Insteek                                                                                                                                                                        | Letteraanpak publiek vindbaar?                                                                           |
| ------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Schatkist 3**                      | Zwijsen         | Thematisch, spelend en onderzoekend leren in groep 1–2; sluit volgens Zwijsen aan op de didactiek van VLL Kim [S28][S29]                                                       | Geen aparte lettervolgorde op de publieke pagina; voorbereidend lezen is onderdeel van het brede aanbod. |
| **Piramide**                         | Piramidemethode | VVE-programma voor 0–7 jaar; projectmatig (oriënteren, demonstreren, verbreden, verdiepen); taalontwikkeling inclusief ontluikende en beginnende geletterdheid [S36][S37][S56] | Geen publieke letterlijn; de doelen zijn beschreven per ontwikkelingsgebied, niet per letter.            |
| **Startblokken / Basisontwikkeling** | De Activiteit   | Spel en interactie als motor; thema's met "spel met lezen, schrijven en rekenen" [S35]                                                                                         | Geen publieke letterlijn; geletterdheid is ingebed in spel.                                              |
| **LOGO 3000**                        | Rezulto         | Woordenschatprogramma met de BAK-lijst van 3000 woorden; liedjes, praatplaten en activiteiten [S8]                                                                             | Geen letterdidactiek; het is expliciet een woordenschatprogramma.                                        |
| **Ik & Ko**                          | —               | Groep 1–2; publieke didactiekpagina niet gevonden                                                                                                                              | Daarom niet vergeleken.                                                                                  |

**Conclusie [M]:** de groep 1–2-methodes geven een rijke context en een speelse houding, maar geen bruikbare letterreeks voor een digitaal spel. Voor de volgorde moet je bij de groep 3-methode zijn (VLL of Lijn 3), of bij een eigen, verantwoorde startset.

## 5. Differentiatie en risico's [W + C]

### 5.1 Voorspellers en signalen

Letterkennis en fonemisch bewustzijn zijn belangrijke voorspellers van het latere lezen [S15][S42]. In een Nederlandse longitudinale studie van Aarnoutse, Van Leeuwe en Verhoeven (2005) voorspelden vooral **letterkennis en snel benoemen van letters** de ontwikkeling van woordherkenning in de kleuterperiode en de eerste schooljaren; voor spelling waren dat snel benoemen van cijfers en letterkennis [S42]. Ook internationaal onderzoek van Schatschneider et al. (2004) vindt dat letterkennis een van de sterkste voorspellers is [S43].

Kinderen met een risico op leesproblemen hebben meer baat bij expliciete, herhaalde instructie; de NRP-meta-analyse vond juist bij kinderen met een risico grote effecten van fonemisch bewustzijnstraining [S38]. Extra oefening werkt het best in kleine groepen met expliciete instructie en veel herhaling [S38][S40]. De methodes differentiëren zelf ook op letterkennis: VLL baseert de niveaus en oefeningen op de eigen letterkennis van het kind [S18], en Lijn 3 werkt met een dubbele leeslijn [S30]. Het Protocol Leesproblemen en Dyslexie voor groep 3 stelt dat ongeveer **één op de tien kinderen** moeite heeft met leren lezen en spellen, en dat vroegtijdig signaleren en begeleiden effectiever is dan laat ingrijpen [S12]. Het protocol werkt met signaleringstaken rond letterkennis, auditieve analyse en synthese, letters benoemen en spontane spelling [S55]. In september 2026 is een geactualiseerde versie van het protocol voor het primair onderwijs verschenen [S13].

**Voor het spel:** een letter-spel is geen diagnostisch instrument. Het kan wel patronen zichtbaar maken (welke letters komen steeds terug, welke klanken worden verward), maar de interpretatie en de vervolgstap horen bij school en de leesspecialist. Geen labels, geen "dyslexie"-claim, geen automatische doorverwijzing.

### 5.2 Automatisering en herhaling

Automatisering is het punt waar letterkennis leesvaardigheid wordt. VLL herhaalt bekende letters blijvend in woorden en zinnen en laat nieuwe woorden oefenen met bekende woorddelen om te automatiseren [S19]. Verhoeven et al. (2022) beschrijven woordlezen als een zelflerend proces waarin **blootstelling en herhaling** centraal staan: elke keer dat een kind een woord tegenkomt, wordt de orthografische informatie sterker opgeslagen [S45].

De Kennisrotonde noemt gespreide herhaling (distributed practice) als een van de verklaringen waarom een hoger tempo met herhalingsrondes werkt: bij een tempo van één letter per dag komt een letter na 18–36 dagen terug, en dat lijkt gunstig voor het onthouden van een set items [S14]. Voor een spel betekent dat: **niet eenmalig goed = beheerst**, maar terug laten komen op toenemende tussenpozen, en fouten eerder laten terugkomen.

### 5.3 Overvraging in groep 2

Hier zit een echte spanning in de bronnen.

- Enerzijds: formeel technisch lezen begint in groep 3 [S3][S5], en groep 2 is een fase van spel en brede ontwikkeling [S15].
- Anderzijds: letterkennis en fonemisch bewustzijn voorspellen het latere lezen [S15][S42], en als je letters aanbiedt, lijkt een hoger tempo met herhaling beter dan één letter per week [S14][S41].

Mijn interpretatie: **dat pleit niet voor vervroegd formeel leesonderwijs, maar voor een speels en herhaald letteraanbod zonder leesdruk**. Een kind in groep 2 hoeft geen leesmethode te doorlopen, maar mag best letters leren kennen als het daarin geïnteresseerd is. De fout zit niet in "letters aanbieden" op zich, maar in het kopiëren van de schoolse structuur, toetsing en prestatiedruk van groep 3 naar groep 2. De Kennisrotonde benadrukt dat schoolrijpheid een "match" is tussen kind en school, geen kwestie van zo vroeg mogelijk [S15].

Voor het spel: **geen niveaus die als "achterstand" voelen, geen tijdsdruk, geen verlies, geen streaks die straffen, geen diagnostische taal**. Wel: korte sessies, veel succes, en een duidelijke "stop"-optie.

## 6. Digitaal oefenen [W]

### 6.1 Wat zeggen de meta-analyses?

| Bron                             | Wat onderzocht                                                                           | Effect                            | Nuance                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Blok et al. (2002) [S48]         | Computerondersteund aanvankelijk lezen, 42 studies                                       | d ≈ 0,19                          | Zwakke studiekwaliteit; effect afhankelijk van voormeting en taal.                                                          |
| Verhoeven et al. (2020) [S44]    | Computerondersteunde vroege geletterdheid, peuter/kleuter, 59 studies                    | d ≈ 0,28                          | Groter als onderdeel van een geïntegreerd klassensysteem; kleiner bij strengere designs.                                    |
| Verhoeven et al. (2022) [S45]    | Computerondersteund woordlezen, basisschool, 67 studies, 10.734 kinderen                 | d ≈ 0,36                          | Transfer naar begrijpend lezen d ≈ 0,21; veel variatie.                                                                     |
| Vanbecelaere et al. (2023) [S46] | Digitale interventies in de reguliere klas voor vroeg lezen, 72 studies, 60.890 kinderen | g ≈ 0,37                          | Gamification en adaptiviteit maakten weinig verschil.                                                                       |
| Wouters et al. (2013) [S49]      | Serious games in het algemeen, 77 studies                                                | d ≈ 0,29 leren; d ≈ 0,36 retentie | Niet significant meer motiverend (d ≈ 0,26, ns); beter bij aanvulling op andere instructie, meerdere sessies en groepswerk. |

De conclusie is bescheiden: **digitale interventies kunnen werken, maar de effecten zijn klein tot matig**. Ze zijn geen vervanging van goede leesinstructie. Dat sluit aan bij Piasta en Wagner (2010), die vonden dat letterinstructie in een schoolse setting grotere effecten had dan thuis, en dat kleinegroepsinstructie groter was dan individuele tutoring [S40]. Ook de NRO-toolkit noemt voor aanpakken voor ontluikende/beginnende geletterdheid een leerwinst van ongeveer vier maanden, met vooral effect voor gerichte begeleiding in kleine groepen [S16]. Een thuisspel is dus in de eerste plaats een aanvulling, geen hoofdinterventie.

### 6.2 Wat lijkt te werken?

Verhoeven et al. (2022) trekken uit de succesvolle interventies de conclusie dat die **op klank-letterinstructie gebaseerd, adaptief, intensief en volgehouden** waren [S45]. Correctieve feedback was een van de werkzame elementen bij leesvloeiendheid [S45]. Ook noemen ze dat de GraphoGame-meta-analyse van McTigue et al. (2019) geen overall effect vond, maar dat **interactie met een volwassene** een significante moderator was: implementaties met veel begeleiding door een volwassene deden het beter [S45].

Dat is een belangrijk ontwerppunt voor thuis: **een ouder of verzorger die af en toe meedoet, meeleest en de klank voordoet, is geen luxe maar een werkzaam ingrediënt**. Een spel dat kinderen volledig alleen laat, mist dat.

### 6.3 Wat niet bewezen is

- **Adaptiviteit is niet automatisch beter.** Vanbecelaere et al. (2020) vonden geen verschil tussen een adaptieve en een niet-adaptieve versie van een leesgame bij 191 kleuters; alle condities gingen vooruit op fonemisch bewustzijn en letterkennis [S47]. In de grotere meta-analyse van 2023 maakten gamification en adaptiviteit weinig verschil [S46].
- **"Serious game" is geen kwaliteitslabel.** Wouters et al. (2013) vonden een klein leereffect, maar geen significant motivatievoordeel; games deden het beter als ze werden aangevuld met andere instructie, met meerdere sessies en in groepsverband [S49].
- **Multisensorisch is niet bewezen superieur.** De kleine studie van Schlesinger en Gray (2017) vond geen voordeel boven gestructureerde instructie [S50].

De werkzame ingrediënten lijken vooral: **expliciete klank-letterinstructie, veel oefening, correctieve feedback, herhaling en een betrokken volwassene**. Niet: zo veel mogelijk game-elementen, badges of een adaptief algoritme.

## 7. Implicaties voor het spel

### 7.1 Doelgroep en positionering

- **Leeftijd:** ongeveer 4–7 jaar, met twee modi: "ontdekken" (groep 1–2) en "oefenen" (groep 3).
- **Positionering:** aanvulling op school, geen methode, geen diagnose. De app zegt expliciet: "Dit spel oefent letters; je leerkracht leert je lezen."
- **Sessies:** 5–10 minuten, liever dagelijks kort dan één keer per week lang. Dat is een ontwerpkeuze op basis van de nadruk op herhaling [S14][S45], geen direct onderzocht optimum.
- **Differentiatie:** pas de moeilijkheid aan op basis van beheersing, maar blijf herhalen. Adaptiviteit is een hulpmiddel, geen bewijs [S46][S47].

### 7.2 Welke letters, welke groep?

- **Startset:** `i, k, m, s` is verdedigbaar omdat je er meteen woorden mee kunt maken (`ik`, `is`, `mis`, `kim`) en omdat VLL zo start [S20]. Lijn 3 start met `i, n, k` [S30]. Kies je voor aansluiting bij Lijn 3, begin dan met `i, n, k` en voeg daarna `s`, `aa`, `e`, `r`, `d` toe.
- **Sluit aan bij school:** laat de ouder/leerkracht kiezen uit "VLL Kim", "VLL Zoem", "Lijn 3" of "vrij oefenen". Toon daarbij eerlijk dat de volgorde een benadering is en dat de schoolmethode leidend is.
- **Geen alle-26-tegelijk:** kies een cyclus van 4–6 nieuwe letters en herhaal die daarna. Dat is een ontwerpkeuze; de bron noemt alleen dat een hoger tempo met herhaling beter lijkt [S14].
- **Houd `b` en `d` uit elkaar** in de introductie en in memory-opdrachten; Zwijsen doet dat in Zoem ook [S25].
- **Hoofdletters:** later en apart. SLO plaatst de term "hoofdletter" bij groep 3–4 [S7]; leesmethodes starten met kleine letters [S20][S30]. Een memory kleine letter–hoofdletter is dus een oefening voor gevorderden, niet voor de eerste kennismaking.

### 7.3 Oefenvormen

| Oefening                        | Wat het oefent                                             | Ontwerpvoorwaarde                                                                                              | Prioriteit |
| ------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- |
| **Horen → klank → klik letter** | Foneem-grafeemkoppeling; de kern van decoderen [S38][S39]  | Korte, zuivere klank; 3–4 letterknoppen; directe feedback; geen letter naam inspreken                          | Must       |
| **Letter → plaatje**            | Letterklank koppelen aan betekenis                         | Alleen woorden met een eenduidige eerste klank; geen `schaap` voor /s/; 3 opties                               | Must       |
| **Auditieve analyse**           | Begin-, midden- of eindklank herkennen [S10]               | Audio-only vraag, daarna letter onthullen; geen tekst als het kind nog niet leest                              | Must       |
| **Woord bouwen**                | Synthese/klankversmelting; elementaire leeshandeling [S31] | Pas na 4–5 letters; mkm-woorden; audio als model                                                               | Should     |
| **Letter memory (klein–klein)** | Visuele letterherkenning                                   | Grote kaarten, geen tijdsdruk, geen afleidende plaatjes                                                        | Should     |
| **Letter memory (klein–hoofd)** | Letterconventie                                            | Pas als kleine letters beheerst zijn; hoofdletters apart uitleggen [S7]                                        | Later      |
| **Letter traceren**             | Motorische lettervorm                                      | Optioneel; duidelijke start en richting; niet als hoofdmodus; herinner aan schrijven op papier [S51][S52]      | Nice       |
| **Zoemend lezen**               | Vloeiend lezen                                             | Pas als letters geautomatiseerd zijn; audio-model; geen hakkerig "hakken en plakken" als enige strategie [S27] | Later      |

**Belangrijk voor `letter → plaatje`:** naar mijn inschatting is dit didactisch zwakker dan klank → letter, omdat het kind kan gokken op basis van de plaatjes. Gebruik het als _extra_ oefening, niet als hoofdmechanisme. En gebruik alleen woorden waarvan de eerste klank eenduidig is; vermijd woorden met `sch-`, `ch-`, `ij`/`ei`-verwarring of stomme letters in de eerste positie.

### 7.4 Feedback en voortgang

- **Direct en specifiek:** "Je hoorde /m/. Dat is de m." Toon de letter, speel de klank opnieuw af, laat opnieuw proberen.
- **Geen fout-straf:** geen rode kruizen, geen levens, geen puntenverlies. Gebruik "nog een keer" en "bijna".
- **Mastery, geen aflijsting:** een letter is niet "klaar" na één goed antwoord. Laat hem terugkomen na 1, 3, 7 en 14 dagen, en vaker bij fouten. Dat is een ontwerpkeuze geïnspireerd op gespreide herhaling [S14], geen gevalideerd SRS-algoritme voor letters.
- **Interleaving:** meng bekende en nieuwe letters, zoals VLL dat doet in wisselende combinaties [S19]. Dat voorkomt dat een kind alleen het laatste rijtje kan.
- **Voortgang lokaal:** `localStorage`; geen account nodig en geen server. Toon alleen wat het kind nodig heeft; geen ranglijst, geen vergelijking met anderen.
- **Ouder/verzorger:** een korte tip na de sessie ("Noem de /m/ nog eens; laat je kind de letter op papier schrijven") versterkt de betrokkenheid die in de meta-analyse een moderator was [S45].

### 7.5 Visueel en audio

**Letters:**

- Kleine letters, geen cursief, geen decoratieve fonts. Gebruik een eenvoudig sans-serif met duidelijke `a`, `g`, `t` en `l`.
- **Geen Dyslexie-font als "oplossing".** Kuster et al. (2018) vonden geen voordeel van het Dyslexie-font boven Arial bij het lezen van teksten en woorden door kinderen met en zonder dyslexie [S53]; een meta-analyse uit 2026 vond overall geen betrouwbaar effect (g = −0,04) [S54]. Voor losse letters is er geen bewijs dat een speciaal font helpt. Een schoon, ruim letterschrift is belangrijker dan een speciaal font.
- **Grote letters:** minimaal ongeveer 72 px op 390 px breed, met voldoende ruimte tussen letters. Geen letters tegen een drukke achtergrond.
- **Kleur:** gebruik kleur alleen als tweede signaal. VLL deelt letters in vier families in (korte klinkers, lange klinkers, tweetekenklinkers, medeklinkers) [S24]; de exacte kleuren kon ik niet publiek verifiëren. Als je kleur gebruikt, kies één conventie en leg die uit; gebruik nooit alleen kleur om een verschil aan te duiden.
- **Schrijfrichting:** als je een traceer-oefening maakt, toon startpunt en richting, en laat het kind echt overtrekken. Een pijltje zonder oefening is decoratie. Verwijs daarnaast naar schrijven op papier [S51][S52].

**Audio:**

- **Geen TTS die letters als namen uitspreekt.** "em", "es", "aa" zijn namen; voor decoderen heb je `/m/`, `/s/`, `/aa/` nodig [S38][S39]. Neem klanken op met een mens of genereer ze en laat ze controleren.
- **Korte, zuivere klanken.** Vermijd een aangehangen schwa ("muh", "suh") waar dat het samenvoegen belemmert. Dit is een praktische eis; laat de set door een leesspecialist beluisteren.
- **Eén stem, één volume, geen achtergrondmuziek** tijdens klanktaken.
- **Herhaalbaar:** elke klank heeft een grote "luister nog eens"-knop; autoplay is na een tik toegestaan.
- **Tekstfallback:** toon de letter altijd visueel; voor accessibility is er een tekstalternatief.

### 7.6 Wat je vooral niet moet doen

- **Geen letterbenoeming als hoofddoel.** "Welke letter is dit?" leert de naam, niet de klank. De kern moet zijn: "Welke letter hoort bij /m/?"
- **Geen hoofdletters of cursief in de eerste levels.** Kleine leesletters eerst [S7][S20][S30].
- **Geen `b` en `d` naast elkaar** in de eerste oefeningen [S25].
- **Geen TTS-letternamen** (zie boven).
- **Geen ambigue plaatjes** bij `letter → plaatje`.
- **Geen Dyslexie-font** als marketingclaim [S53][S54].
- **Geen kleur als enige signaal.**
- **Geen tijdsdruk, levens, leaderboards of streaks.** Die passen niet bij de speelse fase en bij een kind van 4–7; laat het kind zelf stoppen.
- **Geen diagnose of "dyslexie-oefening"** claimen. Een spel is geen protocol [S12].
- **Geen methode-personages, artwork of structureerwoorden kopiëren.** Namen, personages en beeldmateriaal van VLL (Kim, Zoem, opa), Lijn 3 (bus, Leesstad) en Klinkers zijn eigendom van de uitgevers. Een lettervolgorde is feitelijk, maar de didactische uitwerking en het beeldmateriaal niet.
- **Geen nieuwe backend, analytics of externe requests; geen accountverplichting.** Dat is niet alleen een app-regel; het past ook bij de leeftijdsgroep.

### 7.7 Technische inpassing

Een minimale slice-indeling die bij de bestaande FSD-structuur past:

| Laag      | Project                                    | Inhoud                                                                     |
| --------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| Entity    | `libs/entities/letters`                    | lettertypes, klank/letter-mapping, volgordes, woordlijsten, mastery-regels |
| Feature   | `libs/features/letter-game`                | Zustand-store, vraaggenerator, audio-hook, oefen-UI                        |
| Page      | `libs/pages/letters`                       | levelkeuze, methodekeuze, `GameShell`                                      |
| App       | `apps/games/src/app/router.tsx`            | route `/letters`                                                           |
| Catalogus | `libs/entities/game/model/game-catalog.ts` | `available`-entry                                                          |

- **Audio:** `apps/games/public/audio/letters/` met vooraf gegenereerde bestanden; versiemap (`v1/`) zodat je bij een nieuwe stem geen oude cache houdt. `media-src 'self'` in `_headers`.
- **Geen runtime-TTS.** De app leest alleen statische bestanden.
- **Voortgang:** `localStorage`; geen nieuwe backend of sync. Bestaande lokale profielen kunnen eventueel gebruikt worden, maar zijn niet nodig.
- **Tests:** unieke letter-id's, bestaande audiobestanden, geen dubbele antwoordopties, mastery-overgangen, en een test dat elke `letter → klank`-combinatie een audio-bestand heeft.
- **UI:** 44 px touch-targets, één kolom op 390 px, twee op 1024 px, `prefers-reduced-motion`, zichtbare focus, `aria-live` voor feedback.

## 8. Open vragen / nog verifiëren

1. **Exacte lettervolgorde en tempo van VLL Zoem en Lijn 3 (2e editie).** De publieke brochures geven startpunten en structuur, maar niet de volledige dag-tot-dag-volgorde of de verantwoording. Daarvoor zijn de betaalde handleidingen nodig.
2. **Kleurconventie van VLL.** VLL deelt letters in vier families in [S24], maar ik kon niet publiek verifiëren welke kleuren daarbij horen. Gebruik kleur daarom niet als je de methode niet precies volgt.
3. **Nederlandse replicatie van Sunde et al. (2019).** Het onderzoek is Noors en gaat over zesjarigen in het eerste schooljaar. De generalisatie naar Nederlandse groep 2 is plausibel maar niet direct bewezen [S41].
4. **Optimale sessieduur en frequentie voor een thuisspel.** De meta-analyses zeggen iets over intensiteit en duur van interventies, niet over 5-minutensessies op een tablet [S45][S46].
5. **Effect van finger tracing op een touchscreen.** De handschriftstudies gebruiken pen en papier of fysiek traceren [S51][S52]; een touchscreen is een andere motorische taak.
6. **Welke letters Nederlandse kinderen het vaakst verwarren.** Ik vond geen publieke Nederlandse studie die een complete verwarringsmatrix geeft. `b`/`d` is een bekende methodische keuze [S25], maar niet de enige mogelijkheid.
7. **Effect van een speciaal letter-spel bovenop de schoolmethode.** Ik vond geen RCT die precies deze interventie (Nederlands, thuis, 4–7 jaar, 5–10 minuten) onderzoekt. De effectgroottes komen uit bredere meta-analyses.
8. **Of hoofdletters vóór of na kleine letters moeten.** De Nederlandse methodes kiezen kleine letters [S20][S30], maar veel onderzoek naar letterkennis is Engels en gebruikt in experimenten vaak hoofdletters, zoals Longcamp et al. [S51]. Voor de Nederlandse leesontwikkeling is kleine letters de logische keuze, maar het is geen uitgemaakte wetenschappelijke wedstrijd.
9. **Ik & Ko.** Ik vond geen publieke uitgeverspagina met de didactiek en letteraanpak van deze groep 1–2-methode. Daarom staat die niet in de vergelijking.
10. **Adaptiviteit en gamification.** De ene meta-analyse vindt weinig meerwaarde [S46], de andere noemt adaptiviteit juist als kenmerk van succesvolle interventies [S45]. Het is goed mogelijk dat "adaptief" in de praktijk iets anders betekent dan in de studies; dat vraagt om een eigen pilot, niet om een marketingclaim.

## Verantwoording

Dit is een bronnenonderzoek, geen eigen effectstudie. Ik heb waar mogelijk primaire bronnen gebruikt: SLO-publicaties, de tussendoelen en protocollen van het Expertisecentrum Nederlands, NRO/Kennisrotonde, de Inspectie, de Wet op het primair onderwijs en peer-reviewed artikelen. Commerciële methodebronnen (Zwijsen, Malmberg) gebruik ik alleen voor de beschrijving van didactiek en volgorde; hun effectclaims zijn niet onafhankelijk en staan niet als bewijs in dit stuk. De volledige handleidingen van VLL en Lijn 3 zijn niet openbaar; wat ik niet kon verifiëren, staat in sectie 8.

## Bronnen

Alle bronnen hieronder zijn op **2026-10-18** geraadpleegd.

### Curriculum, overheid en onderwijsadvies

- **[S1]** SLO, _Kerndoelen primair onderwijs_ (printversie juli 2026). https://www.slo.nl/publish/pages/23619/kerndoelen-primair-onderwijs-slo-2026-printversie-juli-2026.pdf
- **[S2]** SLO, _Kerndoelen_ (pagina, 11 augustus 2026). https://www.slo.nl/sectoren/po/kerndoelen
- **[S3]** SLO, _Inhoudslijn PO Nederlands – Lezen_ (06-2020). https://www.slo.nl/publish/pages/15247/inhoudslijnen_po_nederlands_lezen_def.pdf
- **[S4]** SLO, _Inhoudslijn PO Nederlands – Schrijven_ (06-2020). https://www.slo.nl/publish/pages/15249/inhoudslijnen_po_nederlands_schrijven.pdf
- **[S5]** SLO, _Inhoudskaart taal jonge kind, fase 1_ (augustus 2021). https://www.slo.nl/publish/pages/4801/inhoudskaart-po-taal-fase110-2020.pdf
- **[S6]** SLO, _Doelen jonge kind_ (31 juli 2023). https://www.slo.nl/thema/meer/jonge-kind/doelen-jonge-kind/
- **[S7]** SLO, _Leerlijn schriftconventies_ (groep 1–8). https://www.slo.nl/thema/vakspecifieke-thema/nederlands/leerlijn-begrippen-taalbeschouwing/schriftconventies-0
- **[S8]** SLO, _TAAL: Programma's en (thematische) lespakketten peuters-kleuters_ (mei 2024). https://www.slo.nl/publish/pages/20547/programma_s-lespakketten_taal_jonge_kind_05-2024_.pdf
- **[S9]** Wet op het primair onderwijs, artikel 9 (geldend 1 augustus 2026). https://wetten.overheid.nl/BWBR0003420/2026-08-01
- **[S10]** Expertisecentrum Nederlands, _Tussendoelen beginnende geletterdheid. Een leerlijn voor groep 1 tot en met 3_ (2013; PDF). https://dyslexiecentraal.nl/sites/default/files/media/document/2019-08/overzicht_tussendoelen_beginnende_geletterdheid.pdf
- **[S11]** Expertisecentrum Nederlands, _Doorlopende leerlijnen taal_. https://expertisecentrumnederlands.nl/doorlopende-leerlijnen-taal
- **[S12]** Expertisecentrum Nederlands / Dyslexie Centraal, _Protocol Leesproblemen en Dyslexie voor groep 3_ (2011; bijgewerkt). https://dyslexiecentraal.nl/doen/materialen/protocol-leesproblemen-en-dyslexie-voor-groep-3
- **[S13]** Dyslexie Centraal, _Protocol Leesproblemen en Dyslexie primair onderwijs_ (geactualiseerde versie, september 2026). https://dyslexiecentraal.nl/materialen/protocol-po
- **[S14]** Kennisrotonde (NRO), _Is het effectiever om leerlingen in groep 2 één of meerdere letters per week aan te leren?_ (17 maart 2026). https://www.kennisrotonde.nl/vraag-en-antwoord/letters-leren-in-groep-2-en-effect-op-lezen
- **[S15]** Kennisrotonde (NRO), _Welke ontwikkelingskenmerken hangen samen met een succesvolle overgang van groep 2 naar groep 3?_ (21 maart 2023; PDF). https://www.kennisrotonde.nl/sites/kennisrotonde/files/media-files/PDF%20voor%20website-Kennisrotonde-antwoord%20VRAAG-1565.pdf
- **[S16]** Onderwijskennis (NRO), _Ontluikende/beginnende geletterdheid_ (Toolkit Jonge Kind). https://www.onderwijskennis.nl/toolkit-jonge-kind/ontluikende/beginnende-geletterdheid
- **[S17]** Inspectie van het Onderwijs, _Peil.onderwijs: Leesvaardigheid_. https://www.onderwijsinspectie.nl/onderwerpen/peil-onderwijs/nederlandse-taal/leesvaardigheid
- **[S55]** SLO, _Kindvolgsystemen voor kleuters (groep 1 en 2)_. https://www.slo.nl/thema/meer/jonge-kind/kindvolgsystemen/kleuters-kvs
- **[S56]** Nederlands Jeugdinstituut, _Uitgebreide beschrijving Piramide_ (2021). https://www.nji.nl/system/files/2021-04/Uitgebreide-beschrijving-Piramide.pdf

### Commerciële methodes (alleen ter beschrijving, niet als effectbewijs)

- **[S18]** Zwijsen, _Veilig leren lezen – aanvankelijk lezen groep 3_ (Kim-versie). https://www.zwijsen.nl/lesmethodes/veilig-leren-lezen-kim-versie
- **[S19]** Zwijsen, _Waarom Veilig leren lezen kim-versie?_ (didactiek, vijf stappen). https://www.zwijsen.nl/lesmethodes/veilig-leren-lezen-kim-versie/waarom-veilig-leren-lezen-kim-versie
- **[S20]** Zwijsen, _Mijn kind leert lezen! Kern start_. https://www.zwijsen.nl/leren-lezen/mijn-kind-leert-lezen-kern-start
- **[S21]** Zwijsen, _Mijn kind leert lezen! Kern 1_. https://www.zwijsen.nl/leren-lezen/mijn-kind-leert-lezen-kern-1/
- **[S22]** Zwijsen, _Mijn kind leert lezen! Kern 3_. https://www.zwijsen.nl/leren-lezen/mijn-kind-leert-lezen-kern-3
- **[S23]** Zwijsen, _Wandplaten Kim-versie_ (structureerwoorden per kern). https://www.zwijsen.nl/lesmateriaal/wandplaten?lesmethode=veilig-leren-lezen-kim-versie
- **[S24]** Zwijsen, _Letterbord – Veilig leren lezen kim-versie_ (vier letterfamilies). https://www.zwijsen.nl/lesmateriaal/letterbord?lesmethode=veilig-leren-lezen-kim-versie
- **[S25]** Zwijsen, _Veilig leren lezen kim-versie en Zoem: de verschillen_ (2 juni 2026). https://www.zwijsen.nl/leren-lezen/veilig-leren-lezen-kim-versie-en-zoem-de-verschillen/
- **[S26]** Uitgeverij Zwijsen (BE), _Veilig leren lezen Zoem-versie – Didactiek_. https://www.uitgeverijzwijsen.be/veiliglerenlezen/visie/didactiek
- **[S27]** Uitgeverij Zwijsen (BE), _Help! Mijn leerlingen lezen niet vlot_ (zoemend lezen, 15 juni 2023). https://www.uitgeverijzwijsen.be/blog/help-mijn-leerlingen-lezen-niet-vlot
- **[S28]** Zwijsen, _Schatkist 3 – totaalaanbod groep 1 & 2_. https://www.zwijsen.nl/lesmethodes/schatkist/
- **[S29]** Zwijsen, _De doorgaande leerlijn van Zwijsen_ (Schatkist, VLL, Pennenstreken). https://www.zwijsen.nl/de-doorgaande-leerlijn-van-zwijsen
- **[S30]** Malmberg, _Informatiebrochure Lijn 3_ (tweede editie, 2024). https://malmberg.nl/hubfs/Lijn%203%20Informatiebrochure%202024.pdf
- **[S31]** Malmberg, _Lijn 3 – Verkorte leerroute_ (2016/2020; letterkennis, elementaire leeshandeling, tactiel aanbod). https://actueel.malmberg.nl/wp-content/uploads/2020/05/Lijn-3-Verkorte-leerroute.pdf
- **[S32]** Malmberg, _Informatiebrochure Klinkers_ (2025). https://malmberg.nl/hubfs/611423_Klinkers_Informatiebrochure.pdf
- **[S34]** Onderwijs van Morgen, _De lettervolgorde in Lijn 3_. https://www.onderwijsvanmorgen.nl/po/de-lettervolgorde-in-lijn-3/
- **[S35]** Startblokken van Basisontwikkeling, _Startblokken van Basisontwikkeling_ (De Activiteit). https://www.startblokken.info/
- **[S36]** Piramidemethode, _Piramide in het primair onderwijs_. https://piramidemethode.nl/primair-onderwijs
- **[S37]** SLO, _Beschrijving Piramide Digitaal_ (november 2022). https://www.slo.nl/publish/pages/19665/piramide_digitaal_beschrijving_slo_jonge_kind_11-2022.pdf

### Wetenschappelijke literatuur

- **[S38]** National Reading Panel, _Teaching Children to Read: An Evidence-Based Assessment of the Scientific Research Literature on Reading and Its Implications for Reading Instruction_ (2000). https://www.nichd.nih.gov/publications/pubs/nrp/report
- **[S39]** Ehri, L. C. (2023). _Phases of Development in Learning to Read and Spell Words_. American Educator. https://www.aft.org/ae/fall2023/ehri
- **[S40]** Piasta, S. B., & Wagner, R. K. (2010). Developing early literacy skills: A meta-analysis of alphabet learning and instruction. _Reading Research Quarterly, 45_(1), 8–38. https://doi.org/10.1598/RRQ.45.1.2
- **[S41]** Sunde, K., Furnes, B., & Lundetræ, K. (2019). Does introducing the letters faster boost the development of children's letter knowledge, word reading and spelling in the first year of school? _Scientific Studies of Reading, 24_(2), 1–18. https://doi.org/10.1080/10888438.2019.1615491
- **[S42]** Aarnoutse, C., van Leeuwe, J., & Verhoeven, L. (2005). Early literacy from a longitudinal perspective. _Educational Research and Evaluation, 11_(3), 253–275. https://doi.org/10.1080/08993400500101054
- **[S43]** Schatschneider, C., Fletcher, J. M., Francis, D. J., Carlson, C. D., & Foorman, B. R. (2004). Kindergarten prediction of reading skills: A longitudinal comparative analysis. _Journal of Educational Psychology, 96_(2), 265–282. https://doi.org/10.1037/0022-0663.96.2.265
- **[S44]** Verhoeven, L., Voeten, M., van Setten, E., & Segers, E. (2020). Computer-supported early literacy intervention effects in preschool and kindergarten: A meta-analysis. _Educational Research Review, 30_, 100325. https://doi.org/10.1016/j.edurev.2020.100325
- **[S45]** Verhoeven, L., Voeten, M., & Segers, E. (2022). Computer-assisted word reading intervention effects throughout the primary grades: A meta-analysis. _Educational Research Review, 37_, 100486. https://doi.org/10.1016/j.edurev.2022.100486
- **[S46]** Vanbecelaere, S., Said-Metwaly, S., Van den Noortgate, W., Reynvoet, B., & Depaepe, F. (2023). The effectiveness of Tier 1 digital interventions for early reading: A meta-analysis. _British Journal of Educational Technology, 54_(5), 1397–1432. https://doi.org/10.1111/bjet.13351
- **[S47]** Vanbecelaere, S., Cornillie, F., Sasanguie, D., Reynvoet, B., & Depaepe, F. (2020). The effectiveness of adaptive versus non-adaptive learning with digital educational games. _Journal of Computer Assisted Learning, 36_(4), 502–513. https://doi.org/10.1111/jcal.12416
- **[S48]** Blok, H., Oostdam, R. J., Otter, M. E., & Overmaat, M. (2002). Computer-assisted instruction in support of beginning reading instruction: A review. _Review of Educational Research, 72_(1), 101–130. https://doi.org/10.3102/00346543072001101
- **[S49]** Wouters, P., van Nimwegen, C., van Oostendorp, H., & van der Spek, E. D. (2013). A meta-analysis of the cognitive and motivational effects of serious games. _Journal of Educational Psychology, 105_(2), 249–265. https://doi.org/10.1037/a0031311
- **[S50]** Schlesinger, N. W., & Gray, S. (2017). The impact of multisensory instruction on learning letter names and sounds, word reading, and spelling. _Annals of Dyslexia, 67_(3), 219–258. https://doi.org/10.1007/s11881-017-0140-z
- **[S51]** Longcamp, M., Zerbato-Poudou, M.-T., & Velay, J.-L. (2005). The influence of writing practice on letter recognition in preschool children: A comparison between handwriting and typing. _Acta Psychologica, 119_(1), 67–79. https://doi.org/10.1016/j.actpsy.2004.10.019
- **[S52]** Ibaibarriaga, G., Acha, J., & Perea, M. (2025). The impact of handwriting and typing practice in children's letter and word learning: Implications for literacy development. _Journal of Experimental Child Psychology, 253_, 106195. https://doi.org/10.1016/j.jecp.2025.106195
- **[S53]** Kuster, S. M., van Weerdenburg, M., Gompel, M., & Bosman, A. M. T. (2018). Dyslexie font does not benefit reading in children with or without dyslexia. _Annals of Dyslexia, 68_(1), 25–42. https://doi.org/10.1007/s11881-017-0154-6
- **[S54]** Azzarello, C., Paek, S., Hodge, C., Jameson, M., & Lewis, J. (2026). Does font improve reading in dyslexic children? A meta-analysis of dyslexia-friendly fonts and dyslexic children's reading performance. _Annals of Dyslexia_ (online first). https://doi.org/10.1007/s11881-026-00389-8
