# ADR 0017: Letterklanken en prototype-woordaudio voor het letterspel

- **Status:** Accepted (prototype-audio, te vervangen vóór publieke lancering)
- **Datum:** 2026-10-19
- **Kader:** [ADR 0001](0001-publieke-statische-spellen-app.md) (publieke, statische app), [ADR 0005](0005-pokemon-assets.md) (lokale assets en CSP), [ideeën letter-spelletjes](../ideas/letter-spelletjes.md)

## Context

Het letterspel (`/letters`) oefent klank–letterkoppeling. De didactiek is duidelijk: het kind moet een **losse klank** horen (`/m/`), niet de **letternaam** (`"em"`). Een TTS die letters als namen uitspreekt is nadrukkelijk ongeschikt. Tegelijk is er nog geen menselijke opname-set (leerkracht of logopedist) beschikbaar, en de app is openbaar en statisch: geen runtime-TTS, geen externe requests, en audio moet lokaal in de repository staan met een duidelijke licentie.

Er is geen kant-en-klare open set met zuivere Nederlandse letterklanken. De ideeënnotitie noemt twee routes:

- **Route A (nu):** een prototype op basis van een open bron.
- **Route B (vóór lancering):** eigen opnames met één stem, beluisterd door een leesspecialist.

## Beslissing

1. **Losse klanken uit een CC0-corpus.** De tien klanken (`i, k, m, s, p, v, e, n, t, a`) komen uit [rhasspy/dataset-voice-nathalie](https://github.com/rhasspy/dataset-voice-nathalie) (CC0 1.0, één vrouwelijke Belgisch-Nederlandse spreker). Per letter is een **woordbeginnend** foneem uit de meegeleverde uitlijning geknipt, daarna ontdempt, genormaliseerd en voorzien van een korte fade. Resultaat: echte fonemen zonder schwa, opgeslagen als 48 kHz mono WAV in `apps/games/public/audio/letters/v1/sounds/`.
2. **Prototype-woordaudio uit Wikimedia Commons.** Voor **Klankvanger** (woord → beginletter), **Woordtrein** (woord bouwen) en **Woordlezen** (geschreven woord kiezen) zijn per woord bestaande `Nl-<woord>.ogg`-bestanden van Wikimedia Commons gebruikt, ontdaan van stilte, genormaliseerd en omgezet naar 48 kHz mono WAV in `apps/games/public/audio/letters/v1/words/`.
3. **Alles lokaal, geen runtime-TTS en geen externe requests.** De paden zijn versiegebonden (`/audio/letters/v1/...`) zodat een nieuwe stem geen oude cache oplevert. De CSP blijft ongewijzigd; audio valt onder `default-src 'self'`.
4. **De woordaudio is expliciet prototype.** Vóór publieke lancering wordt de hele set (klanken én woorden) vervangen door **eigen opnames met één stem**, beluisterd door een leerkracht of logopedist (route B). Dan vervalt de CC BY-SA-afhankelijkheid voor woorden en is er één consistent stemgeluid.
5. **De klank is leidend, de letternaam is een hulplabel.** De UI toont kleine letters en speelt bij "Klank & Letter" en "Letterjacht" altijd de losse klank af, nooit een letternaam.

## Bronnen en attributie

### Losse klanken — CC0 1.0

Bron: [rhasspy/dataset-voice-nathalie](https://github.com/rhasspy/dataset-voice-nathalie), licentie **CC0 1.0**. CC0 vraagt geen attributie; bronvermelding staat hier voor de volledigheid. Per klank is de gebruikte uiting uit de uitlijning vermeld.

| Klank | Uiting          | Woord    |
| ----- | --------------- | -------- |
| `m`   | nl_rhasspy_1044 | mooi     |
| `s`   | nl_rhasspy_898  | stom     |
| `k`   | nl_rhasspy_243  | kunnen   |
| `p`   | nl_rhasspy_347  | prachtig |
| `t`   | nl_rhasspy_513  | tijd     |
| `n`   | nl_rhasspy_1021 | net      |
| `v`   | nl_rhasspy_348  | veel     |
| `i`   | nl_rhasspy_326  | ik       |
| `e`   | nl_rhasspy_85   | en       |
| `a`   | nl_rhasspy_220  | al       |

### Woorden — CC BY-SA 3.0 / CC BY 2.5

Bron: Wikimedia Commons. De bestanden zijn getrimd, genormaliseerd en naar WAV omgezet; de **bestanden blijven onder de oorspronkelijke licentie** vallen. Attributie per bestand:

| Woord | Bestandspagina                                     | Auteur          | Licentie     |
| ----- | -------------------------------------------------- | --------------- | ------------ |
| aap   | https://commons.wikimedia.org/wiki/File:Nl-aap.ogg | GerardM         | CC BY-SA 3.0 |
| eet   | https://commons.wikimedia.org/wiki/File:Nl-eet.ogg | Marcel coenders | CC BY-SA 3.0 |
| ik    | https://commons.wikimedia.org/wiki/File:Nl-ik.ogg  | GerardM         | CC BY-SA 3.0 |
| is    | https://commons.wikimedia.org/wiki/File:Nl-is.ogg  | GerardM         | CC BY 2.5    |
| mis   | https://commons.wikimedia.org/wiki/File:Nl-mis.ogg | Marcel coenders | CC BY-SA 3.0 |
| mes   | https://commons.wikimedia.org/wiki/File:Nl-mes.ogg | Jcwf            | CC BY-SA 3.0 |
| mat   | https://commons.wikimedia.org/wiki/File:Nl-mat.ogg | Grunnen         | CC BY-SA 3.0 |
| kim   | https://commons.wikimedia.org/wiki/File:Nl-kim.ogg | Marcel coenders | CC BY-SA 3.0 |
| kip   | https://commons.wikimedia.org/wiki/File:Nl-kip.ogg | GerardM         | CC BY-SA 3.0 |
| vis   | https://commons.wikimedia.org/wiki/File:Nl-vis.ogg | Marcel coenders | CC BY-SA 3.0 |
| pet   | https://commons.wikimedia.org/wiki/File:Nl-pet.ogg | Marcel coenders | CC BY-SA 3.0 |
| pen   | https://commons.wikimedia.org/wiki/File:Nl-pen.ogg | Hooiwind        | CC BY-SA 3.0 |
| net   | https://commons.wikimedia.org/wiki/File:Nl-net.ogg | Marcel coenders | CC BY-SA 3.0 |
| tak   | https://commons.wikimedia.org/wiki/File:Nl-tak.ogg | GerardM         | CC BY-SA 3.0 |
| sap   | https://commons.wikimedia.org/wiki/File:Nl-sap.ogg | Marcel coenders | CC BY-SA 3.0 |

## Gevolgen

- Het spel werkt volledig offline en zonder externe requests; de audio staat in de repository.
- **Woordlezen** (luisteren → geschreven woord kiezen) en **Woordtrein** (woord bouwen uit letters) hergebruiken dezelfde vijftien woordopnames; die lessen voegden geen nieuwe audiobestanden toe.
- De klanken zijn echte fonemen. Bij stopletters (`k`, `p`, `t`) is de klank kort — dat is fonetisch correct, maar vraagt om een luistertest met een leesspecialist.
- De klankstem (Belgisch-Nederlands, vrouwelijk) en de woordstemmen (diverse Nederlandse mannen) verschillen. Dat is een bewuste, tijdelijke prototype-beperking.
- Zolang de Commons-woorden in gebruik zijn, geldt attributie en share-alike voor die bestanden. De app-code valt daar niet onder; een nieuwe opname-set maakt de repository volledig CC0/eigen werk.
- Een nieuwe stem of extra letters betekent een nieuwe versiemap (`v2`) en een nieuwe regel in dit ADR.
