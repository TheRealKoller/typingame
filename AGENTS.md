# AGENTS.md – Arbeitsanweisungen für KI-Sitzungen

Diese Datei gilt für jede KI-Sitzung in diesem Repository. Sie beschreibt, **wie** gearbeitet wird. **Was** gebaut wird, steht in [`docs/game-design.md`](docs/game-design.md).

## Projekt

Ein Tower-Defense-Spiel zum Lernen des Zehnfingersystems (Deutsch, QWERTZ). Getippte Worte bauen Türme, rüsten sie auf und greifen an; man beginnt als Lehrling in einer Bibliothek und lernt Reihe für Reihe.
Stack: Tauri 2, TypeScript, Phaser, Vite.

## Entwicklung

### Voraussetzungen

- Node.js ≥ 22 mit npm
- Rust (stabil, über [rustup](https://rustup.rs)) – nur für den Desktop-Modus
- Systempakete für Tauri unter Linux (Fedora):

  ```sh
  sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file \
    libappindicator-gtk3-devel librsvg2-devel libxdo-devel
  sudo dnf group install "c-development"
  ```

  Andere Systeme: [Tauri-Voraussetzungen](https://v2.tauri.app/start/prerequisites/).

### Befehle

|Befehl|Zweck|
|---|---|
|`npm install`|Abhängigkeiten installieren (einmalig bzw. nach Änderungen an `package.json`)|
|`npm run dev`|Entwicklungsserver, Spiel im Browser unter `http://localhost:1420`|
|`npm run desktop`|Spiel im Tauri-Fenster (startet den Entwicklungsserver mit)|
|`npm run check`|Typprüfung und Tests – vor jedem PR|
|`npm run typecheck`|nur Typprüfung|
|`npm test`|nur Tests (Vitest, einmaliger Lauf)|
|`npm run test:watch`|Tests im Beobachtungsmodus|
|`npm run build`|Typprüfung und Web-Build nach `dist/`|
|`npm run desktop:build`|Desktop-Programm und Installationspakete nach `src-tauri/target/release/`|

### Aufbau

- `src/` – Spiel (TypeScript, Phaser); Einstieg `src/main.ts`; `src/scenes/HomeRowScene.ts` ist vorläufig die einzige Szene: Tippen auf der Grundreihe mit Bildschirmtastatur und Statistik, bis der Kampf-Prototyp (M2) sie ablöst
- `src/keyboard/` – Tastaturlayouts als Daten (physische Taste → Zeichen, Reihe, Finger); zuerst `qwertz-de.ts`
- `src/typing/` – Tipp-Engine: Zielauswahl per Präfix, Fehler, Wortabschluss (ohne Phaser)
- `src/battle/` – Kampflogik ohne Phaser: Level als Daten (`level.ts`), Wege (`path.ts`), Ablauf mit Flut und Ebbe, Wellen, Bannkreis, Sieg und Niederlage (`battle.ts`); die Zeit läuft nur über `update(deltaMs)`
- `src/content/` – Spielinhalte als Daten: Wortliste der Grundreihe (`words.ts`, `words.test.ts` prüft die Tastenregel) und das erste Level (`level1.ts`)
- `src/progress/` – Fortschritt ohne Phaser: Freischaltung nach Genauigkeit (`unlock.ts`), Sitzungsstatistik (`stats.ts`), gewichtete Wortauswahl nach Fehlerquote ohne Präfix-Paare (`practice.ts`), Spielstand (`save.ts` Format, `progress.ts` Laden/Speichern, `storage.ts` Datei bzw. localStorage)
- `src/ui/` – wiederverwendbare Phaser-Bausteine: `KeyboardView` (Bildschirmtastatur), `StatsView` (Statistik), `WordLabel` (Wort mit getipptem Anfang)
- `src/assets/` – Grafik: `spire/` (Foozle „Spire“, CC0: `tileset/`, `effects/`, `towers/`, `enemies/`, `builder/`); Quellen und Lizenzen in `LICENSES.md`
- Tests liegen neben dem Code als `*.test.ts` unter `src/` und laufen mit [Vitest](https://vitest.dev) in Node, ohne Phaser.
- `src-tauri/` – Desktop-Hülle (Rust, Tauri 2), Konfiguration in `src-tauri/tauri.conf.json`

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
- **Milestones:** `M0` bis `M7`, siehe Designdokument Abschnitt 9. Ideen ohne klare Zuordnung bleiben ohne Milestone.
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
- Vor dem Öffnen eines PR: `npm run check` grün, Spiel gestartet und die Änderung selbst ausprobiert.
- Die CI (`.github/workflows/ci.yml`) führt bei jedem PR und jedem Push auf `main` Installation, Typprüfung, Tests und Web-Build aus. Nach dem Öffnen eines PR prüfen, dass der Check grün ist (`gh pr checks <nr>`); ein roter Check wird vor der Übergabe an den Nutzer behoben.
