"""Paint battle maps with FLUX.2 klein from a sketch of the real map, and reject paintings that hide paths or sites (#143).

Usage: python3 experiments/143-style-lora/karten.py <map>... [--takes N] [--dry-run]
  A map is `<place>:<seed>:<paths>` for a generated one (smoke:3:1) or the id of a fixed one (ruin); see karten-json.ts.

For each map:
1. karten-json.ts exports it from the game's own generator or data (paths, sites, props, scale).
2. A sketch is drawn: the paths at their width, props as flat shapes, no build sites (the game lays those over).
3. FLUX.2 klein 4B (distilled, Apache 2.0) paints it N times with different seeds (#143, try `skizze3`).
4. Each painting is checked against the map: no water or dark tree on a path, the path still stands out from the
   ground beside it, and every build site stays free ground. Accepted paintings are kept as karten/<map>-<take>.png.
Writes karten/predictions.jsonl, karten/pruefung.json (verdict and measures per painting) and karten/sheet-<map>.jpg
(sketch, then every painting with paths and sites drawn over, green accepted, red rejected).
"""

import argparse
import json
import pathlib
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE.parent / "135-art-style"))
from replicate import KLEIN, KLEIN_BASE, jpeg_uri, run  # noqa: E402

OUT = HERE / "karten"
SCREEN = (1280, 470)
# The sketch and the paintings are 1.25 times the game's map, about one megapixel as klein paints.
DRAW = 1.25

OUTDOOR = (
    "Paint this rough game map sketch as a finished hand-painted watercolor cartoon tower defense battlefield seen from "
    "above, bold dark outlines, soft watercolor washes. The flat shapes are placeholders and keep their place and size: "
    "the light blue oval is a small natural pond set into the ground with reeds and a muddy bank; {trees}; grey circles are "
    "mossy boulders; grey-brown rectangles are low crumbling stone ruins "
    "overgrown with grass. Each grows straight out of the ground, no plates or bases. Add no other water. {ground} Give the "
    "sandy roads ruts, small pebbles and a ragged, grassy edge. Keep every road exactly where it is, with the same width "
    "and shape, also where roads join. No text, no border, no characters, no buildings added."
)
LEAFY = "dark green circles are leafy trees seen from above"
# The first ash maps came with green trees: the sketch drew them green. Now they are drawn and named burnt.
BURNT = "dark brown circles are burnt trees seen from above, bare and leafless, with charred black branches and no green at all"
BURNT_COLOURS = ((92, 70, 56), (104, 80, 62), (82, 62, 50))
MEADOW = "Vary the meadow with darker and lighter green, wildflowers and grass tufts."
# Second try (`--plaetze`): klein put a pond into a bend of the road, where the best site lies, nearly every time.
# The sites go into the sketch as flat stone slabs, and the prompt rules out any other water.
PLOTS = (
    " The small square beige slabs are flat stone building plots: paint them as plain flat stone slabs set into the "
    "ground, with nothing standing on them and nothing covering them. Add no other water: no pond, puddle or stream "
    "anywhere else, also not inside the bends of the roads."
)
PLOT, PLOT_EDGE = (222, 210, 186), (150, 136, 112)
ASH = (
    "The land is an ash field after a great fire: grey soot and ash lie over pale dry grass, the trees are burnt and "
    "bare, a few embers glow; keep it readable and not too dark."
)
INDOOR = (
    "Paint this rough game map sketch as a finished hand-painted watercolor cartoon game map of a library room seen from "
    "above, bold dark outlines, soft watercolor washes. The red band is a worn red carpet; keep it exactly where it is, "
    "with the same width and shape. The dark band at the top is the back wall; the brown rectangles on it are tall "
    "bookshelves full of books. Grey is a stone floor of large slabs{ash}. Small shapes on the floor are piles of books, "
    "scrolls, a lectern or a reading desk. Add no other furniture on the floor. No text, no border, no characters."
)

# Colours of the sketch.
GRASS, ASH_GROUND, ROAD, ROAD_EDGE = (190, 225, 150), (190, 190, 175), (236, 214, 168), (196, 166, 118)
FLOOR, CARPET, CARPET_EDGE, WALL, SHELF = (178, 174, 166), (176, 48, 44), (120, 30, 28), (86, 68, 58), (128, 88, 52)
PROP_SHAPES = {
    # [dx, dy, radius, colour] at scale 1, around the prop's ground point
    "tree": [(0, -8, 24, (79, 138, 58))],
    "rock": [(-12, 6, 12, (141, 141, 136)), (10, 6, 13, (154, 154, 148)), (0, -8, 12, (133, 133, 127))],
    "book-pile": [(0, 0, 14, (150, 80, 60))],
    "scroll": [(0, 0, 10, (230, 220, 190))],
    "lectern": [(0, 0, 16, (120, 80, 50))],
    "reading-desk": [(0, 0, 26, (120, 80, 50))],
}


def export(names: list[str]) -> dict:
    script = "import('vite').then((v) => v.runnerImport('./experiments/143-style-lora/karten-json.ts'))"
    return json.loads(subprocess.run(["node", "-e", script, "--", *names], cwd=ROOT, check=True, capture_output=True).stdout)


def sketch(m: dict, layout: dict) -> Image.Image:
    """The map as flat shapes at DRAW times its size: ground, paths with an edge, props; build sites are left out."""
    s, k = m.get("scale", 1), DRAW
    w, h = round(SCREEN[0] * k), round(SCREEN[1] * k)
    indoor = m["indoor"]
    img = Image.new("RGB", (w, h), FLOOR if indoor else ASH_GROUND if m.get("ash") else GRASS)
    draw = ImageDraw.Draw(img)
    if indoor:
        draw.rectangle((0, 0, w, layout["wallBottom"] * k), fill=WALL)
    half = layout["pathHalf"] * s * k
    fill, edge = (CARPET, CARPET_EDGE) if indoor else (ROAD, ROAD_EDGE)
    for colour, grow in ((edge, 3 * k), (fill, 0)):
        for path in m["paths"]:
            for a, b in zip(path, path[1:]):
                x0, x1 = sorted((a["x"] * k, b["x"] * k))
                y0, y1 = sorted((a["y"] * k, b["y"] * k))
                draw.rectangle((x0 - half - grow, y0 - half - grow, x1 + half + grow, y1 + half + grow), fill=colour)
    # Generated maps know trees and rocks only; some become groves, one at most a pond, some rocks a ruin.
    pond = False
    for prop in m["props"]:
        x, y = prop["x"] * k, prop["y"] * k
        if prop["kind"] in ("bookshelf", "burnt-bookshelf"):
            draw.rectangle((x - 30 * k, y - 62 * k, x + 30 * k, y + 62 * k), fill=SHELF)
            continue
        # Props stand by their centre, half their height (32 at scale 1) above the ground.
        ground = y + 32 * s * k
        if prop["kind"] == "tree" and prop.get("variant", 0) % 4 == 1:
            colours = BURNT_COLOURS if m.get("ash") else ((79, 138, 58), (92, 152, 66), (70, 127, 51))
            shapes = [(dx, dy, r, c) for (dx, dy, r), c in zip(((-18, 4, 18), (16, 2, 20), (0, -16, 20)), colours)]
        elif prop["kind"] == "tree" and prop.get("variant", 0) % 4 == 3 and not pond and not indoor:
            pond = True
            draw.ellipse((x - 42 * s * k, ground - 23 * s * k, x + 42 * s * k, ground + 23 * s * k), fill=(111, 183, 217))
            continue
        elif prop["kind"] == "tree" and m.get("ash"):
            shapes = [(0, -8, 24, BURNT_COLOURS[0])]
        elif prop["kind"] == "rock" and prop.get("variant", 0) % 2 == 1:
            draw.rectangle((x - 26 * s * k, ground - 16 * s * k, x + 26 * s * k, ground + 16 * s * k), fill=(154, 143, 128))
            continue
        else:
            shapes = PROP_SHAPES[prop["kind"]]
        for dx, dy, r, colour in shapes:
            cx, cy, rr = x + dx * s * k, ground + dy * s * k, r * s * k
            draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=colour)
    return img


def path_samples(paths: list[list[dict]], step: float = 6) -> list[tuple[float, float]]:
    out = []
    for path in paths:
        for a, b in zip(path, path[1:]):
            length = max(abs(b["x"] - a["x"]), abs(b["y"] - a["y"]))
            for i in range(int(length // step) + 1):
                t = i * step / length if length else 0
                out.append((a["x"] + (b["x"] - a["x"]) * t, a["y"] + (b["y"] - a["y"]) * t))
    return out


def classes(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Water (clearly bluer than red and not darker than green) and dark masses such as tree crowns or deep shadows."""
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    water = (b > r + 35) & (b > g - 10) & (b > 120)
    # Ash fields are painted in dark washes; only near-black counts, not soot or the outline of a slab.
    dark = (r + g + b) < 150
    return water, dark


def check(painting: Image.Image, m: dict, layout: dict) -> dict:
    """Measures whether the painting keeps the map playable; `ok` if every measure is within its limit."""
    s = m.get("scale", 1)
    img = np.asarray(painting.convert("RGB").resize(SCREEN, Image.LANCZOS))
    water, dark = classes(img)
    on = [(int(x), int(y)) for x, y in path_samples(m["paths"]) if 0 <= x < SCREEN[0] and 0 <= y < SCREEN[1]]
    road_water = float(np.mean([water[y, x] for x, y in on]))
    road_dark = float(np.mean([dark[y, x] for x, y in on]))
    # The path must still stand out: its colour differs from the ground a little beside it.
    half = layout["pathHalf"] * s
    beside = []
    for path in m["paths"]:
        for a, b in zip(path, path[1:]):
            horizontal = a["y"] == b["y"]
            for x, y in path_samples([[a, b]], 12):
                for side in (-1, 1):
                    bx, by = (x, y + side * (half + 14)) if horizontal else (x + side * (half + 14), y)
                    if 0 <= bx < SCREEN[0] and 0 <= by < SCREEN[1]:
                        beside.append((int(bx), int(by)))
    contrast = float(np.linalg.norm(img[[y for _, y in on], [x for x, _ in on]].mean(0) - img[[y for _, y in beside], [x for x, _ in beside]].mean(0)))
    # Every build site keeps free ground where its pad will lie: little water and no tree crown inside it.
    box = layout["siteHalf"] * s - 4
    sites = []
    for site in m["sites"]:
        x0, x1 = int(site["x"] - box), int(site["x"] + box)
        y0, y1 = int(site["y"] - box), int(site["y"] + box)
        sites.append({"id": site["id"], "water": float(water[y0:y1, x0:x1].mean()), "dark": float(dark[y0:y1, x0:x1].mean())})
    worst_water = max(site["water"] for site in sites)
    worst_dark = max(site["dark"] for site in sites)
    ok = road_water < 0.02 and road_dark < 0.08 and contrast > 25 and worst_water < 0.05 and worst_dark < 0.15
    return {"ok": ok, "road_water": road_water, "road_dark": road_dark, "contrast": contrast, "site_water": worst_water, "site_dark": worst_dark, "sites": sites}


def overlay(painting: Image.Image, m: dict, layout: dict, ok: bool) -> Image.Image:
    img = painting.convert("RGB").resize(SCREEN, Image.LANCZOS)
    draw = ImageDraw.Draw(img)
    for path in m["paths"]:
        draw.line([(p["x"], p["y"]) for p in path], fill=(220, 30, 30), width=2)
    box = layout["siteHalf"] * m.get("scale", 1)
    for site in m["sites"]:
        draw.rectangle((site["x"] - box, site["y"] - box, site["x"] + box, site["y"] + box), outline=(30, 60, 220), width=2)
    draw.rectangle((0, 0, img.width - 1, img.height - 1), outline=(40, 170, 60) if ok else (220, 40, 40), width=8)
    return img


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("maps", nargs="+")
    parser.add_argument("--takes", type=int, default=4, help="paintings per map")
    parser.add_argument("--dry-run", action="store_true", help="only draw the sketches")
    parser.add_argument("--plaetze", action="store_true", help="draw the build sites as stone slabs into the sketch")
    parser.add_argument("--base", action="store_true", help="paint with klein 4B base instead of the distilled model")
    args = parser.parse_args()
    OUT.mkdir(exist_ok=True)
    data = export(args.maps)
    layout = data["layout"]
    jobs = []
    for m in data["maps"]:
        if args.base:
            m["key"] += "-b"
        # Ash fields since their trees are sketched and named burnt.
        if m.get("ash") and not m["indoor"]:
            m["key"] += "-verbrannt"
        if args.plaetze:
            m["key"] += "-p"
        template = OUT / f"skizze-{m['key']}.png"
        img = sketch(m, layout)
        if args.plaetze:
            draw, half, k = ImageDraw.Draw(img), layout["siteHalf"] * m.get("scale", 1) * DRAW, DRAW
            for site in m["sites"]:
                draw.rectangle((site["x"] * k - half, site["y"] * k - half, site["x"] * k + half, site["y"] * k + half), fill=PLOT, outline=PLOT_EDGE, width=3)
        img.save(template)
        if m["indoor"]:
            prompt = INDOOR.format(ash=", blackened with soot where the library burnt" if m.get("ash") else "")
        else:
            prompt = OUTDOOR.format(ground=ASH if m.get("ash") else MEADOW, trees=BURNT if m.get("ash") else LEAFY)
        if args.plaetze:
            prompt += PLOTS
        uri = jpeg_uri(template)
        for take in range(1, args.takes + 1):
            inputs = {"prompt": prompt, "seed": take, "output_format": "png", "images": [uri], "aspect_ratio": "match_input_image"}
            if args.base:
                inputs["guidance"] = 4
            jobs.append((OUT / f"bild-{m['key']}-{take}.png", KLEIN_BASE if args.base else KLEIN, inputs))
    run(jobs, args.dry_run)

    report_path = OUT / "pruefung.json"
    report = json.loads(report_path.read_text()) if report_path.exists() else {}
    font = ImageFont.load_default(18)
    for m in data["maps"]:
        cells = [(Image.open(OUT / f"skizze-{m['key']}.png").convert("RGB").resize(SCREEN), "Skizze")]
        for take in range(1, args.takes + 1):
            path = OUT / f"bild-{m['key']}-{take}.png"
            if not path.exists():
                continue
            painting = Image.open(path)
            result = check(painting, m, layout)
            report[path.stem] = result
            accepted = OUT / f"karte-{m['key']}-{take}.png"
            if result["ok"]:
                painting.convert("RGB").resize(SCREEN, Image.LANCZOS).save(accepted, optimize=True)
            elif accepted.exists():
                accepted.unlink()
            label = f"{take}: {'ok' if result['ok'] else 'verworfen'}  Weg Wasser {result['road_water']:.0%} dunkel {result['road_dark']:.0%} Kontrast {result['contrast']:.0f}  Platz Wasser {result['site_water']:.0%} dunkel {result['site_dark']:.0%}"
            cells.append((overlay(painting, m, layout, result["ok"]), label))
        cell_w, cell_h = 640, 235 + 26
        sheet = Image.new("RGB", (2 * cell_w, ((len(cells) + 1) // 2) * cell_h), "white")
        draw = ImageDraw.Draw(sheet)
        for i, (img, label) in enumerate(cells):
            x, y = (i % 2) * cell_w, (i // 2) * cell_h
            sheet.paste(img.resize((cell_w, 235)), (x, y))
            draw.text((x + 4, y + 238), label, fill="black", font=font)
        sheet.save(OUT / f"sheet-{m['key']}.jpg", quality=85)
        accepted = sum(report[f"bild-{m['key']}-{t}"]["ok"] for t in range(1, args.takes + 1) if f"bild-{m['key']}-{t}" in report)
        print(f"{m['key']}: {accepted} of {args.takes} accepted", flush=True)
    report_path.write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
