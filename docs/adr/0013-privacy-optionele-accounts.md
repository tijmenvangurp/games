# ADR 0013: Privacy en gegevensverwerking voor optionele accounts

- **Status:** Proposed — ter goedkeuring door de eigenaar
- **Datum:** 2026-10-18
- **Gerelateerd:** [ADR 0012](0012-optionele-accounts-en-sync.md) (auth en sync), [ADR 0001](0001-publieke-statische-spellen-app.md), [onderzoek](../research/2026-10-18-auth-backend-betterauth.md)

## Context

De app is gericht op kinderen van ongeveer 6–12 jaar en is publiek toegankelijk. Zonder account worden er geen persoonsgegevens naar een server gestuurd. [ADR 0012](0012-optionele-accounts-en-sync.md) voegt een **optioneel** ouderaccount met interne kindprofielen en gesynchroniseerde voortgang toe. Daarmee ontstaat een verwerking van persoonsgegevens, ook al blijven kindgegevens minimaal.

Deze ADR legt het privacy- en beveiligingsontwerp vast dat [ADR 0001](0001-publieke-statische-spellen-app.md) eist. Het is een ontwerpbeslissing, geen juridisch advies. De eigenaar moet de gekozen lijn laten toetsen aan de AVG en, als de site op kinderen in de VS is gericht, aan COPPA.

## Uitgangspunten

1. **Gastmodus verwerkt niets op de server.** Zonder login blijven alle gegevens in `localStorage` op het toestel. Er is geen account, geen cookie en geen serverstate.
2. **Dataminimalisatie.** We verzamelen alleen wat nodig is om in te loggen, profielen te onderscheiden en voortgang te synchroniseren.
3. **Geen tracking, advertenties of profiling.** "Tracking" in dit project betekent voortgang per profiel, niet gedragsanalyse. Er komen geen analytics-SDK's, pixels, advertenties, vingerafdrukken of profileringsmodellen.
4. **Geen kindidentiteit op de server.** Een kindprofiel is een slot met een avatar en voortgang. Geen naam, e-mail, geboortedatum, foto, locatie of school.
5. **Hoge privacyinstellingen als default.** Geen publieke profielen, geen ranglijsten, geen chat, geen vriendenlijsten en geen meldingen die om meer data vragen.
6. **De app blijft bruikbaar zonder toestemming.** Weigeren van de account-optie mag geen enkele game blokkeren.

## Verwerkingsverantwoordelijke en verwerkers

| Rol                          | Partij                                   | Toelichting                                                           |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Verwerkingsverantwoordelijke | De eigenaar van de app                   | Publiek contactadres in de privacyverklaring, niet in deze repo       |
| Verwerker                    | Cloudflare                               | Workers, static assets en D1; verwerkersovereenkomst en subprocessors |
| Verwerker                    | Google                                   | OAuth-login; verwerkersovereenkomst en doorgiftegronden               |
| Geen verwerker               | Analytics-, advertentie- of CDN-partijen | Worden niet toegevoegd                                                |

Als de app door een stichting of andere rechtspersoon wordt gepubliceerd, is die rechtspersoon de verwerkingsverantwoordelijke. De eigenaar moet dit vóór de eerste productie-login vastleggen.

## Gegevensinventaris

| Gegeven                               | Doel                            | Grondslag              | Bewaartermijn                           | Waar       |
| ------------------------------------- | ------------------------------- | ---------------------- | --------------------------------------- | ---------- |
| E-mailadres ouder (alleen bij Google) | Inloggen via Google             | Toestemming            | Tot accountverwijdering                 | D1 (EU)    |
| Weergavenaam ouder                    | UI en accountbeheer             | Toestemming            | Tot accountverwijdering                 | D1 (EU)    |
| OAuth-provider en subject-id          | Inloggen via Google             | Toestemming            | Tot accountverwijdering                 | D1 (EU)    |
| Passkey (publieke sleutel)            | Inloggen zonder wachtwoord      | Toestemming            | Tot verwijdering van de passkey         | D1 (EU)    |
| Sessie met IP en user-agent           | Beveiliging en misbruikdetectie | Gerechtvaardigd belang | 7 dagen, intrekbaar                     | D1 (EU)    |
| Kindprofiel: slot en avatar           | Profielscheiding                | Toestemming ouder      | Tot profiel- of accountverwijdering     | D1 (EU)    |
| Voortgang per profiel                 | Synchroniseren van state        | Toestemming ouder      | 12 maanden inactief, daarna verwijderen | D1 (EU)    |
| Toestemmingsbewijs                    | Verantwoordingsplicht           | Wettelijke plicht      | Tot accountverwijdering                 | D1 (EU)    |
| Rate-limit-teller                     | Misbruikpreventie               | Gerechtvaardigd belang | Kort, per venster                       | D1 (EU)    |
| Operationele logs                     | Storingen en beveiliging        | Gerechtvaardigd belang | 7–30 dagen, zonder PII                  | Cloudflare |

Een **passkey-only account** heeft geen echt e-mailadres. Better Auth vereist technisch een unieke `email`-waarde; die is synthetisch (`passkey-<random>@invalid`) en bevat geen persoonsgegevens. Koppelt de ouder later Google, dan komt er een `account`-rij bij met het Google-subject; het `user`-id, de synthetische e-mail en de passkey blijven ongewijzigd. Er is geen e-mailherstel: herstel gaat via een tweede passkey of, na koppeling, via "Inloggen met Google".

**Niet verzameld:** naam van het kind, e-mail van het kind, geboortedatum, geslacht, foto, locatie, school, IP-adres in applicatielogs, volledige request-bodies en inhoud van `progress.data_json` in logs.

## Grondslag en ouderlijke toestemming

- **Toestemming (artikel 6 lid 1 sub a AVG)** is de grondslag voor het account en de kindprofielen. De ouder geeft die toestemming bij het aanmaken van het account, vóór de eerste sync.
- **Leeftijd:** in Nederland kunnen kinderen onder de 16 jaar zelf geen geldige toestemming geven voor een online dienst; een ouder of verzorger moet dat doen ([AP: grondslag toestemming](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/grondslag-toestemming)). De app vraagt de ouder daarom te verklaren dat hij of zij 16 jaar of ouder is en ouder/verzorger is. Er wordt geen geboortedatum opgeslagen.
- **Intrekken:** kinderen van 12 jaar en ouder mogen de toestemming zelf intrekken ([AP: grondslag toestemming](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/grondslag-toestemming)). De app moet een eenvoudige route bieden waarmee het kind of de ouder de toestemming voor dat profiel kan intrekken, zonder dat het kind een eigen account nodig heeft.
- **Bewijs:** de `consent`-tabel legt `policy_version`, `granted_at`, `withdrawn_at` en `method` vast. Dat is het bewijs dat de ouder toestemming gaf; het bevat geen kinddata.
- **Proportionaliteit:** een zelfverklaring is voor een kleine, niet-commerciële app proportioneel, maar geen "verifieerbare ouderlijke toestemming" in de strengste COPPA-zin. Als de site op kinderen in de VS wordt gericht, is extra verificatie nodig; zie hieronder.

## Cookies en lokale opslag

- **Sessiecookie:** één strikt noodzakelijke cookie, `HttpOnly`, `Secure` en `SameSite=Lax`. Geen consentbanner nodig voor strikt noodzakelijke cookies; wel uitleg in de privacyverklaring.
- **LocalStorage:** bevat gastvoortgang en profielvoorkeuren. Het is functionele opslag, geen tracking. Er worden geen identifiers naar derden gestuurd.
- **Geen third-party cookies.** Google kan bij OAuth op zijn eigen domein cookies zetten; dat valt onder Google's beleid en wordt in de privacyverklaring genoemd.
- **Geen cookie-cache** in versie 1, zodat een ingetrokken sessie direct ongeldig is.

## Bewaartermijnen en verwijdering

| Actie               | Gedrag                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Profiel verwijderen | `player` zacht verwijderen en `progress` cascaderen; daarna definitief opschonen                                                  |
| Account verwijderen | Better Auth-user, sessies, `player`, `progress`, `progress_mutation` en `consent` verwijderen; lokale state blijft op het toestel |
| Inactief account    | Na 12 maanden zonder login: waarschuwen en daarna verwijderen of anonimiseren                                                     |
| Sessies             | 7 dagen; direct intrekken bij logout                                                                                              |
| Logs                | 7–30 dagen, zonder PII                                                                                                            |
| D1 Time Travel      | 7 dagen (free) of 30 dagen (paid); verwijderen uit de live database betekent niet direct weg uit Time Travel                      |
| Back-ups            | Vastgelegde termijn, niet langer dan nodig; herstelprocedure testen                                                               |

Het verwijderrecht moet in de UI zitten, niet alleen op aanvraag per e-mail. De ouder moet kunnen exporteren wat hij wil bewaren, daarna verwijderen, en het toestel terugzetten naar lokaal-only.

## Rechten van betrokkenen

- **Inzage en export:** een JSON-bestand met accountgegevens, profielen en voortgang.
- **Correctie:** e-mail en weergavenaam van de ouder aanpassen.
- **Verwijdering:** profiel of account verwijderen, met cascade.
- **Beperking en bezwaar:** voor de verwerking op basis van gerechtvaardigd belang (beveiligingslogs).
- **Dataportabiliteit:** dezelfde JSON-export.
- **Toestemming intrekken:** account verwijderen of sync uitzetten; de app blijft lokaal werken.
- **Klacht:** verwijzen naar de Autoriteit Persoonsgegevens.
- **Kindvriendelijke uitleg:** een korte pagina in gewone taal, naast de volledige privacyverklaring.

## Beveiliging

| Maatregel        | Invulling                                                               |
| ---------------- | ----------------------------------------------------------------------- |
| Transport        | HTTPS-only; HSTS waar mogelijk                                          |
| Secrets          | Workers-secrets, nooit in de repo, build-log of clientbundle            |
| Auth             | Better Auth met CSRF- en origin-validatie; rate limiting in D1          |
| Sessies          | `HttpOnly`, `Secure`, `SameSite=Lax`; intrekken en rotatie              |
| Toegang          | Least privilege; geen gedeelde accounts; scoped tokens voor migraties   |
| Logging          | Geen e-mail, tokens, cookies, IP of request-body in applicatielogs      |
| Data             | D1 in de `eu`-jurisdictie; geen data in de clientbundle                 |
| Afhankelijkheden | Pinversies, lockfile en de bestaande kwaliteitsgate                     |
| Incident         | Procedure voor datalekken; melding aan de AP binnen 72 uur waar vereist |

Passkeys zijn geen biometrische gegevens voor de server: de private sleutel en de vingerafdruk of gezichtsherkenning blijven op het toestel van de ouder. De server ziet alleen de publieke sleutel.

## DPIA en register

- **DPIA:** een volledige DPIA is waarschijnlijk niet nodig: geen systematische monitoring, geen grootschalige verwerking, geen bijzondere categorieën, geen profiling en geen publieke profielen. Leg een korte risicoanalyse vast. Opnieuw beoordelen zodra analytics, een publieke ranglijst, chat of multiplayer met vreemden wordt toegevoegd.
- **Verwerkingsregister:** houd een register bij. De uitzondering voor organisaties met minder dan 250 medewerkers geldt niet als de verwerking niet incidenteel is of een risico vormt (artikel 30 lid 5 AVG).
- **Verwerkersovereenkomsten:** Cloudflare DPA en Google DPA. Leg de subprocessors en doorgiftegronden vast.
- **Doorgifte:** D1 staat in de EU-jurisdictie, maar Cloudflare is een Amerikaanse organisatie en het Workers-netwerk is wereldwijd. Gebruik de standaardcontractbepalingen en het Cloudflare Data Privacy Framework waar van toepassing. Voor Google OAuth gelden de Google-voorwaarden en doorgiftegronden.

## COPPA en ICO Age Appropriate Design Code

- **COPPA (VS):** de site is Nederlandstalig en op Nederland/EU gericht. Ze is niet gericht op kinderen in de VS en er zijn geen advertenties of tracking. Als de eigenaar de site bewust op de VS richt, wordt COPPA mogelijk van toepassing en is verifieerbare ouderlijke toestemming nodig; dat vraagt een nieuwe beoordeling. Zie [16 CFR 312.2](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.2) en [16 CFR 312.5](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.5).
- **ICO AADC (VK):** de code is niet direct Nederlands recht, maar bruikbaar als ontwerpchecklist. Deze app voldoet aan de belangrijkste punten: geen advertenties, geen profiling, geen geolocatie, geen publieke profielen en geen verslavende meldingen. Zie de [ICO AADC](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/).

## Transparantie

- **Privacyverklaring** in gewoon Nederlands: welke gegevens, waarom, hoe lang, wie het ziet, hoe je exporteert en verwijdert.
- **Kindvriendelijke samenvatting:** één scherm met "wat bewaren we wel en niet".
- **Geen dark patterns:** sync is optioneel, uitzetten is even makkelijk als aanzetten, en de app blijft daarna volledig werken.
- **Versie:** de privacyverklaring heeft een versienummer dat overeenkomt met `consent.policy_version`.
- **Publieke repo:** geen echte namen, e-mailadressen, screenshots van een gezin, productie-exports of `.dev.vars`. Testdata gebruikt `example.invalid`.

## Gevolgen

- **Het ouder-e-mailadres is persoonsgegeven.** Daarmee zijn een privacyverklaring, een verwerkingsregister en een DPA met Cloudflare nodig, ook bij een kleine app.
- **Google OAuth is gekozen.** De Google-knop voegt een verwerker en een externe request toe. Dat is een expliciete uitzondering; leg de DPA, het register en de privacyverklaring vast. Zonder Google blijft de app dichter bij de oorspronkelijke "geen externe requests"-regel.
- **Verwijderen en exporteren moeten vanaf dag één werken.** Achteraf inbouwen is duurder en foutgevoeliger.
- **Geen analytics betekent minder productinzicht.** De eigenaar moet genoegen nemen met kwalitatieve feedback en geanonimiseerde operationele metrieken.
- **Multiplayer, chat en ranglijsten vallen buiten deze ADR.** Die vragen een nieuwe DPIA en een apart veiligheidsontwerp.
- **De lokale modus blijft de privacyvriendelijkste optie.** De app mag nooit suggereren dat een account nodig is om volledig te spelen.

## Open vragen

1. **Wie is de verwerkingsverantwoordelijke en welk contactadres komt in de privacyverklaring?**
2. **Is 12 maanden inactiviteit de juiste bewaartermijn voor voortgang?**
3. **Mag de ouder een dashboard met voortgang per profiel zien, en vanaf welke leeftijd?**
4. **Is de site (ooit) op kinderen in de VS gericht?** Zo ja, dan is een COPPA-beoordeling nodig.
5. **Wordt de app door een rechtspersoon gepubliceerd of door de eigenaar als particulier?**
6. **Komt er een aparte functionaris of externe jurist voor de privacytoets?**

## Status en vervolg

Deze ADR is **Proposed**. Zonder goedkeuring van deze ADR en [ADR 0012](0012-optionele-accounts-en-sync.md) komt er geen productie-auth. Na goedkeuring: privacyverklaring en kindvriendelijke samenvatting publiceren, verwerkingsregister en DPA's vastleggen, export/delete bouwen en testen, en pas daarna de accountfunctie aanzetten.
