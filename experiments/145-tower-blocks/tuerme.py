"""Paint the tower bases (three kinds, stages I to III) and one building block per sentence word with FLUX.2 klein (#145).

Usage: python3 experiments/145-tower-blocks/tuerme.py <job>... [--dry-run]
  stufe1      the base of each tower kind, stage I (jagd from the chosen Z-Image tower, the others from style references)
  stufe2      stage II from the chosen stage I picture of each kind (needs CHOSEN["stufe1"])
  stufe3      stage III from the chosen stage II picture (needs CHOSEN["stufe2"])
  bausteine   one building block per word, from style references
Writes bilder/<name>-<seed>.png, bilder/predictions.jsonl and bilder/sheet-<job>.jpg. Single pictures stay out of git.
Model: FLUX.2 klein 4B base (Apache 2.0) on Replicate; references come from experiments/143-style-lora/kandidaten.
"""

import argparse
import pathlib
import sys

from PIL import Image

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "135-art-style"))
from replicate import BLANK, KLEIN_BASE, jpeg_uri, run, sheet  # noqa: E402

OUT = HERE / "bilder"
CANDIDATES = HERE.parent / "143-style-lora" / "kandidaten"
SEEDS = (11, 22)

PLAIN = (
    "Plain tower only: no flags, no banners, no fire, no snakes, no emblems, no weapons, nothing attached, so ornaments "
    "can be added later. Single object, centered, plain white background."
)
STYLE = "in exactly the same hand-painted watercolor cartoon style as the reference images, bold dark outlines"
TOWER_REFS = ("turm-pfeil-11", "turm-magier-22", "baum-22")
BLOCK_REFS = ("baustein-fernrohr-11", "baustein-flammen-11", "baustein-schlangen-22")

# Stage I of each kind: (references, prompt). The arrow tower is the chosen candidate of #143 itself, repainted plain.
STAGE1 = {
    "jagd": (("turm-pfeil-11",), f"The same round stone archer tower with crenellations and arrow slits, a little shorter. {PLAIN}"),
    "eisnadel": (TOWER_REFS, f"A new tower {STYLE}: a round tower of pale blue ice blocks with a crown of short ice spikes. {PLAIN}"),
    "viper": (TOWER_REFS, f"A new tower {STYLE}: a round tower of mossy dark green stone with a squat bronze cauldron of green poison on top. {PLAIN}"),
}
# Asked for "one storey taller" in a square picture, klein kept the proportions. Asked for a whole new storey in
# portrait format, it made thin spires and lost the round shape. Now: a moderate step that keeps the shape.
GROW = {
    "stufe2": "The same tower, about a quarter taller and more robust: it now stands on a broad round stone base with "
    "two steps, and its top is a little wider. Keep it round and stout with the same proportions, design, colors and style.",
    "stufe3": "The same tower, about a quarter taller again and grander: strong buttresses around its foot and a second "
    "ring of stones below its top. Keep it round and stout with the same proportions, design, colors and style.",
}
GROW_ASPECT = {"stufe2": "4:5", "stufe3": "4:5"}
# Picked by eye from the sheets; a stage builds on the picture chosen for the one before.
CHOSEN: dict[str, dict[str, str]] = {
    "stufe1": {"jagd": "jagd-1-11", "eisnadel": "eisnadel-1-11", "viper": "viper-1-22"},
    "stufe2": {"jagd": "jagd-2-sockel-11", "eisnadel": "eisnadel-2-sockel-11", "viper": "viper-2-sockel-22"},
}

BLOCKS = {
    "wilde": "two small colorful pennant flags fluttering on thin wooden poles, crossed, an ornament",
    "schwere": "a straight wide horizontal band of dark iron with big round rivets, seen straight from the front, a strip",
    "weite": "an antique brass telescope on a small swivel mount, pointing up to the right",
    "frostige": "a straight horizontal row of icicles hanging below a thin strip of snow and frost, seen from the front",
    "flammende": "a round iron fire bowl on three short legs with bright stylized flames rising from it",
    "der-viper": "a green viper coiled into a ring, its head raised, seen from the front, an ornament",
    "im-morgengrauen": "a round golden sun disc emblem with short rays, an ornament",
    "um-mitternacht": "a silver crescent moon emblem with three small stars, an ornament",
}


def jobs_for(name: str) -> list[tuple[pathlib.Path, str, dict]]:
    def job(file: str, refs: tuple[pathlib.Path, ...], prompt: str, seed: int, aspect: str = "1:1"):
        inputs = {"prompt": prompt, "seed": seed, "guidance": 4, "output_format": "png", "images": [jpeg_uri(r) for r in refs], "aspect_ratio": aspect}
        return OUT / f"{file}-{seed}.png", KLEIN_BASE, inputs

    jobs = []
    if name == "stufe1":
        for kind, (refs, prompt) in STAGE1.items():
            jobs += [job(f"{kind}-1", tuple(CANDIDATES / f"{r}.png" for r in refs), prompt, seed) for seed in SEEDS]
    elif name in GROW:
        before = "stufe1" if name == "stufe2" else "stufe2"
        for kind, picked in CHOSEN[before].items():
            jobs += [job(f"{kind}-{name[-1]}-sockel", (OUT / f"{picked}.png",), GROW[name] + " " + PLAIN, seed, GROW_ASPECT[name]) for seed in SEEDS]
    elif name == "bausteine":
        refs = tuple(CANDIDATES / f"{r}.png" for r in BLOCK_REFS)
        for word, motif in BLOCKS.items():
            prompt = f"A new game ornament {STYLE}: {motif}. Single object, alone, centered, plain white background, nothing else."
            jobs += [job(f"baustein-{word}", refs, prompt, seed) for seed in SEEDS]
    return jobs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("jobs", nargs="+", choices=["stufe1", "stufe2", "stufe3", "bausteine"])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    OUT.mkdir(exist_ok=True)
    for name in args.jobs:
        jobs = jobs_for(name)
        run(jobs, args.dry_run)
        paths = [p for p, _, _ in jobs if p.exists()]
        if paths:
            sheet(paths, OUT / f"sheet-{name}.jpg", 2 * len(SEEDS), cell=300, images=[Image.open(p).convert("RGB") if p != BLANK else None for p in paths])


if __name__ == "__main__":
    main()
