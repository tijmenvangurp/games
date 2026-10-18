# Verwerkingsregister

> **DRAFT — concept, niet gepubliceerd.** Dit register is voorbereiding voor issue #46. De eigenaar vult de placeholders in en laat het juridisch toetsen. Dit is geen juridisch advies. Zie [ADR 0013](../adr/0013-privacy-optionele-accounts.md).

- **Status:** DRAFT
- **Versie:** `[versie]`
- **Datum:** `[datum]`
- **Verwerkingsverantwoordelijke:** `[naam verwerkingsverantwoordelijke]`
- **Contact:** `[contactadres]`
- **Functionaris gegevensbescherming:** `[wel/niet aangesteld; naam en contact invullen]`
- **Gerelateerd:** [ADR 0013](../adr/0013-privacy-optionele-accounts.md), [privacyverklaring](privacyverklaring.md), [verwerkers](verwerkers.md)

## Toelichting

Dit register beschrijft de verwerkingen die horen bij het optionele ouderaccount, de kindprofielen en de gesynchroniseerde voortgang. Zonder account verstuurt de app geen persoonsgegevens naar een server; de gastmodus staat daarom als aparte toelichting onderaan en niet als serververwerking in de tabel.

De app verwerkt geen bijzondere categorieën van persoonsgegevens, gebruikt geen profilering en neemt geen geautomatiseerde besluiten met rechtsgevolgen.

## Register

| Verwerking               | Doel                                                                              | Grondslag                                                        | Betrokkenen en categorieën gegevens                                                                                                                                              | Ontvangers                              | Bewaartermijn                                                                                      | Beveiliging                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Ouderaccount en inloggen | Account aanmaken, inloggen, loginmethoden koppelen en het account beheren         | Toestemming (artikel 6 lid 1 sub a AVG)                          | Ouder of verzorger. E-mailadres en weergavenaam (bij Google of zelf opgegeven), OAuth-provider en subject-id, publieke passkey, tijdstempels van aanmaken en wijzigen.           | Cloudflare (D1); Google bij OAuth-login | Tot accountverwijdering. Na 12 maanden zonder login volgt een waarschuwing en daarna verwijdering. | HTTPS, `HttpOnly`-sessie, CSRF- en origin-validatie, rate limiting, least privilege, geen secrets in de client. |
| Kindprofielen            | Voortgang per kind scheiden zonder een kindidentiteit op de server                | Toestemming van de ouder (artikel 6 lid 1 sub a AVG)             | Kind, via een profiel. Slotnummer, avatar, `owner_user_id`, `created_at`, `deleted_at`. Geen naam, e-mail, geboortedatum, foto of locatie.                                       | Cloudflare (D1)                         | Tot profiel- of accountverwijdering.                                                               | Toegangscontrole op `owner_user_id`, zachte verwijdering met cascade, HTTPS, geen profielnamen in logs.         |
| Voortgang per profiel    | Instellingen, beste scores en grove voortgang tussen toestellen synchroniseren    | Toestemming van de ouder (artikel 6 lid 1 sub a AVG)             | Kind, via een profiel. `player_id`, `game_id`, JSON-envelop met `schema_version`, `revision`, `data_json`, `client_updated_at`, `server_updated_at`.                             | Cloudflare (D1)                         | Tot profiel- of accountverwijdering. Na 12 maanden inactiviteit wordt de voortgang verwijderd.     | HTTPS, owner-check per verzoek, idempotente upsert, geen `data_json` in logs, grootte begrensd.                 |
| Sessies                  | De ouder ingelogd houden, sessies kunnen intrekken en misbruik herkennen          | Gerechtvaardigd belang (artikel 6 lid 1 sub f AVG)               | Ouder of verzorger. Sessietoken, user-id, IP-adres, user-agent, aanmaak- en verlooptijd.                                                                                         | Cloudflare (D1)                         | 7 dagen na de laatste verlenging; uitloggen trekt de sessie direct in.                             | `HttpOnly`, `Secure`, `SameSite=Lax`, geen cookie-cache, rotatie en intrekken, HTTPS.                           |
| Toestemmingsbewijs       | Kunnen aantonen dat de ouder toestemming gaf en wanneer die is ingetrokken        | Wettelijke verplichting tot verantwoording (artikel 5 lid 2 AVG) | Ouder of verzorger. `owner_user_id`, `policy_version`, `granted_at`, `withdrawn_at`, `method`. Geen kindgegevens.                                                                | Cloudflare (D1)                         | Zolang het account bestaat; bij accountverwijdering wordt het verwijderd.                          | Alleen-lezen waar mogelijk, toegang beperkt, geen kinddata, geen tokens of IP in het bewijs.                    |
| Rate limiting            | Te veel loginpogingen, sync-verzoeken of andere misbruiksignaleringen tegenhouden | Gerechtvaardigd belang (artikel 6 lid 1 sub f AVG)               | Bezoeker of ouder. IP-adres of rate-limit-key, teller, venster en verlooptijd.                                                                                                   | Cloudflare (D1)                         | Kort, alleen voor de duur van het venster (seconden tot minuten).                                  | `cf-connecting-ip` als bron, korte retentie, geen koppeling met voortgang, geen extra logging van IP.           |
| Applicatielogs           | Storingen opsporen, aanvallen herkennen en de beschikbaarheid bewaken             | Gerechtvaardigd belang (artikel 6 lid 1 sub f AVG)               | Bezoeker of ouder. Eventtype (login, sync, delete), pseudonieme user-id of hash, foutcode, tijdstip, duur en status. Geen e-mail, token, cookie, IP, user-agent of request-body. | Cloudflare                              | 7 tot 30 dagen.                                                                                    | Geen PII in applicatielogs, toegang beperkt, logretentie kort, geen request-bodies.                             |

## Bewaartermijnen en verwijdering

- **Profiel verwijderen:** het profiel wordt zacht verwijderd en de voortgang wordt gecascadeerd. Daarna volgt definitief opschonen.
- **Account verwijderen:** de Better Auth-user, sessies, profielen, voortgang en idempotentieregels worden verwijderd. Het toestemmingsbewijs wordt samen met het account verwijderd. De lokale state op het toestel blijft staan.
- **Inactief account:** na 12 maanden zonder login volgt een waarschuwing en daarna verwijdering of anonimisering. De eigenaar bevestigt deze termijn vóór productie.
- **Sessies:** 7 dagen; direct intrekbaar bij logout.
- **Logs:** 7 tot 30 dagen, zonder persoonsgegevens.
- **D1 Time Travel:** 7 dagen (gratis plan) of 30 dagen (betaald plan). Verwijderen uit de live database betekent niet direct verwijderen uit Time Travel.
- **Back-ups:** vaste termijn, niet langer dan nodig; herstelprocedure periodiek testen.

## Ontvangers en doorgiften

| Ontvanger  | Rol                                                                                                  | Doorgifte                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare | Verwerker voor Workers, static assets, D1 en applicatielogs                                          | D1 in de `eu`-jurisdictie; het Workers-netwerk is wereldwijd. Cloudflare DPA, subprocessors, SCC's en EU-VS Data Privacy Framework waar van toepassing. |
| Google     | Verwerker voor OAuth-login; voor eigen accountdiensten kan Google zelfstandig verantwoordelijke zijn | Verwerking buiten de EU mogelijk; Google DPA en passende doorgiftegronden. Exacte route juridisch bevestigen.                                           |

Er is **geen** e-mailprovider, **geen** analyticspartij, **geen** advertentienetwerk en **geen** CDN buiten Cloudflare. Gegevens worden niet verkocht.

## Beveiligingsmaatregelen

- HTTPS-only; HSTS waar mogelijk.
- Sessies met `HttpOnly`, `Secure` en `SameSite=Lax`; geen cookie-cache in versie 1.
- CSRF- en origin-validatie; geen mutaties op GET.
- Rate limiting in D1 met `cf-connecting-ip`.
- Least privilege: geen gedeelde accounts; scoped tokens voor migraties.
- Secrets als Workers-secrets, nooit in de repository, build-log of clientbundle.
- D1 in de EU-jurisdictie; geen productiegegevens in de clientbundle.
- Applicatielogs zonder e-mail, tokens, cookies, IP, user-agent of request-body.
- Incidentprocedure met beoordeling en melding aan de AP binnen 72 uur waar vereist.
- Pinversies, lockfile en de bestaande kwaliteitsgate.

## Rechten van betrokkenen

| Recht                 | Invulling                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------- |
| Inzage en export      | JSON-bestand met accountgegevens, profielen en voortgang in de accountinstellingen.          |
| Correctie             | Weergavenaam aanpassen en, als een e-mailadres is opgegeven, het e-mailadres.                |
| Verwijdering          | Profiel of account verwijderen, met cascade; lokale state blijft op het toestel.             |
| Beperking en bezwaar  | Mogelijk voor verwerkingen op basis van gerechtvaardigd belang, zoals beveiligingslogs.      |
| Dataportabiliteit     | Dezelfde JSON-export in een gangbaar, machineleesbaar formaat.                               |
| Toestemming intrekken | Account verwijderen of synchronisatie uitzetten; de app blijft lokaal werken.                |
| Klacht                | Verwijzing naar de Autoriteit Persoonsgegevens; eerst contact via `[contactadres]` mogelijk. |

Verzoeken worden binnen één maand afgehandeld. Bij twijfel over de identiteit kan om aanvullende informatie worden gevraagd. Een verwijderverzoek vraagt een verse sessie of extra bevestiging.

## DPIA en risico's

Een volledige DPIA is voor deze verwerking waarschijnlijk niet verplicht: er is geen systematische monitoring, geen grootschalige verwerking, geen bijzondere categorie en geen profilering. Leg een korte risicoanalyse vast en beoordeel opnieuw zodra analytics, een publieke ranglijst, chat, multiplayer met vreemden of schermtijdmeting wordt toegevoegd.

Belangrijkste risico's:

- toegang tot een gedeeld toestel met een openstaande ouder-sessie;
- herleidbaarheid van een profielslot tot een kind voor de ouder;
- onbedoelde opname van persoonsgegevens in logs;
- resterende kopieën in D1 Time Travel of back-ups na verwijdering;
- een verkeerd ingerichte DPA of doorgiftegrond bij Cloudflare of Google.

Maatregelen staan in de kolom **Beveiliging** en in [verwerkers.md](verwerkers.md).

## Buiten dit register

- **Gastmodus:** voortgang en profielkeuze staan in `localStorage` op het toestel. Er is geen account, geen cookie en geen serverstate. De app verstuurt deze gegevens niet zonder account.
- **Lokale profielnaam:** blijft lokaal en wordt niet gesynchroniseerd.
- **Schermtijd, dagbudget en blokkades:** vallen bewust buiten scope. De app biedt geen schermtijdmeting of -beperking.
- **Analytics, advertenties en profilering:** worden niet toegevoegd.
- **E-mailmagic-link en e-mailprovider:** worden niet gebruikt.
- **Remote avatars:** worden niet geladen; het profiel gebruikt een lokale avatar.
- **Cloudflare-platformmetadata:** Cloudflare verwerkt als hostingpartij verbindingsmetadata, zoals een IP-adres, om verkeer te routeren en te beveiligen. Dat valt onder de Cloudflare-DPA en is geen applicatielog.

## Openstaande punten

Vul `[naam verwerkingsverantwoordelijke]`, `[contactadres]`, `[versie]`, `[datum]` en de functionaris gegevensbescherming in. Bevestig de bewaartermijn van 12 maanden voor inactieve accounts en voortgang. Leg de DPA-status, contactpersonen en doorgiftegronden van Cloudflare en Google vast in [verwerkers.md](verwerkers.md). Bevestig dat het toestemmingsbewijs bij accountverwijdering wordt verwijderd. Laat dit register toetsen aan artikel 30 AVG en laat de COPPA-vraag beoordelen als de site op kinderen in de VS is gericht. Gebruik in testdata uitsluitend `example.invalid`.
