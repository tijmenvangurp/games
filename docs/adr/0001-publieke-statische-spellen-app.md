# ADR 0001: Publieke spellen-app in een aparte statische repository

- **Status:** Accepted
- **Datum:** 2026-10-17

## Context

De eigenaar wil spelletjes voor de kinderen publiceren op een openbare URL, te beginnen met sudoku. De bestaande repository `athena-homelab-control` bevat interne infrastructuur: hostnames, tailnet-namen, poorten, paden en beheerprocedures. Publicatie vanuit die repository of met gedeelde geschiedenis zou interne informatie kunnen lekken. De app heeft geen serverdata nodig: sudoku's kunnen volledig in de browser worden gegenereerd en opgelost.

## Beslissing

1. **Nieuwe, zelfstandige publieke repository** (`games`) zonder gedeelde geschiedenis met `homelab-control`.
2. **Volledig statische SPA.** Geen backend, database, accounts, API-keys of environment variables. De sudoku-generator en -solver draaien in de browser; elke puzzel heeft precies één oplossing.
3. **Cloudflare Workers static assets.** De workernaam `games` levert `games.tijmenvangurp.workers.dev`. Deploy gebeurt vanuit GitHub Actions met een eigen, beperkt token dat alleen als repository-secret bestaat.
4. **Geen externe requests.** Geen analytics, trackers, CDN's of externe fonts. `public/_headers` zet een strikte CSP, `noindex` en `nosniff`.
5. **Publieke-repo-hygiëne.** Commits gebruiken het GitHub `noreply`-adres; er komen geen namen, foto's of andere persoonsgegevens in de repository.
6. **Lokale opslag alleen.** Voortgang en instellingen staan in `localStorage` op het apparaat en worden nergens naartoe gestuurd.

## Gevolgen

- De code en de site zijn openbaar. Dat is acceptabel zolang de inhoud generiek blijft.
- Functies die een server vereisen (gedeelde scores, multiplayer, accounts) passen niet binnen dit ontwerp en vragen een nieuwe ADR met een expliciet privacy- en beveiligingsontwerp.
- Het Cloudflare-token moet beperkt blijven tot Workers van dit account. Het token hoort nooit in de repository of in chat.
- De site is bewust niet indexeerbaar en bevat geen links naar interne diensten.
