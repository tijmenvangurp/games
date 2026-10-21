# ADR 0026: Adaptief niveaumodel en foutvriendelijke feedback

- **Status:** Accepted — pilot met memory; evaluatie na de eerste uitrol
- **Datum:** 2026-10-20
- **Gerelateerd:** [ADR 0010](0010-tafel-topper.md) (rekenen), [ADR 0012](0012-optionele-accounts-en-sync.md) (profielen), [ADR 0013](0013-privacy-optionele-accounts.md) (privacy)

## Context

Elk spel heeft nu een vaste moeilijkheidskeuze: memory 6, 8 of 10 paren; sudoku 4×4, 6×6 of 9×9 met drie moeilijkheden; rekenen drie niveaus per mode; de quiz 3–5 namen; de woordzoeker 10–14; zoeken 5–9 kolommen. Kinderen kiezen daarbij bijna altijd het makkelijkste niveau. De app volgt het kind dus niet, terwijl juist een moeilijkheid die zichzelf bijstelt het kind in de leerkuil houdt.

Onderzoek naar leren geeft een band van ongeveer **70–85% goed**: genoeg succes om door te gaan, genoeg fout om te groeien. De eenvoudige regelaar is **k goede pogingen op een rij → één niveau omhoog; één fout → één niveau omlaag**. In evenwicht hoort daarbij een succeskans van `p = 2^(−1/k)`:

| k   | Evenwichtsaccuraatheid |
| --- | ---------------------- |
| 2   | 70,7%                  |
| 3   | 79,4%                  |
| 4   | 84,1%                  |

De formule geldt per niveau met een stabiele succeskans. Ze zegt niets over de vraag of een spel wel een zinvolle geordende moeilijkheidsas heeft. Een universele ladder van 1–10 zou daarom schijnprecisie geven: sudoku heeft grootte én clue-aantal, een woordzoeker heeft grootte, woorden én richtingen, en een schaakles is een lineaire instructie in plaats van een oefenreeks.

De code bevatte ook feedback die tegen de leerkuil in werkt: `playSound("wrong")` in zes features, rode kruisen, een grote zettenteller, "Harten op" in Pijlen en complimenten als "Foutloos!" en "knap gedaan". Alleen Frans had een werkend herhaalsysteem (Leitner) voor gemiste items.

## Beslissing

1. **Adaptief is de standaard waar een spel een zinvolle geordende moeilijkheidsas heeft.** Elk spel houdt een game-specifieke ladder bij. Is er geen echte as, dan forceren we er geen. De indeling staat hieronder.
2. **Het niveau is een spelparameter, geen universeel getal.** Memory gebruikt het aantal paren (4–12), sudoku een combinatie van grootte en clue-aantal, de quiz het aantal opties en de visuele degradatie, zoeken het aantal kolommen. Een niveau mag dus een object met meerdere dimensies zijn; de regelaar werkt op de index in een geordende, game-specifieke lijst.
3. **Doelband 70–85%, standaard k=2.** De regelaar telt opeenvolgende successen; bij k successen gaat het niveau één stap omhoog, bij een fout één stap omlaag. Elke game mag k en de grenzen aanpassen, maar de standaard is twee omhoog en één omlaag. De waarde `k` en de niveau-einden worden per game getest.
4. **De poging-eenheid is per game gedefinieerd.** Memory: een paar-poging. Sudoku: een celinvoer. Rekenen, quiz en Frans: een vraag. Woordzoeker: een woordpoging. Zoeken: een tik op een wezen. Schaakpuzzel: een zet. Pijlen: een tik op een pijl. De store logt die eenheid, maar **past het niveau pas aan het einde van een ronde toe**, met maximaal één stap per ronde. Zo demoteert één mismatch niet midden in een memory-bord.
5. **De streak loopt door tussen rondes.** Twee goede pogingen aan het einde van ronde 1 en de eerste goede poging van ronde 2 tellen als drie op een rij. Bij een niveauwissel wordt de streak gereset.
6. **Hulp komt in trapjes, nooit als antwoord.** Eerst wachten en een subtiele hintknop; dan een lichte cue (een kaart, een rij, een stuk); dan een kleinere keuze (één fout antwoord weg, twee kandidaatvelden); pas daarna voordoen, waarbij het kind de laatste handeling zelf doet. De app logt hints, maar straft ze niet.
7. **Fouten zijn informatie, geen straf.** Geen foutgeluid, geen levens, geen scoreverlies, geen aftellende timer en geen "game over". Een fout krijgt neutrale taal ("nog niet", "probeer nog eens") en een neutrale kleur. Complimenten gaan over doorzetten en aanpak ("je bleef proberen", "je keek goed"), niet over slim zijn.
8. **Gemiste items komen later terug.** Waar items bestaan (memory-paren, quiz-Pokémon, woordzoeker-woorden, rekenvragen, schaakpuzzels) gebruikt de game een Leitner-achtige herhaalqueue: fout → box 0 en direct weer due; goed → box omhoog met een oplopend interval. De queue is klein en heeft voorrang op nieuwe items, maar vult nooit een hele ronde.
9. **Vastlopen is een apart signaal.** De regelaar demoot niet bij één fout; 30% fout hoort bij de doelband. Pas bij een cluster van signalen — wild tikken, drie of meer hints in één ronde, of midden in een ronde stoppen met minder dan de helft gedaan — zakt het niveau één extra stap. Daarna volgt snel weer een haalbare ronde. De app redt de leerkuil dus niet voortijdig.
10. **Het kind houdt controle.** Automatisch is de default. "Zelf kiezen" blijft als rustige tweede optie ("even makkelijk"), en een "Uitdaging"-knop start eenmalig twee stappen hoger. Een uitdaging die lukt, wordt gevierd en mag het automatische niveau meenemen; een uitdaging die niet lukt, straft niet en valt terug op het automatische niveau.
11. **Lokaal loggen, profielklaar.** Elke poging wordt lokaal bewaard met item, goed/fout, tijd, hints en tijdstip. De opslag is versie 2 per spel en bevat een `profileId`; in deze fase is dat `local`. Er is geen backend, sync of analytics. De bestaande `games.<spel>.v1`-keys blijven staan; bij het laden worden ze eenmalig gemigreerd. Het log is begrensd (maximaal 200 pogingen per spel) zodat localStorage niet volloopt.
12. **De ouderkant is fase 2.** Een dashboard toont straks niveau, herhaalpogingen en of het kind in de leerkuil zit of er weer uit is — geen scores. Dat vereist de profielen uit ADR 0012 en de privacyafweging uit ADR 0013, plus een eigen ADR. Deze ADR reserveert alleen de vorm van het log.
13. **Deze PR doet de pilot, niet alle spellen.** De eerste uitrol is memory plus de gedeelde feedbackregel. Het foutgeluid en de harten zijn in de hele app weg; in de kernspellen zijn ook de kleuren en copy neutraal. Nieuwere spellen (Vlaggenreis, Mengelmoes, Letterpret en Schaakpartij) nemen de copy mee in hun eigen feedbackpass. Sudoku, rekenen, quiz, woordzoeker, zoeken en schaakpuzzels krijgen hun eigen ladder in vervolg-PR's. Frans houdt zijn bestaande SRS; de schaakles en Pijlen krijgen geen nieuwe ladder.

## Indeling per spel

| Spel            | Geordende as?                           | Aanpak                                                         |
| --------------- | --------------------------------------- | -------------------------------------------------------------- |
| Memory          | Ja: aantal paren 4–12                   | Adaptieve ladder, nu als pilot                                 |
| Sudoku          | Ja, maar meerdimensionaal               | Clue-aantal binnen 4×4/6×6, daarna grootte; later              |
| Tafel Topper    | Ja: getalbereik en tafels per mode      | Adaptief per mode; later                                       |
| Pokémon-quiz    | Ja: aantal opties en visuele degradatie | Adaptief; later                                                |
| Woordzoeker     | Ja: grootte, woorden en richtingen      | Adaptief; later                                                |
| Waar is Wobbel? | Ja: aantal kolommen                     | Adaptief; later                                                |
| Schaakpuzzels   | Ja: rating en één/twee zetten           | Adaptieve ratingband; later                                    |
| Frans           | Nee, vaste les; SRS is de as            | Bestaande Leitner houden; geen niveauladder                    |
| Schaakles       | Nee, lineaire instructie                | Geen ladder; alleen hinttiming en copy                         |
| Pijlen          | Bestaande levelpad                      | Geen nieuwe ladder; wel de foutvriendelijke pass (geen harten) |

## Gevolgen

- **Meer lokale state.** Elk spel krijgt een log, een reviewqueue en een adaptieve stand. Dat vraagt migratie, validatie en tests per spel.
- **Niet elk spel wordt adaptief.** Dat is een bewuste keuze: een kunstmatige ladder is erger dan een goede vaste volgorde. De schaakles en Frans blijven zoals ze zijn; Pijlen houdt zijn levelpad.
- **De feedback verandert zichtbaar.** Foutgeluid en harten verdwijnen. Dat is een gedragswijziging die in de tests en in de UI-copy moet terugkomen.
- **De opslag blijft lokaal.** Er komt geen backend, account of analytics bij. Profielen en de ouderkant volgen pas na ADR 0012/0013.
- **De eerste uitrol is klein.** Memory bewijst de regelaar, de hinttrap en de reviewqueue. Daarna kan elke game zijn eigen as toevoegen zonder de regelaar opnieuw te ontwerpen.
- **De regelaar is geen garantie.** De 70–85% is een evenwicht, geen meetlat per ronde. Bij grove stappen of een moeilijk meetbare vaardigheid kan de praktijk afwijken; daarom blijven k en de niveau-einden instelbaar en getest.

## Alternatieven

| Alternatief                                | Waarom niet                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| Eén universele ladder 1–10                 | Geeft schijnprecisie; sudoku, woordzoeker en quiz hebben verschillende dimensies |
| Alleen handmatige niveaus houden           | Kinderen kiezen te makkelijk; de app volgt het kind niet                         |
| Alles item-level SRS maken                 | Bordspellen hebben geen losse items en vragen een ronde-oordeel                  |
| Adaptatie op een server                    | Vraagt een backend en profielen; botst met de statische app en privacyregels     |
| Meteen alle spellen ombouwen               | Te groot en te riskant; de pilot moet eerst de regelaar en de toon bewijzen      |
| Fouten blijven markeren met rood en geluid | Houdt de nadruk op falen en past niet bij de leerkuil                            |

## Open vragen

1. **Per-game drempels:** is k=2 overal de juiste start, of vragen sudoku en schaakpuzzels om k=3?
2. **Startniveaus:** memory start op 6 paren; is dat voor de jongste doelgroep te hoog?
3. **Handmatige modus:** hoe prominent blijft "zelf kiezen" naast automatisch?
4. **Ouderkant:** welke definitie van "in de leerkuil" gebruiken we (bijvoorbeeld twee stappen gezakt in één sessie of minder dan 50% over de laatste tien pogingen)?
5. **Profielen:** wanneer wordt `profileId` echt, en krijgen bestaande lokale logs dan een profielslot?
