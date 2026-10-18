# Verwerkers

> **DRAFT — concept, niet gepubliceerd.** Dit overzicht is voorbereiding voor issue #46. De eigenaar vult de placeholders in, sluit de overeenkomsten en laat dit juridisch toetsen. Dit is geen juridisch advies. Zie [ADR 0013](../adr/0013-privacy-optionele-accounts.md).

- **Status:** DRAFT
- **Versie:** `[versie]`
- **Datum:** `[datum]`
- **Verwerkingsverantwoordelijke:** `[naam verwerkingsverantwoordelijke]`
- **Contact:** `[contactadres]`
- **Gerelateerd:** [ADR 0013](../adr/0013-privacy-optionele-accounts.md), [privacyverklaring](privacyverklaring.md), [verwerkingsregister](verwerkingsregister.md)

## Uitgangspunt

De app gebruikt precies twee externe partijen:

| Verwerker  | Dienst                                       | Persoonsgegevens                                                                                                 | DPA-status                | Contactpersoon             |
| ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------- |
| Cloudflare | Workers, static assets, D1 en applicatielogs | Ouderaccount, profielen, voortgang, sessies, toestemmingsbewijs, rate-limit-tellers en applicatielogs zonder PII | `[DPA-status Cloudflare]` | `[contactpunt Cloudflare]` |
| Google     | OAuth-login voor de ouder                    | E-mailadres, weergavenaam, provider en subject-id, OAuth-metadata                                                | `[DPA-status Google]`     | `[contactpunt Google]`     |

Er is **geen** e-mailprovider, **geen** analyticspartij, **geen** advertentienetwerk en **geen** extra CDN. Google OAuth is de enige bewuste uitzondering op de regel dat de app geen externe requests doet; die uitzondering staat in [ADR 0012](../adr/0012-optionele-accounts-en-sync.md) en [ADR 0013](../adr/0013-privacy-optionele-accounts.md).

## Cloudflare

### Rol en diensten

Cloudflare is verwerker voor:

- **Workers:** de runtime voor `/api/auth/*` en `/api/progress/*`;
- **Static assets:** de bestanden uit `apps/games/dist`;
- **D1:** de database met het ouderaccount, de profielen, de voortgang, de sessies, het toestemmingsbewijs en de rate-limit-tellers;
- **Applicatielogs:** fout- en beveiligingsgebeurtenissen uit de app, zonder e-mail, tokens, cookies, IP, user-agent of request-body. Cloudflare kan als hostingpartij verbindingsmetadata verwerken; dat valt onder de DPA en is geen applicatielog.

De app gebruikt geen Cloudflare Analytics, geen Cloudflare Images, geen R2 en geen andere Cloudflare-diensten dan nodig voor de Worker en D1.

### DPA en subprocessors

- **Verwerkersovereenkomst:** `[DPA-status Cloudflare]`
- **Datum van sluiten of accepteren:** `[datum DPA Cloudflare]`
- **Contactpersoon bij Cloudflare:** `[contactpunt Cloudflare]`
- **Laatste controle subprocessorslijst:** `[datum laatste review]`
- **Bewaarplaats van de overeenkomst:** `[intern dossier of link]`

Cloudflare publiceert een eigen klant-DPA en een openbare subprocessorslijst. De eigenaar moet de DPA vóór de eerste productie-login accepteren en de subprocessors periodiek controleren, in ieder geval jaarlijks en bij een wijziging. De DPA bevat de afspraken over vertrouwelijkheid, beveiliging, subprocessors, verwijdering en doorgiften.

Bronnen:

- [Cloudflare Customer DPA](https://www.cloudflare.com/cloudflare-customer-dpa/)
- [Cloudflare subprocessors](https://www.cloudflare.com/gdpr/subprocessors/)

### Locatie en doorgifte

- D1 wordt aangemaakt in de `eu`-jurisdictie. De primary en de read-replica's blijven daarmee binnen de EU.
- De Worker kan vanuit meerdere regio's draaien; de statische assets worden via het wereldwijde netwerk van Cloudflare geleverd.
- Cloudflare is een Amerikaanse organisatie. Voor doorgiften buiten de EER gelden de standaardcontractbepalingen en, waar van toepassing, het EU-VS Data Privacy Framework.
- De exacte doorgiftegrond en de actuele status moeten in het DPA-dossier staan. Laat dit juridisch bevestigen.

### Beveiliging en retentie

- TLS voor al het verkeer; encryptie in rust volgens de Cloudflare-DPA.
- Toegang tot de D1-database via de Worker en via een beperkt aantal beheertoegangen.
- D1 Time Travel: 7 dagen (gratis plan) of 30 dagen (betaald plan). Verwijderen uit de live database betekent niet direct verwijderen uit Time Travel.
- Geen productiegegevens in de clientbundle, de repository of build-logs.
- Workers-secrets worden apart gezet en niet in `wrangler.jsonc` of een `.dev.vars` in de repository opgenomen.

## Google

### Rol en diensten

Google wordt alleen gebruikt voor **OAuth-login van de ouder**. De browser gaat naar Google en komt daarna terug in de app. De Worker wisselt de autorisatiecode server-side in. De app vraagt alleen de standaardscopes `openid`, `email` en `profile` op.

De app:

- krijgt geen toegang tot Gmail, Drive, Contacten, Agenda of andere Google-diensten;
- toont geen Google-avatar en laadt geen remote afbeelding;
- gebruikt Google niet voor analytics, advertenties of profilering;
- gebruikt Google niet voor kinderen; alleen de ouder of verzorger logt in.

Google kan tijdens de OAuth-flow cookies op zijn eigen domein plaatsen. Daarvoor geldt het privacybeleid van Google, niet de cookie-uitleg van de app.

### DPA en doorgifte

- **Verwerkersovereenkomst:** `[DPA-status Google]`
- **Datum van sluiten of accepteren:** `[datum DPA Google]`
- **Contactpersoon bij Google:** `[contactpunt Google]`
- **Vastgelegde doorgiftegrond:** `[SCC's, EU-VS Data Privacy Framework of anders]`
- **Bewaarplaats van de overeenkomst:** `[intern dossier of link]`

Google is een Amerikaanse organisatie; verwerking buiten de EER is mogelijk. De eigenaar moet vóór productie vastleggen:

1. welke Google-overeenkomst van toepassing is op deze OAuth-integratie;
2. of Google voor deze stap als verwerker of (deels) als zelfstandig verantwoordelijke optreedt;
3. welke doorgiftegrond geldt;
4. wie het contactpunt is voor privacy- en beveiligingsvragen.

Laat dit juridisch bevestigen. De algemene verwijzing naar het Google-privacybeleid is voor de gebruiker, maar vervangt geen DPA.

Bronnen:

- [Google Privacybeleid](https://policies.google.com/privacy)
- [Google OAuth-scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Google Data Processing Addendum](https://cloud.google.com/terms/data-processing-addendum)

## Bewust niet ingezet

| Partij of dienst             | Waarom niet                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| E-mailprovider               | Geen magic link, geen wachtwoordreset per e-mail en geen marketingmail.                       |
| Analytics of productmeting   | Geen tracking, geen profiling en geen extra verwerker.                                        |
| Advertentienetwerk           | De app is gratis en toont geen advertenties.                                                  |
| Externe CDN of webfonts      | Alle assets staan lokaal of komen uit de eigen bundle.                                        |
| Remote avatars               | Het profiel gebruikt een avatar uit de vaste lokale set; geen Google- of Gravatar-afbeelding. |
| Chat, multiplayer of ranking | Valt buiten scope en vraagt een eigen privacy- en veiligheidsontwerp.                         |

## Checklist vóór productie

- [ ] `[naam verwerkingsverantwoordelijke]` en `[contactadres]` zijn ingevuld in de privacyverklaring, het register en dit document.
- [ ] De Cloudflare-DPA is geaccepteerd en de datum staat in dit document.
- [ ] De subprocessorslijst van Cloudflare is gecontroleerd en de controledatum staat erbij.
- [ ] De D1-database is daadwerkelijk in de `eu`-jurisdictie aangemaakt.
- [ ] De Google-DPA of van toepassing zijnde Google-voorwaarden zijn vastgelegd.
- [ ] De doorgiftegrond voor Google is vastgelegd en juridisch bevestigd.
- [ ] De OAuth-consent-screen noemt alleen `openid`, `email` en `profile`.
- [ ] De callback-URL staat exact in de Google-console en `trustedOrigins` bevat alleen de productie-origin.
- [ ] Er is geen e-mailprovider, analytics-SDK of advertentienetwerk toegevoegd.
- [ ] Logs bevatten geen e-mail, tokens, cookies, IP, user-agent of request-body.
- [ ] De bewaartermijnen in het register komen overeen met de ingestelde retentie en Time Travel.
- [ ] De privacyverklaring en de kindvriendelijke uitleg zijn juridisch getoetst.
- [ ] Testdata gebruikt uitsluitend `example.invalid`; er staan geen echte gezinsgegevens in de repository.

## Noot voor de eigenaar (niet publiceren)

Vul alle placeholders in de tabel en in de checklist in. Sluit de Cloudflare-DPA aan vóór de eerste productie-login en leg de Google-overeenkomst en doorgiftegrond vast. Controleer de subprocessors minimaal jaarlijks. Laat de rollen (verwerker versus zelfstandig verantwoordelijke) en de doorgiftegronden toetsen door een jurist. Dit document is een voorbereiding, geen bewijs dat de overeenkomsten al zijn gesloten.
