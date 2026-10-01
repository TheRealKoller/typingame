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
| `tile_0004.png` | Busch **auf einem Sandhügel** – als Baum unbrauchbar |
| `tile_0012.png` | Sandhügel mit Blümchen (zu laut für Flächen) |
| `tile_0025.png` | Weg / Erde |
| `tile_0077.png` | Wasser bzw. Stein |
| `tile_sprout.png` | Setzling (aus *Tiny Farm*) |

Weitere Kacheln kommen mit #53 (Garten in Draufsicht).

## Innenräume (Seitenansicht)

`interior/` enthält **eigene** Sprites. Kein freies Paket hat Innenräume in Seitenansicht –
geprüft in #47 bei Kenney (kompletter Pixel-Katalog), OpenGameArt und itch.io; dort sind
Innenräume praktisch immer Draufsicht.

Erzeugt von [`../tools/make-sprites.py`](../tools/make-sprites.py): das Skript ist die
Quelle, die PNGs sind daraus erzeugt und lassen sich jederzeit neu schreiben.

Quelle: eigenes Werk. Die Lizenzwahl für die Veröffentlichung ist noch offen (#18).
