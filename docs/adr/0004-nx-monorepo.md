# ADR 0004: Nx-monorepo met Feature-Sliced Design

- **Status:** Accepted
- **Datum:** 2026-10-17

## Context

De spellen-app begon als één Vite-project met Feature-Sliced Design in `src/`. Alle lagen zaten in dezelfde TypeScript-configuratie en de kwaliteitsgate draaide elke controle over de hele repository. Nieuwe spellen voegen slices toe aan meerdere lagen; zonder expliciete projectgrenzen wordt de afhankelijkheidsgraaf onoverzichtelijk en draaien checks onnodig vaak over alles.

De repository is openbaar en de app mag geen externe requests doen. Een oplossing met een hosted buildservice of analytics valt daarom af.

## Beslissing

1. **Nx 23 als taakrunner en projectgraaf.** De repository wordt een Nx-monorepo met `apps/` en `libs/`.
2. **Applicatie in `apps/games`.** Hier staan `index.html`, `public/`, de router, providers en globale styles. Vite bouwt vanuit deze map naar `apps/games/dist`.
3. **Eén Nx-project per FSD-slice.** De lagen staan in `libs/pages`, `libs/widgets`, `libs/features`, `libs/entities` en `libs/shared`. Elke slice heeft een `project.json`, `tsconfig.json` en een public API (`index.ts`). De bestaande aliassen (`@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`) blijven behouden.
4. **Kwaliteitsgate blijft inhoudelijk gelijk.** Vitest draait de gedeelde suites in `tests/` met dezelfde coverage-drempel. Steiger controleert `libs` en `apps/games/src`; Fallow controleert de nieuwe zone-indeling. TypeScript blijft gesplitst in `tsconfig.web.json` en `tsconfig.node.json`.
5. **Alleen lokale Nx-cache.** Er is geen Nx Cloud, remote cache of telemetrie. CI draait dezelfde pnpm-scripts als lokaal.
6. **Nx-tags documenteren de grenzen.** Projecten krijgen `layer:*`, `scope:*` en `type:*`-tags. De daadwerkelijke FSD-grens wordt bewaakt door Steiger en Fallow.

## Gevolgen

- `pnpm run build`, `typecheck`, `test:coverage` en `lint` draaien via Nx en kunnen lokaal uit de cache komen.
- De Cloudflare Worker leest static assets uit `apps/games/dist`; de dashboardinstellingen en het deploycommando blijven ongewijzigd.
- De repository bevat extra configuratie (`nx.json`, `project.json` per project, `tsconfig.base.json`). Nieuwe slices moeten een project toevoegen en de alias in `tsconfig.base.json`, `tools/aliases.ts` en de Fallow-zones bijwerken.
- De app blijft volledig statisch en doet nog steeds geen externe requests. Nx wordt alleen als lokale ontwikkeltool gebruikt.
