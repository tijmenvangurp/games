---
name: spellen-ui
description: "Ontwerp, controleer of verbeter de UI van Spellen volgens het design system en verifieer het resultaat met Playwright op 390 px en 1024 px. Gebruik bij een nieuw scherm, een visuele bug, een layoutcontrole of een UI-review."
---

# UI en visuele controle

Lees `docs/design-system.md` en bekijk bestaande schermen voordat je iets
nieuws maakt.

## Ontwerpen

- Gebruik `GameShell`, `game-panel`, `PageHeader`, `Button`, `ChoiceCard` en
  `OptionPicker` voordat je een eigen variant maakt.
- Gebruik `text-primary` voor actie en selectie; `success`, `warning` en
  `danger` alleen voor hun betekenis.
- Houd touch-targets op minimaal 44 px en respecteer `pt-safe`/`pb-safe`.
- Geen `!important`, geen externe fonts, geen remote images, geen emoji in
  UI-chrome.
- Beweging is feedback, niet decoratie. Respecteer `prefers-reduced-motion`.

## Verifiëren met Playwright

1. Bouw en start de preview via de Playwright-config:

   ```sh
   corepack pnpm run build
   corepack pnpm run e2e -- --grep "naam"
   ```

   Voor een losse opname mag je een tijdelijke spec in `e2e/` zetten. Verwijder
   die daarna.

2. Maak screenshots op 390 × 844 en 1024 × 768:

   ```ts
   await page.setViewportSize({ width: 390, height: 844 });
   await page.goto("/");
   await expect(page.getByRole("heading").first()).toBeVisible();
   await page.waitForTimeout(500); // alleen voor een entree-animatie
   await page.screenshot({
     path: "/tmp/opencode/screenshots/app-390.png",
     fullPage: true,
   });
   ```

3. Lees elke screenshot met de image-capable read-tool. Keur af bij een leeg
   beeld, afgekapte inhoud, ontbrekende assets, horizontale overflow of een
   verkeerde staat.
4. Ruim de tijdelijke spec op. Laat de PNG's in `/tmp/opencode/screenshots/`.

## Grenzen

- Screenshots horen nooit in de repo.
- Geen pagina's met secrets, privédashboards of persoonsgegevens vastleggen.
- Deel screenshots alleen via een privékanaal; de publieke repo bevat geen
  privéconfiguratie.
- Verander geen functionele copy zonder de maintainer te vragen.
