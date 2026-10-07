# Grafik – Quellen und Lizenzen

## `spire/` – Foozle „Spire“ (CC0)

Fantasy-Tower-Defense-Set, gezeichnet von Baldur ([@the__baldur](https://twitter.com/the__baldur)) im Auftrag von [Foozle](https://foozlecc.itch.io/), veröffentlicht unter [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/). Namensnennung nicht erforderlich.

| Ordner | Paket (Version) | Quelle |
|---|---|---|
| `tileset/`, `effects/` | Spire – Tileset 1 (1.0) | https://foozlecc.itch.io/spire-tileset-1 |
| `towers/` (Türme 01–02) | Spire – Tower Pack 1 (1.0) | https://foozlecc.itch.io/spire-tower-pack-1 |
| `towers/` (Türme 03–04) | Spire – Tower Pack 2 (1.0) | https://foozlecc.itch.io/spire-tower-pack-2 |
| `towers/` (Türme 05–06) | Spire – Tower Pack 3 (1.0) | https://foozlecc.itch.io/spire-tower-pack-3 |
| `enemies/` (Clampbeetle, Firewasp, Flying Locust, Voidbutterfly) | Spire – Enemy Pack 1 (1.0) | https://foozlecc.itch.io/spire-enemy-pack-1 |
| `enemies/` (Firebug, Leafbug, Magma Crab, Scorpion) | Spire – Enemy Pack 2 (1.0) | https://foozlecc.itch.io/spire-enemy-pack-2 |
| `builder/` | Spire – Builder Pack (1.0) | https://foozlecc.itch.io/spire-builder-pack |

Übernommen sind nur die PNG-Dateien (Spritesheets und Einzelbilder), ohne Aseprite-Quellen und GIF-Vorschauen. Die Dateinamen sind kleingeschrieben und mit Bindestrichen versehen, z. B. `Tower 01 - Level 01 - Weapon.png` → `towers/tower-01-level-01-weapon.png`, `Towers bases/PNGs/Tower 01.png` → `towers/base-tower-01.png`.

## `lucifer/` – Foozle „Lucifer“ (CC0)

Dungeon-Grafik, gezeichnet von Baldur ([@the__baldur](https://twitter.com/the__baldur)) im Auftrag von [Foozle](https://foozlecc.itch.io/), veröffentlicht unter [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/). Namensnennung nicht erforderlich. Die Kacheln sind 32 × 32 px groß.

| Ordner | Paket (Version) | Quelle |
|---|---|---|
| `lava/` | Lucifer Lava Dungeon Tileset (1.0), Archiv `Foozle_2DT0011_Lucifer_Lava_Tileset_Pixel_Art.zip` | https://foozlecc.itch.io/ |

Übernommen sind das Tileset und die animierten Streifen für Fahnen (auch beschädigt) und die braunen Türen (Öffnen) – ohne Lava, Aseprite-Quellen und Mockups. Umbenennung: `LavaDungeonTileset.png` → `lava/lava-dungeon-tileset.png`, `Flags/Png/HangingFlag.png` → `lava/hanging-flag.png`, `StandingFlag.png` → `lava/standing-flag.png`, `StandingFlagDamaged.png` → `lava/standing-flag-damaged.png`, `Wide door brown Opening.png` → `lava/wide-door-brown-opening.png`, `Narrow door Brown Opening.png` → `lava/narrow-door-brown-opening.png`.

## `traps/` – Foozle „Pixel Trap Pack“ (CC0)

Gezeichnet von Baldur im Auftrag von Foozle, Paket „Pixel Trap Pack“ (1.0), https://foozlecc.itch.io/trap-pack, [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/). Übernommen ist nur die Feuerfalle (Flammen aus dem Boden, 32 × 64 px je Bild) für die brennende Bibliothek: `Fire Trap/PNGs/Fire Trap - Level 1.png` → `fire-trap-level-1.png` (ebenso Level 2 und 3).

## `library/` – eigene Grafik

Die verbrannten Regale (neben der Bibliotheksruine auf der Weltkarte) und die Papiergolems sind für dieses Projekt gezeichnet und werden von `src/tools/library_sprites.py` erzeugt; Farben und Umrisse folgen den Spire- und Lucifer-Paketen, Pixel sind nicht übernommen.

## `maps/` – gemalte Kampfkarten

Für dieses Projekt erzeugt: `src/tools/maps/paint_maps.py` zeichnet aus den Daten jeder Kampfkarte eine Skizze, die das Bildmodell FLUX.2 klein 4B base (Apache 2.0) im Stil „Cartoon + Aquarell“ ausmalt; je Karte drei Bilder (`<karte>-<n>.webp`), dazu `maps.json` mit Datei, Seed, Wegen und Bauplätzen jedes Bildes.
