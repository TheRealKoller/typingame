# Game Design – typingame (Arbeitstitel)

> Lebendes Dokument. Hält fest, was wir entschieden haben, und was noch offen ist.
> Änderungen am Konzept kommen hierher, bevor sie in den Code gehen.
>
> Neu ausgerichtet am 04.10.26 ([#66](https://github.com/TheRealKoller/typingame/issues/66)): aus dem ruhigen Entdeckungsspiel wird ein Tower-Defense-Spiel. Der alte Stand liegt unter dem Tag `rpg-prototyp`.

## 1. Vision

Ein Desktop-Spiel, mit dem man das **Zehnfingersystem** lernt – als **Tower Defense**.

In dieser Welt sind **Worte Macht**. Man spielt einen Lehrling, der in einer Bibliothek die Zeichen lernt, Reihe für Reihe. Getippte Worte errichten Türme, rüsten sie auf und lösen Zauber aus. Als das *Verstummen* die Bibliothek niederbrennt und den Meister verschleppt, zieht der Lehrling los – über eine Weltkarte, deren Gebiete immer schwerer werden, bis zur Festung des Verstummens.

**Leitlinien**

- **Worte sind Macht:** Jede Handlung im Spiel ist ein getipptes Wort – bauen, aufrüsten, angreifen.
- **Genauigkeit vor Tempo:** Ein falscher Buchstabe kostet Zeit, keine Leben.
- **Scheitern ohne Strafe:** Man kann ein Level verlieren, nicht das Spiel. Ein verlorenes Level wird einfach wiederholt.
- **Echtes Lernen:** Das Spiel folgt einer sinnvollen Tasten-Reihenfolge, zeigt die Fingerzuordnung und übt Schwächen gezielt.

## 2. Zielgruppe

- Zunächst: der Entwickler selbst.
- Später (Open Source): alle, die Zehnfingerschreiben lernen oder verbessern wollen – vom absoluten Anfänger bis zum Fortgeschrittenen.
- Sprache und Tastaturlayout: **Deutsch, QWERTZ**.

## 3. Story

### 3.1 Welt

Worte halten die Welt zusammen. Was seinen Namen verliert, verblasst und zerfällt. Das **Verstummen** ist eine Macht, die Worte frisst; seine Kreaturen kommen in Wellen. Gegen sie hilft nur, was man schreiben kann.

Thema: **Fantasy**.

### 3.2 Ton und Hauptfigur

- **Ton:** episch und humorvoll zugleich.
- **Hauptfigur:** der Lehrling. Er ist etwas zynisch und hat einen trockenen Humor; die Zwischensequenzen leben von seinen Kommentaren.
- Der Spieler **wählt den Namen** des Lehrlings zu Beginn. Die Eingabe ist freies Tippen, keine Übung, und zählt nicht zur Statistik.
- Der Lehrling hat **kein Gesicht**: Man sieht ihn nie, er ist der Spieler. Er tritt nur in Texten auf.

### 3.3 Handlung

1. **Bibliothek (Tutorial):** Der Lehrling lernt beim Meister die Zeichen, Reihe für Reihe, bis er alle Buchstaben beherrscht (siehe 5).
2. **Der Überfall:** Kaum sind die Buchstaben gelernt, greift das Verstummen die Bibliothek an. Dieser Kampf ist **nicht zu gewinnen**: Die Bibliothek brennt ab, der Meister wird verschleppt.
3. **Die Reise:** Der Lehrling kämpft sich über die **Weltkarte** ins Feindesland vor. Je weiter er kommt, desto schwerer wird es. An bestimmten Ereignissen findet er **Bücher** (oder Ähnliches), aus denen er neue Fähigkeiten lernt: Großschreibung, Umlaute, Satzzeichen, Ziffern, Sonderzeichen.
4. **Finale:** Der Lehrling befreit den Meister und besiegt das Verstummen. Das Spiel hat ein **Ende**.

### 3.4 Zwischensequenzen

- Die Geschichte wird in **Zwischensequenzen** erzählt.
- Zunächst sind es **einfache Texte**.
- Später werden sie mit **Video oder Stop-Motion** unterlegt.

## 4. Kernmechanik

### 4.1 Ein Level

- Eine Karte mit einem Weg, auf dem die Gegner in **Wellen** zu einem Ziel laufen, und **Bauplätzen** am Rand.
- Erreicht ein Gegner das Ziel, kostet das Leben. Sind keine Leben mehr übrig, ist das Level verloren.
- Wer alle Wellen übersteht, gewinnt das Level.

### 4.2 Bauen und Aufrüsten

- Jeder **Bauplatz** trägt ein Wort. Tippt man es, ist der Bauplatz gewählt.
- Danach baut ein **Schlüsselwort** dort einen bestimmten Turm, z. B. *feuer* einen Feuerturm.
- **Aufrüsten** funktioniert ähnlich: den Turm über sein Wort wählen, dann ein Aufrüstwort tippen.

### 4.3 Kampf

- Türme greifen von selbst an.
- **Spezialgegner** tragen Wörter. Tippt man das Wort, greift man sie direkt an.
- Türme können **Spezialangriffe** haben, die man mit Wörtern auslöst.
- **Bosse** verlangen einen ganzen Text, z. B. ein Gedicht oder eine Rede.

### 4.4 Ziel wählen beim Tippen

- Man wählt selbst, welches Wort man tippt. Alle sichtbaren Wörter, die mit dem bisher Getippten beginnen, bleiben im Spiel; mit jedem Zeichen wird eingegrenzt, bis nur noch eins übrig ist.
- Ein Wort ist fertig, sobald das Getippte ihm genau entspricht. Ist ein sichtbares Wort der Anfang eines anderen, gewinnt deshalb das kürzere – solche Paare dürfen nicht gleichzeitig sichtbar sein.

### 4.5 Wörter

- **Zunächst:** Wortlisten. Gewählt werden passende Wörter, die nur freigeschaltete Tasten enthalten.
- **Später thematisch:**

| Handlung | Beispiele |
|---|---|
| Feuerturm bauen | *feuer, hitze, glut* |
| Feuerturm aufrüsten | *inferno, entzünden, flammen* |
| Spezialangriff | *brennender komet, flammender regen* |

### 4.6 Fehlerverhalten

- Ein falscher Buchstabe wird sanft markiert.
- Das Wort wird erst weitergeführt, wenn der richtige Buchstabe getippt ist. Ein falscher Buchstabe wechselt nicht zu einem anderen Wort.
- Fehler fließen in die Statistik und in die Auswahl der Wörter ein.

### 4.7 Scheitern

- Verliert man ein Level, wird der nächste Punkt auf der Weltkarte nicht freigeschaltet. Man kann das Level jederzeit erneut versuchen.
- Ausnahme ist der Überfall auf die Bibliothek (3.3): Er endet immer mit der Niederlage und führt in die Reise.

## 5. Progression

Bis alle Buchstaben beherrscht sind, ist das Spiel ein **Tutorial** in der Bibliothek. Erst danach beginnt das Hauptspiel auf der Weltkarte. **Groß-/Kleinschreibung kommt erst auf der Reise** – vorher wird alles kleingeschrieben.

| Abschnitt | Ort | Neu |
|---|---|---|
| Tutorial 1 | Bibliothek | Grundreihe: `a s d f j k l`, dann `g h` |
| Tutorial 2 | Bibliothek | Obere Reihe: `e i`, `r u`, `t z`, `o p`, `w q` |
| Tutorial 3 | Bibliothek | Untere Reihe: `n m`, `b v`, `c x y`, dann die Leertaste |
| Überfall | Bibliothek | – (nicht zu gewinnen) |
| Reise | Weltkarte, Gebiete | Bücher: Umlaute `ä ö ü ß`, Großschreibung (Umschalttaste), Satzzeichen `. , ? !`, Ziffern, Sonderzeichen |
| Finale | Festung des Verstummens | alle Zeichen, Bosskampf |

- Die Reihenfolge innerhalb einer Reihe folgt klassischen Zehnfinger-Kursen.
- Welches Gebiet welches Buch enthält, ist offen.

**Regel:** Jedes Wort darf nur Tasten enthalten, die an dieser Stelle freigeschaltet sind. Das wird im Code automatisch geprüft (siehe 8.3).

## 6. Lernsystem

- **Bildschirmtastatur** mit Farben pro Finger (gleicher Finger beider Hände, gleiche Farbe; die Seite zeigt die Hand).
  - Die nächste(n) Taste(n) und die passenden Finger pulsieren, darunter zwei Hände und der Name des Fingers (z. B. „D: linker Mittelfinger“).
  - Gesperrte Tasten sind grau. Eine gedrückte Taste leuchtet kurz auf – hell bei richtig, rosa bei falsch.
  - Die Leertaste steht als breite Taste in einer eigenen Zeile unter den Buchstaben und gehört dem Daumen.
  - Später lässt sich die Tastatur ausblenden (siehe #48).
- **Adaptive Wortauswahl:** Tasten mit hoher Fehlerquote tauchen häufiger in angebotenen Wörtern auf.
  - Gewichtet zufällig: Jedes Wort hat Gewicht 1, dazu kommt für jede seiner Tasten 10 × Fehler / (Anschläge + 5), mit den Werten über alle Sitzungen. Ohne Fehler ist die Auswahl gleich verteilt.
  - Werte in `src/progress/practice.ts`.
- **Freischalten neuer Tasten im Tutorial** nach erreichter Genauigkeit: mindestens 90 % richtige Anschläge unter den letzten 30 – nicht nach Zeit. Werte in `src/progress/unlock.ts`.
- **Statistik:** Anschläge pro Minute, Genauigkeit, Fehler pro Taste, Verlauf über Sitzungen.
  - *Anschläge pro Minute* = richtige Anschläge je Minute Tippzeit; Lücken über 5 s zählen als Pause und nicht zur Tippzeit.
  - *Genauigkeit* = Anteil richtiger an allen Anschlägen.
  - *Fehler pro Taste* werden der Taste zugerechnet, die man hätte treffen sollen. War nicht eindeutig, welche gemeint war (mehrere Wörter möglich), zählt der Fehler nur in der Genauigkeit.

## 7. Grafik und Ton

- **Thema:** Fantasy.
- **Stil:** offen. Naheliegend ist Pixelgrafik: Die vorhandenen Kenney-Kacheln in `src/assets/world/` (CC0, *Tiny Town*, *Roguelike/RPG*) sind mittelalterlich und könnten für Karten und Weltkarte taugen.
- **Bedienoberfläche:** Bildschirmtastatur, Wortlabels und Statistik bleiben **scharf** und nicht pixelig, müssen aber zum Look passen und über der Szene lesbar sein.
- **Zwischensequenzen:** zuerst Text, später Video oder Stop-Motion (siehe 3.4).
- **Ton:** noch nicht festgelegt ([#56](https://github.com/TheRealKoller/typingame/issues/56)).
- **Lizenzen:** Alle Assets müssen zu einer späteren Open-Source-Veröffentlichung passen – CC0 bevorzugt, CC BY mit Nennung möglich.

## 8. Technik

### 8.1 Stack

- **Tauri 2** – Desktop-Hülle (Linux, Windows, macOS), kleine Programmgröße.
- **TypeScript** – Spiellogik.
- **Phaser** – 2D-Rendering, Szenen, Animation, Ton.
- **Vite** – Build und Entwicklungsserver. Das Spiel ist während der Entwicklung auch im Browser lauffähig.

Alle Komponenten sind kostenlos und Open Source (MIT/Apache).

### 8.2 Eingabe

- Getippte Zeichen über `KeyboardEvent.key` (berücksichtigt das Tastaturlayout).
- Hervorhebung auf der Bildschirmtastatur über `KeyboardEvent.code` (physische Taste).
- Tastaturlayout als Datendatei (Taste → Reihe, Finger), zuerst nur QWERTZ-Deutsch.

### 8.3 Inhalte als Daten

- Level, Wellen, Gegner, Türme, Wortlisten und Zwischensequenzen liegen in Datendateien, nicht im Code verstreut.
- Ein automatischer Test prüft, dass jedes Wort nur freigeschaltete Tasten verwendet.

### 8.4 Speichern

- Fortschritt und Statistik lokal auf dem Rechner (Spielstand als JSON), zunächst ein Profil.
- Inhalt: Name des Lehrlings, Stand im Tutorial, freigeschaltete Punkte der Weltkarte, gelernte Fähigkeiten, Treffer und Fehler je Taste über alle Sitzungen, eine Zusammenfassung je Sitzung (Beginn, richtige/falsche Anschläge, Tippzeit).
- Ablage: Desktop-App in `spielstand.json` im App-Datenordner (Linux: `~/.local/share/de.therealkoller.typingame/`), Browser im `localStorage` unter `typingame.spielstand`.
- Ein unlesbarer Spielstand wird ignoriert, das Spiel beginnt dann von vorn.

## 9. Meilensteine

| # | Ziel | Ergebnis |
|---|---|---|
| M0 | Projekt einrichten | erledigt: Arbeitsmodus, Tauri + Phaser + TypeScript, Tests, CI |
| M1 | Neuausrichtung | dieses Dokument; RPG-Code entfernt, wiederverwendbarer Kern bleibt |
| M2 | Kampf-Prototyp | ein Level: Weg, Wellen, Bauplätze mit Wörtern, ein Turm, Leben, Sieg und Niederlage – nur Grundreihe, Platzhaltergrafik |
| M3 | Tutorial | Bibliothek mit allen drei Reihen, Namenswahl, Text-Zwischensequenzen, Überfall |
| M4 | Weltkarte | Gebiete, Freischalten durch Sieg, Wiederholen, mehrere Türme und Aufrüsten, Spezialgegner |
| M5 | Grafikstil | Stil festlegen, Bibliothek und erste Gebiete gestalten |
| M6 | Bücher | Umlaute, Großschreibung, Satzzeichen, Ziffern, Sonderzeichen; thematische Wörter |
| M7 | Finale | Bosskämpfe mit ganzen Texten, Festung des Verstummens, Ende |

Nach jedem Meilenstein: spielen, Rückmeldung, anpassen.

Die einzelnen Aufgaben stehen als [GitHub Issues](https://github.com/TheRealKoller/typingame/issues) unter dem jeweiligen Milestone, der Stand auf dem [Project-Board](https://github.com/users/TheRealKoller/projects/9). Wie gearbeitet wird, beschreibt [`AGENTS.md`](../AGENTS.md).

## 10. Offene Fragen

Offene Fragen werden als Issues mit Label `idee` diskutiert. Entscheidungen fließen hier ins Dokument zurück.

- Spielname – [#13](https://github.com/TheRealKoller/typingame/issues/13)
- Lizenz bei Veröffentlichung – [#18](https://github.com/TheRealKoller/typingame/issues/18)
- Ton und Klang – [#56](https://github.com/TheRealKoller/typingame/issues/56)
- Wie sieht das Tutorial spielerisch aus – schon kleine Kämpfe in der Bibliothek oder reine Übungen?
- Womit bezahlt man Türme und Aufrüstungen (z. B. Tinte, die besiegte Gegner hinterlassen)?
- Was wird in einem Level verteidigt?
- Wächst das Tempo der Gegner mit den gemessenen Anschlägen pro Minute, damit Anfänger nicht überrollt werden?
- Kann man ein angefangenes Wort abbrechen, um das Ziel zu wechseln (z. B. mit Esc)?
- Gebiete der Weltkarte: Anzahl, Namen, welches Gebiet welches Buch enthält.
- Namen für Meister, Welt und Bibliothek.
