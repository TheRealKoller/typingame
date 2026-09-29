# Game Design – typingame (Arbeitstitel)

> Lebendes Dokument. Hält fest, was wir entschieden haben, und was noch offen ist.
> Änderungen am Konzept kommen hierher, bevor sie in den Code gehen.

## 1. Vision

Ein ruhiges Desktop-Spiel, mit dem man das **Zehnfingersystem** lernt – vom ersten Tastendruck bis zum flüssigen Tippen ganzer Texte.

Man beginnt als **Baby**, das sprechen lernt. Jede neu gelernte Taste erweitert, was man „sagen“ kann – und damit, was man von der Welt wahrnimmt und entdeckt. Aus ersten Lauten im Kinderzimmer werden Wörter im Haus, Sätze im Dorf und schließlich Logbuch-Texte auf Expeditionen. Später wächst das Spiel zu einem Aufbauspiel (Dorf ausbauen) und bekommt optional einen Actionmodus (Dorf verteidigen).

**Leitlinien**

- **Bedeutung statt Zufall:** Jedes getippte Wort gehört zur Szene. Keine zufälligen Wortlisten.
- **Ruhe statt Druck:** Im Hauptspiel gibt es keinen Zeitdruck. Genauigkeit vor Geschwindigkeit.
- **Die Welt wächst mit den Fingern:** Neue Tasten schalten neue Orte, Dinge und Wörter frei.
- **Echtes Lernen:** Das Spiel folgt einer sinnvollen Tasten-Reihenfolge, zeigt die Fingerzuordnung und übt Schwächen gezielt.

## 2. Zielgruppe

- Zunächst: der Entwickler selbst.
- Später (Open Source): alle, die Zehnfingerschreiben lernen oder verbessern wollen – vom absoluten Anfänger bis zum Fortgeschrittenen.
- Sprache und Tastaturlayout: **Deutsch, QWERTZ**.

## 3. Kernmechanik

### 3.1 Benennen macht sichtbar

- Die Welt beginnt **unscharf, blass, verschwommen** – so wie ein Baby sie wahrnimmt.
- An Dingen in der Szene erscheinen Wörter. Tippt man ein Wort, wird das Ding **entdeckt**: Es wird scharf und farbig, animiert sich, macht ein Geräusch.
- Man wählt selbst, welches Wort man tippt. Alle sichtbaren Wörter, die mit dem bisher Getippten beginnen, bleiben im Spiel; mit jedem Zeichen wird eingegrenzt, bis nur noch eins übrig ist (*ha* passt zu *haha* und *hallo*, *hal* nur noch zu *hallo*).
- Ein Wort ist fertig, sobald das Getippte ihm genau entspricht. Ist ein sichtbares Wort der Anfang eines anderen (*da* und *dada*), gewinnt deshalb das kürzere – solche Paare sollen nicht gleichzeitig sichtbar sein.
- Ein angefangenes Wort wird zu Ende getippt; Abbrechen gibt es nicht.
- Ist genug entdeckt, öffnet sich der nächste Abschnitt: eine neue Taste, ein neuer Raum, ein größerer Ausschnitt der Welt.

### 3.2 Laute lösen etwas aus (Kapitel 1)

Im Kinderzimmer gibt es noch kaum Wörter. Stattdessen lösen **Laute** Reaktionen aus:

| Abschnitt | Neue Tasten | Laut | Reaktion |
|---|---|---|---|
| 1a | `a s d f j k l` | *lala* | die Spieluhr beginnt zu spielen |
| | | *dada* | das Mobile über dem Bett dreht sich |
| | | *jaja* | das Bett schaukelt sanft |
| 1b | `g h` | *haha* | der Teddy wackelt |
| | | *gaga* | die Quietscheente quietscht |
| | | *aha* | das Nachtlicht geht an |

Die Laute aus 1a bleiben in 1b erhalten. Die Daten stehen in `src/content/chapter1.ts`.

So wird schon die Grundreihe bedeutungsvoll, bevor echte Wörter möglich sind. *da* und *ja* fehlen bewusst: Sie sind der Anfang von *dada* und *jaja* und würden diese unerreichbar machen (siehe 3.1).

### 3.3 Fehlerverhalten

- Ein falscher Buchstabe wird sanft markiert (kein lauter Fehlerton, kein Punktabzug im Hauptspiel).
- Das Wort wird erst weitergeführt, wenn der richtige Buchstabe getippt ist. Ein falscher Buchstabe wechselt nicht zu einem anderen Wort.
- Fehler fließen in die Statistik und in die Auswahl der Übungswörter ein.

## 4. Progression

Die Tasten-Reihenfolge folgt klassischen Zehnfinger-Kursen. **Groß-/Kleinschreibung kommt erst in Kapitel 4** – vorher wird alles kleingeschrieben.

| Kapitel | Ort | Neue Tasten | Beispiele |
|---|---|---|---|
| 1 | Kinderzimmer | Grundreihe: `a s d f j k l`, dann `g h` | *lala, dada, jaja, haha, gaga, aha* |
| 2 | Haus | Obere Reihe: `e i`, `r u`, `t z`, `o p`, `w q` | *papa, opa, tee, hase, eis, katze, keks, puppe, tasse, topf, suppe, wasser* |
| 3 | Garten | Untere Reihe: `n m`, `b v`, `c x y` | *mama, oma, ball, baum, blume, nase, mond, hund, ente, maus, milch, sonne* – erste Paare: *mama da, hund weg* |
| 4 | Dorf / Schule | Umschalttaste (Großschreibung), `ä ö ü ß`, Satzzeichen `. , ? !` | *Der Hund bellt. Die Sonne scheint. Wo ist der Bäcker?* |
| 5 | Umgebung / Expedition | Ziffern, Sonderzeichen | Logbuch: *Tag 3: Am Fluss wachsen 12 Birken.* |
| später | Aufbau | alle | Rohstoffe sammeln, Dorf ausbauen |
| später | Verteidigung | alle, Tempo | Actionmodus: Angriffe auf das Dorf abwehren |

**Regel:** Jedes Wort in einem Abschnitt darf nur Tasten enthalten, die bis dahin freigeschaltet sind. Das wird im Code automatisch geprüft (siehe 7.3).

**Emotionaler Meilenstein:** Das erste *mama* ist erst möglich, sobald `m` freigeschaltet ist (Kapitel 3). Das soll als besonderer Moment inszeniert werden.

## 5. Lernsystem

- **Bildschirmtastatur** mit Farben pro Finger (gleicher Finger beider Hände, gleiche Farbe; die Seite zeigt die Hand). Die nächste(n) Taste(n) und die passenden Finger pulsieren, darunter zwei Hände und der Name des Fingers (z. B. „D: linker Mittelfinger“). Gesperrte Tasten sind grau, eine gedrückte Taste leuchtet kurz auf – hell bei richtig, rosa bei falsch.
- **Adaptive Wortauswahl:** Tasten mit hoher Fehlerquote oder langsamer Reaktion tauchen häufiger in angebotenen Wörtern auf.
- **Freischalten neuer Tasten** nach erreichter Genauigkeit (z. B. ≥ 90 % über die letzten N Anschläge) – nicht nach Zeit.
- **Statistik:** Anschläge pro Minute, Genauigkeit, Fehler pro Taste, Verlauf über Sitzungen.
- **Wiederholen:** Bereits besuchte Orte bleiben erreichbar, um frei zu üben.

## 6. Grafik und Ton

Noch nicht festgelegt. Arbeitsrichtung:

- Weicher, pastelliger Stil, der mit dem Fortschritt **schärfer und farbiger** wird – der Stilwechsel erzählt das Aufwachsen mit.
- Bis zur Entscheidung: einfache Platzhaltergrafiken.
- Quellen: freie Pakete (z. B. Kenney, CC0), selbst erstellte oder KI-generierte Grafiken. Lizenzen müssen zu einer späteren Open-Source-Veröffentlichung passen.
- Ton: leise Umgebungsgeräusche, sanfte Rückmeldung beim Entdecken. Musik ruhig und unaufdringlich.

## 7. Technik

### 7.1 Stack

- **Tauri 2** – Desktop-Hülle (Linux, Windows, macOS), kleine Programmgröße.
- **TypeScript** – Spiellogik.
- **Phaser** – 2D-Rendering, Szenen, Animation, Ton.
- **Vite** – Build und Entwicklungsserver. Das Spiel ist während der Entwicklung auch im Browser lauffähig.

Alle Komponenten sind kostenlos und Open Source (MIT/Apache).

### 7.2 Eingabe

- Getippte Zeichen über `KeyboardEvent.key` (berücksichtigt das Tastaturlayout).
- Hervorhebung auf der Bildschirmtastatur über `KeyboardEvent.code` (physische Taste).
- Tastaturlayout als Datendatei (Taste → Reihe, Finger), zuerst nur QWERTZ-Deutsch. Weitere Layouts wären später möglich.

### 7.3 Inhalte als Daten

- Kapitel, Szenen, Objekte und Wörter liegen in Datendateien, nicht im Code verstreut.
- Ein automatischer Test prüft, dass jedes Wort nur freigeschaltete Tasten verwendet.

### 7.4 Speichern

- Fortschritt und Statistik lokal auf dem Rechner (Spielstand als JSON).
- Zunächst ein Profil.

## 8. Meilensteine

| # | Ziel | Ergebnis |
|---|---|---|
| M0 | Projekt einrichten | Arbeitsmodus (Issues, Board, `AGENTS.md`), Tauri + Phaser + TypeScript starten, leeres Fenster, Tests, CI |
| M1 | Kinderzimmer-Prototyp | Grundreihe, Laute lösen Reaktionen aus, Bildschirmtastatur, Fortschritt gespeichert – mit Platzhaltergrafik |
| M2 | Haus | obere Reihe, „Benennen macht sichtbar“, adaptive Wortauswahl |
| M3 | Garten | untere Reihe, erste Wortpaare, *mama*-Moment |
| M4 | Grafikstil | Stil festlegen, Kinderzimmer bis Garten gestalten |
| M5 | Dorf / Schule | Großschreibung, Umlaute, Satzzeichen, ganze Sätze |
| M6 | Expedition | Ziffern, Logbuch-Texte, größere Welt |
| M7+ | Aufbau, Verteidigung | Ausbau zum Aufbauspiel, optionaler Actionmodus |

Nach jedem Meilenstein: spielen, Rückmeldung, anpassen.

Die einzelnen Aufgaben stehen als [GitHub Issues](https://github.com/TheRealKoller/typingame/issues) unter dem jeweiligen Milestone, der Stand auf dem [Project-Board](https://github.com/users/TheRealKoller/projects/9). Wie gearbeitet wird, beschreibt [`AGENTS.md`](../AGENTS.md).

## 9. Offene Fragen

Offene Fragen werden als Issues mit Label `idee` diskutiert. Entscheidungen fließen hier ins Dokument zurück.

- Spielname – [#13](https://github.com/TheRealKoller/typingame/issues/13)
- Grafikstil (siehe 6) – [#14](https://github.com/TheRealKoller/typingame/issues/14)
- Gibt es eine Hauptfigur mit Namen, oder bleibt das Kind namenlos (der Spieler selbst)? – [#15](https://github.com/TheRealKoller/typingame/issues/15)
- Rahmenerzählung ab Kapitel 5: Warum bricht man zur Expedition auf? – [#16](https://github.com/TheRealKoller/typingame/issues/16)
- Wie greifen Expedition und Aufbauspiel ineinander (welche Rohstoffe, was wird gebaut)? – [#17](https://github.com/TheRealKoller/typingame/issues/17)
- Lizenz bei Veröffentlichung (Vorschlag: MIT für Code, CC BY 4.0 oder CC0 für eigene Grafiken) – [#18](https://github.com/TheRealKoller/typingame/issues/18)
