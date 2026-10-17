# ADR 0002: Dezelfde kwaliteitsgate als homelab-control

- **Status:** Accepted
- **Datum:** 2026-10-17

## Context

De eigenaar wil in dit nieuwe project dezelfde kwaliteitscontroles en repositorystructuur als in `homelab-control`: Feature-Sliced Design, OXC (oxlint/oxfmt), gesplitste TypeScript-checks, Vitest met coverage-drempel, Steiger, Fallow, Playwright E2E, Husky en commitlint. Een deel van die gate is ingericht rond een bestaande, volwassen lockfile.

## Beslissing

- Alle bovengenoemde controles worden overgenomen met dezelfde scripts en drempels (coverage ≥ 80%).
- De repository gebruikt dezelfde FSD-lagen, testsplitsing (`tests/node`, `tests/web`) en configuratiebestanden.
- `pnpm.onlyBuiltDependencies`/`allowBuilds` staat alleen `esbuild` en `workerd` toe.
- De pnpm-instelling `minimumReleaseAge: 10080` (zeven dagen) is bij de start **niet** actief. Een verse lockfile kan met die policy geen actuele toolchain resolven; pnpm weigert dan alle packages die recenter dan zeven dagen zijn gepubliceerd, inclusief verplichte transitieve dependencies. De lockfile en `--frozen-lockfile` in CI blijven verplicht.

## Gevolgen

- De kwaliteitsgate is inhoudelijk gelijk aan die van `homelab-control`, behalve de release-age-policy.
- Na enkele weken kan `minimumReleaseAge` alsnog worden aangezet en de lockfile opnieuw worden geresolveerd. Dat is een kleine, geïsoleerde wijziging in `pnpm-workspace.yaml`.
- CI blijft reproducerbaar door de gecommitte lockfile en `--frozen-lockfile`.
