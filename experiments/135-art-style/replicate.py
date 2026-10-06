"""Generate art style probes for issue #135 on Replicate with Z-Image Turbo (same model as generate.py runs locally).

Usage: python3 experiments/135-art-style/replicate.py <job>... [--dry-run]
Jobs: karte-a, karte-b, monster, oberflaeche. Writes runde4/<name>.png next to this script; existing files are skipped.
Token: REPLICATE_API_TOKEN=r8_... in .env at the repo root (ignored by git).
Every prediction is logged to runde4/predictions.jsonl (model version, input, id, time).

karte-a paints a whole battle map over the real path of `generateAshMap`: map-json.ts exports the map,
this script draws it as a colour sketch (img2img) and as a line drawing (ControlNet). Seeds are fixed,
but Replicate's build of the model is not bit-identical to LocalAI, so images differ from the local ones.
"""

import argparse
import base64
import concurrent.futures
import json
import math
import pathlib
import random
import subprocess
import time
import urllib.error
import urllib.request

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from generate import AQUARELL, FEDER, ISOLATED

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent
OUT = HERE / "runde4"
API = "https://api.replicate.com/v1"

# Pinned versions, so a run can be repeated. All three run Z-Image Turbo (Apache 2.0).
TEXT2IMG = "39562180b0d850913be1ebe0f37c266080fd95040859b4b9aee9b17da5c88b4f"  # prunaai/z-image-turbo
IMG2IMG = "7142e836070262fece6f2c4356aec87e9aec27bf31c65ef6b3983e0153e9518c"  # prunaai/z-image-turbo-img2img
# benjyazoulay/z-image-turbo-lora-controlnet: Union ControlNet; it always loads a LoRA, lora_scale 0 switches it off.
CONTROLNET = "8f27c770ae77f70cd73553a89e2494ec72b692ae5e7de67a955d29c8741dbf80"

SEEDS = (11, 22, 33)

# Round 2's map style (muted watercolor) was liked best; ground textures keep it without colour names,
# which turned ground into checkerboards in round 3.
GROUND = (
    "loose watercolor painting on white paper, soft muted washes, pigment blooms, continuous natural ground "
    "surface filling the whole image edge to edge, seen from directly above, uniform density, no objects, "
    "no horizon, no border, no text"
)
PROP = f"three-quarter top-down view, game map prop, {ISOLATED}"
# Atramentus paints his monsters: dark ink bodies, brush strokes on the shell, nothing like the friendly golems.
# First try: came out as naturalist studies of real insects, and "shell" turned the wasp into a tortoise.
MONSTER = (
    "menacing creature painted entirely from glossy black ink, broad visible calligraphy brush strokes across "
    "its armored shell, ink drips and splatter, sinister, side view, game enemy character"
)
# Second try: a painted thing that is not a real animal.
INK_BEAST = (
    "a sinister fantasy monster that is not a real animal, its body is a living splash of thick black ink "
    "shaped by a few bold sweeping brush strokes, visible bristle marks, ink dripping and splattering from it, "
    "small glowing ember eyes, side view, game enemy character"
)
UI = "game interface element, front view, flat, no text, no letters, no writing"
MAP = (
    f"{AQUARELL}, orthographic top-down view seen exactly from directly above, flat map of a landscape, "
    "one winding dirt road, small bare earth clearings beside the road, clusters of round tree crowns seen "
    "from above, grey boulders, game battle map background, no horizon, no sky, no text"
)
MAP_GROUNDS = {
    "wiese": "open meadow with soft grass",
    "asche": "meadow dusted with grey ash and soot, charred grass, a few burnt trees",
}
MAP_SEEDS = (1, 2)
# 0.6 and 0.75 keep the road but stay a flat sketch; 0.9 paints well but ignores the road.
STRENGTHS = (0.6, 0.75, 0.8, 0.85, 0.9)
CONTROLS = ("lineart", "canny")

# name -> (prompt, width, height)
TEXT_JOBS: dict[str, dict[str, tuple[str, int, int]]] = {
    "karte-b": {
        "boden-wiese": (f"{GROUND}, meadow grass with a few small wildflowers", 1024, 1024),
        "boden-erde": (f"{GROUND}, dry earth with small pebbles and a few grass tufts", 1024, 1024),
        "weg": (f"{GROUND}, packed sandy dirt with faint wheel ruts and small stones", 1024, 1024),
        "weg-strich": (
            f"{AQUARELL}, flat top-down map view seen from directly above, a long gently curving band of sandy "
            f"dirt road painted with one broad brush stroke, soft bleeding edges, no horizon, no sky, no landscape, {ISOLATED}",
            1536,
            640,
        ),
        "lichtung": (f"{AQUARELL}, a small round patch of bare earth with soft ragged edges, seen from directly above, {ISOLATED}", 1024, 1024),
        "baum": (f"{AQUARELL}, a single round leafy oak tree, {PROP}", 1024, 1024),
        "baumgruppe": (f"{AQUARELL}, a small cluster of four leafy trees, {PROP}", 1024, 1024),
        "felsen": (f"{AQUARELL}, a group of mossy grey boulders, {PROP}", 1024, 1024),
        "weiher": (f"{AQUARELL}, a small round pond with reeds, {PROP}", 1024, 1024),
        "ruine": (f"{AQUARELL}, a crumbling ruined stone wall with ivy, {PROP}", 1024, 1024),
    },
    "monster": {
        "skorpion": (f"{FEDER}, {MONSTER}, a small scorpion with a raised stinger tail, {ISOLATED}", 1024, 1024),
        "feuerwespe": (
            f"{FEDER}, {MONSTER}, a small fast wasp with torn ink wings and a faint ember glow, flying, {ISOLATED}",
            1024,
            1024,
        ),
        "feuerkaefer": (
            f"{FEDER}, {MONSTER}, a large hulking fire bug with embers glowing through cracks in its shell, {ISOLATED}",
            1024,
            1024,
        ),
        "panzerkaefer": (
            f"{FEDER}, {MONSTER}, a heavy beetle with a thick domed shell of hardened ink, crawling, {ISOLATED}",
            1024,
            1024,
        ),
        "skorpion-tinte": (f"{FEDER}, {INK_BEAST}, shaped like a small scorpion with a raised stinger tail, {ISOLATED}", 1024, 1024),
        "feuerwespe-tinte": (
            f"{FEDER}, {INK_BEAST}, shaped like a small wasp with ragged ink wings and an orange ember glow, flying, {ISOLATED}",
            1024,
            1024,
        ),
        "feuerkaefer-tinte": (
            f"{FEDER}, {INK_BEAST}, shaped like a large hulking bug with orange embers glowing through cracks, {ISOLATED}",
            1024,
            1024,
        ),
        "panzerkaefer-tinte": (
            f"{FEDER}, {INK_BEAST}, shaped like a heavy beetle under a domed shell of hardened glossy ink with "
            f"brush strokes painted across it, {ISOLATED}",
            1024,
            1024,
        ),
    },
    "oberflaeche": {
        "pult": (
            f"{FEDER}, a long dark wooden writing desk top seen from above, carved edges, an inkwell and a quill "
            f"in one corner, empty surface, wide banner, {UI}",
            1792,
            448,
        ),
        "schriftrolle": (
            f"{FEDER}, an open horizontal parchment scroll with wooden rollers at both ends, empty, {UI}, {ISOLATED}",
            1536,
            640,
        ),
        "zauberkarte": (
            f"{FEDER}, an empty card of aged parchment with an ornate pen-drawn border and a single ink drop "
            f"inside a ring at the top, {UI}, {ISOLATED}",
            768,
            1024,
        ),
        "notiz": (
            f"{FEDER}, an empty sheet of aged parchment with torn edges and an ornamental pen-drawn border, "
            f"pinned with a red wax seal, {UI}, {ISOLATED}",
            1024,
            1024,
        ),
        "siegel": (f"{FEDER}, a single round red wax seal seen from the front, embossed ink drop symbol, {UI}, {ISOLATED}", 1024, 1024),
    },
}
JOBS = (*TEXT_JOBS, "karte-a")


def token() -> str:
    for line in (ROOT / ".env").read_text().splitlines():
        if line.startswith("REPLICATE_API_TOKEN="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("REPLICATE_API_TOKEN missing in .env")


def request(method: str, url: str, body: dict | None = None, wait: bool = False) -> dict:
    headers = {
        "Authorization": f"Bearer {token()}",
        "Content-Type": "application/json",
        # Replicate's edge rejects Python's default user agent.
        "User-Agent": "typingame-art-probe",
    }
    if wait:
        headers["Prefer"] = "wait=60"
    data = json.dumps(body).encode() if body is not None else None
    # Accounts with little credit may only start a few predictions per minute; wait as told and try again.
    for _ in range(20):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data, headers, method=method), timeout=120) as res:
                return json.load(res)
        except urllib.error.HTTPError as error:
            if error.code != 429:
                raise
            time.sleep(float(error.headers.get("Retry-After") or 10))
    raise RuntimeError(f"{url}: still rate limited")


def predict(version: str, inputs: dict) -> tuple[bytes, dict]:
    """Runs one prediction to the end and returns the first output image and the finished prediction."""
    pred = request("POST", f"{API}/predictions", {"version": version, "input": inputs}, wait=True)
    while pred["status"] not in ("succeeded", "failed", "canceled"):
        time.sleep(3)
        pred = request("GET", pred["urls"]["get"])
    if pred["status"] != "succeeded":
        raise RuntimeError(f"{pred['id']}: {pred['status']}: {str(pred.get('error'))[:400]}")
    output = pred["output"]
    url = output[0] if isinstance(output, list) else output
    req = urllib.request.Request(url, headers={"User-Agent": "typingame-art-probe"})
    with urllib.request.urlopen(req, timeout=120) as res:
        return res.read(), pred


def data_uri(path: pathlib.Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


# --- karte-a: sketches of a generated map -------------------------------------------------------

MAP_SIZE = (1536, 560)  # the 1280 x 470 battlefield, scaled for the model (multiples of 16)


def export_maps(seeds: tuple[int, ...]) -> tuple[dict, list[dict]]:
    script = "import('vite').then((v) => v.runnerImport('./experiments/135-art-style/map-json.ts'))"
    raw = subprocess.run(["node", "-e", script, "--", *map(str, seeds)], cwd=ROOT, check=True, capture_output=True).stdout
    data = json.loads(raw)
    return data["layout"], data["maps"]


def round_corners(points: list[tuple[float, float]], radius: float) -> list[tuple[float, float]]:
    """The generator's path turns at right angles; round each corner with a quadratic curve (as in karte.ts)."""
    out = [points[0]]
    for a, p, b in zip(points, points[1:], points[2:]):
        r = min(radius, math.dist(a, p) / 2, math.dist(p, b) / 2)
        start = (p[0] + (a[0] - p[0]) * r / math.dist(a, p), p[1] + (a[1] - p[1]) * r / math.dist(a, p))
        end = (p[0] + (b[0] - p[0]) * r / math.dist(p, b), p[1] + (b[1] - p[1]) * r / math.dist(p, b))
        for s in range(11):
            t = s / 10
            out.append(
                (
                    (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * p[0] + t**2 * end[0],
                    (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * p[1] + t**2 * end[1],
                )
            )
    out.append(points[-1])
    return out


def scaled(m: dict, layout: dict) -> tuple[list[tuple[float, float]], float, float]:
    sx, sy = MAP_SIZE[0] / layout["width"], MAP_SIZE[1] / layout["deskTop"]
    road = [(x * sx, y * sy) for x, y in round_corners([(p["x"], p["y"]) for p in m["path"]], 70)]
    return road, sx, sy


def draw_road(draw: ImageDraw.ImageDraw, road: list[tuple[float, float]], width: int, fill: tuple) -> None:
    draw.line(road, fill=fill, width=width, joint="curve")
    r = width / 2
    for x, y in (road[0], road[-1]):
        draw.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def colour_sketch(m: dict, layout: dict) -> Image.Image:
    """Flat colour blocks where the map has meadow, road, clearings, trees and rocks; img2img paints over it."""
    road, sx, sy = scaled(m, layout)
    img = Image.new("RGB", MAP_SIZE, (163, 170, 120))
    draw = ImageDraw.Draw(img)
    rnd = random.Random(m["seed"])
    # Blotches, so low strengths do not come back as flat green.
    for _ in range(260):
        x, y, r = rnd.uniform(0, MAP_SIZE[0]), rnd.uniform(0, MAP_SIZE[1]), rnd.uniform(15, 60)
        shade = rnd.choice([(150, 162, 108), (176, 178, 128), (140, 150, 104), (184, 176, 136)])
        draw.ellipse((x - r, y - r * 0.7, x + r, y + r * 0.7), fill=shade)
    half = layout["pathHalf"] * sx
    draw_road(draw, road, int(2 * half + 8), (150, 122, 86))
    draw_road(draw, road, int(2 * half), (206, 182, 138))
    for site in m["sites"]:
        x, y, r = site["x"] * sx, site["y"] * sy, (layout["siteHalf"] + 16) * sx
        draw.ellipse((x - r, y - r * 0.8, x + r, y + r * 0.8), fill=(178, 148, 106))
    for prop in m["props"]:
        x, y = prop["x"] * sx, (prop["y"] + 32) * sy  # props stand on their foot point
        if prop["kind"] == "tree":
            for dx, dy, r in ((0, 0, 40), (-26, 12, 28), (24, 14, 30)):
                draw.ellipse((x + dx - r + 6, y + dy - r + 8, x + dx + r + 6, y + dy + r + 8), fill=(92, 104, 70))
                draw.ellipse((x + dx - r, y + dy - r, x + dx + r, y + dy + r), fill=(96, 122, 72))
        else:
            draw.ellipse((x - 24, y - 16, x + 24, y + 16), fill=(132, 130, 124))
    return img.filter(ImageFilter.GaussianBlur(3))


def line_sketch(m: dict, layout: dict) -> Image.Image:
    """Black outlines on white of road edges, clearings, tree crowns and rocks for the ControlNet."""
    road, sx, sy = scaled(m, layout)
    img = Image.new("RGB", MAP_SIZE, "white")
    draw = ImageDraw.Draw(img)
    half = layout["pathHalf"] * sx
    draw_road(draw, road, int(2 * half + 6), "black")
    draw_road(draw, road, int(2 * half - 6), "white")
    for site in m["sites"]:
        x, y, r = site["x"] * sx, site["y"] * sy, (layout["siteHalf"] + 16) * sx
        draw.ellipse((x - r, y - r * 0.8, x + r, y + r * 0.8), outline="black", width=4)
    for prop in m["props"]:
        x, y = prop["x"] * sx, (prop["y"] + 32) * sy
        if prop["kind"] == "tree":
            for dx, dy, r in ((0, 0, 40), (-26, 12, 28), (24, 14, 30)):
                draw.ellipse((x + dx - r, y + dy - r, x + dx + r, y + dy + r), outline="black", width=4)
        else:
            draw.ellipse((x - 24, y - 16, x + 24, y + 16), outline="black", width=4)
    return img


def overlay(image: pathlib.Path, m: dict, layout: dict) -> Image.Image:
    """The result with the real path centre line and build sites on top, to judge whether the painting fits."""
    road, sx, sy = scaled(m, layout)
    img = Image.open(image).convert("RGB").resize(MAP_SIZE)
    layer = Image.new("RGBA", MAP_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.line(road, fill=(200, 30, 30, 200), width=3, joint="curve")
    for site in m["sites"]:
        x, y, r = site["x"] * sx, site["y"] * sy, layout["siteHalf"] * sx
        draw.rectangle((x - r, y - r, x + r, y + r), outline=(30, 60, 200, 220), width=3)
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def map_jobs(layout: dict, maps: list[dict], controlnet_url: str | None) -> list[tuple[pathlib.Path, str, dict]]:
    jobs = []
    for m in maps:
        colour, lines = OUT / f"skizze-farbe-{m['seed']}.png", OUT / f"skizze-linie-{m['seed']}.png"
        colour_sketch(m, layout).save(colour)
        line_sketch(m, layout).save(lines)
        for ground, words in MAP_GROUNDS.items():
            prompt = f"{MAP}, {words}"
            for strength in STRENGTHS:
                for seed in SEEDS[:2]:
                    inputs = {"prompt": prompt, "image": data_uri(colour), "strength": strength, "seed": seed, "output_format": "png"}
                    jobs.append((OUT / f"karte-a-{ground}-{m['seed']}-img2img{int(strength * 100)}-{seed}.png", IMG2IMG, inputs))
            if controlnet_url is None:
                continue
            for control in CONTROLS:
                inputs = {
                    "prompt": prompt,
                    "controlnet_1": control,
                    "controlnet_1_image": f"{controlnet_url}/skizze-linie-{m['seed']}.png",
                    "controlnet_1_end": 0.75,
                    "lora_scale": 0,
                    "num_inference_steps": 9,
                    "seed": SEEDS[0],
                }
                jobs.append((OUT / f"karte-a-{ground}-{m['seed']}-{control}-{SEEDS[0]}.png", CONTROLNET, inputs))
    return jobs


# --- sheets ---------------------------------------------------------------------------------------


def sheet(paths: list[pathlib.Path], target: pathlib.Path, columns: int, cell: int = 384, images: list[Image.Image] | None = None) -> None:
    images = images or [Image.open(p).convert("RGB") for p in paths]
    font = ImageFont.load_default(16)
    cells = []
    for img, p in zip(images, paths):
        img = img.copy()
        img.thumbnail((cell * 2 if img.width > 1.5 * img.height else cell, cell))
        cells.append((img, p.stem))
    w = max(i.width for i, _ in cells)
    h = max(i.height for i, _ in cells) + 22
    rows = math.ceil(len(cells) / columns)
    out = Image.new("RGB", (columns * w, rows * h), "white")
    draw = ImageDraw.Draw(out)
    for n, (img, label) in enumerate(cells):
        x, y = n % columns * w, n // columns * h
        out.paste(img, (x, y))
        draw.text((x + 4, y + img.height + 2), label, fill="black", font=font)
    out.save(target)
    print("sheet", target.name, flush=True)


# --- main -----------------------------------------------------------------------------------------


def run(jobs: list[tuple[pathlib.Path, str, dict]], dry_run: bool) -> None:
    todo = [job for job in jobs if not job[0].exists()]
    print(f"{len(todo)} of {len(jobs)} images to generate", flush=True)
    if dry_run or not todo:
        return
    log = (OUT / "predictions.jsonl").open("a")

    def one(job: tuple[pathlib.Path, str, dict]) -> None:
        path, version, inputs = job
        image, pred = predict(version, inputs)
        path.write_bytes(image)
        logged = {k: (v[:40] + "…" if isinstance(v, str) and v.startswith("data:") else v) for k, v in inputs.items()}
        entry = {"file": path.name, "version": version, "id": pred["id"], "input": logged, "metrics": pred.get("metrics")}
        log.write(json.dumps(entry, ensure_ascii=False) + "\n")
        log.flush()
        print(path.name, f"{pred.get('metrics', {}).get('predict_time', 0):.1f}s", flush=True)

    with concurrent.futures.ThreadPoolExecutor(4) as pool:
        for future in concurrent.futures.as_completed([pool.submit(one, job) for job in todo]):
            if future.exception():
                print("FAILED", future.exception(), flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("jobs", nargs="+", choices=JOBS)
    parser.add_argument("--dry-run", action="store_true", help="only draw sketches and count images")
    parser.add_argument(
        "--controlnet-url",
        help="public URL of the folder holding the skizze-linie-*.png files; the ControlNet model only takes URLs",
    )
    args = parser.parse_args()
    OUT.mkdir(exist_ok=True)
    for name in args.jobs:
        if name == "karte-a":
            layout, maps = export_maps(MAP_SEEDS)
            run(map_jobs(layout, maps, args.controlnet_url), args.dry_run)
            for m in maps:
                results = sorted(OUT.glob(f"karte-a-*-{m['seed']}-*.png"))
                if results:
                    sheet(results, OUT / f"sheet-karte-a-{m['seed']}.png", 3, images=[overlay(p, m, layout) for p in results])
            continue
        jobs = [
            (OUT / f"{motif}-{seed}.png", TEXT2IMG, {"prompt": prompt, "width": w, "height": h, "seed": seed, "output_format": "png"})
            for motif, (prompt, w, h) in TEXT_JOBS[name].items()
            for seed in SEEDS
        ]
        run(jobs, args.dry_run)
        results = [p for p, _, _ in jobs if p.exists()]
        if results:
            sheet(results, OUT / f"sheet-{name}.png", len(SEEDS))


if __name__ == "__main__":
    main()
