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
- An Dingen in der Szene erscheinen Wörter. Tippt man ein Wort zum ersten Mal, wird das Ding **entdeckt**: Es wird mit einem sanften Leuchten scharf und farbig, animiert sich, macht ein Geräusch.
- Entdeckt bleibt entdeckt, auch nach einem Neustart (Spielstand, siehe 7.4). Entdeckte Dinge bleiben tippbar und reagieren jedes Mal.
- Das gilt schon im Kinderzimmer: Seine Dinge beginnen blass und unscharf, der erste Laut macht sie sichtbar. Dinge späterer Abschnitte sind noch blasser und tragen kein Wort. Der Baustein dafür ist `src/ui/Discoverable.ts`.
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

### 3.3 Dinge benennen (Kapitel 2)

Im Haus sind die Wörter **Namen von Dingen**. Das Haus hat drei Räume; jeder Raum umfasst eine oder zwei Stufen der oberen Reihe:

| Raum | Abschnitt | Neue Tasten | Wörter |
|---|---|---|---|
| Küche | 2a | `e i` | *eis, keks, kaffee, essig* |
| | 2b | `r u` | *uhr, gurke, reis* |
| Wohnzimmer | 2c | `t z` | *katze, stuhl, tee, tasse* |
| | 2d | `o p` | *sofa, puppe, foto, radio, papagei* |
| Bad | 2e | `w q` | *wasser, waage, seife, spiegel, qualle* |

Sichtbar sind die Wörter des **aktuellen Raums** bis zum aktuellen Abschnitt; die Wörter eines verlassenen Raums bleiben dort. Die Abschnitte eines Raums folgen deshalb direkt aufeinander. Die Daten stehen in `src/content/chapter2.ts`.

Ins Haus gelangt man aus dem Kinderzimmer: Ist in 1b die Genauigkeit erreicht (siehe 5), blendet das Kinderzimmer in die Küche über, und der Hinweis nennt die neuen Tasten `e i`. Jeder Raum füllt den Bildschirm. Wird die erste Stufe des nächsten Raums freigeschaltet, blendet das Spiel ruhig in diesen Raum über. Innerhalb eines Raums erwachen die Dinge der neuen Stufe an ihrem Platz. Freigeschaltete Tasten bleiben über Raum- und Kapitelgrenzen erhalten. Nach einem Neustart geht es im gespeicherten Abschnitt und damit im richtigen Raum weiter. Nach dem Bad geht es in den Garten (siehe 3.4).

### 3.4 Dinge benennen (Kapitel 3)

Im Garten sind die Wörter ebenfalls **Namen von Dingen**. Der Garten hat drei Bereiche; jeder Bereich umfasst eine Stufe der unteren Reihe:

| Bereich | Abschnitt | Neue Tasten | Wörter |
|---|---|---|---|
| Wiese | 3a | `n m` | *mama, sonne, hund, maus, gartenzwerg* |
| Beet | 3b | `b v` | *baum, blume, biene, vogel, ball, bank* |
| Hof | 3c | `c x y` | *axt, pony, fuchs, milchkanne, kirsche, schnecke* |

Die drei Bereiche sind Räume im selben Sinn wie die des Hauses; aus dem Bad (2e) führt der Übergang in die Wiese, und der Hinweis nennt `n m`. Die Daten stehen in `src/content/chapter3.ts`.

Eine Ausnahme unter den Wörtern ist *mama*: Ihr erstes Tippen ist der besondere Moment aus Abschnitt 4 und wird eigens inszeniert. Warmes Licht legt sich über die Szene, die Mama-Figur tritt hervor, während die übrigen Dinge und Wörter zurücktreten, und ihr Wort schwebt warm über dem Bild; das Tippen läuft dabei ruhig weiter. Jedes weitere *mama* reagiert wie ein gewöhnliches Ding. Dass der Moment stattgefunden hat, steht im Spielstand (`discovered`), also wird er nach einem Neustart nicht wiederholt.

Der Hof hat einen zweiten Abschnitt (3d). Dort wird die **Leertaste** freigeschaltet, und aus den Tieren der Wiese werden die ersten **Wortpaare**: *hund weg* und *maus weg*. Ein Paar löst eine eigene Reaktion aus – der Hund läuft davon, die Maus huscht davon. Damit die Präfix-Regel hält, beginnt kein Paar mit einem Wort, das der Hof selbst zeigt; die Anfänge gehören zur Wiese. Die Daten stehen in `src/content/chapter3.ts`, die Dinge in `src/things/yard.ts`.

### 3.5 Fehlerverhalten

- Ein falscher Buchstabe wird sanft markiert (kein lauter Fehlerton, kein Punktabzug im Hauptspiel).
- Das Wort wird erst weitergeführt, wenn der richtige Buchstabe getippt ist. Ein falscher Buchstabe wechselt nicht zu einem anderen Wort.
- Fehler fließen in die Statistik und in die Auswahl der Übungswörter ein.

## 4. Progression

Die Tasten-Reihenfolge folgt klassischen Zehnfinger-Kursen. **Groß-/Kleinschreibung kommt erst in Kapitel 4** – vorher wird alles kleingeschrieben.

| Kapitel | Ort | Neue Tasten | Beispiele |
|---|---|---|---|
| 1 | Kinderzimmer | Grundreihe: `a s d f j k l`, dann `g h` | *lala, dada, jaja, haha, gaga, aha* |
| 2 | Haus | Obere Reihe: `e i`, `r u`, `t z`, `o p`, `w q` | *eis, keks, uhr, gurke, katze, tee, tasse, sofa, puppe, wasser, seife, qualle* – Räume siehe 3.3 |
| 3 | Garten | Untere Reihe: `n m`, `b v`, `c x y`, dann die Leertaste | *mama, sonne, hund, maus, gartenzwerg, baum, blume, biene, vogel, ball, bank, axt, pony, fuchs, milchkanne, kirsche, schnecke* – Bereiche siehe 3.4; erste Paare: *hund weg, maus weg* |
| 4 | Dorf / Schule | Umschalttaste (Großschreibung), `ä ö ü ß`, Satzzeichen `. , ? !` | *Der Hund bellt. Die Sonne scheint. Wo ist der Bäcker?* |
| 5 | Umgebung / Expedition | Ziffern, Sonderzeichen | Logbuch: *Tag 3: Am Fluss wachsen 12 Birken.* |
| später | Aufbau | alle | Rohstoffe sammeln, Dorf ausbauen |
| später | Verteidigung | alle, Tempo | Actionmodus: Angriffe auf das Dorf abwehren |

**Regel:** Jedes Wort in einem Abschnitt darf nur Tasten enthalten, die bis dahin freigeschaltet sind. Das wird im Code automatisch geprüft (siehe 7.3).

**Emotionaler Meilenstein:** Das erste *mama* ist erst möglich, sobald `m` freigeschaltet ist (Kapitel 3). Das soll als besonderer Moment inszeniert werden.

## 5. Lernsystem

- **Bildschirmtastatur** mit Farben pro Finger (gleicher Finger beider Hände, gleiche Farbe; die Seite zeigt die Hand). Die nächste(n) Taste(n) und die passenden Finger pulsieren, darunter zwei Hände und der Name des Fingers (z. B. „D: linker Mittelfinger“). Gesperrte Tasten sind grau, eine gedrückte Taste leuchtet kurz auf – hell bei richtig, rosa bei falsch. Die Leertaste steht als breite Taste in einer eigenen Zeile unter den Buchstaben und gehört dem Daumen („Leertaste: Daumen“); bis zu ihrem Abschnitt ist sie gesperrt.
- **Adaptive Wortauswahl:** Tasten mit hoher Fehlerquote tauchen häufiger in angebotenen Wörtern auf.
  - Höchstens 4 Wörter sind gleichzeitig sichtbar. Hat ein Raum mehr, warten die übrigen Dinge ohne Beschriftung.
  - Nach jedem getippten Wort rückt ein anderes Wort des Raums nach, sofern es eins gibt. Mitten im Wort wechselt nichts, und Präfix-Paare sind nie gleichzeitig sichtbar.
  - Noch unentdeckte Dinge rücken zuerst nach, damit jedes Ding einmal benannt wird.
  - Danach entscheidet der Zufall, gewichtet: Jedes Wort hat Gewicht 1, dazu kommt für jede seiner Tasten 10 × Fehler / (Anschläge + 5), mit den Werten über alle Sitzungen. Die 5 gedachten richtigen Anschläge verhindern, dass ein einzelner früher Fehler die Auswahl beherrscht. Ohne Fehler ist die Auswahl gleich verteilt.
  - Werte in `src/progress/practice.ts`. Die Reaktionszeit fließt noch nicht ein.
- **Freischalten neuer Tasten** nach erreichter Genauigkeit: mindestens 90 % richtige Anschläge unter den letzten 30 – nicht nach Zeit. Jeder Tastendruck zählt, auch einer auf eine gesperrte Taste. Ein angefangenes Wort wird noch zu Ende getippt, dann blendet der Raum über in den nächsten Abschnitt: Die neuen Dinge erwachen, ein ruhiger Hinweis nennt die neuen Tasten und ihre Finger (z. B. „G – linker Zeigefinger“). Werte in `src/progress/unlock.ts`.
- **Statistik:** Anschläge pro Minute, Genauigkeit, Fehler pro Taste, Verlauf über Sitzungen.
  - *Anschläge pro Minute* = richtige Anschläge je Minute Tippzeit; Lücken über 5 s zählen als Pause und nicht zur Tippzeit.
  - *Genauigkeit* = Anteil richtiger an allen Anschlägen.
  - *Fehler pro Taste* werden der Taste zugerechnet, die man hätte treffen sollen. War nicht eindeutig, welche gemeint war (mehrere Wörter möglich), zählt der Fehler nur in der Genauigkeit.
  - Anzeige: dezente Zeile oben rechts; gedrückte Tab-Taste zeigt eine Übersicht und färbt die Bildschirmtastatur nach Fehlerquote (grün → rosa).
- **Wiederholen:** Bereits besuchte Orte bleiben erreichbar, um frei zu üben.

## 6. Grafik und Ton

**Stil (entschieden, 01.10.26):** Pixelgrafik mit 16 × 16 px großen Kacheln. Quellen sind freie **CC0-Pakete** (Kenney: *Tiny Town*, *Tiny Farm*, *Roguelike/RPG*) statt selbst erzeugter Massenware. Objekte, die kein Paket mitbringt (Hund, Gartenzwerg, Teddy, Milchkanne …), entstehen als **eigene Pixelsprites im selben Ton**. Erprobt im Experiment #47.

**Perspektive (entschieden):** Das **Hauptspiel spielt in Draufsicht**. **Innenräume und Sonderszenen** – Kinderzimmer, Haus, später Bibliothek, Alchemistenküche, Tempelruine – bleiben in **Seitenansicht**. Der Wechsel ist ein wiederkehrendes Gestaltungsmittel und markiert „die Welt öffnet sich“, wenn das Kind Haus und Garten verlässt.

**Aufwachsen:** Der Stil wird mit dem Fortschritt schärfer und farbiger – pro entdecktem Ding (umgesetzt) und über die Palette je Kapitel (noch offen).

**Bedienoberfläche:** Bildschirmtastatur, Wortlabels und Statistik bleiben **scharf** und nicht pixelig, müssen aber zum Look passen: dunkle Schrift mit heller Kontur, Tasten deckend mit Kontur, damit sie über der Szene lesbar sind. Später lässt sich die Tastatur ausblenden (siehe #48).

**Ton:** Noch nicht festgelegt. Arbeitsrichtung: leise Umgebungsgeräusche, sanfte Rückmeldung beim Entdecken, ruhige Musik.

**Lizenzen:** Alle Assets müssen zu einer späteren Open-Source-Veröffentlichung passen – CC0 bevorzugt, CC BY mit Nennung möglich.

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
- Inhalt: aktueller Abschnitt, entdeckte Laute/Wörter, Treffer und Fehler je Taste über alle Sitzungen, eine Zusammenfassung je Sitzung (Beginn, richtige/falsche Anschläge, Tippzeit).
- Ablage: Desktop-App in `spielstand.json` im App-Datenordner (Linux: `~/.local/share/de.therealkoller.typingame/`), Browser im `localStorage` unter `typingame.spielstand`.
- Gespeichert wird nach jedem fertigen Wort, beim Abschnittswechsel und wenn das Fenster verborgen oder geschlossen wird. Ein unlesbarer Spielstand wird ignoriert, das Spiel beginnt dann von vorn.
- Neu beginnen: vorerst Datei löschen bzw. `localStorage` leeren; ein Menü dafür kommt später.

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
