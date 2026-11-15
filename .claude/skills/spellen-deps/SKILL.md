---
name: spellen-deps
description: "Kies of voeg een bibliotheek toe volgens het beleid 'bibliotheken eerst' van Spellen. Gebruik bij een nieuwe dependency, een vervanging van eigen code, een bundel- of licensievraag, of een afweging in docs/research/."
---

# Bibliotheken eerst

Lees `AGENTS.md` → **Bibliotheken eerst** en de tabel **Wat we al hebben**.

## Werkwijze

1. **Zoek eerst.** Staat de oplossing al in `package.json`, in de tabel van
   `AGENTS.md`, in `libs/shared`, of in een bestaande dependency?
2. **Zoek extern.** Zoek een bewezen, onderhouden bibliotheek met TypeScript-
   typen. Voeg liever een library toe dan zelf een parser, genererator of
   spellogica te schrijven.
3. **Toets de randvoorwaarden:**
   - werkt in de statische app en binnen de CSP in
     `apps/games/public/_headers`;
   - geen telemetrie, analytics, tracker, CDN of runtime-netwerk;
   - geen account, server of backend nodig;
   - TypeScript/ESM en een duidelijke licentie;
   - past bij de bestaande stack en heeft een redelijke bundel.
4. **Neem een beslissing.** Een nieuwe library mag zonder toestemming. Een
   backend, account of netwerkdienst vraagt een ADR en expliciete goedkeuring.
5. **Voeg toe.**

   ```sh
   corepack pnpm add <library>
   corepack pnpm add -D <dev-library>
   ```

6. **Werk de documentatie bij.** Zet de library in de tabel van `AGENTS.md`,
   noem hem in de commit (`deps:`) en in de pull request. Leg een bewuste
   afwijzing vast in `docs/research/` of in de pull request.
7. **Draai de gate.** `corepack pnpm run quality:full`.

## Grenzen

- Geen Python, `.js`-config of een eigen script als een library het al doet.
- Geen dependency die tijdens het spelen een netwerkrequest doet.
- Geen licentie zonder bronvermelding; werk `LICENSES/` bij.
- Geen nieuwe backend zonder ADR en akkoord van de maintainer.
- Merge nooit zelfstandig.
