# ADR 0020: Kaartpuzzel als tweede speelwijze van Vlaggenreis

- **Status:** Accepted
- **Datum:** 2026-10-19
- **Bouwt voort op:** [ADR 0018](0018-vlaggenspel.md), [ADR 0019](0019-wereldkaart.md)

## Context

Na het vlaggenspel kwam de vraag om een variant waarin ieder land een puzzelstukje is: sleep het land naar de juiste plek op de kaart. De wereldatlas uit ADR 0019 heeft de echte landvormen al lokaal, dus er is geen nieuwe dataset of dienst nodig. De variant is bedoeld als **tweede speelwijze van Vlaggenreis**, niet als los spel in het menu: dezelfde pagina, dezelfde gebieden, dezelfde sterren en dezelfde opslag.

De uitdagingen:

- Landen verschillen enorm in grootte. Rusland naast Luxemburg in één tray werkt niet; stukken moeten genormaliseerd worden, maar de kaart moet de echte verhoudingen houden.
- De atlas (1:110m) heeft 174 van de 197 landen als omtrek. Kleine eilandstaten ontbreken en kunnen dus geen stuk zijn.
- De kaart moet op een telefoon (390 px) leesbaar en aanraakbaar blijven. Een kaart van heel Europa maakt de kleine landen onspeelbaar.
- Slepen is op touch kwetsbaar; er moet ook een tik-tik-alternatief zijn.

## Beslissing

1. **Twee speelwijzen op één pagina.** `FlagSettings` krijgt een `mode`: `vlaggen` of `kaartpuzzel`. De setup toont eerst "Wat wil je spelen?", daarna gebied en niveau. De bestaande score blijft onder de oude sleutel (`scope:level`); de puzzel krijgt `kaartpuzzel:scope:level`. Oude opslag zonder mode laadt als `vlaggen`.
2. **Acht stukken per ronde, rond een ankergebied.** De generator kiest een willekeurig anker en daarna de zeven dichtstbijzijnde onderwerpen (haversine op de coördinaten). Zo blijft de kaart op één regio gericht en blijven stukken en lege vlakken groot genoeg. Een gebied met minder dan acht vormen (Oceanië: zes) speelt een kortere ronde; de sterren tellen per stuk.
3. **Alleen vormen die er echt zijn.** De selectie filtert op de codes die de geometrie werkelijk heeft: landomtrekken uit de wereldatlas of de twaalf provincievormen uit [ADR 0021](0021-provinciegeometrie.md). Een continent met minder dan vier vormen kan geen puzzel starten.
4. **Stukken zijn echte vormen, genormaliseerd naar 84 × 84.** Per land worden de polygonen genomen die binnen 30° van het grootste deel liggen: archipels houden hun eilanden, overzeese gebiedsdelen zoals Frans-Guyana horen niet bij het stuk. De kaart zelf houdt de ware vorm en positie.
5. **De kaart kijkt naar de stukken van deze ronde.** Een Mercator-projectie wordt op de gekozen landen gefit (met marge), zodat de ronde altijd in beeld staat. Alle landen met een omtrek worden als context getekend; landen buiten beeld worden door de `clipExtent` afgekapt.
6. **Sleep of tik.** Een stuk kan naar de kaart gesleept worden (pointer-events, met een zwevend stuk onder de vinger) of eerst aangetikt en daarna op een vlak getikt. De drop wordt bepaald met `document.elementFromPoint`; valt de vinger naast een land, dan telt het dichtstbijzijnde land binnen 26 kaarteenheden. Zo blijven ook kleine landen met een marker bereikbaar.
7. **Twee fouten onthullen de plek.** Een foute drop kost de ster van dat stuk; na twee fouten legt het spel het stuk zelf op de juiste plek en gaat verder. Een drop naast de kaart kost niets. Een ster per stuk dat in één keer goed ligt; de beste score wordt per gebied en niveau bewaard.
8. **Niveaus verschillen in hint, niet in data.** Makkelijk laat het doelvlak pulseren en toont stippen op alle lege vlakken; gemiddeld toont alleen de stippen; moeilijk toont geen van beide. De stukken zijn in alle niveaus onbenoemd.
9. **Toegankelijkheid.** De stukken zijn knoppen met de landnaam. Zodra een stuk gekozen is, worden de acht lege vlakken focusbare knoppen en springt de focus naar de kaart, zodat Enter/Space het stuk plaatst. De kaart heeft een groepsrol met een Nederlandse beschrijving.

## Bronnen

De geometrie, de licentie en de lazy chunk komen uit [ADR 0019](0019-wereldkaart.md); er is geen nieuwe dependency en geen nieuw netwerkverkeer. De landgegevens (naam, code, coördinaten) komen uit [ADR 0018](0018-vlaggenspel.md).

Afgevallen:

- **Een los menu-item.** De eigenaar wil de puzzel als variant van Vlaggenreis; een eigen pagina zou dezelfde store, opslag en setup dupliceren.
- **`@dnd-kit/core` voor de drop.** De botsingsdetectie werkt met rechthoeken; landvormen zijn geen rechthoeken en de tray staat los van de kaart. Pointer-events plus `elementFromPoint` is nauwkeuriger en heeft geen extra laag.
- **Een vaste kaart per continent.** Zonder ankerland staan de stukken willekeurig over het continent verspreid en worden de vlakken op een telefoon te klein.
- **De hele wereld als vaste kaart.** Zelfde probleem, en de stukken zouden onherkenbaar klein worden.

## Gevolgen

- De feature heet nu `features/flag-game` in plaats van `features/flag-quiz`; dezelfde slice host de quiz, de puzzel en de gedeelde instellingen.
- De puzzel gebruikt dezelfde atlas-chunk als de kaart in de quiz. Er komt dus geen extra download bij; wel wordt de chunk nu ook bij de start van een puzzel geladen in plaats van pas na een antwoord. Voor de provinciescope geldt hetzelfde met de provinciechunk uit ADR 0021.
- De beste score van de puzzel staat naast die van de quiz in `games.vlaggen.v1`, met een eigen sleutel per gebied en niveau.
- De puzzel is per definitie visueel; de tik-tik- en toetsenbordroute maken hem bruikbaar zonder slepen, maar de positie op de kaart blijft het leerdoel.
- De provinciescope speelt op de provinciekaart uit [ADR 0021](0021-provinciegeometrie.md): twaalf vlakken, acht stukken en dezelfde regels.
- Nieuwe tests: `tests/node/puzzle.test.ts` (selectie, determinisme, stukken, archipels), `tests/web/puzzle.test.tsx` (starten, goed/fout, onthullen, afronden en opslag) en een mobiele e2e-ronde met slepen én tikken.
