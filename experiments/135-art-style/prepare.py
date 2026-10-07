"""Prepare generated images for the Phaser probes: seamless ground textures, cut-out props with a paper rim.

Usage: ~/.cache/typingame-art-venv/bin/python experiments/135-art-style/prepare.py <source> <target> [name...]
         [--no-rim] [--saturation S]
  round 3: prepare.py runde3 demo3
  round 4: prepare.py runde4 demo4 boden-wiese-11 boden-erde-11 weg-22 lichtung-11 ...
  round 5: prepare.py runde5 demo5 wiese-aquarell-33 lichtung-22 turm-11 ... --no-rim --saturation 0.22
           prepare.py runde5 demo5 skorpion-22 ... --no-rim   (monsters keep their neon)
Needs `rembg[gpu]` (BiRefNet, MIT) and Pillow. Without names every PNG of <source> is prepared.
"""

import argparse
import pathlib

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

HERE = pathlib.Path(__file__).parent
TEXTURES = ("boden-wiese", "boden-erde", "weg", "wiese-aquarell", "boden", "boden2", "weg2", "boden3", "weg3")
# Clearings lie flat on the ground: no rim, which would outline them like a sticker, and an edge that fades out.
NO_RIM = ("lichtung", "lichtung2", "lichtung3")
FEATHER = 14
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


def cut_out(image: Image.Image, session, rim: int, feather: int = 0) -> Image.Image:
    rgba = remove(image, session=session)
    rgba = rgba.crop(rgba.getbbox())
    pad = rim + feather
    rgba.thumbnail((PROP_MAX - 2 * pad, PROP_MAX - 2 * pad))
    canvas = Image.new("RGBA", (rgba.width + 2 * pad, rgba.height + 2 * pad))
    canvas.paste(rgba, (pad, pad))
    if feather:
        # Shrink the mask, then blur it: the edge fades into whatever lies below.
        alpha = canvas.getchannel("A").filter(ImageFilter.MinFilter(2 * (feather // 2) + 1))
        canvas.putalpha(alpha.filter(ImageFilter.GaussianBlur(feather)))
    if rim == 0:
        return canvas
    alpha = canvas.getchannel("A").point(lambda p: 255 if p > 96 else 0)
    rim_alpha = alpha.filter(ImageFilter.MaxFilter(2 * rim - 1)).filter(ImageFilter.GaussianBlur(1.5))
    rim_layer = Image.new("RGBA", canvas.size, RIM_COLOR + (0,))
    rim_layer.putalpha(rim_alpha)
    return Image.alpha_composite(rim_layer, canvas)


def match_saturation(rgba: Image.Image, target: float) -> Image.Image:
    """Scale saturation so the visible pixels average `target` (0–1): parts painted one by one come out
    with different intensity and look like foreign bodies side by side."""
    hsv = np.asarray(rgba.convert("RGB").convert("HSV"), dtype=np.float32)
    visible = np.asarray(rgba.getchannel("A")) > 128
    mean = hsv[..., 1][visible].mean() / 255 if visible.any() else target
    hsv[..., 1] = np.clip(hsv[..., 1] * np.clip(target / max(mean, 1e-3), 0.5, 1.5), 0, 255)
    rgb = Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB")
    rgb.putalpha(rgba.getchannel("A"))
    return rgb


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("target")
    parser.add_argument("names", nargs="*")
    parser.add_argument("--no-rim", action="store_true", help="no paper rim around cut-outs")
    parser.add_argument("--saturation", type=float, help="bring every image to this mean saturation (0-1)")
    parser.add_argument("--margin", type=float, default=TEXTURE_MARGIN, help="share of each side cut off ground sheets")
    args = parser.parse_args()
    src, out = HERE / args.source, HERE / args.target
    out.mkdir(exist_ok=True)
    session = new_session("birefnet-general")
    paths = [src / f"{name}.png" for name in args.names] if args.names else sorted(src.glob("*.png"))
    for path in paths:
        image = Image.open(path).convert("RGB")
        motif = path.stem.rsplit("-", 1)[0]
        # Round 6 prefixes the style: "holzschnitt-boden2".
        if motif not in TEXTURES + NO_RIM:
            motif = motif.split("-", 1)[-1]
        if motif in TEXTURES:
            m = int(min(image.size) * args.margin)
            image = flatten(image.crop((m, m, image.width - m, image.height - m)))
            result = seamless(image).resize((TEXTURE_SIZE, TEXTURE_SIZE), Image.LANCZOS).convert("RGBA")
        elif motif in NO_RIM:
            result = cut_out(image, session, 0, FEATHER)
        else:
            result = cut_out(image, session, 0 if args.no_rim else RIM)
        if args.saturation is not None:
            result = match_saturation(result, args.saturation)
        result.save(out / path.name, optimize=True)
        print(path.name, result.size, flush=True)


if __name__ == "__main__":
    main()
