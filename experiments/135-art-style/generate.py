"""Generate art style probes for issue #135 via a local LocalAI server (Z-Image Turbo).

Usage: python3 experiments/135-art-style/generate.py <round> [--url http://localhost:9901]
Writes <round>/<name>-<seed>.png next to this script; existing files are skipped.
Seeds are fixed, so the same prompt and seed reproduce the same image.
"""

import argparse
import base64
import json
import pathlib
import urllib.request

AQUARELL = (
    "loose watercolor painting on white paper, soft washes, pigment blooms, bleeding edges, "
    "muted earthy palette with indigo and ochre, storybook illustration"
)
FEDER = (
    "pen and ink drawing with watercolor wash, fine black ink outlines and hatching, "
    "transparent watercolor washes over the lines, muted earthy palette with indigo and ochre, "
    "old naturalist sketchbook illustration"
)
# Round 3 on: brighter colors, the pen style stays.
BUNT = (
    "pen and ink drawing with vivid watercolor, confident black ink outlines and light hatching, "
    "saturated transparent watercolor washes in sap green, ultramarine, vermilion and cadmium yellow, "
    "storybook illustration"
)
# No palette words and no "tile": both turned ground into colored checkerboards.
TEXTURE = (
    "watercolor painting with fine ink details, continuous natural ground surface filling the whole image "
    "edge to edge, seen from directly above, uniform density, no objects, no horizon, no border, no text"
)
ISOLATED = "single object, full view, centered, isolated on plain white paper, no frame, no border, no text"

# name -> (prompt, size)
ROUNDS: dict[str, dict[str, tuple[str, str]]] = {
    "runde1": {
        f"{motif}-{style}": (f"{style_prompt}, {motif_prompt}", "1024x1024")
        for style, style_prompt in {"aquarell": AQUARELL, "feder": FEDER}.items()
        for motif, motif_prompt in {
            "golem": "a small hostile golem made of crumpled paper pages and torn book leaves, ink stains, "
            "walking pose, single game character, full body, centered, isolated on plain white paper",
            "turm": "a slender wooden archer tower with an arrow slit, two stone snakes coiled around its base, "
            "a brass spyglass mounted on top, single game building, full view, centered, "
            "isolated on plain white paper",
            "karte": "top-down view of a fantasy battle map, a winding curved dirt road through meadows, "
            "a small river with a stone bridge, gentle hills, clusters of trees, ruined wall, "
            "seen from directly above, game map, no text",
        }.items()
    },
    "runde2": {
        **{
            f"golem-{style}": (
                f"{style_prompt}, a hostile golem built entirely from folded and crumpled paper sheets "
                "and torn book pages, blocky origami body, no fur, no animal, no face except two ink-blot eyes, "
                f"printed text visible on the paper, walking pose, game enemy character, {ISOLATED}",
                "1024x1024",
            )
            for style, style_prompt in {"aquarell": AQUARELL, "feder": FEDER}.items()
        },
        "turm-basis-feder": (
            f"{FEDER}, a medieval round stone archer tower with crenellations on top and narrow arrow slits, "
            f"small wooden door, sturdy and compact, side view, game building, {ISOLATED}",
            "1024x1024",
        ),
        "baustein-schlangen-feder": (
            f"{FEDER}, two coiled green vipers intertwined in a ring, seen from the side, ornament for a tower base, "
            f"{ISOLATED}",
            "1024x1024",
        ),
        "baustein-fernrohr-feder": (
            f"{FEDER}, an antique brass telescope on a small tripod mount, side view, {ISOLATED}",
            "1024x1024",
        ),
        "karte-aquarell": (
            f"{AQUARELL}, orthographic top-down view seen exactly from directly above, flat map of a meadow "
            "landscape, one winding curved dirt road crossing the whole image from left to right, a small river "
            "with a stone bridge where it meets the road, clusters of round tree crowns seen from above, "
            "a ruined wall, open grass areas, game battle map background, no horizon, no sky, no text",
            "1344x768",
        ),
    },
    "runde3": {
        "boden-wiese": (
            f"{BUNT}, seamless tileable texture, flat orthographic top-down view, evenly filled to all edges, "
            "no objects, no horizon, no border, no text, lush meadow grass with small wildflowers",
            "1024x1024",
        ),
        "boden-erde": (f"{TEXTURE}, dry warm brown earth with small pebbles and a few grass tufts", "1024x1024"),
        "weg": (f"{TEXTURE}, packed light sandy dirt with faint wheel ruts and small stones", "1024x1024"),
        "golem": (
            f"{BUNT}, a hostile golem built entirely from folded and crumpled paper sheets and torn book pages, "
            "blocky origami body, ink-blot eyes, printed text visible on the paper, deep indigo ink stains, "
            f"walking pose, game enemy character, {ISOLATED}",
            "1024x1024",
        ),
        "turm": (
            f"{BUNT}, a medieval round stone archer tower with crenellations on top and narrow arrow slits, "
            f"small red wooden door, blue pennant, sturdy and compact, side view, game building, {ISOLATED}",
            "1024x1024",
        ),
        "baum": (f"{BUNT}, a single round leafy oak tree, three-quarter top-down view, game map prop, {ISOLATED}", "1024x1024"),
        "baumgruppe": (
            f"{BUNT}, a small cluster of four leafy trees, three-quarter top-down view, game map prop, {ISOLATED}",
            "1024x1024",
        ),
        "felsen": (f"{BUNT}, a group of mossy grey boulders, three-quarter top-down view, game map prop, {ISOLATED}", "1024x1024"),
        "weiher": (
            f"{BUNT}, a small round pond with reeds and water lilies, three-quarter top-down view, game map prop, {ISOLATED}",
            "1024x1024",
        ),
        "ruine": (
            f"{BUNT}, a crumbling ruined stone wall with ivy, three-quarter top-down view, game map prop, {ISOLATED}",
            "1024x1024",
        ),
    },
}

SEEDS = (11, 22, 33)


def generate(url: str, prompt: str, size: str, seed: int) -> bytes:
    body = json.dumps(
        {"model": "Z-Image-Turbo", "prompt": prompt, "size": size, "seed": seed, "response_format": "b64_json"}
    ).encode()
    req = urllib.request.Request(f"{url}/v1/images/generations", body, {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=900) as res:
        data = json.load(res)
    if "data" not in data:
        raise RuntimeError(str(data)[:400])
    return base64.b64decode(data["data"][0]["b64_json"])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("round", choices=ROUNDS)
    parser.add_argument("--url", default="http://localhost:9901")
    args = parser.parse_args()
    out = pathlib.Path(__file__).parent / args.round
    out.mkdir(exist_ok=True)
    for name, (prompt, size) in ROUNDS[args.round].items():
        for seed in SEEDS:
            path = out / f"{name}-{seed}.png"
            if path.exists():
                continue
            path.write_bytes(generate(args.url, prompt, size, seed))
            print(path.name, flush=True)


if __name__ == "__main__":
    main()
