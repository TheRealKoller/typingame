"""Prepare round 3 images for the Phaser probe: seamless ground textures, cut-out props with a paper rim.

Usage: ~/.cache/typingame-art-venv/bin/python experiments/135-art-style/prepare.py
Needs `rembg[gpu]` (BiRefNet, MIT) and Pillow. Reads runde3/, writes demo3/.
"""

import pathlib

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

HERE = pathlib.Path(__file__).parent
SRC = HERE / "runde3"
OUT = HERE / "demo3"
TEXTURES = ("boden-wiese", "boden-erde", "weg")
TEXTURE_SIZE = 512
PROP_MAX = 512
# A pale paper rim around cut-outs keeps them readable on any ground.
RIM = 6
RIM_COLOR = (250, 244, 228)


def seamless(image: Image.Image) -> Image.Image:
    """Blend the image with a copy shifted by half, so the seams of one lie in the middle of the other."""
    a = np.asarray(image, dtype=np.float32)
    h, w = a.shape[:2]
    b = np.roll(a, (h // 2, w // 2), axis=(0, 1))
    y = np.minimum(np.arange(h), h - 1 - np.arange(h)) / (h / 2)
    x = np.minimum(np.arange(w), w - 1 - np.arange(w)) / (w / 2)
    weight = np.clip(np.minimum.outer(y, x) * 2.5, 0, 1)[..., None]
    return Image.fromarray((a * weight + b * (1 - weight)).astype(np.uint8))


def cut_out(image: Image.Image, session) -> Image.Image:
    rgba = remove(image, session=session)
    rgba = rgba.crop(rgba.getbbox())
    rgba.thumbnail((PROP_MAX - 2 * RIM, PROP_MAX - 2 * RIM))
    canvas = Image.new("RGBA", (rgba.width + 2 * RIM, rgba.height + 2 * RIM))
    canvas.paste(rgba, (RIM, RIM))
    alpha = canvas.getchannel("A").point(lambda p: 255 if p > 96 else 0)
    rim_alpha = alpha.filter(ImageFilter.MaxFilter(2 * RIM - 1)).filter(ImageFilter.GaussianBlur(1.5))
    rim = Image.new("RGBA", canvas.size, RIM_COLOR + (0,))
    rim.putalpha(rim_alpha)
    return Image.alpha_composite(rim, canvas)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    session = new_session("birefnet-general")
    for path in sorted(SRC.glob("*.png")):
        image = Image.open(path).convert("RGB")
        if path.stem.rsplit("-", 1)[0] in TEXTURES:
            result = seamless(image).resize((TEXTURE_SIZE, TEXTURE_SIZE), Image.LANCZOS)
        else:
            result = cut_out(image, session)
        result.save(OUT / path.name, optimize=True)
        print(path.name, result.size, flush=True)


if __name__ == "__main__":
    main()
