# AGENTS.md – Arbeitsanweisungen für KI-Sitzungen

Diese Datei gilt für jede KI-Sitzung in diesem Repository. Sie beschreibt, **wie** gearbeitet wird. **Was** gebaut wird, steht in [`docs/game-design.md`](docs/game-design.md).

## Projekt

Ein ruhiges Desktop-Spiel zum Lernen des Zehnfingersystems (Deutsch, QWERTZ). Man beginnt als Baby, das sprechen lernt; mit jeder neuen Taste wächst die Welt.
Stack: Tauri 2, TypeScript, Phaser, Vite.

## Zu Beginn jeder Sitzung

1. Diese Datei und `docs/game-design.md` lesen.
2. Das zugehörige Issue lesen (`gh issue view <nr>`), inklusive Kommentare.
3. Unklarheiten, die das Issue oder das Designdokument nicht beantwortet, mit dem Nutzer klären, bevor Code entsteht.

## Sprache

| Was | Sprache |
|---|---|
| Issues, Pull-Request-Beschreibungen, Dokumentation, Gespräche | Deutsch |
| Code, Code-Kommentare, Commit-Nachrichten, Branch-Namen | Englisch |
| Spielinhalte (Wörter, Texte) | Deutsch |

## Arbeitsablauf

```
Issue → Branch → Umsetzung + Test → Pull Request → Nutzer testet → Nutzer merged
```

- **Jede Änderung braucht ein Issue.** Ideen oder Bugs aus dem Chat zuerst als Issue anlegen.
- **Nie direkt auf `main` pushen. Nie selbst mergen.** Der Nutzer merged.
- **Branch-Namen:** `<typ>/<issue-nr>-<kurzbeschreibung>`, Typen: `feature`, `fix`, `docs`, `content`, `experiment`, `chore`.
  Beispiel: `feature/6-typing-engine`
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/), englisch, Imperativ.
  Beispiel: `feat: add target selection by first character`
- **Pull Request:**
  - Titel englisch im Commit-Stil, Beschreibung deutsch.
  - Enthält `Closes #<nr>`.
  - Enthält eine **Testanleitung für den Nutzer**: welche Befehle, was man sehen und ausprobieren soll.
  - Bei sichtbaren Änderungen: Screenshot.
- **Designänderungen:** Ändert sich das Konzept, wird `docs/game-design.md` im selben PR angepasst.

## Experimente

- Branch `experiment/<nr>-<name>`, Issue mit Label `experiment`.
- Ergebnis wird im Issue festgehalten, auch wenn es verworfen wird.
- Übernahme nur per PR nach Zustimmung des Nutzers.

## Issues

- **Labels:** `bug`, `feature`, `idee`, `experiment`, `grafik`, `inhalt`, `documentation`
- **Milestones:** `M0` bis `M7`, siehe Designdokument Abschnitt 8. Ideen ohne klare Zuordnung bleiben ohne Milestone.
- **Bugs** enthalten: was passiert ist, was erwartet war, Schritte zum Nachstellen.
- **Features** enthalten: Umfang und Akzeptanzkriterien.

## Project-Board

GitHub Project **typingame** (`https://github.com/users/TheRealKoller/projects/9`), Feld **Status**:

| Status | Bedeutung | Wer setzt ihn |
|---|---|---|
| Ideen | Noch nicht entschieden | beim Anlegen einer Idee |
| Geplant | Entschieden, nicht begonnen | beim Anlegen einer Aufgabe |
| In Arbeit | Wird umgesetzt | KI, beim Beginn |
| Zum Testen | PR offen, wartet auf Test und Merge | KI, beim Öffnen des PR |
| Fertig | Gemergt bzw. erledigt | nach dem Merge |

Neue Issues immer zum Board hinzufügen. Zu Sitzungsbeginn geschlossene Issues, die noch nicht auf *Fertig* stehen, nachziehen.

Befehle:

```sh
# Issue zum Board hinzufügen (gibt die Item-ID aus)
gh project item-add 9 --owner TheRealKoller --url <issue-url> --format json --jq .id

# Item-ID eines Issues finden
gh project item-list 9 --owner TheRealKoller --format json --limit 200 \
  --jq '.items[] | select(.content.number == <nr>) | .id'

# Status setzen
gh project item-edit --id <item-id> \
  --project-id PVT_kwHOAdvbTs4Bk_2f \
  --field-id PVTSSF_lAHOAdvbTs4Bk_2fzhjuWZg \
  --single-select-option-id <option-id>
```

Option-IDs: Ideen `65553881`, Geplant `27e16f78`, In Arbeit `bea1e159`, Zum Testen `f83c4374`, Fertig `f1e47de1`.

## Qualität

- Spiellogik (Tipp-Engine, Statistik, Freischaltung, Inhaltsprüfung) ist ohne Phaser testbar und hat Tests.
- Inhalte liegen als Daten vor. Jedes Wort darf nur Tasten verwenden, die an dieser Stelle freigeschaltet sind – ein Test prüft das.
- Vor dem Öffnen eines PR: Typprüfung und Tests grün, Spiel gestartet und die Änderung selbst ausprobiert.
