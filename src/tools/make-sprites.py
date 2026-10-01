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

OUT = Path(__file__).resolve().parent.parent / "assets" / "interior"
# Modul -> Ordner unter src/assets/interior
GROUPS = [
    ("shared_sprites", "shared"),
    ("nursery", "nursery"),
    ("kitchen", "kitchen"),
    ("living_room", "living_room"),
    ("bathroom", "bathroom"),
]

if __name__ == "__main__":
    for module_name, folder_name in GROUPS:
        module = importlib.import_module(module_name)
        folder = OUT / folder_name
        folder.mkdir(parents=True, exist_ok=True)
        made = [(fn.__name__, fn()) for fn in module.SPRITES]
        if not made:
            print(f"{module_name}: noch keine Sprites")
            continue
        for name, im in made:
            im.save(folder / f"{name}.png")
        size = contact_sheet(made, f"/tmp/sprites-{folder_name}.png")
        print(f"{module_name}: {len(made)} Sprites -> {folder_name}/, Kontaktbogen {size}")
