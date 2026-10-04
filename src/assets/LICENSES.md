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

Dungeon-Kacheln, gezeichnet von Baldur ([@the__baldur](https://twitter.com/the__baldur)) im Auftrag von [Foozle](https://foozlecc.itch.io/), veröffentlicht unter [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/). Namensnennung nicht erforderlich. Die Kacheln sind 32 × 32 px groß und werden im Spiel ×2 gezeigt.

| Ordner | Paket (Version) | Quelle |
|---|---|---|
| `dungeon/` | Lucifer Dungeon Tileset (1.0), Archiv `Foozle_2DT0003_Lucifer_Dungeon_Tileset_Pixel_Art.zip` | https://foozlecc.itch.io/ |
| `lava/` | Lucifer Lava Dungeon Tileset (1.0), Archiv `Foozle_2DT0011_Lucifer_Lava_Tileset_Pixel_Art.zip` | https://foozlecc.itch.io/ |

Übernommen sind das jeweilige Tileset und aus dem Lava-Paket die animierten Streifen für Fackel, Fahnen (auch beschädigt) und die braunen Türen (Öffnen) – ohne Lava, Aseprite-Quellen und Mockups. Umbenennung: `Png/DungeonTileset.png` → `dungeon/dungeon-tileset.png`, `LavaDungeonTileset.png` → `lava/lava-dungeon-tileset.png`, `Deco/Png/Torch.png` → `lava/torch.png`, `Flags/Png/HangingFlag.png` → `lava/hanging-flag.png`, `StandingFlag.png` → `lava/standing-flag.png`, `StandingFlagDamaged.png` → `lava/standing-flag-damaged.png`, `Wide door brown Opening.png` → `lava/wide-door-brown-opening.png`, `Narrow door Brown Opening.png` → `lava/narrow-door-brown-opening.png`.

## `traps/` – Foozle „Pixel Trap Pack“ (CC0)

Gezeichnet von Baldur im Auftrag von Foozle, Paket „Pixel Trap Pack“ (1.0), https://foozlecc.itch.io/trap-pack, [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/). Übernommen ist nur die Feuerfalle (Flammen aus dem Boden, 32 × 64 px je Bild) für die brennende Bibliothek: `Fire Trap/PNGs/Fire Trap - Level 1.png` → `fire-trap-level-1.png` (ebenso Level 2 und 3).

## `library/` – eigene Grafik

Bibliotheks-Requisiten (Regale, auch verbrannt, Lesepult, Lesetisch, Bücherstapel, Schriftrolle) und die Papiergolems sind für dieses Projekt gezeichnet und werden von `src/tools/library_sprites.py` erzeugt; Farben und Umrisse folgen den Spire- und Lucifer-Paketen, Pixel sind nicht übernommen.
