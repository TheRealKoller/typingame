"""Cut out the towers wrapped by a viper so they line up with their plain bases (#145, »der viper«).

Usage: ~/.cache/typingame-art-venv/bin/python experiments/145-tower-blocks/ausrichten.py
klein paints the wrapped tower over the plain one in the same frame, so a pixel of the plain painting is the same
pixel in the wrapped one. The wrapped cut-out is cropped to the union of both outlines (the snake's head may rise
above the tower) and teile/ausrichtung.json says where the plain cut-out lies in it: turm.ts finds the anchors on the
plain base, whose outline the snake does not change, and moves them into the wrapped picture.
"""

import json
import pathlib

from PIL import Image
from rembg import new_session, remove

HERE = pathlib.Path(__file__).parent
PICS, PARTS = HERE / "bilder", HERE / "teile"
MAX = 512  # as prepare.py: the longer side of a cut-out
PAIRS = {
    "jagd-1-viper-11": "jagd-1-11",
    "jagd-2-viper-22": "jagd-2-sockel-11",
    "jagd-3-viper-11": "jagd-3-sockel-22",
    "eisnadel-1-viper-11": "eisnadel-1-11",
    "eisnadel-2-viper-22": "eisnadel-2-sockel-11",
    "eisnadel-3-viper-22": "eisnadel-3-sockel-11",
    "viper-1-viper-11": "viper-1-22",
    "viper-2-viper-22": "viper-2-sockel-22",
    "viper-3-viper-11": "viper-3-sockel-11",
}


def main() -> None:
    session = new_session("birefnet-general")
    report = {}
    for wrapped_name, plain_name in PAIRS.items():
        plain = remove(Image.open(PICS / f"{plain_name}.png").convert("RGB"), session=session)
        wrapped = remove(Image.open(PICS / f"{wrapped_name}.png").convert("RGB"), session=session)
        if plain.size != wrapped.size:
            raise SystemExit(f"{wrapped_name}: {wrapped.size} is not the frame of {plain_name} {plain.size}")
        pb, wb = plain.getbbox(), wrapped.getbbox()
        union = (min(pb[0], wb[0]), min(pb[1], wb[1]), max(pb[2], wb[2]), max(pb[3], wb[3]))
        crop = wrapped.crop(union)
        factor = min(1.0, MAX / max(crop.size))
        crop = crop.resize((round(crop.width * factor), round(crop.height * factor)), Image.LANCZOS)
        crop.save(PARTS / f"{wrapped_name}.png", optimize=True)
        # The plain cut-out (prepare.py) is the plain outline's box, shrunk to MAX on its longer side.
        plain_factor = min(1.0, MAX / max(pb[2] - pb[0], pb[3] - pb[1]))
        report[wrapped_name] = {
            "plain": plain_name,
            # wrapped pixel = (plain pixel / plain_factor + plain box origin - union origin) * factor
            "scale": factor / plain_factor,
            "dx": (pb[0] - union[0]) * factor,
            "dy": (pb[1] - union[1]) * factor,
        }
        print(wrapped_name, crop.size, report[wrapped_name], flush=True)
    (PARTS / "ausrichtung.json").write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
