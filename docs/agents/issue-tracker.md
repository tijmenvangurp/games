# Issue tracker: GitHub

Issues en specs staan als GitHub-issues. Gebruik de `gh` CLI.

## Conventies

- **Aanmaken**: `gh issue create --title "..." --body "..."`.
- **Lezen**: `gh issue view <nummer> --json number,title,body,labels,comments`.
- **Lijsten**: `gh issue list --state open --json number,title,body,labels,comments`.
- **Sub-issue**: `gh issue create --parent <parent> ...` of
  `gh issue edit <parent> --add-sub-issue <child>`.
- **Blokkeren**: `gh issue create --blocked-by <n>,<n> ...` of
  `gh issue edit <child> --add-blocked-by <blocker>`. Lukt dat niet, zet dan
  `Blocked by: #<n>` bovenaan de child.
- **Labelen**: `gh issue edit <nummer> --add-label "..."`.
- **Sluiten**: eerst `gh issue comment <nummer> --body "..."`, dan
  `gh issue close <nummer>`.

Het repo wordt afgeleid uit `git remote -v`. Bestandsissues horen in deze repo,
niet in de upstream van een skill.

## Pull requests

**PRs als triage-oppervlak: nee.** Alleen issues worden getriageerd.

## Wayfinding

- **Map**: één issue met label `wayfinder:map`.
- **Ticket**: child-issue van de map met label `wayfinder:<type>`.
- **Blokkeren**: GitHub issue-dependencies; anders een `Blocked by`-regel.
- **Frontier**: open children zonder open blocker en zonder assignee.
- **Claimen**: `gh issue edit <n> --add-assignee @me`.
- **Afronden**: comment met antwoord, sluiten, en de map bijwerken.
