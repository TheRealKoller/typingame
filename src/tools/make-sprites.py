"""Zeichnet die Pixelsprites fuer die Innenraeume (Seitenansicht).

Die Kacheln der Welt kommen aus freien CC0-Paketen (siehe src/assets/LICENSES.md),
aber kein Paket hat Innenraeume in Seitenansicht – diese Objekte entstehen hier.

Aufruf:   python3 src/tools/make-sprites.py
Ausgabe:  PNGs je Gruppe unter src/assets/interior/<gruppe>/ und je ein
          Kontaktbogen zum Ansehen unter /tmp/sprites-<gruppe>.png.
"""

import importlib
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pixel import contact_sheet  # noqa: E402
import pixel  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "assets"
# Modul, Ordner unter src/assets, Bild-Pixel je Entwurfs-Pixel
# Die Innenraeume zeichnen doppelt so gross und laufen im Spiel mit halbem Zoom:
# dieselbe Groesse auf dem Bildschirm, aber dieselbe Pixeldichte wie die Welt.
GROUPS = [
    ("shared_sprites", "interior/shared", 2),
    ("nursery", "interior/nursery", 2),
    ("kitchen", "interior/kitchen", 2),
    ("living_room", "interior/living_room", 2),
    ("bathroom", "interior/bathroom", 2),
    # Draufsicht: eigene Sprites liegen neben den Kacheln der CC0-Pakete.
    ("garden", "world", 1),
    # Experiment #65: Innenraeume in Draufsicht (eigene Kacheln und Dinge).
    ("room_sprites", "rooms", 1),
]

if __name__ == "__main__":
    for module_name, folder_name, scale in GROUPS:
        pixel.set_scale(scale)
        module = importlib.import_module(module_name)
        folder = OUT / folder_name
        folder.mkdir(parents=True, exist_ok=True)
        made = [(fn.__name__, fn()) for fn in module.SPRITES]
        if not made:
            print(f"{module_name}: noch keine Sprites")
            continue
        for name, im in made:
            im.save(folder / f"{name}.png")
        size = contact_sheet(made, f"/tmp/sprites-{folder_name.replace('/', '-')}.png")
        print(f"{module_name}: {len(made)} Sprites -> {folder_name}/, Kontaktbogen {size}")
