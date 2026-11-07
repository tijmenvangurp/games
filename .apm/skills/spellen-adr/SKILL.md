---
name: spellen-adr
description: "Leg een architectuur-, privacy-, asset- of deploymentbeslissing van Spellen vast in een ADR en werk de indexen bij. Gebruik bij een nieuwe mechanic, een nieuwe assetbron, een dependency met lock-in, een backendvoorstel of een beslissing die later verrassend lijkt."
---

# Een ADR schrijven

Lees `docs/adr/README.md`, `docs/adr/template.md` en twee bestaande ADR's uit
dezelfde categorie.

## Wanneer

Een ADR is alleen nodig als alle drie waar zijn:

1. De beslissing is moeilijk terug te draaien.
2. Een lezer zou zonder context verrast zijn.
3. Er was een echte afweging tussen alternatieven.

Een gewone bugfix, een nieuwe test of een kleine UI-wijziging krijgt geen ADR.

## Werkwijze

1. Zoek het hoogste nummer in `docs/adr/` en tel er één bij op.
2. Kopieer `docs/adr/template.md` naar
   `docs/adr/NNNN-korte-slug.md`.
3. Vul in:
   - **Status** en **Datum**;
   - **Context**: het probleem, de randvoorwaarden en de afgevallen
     alternatieven;
   - **Beslissing**: concreet en genummerd, inclusief wat expliciet niet
     gebeurt;
   - **Gevolgen**: code, assets, privacy, CSP, opslag, tests, deployment en
     onderhoud;
   - **Bronnen**: primaire bronnen, licenties en gerelateerde ADR's.
4. Voeg de ADR toe aan `docs/adr/README.md` en `docs/README.md`.
5. Link vanuit de relevante code of het relevante document.
6. Draai `corepack pnpm run quality:full`.

## Grenzen

- Geen ADR als er geen echte afweging was; dan is het een notitie.
- Geen geheimen, privéhosts of persoonsgegevens in de context of bronnen.
- Geen ADR die een beslissing achteraf goedpraat; beschrijf ook de nadelen.
- Merge nooit zelfstandig.
