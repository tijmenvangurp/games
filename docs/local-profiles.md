# Lokale profielen en export/import

- **Status:** geïmplementeerd in fase 0.5
- **Datum:** 2026-10-18
- **Gerelateerd:** [ADR 0012](adr/0012-optionele-accounts-en-sync.md), [ADR 0013](adr/0013-privacy-optionele-accounts.md), [onderzoek fase 0.5](research/2026-10-18-auth-backend-betterauth.md#fase-05--lokale-profielen-en-exportimport)

Deze pagina legt het opslagformaat van lokale profielen vast. Het is bewust nog
geen accountmodel: er is geen server, geen e-mailadres en geen synchronisatie.
Een latere syncfase kan op dit formaat voortbouwen.

## Profielmodel

Een profiel heeft een stabiel `id`, een lokale naam en een avatar uit een vaste
set. Er zijn maximaal vier profielen. Namen en avatars blijven op het toestel;
er is geen geboortedatum, e-mailadres of server-id.

```ts
interface Profile {
  id: string; // p1, p2, p3, ...
  name: string; // 1–16 tekens, lokaal
  avatar: ProfileAvatarId; // beer, vos, panda, ...
  createdAt: string; // ISO-datum, alleen lokaal
}
```

Profiel `p1` wordt bij de eerste start aangemaakt. Profiel-id's worden nooit
hergebruikt: na het verwijderen van `p2` krijgt een nieuw profiel `p3`. Zo kan
oude state niet per ongeluk bij een ander profiel horen.

## Sleutelstrategie

De actieve profielkeuze staat in `games.profiles.v1`. Spelstate gebruikt de
volgende sleutels:

| Profiel | Sleutel                     | Voorbeeld            |
| ------- | --------------------------- | -------------------- |
| `p1`    | bestaande `games.<spel>.v1` | `games.sudoku.v1`    |
| `p2`    | `games.p2.<spel>.v1`        | `games.p2.sudoku.v1` |
| `p3`    | `games.p3.<spel>.v1`        | `games.p3.math.v1`   |
| `p4`    | `games.p4.<spel>.v1`        | `games.p4.arrows.v2` |

De enige plek die deze sleutels bouwt is
[`profileStorageKey`](../libs/shared/lib/profile-storage.ts). Spelmodules
gebruiken `GAME_STORAGE_KEYS` en roepen die helper aan; ze verzinnen geen eigen
prefix of fallback.

De bestaande sleutels blijven letterlijk profiel 1. Er wordt bij de eerste start
niets gekopieerd en niets verwijderd. Daardoor:

- toont een bestaand spel na de update exact dezelfde voortgang;
- blijft teruggaan naar de oude app-versie werken;
- is er geen migratie die halverwege kan mislukken.

Het verwijderen van een profiel verwijdert alleen de spelstate van dat profiel.
Het laatste profiel kan niet worden verwijderd.

## Geluid

`games.sound.v1` is een toestelvoorkeur en blijft globaal. De keuze wordt niet
geëxporteerd en import laat hem ongemoeid. Een profielwissel verandert dus niet
of het geluid aan staat.

## Exportformaat

Export is één JSON-bestand met `schemaVersion: 1`, de profielen en per profiel
de bekende spelstate. De actieve profiel-id en de exportdatum staan erbij. Het
bestand bevat geen sleutels, tokens, serverdata of apparaatinformatie.

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-10-18T12:00:00.000Z",
  "activeProfileId": "p2",
  "profiles": [
    {
      "id": "p1",
      "name": "Speler 1",
      "avatar": "bear",
      "createdAt": "2026-10-18T12:00:00.000Z",
      "games": {
        "games.sudoku.v1": {
          "play": null,
          "settings": {
            "size": 4,
            "difficulty": "makkelijk",
            "theme": "animals",
            "mistakeMode": "direct"
          }
        }
      }
    }
  ]
}
```

Import valideert eerst het hele bestand:

- `schemaVersion` moet exact `1` zijn;
- één tot vier profielen, unieke geldige id's, geldige avatar en naam;
- `activeProfileId` moet bij de profielen horen;
- elk `games`-object moet een bekend spel uit `GAME_STORAGE_KEYS` zijn en een
  JSON-object als waarde hebben;
- onbekende spelsleutels worden geweigerd, zodat een import niets anders kan
  overschrijven.

Pas na die controle worden de bestaande profielnamespaces en de oude
profiel-1-sleutels opgeruimd en de geïmporteerde state geschreven. Bij een
ongeldig bestand blijft de bestaande state staan. Import vervangt alle profielen
op het toestel; de UI zegt dat vooraf. `games.sound.v1` wordt nooit aangeraakt.

## Profielkiezer

De homepagina toont een profielkiezer met avatar, naam en een teller. Daar kan de
gebruiker wisselen, een profiel toevoegen (maximaal vier) en na bevestiging
verwijderen. Onder **Beheer** staan exporteren en importeren. Alle knoppen hebben
een touch-target van minimaal 44 px.

Na wisselen, toevoegen, verwijderen of importeren herlaadt de pagina. De
Zustand-stores van de spellen lezen hun state namelijk één keer bij
module-initialisatie. Een volledige herlaadactie is de eenvoudigste manier om
alle stores en het actieve profiel consistent te maken; er is geen tweede
state-laag en geen kans op een half gewisselde store.

## Bewust niet in deze fase

- Geen accounts, login, Worker, D1 of `connect-src`-wijziging.
- Geen automatische merge of sync tussen toestellen.
- Geen serverdata in export of opslag.
- Geen nieuwe dependency; validatie gebruikt de bestaande stijl met pure
  guards en `JSON.parse` in `try/catch`.

De tests staan in `tests/web/profiles.test.ts` (sleutels, migratie,
profielscheiding, export/import en corrupte data) en
`tests/web/profile-switcher.test.tsx` (profiel wisselen, aanmaken, verwijderen
en een ongeldige import).
