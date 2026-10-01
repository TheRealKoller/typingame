# Lizenzen der Grafik

## Welt-Kacheln (Draufsicht)

Aus den Paketen **Tiny Town** und **Tiny Farm** von [Kenney](https://kenney.nl), beide
**CC0 1.0** (gemeinfrei). Der Lizenztext liegt bei:
[`world/LICENSE-kenney-tiny-town.txt`](world/LICENSE-kenney-tiny-town.txt).

Die Kacheln der Pakete sind nur durchnummeriert. Welche was zeigt, wurde messend und als
ASCII-Raster bestimmt (Experiment #47) – nützlich, weil die Pakete keine Namen mitbringen:

| Datei | Bedeutung |
|---|---|
| `tile_0000.png`, `tile_0001.png` | Gras, schlicht |
| `tile_0002.png` | Gras mit Blümchen |
| `tile_0043.png` | Gras mit verstreuten Steinchen |
| `tile_0025.png` | Weg / nackte Erde |
| `tile_0040.png` | Erde, schlicht (Beet) |
| `tile_0016.png` | Baum mit Stamm |
| `tile_0028.png` | Nadelbaum |
| `tile_0029.png` | Fliegenpilze |
| `tile_0129.png` | Axt |

Achtung beim Weiterverwenden: `tile_0005` ist ein **Busch**, kein Gras, und `tile_0017`
sowie `tile_0018` sind **Teilstücke** größerer Formen – beide sahen allein im Feld falsch
aus und wurden wieder entfernt. Die Bedeutung lässt sich jederzeit neu bestimmen, indem man
die Kacheln als ASCII-Raster ausgibt (siehe Experiment #47).

## Eigene Sprites in `world/`

Neben den Kacheln liegen in `world/` die **eigenen** Sprites der Draufsicht (Kind, Hund,
Maus, Sonne, Mama, Gartenzwerg, Blume, Biene, Vogel, Ball, Bank, Pony, Fuchs, Milchkanne,
Kirsche, Schnecke). Sie sind an der fehlenden `tile_`-Vorsilbe zu erkennen und werden von
[`../tools/make-sprites.py`](../tools/make-sprites.py) erzeugt (Modul `garden.py`).


## Innenräume (Seitenansicht)

`interior/` enthält **eigene** Sprites, je Raum ein Unterordner: `shared/` (Wand, Boden,
Fenster – von allen Räumen benutzt), `nursery/`, `kitchen/`, `living_room/`, `bathroom/`.

Kein freies Paket hat Innenräume in Seitenansicht – geprüft in #47 bei Kenney (kompletter
Pixel-Katalog), OpenGameArt und itch.io; dort sind Innenräume praktisch immer Draufsicht.

Erzeugt von [`../tools/make-sprites.py`](../tools/make-sprites.py): das Skript ist die
Quelle, die PNGs sind daraus erzeugt und lassen sich jederzeit neu schreiben. Es zeichnet
je Raum ein Modul (`nursery.py`, `kitchen.py`, …), die gemeinsamen Bausteine stehen in
`pixel.py`; jeder Lauf legt einen Kontaktbogen nach `/tmp/sprites-<raum>.png`.

Quelle: eigenes Werk. Die Lizenzwahl für die Veröffentlichung ist noch offen (#18).
