# Privacyverklaring

> **DRAFT — concept, niet gepubliceerd.** Dit document is voorbereiding voor issue #46. De eigenaar vult de placeholders in en laat de tekst juridisch toetsen. Dit is geen juridisch advies. Zie [ADR 0013](../adr/0013-privacy-optionele-accounts.md) voor het ontwerp en de onderbouwing.

- **Status:** DRAFT
- **Versie:** `[versie]` (moet overeenkomen met `consent.policy_version`)
- **Datum:** `[datum]`
- **Verwerkingsverantwoordelijke:** `[naam verwerkingsverantwoordelijke]`
- **Contact:** `[contactadres]`
- **Gerelateerd:** [ADR 0013](../adr/0013-privacy-optionele-accounts.md), [verwerkingsregister](verwerkingsregister.md), [verwerkers](verwerkers.md)

## In het kort

Deze app is een spelletjesapp voor kinderen van ongeveer 6 tot 12 jaar. Je kunt alle spellen spelen zonder account. Dan blijft je voortgang op het toestel en gaat er niets naar een server.

Een account is optioneel. Met een account kan de voortgang van een kindprofiel op meerdere toestellen hetzelfde blijven. Daarvoor bewaren we een klein aantal gegevens:

- de login van de ouder of verzorger;
- per kind een profielslot met een avatar;
- de voortgang per profiel;
- beveiligingsgegevens van de sessie;
- een bewijs dat de ouder toestemming gaf.

We bewaren **geen** naam, e-mailadres, geboortedatum, foto of locatie van een kind. Er zijn geen advertenties, analytics, trackers of schermtijdlimieten.

## Wie is verantwoordelijk?

De app wordt gepubliceerd door:

- **Verwerkingsverantwoordelijke:** `[naam verwerkingsverantwoordelijke]`
- **Contactadres voor privacyvragen:** `[contactadres]`

Heb je een vraag over deze verklaring, je gegevens of een van je rechten? Mail of schrijf naar `[contactadres]`. We antwoorden binnen één maand. Soms hebben we extra informatie nodig om te controleren dat de vraag bij jouw account hoort.

## Voor wie is dit?

De app is bedoeld voor kinderen van ongeveer 6 tot 12 jaar. Een ouder of verzorger maakt het account aan en beheert het. Het kind krijgt geen eigen account, wachtwoord of e-mailadres.

In Nederland kunnen kinderen onder de 16 jaar zelf geen geldige toestemming geven voor een online dienst. Daarom vraagt de app de ouder of verzorger te verklaren dat hij of zij 16 jaar of ouder is en de ouder of verzorger van het kind is. Er wordt geen geboortedatum opgeslagen.

## Welke gegevens bewaren we?

| Gegeven                                              | Waarvoor                                                                                      | Waar en hoe lang           |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------- |
| E-mailadres van de ouder                             | Inloggen met Google; bij een passkey een synthetisch `@invalid`-adres zonder persoonsgegevens | Database in de EU          |
| Weergavenaam van de ouder                            | Het account herkenbaar maken                                                                  | Database in de EU          |
| Inlogmethode en technische account-id                | De login aan het account koppelen                                                             | Database in de EU          |
| Publieke sleutel van een passkey                     | Inloggen zonder wachtwoord                                                                    | Database in de EU          |
| Profielslot en avatar                                | Kindprofielen van elkaar scheiden                                                             | Database in de EU          |
| Voortgang per profiel                                | Instellingen, beste scores en grove voortgang synchroniseren                                  | Database in de EU          |
| Sessiegegevens, waaronder IP-adres en user-agent     | De sessie beveiligen en misbruik herkennen                                                    | Database in de EU          |
| Toestemmingsbewijs: versie, datum, methode en status | Kunnen aantonen dat de ouder toestemming gaf                                                  | Database in de EU          |
| Rate-limit-teller                                    | Te veel loginpogingen of verzoeken tegenhouden                                                | Database in de EU          |
| Applicatielogs                                       | Storingen opsporen en de beveiliging bewaken                                                  | Cloudflare, 7 tot 30 dagen |

Een profielnaam is optioneel en blijft lokaal op het toestel. De server bewaart alleen het slotnummer en de avatar. De inhoud van een spel, zoals een lopend sudokubord of een woordzoeker-raster, wordt niet gesynchroniseerd.

### Wat bewaren we niet?

- Geen naam, e-mailadres, geboortedatum, geslacht, foto, stem of locatie van een kind.
- Geen school, woonadres of andere contactgegevens van een kind.
- Geen analytics, advertenties, trackingpixels, vingerafdrukken of profileringsmodellen.
- Geen schermtijd, dagbudget, blokkade of ouderlijke pincode.
- Geen openbare profielen, ranglijsten, vriendenlijsten of chat.
- Geen wachtwoord en geen e-maillink om in te loggen (geen magic link).
- Geen marketinge-mails en geen e-mailprovider.

## Waarom mogen we deze gegevens gebruiken?

| Doel                                                      | Grondslag                                                         |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| Account, kindprofielen en synchronisatie van voortgang    | Toestemming van de ouder of verzorger (artikel 6 lid 1 sub a AVG) |
| Beveiliging: sessie-IP, user-agent, rate limiting en logs | Gerechtvaardigd belang (artikel 6 lid 1 sub f AVG)                |
| Bewijs van gegeven toestemming                            | Wettelijke verplichting tot verantwoording (artikel 5 lid 2 AVG)  |

De ouder geeft toestemming bij het aanmaken van het account, vóór de eerste synchronisatie. Het vinkje staat niet vooraf aangevinkt. Zonder toestemming kun je geen account gebruiken, maar blijven alle spellen lokaal werken.

Voor de beveiligingsgegevens geldt een gerechtvaardigd belang: we hebben ze nodig om misbruik en ongeoorloofde toegang tegen te gaan. We bewaren ze kort, gebruiken ze niet voor profiling en loggen ze niet nog een keer extra. Je kunt bezwaar maken tegen deze verwerking via `[contactadres]`.

## Ouderlijke toestemming en leeftijd

- De ouder of verzorger verklaart 16 jaar of ouder te zijn en de ouder of verzorger van het kind te zijn.
- De app slaat geen geboortedatum op.
- Kinderen van 12 jaar en ouder mogen hun toestemming zelf intrekken. Dat kan via de profielinstellingen, samen met de ouder, of via `[contactadres]`. Het kind heeft geen eigen account nodig.
- Toestemming intrekken betekent niet dat de app stopt met werken. De lokale modus blijft volledig beschikbaar.

## Inloggen met Google of een passkey

De ouder kan op twee manieren inloggen. Beide manieren kunnen aan hetzelfde account worden gekoppeld.

**Met Google.** Je gaat naar de inlogpagina van Google en komt daarna terug in de app. Google ziet dat je inlogt en geeft je e-mailadres, je naam en een technische account-id aan de app. De app vraagt alleen de standaardgegevens `openid`, `email` en `profile` op. We krijgen geen toegang tot je Gmail, Drive, contacten of andere Google-diensten. We tonen ook geen Google-avatar: het profiel gebruikt een avatar uit de vaste set van de app. Google kan tijdens het inloggen cookies op zijn eigen domein plaatsen; daarvoor geldt het privacybeleid van Google.

**Met een passkey.** Een passkey is een sleutel die op je eigen toestel blijft. Je ontgrendelt hem met je vingerafdruk, gezicht of toestelcode. De app bewaart alleen de publieke sleutel. Je vingerafdruk of gezichtsscan gaat nooit naar de server. Een passkey is gekoppeld aan het domein van de app. Raak je je toestel kwijt, dan heb je een tweede passkey of een gekoppeld Google-account nodig. Zorg daarom voor een tweede inlogmethode.

Bij een passkey bewaren we geen wachtwoord. Het systeem heeft technisch een inlognaam nodig. Daarvoor gebruiken we een niet-bestaand adres op `example.invalid`. Dat adres gebruiken we niet om je e-mails te sturen: er is bewust **geen** e-mailmagic-link en er is geen e-mailprovider.

## Cookies en lokale opslag

- **Sessiecookie:** één strikt noodzakelijke cookie, met `HttpOnly`, `Secure` en `SameSite=Lax`. Die houdt je ingelogd, heeft een geldigheid van zeven dagen en wordt bij gebruik verlengd. Je kunt de sessie direct intrekken door uit te loggen. Voor deze cookie is geen toestemmingsbanner nodig; we leggen hem hier uit.
- **LocalStorage:** bevat de gastvoortgang, de profielkeuze en voorkeuren zoals geluid. Die gegevens blijven op het toestel. Het is functionele opslag, geen tracking. Ze worden alleen naar de server gestuurd als je met een account synchroniseert.
- **Geen third-party cookies van de app.** Bij Google-login kan Google op zijn eigen domein cookies plaatsen. Dat valt onder het beleid van Google.
- **Geen cookie-cache.** Een ingetrokken sessie is daardoor direct ongeldig.

## Hoe lang bewaren we gegevens?

| Gegeven                       | Bewaartermijn                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Ouderaccount en inloggegevens | Tot je het account verwijdert. Na 12 maanden zonder login waarschuwen we en verwijderen we het account daarna. |
| Kindprofiel                   | Tot je het profiel of het account verwijdert.                                                                  |
| Voortgang per profiel         | Tot je het profiel of het account verwijdert. Na 12 maanden inactiviteit verwijderen we de voortgang.          |
| Sessie                        | Zeven dagen na de laatste verlenging. Uitloggen trekt de sessie direct in.                                     |
| Toestemmingsbewijs            | Zolang het account bestaat; bij accountverwijdering wordt het verwijderd.                                      |
| Rate-limit-teller             | Kort, alleen voor de duur van het venster (seconden tot minuten).                                              |
| Applicatielogs                | Zeven tot dertig dagen, zonder e-mailadres, token, cookie, IP-adres of request-body.                           |
| Lokale gastvoortgang          | Tot je die op het toestel wist of de app-gegevens verwijdert.                                                  |

Na verwijdering uit de actieve database kunnen gegevens nog korte tijd in herstelkopieën staan. Cloudflare D1 Time Travel bewaart maximaal 7 dagen (gratis plan) of 30 dagen (betaald plan). Daarna zijn ze ook daar weg. Back-ups hebben een vaste, zo kort mogelijke termijn.

## Delen we gegevens met anderen?

We verkopen geen gegevens en gebruiken ze niet voor advertenties. We delen alleen wat nodig is met twee partijen:

- **Cloudflare** host de app, de Worker en de database (D1). De database staat in de EU-jurisdictie. Cloudflare is een verwerker. We leggen de afspraken vast in een verwerkersovereenkomst en een lijst met subprocessors. Cloudflare verwerkt als hostingpartij ook verbindingsmetadata die nodig is om verkeer te routeren en te beveiligen. Omdat Cloudflare een Amerikaanse organisatie is, gelden er waarborgen voor doorgifte, zoals de standaardcontractbepalingen en het EU-VS Data Privacy Framework waar van toepassing.
- **Google** verwerkt de login als je voor Google kiest. Google is daarbij een verwerker voor de OAuth-stap, met de bijbehorende voorwaarden en doorgiftegronden. Google kan voor zijn eigen accountdiensten ook als zelfstandig verantwoordelijke optreden; daarvoor geldt het privacybeleid van Google.

Meer details staan in [verwerkers.md](verwerkers.md). We verstrekken gegevens alleen verder als de wet dat verplicht, bijvoorbeeld bij een geldig verzoek van een bevoegde autoriteit.

## Jouw rechten

Je hebt de volgende rechten:

- **Inzage en export:** je kunt in de accountinstellingen een JSON-bestand downloaden met je accountgegevens, profielen en voortgang. Dat bestand bevat geen lokale gastgegevens en geen wachtwoorden of tokens.
- **Correctie:** je kunt je weergavenaam aanpassen en, als je een e-mailadres hebt opgegeven, je e-mailadres.
- **Verwijdering:** je kunt een kindprofiel verwijderen; de voortgang van dat profiel wordt mee verwijderd. Je kunt ook je hele account verwijderen; dan verwijderen we de login, sessies, profielen, voortgang en technische registraties die dubbel opslaan voorkomen. Het toestemmingsbewijs wordt samen met het account verwijderd. De lokale voortgang op het toestel blijft staan. Exporteer die eerst als je hem wilt bewaren.
- **Beperking en bezwaar:** je kunt bezwaar maken tegen de verwerking op basis van gerechtvaardigd belang, bijvoorbeeld tegen beveiligingslogs. We beoordelen dan of we die verwerking kunnen stoppen of beperken.
- **Dataportabiliteit:** je krijgt dezelfde JSON-export in een gangbaar, machineleesbaar formaat.
- **Toestemming intrekken:** je kunt je account verwijderen of de synchronisatie uitzetten. De app blijft daarna lokaal werken. Het intrekken geldt niet met terugwerkende kracht voor wat al rechtmatig is verwerkt.
- **Klacht:** je kunt een klacht indienen bij de [Autoriteit Persoonsgegevens](https://www.autoriteitpersoonsgegevens.nl/een-tip-of-klacht-indienen-bij-de-ap). Je kunt ook eerst contact met ons opnemen via `[contactadres]`; vaak kunnen we het samen oplossen.

Voor een verwijderverzoek vragen we een verse sessie of een extra bevestiging. Zo voorkomt de app dat iemand anders met een openstaande sessie het account verwijdert. Verwijderen kan in de app; je hoeft daarvoor geen e-mail te sturen.

## Beveiliging

We nemen passende maatregelen:

- al het verkeer gaat over HTTPS;
- de sessiecookie is `HttpOnly`, `Secure` en `SameSite=Lax`;
- de database staat in de EU-jurisdictie;
- toegang tot productiegegevens is beperkt en vereist aparte inloggegevens;
- secrets staan nooit in de app, de repository of een build-log;
- login en synchronisatie hebben rate limiting en CSRF-bescherming;
- applicatielogs bevatten geen e-mailadres, tokens, cookies, IP-adres, user-agent of request-body;
- sessies kunnen worden ingetrokken en verlopen automatisch.

We kunnen niet beloven dat er nooit iets misgaat. Bij een datalek beoordelen we het risico en melden we het waar nodig binnen 72 uur bij de Autoriteit Persoonsgegevens. Als het risico voor jou hoog is, laten we het je weten.

## Wijzigingen

Deze verklaring heeft een versienummer en een datum. Bij een belangrijke wijziging vragen we opnieuw om toestemming en laten we dat zien bij het inloggen. De versie die je hebt geaccepteerd, staat in het toestemmingsbewijs. We gebruiken geen dark patterns: synchronisatie uitzetten is even makkelijk als aanzetten, en de app blijft daarna volledig werken.

## Contact

- **Verwerkingsverantwoordelijke:** `[naam verwerkingsverantwoordelijke]`
- **Privacyvragen en verzoeken:** `[contactadres]`
- **Autoriteit Persoonsgegevens:** [autoriteitpersoonsgegevens.nl](https://www.autoriteitpersoonsgegevens.nl/)

## Noot voor de eigenaar (niet publiceren)

Vul minimaal in: `[naam verwerkingsverantwoordelijke]`, `[contactadres]`, `[versie]` en `[datum]`. Passkey-accounts gebruiken een synthetisch `@invalid`-adres; er is geen e-mailherstel. Herstel verloopt via een tweede passkey of, na koppeling, via "Inloggen met Google". Bevestig de bewaartermijn van 12 maanden voor inactieve accounts en voortgang. Bevestig dat het toestemmingsbewijs bij accountverwijdering wordt verwijderd. Laat de hele tekst toetsen aan de AVG, de Nederlandse leeftijdsgrens van 16 jaar en, als de site ooit op kinderen in de VS is gericht, aan COPPA.
