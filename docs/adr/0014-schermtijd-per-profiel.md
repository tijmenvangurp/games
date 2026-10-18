# ADR 0014: Schermtijd per profiel met dagbudget en blokkade

- **Status:** Proposed — ter goedkeuring door de eigenaar
- **Datum:** 2026-10-18
- **Gerelateerd:** [ADR 0012](0012-optionele-accounts-en-sync.md) (accounts en profielen), [ADR 0013](0013-privacy-optionele-accounts.md) (privacy), [onderzoek](../research/2026-10-18-auth-backend-betterauth.md)

## Context

De app heeft optionele ouderaccounts met interne kindprofielen ([ADR 0012](0012-optionele-accounts-en-sync.md)). De eigenaar wil daarnaast **schermtijd per persoon**: een ouder stelt per kindprofiel een dagbudget in, het kind ziet hoeveel tijd er nog is, en na het budget blokkeert de app verder spelen. De ouder ziet de totalen per profiel.

De eigenaar heeft gekozen voor:

- **Harde blokkade** na het dagbudget, niet alleen een waarschuwing.
- **Alleen met account.** Gasten hebben geen schermtijd; de timer hoort bij een accountprofiel.
- **Kind én ouder zien de tijd.** Het kind ziet de resterende tijd, de ouder ziet de totalen per profiel.
- **Dagbudget per profiel.**
- **Uitloggen op een accounttoestel kan alleen met een ouderpincode of passkey.** Anders zou uitloggen naar gastmodus de limiet omzeilen.

De app blijft gast-eerst: zonder account is er geen timer en geen blokkade. Schermtijd is een optionele ouderfunctie bovenop een account, geen voorwaarde om te spelen. De limiet is daarmee een afspraak binnen de app, geen waterdichte ouderlijke controle: een privévenster, een andere browser of gewiste site-data omzeilt hem. Dat staat expliciet in de gevolgen.

## Beslissing

1. **Alleen accountprofielen hebben schermtijd.** Een gastprofiel heeft geen timer, geen budget en geen blokkade. De timer start wanneer een ouder is ingelogd en een kindprofiel actief is.
2. **Dagbudget per profiel.** De ouder stelt per profiel een budget in seconden in, met voorstellen van 15, 30, 45, 60 en 90 minuten. Een nieuw profiel krijgt standaard 30 minuten; de ouder kan dat wijzigen of de limiet helemaal uitzetten (`NULL`).
3. **De timer loopt lokaal, de server bewaart het dagtotaal.** De client telt zichtbare seconden en houdt de resterende tijd bij. De server is de bron voor het dagtotaal over alle toestellen en voor het budget. Zo werkt de timer ook offline en blijft het totaal op meerdere toestellen kloppen.
4. **Alleen zichtbare tijd telt.** De timer loopt wanneer het tabblad zichtbaar is (`document.visibilityState === "visible"`). Achtergrondtabs, een vergrendeld scherm en een slapend toestel tellen niet. Elke tick is begrensd, zodat een lange slaapstand niet als speeltijd wordt geteld.
5. **Harde blokkade bij 0.** Bij 80% en 95% verschijnt een vriendelijke waarschuwing. Bij 0 toont de app een volledig scherm "Tijd is om" en start geen enkel spel meer. De voortgang wordt vóór de blokkade opgeslagen. Er is een grace-periode van 30 seconden om een lopende beurt netjes af te ronden.
6. **Blokkade opheffen kan alleen door de ouder.** De ouder kan met de pincode of passkey extra tijd geven (5, 10 of 15 minuten) of het blokkadescherm sluiten. In het laatste geval blijft het spel geblokkeerd tot de volgende dag. Het kind kan het scherm niet wegklikken. De volgende dag begint het budget opnieuw om 00:00 Europe/Amsterdam.
7. **Uitloggen en profielwissel zijn beveiligd.** Op een toestel waar een ouderaccount actief is, kan het kind niet zomaar uitloggen of naar gastmodus gaan. Daarvoor is de ouderpincode of passkey nodig. Zo blijft de limiet gelden zolang het toestel aan het account gekoppeld is.
8. **Ouderpincode.** De ouder stelt een pincode van 4–6 cijfers in. De app bewaart alleen een PBKDF2-hash met salt, nooit de pincode zelf. Na vijf foute pogingen volgt een korte lockout. Een vergeten pincode wordt gereset door opnieuw in te loggen met de accountmethode (passkey of Google); dat is de enige herstelroute.
9. **Ouderlijke override wordt vastgelegd.** Extra tijd komt in `screen_time_day.extra_seconds` met `granted_at`, zodat het dagtotaal en de limiet controleerbaar blijven. De ouder ziet de override in het overzicht.
10. **Sync is idempotent en mag later aankomen.** De client stuurt elke 30 seconden een delta met een idempotency-key, en bij `visibilitychange`/`pagehide` een laatste flush. Offline deltas worden bewaard en later verstuurd. De server telt delta's op tot `used_seconds` en dedupliceert op de idempotency-key.
11. **De server is leidend bij een conflict.** Heeft een ander toestel al meer tijd gebruikt, dan krijgt de client bij de volgende sync het hogere server-totaal en blokkeert alsnog. De client mag het server-totaal nooit verlagen.
12. **Dagtotaal per lokale datum.** De server rekent met `Europe/Amsterdam` en slaat `local_date` als `YYYY-MM-DD` op. Dat houdt de dagrens voorspelbaar, ook bij zomertijd.
13. **Kind en ouder zien verschillende dingen.** Het kind ziet een kleine resterende tijd en de waarschuwingen. De ouder ziet per profiel het dagbudget, het gebruik en de overrides. Er is geen publieke ranglijst en geen vergelijking tussen kinderen.
14. **Privacy blijft minimaal.** De server bewaart dagtotalen, geen reeks van elke minuut. Er komt geen gedragsanalyse, geen locatie en geen meldingen die om meer data vragen. De details staan in [ADR 0013](0013-privacy-optionele-accounts.md).
15. **De blokkade is geen beveiligingsgrens.** Een kind dat site-data wist of devtools gebruikt, kan de lokale timer resetten. De server houdt het opgetelde totaal, maar kan een nieuwe lokale state niet voorkomen. Dit is een bewuste keuze: het is een ouderlijke afspraak binnen de app, geen OS- of MDM-slot. Sterkere handhaving valt buiten deze ADR.

## Werking

| Moment                          | Gedrag                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------- |
| Profiel actief                  | Client haalt `screen-time/status` op en toont de resterende tijd                  |
| Tabblad zichtbaar               | Timer telt; elke 30 s een delta naar de server                                    |
| Tabblad verborgen               | Timer pauzeert; laatste delta wordt geflusht                                      |
| 80% en 95%                      | Vriendelijke waarschuwing, geen straf of geluid                                   |
| 0%                              | Voortgang opslaan, 30 s grace, daarna volledig blokkeerscherm                     |
| Ouder override                  | Pincode/passkey, extra tijd, `extra_seconds` bijwerken                            |
| Uitloggen of gastmodus          | Alleen met pincode/passkey op een accounttoestel                                  |
| Nieuwe dag                      | Budget reset om 00:00 Europe/Amsterdam                                            |
| Offline                         | Lokale timer loopt door; deltas worden later gesynchroniseerd                     |
| Server ontoegankelijk bij start | Laatst bekende status uit de cache; zonder cache geen blokkade tot de eerste sync |

De laatste regel is bewust **fail-open**: een kind mag niet buiten zijn schuld vastlopen omdat de cache leeg is. Zodra de server bereikbaar is, wordt het echte totaal alsnog toegepast.

## Datamodel en API

| Onderdeel                         | Velden of route                                                                                                       | Toelichting                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `player`                          | `screen_time_limit_seconds`                                                                                           | Budget per profiel; `NULL` betekent geen limiet   |
| `screen_time_day`                 | `player_id`, `local_date`, `used_seconds`, `extra_seconds`, `granted_at`, `updated_at`; PK(`player_id`, `local_date`) | Dagtotaal en override                             |
| `screen_time_delta`               | `idempotency_key` (PK), `player_id`, `local_date`, `delta_seconds`, `device_id`, `created_at`                         | Idempotente hartbeats; na verwerking op te ruimen |
| `parent_pin`                      | `user_id`, `pin_hash`, `salt`, `updated_at`, `failed_attempts`, `locked_until`                                        | Alleen een hash; nooit de pincode                 |
| `GET /api/screen-time/status`     | Query: `player_id`                                                                                                    | Geeft budget, gebruikt, resterend en `locked`     |
| `POST /api/screen-time/heartbeat` | Body: `player_id`, `local_date`, `delta_seconds`, `idempotency_key`                                                   | Verhoogt het dagtotaal atomisch                   |
| `POST /api/screen-time/override`  | Body: `player_id`, `extra_seconds`, `pin` of stap-up-sessie                                                           | Ouder geeft extra tijd                            |
| `POST /api/screen-time/settings`  | Body: `player_id`, `limit_seconds`                                                                                    | Ouder past het budget aan                         |

De delta-insert en de update van `screen_time_day` horen in dezelfde D1-batch, net als bij voortgang. De server verhoogt `used_seconds` alleen als de idempotency-key nieuw is.

## Offline en synchronisatie

- De client houdt per profiel een lokale `usedSeconds` en `remainingSeconds` bij, plus een outbox met delta's.
- Bij een offline start gebruikt de client de laatst bekende status. Is die status van een eerdere dag, dan geldt een vers budget en is de lokale datum leidend.
- Bij reconnect worden de delta's in volgorde verstuurd. De server retourneert het actuele totaal; is dat hoger dan lokaal, dan wint de server.
- Een delta is nooit negatief en nooit groter dan de verstreken zichtbare tijd plus een marge. De client kapt een tick op 60 seconden af.
- Meerdere tabs: de Web Locks API (`navigator.locks`) of een `BroadcastChannel` zorgt dat één tab telt. Zonder die API telt alleen de zichtbare tab en wordt een tweede tab bij openen gepauzeerd.

## Privacy

Schermtijd is persoonsgegeven, ook al is het maar een dagtotaal. De verwerking valt onder [ADR 0013](0013-privacy-optionele-accounts.md); daar worden de grondslag, bewaartermijn, het register en de verwerkers geregeld. Aanvullend:

- **Doel:** ouderlijke controle over appgebruik, niet analyse of profilering.
- **Transparantie:** het kind ziet de timer en de waarschuwing. De ouder ziet geen verborgen gedragsprofiel.
- **Bewaartermijn:** dagtotalen maximaal 12 maanden, daarna geaggregeerd of verwijderd. Deltas worden na verwerking opgeruimd.
- **Geen publieke cijfers:** geen ranglijst, geen vergelijking tussen kinderen en geen deling met derden.
- **Kinderrechten:** een kind van 12 jaar of ouder kan de toestemming voor schermtijd intrekken; de ouder kan de functie dan uitzetten of het profiel verwijderen.
- **DPIA:** schermtijd is een vorm van monitoring, maar beperkt tot appgebruik, zichtbaar voor het kind en zonder locatie of gedragsprofiel. Leg een korte risicoanalyse vast en beoordeel opnieuw bij uitbreiding naar andere toestellen of apps.

## Gevolgen

- **De limiet is alleen zinvol op een accounttoestel.** Zonder account is er geen timer. Als de ouder de functie wil gebruiken, moet het kindertoestel aan het account gekoppeld zijn.
- **Uitloggen wordt een ouderlijke handeling.** Dat is nodig voor een harde blokkade, maar vraagt een pincode, een herstelroute en duidelijke UI.
- **De blokkade is omzeilbaar.** Site-data wissen, devtools gebruiken, een andere browser of een privévenster reset de lokale timer. De server houdt het totaal, maar kan een nieuwe lokale state niet tegenhouden. Accepteer dit als productgrens of kies een native/MDM-oplossing buiten deze repo.
- **Er komen meer D1-writes.** Een hartbeat per 30 seconden per actief profiel is klein, maar niet nul. Bij een familie-app is dat verwaarloosbaar.
- **De UI wordt complexer.** Timer, waarschuwingen, blokkadescherm, pincode, override en een ouderoverzicht moeten samen werken zonder het spel zelf te verstoren.
- **Privacy-impact stijgt.** Er komt een ouderlijk controlespoor bij. Dat is transparant en minimaal, maar vraagt uitleg en een plek in het verwerkingsregister.
- **Geen invloed op gasten.** Gasten blijven volledig vrij spelen; de app mag hen niet vragen om een account voor schermtijd.

## Alternatieven

| Alternatief                                              | Waarom niet                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| Alleen waarschuwen, niet blokkeren                       | Door de eigenaar afgewezen; te vrijblijvend                          |
| Schermtijd voor gasten                                   | Botst met "alleen met account" en vraagt een toestelbrede identiteit |
| Alleen lokaal, zonder server                             | Geen totaal over meerdere toestellen en geen ouderoverzicht          |
| Alleen server-side                                       | Werkt niet offline en blokkeert het spel bij netwerkstoring          |
| Native app of MDM                                        | Echte handhaving, maar buiten de statische webapp en deze repo       |
| Timer op basis van kloktijd in plaats van zichtbare tijd | Telt achtergrondtabs en slaapstand mee; onnauwkeurig                 |

## Open vragen

1. **Standaardbudget:** is 30 minuten per nieuw profiel een goede default, of moet een profiel zonder budget beginnen?
2. **Maximale override:** hoeveel extra tijd mag een ouder per dag geven, en is er een harde bovengrens?
3. **Pincode of passkey:** is de pincode de primaire route, of moet de passkey de standaard zijn en de pincode alleen een offline fallback?
4. **Bewaartermijn:** is 12 maanden dagtotalen nodig, of volstaan 90 dagen voor het ouderoverzicht?
5. **Weekdag/weekend:** komt er een apart budget per weekdag, of blijft het één dagbudget?
6. **Bedtijd:** komt er een tijdvenster naast een minutenbudget?
7. **Meldingen:** krijgt de ouder een melding bij het bereiken van de limiet, of alleen een overzicht?
8. **Meerdere toestellen:** telt de tijd op alle toestellen bij elkaar, of krijgt elk toestel een eigen budget? Deze ADR kiest optellen.

## Status en vervolg

Deze ADR is **Proposed**. Zonder goedkeuring van [ADR 0012](0012-optionele-accounts-en-sync.md), [ADR 0013](0013-privacy-optionele-accounts.md) en deze ADR komt er geen schermtijd. Na goedkeuring: datamodel en API toevoegen, lokale timer en blokkadescherm bouwen, pincode en override implementeren, en e2e-tests toevoegen voor: geen account = geen timer, offline doorspelen, dagreset, override en uitloggen achter de pincode.
