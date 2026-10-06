"""Prepare generated images for the Phaser probes: seamless ground textures, cut-out props with a paper rim.

Usage: ~/.cache/typingame-art-venv/bin/python experiments/135-art-style/prepare.py <source> <target> [name...]
  round 3: prepare.py runde3 demo3
  round 4: prepare.py runde4 demo4 boden-wiese-11 boden-erde-11 weg-22 lichtung-11 ...
Needs `rembg[gpu]` (BiRefNet, MIT) and Pillow. Without names every PNG of <source> is prepared.
"""

import pathlib
import sys

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

HERE = pathlib.Path(__file__).parent
TEXTURES = ("boden-wiese", "boden-erde", "weg")
# Clearings lie flat on the ground: no rim, which would outline them like a sticker.
NO_RIM = ("lichtung",)
TEXTURE_SIZE = 512
# Round 4 paints ground on a sheet with a white margin; cut it off before making the texture seamless.
TEXTURE_MARGIN = 0.12
PROP_MAX = 512
# A pale paper rim around cut-outs keeps them readable on any ground.
RIM = 6
RIM_COLOR = (250, 244, 228)


def flatten(image: Image.Image) -> Image.Image:
    """Remove light falloff across the sheet (round 4 is lighter at the top), which shows as bands when tiled."""
    a = np.asarray(image, dtype=np.float32)
    blur = np.asarray(image.filter(ImageFilter.GaussianBlur(min(image.size) / 8)), dtype=np.float32)
    return Image.fromarray(np.clip(a - blur + blur.mean(axis=(0, 1)), 0, 255).astype(np.uint8))


def seamless(image: Image.Image) -> Image.Image:
    """Blend the image with a copy shifted by half, so the seams of one lie in the middle of the other."""
    a = np.asarray(image, dtype=np.float32)
    h, w = a.shape[:2]
    b = np.roll(a, (h // 2, w // 2), axis=(0, 1))
    y = np.minimum(np.arange(h), h - 1 - np.arange(h)) / (h / 2)
    x = np.minimum(np.arange(w), w - 1 - np.arange(w)) / (w / 2)
    weight = np.clip(np.minimum.outer(y, x) * 2.5, 0, 1)[..., None]
    return Image.fromarray((a * weight + b * (1 - weight)).astype(np.uint8))


def cut_out(image: Image.Image, session, rim: int) -> Image.Image:
    rgba = remove(image, session=session)
    rgba = rgba.crop(rgba.getbbox())
    rgba.thumbnail((PROP_MAX - 2 * rim, PROP_MAX - 2 * rim))
    canvas = Image.new("RGBA", (rgba.width + 2 * rim, rgba.height + 2 * rim))
    canvas.paste(rgba, (rim, rim))
    if rim == 0:
        return canvas
    alpha = canvas.getchannel("A").point(lambda p: 255 if p > 96 else 0)
    rim_alpha = alpha.filter(ImageFilter.MaxFilter(2 * rim - 1)).filter(ImageFilter.GaussianBlur(1.5))
    rim_layer = Image.new("RGBA", canvas.size, RIM_COLOR + (0,))
    rim_layer.putalpha(rim_alpha)
    return Image.alpha_composite(rim_layer, canvas)


def main() -> None:
    source, target, *names = sys.argv[1:]
    src, out = HERE / source, HERE / target
    out.mkdir(exist_ok=True)
    session = new_session("birefnet-general")
    paths = [src / f"{name}.png" for name in names] if names else sorted(src.glob("*.png"))
    for path in paths:
        image = Image.open(path).convert("RGB")
        motif = path.stem.rsplit("-", 1)[0]
        if motif in TEXTURES:
            m = int(min(image.size) * TEXTURE_MARGIN)
            image = flatten(image.crop((m, m, image.width - m, image.height - m)))
            result = seamless(image).resize((TEXTURE_SIZE, TEXTURE_SIZE), Image.LANCZOS)
        else:
            result = cut_out(image, session, 0 if motif in NO_RIM else RIM)
        result.save(out / path.name, optimize=True)
        print(path.name, result.size, flush=True)


if __name__ == "__main__":
    main()
