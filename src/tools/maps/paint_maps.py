"""Paint the battle maps with FLUX.2 klein from a sketch of the real map and keep three playable paintings per map (#151).

Usage: python3 src/tools/maps/paint_maps.py [<map id>...] [--variants 3] [--max-tries 12] [--dry-run]
  Without ids every map is painted: the fixed ones (reading-room, archive, courtyard, ruin, cellar) and every
  generated place of the world map (smoke, embers). Needs Python 3 with Pillow and numpy, Node, and
  REPLICATE_API_TOKEN in .env (see src/tools/replicate.py). Costs about 0.015 $ per painting.

For each map:
1. maps-json.ts exports it from the game's own data or generator (paths, sites, props, scale). A generated place
   is tried with seed after seed of `generateAshMap`, a fixed map with take after take of the painting.
2. A sketch is drawn: paths at their width, props as flat shapes, build sites as flat rings in the ground.
3. FLUX.2 klein 4B base (Apache 2.0) paints it (#143 klein base, #145 stone rings).
4. Each painting is checked against the map: no water or dark mass on a path, the path stands out from the ground
   beside it, every build site stays free, and no extra bare-earth circle looks like a plot. The first accepted ones become src/assets/maps/<id>-<n>.webp, and
   src/assets/maps/maps.json records per map the file, the seed and the paths and sites they were painted for;
   paintedMaps.test.ts fails when the game's maps no longer match them.
Work files (sketches, paintings, contact sheets work/sheet-<id>.jpg with paths and sites drawn over, green accepted,
red rejected, predictions.jsonl) go to src/tools/maps/work/, which git ignores.
"""

import argparse
import json
import pathlib
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from replicate import KLEIN_BASE, ROOT, jpeg_uri, run, sheet  # noqa: E402

WORK = HERE / "work"
ASSETS = ROOT / "src" / "assets" / "maps"
MANIFEST = ASSETS / "maps.json"
SCREEN = (1280, 470)
# The sketch and the paintings are 1.25 times the game's map, about one megapixel as klein paints.
DRAW = 1.25
BATCH = 4
# Paintings that pass the check but were rejected on review, with the reason (shown on the contact sheet): the check
# does not see a plot ring painted where no site is, or a site whose ring is missing.
REJECTED = {
    "bild-archive-6": "Ring ohne Bauplatz",
    "bild-archive-7": "Ringe ohne Bauplatz",
    "bild-courtyard-4": "Ringe fehlen",
    "bild-ruin-1": "Ring ohne Bauplatz",
    "bild-cellar-7": "großer Steinkreis",
    "bild-cellar-9": "großer Steinkreis",
    "bild-cellar-10": "großer Steinkreis",
    "bild-smoke-1001-1": "Ring ohne Bauplatz",
    "bild-smoke-1010-10": "Ring ohne Bauplatz",
    "bild-embers-2004-4": "Ring ohne Bauplatz",
    "bild-embers-2020-20": "Ring ohne Bauplatz",
}
# Layouts of the generated places (seeds of `generateAshMap`), tried in this order. A place shows only these maps, so
# each has to keep the place's balance on its own (journey.test.ts plays every painting); the layout matters a lot.
# Measured with the players of journey.test.ts over 13 battles each (#151):
# - smoke: every layout 1001-1012 is held by towers alone and with typing, arrows keep 8 to 10 wards (ruin 10, cellar 7.4).
# - embers: the last place must need typing. Kept are layouts that towers alone never hold, typing always does,
#   and arrows keep fewer wards than at the cellar: of 2001-2030 2001, 2004, 2007, 2011, 2012, 2019, 2020, 2023
#   (2005, 2009, 2018, 2022, 2025 and 2026 were held by towers alone), of 2031-2070 the first six such.
LAYOUTS = {
    "smoke": (1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012),
    "embers": (2001, 2004, 2007, 2011, 2012, 2019, 2020, 2023, 2031, 2032, 2036, 2038, 2046, 2047),
}

OUTDOOR = (
    "Paint this rough game map sketch as a finished hand-painted watercolor cartoon tower defense battlefield seen from "
    "above, bold dark outlines, soft watercolor washes. The flat shapes are placeholders and keep their place and size: "
    "the light blue oval is a small natural pond set into the ground with reeds and a muddy bank; {trees}; grey circles are "
    "mossy boulders; grey-brown rectangles are low crumbling stone ruins overgrown with grass. Each grows straight out "
    "of the ground, no plates or bases. {ground} Give the sandy road ruts, small pebbles and a ragged, grassy edge. Keep "
    "the road exactly where it is, with the same width and shape. No text, no border, no characters, no buildings added."
)
LEAFY = "dark green circles are leafy trees seen from above"
# Ash fields: brown circles, since klein painted dark green ones as living trees even when told they are burnt.
BURNT = "dark brown circles are burnt trees seen from above, bare and leafless, with charred black branches and no green at all"
BURNT_COLOURS = ((92, 70, 56), (104, 80, 62), (82, 62, 50))
MEADOW = "Vary the meadow with darker and lighter green, wildflowers and grass tufts."
ASH = (
    "The land is an ash field after a great fire: grey soot and ash lie over pale dry grass, the trees are burnt and "
    "bare, a few embers glow; keep it readable and not too dark."
)
INDOOR = (
    "Paint this rough game map sketch as a finished hand-painted watercolor cartoon game map of a library room seen from "
    "above, bold dark outlines, soft watercolor washes. The red band is a worn red carpet; keep it exactly where it is, "
    "with the same width and shape. The dark band at the top is the back wall; the brown rectangles are tall bookshelves "
    "full of books, on the wall and standing free on the floor. Grey is a stone floor of large slabs{ash}. Small shapes "
    "on the floor are piles of books, scrolls, a lectern or a reading desk. Add no other furniture on the floor. No text, "
    "no border, no characters."
)
# Build sites as flat rings of stones (#145): square slabs looked wrong under round towers, round discs and paving
# came out as drums and boulders. Without them in the sketch klein put ponds into the road's bends, on the best sites.
# The first run of #151 painted other shapes (free-standing shelves, empty lawn) as big rings that looked like plots.
PLOTS = (
    " The thin beige oval rings are building plots: paint each as a flat ring of small stones laid level into the ground "
    "around a patch of bare earth, completely flat, not a rock or a pillar, with nothing standing in it. Paint no other "
    "rings, stone circles or round patches of bare earth anywhere. Add no other water: no pond, puddle or stream "
    "anywhere else, also not inside the bends of the roads."
)

# Colours of the sketch.
GRASS, ASH_GROUND, ROAD, ROAD_EDGE = (190, 225, 150), (190, 190, 175), (236, 214, 168), (196, 166, 118)
FLOOR, CARPET, CARPET_EDGE, WALL, SHELF = (178, 174, 166), (176, 48, 44), (120, 30, 28), (86, 68, 58), (128, 88, 52)
PLOT = (222, 210, 186)
BOOK_COLOURS = ((150, 50, 40), (60, 90, 130), (70, 110, 60), (180, 150, 80))
PROP_SHAPES = {
    # [dx, dy, radius, colour] at scale 1, around the prop's ground point
    "tree": [(0, -8, 24, (79, 138, 58))],
    "rock": [(-12, 6, 12, (141, 141, 136)), (10, 6, 13, (154, 154, 148)), (0, -8, 12, (133, 133, 127))],
}
# Furniture as rectangles [half width, half height, colour]: as round shapes, desks and scrolls came out as plot rings.
FURNITURE = {
    "book-pile": (14, 10, (150, 80, 60)),
    "scroll": (12, 5, (230, 220, 190)),
    "lectern": (14, 12, (120, 80, 50)),
    "reading-desk": (30, 18, (120, 80, 50)),
}


def export(keys: list[str]) -> dict:
    script = "import('vite').then((v) => v.runnerImport('./src/tools/maps/maps-json.ts'))"
    return json.loads(subprocess.run(["node", "-e", script, "--", *keys], cwd=ROOT, check=True, capture_output=True).stdout)


def sketch(m: dict, layout: dict) -> Image.Image:
    """The map as flat shapes at DRAW times its size: ground, paths with an edge, props, build sites as rings."""
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
            # Rows of book spines: a plain brown block standing on the floor came out as a sandy plot with a stone rim.
            for row in range(5):
                top = y + (-56 + row * 24) * k
                for col in range(6):
                    left = x + (-26 + col * 9) * k
                    draw.rectangle((left, top, left + 7 * k, top + 18 * k), fill=BOOK_COLOURS[(row + col) % len(BOOK_COLOURS)])
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
        elif prop["kind"] in FURNITURE:
            hw, hh, colour = FURNITURE[prop["kind"]]
            draw.rectangle((x - hw * s * k, ground - hh * s * k, x + hw * s * k, ground + hh * s * k), fill=colour)
            continue
        else:
            shapes = PROP_SHAPES[prop["kind"]]
        for dx, dy, r, colour in shapes:
            cx, cy, rr = x + dx * s * k, ground + dy * s * k, r * s * k
            draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=colour)
    # A ring as wide as a stage II tower's foot, squashed as seen slightly from above so it reads as flat ground,
    # a little below the site's centre where the towers stand.
    rx = layout["siteHalf"] * s * k
    for site in m["sites"]:
        x, y = site["x"] * k, (site["y"] + 8 * s) * k
        draw.ellipse((x - rx, y - rx * 0.6, x + rx, y + rx * 0.6), outline=PLOT, width=max(3, round(rx * 0.22)))
    return img


def prompt_for(m: dict) -> str:
    if m["indoor"]:
        prompt = INDOOR.format(ash=", blackened with soot where the library burnt" if m.get("ash") else "")
    else:
        prompt = OUTDOOR.format(ground=ASH if m.get("ash") else MEADOW, trees=BURNT if m.get("ash") else LEAFY)
    return prompt + PLOTS


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
    # Ash fields are painted in dark washes; only near-black counts, not soot or the outline of a ring.
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
    # Every build site keeps free ground where its tower will stand: little water and no dark mass inside it.
    box = layout["siteHalf"] * s - 4
    sites = []
    for site in m["sites"]:
        x0, x1 = int(site["x"] - box), int(site["x"] + box)
        y0, y1 = int(site["y"] - box), int(site["y"] + box)
        sites.append({"id": site["id"], "water": float(water[y0:y1, x0:x1].mean()), "dark": float(dark[y0:y1, x0:x1].mean())})
    worst_water = max(site["water"] for site in sites)
    worst_dark = max(site["dark"] for site in sites)
    stray = stray_plots(img, m, layout)
    ok = road_water < 0.02 and road_dark < 0.08 and contrast > 25 and worst_water < 0.05 and worst_dark < 0.15 and stray < 500
    return {"ok": ok, "road_water": road_water, "road_dark": road_dark, "contrast": contrast, "site_water": worst_water, "site_dark": worst_dark, "stray": stray}


def stray_plots(img: np.ndarray, m: dict, layout: dict) -> int:
    """Pixels of solid bare-earth patches away from the paths and sites: klein sometimes paints extra rings or big
    sandy circles (at the path's end, in free floor), which look like build plots. Thin sandy specks and the stone
    floor's light tiles vanish when the mask is eroded; such a patch keeps hundreds of pixels (#151: 0 to 30 in good
    paintings, 1000 and more with an extra circle)."""
    r, g, b = (img[..., i].astype(int) for i in range(3))
    sand = (r > 185) & (g > 160) & (r - b > 35) & (r - b < 110) & (r - g < 45)
    solid = np.asarray(Image.fromarray((sand * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(21))) > 0
    away = np.ones(sand.shape, bool)
    s = m.get("scale", 1)
    half = layout["pathHalf"] * s + 14
    for path in m["paths"]:
        for a, b2 in zip(path, path[1:]):
            x0, x1 = sorted((a["x"], b2["x"]))
            y0, y1 = sorted((a["y"], b2["y"]))
            away[max(0, int(y0 - half)) : int(y1 + half), max(0, int(x0 - half)) : int(x1 + half)] = False
    box = layout["siteHalf"] * s + 14
    for site in m["sites"]:
        away[max(0, int(site["y"] - box)) : int(site["y"] + box + 10), max(0, int(site["x"] - box)) : int(site["x"] + box)] = False
    return int((solid & away).sum())


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


def paint(map_id: str, layouts: tuple[int, ...] | None, variants: int, max_tries: int, dry_run: bool) -> list[dict]:
    """Paints `map_id` batch by batch until `variants` paintings are accepted; returns them in order of trying.
    A generated place gets one painting per layout in `layouts`, a fixed map `max_tries` paintings at most."""
    accepted: list[dict] = []
    cells = []
    generated = layouts is not None
    count = len(layouts) if generated else max_tries
    for start in range(0, count, BATCH):
        tries = range(start, min(start + BATCH, count))
        keys = [f"{map_id}:{layouts[n]}" for n in tries] if generated else [map_id]
        data = export(keys)
        layout = data["layout"]
        # (map, painting seed): klein's seed is the try, for a layout the seed's last digits.
        attempts = [(m, m["seed"] % 1000) for m in data["maps"]] if generated else [(data["maps"][0], n + 1) for n in tries]
        jobs = []
        for m, take in attempts:
            template = WORK / f"skizze-{m['key'].replace(':', '-')}.png"
            if not template.exists():
                sketch(m, layout).save(template)
            inputs = {
                "prompt": prompt_for(m),
                "seed": take,
                "guidance": 4,
                "output_format": "png",
                "images": [jpeg_uri(template)],
                "aspect_ratio": "match_input_image",
            }
            jobs.append((WORK / f"bild-{m['key'].replace(':', '-')}-{take}.png", KLEIN_BASE, inputs))
        run(jobs, dry_run)
        if dry_run:
            return []
        for (m, take), (path, _, _) in zip(attempts, jobs):
            if not path.exists():
                continue
            painting = Image.open(path)
            result = check(painting, m, layout)
            ok = result["ok"] and path.stem not in REJECTED
            verdict = "ok" if ok else REJECTED.get(path.stem, "verworfen")
            cells.append((overlay(painting, m, layout, ok), f"{path.stem}: {verdict}"))
            if ok and len(accepted) < variants:
                accepted.append({"painting": path, "seed": m["seed"], "take": take, "paths": m["paths"], "sites": m["sites"]})
        if len(accepted) >= variants:
            break
    if cells:
        sheet(cells, WORK / f"sheet-{map_id}.jpg", 2, (640, 235))
    print(f"{map_id}: {len(accepted)} of {variants} accepted", flush=True)
    return accepted


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("maps", nargs="*", help="map ids; all maps if none")
    parser.add_argument("--variants", type=int, default=3, help="paintings to keep per map")
    parser.add_argument("--max-tries", type=int, default=12, help="paintings to try at most per fixed map")
    parser.add_argument("--dry-run", action="store_true", help="only draw the sketches and count images")
    args = parser.parse_args()
    WORK.mkdir(exist_ok=True)
    ASSETS.mkdir(exist_ok=True)
    # The game imports the manifest, and maps-json.ts runs through the game's modules: it has to exist.
    if not MANIFEST.exists():
        MANIFEST.write_text("{}\n")
    listing = export([])
    missing_layouts = [map_id for map_id in listing["generated"] if map_id not in LAYOUTS]
    if missing_layouts:
        raise SystemExit(f"no layouts chosen for {', '.join(missing_layouts)}: add them to LAYOUTS")
    known = {**{map_id: None for map_id in listing["fixed"]}, **{map_id: LAYOUTS[map_id] for map_id in listing["generated"]}}
    unknown = [map_id for map_id in args.maps if map_id not in known]
    if unknown:
        raise SystemExit(f"unknown maps: {', '.join(unknown)}; known: {', '.join(known)}")
    manifest = json.loads(MANIFEST.read_text())
    missing = []
    for map_id in args.maps or list(known):
        accepted = paint(map_id, known[map_id], args.variants, args.max_tries, args.dry_run)
        if args.dry_run:
            continue
        if len(accepted) < args.variants:
            missing.append(map_id)
            continue
        for old in ASSETS.glob(f"{map_id}-*.webp"):
            old.unlink()
        entries = []
        for n, variant in enumerate(accepted, 1):
            file = f"{map_id}-{n}.webp"
            Image.open(variant["painting"]).convert("RGB").resize(SCREEN, Image.LANCZOS).save(ASSETS / file, quality=82, method=6)
            entries.append({"file": file, "seed": variant["seed"], "take": variant["take"], "paths": variant["paths"], "sites": variant["sites"]})
        manifest[map_id] = entries
        MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=1) + "\n")
    if missing:
        raise SystemExit(f"too few accepted paintings for {', '.join(missing)}; try again with a higher --max-tries")


if __name__ == "__main__":
    main()
