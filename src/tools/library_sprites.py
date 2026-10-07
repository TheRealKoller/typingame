#!/usr/bin/env python3
"""Draws the burnt bookshelves and the paper golems (issue #83).

Deterministic: every random choice comes from a seeded ``random.Random``,
so running the script again writes byte-identical PNGs.

The burnt shelves stand beside the library ruin on the world map; battles
show painted maps instead (#151). They are drawn at 32 px per tile and scaled
×2 (nearest neighbour) like the Foozle "Lucifer" tiles.
The paper golems are drawn at native 64 × 64 per frame like the Spire enemies
(9 rows: idle, walk, death × down, up, side; side faces right).

Usage: python3 src/tools/library_sprites.py
Writes src/assets/library/*.png and the review sheet
docs/images/bibliothek-entwurf.png.
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src" / "assets" / "library"
CONTACT = ROOT / "docs" / "images" / "bibliothek-entwurf.png"

Color = tuple[int, int, int, int]


def hexc(value: str) -> Color:
    value = value.lstrip("#")
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), 255)


# --- Palettes ---------------------------------------------------------------

# Lucifer-style shelves: near-black outline and the brown wood of the tileset doors.
PROP_OUTLINE = hexc("0f0d0c")
WOOD_DARK = hexc("28221f")
WOOD = hexc("413325")
WOOD_LIGHT = hexc("63492c")
WOOD_HIGH = hexc("82633b")
SHELF_BACK = hexc("1a1715")
PAPER = hexc("e8dfc8")
PAPER_MID = hexc("c4b796")
GOLD = hexc("d1ca80")

# Book colours as (light, base, dark).
BOOKS = [
    (hexc("c4503f"), hexc("922c26"), hexc("5e1c19")),
    (hexc("6f9a4f"), hexc("4a6e3a"), hexc("2c4426")),
    (hexc("5a7fb0"), hexc("34507a"), hexc("1f3050")),
    (hexc("d1ad5a"), hexc("a07a32"), hexc("634a20")),
    (hexc("8a669e"), hexc("5e4070"), hexc("3a2846")),
    (hexc("a87454"), hexc("7a4e34"), hexc("4c3020")),
]

# Burnt state.
CHAR_DARK = hexc("161212")
CHAR = hexc("241d1a")
CHAR_LIGHT = hexc("3a2e27")
ASH = hexc("5a514c")
EMBER = hexc("e0602a")
EMBER_HOT = hexc("f2a33a")

# Golem (Spire style): Spire's violet-black outline and a cool magic glow.
G_OUTLINE = hexc("1f1833")
G_PAPER = hexc("f4eddc")
G_PAPER_MID = hexc("d8ccaf")
G_PAPER_DARK = hexc("a8967a")
G_INK = hexc("3e3560")
G_GLOW = hexc("5fe1f0")
G_SEAL = hexc("c43a3a")
G_SEAL_DARK = hexc("7e1f2a")
G_LEATHER = hexc("8a503e")
G_LEATHER_LIGHT = hexc("b58057")
G_LEATHER_DARK = hexc("5a3030")

CLEAR: Color = (0, 0, 0, 0)


# --- Pixel helpers ----------------------------------------------------------


def new(w: int, h: int) -> Image.Image:
    return Image.new("RGBA", (w, h), CLEAR)


def outline(layer: Image.Image, color: Color) -> Image.Image:
    """Adds a 1-px outline (4-neighbourhood) around the opaque pixels."""
    w, h = layer.size
    src = layer.load()
    out = layer.copy()
    dst = out.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3]:
                    dst[x, y] = color
                    break
    return out


class Part:
    """A layer the size of the canvas; painted, outlined, then composited."""

    def __init__(self, canvas: Image.Image):
        self.canvas = canvas
        self.img = new(*canvas.size)
        self.px = self.img.load()
        self.w, self.h = canvas.size

    def put(self, x: int, y: int, c: Color) -> None:
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = c

    def rect(self, x0: int, y0: int, x1: int, y1: int, c: Color) -> None:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(x, y, c)

    def done(self, line: Color | None) -> None:
        img = outline(self.img, line) if line else self.img
        self.canvas.alpha_composite(img)


def scale(img: Image.Image, factor: int = 2) -> Image.Image:
    return img.resize((img.width * factor, img.height * factor), Image.NEAREST)


# --- Bookshelves (32 px grid, scaled ×2) -----------------------------------


def draw_book_row(p: Part, rng: random.Random, x0: int, x1: int, floor: int, top: int) -> None:
    """Fills one shelf compartment with upright books, gaps and a lying book."""
    x = x0
    while x <= x1:
        roll = rng.random()
        if roll < 0.08 and x < x1 - 3:
            x += rng.randint(1, 2)  # gap
            continue
        if roll < 0.16 and x <= x1 - 5:
            light, base, dark = rng.choice(BOOKS)  # lying book
            width = rng.randint(4, min(6, x1 - x + 1))
            p.rect(x, floor - 1, x + width - 1, floor, base)
            p.rect(x, floor - 1, x + width - 1, floor - 1, light)
            p.put(x + width - 1, floor, PAPER_MID)
            x += width
            continue
        width = 2 if rng.random() < 0.7 else 3
        width = min(width, x1 - x + 1)
        height = rng.randint(max(4, floor - top - 3), floor - top)
        light, base, dark = rng.choice(BOOKS)
        y0 = floor - height + 1
        p.rect(x, y0, x + width - 1, floor, base)
        p.rect(x, y0, x, floor, light)
        if width == 3:
            p.rect(x + 2, y0, x + 2, floor, dark)
        p.rect(x, y0, x + width - 1, y0, dark)  # dark top edge separates books
        if height > 5:
            band = y0 + 2 if rng.random() < 0.5 else floor - 2
            p.rect(x, band, x + width - 1, band, GOLD)
        x += width


def bookshelf(seed: int, burnt: bool = False) -> Image.Image:
    """32 × 64 bookshelf with cornice, four compartments and a plinth."""
    rng = random.Random(seed)
    img = new(32, 64)
    p = Part(img)
    # Carcass.
    p.rect(1, 2, 30, 62, WOOD)
    p.rect(0, 1, 31, 4, WOOD_LIGHT)  # cornice top
    p.rect(0, 1, 31, 1, WOOD_HIGH)
    p.rect(0, 5, 31, 5, WOOD_DARK)
    p.rect(1, 2, 1, 62, WOOD_LIGHT)
    p.rect(30, 2, 30, 62, WOOD_DARK)
    p.rect(0, 59, 31, 62, WOOD_LIGHT)  # plinth
    p.rect(0, 62, 31, 62, WOOD_DARK)
    shelves = [(7, 18), (21, 32), (35, 46), (49, 57)]
    for top, floor in shelves:
        p.rect(3, top, 28, floor, SHELF_BACK)
        p.rect(3, floor + 1, 28, floor + 1, WOOD_HIGH)  # shelf board edge
        p.rect(3, floor + 2, 28, floor + 2, WOOD_DARK)
    for top, floor in shelves:
        draw_book_row(p, rng, 3, 28, floor, top + 1)
    # Wood grain flecks on the side posts.
    for _ in range(6):
        p.put(rng.choice((2, 29)), rng.randint(8, 56), WOOD_DARK)
    if burnt:
        burn(p, rng, top_ragged=True)
    p.done(PROP_OUTLINE)
    return img


def burn(p: Part, rng: random.Random, top_ragged: bool) -> None:
    """Chars a painted part: wood → charcoal, books → ash stubs, embers."""
    char_map = {
        WOOD_HIGH: CHAR_LIGHT,
        WOOD_LIGHT: CHAR_LIGHT,
        WOOD: CHAR,
        WOOD_DARK: CHAR_DARK,
        SHELF_BACK: CHAR_DARK,
        GOLD: ASH,
        PAPER: ASH,
        PAPER_MID: ASH,
    }
    book_colors = {c for trio in BOOKS for c in trio}
    for y in range(p.h):
        for x in range(p.w):
            c = p.px[x, y]
            if not c[3]:
                continue
            if c in book_colors:
                # Books: most burnt down to stubs, a few dark remains.
                p.px[x, y] = CHAR if rng.random() < 0.6 else CHAR_LIGHT
            else:
                p.px[x, y] = char_map.get(c, c)
    # Burn books from the top: clear upper part of each compartment.
    for y in range(p.h):
        for x in range(3, p.w - 3):
            above = p.px[x, y - 1] if y > 0 else CLEAR
            if p.px[x, y] in (CHAR, CHAR_LIGHT) and above == CHAR_DARK and rng.random() < 0.55:
                p.px[x, y] = CHAR_DARK
    if top_ragged:
        for x in range(p.w):
            for y in range(0, rng.randint(0, 3) if rng.random() < 0.6 else 0):
                p.px[x, y] = CLEAR
    # Embers along edges and shelf boards.
    for _ in range(int(p.w * p.h / 70)):
        x, y = rng.randrange(p.w), rng.randrange(p.h)
        if p.px[x, y][3] and p.px[x, y] != CHAR_DARK:
            p.px[x, y] = EMBER_HOT if rng.random() < 0.35 else EMBER


# --- Paper golem (native 64 × 64 frames) -----------------------------------

FRAME = 64
IDLE_FRAMES = 6
WALK_FRAMES = 8
DEATH_FRAMES = 8


class GolemSize:
    def __init__(self, large: bool):
        self.large = large
        self.torso_w = 22 if large else 18
        self.torso_h = 16 if large else 13
        self.head = 13 if large else 11
        self.leg_h = 9 if large else 8
        self.arm_h = 14 if large else 11


def text_lines(p: Part, x0: int, x1: int, y0: int, y1: int, seed: int, color: Color) -> None:
    """Short ink dashes like handwriting; deterministic per seed."""
    rng = random.Random(seed)
    for y in range(y0, y1 + 1, 2):
        x = x0
        while x < x1:
            n = rng.randint(1, 3)
            p.rect(x, y, min(x + n - 1, x1), y, color)
            x += n + 1


def draw_golem(img: Image.Image, view: str, s: GolemSize, swing: float, lift_l: int,
               lift_r: int, bob: int, flap: int) -> None:
    """Draws one golem pose; feet rest on y = 47."""
    cx = 32
    ground = 47
    leg_top = ground - s.leg_h + 1
    torso_bot = leg_top + 1 - bob
    torso_top = torso_bot - s.torso_h + 1
    head_bot = torso_top
    head_top = head_bot - s.head + 1
    arm_dy = round(swing)

    def leg(p: Part, x: int, lift: int, shade: bool) -> None:
        top = leg_top - bob
        bottom = ground - lift
        light, base, dark = (G_PAPER_MID, G_PAPER_DARK, G_PAPER_DARK) if shade else (G_PAPER, G_PAPER_MID, G_PAPER_DARK)
        p.rect(x, top, x + 3, bottom, base)
        p.rect(x, top, x, bottom, light)
        p.rect(x, bottom, x + 4, bottom, dark)  # folded foot

    def arm(p: Part, x: int, dy: int, shade: bool) -> None:
        top = torso_top + 2 + dy
        bottom = top + s.arm_h - 1
        if shade:
            p.rect(x, top, x + 3, bottom, G_PAPER_DARK)
            p.rect(x, top, x, bottom, G_PAPER_MID)
        else:
            p.rect(x, top, x + 3, bottom, G_PAPER_MID)
            p.rect(x, top, x, bottom, G_PAPER)
            p.rect(x + 3, top, x + 3, bottom, G_PAPER_DARK)
        # Rolled-up scroll end with an ink spiral.
        p.rect(x, bottom - 1, x + 3, bottom, G_PAPER)
        p.put(x + 1, bottom, G_INK)
        p.put(x + 2, bottom - 1, G_INK)
        if s.large:
            p.rect(x, top + 3, x + 3, top + 4, G_LEATHER)  # leather cuff

    if view in ("down", "up"):
        half = s.torso_w // 2
        tx0, tx1 = cx - half, cx + half - 1
        legs = Part(img)
        leg(legs, cx - 5, lift_l, False)
        leg(legs, cx + 1, lift_r, False)
        legs.done(G_OUTLINE)
        arms = Part(img)
        arm(arms, tx0 - 5, arm_dy, False)
        arm(arms, tx1 + 2, -arm_dy, False)
        arms.done(G_OUTLINE)
        body = Part(img)
        # Back sheet sticking out (stacked pages), then the front sheet.
        body.rect(tx0 + 1, torso_top - 1, tx1 + 1, torso_bot - 1, G_PAPER_DARK)
        body.rect(tx0, torso_top, tx1, torso_bot, G_PAPER)
        body.rect(tx1, torso_top, tx1, torso_bot, G_PAPER_MID)
        body.rect(tx0, torso_bot, tx1, torso_bot, G_PAPER_MID)
        if view == "down":
            text_lines(body, tx0 + 2, tx1 - 2, torso_top + 2, torso_bot - 4, 7 + s.torso_w, G_INK)
            body.rect(cx - 1, torso_bot - 2, cx, torso_bot - 1, G_SEAL)
            body.put(cx, torso_bot - 1, G_SEAL_DARK)
        else:
            # Back: diagonal fold creases.
            for i in range(s.torso_h - 2):
                body.put(tx0 + 1 + i * (s.torso_w - 2) // (s.torso_h - 2), torso_top + 1 + i, G_PAPER_MID)
                body.put(tx1 - 1 - i * (s.torso_w - 2) // (s.torso_h - 2), torso_top + 1 + i, G_PAPER_MID)
        if s.large:
            # Book-cover shoulder plates.
            for x in (tx0 - 2, tx1 - 3):
                body.rect(x, torso_top - 1, x + 5, torso_top + 2, G_LEATHER)
                body.rect(x, torso_top - 1, x + 5, torso_top - 1, G_LEATHER_LIGHT)
                body.rect(x, torso_top + 2, x + 5, torso_top + 2, G_LEATHER_DARK)
                body.put(x + 2, torso_top, GOLD)
        body.done(G_OUTLINE)
        head = Part(img)
        hh = s.head // 2
        hx0, hx1 = cx - hh, cx + hh - 1
        head.rect(hx0, head_top, hx1, head_bot, G_PAPER)
        head.rect(hx1, head_top, hx1, head_bot, G_PAPER_MID)
        head.rect(hx0, head_bot, hx1, head_bot, G_PAPER_MID)
        # Folded corners like an origami box; one flutters in idle.
        head.put(hx0, head_top, CLEAR)
        head.put(hx1, head_top, CLEAR)
        head.rect(hx0, head_top + 1, hx0 + 2, head_top + 1, G_PAPER_MID)
        head.put(hx0 + 1, head_top + 2, G_PAPER_MID)
        if flap:
            head.put(hx1 - 1, head_top - 1, G_PAPER)
            head.put(hx1, head_top - 1, G_PAPER)
        if view == "down":
            ey = head_top + s.head // 2
            for ex in (cx - 3, cx + 1):
                head.rect(ex, ey, ex + 1, ey, G_GLOW)
                head.rect(ex, ey + 1, ex + 1, ey + 1, G_INK)
            head.rect(cx - 1, ey + 3, cx, ey + 3, G_INK)  # little ink mouth
        else:
            head.rect(cx - 1, head_top + 2, cx, head_bot - 2, G_PAPER_MID)  # seam
        head.done(G_OUTLINE)
        return

    # Side view, facing right.
    tw = s.torso_w - 4
    tx0 = cx - tw // 2
    tx1 = tx0 + tw - 1
    stride = swing
    back = Part(img)
    leg(back, cx - 2 - round(stride), lift_r, True)
    arm(back, cx - 2 + round(stride * 1.2), 0, True)
    back.done(G_OUTLINE)
    front_leg = Part(img)
    leg(front_leg, cx - 2 + round(stride), lift_l, False)
    front_leg.done(G_OUTLINE)
    body = Part(img)
    body.rect(tx0 - 1, torso_top + 1, tx1 - 1, torso_bot - 1, G_PAPER_DARK)
    body.rect(tx0, torso_top, tx1, torso_bot, G_PAPER)
    body.rect(tx0, torso_bot, tx1, torso_bot, G_PAPER_MID)
    body.rect(tx0, torso_top, tx0, torso_bot, G_PAPER_MID)
    text_lines(body, tx0 + 2, tx1 - 1, torso_top + 2, torso_bot - 3, 11 + s.torso_w, G_INK)
    if s.large:
        body.rect(tx0 + 1, torso_top - 1, tx1 - 1, torso_top + 2, G_LEATHER)
        body.rect(tx0 + 1, torso_top - 1, tx1 - 1, torso_top - 1, G_LEATHER_LIGHT)
        body.put(tx0 + 3, torso_top, GOLD)
    body.done(G_OUTLINE)
    head = Part(img)
    hx0 = cx - s.head // 2 + 1
    hx1 = hx0 + s.head - 2
    head.rect(hx0, head_top, hx1, head_bot, G_PAPER)
    head.rect(hx0, head_top, hx0, head_bot, G_PAPER_MID)
    head.rect(hx0, head_bot, hx1, head_bot, G_PAPER_MID)
    head.put(hx0, head_top, CLEAR)
    head.put(hx1, head_top, CLEAR)
    head.put(hx1 + 1, head_top + s.head // 2 + 1, G_PAPER)  # folded nose tip
    head.rect(hx0 + 1, head_top + 1, hx0 + 2, head_top + 1, G_PAPER_MID)
    if flap:
        head.put(hx0, head_top - 1, G_PAPER)
        head.put(hx0 + 1, head_top - 1, G_PAPER)
    ey = head_top + s.head // 2
    head.rect(hx1 - 2, ey, hx1 - 1, ey, G_GLOW)
    head.rect(hx1 - 2, ey + 1, hx1 - 1, ey + 1, G_INK)
    head.done(G_OUTLINE)
    front_arm = Part(img)
    arm(front_arm, cx - 1 - round(stride * 1.2), 0, False)
    front_arm.done(G_OUTLINE)


def golem_pose(view: str, s: GolemSize, anim: str, i: int) -> Image.Image:
    img = new(FRAME, FRAME)
    if anim == "idle":
        bob = (0, 0, 1, 1, 1, 0)[i]
        flap = i in (2, 3)
        sway = (0, 0, 1, 1, 1, 0)[i] if view != "side" else 0.0
        draw_golem(img, view, s, sway, 0, 0, bob, flap)
    else:  # walk
        t = i / WALK_FRAMES * 2 * math.pi
        sn = math.sin(t)
        lift_l = max(0, round(2 * sn))
        lift_r = max(0, round(-2 * sn))
        bob = 1 if abs(math.cos(t)) > 0.7 else 0
        if view == "side":
            draw_golem(img, view, s, 3 * math.cos(t), lift_l, lift_r, bob, False)
        else:
            draw_golem(img, view, s, 1.6 * sn, lift_l, lift_r, bob, False)
    return img


def golem_death(view: str, s: GolemSize, i: int, seed: int) -> Image.Image:
    """Crumples (squash + tilt) then tears into fluttering scraps."""
    standing = golem_pose(view, s, "idle", 0)
    img = new(FRAME, FRAME)
    ground = 48
    if i < 3:
        squash = (0.9, 0.72, 0.55)[i]
        widen = (1.04, 1.1, 1.18)[i]
        box = standing.getbbox()
        part = standing.crop(box)
        w = max(1, round(part.width * widen))
        h = max(1, round(part.height * squash))
        part = part.resize((w, h), Image.NEAREST)
        if i >= 1:
            part = part.rotate((-6, -6, -12)[i] if view != "side" else (0, 8, 14)[i],
                               resample=Image.NEAREST, expand=True)
        img.alpha_composite(part, (32 - part.width // 2, ground - part.height))
        if i == 2:
            ink = Part(img)
            for dx in (-4, 3):
                ink.put(32 + dx, ground - part.height - 2, G_INK)
            ink.done(None)
        return img
    # Torn apart: a shrinking crumpled ball, scraps fly up and settle on the floor.
    rng = random.Random(seed)
    t = (i - 2) / (DEATH_FRAMES - 2)  # 0.2 … 1
    if i == 3:
        box = standing.getbbox()
        ball = standing.crop(box)
        ball = ball.resize((max(1, round(ball.width * 0.8)), max(1, round(ball.height * 0.38))), Image.NEAREST)
        img.alpha_composite(ball, (32 - ball.width // 2, ground - ball.height))
    count = 14 if s.large else 11
    for k in range(count):
        sx = 32 + rng.randint(-7, 7)
        sy = ground - 6 - rng.randint(0, 8)
        vx = rng.uniform(-18, 18)
        vy = rng.uniform(-9, -4)
        size = rng.choice((3, 4, 4, 5)) + (1 if s.large else 0)
        x = sx + vx * t
        y = sy + vy * t * 4 + 30 * t * t
        landed = y >= ground - 2
        if i == DEATH_FRAMES - 1 and k % 4 == 3:
            continue  # last frame: a few scraps blown away
        p = Part(img)
        xi = round(x)
        color = (G_PAPER, G_PAPER_MID, G_PAPER, G_PAPER_DARK)[k % 4]
        if landed:
            # Lying flat on the floor.
            p.rect(xi, ground - 2, xi + size, ground - 1, color)
            p.put(xi + 1 + k % (size - 1), ground - 2, G_INK)
        else:
            yi = round(y)
            if (k + i) % 2:  # fluttering: the sheet turns edge-on and back
                p.rect(xi, yi, xi + size, yi + 2, color)
                p.rect(xi + 1, yi + 1, xi + size - 2, yi + 1, G_INK)
            else:
                p.rect(xi, yi, xi + 2, yi + size, color)
                p.put(xi + 1, yi + 1, G_INK)
        p.done(G_OUTLINE)
    if i < 6:
        wisp = Part(img)  # the binding magic escaping
        for k in range(3):
            wisp.put(32 + (k - 1) * 3, ground - 16 - (i - 3) * 5 - k, G_GLOW)
        wisp.done(None)
    return img


def golem_sheet(large: bool) -> Image.Image:
    s = GolemSize(large)
    columns = WALK_FRAMES
    sheet = new(FRAME * columns, FRAME * 9)
    views = ("down", "up", "side")
    for v, view in enumerate(views):
        for i in range(IDLE_FRAMES):
            sheet.alpha_composite(golem_pose(view, s, "idle", i), (i * FRAME, v * FRAME))
        for i in range(WALK_FRAMES):
            sheet.alpha_composite(golem_pose(view, s, "walk", i), (i * FRAME, (3 + v) * FRAME))
        for i in range(DEATH_FRAMES):
            sheet.alpha_composite(golem_death(view, s, i, 100 + v), (i * FRAME, (6 + v) * FRAME))
    return sheet


# --- Contact sheet ----------------------------------------------------------


def label(dst: Image.Image, xy: tuple[int, int], text: str) -> None:
    ImageDraw.Draw(dst).text(xy, text, fill=(230, 220, 200, 255))


def contact_sheet(shelves_burnt: Image.Image, golem: Image.Image, large: Image.Image) -> Image.Image:
    sheet = Image.new("RGBA", (1340, 170 + 2 * (6 * 128 + 30)), (24, 20, 30, 255))
    label(sheet, (20, 6), "Verbrannte Regale (Spielgroesse)")
    sheet.alpha_composite(shelves_burnt, (20, 24))
    y = 170
    for name, img in (("Papiergolem", golem), ("Papiergolem gross", large)):
        label(sheet, (20, y), f"{name}: Zeilen idle/walk/death x unten/oben/seite, x2")
        big = scale(img)
        sheet.alpha_composite(big.crop((0, 3 * 128, 1024, 9 * 128)), (20, y + 16))
        # Game-scale walk strip next to it.
        label(sheet, (1060, y), "1:1")
        sheet.alpha_composite(img.crop((0, 3 * 64, 256, 9 * 64)), (1060, y + 16))
        y += 6 * 128 + 30
    return sheet


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    shelves_burnt = new(96, 64)
    for k in range(3):
        shelves_burnt.alpha_composite(bookshelf(11 + k, burnt=True), (k * 32, 0))
    shelves_burnt = scale(shelves_burnt)
    golem = golem_sheet(large=False)
    large = golem_sheet(large=True)
    files = {
        "bookshelf-burnt.png": shelves_burnt,
        "paper-golem.png": golem,
        "paper-golem-large.png": large,
    }
    for name, img in files.items():
        img.save(OUT / name, optimize=False)
    CONTACT.parent.mkdir(parents=True, exist_ok=True)
    contact_sheet(shelves_burnt, golem, large).convert("RGB").save(CONTACT, optimize=False)


if __name__ == "__main__":
    main()
