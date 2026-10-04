#!/usr/bin/env python3
"""Draws the library props and paper golems for the tutorial (issue #83).

Deterministic: every random choice comes from a seeded ``random.Random``,
so running the script again writes byte-identical PNGs.

Props are drawn at 32 px per tile and scaled ×2 (nearest neighbour) so their
pixel density matches the Foozle "Lucifer" tiles, which the game shows at ×2.
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
LUCIFER = ROOT / "src" / "assets" / "lucifer"
TRAPS = ROOT / "src" / "assets" / "traps"
CONTACT = ROOT / "docs" / "images" / "bibliothek-entwurf.png"

Color = tuple[int, int, int, int]


def hexc(value: str) -> Color:
    value = value.lstrip("#")
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), 255)


# --- Palettes ---------------------------------------------------------------

# Lucifer props: near-black outline and the brown wood of the tileset doors.
PROP_OUTLINE = hexc("0f0d0c")
WOOD_DARK = hexc("28221f")
WOOD = hexc("413325")
WOOD_LIGHT = hexc("63492c")
WOOD_HIGH = hexc("82633b")
SHELF_BACK = hexc("1a1715")
PAPER = hexc("e8dfc8")
PAPER_MID = hexc("c4b796")
PAPER_DARK = hexc("8f8064")
INK = hexc("3a3242")
GOLD = hexc("d1ca80")
RED = hexc("922c26")
FLAME_OUT = hexc("e0602a")
FLAME_MID = hexc("f2a33a")
FLAME_CORE = hexc("ffe07a")

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

    def shaded(self, x0, y0, x1, y1, light, base, dark) -> None:
        self.rect(x0, y0, x1, y1, base)
        self.rect(x0, y0, x1, y0, light)
        self.rect(x0, y0, x0, y1, light)
        self.rect(x0, y1, x1, y1, dark)
        self.rect(x1, y0, x1, y1, dark)

    def done(self, line: Color | None) -> None:
        img = outline(self.img, line) if line else self.img
        self.canvas.alpha_composite(img)


def scale(img: Image.Image, factor: int = 2) -> Image.Image:
    return img.resize((img.width * factor, img.height * factor), Image.NEAREST)


# --- Props (32 px grid, scaled ×2) -----------------------------------------


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


def lectern() -> Image.Image:
    img = new(32, 32)
    back = Part(img)
    # Foot and post.
    back.shaded(9, 27, 22, 29, WOOD_LIGHT, WOOD, WOOD_DARK)
    back.shaded(14, 15, 17, 27, WOOD_LIGHT, WOOD, WOOD_DARK)
    back.done(PROP_OUTLINE)
    top = Part(img)
    # Slanted reading board seen from the front: wider at the bottom edge.
    for i, y in enumerate(range(8, 17)):
        inset = max(0, 2 - i // 3)
        top.rect(5 + inset, y, 26 - inset, y, WOOD)
    top.rect(5, 15, 26, 16, WOOD_DARK)
    top.rect(7, 8, 24, 8, WOOD_LIGHT)
    top.done(PROP_OUTLINE)
    book = Part(img)
    # Open book: two pages and a spine, lines of text, red ribbon.
    book.rect(7, 5, 15, 13, PAPER)
    book.rect(16, 5, 24, 13, PAPER)
    book.rect(15, 5, 16, 13, PAPER_MID)
    book.rect(7, 13, 24, 13, PAPER_DARK)
    for y in (7, 9, 11):
        book.rect(9, y, 13, y, PAPER_DARK)
        book.rect(18, y, 22 if y != 11 else 20, y, PAPER_DARK)
    book.rect(6, 6, 6, 14, RED)  # cover peeking out
    book.rect(25, 6, 25, 14, RED)
    book.rect(19, 14, 19, 17, RED)  # ribbon
    book.done(PROP_OUTLINE)
    return img


def candle(p: Part, x: int, y: int) -> None:
    """Candle with its base at (x, y); 2 px wide."""
    p.rect(x, y - 4, x + 1, y, PAPER)
    p.rect(x + 1, y - 4, x + 1, y, PAPER_MID)
    p.rect(x - 1, y, x + 2, y, GOLD)
    p.put(x, y - 5, FLAME_MID)
    p.put(x, y - 6, FLAME_CORE)
    p.put(x + 1, y - 5, FLAME_OUT)


def reading_desk() -> Image.Image:
    img = new(64, 32)
    desk = Part(img)
    desk.shaded(3, 20, 6, 30, WOOD_LIGHT, WOOD, WOOD_DARK)  # legs
    desk.shaded(57, 20, 60, 30, WOOD_LIGHT, WOOD, WOOD_DARK)
    desk.rect(1, 9, 62, 17, WOOD_LIGHT)  # top surface
    desk.rect(1, 9, 62, 9, WOOD_HIGH)
    for x in range(4, 60, 9):
        desk.rect(x, 12, x + 4, 12, WOOD)  # grain
    desk.rect(1, 18, 62, 20, WOOD)  # front edge
    desk.rect(1, 20, 62, 20, WOOD_DARK)
    desk.done(PROP_OUTLINE)
    stuff = Part(img)
    # Book stack (left).
    for i, (light, base, dark) in enumerate((BOOKS[2], BOOKS[0], BOOKS[3])):
        y = 14 - i * 3
        x = 4 + (i % 2)
        stuff.rect(x, y - 2, x + 11, y, base)
        stuff.rect(x, y - 2, x + 11, y - 2, light)
        stuff.rect(x + 11, y - 1, x + 11, y, PAPER_MID)
        stuff.rect(x, y, x + 10, y, dark)
    stuff.done(PROP_OUTLINE)
    papers = Part(img)
    # Open book (middle) and a loose sheet.
    papers.rect(23, 8, 30, 15, PAPER)
    papers.rect(31, 8, 38, 15, PAPER)
    papers.rect(30, 8, 31, 15, PAPER_MID)
    papers.rect(23, 15, 38, 15, PAPER_DARK)
    for y in (10, 12):
        papers.rect(25, y, 28, y, PAPER_DARK)
        papers.rect(33, y, 36, y, PAPER_DARK)
    papers.rect(41, 12, 47, 16, PAPER_MID)
    papers.rect(42, 13, 46, 13, PAPER_DARK)
    papers.rect(42, 15, 45, 15, PAPER_DARK)
    papers.done(PROP_OUTLINE)
    extras = Part(img)
    # Inkpot with quill, candle on the right.
    extras.rect(49, 11, 52, 14, INK)
    extras.rect(49, 11, 52, 11, hexc("5a5068"))
    extras.put(53, 9, PAPER)
    extras.put(54, 8, PAPER)
    extras.put(55, 7, PAPER_MID)
    candle(extras, 57, 13)
    extras.done(PROP_OUTLINE)
    return img


def book_pile(seed: int) -> Image.Image:
    rng = random.Random(seed)
    img = new(32, 32)
    y = 27
    count = rng.randint(4, 5)
    for i in range(count):
        p = Part(img)
        light, base, dark = rng.choice(BOOKS)
        width = rng.randint(14, 20)
        x = 16 - width // 2 + rng.randint(-2, 2)
        p.rect(x, y - 3, x + width - 1, y, base)
        p.rect(x, y - 3, x + width - 1, y - 3, light)
        p.rect(x + width - 1, y - 2, x + width - 1, y, PAPER)  # page block
        p.rect(x, y, x + width - 2, y, dark)
        p.rect(x + 2, y - 1, x + 3, y - 1, GOLD)
        p.done(PROP_OUTLINE)
        y -= 4
    if seed % 2:
        top = Part(img)
        candle(top, 15, y + 3)
        top.done(PROP_OUTLINE)
    return img


def scroll() -> Image.Image:
    img = new(32, 32)
    sheet = Part(img)
    sheet.rect(7, 12, 24, 21, PAPER)
    sheet.rect(7, 21, 24, 21, PAPER_MID)
    for y, end in ((14, 21), (16, 19), (18, 22)):
        sheet.rect(10, y, end, y, PAPER_DARK)
    sheet.done(PROP_OUTLINE)
    rolls = Part(img)
    for x in (4, 25):
        rolls.rect(x, 10, x + 2, 23, PAPER_MID)
        rolls.rect(x, 10, x, 23, PAPER)
        rolls.rect(x + 2, 10, x + 2, 23, PAPER_DARK)
        rolls.rect(x + 1, 9, x + 1, 9, WOOD)
        rolls.rect(x + 1, 24, x + 1, 24, WOOD)
    rolls.rect(15, 21, 16, 23, RED)  # seal ribbon
    rolls.put(15, 22, hexc("c4503f"))
    rolls.done(PROP_OUTLINE)
    return img


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


def load(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def tile_floor(dst: Image.Image, box: tuple[int, int, int, int], dungeon: Image.Image, seed: int) -> None:
    rng = random.Random(seed)
    plain = scale(dungeon.crop((0, 160, 32, 192)))
    variants = [plain, plain, plain, scale(dungeon.crop((0, 192, 32, 224))), scale(dungeon.crop((32, 160, 64, 192)))]
    x0, y0, x1, y1 = box
    for y in range(y0, y1, 64):
        for x in range(x0, x1, 64):
            dst.alpha_composite(rng.choice(variants).crop((0, 0, min(64, x1 - x), min(64, y1 - y))), (x, y))


def wall_strip(dst: Image.Image, x0: int, x1: int, y: int, rows: int, dungeon: Image.Image) -> None:
    brick = scale(dungeon.crop((32, 32, 64, 64)))
    edge = scale(dungeon.crop((136, 56, 168, 64)))
    for r in range(rows):
        for x in range(x0, x1, 64):
            dst.alpha_composite(brick.crop((0, 0, min(64, x1 - x), 64)), (x, y + r * 64))
    for x in range(x0, x1, 64):
        dst.alpha_composite(edge.crop((0, 0, min(64, x1 - x), 16)), (x, y + rows * 64 - 4))


def label(dst: Image.Image, xy: tuple[int, int], text: str) -> None:
    ImageDraw.Draw(dst).text(xy, text, fill=(230, 220, 200, 255))


def darken(img: Image.Image, factor: float, tint: tuple[int, int, int]) -> Image.Image:
    overlay = Image.new("RGBA", img.size, (*tint, int(255 * factor)))
    out = img.copy()
    out.alpha_composite(overlay)
    return out


def room(props: dict[str, Image.Image], dungeon: Image.Image, lava_dir: Path, burnt: bool,
         golem: Image.Image | None) -> Image.Image:
    w, h = 640, 448
    img = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    tile_floor(img, (0, 128, w, h), dungeon, 3)
    wall_strip(img, 0, w, 0, 2, dungeon)
    torch = scale(load(lava_dir / "torch.png").crop((0, 0, 32, 32)))
    # Dungeon-tileset banners: intact on the wall, torn on a stand after the raid.
    flag = scale(dungeon.crop((480, 132, 512, 192) if burnt else (480, 70, 512, 124)))
    shelves = props["shelves_burnt" if burnt else "shelves"]
    # Shelves stand against the wall.
    for k, x in enumerate((24, 88, 152, 408, 472, 536)):
        img.alpha_composite(shelves.crop(((k % 3) * 64, 0, (k % 3) * 64 + 64, 128)), (x, 40))
    img.alpha_composite(torch, (288, 56))
    img.alpha_composite(flag, (232, 30) if not burnt else (216, 120))
    img.alpha_composite(flag, (344, 30) if not burnt else (570, 150))
    img.alpha_composite(props["desk"], (256, 216))
    img.alpha_composite(props["lectern"], (96, 232))
    img.alpha_composite(props["pile"].crop((0, 0, 64, 64)), (480, 210))
    img.alpha_composite(props["pile"].crop((64, 0, 128, 64)), (548, 300))
    img.alpha_composite(props["scroll"], (180, 330))
    if golem is not None:
        if burnt:
            # Corpse scraps, burning floor.
            img.alpha_composite(golem.crop((7 * 64, 6 * 64, 8 * 64, 7 * 64)), (300, 330))
        else:
            img.alpha_composite(golem.crop((2 * 64, 3 * 64, 3 * 64, 4 * 64)), (380, 300))
            img.alpha_composite(golem.crop((5 * 64, 5 * 64, 6 * 64, 6 * 64)), (200, 250))
    if burnt:
        img = darken(img, 0.35, (40, 10, 0))
        fire1 = load(TRAPS / "fire-trap-level-1.png")
        fire3 = load(TRAPS / "fire-trap-level-3.png")
        spots = [(40, 110, fire3, 5), (130, 120, fire1, 5), (430, 112, fire3, 6), (540, 130, fire1, 4),
                 (230, 300, fire1, 4), (560, 330, fire3, 6), (360, 230, fire1, 5)]
        for x, y, sheet, frame in spots:
            img.alpha_composite(scale(sheet.crop((frame * 32, 0, frame * 32 + 32, 64))), (x, y))
    return img


def contact_sheet(props: dict[str, Image.Image], golem: Image.Image, large: Image.Image) -> Image.Image:
    dungeon = load(LUCIFER / "dungeon" / "dungeon-tileset.png")
    lava_dir = LUCIFER / "lava"
    sheet = Image.new("RGBA", (1340, 660 + 2 * (6 * 128 + 30)), (24, 20, 30, 255))
    label(sheet, (20, 6), "Bibliothek (Lucifer-Kacheln x2 + eigene Requisiten)")
    sheet.alpha_composite(room(props, dungeon, lava_dir, False, golem), (20, 24))
    label(sheet, (680, 6), "Ueberfall: verbrannte Regale + Fire-Trap-Flammen")
    sheet.alpha_composite(room(props, dungeon, lava_dir, True, golem), (680, 24))
    y = 490
    label(sheet, (20, y), "Requisiten (Spielgroesse)")
    x = 20
    for key in ("shelves", "shelves_burnt", "lectern", "desk", "pile", "scroll"):
        sheet.alpha_composite(props[key], (x, y + 18))
        x += props[key].width + 16
    y = 660
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
    shelves = new(96, 64)
    shelves_burnt = new(96, 64)
    for k in range(3):
        shelves.alpha_composite(bookshelf(11 + k), (k * 32, 0))
        shelves_burnt.alpha_composite(bookshelf(11 + k, burnt=True), (k * 32, 0))
    piles = new(64, 32)
    piles.alpha_composite(book_pile(4), (0, 0))
    piles.alpha_composite(book_pile(5), (32, 0))
    props = {
        "shelves": scale(shelves),
        "shelves_burnt": scale(shelves_burnt),
        "lectern": scale(lectern()),
        "desk": scale(reading_desk()),
        "pile": scale(piles),
        "scroll": scale(scroll()),
    }
    files = {
        "bookshelf.png": props["shelves"],
        "bookshelf-burnt.png": props["shelves_burnt"],
        "lectern.png": props["lectern"],
        "reading-desk.png": props["desk"],
        "book-pile.png": props["pile"],
        "scroll.png": props["scroll"],
    }
    golem = golem_sheet(large=False)
    large = golem_sheet(large=True)
    files["paper-golem.png"] = golem
    files["paper-golem-large.png"] = large
    for name, img in files.items():
        img.save(OUT / name, optimize=False)
    CONTACT.parent.mkdir(parents=True, exist_ok=True)
    contact_sheet(props, golem, large).convert("RGB").save(CONTACT, optimize=False)


if __name__ == "__main__":
    main()
