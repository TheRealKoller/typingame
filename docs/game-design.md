# Game Design – typingame (Arbeitstitel)

> Lebendes Dokument. Hält fest, was wir entschieden haben, und was noch offen ist.
> Änderungen am Konzept kommen hierher, bevor sie in den Code gehen.
>
> Neu ausgerichtet am 04.10.26 ([#66](https://github.com/TheRealKoller/typingame/issues/66)): aus dem ruhigen Entdeckungsspiel wird ein Tower-Defense-Spiel. Der alte Stand liegt unter dem Tag `rpg-prototyp`.

## 1. Vision

Ein Desktop-Spiel, mit dem man das **Zehnfingersystem** lernt – als **Tower Defense**.

In dieser Welt sind **Worte Macht**. Man spielt einen Lehrling, der in einer Bibliothek die Zeichen lernt, Reihe für Reihe. Getippte Worte errichten Türme, rüsten sie auf und lösen Zauber aus. Als das *Verstummen* die Bibliothek niederbrennt und die Meisterin verschleppt, zieht der Lehrling los – über eine Weltkarte, deren Gebiete immer schwerer werden, bis zur Festung des Verstummens.

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

Anfangs wirkt das Verstummen wie eine gesichtslose Macht. Im Lauf der Geschichte kristallisiert sich heraus, dass ein **eifersüchtiger Rivale der Meisterin** dahintersteckt: ein Künstler, der ebenfalls mit Tinte arbeitet und daraus die Monster erschafft.

Thema: **Fantasy**.

### 3.2 Ton und Hauptfigur

- **Ton:** episch und humorvoll zugleich.
- **Hauptfigur:** der Lehrling. Er ist etwas zynisch und hat einen trockenen Humor; die Zwischensequenzen leben von seinen Kommentaren.
- Der Spieler **wählt den Namen** des Lehrlings zu Beginn. Die Eingabe ist freies Tippen, keine Übung, und zählt nicht zur Statistik.
- Der Lehrling hat **kein Gesicht**: Man sieht ihn nie, er ist der Spieler. Er tritt nur in Texten auf.
- **Die Meisterin: Kalliope** (griech. „die Schönstimmige“, Muse der epischen Dichtung). Bibliothekarin und Lehrerin des Lehrlings.
- **Der Rivale: Atramentus** (von lat. *atramentum*, „Tinte“). Künstler, neidisch auf Kalliope, erschafft die Monster aus Tinte.
  - **Motiv – Bild gegen Wort:** Kalliope schreibt, er malt; sein Leitspruch ist „Ein Bild sagt mehr als tausend Worte“. Er neidet ihr, dass die Welt Worte verehrt und seine Bilder übersieht.
  - Seine Monster sind Bilder ohne Namen – deshalb vergehen sie, wenn man schreibt.

### 3.3 Handlung

1. **Bibliothek (Tutorial):** Der Lehrling lernt bei der Meisterin die Zeichen, Reihe für Reihe, bis er alle Buchstaben beherrscht (siehe 5). Geübt wird in **Übungskämpfen**, z. B. gegen Papiergolems der Meisterin – so lernt man Tippen und Bauen zugleich.
2. **Der Überfall:** Kaum sind die Buchstaben gelernt, greift das Verstummen die Bibliothek an. Dieser Kampf ist **nicht zu gewinnen**: Die Bibliothek brennt ab, die Meisterin wird verschleppt. Zuvor spricht sie noch einen **Bann**, der die Gegner schwächt: Sie können nur noch zeitweise vorrücken (siehe 4.1).
3. **Die Reise:** Der Lehrling **drängt das Verstummen** über die **Weltkarte** zurück ins Feindesland. Je weiter er kommt, desto schwerer wird es. An bestimmten Ereignissen findet er **Bücher** (oder Ähnliches), aus denen er neue Fähigkeiten lernt: Großschreibung, Umlaute, Satzzeichen, Ziffern, Sonderzeichen. Unterwegs zeigt sich nach und nach, wer hinter dem Verstummen steckt.
4. **Finale:** Der Lehrling besiegt den Rivalen und befreit die Meisterin. Das Spiel hat ein **Ende**.

Wie sich Atramentus zeigt (vorläufig, ein Schritt je Gebiet):

| Gebiet | Hinweis |
|---|---|
| Aschefelder | Pinselstriche an den Monstern |
| Flüsterwald | eine Signatur auf einem Monster |
| Nebelmoor | alte Briefe über einen Wettstreit mit Kalliope, den sie gewann |
| Salzöde | ein Skizzenbuch mit Entwürfen kommender Bosse |
| Gläserne Berge | er zeigt sich selbst |
| Finale | gegen sein Meisterwerk schreibt man ein Gedicht |

### 3.4 Zwischensequenzen

- Die Geschichte wird in **Zwischensequenzen** erzählt.
- Zunächst sind es **einfache Texte**.
- Später werden sie mit **Video oder Stop-Motion** unterlegt.

## 4. Kernmechanik

### 4.1 Ein Level

- Eine Karte mit einem Weg, **Bauplätzen** am Rand und am Ende des Wegs der **Bannkreis** – der Rest des Banns der Meisterin, der das Land dahinter schützt.
- Ein Level läuft im Wechsel von **Ebbe und Flut des Banns**:
  - **Flut** – der Bann ist stark: Die Gegner müssen sich zurückziehen. Man baut und rüstet in Ruhe auf, ohne Zeitdruck. Die Flut endet **auf Wunsch des Spielers** mit **Enter**; ein hervorgehobener Hinweis am Bannkreis zeigt das. Enter zählt nicht als Anschlag. Endloses Bauen verhindert die knappe Tinte.
  - **Ebbe** – der Bann ist schwach: Die Gegner rücken in **Wellen** vor.
- Das Tempo der Gegner ist vorläufig **konstant**, unabhängig von den Anschlägen pro Minute.
- Erreicht ein Gegner den Bannkreis, wird er schwächer. Bricht er, ist das Level verloren.
- Wer alle Ebben übersteht, hat das Verstummen zurückgedrängt und gewinnt das Level. Auf der Weltkarte ist das Gebiet damit befreit.

### 4.2 Bauen und Aufrüsten

- Jeder **Bauplatz** trägt ein Wort. Tippt man es, ist der Bauplatz gewählt.
- Danach baut ein **Schlüsselwort** dort einen bestimmten Turm, z. B. *feuer* einen Feuerturm.
- Türme bisher (Grafik aus den Spire-Paketen):

| Turm | Schlüsselwort | Kosten | Wirkung |
|---|---|---|---|
| Armbrust | *jagd* (vor `g`: *lass*) | 50 | schnelle Einzelschüsse |
| Tintenschleuder | *klecks* | 70 | langsam, der Klecks trifft jeden Gegner nahe am Ziel |
| Frostkristall | *frost* | 60 | schwache Treffer, die Gegner 1,5 s auf halbe Geschwindigkeit bremsen |

- **Aufrüsten:** Ein Turm behält das Wort seines Bauplatzes, solange er sich aufrüsten lässt. Tippt man es, ist der Turm gewählt; sein Aufrüstwort bringt ihn auf die nächste Stufe (Stufen I–III, Grafik der Spire-Stufen). Auf der letzten Stufe verschwindet das Wort. Im Tutorial wird nicht aufgerüstet: Die Aufrüstwörter brauchen Tasten, die erst später kommen.

| Turm | Stufe II | Stufe III |
|---|---|---|
| Armbrust | *bolzen* Doppelarmbrust, 60: Schaden 16, Reichweite 180 | *salve* Salvenarmbrust, 90: Schaden 24, Reichweite 190, schneller |
| Tintenschleuder | *spritzer* Tintenwerfer, 70: Schaden 14, Klecks 80 px | *sintflut* Tintenflut, 100: Schaden 20, Klecks 90 px, schneller |
| Frostkristall | *raureif* Raureifkristall, 60: 40 % Tempo für 2 s | *gletscher* Gletscherkristall, 90: 30 % Tempo für 2,5 s, Reichweite 160 |

- Ein gewählter Bauplatz zeigt die Schlüsselwörter nebeneinander, die Notiz links nennt Turm und Kosten. Im Tutorial gibt es nur die Armbrust; auf der Reise schalten Bücherkarren weitere frei (siehe 4.8).
- **Aufrüsten** funktioniert ähnlich: den Turm über sein Wort wählen, dann ein Aufrüstwort tippen.
- Türme und Aufrüstungen kosten **Tinte**. Die Monster sind aus Tinte gemacht; besiegt zerfließen sie und hinterlassen sie.

### 4.3 Kampf

- Türme greifen von selbst an.
- **Spezialgegner** tragen Wörter. Tippt man das Wort, greift man sie direkt an.
  - **Feuerwespen** (ab dem zweiten Ort): schnell und schwach, kommen in Schwärmen in jeder zweiten Welle und schlüpfen an langsamen Türmen vorbei.
  - **Panzerkäfer** (ab dem dritten Ort, letzte Welle): ein Panzer aus gehärteter Tinte hält 80 % jedes Turmtreffers ab. Sie leuchten immer und tragen lange Wörter (ab 7 Zeichen); jedes getippte Wort zieht ihnen 70 Leben ab und gibt ihnen ein neues Wort, bis sie fallen. Bauen allein reicht gegen sie nicht. Im Tutorial leuchtet jeder dritte kleine Papiergolem golden und trägt ein Wort; getippt fällt er sofort und hinterlässt Tinte.
- Türme können **Spezialangriffe** haben, die man mit Wörtern auslöst.
- **Bosse** verlangen einen ganzen Text, z. B. ein Gedicht oder eine Rede.

### 4.4 Ziel wählen beim Tippen

- Man wählt selbst, welches Wort man tippt. Alle sichtbaren Wörter, die mit dem bisher Getippten beginnen, bleiben im Spiel; mit jedem Zeichen wird eingegrenzt, bis nur noch eins übrig ist.
- Ein Wort ist fertig, sobald das Getippte ihm genau entspricht. Ist ein sichtbares Wort der Anfang eines anderen, gewinnt deshalb das kürzere – solche Paare dürfen nicht gleichzeitig sichtbar sein.
- Mit **Esc** bricht man ein angefangenes Wort ab und kann ein anderes Ziel wählen.

### 4.5 Wörter

- **Zunächst:** eine Wortliste (`src/content/words.ts`). Gewählt werden passende Wörter, die nur freigeschaltete Tasten enthalten. Im Tutorial zeigt jede Stufe nur Wörter mit ihren neuen Tasten, solange es davon mindestens acht gibt. Schlüsselwörter, die noch nicht tippbar sind, werden ersetzt (Armbrust: *jagd*, vor `g` *lass*).
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

### 4.8 Belohnungen

- Zwischendurch oder nach einem Bosskampf gewinnt man Belohnungen, z. B. einen **Bücherkarren** oder eine **verlorene Schriftrolle**.
- Eine **Schriftrolle** schaltet einen neuen Spezialangriff frei, ein **Bücherkarren** einen neuen Turmtyp.
- In den Aschefeldern: **Bibliotheksruine** – Bücherkarren mit der Tintenschleuder; **Rauchsenke** – Schriftrolle *Tintenregen*; **Kellergewölbe** – Bücherkarren mit dem Frostkristall. Die Reise beginnt mit der Armbrust allein.
- Die Belohnung gibt es beim ersten Befreien eines Orts; sie steht unter dem Satz des Lehrlings und gilt für alle späteren Kämpfe. Gespeichert wird sie über die befreiten Orte.
- **Zauber:** Das Wort eines Zaubers lässt sich bei Ebbe tippen, sobald er bereit ist; es steht dann über dem Bannkreis, die Notiz links zeigt, wann er wieder bereit ist. *Tintenregen* trifft jeden Gegner auf dem Weg mit 30 Schaden, auch durch Panzer, und braucht danach 25 s Ebbe, bis er wieder bereit ist.

### 4.9 Weltkarte

- Nach dem Überfall zeigt die Weltkarte die Gebiete; zunächst sind nur die **Aschefelder** betretbar, die übrigen stehen blass und verborgen da.
- Jeder Ort trägt ein Wort; tippt man es, ist er gewählt, **Enter** startet den Kampf, Esc wählt ab. Das Wählen ist keine Übung und zählt nicht zur Statistik.
- Am Anfang ist nur die **Bibliotheksruine** offen. Ein Sieg befreit den Ort und öffnet die verbundenen Orte; befreite Orte lassen sich erneut spielen.
- Nach dem Kampf kommentiert der Lehrling das Ergebnis; Enter führt zurück zur Karte.
- Die Weltkarte selbst ist fest. **Besondere Orte** haben eine feste Kampfkarte (in den Aschefeldern die Bibliotheksruine mit verkohltem Boden und verbrannten Regalen und das Kellergewölbe). **Gewöhnliche Orte** bekommen bei jedem Besuch eine neu erzeugte Karte: ein Weg in geraden Stücken vom linken Rand zum Bannkreis, fünf Bauplätze in Reichweite des Wegs, Bäume und Steine auf freien Flächen; in den Aschefeldern liegt grauer Ruß über dem Gras.
- Die Wellen werden für jeden Kampf neu erzeugt, nach dem **Schwierigkeitsgrad** des Orts (Ruine 1, Rauchsenke 2, Kellergewölbe 3, Glutfeld 4): mehr Wellen, mehr und zähere Gegner, ab dem zweiten Ort auch große. Erst ab dem dritten Ort leuchtet jeder dritte kleine Gegner und trägt ein Wort; an den ersten Orten geht es ums Bauen. Auf der Reise hinterlassen Gegner weniger Tinte als in der Bibliothek (60 %), und man beginnt mit Tinte für zwei Türme. Ein Test spielt jeden Ort mit 40 verschiedenen Karten durch: Wer stetig baut und die leuchtenden Gegner trifft, gewinnt fast immer; am letzten Ort reichen Türme allein meist nicht.
- Beim ersten Betreten erzählt eine Zwischensequenz von den Aschefeldern; der Lehrling bemerkt Pinselstriche auf den Panzern der Ungeheuer.

## 5. Progression

Bis alle Buchstaben beherrscht sind, ist das Spiel ein **Tutorial** in der Bibliothek. Erst danach beginnt das Hauptspiel auf der Weltkarte. **Groß-/Kleinschreibung kommt erst auf der Reise** – vorher wird alles kleingeschrieben.

| Abschnitt | Ort | Neu |
|---|---|---|
| Tutorial 1 | Bibliothek | Grundreihe: `a s d f j k l`, dann `g h` |
| Tutorial 2 | Bibliothek | Obere Reihe: `e i`, `r u`, `t z`, `o p`, `w q` |
| Tutorial 3 | Bibliothek | Untere Reihe: `n m`, `b v`, `c x y`, dann die Leertaste |
| Überfall | Bibliothek | – (nicht zu gewinnen) |
| Aschefelder | rund um die Bibliothek | Buch: Umlaute `ä ö ü ß` |
| Flüsterwald | Weltkarte | Buch: Großschreibung (Umschalttaste) |
| Nebelmoor | Weltkarte | Buch: Satzzeichen `. , ? !` |
| Salzöde | Weltkarte | Buch: Ziffern |
| Gläserne Berge | Weltkarte | Buch: Sonderzeichen |
| Finale | Festung des Verstummens | alle Zeichen, Bosskampf |

- Die Reihenfolge innerhalb einer Reihe folgt klassischen Zehnfinger-Kursen.
- Gebiete, Namen und Zuordnung der Bücher sind vorläufig.

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
- **Stil (entschieden, 04.10.26):** Pixelgrafik aus dem Fantasy-Tower-Defense-Set **Foozle „Spire“** (CC0): Gras-Tileset mit Wegen, Wasser, Steinen und Bäumen; sechs Türme mit je drei Ausbaustufen samt Waffen-, Geschoss- und Trefferanimation; acht animierte Gegner (vier fliegend, vier am Boden); Bau- und Einsturzanimation. Liegt unter `src/assets/spire/`, Quellen in `src/assets/LICENSES.md`. Was das Set nicht hat – Bannkreis, Tinte –, entsteht passend dazu.
- **Bibliothek (entschieden, 04.10.26):** Boden, Wände, Banner und Fackeln aus Foozle **„Lucifer“** (CC0, gleicher Zeichner wie Spire), Bodenflammen für den Überfall aus dem Foozle **„Pixel Trap Pack“** (CC0). Regale, Pulte, Bücher und die **Papiergolems** sind selbst gezeichnet (`src/tools/library_sprites.py`). Die Übungskämpfe wechseln zwischen drei Karten: Lesesaal und Archiv (Steinboden, roter Teppich als Weg) und Innenhof (Gras und Sandweg aus dem Spire-Tileset).
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
| M2 | Kampf-Prototyp | ein Level: Weg, Flut und Ebbe, Wellen, Bauplätze mit Wörtern, Tinte, ein Turm, Bannkreis, Sieg und Niederlage – nur Grundreihe, Platzhaltergrafik |
| M3 | Tutorial | Bibliothek mit allen drei Reihen, Übungskämpfe, Namenswahl, Text-Zwischensequenzen, Überfall |
| M4 | Weltkarte | Gebiete, Zurückdrängen und Freischalten durch Sieg, Wiederholen, mehrere Türme und Aufrüsten, Spezialgegner, Belohnungen |
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
- Gebiete der Weltkarte überarbeiten (siehe 5).
- Namen für Welt und Bibliothek.
