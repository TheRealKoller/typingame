"""Die Dinge des Gartens (Kapitel 3) – Draufsicht, also kleiner als die Innenräume.

Die Welt wird vierfach gezoomt (16 px Kachel = 64 Bildschirm-px), die Innenräume achtfach.
Bäume, Büsche, Pilze, Weg und Axt kommen aus den Kenney-Paketen; alles andere entsteht hier.
"""

from pixel import (
    BLUE,
    BLUE2,
    BROWN,
    BROWN2,
    CREAM,
    GREEN,
    GREEN2,
    GREY,
    GREY2,
    ORANGE,
    RED,
    RED2,
    SKIN,
    WHITE,
    YELLOW,
    YELLOW2,
    K,
    from_text,
    outline_silhouette,
    shapes,
)

# --- Kleine Figuren als Textraster (aus dem Experiment #47 übernommen) ---
TEXT = {
    "k": K,
    "-": SKIN,
    "#": (138, 90, 60),
    "b": (79, 127, 196),
    "B": (53, 87, 143),
    "w": WHITE,
    "K": K,
    "n": BROWN,
    "N": BROWN2,
    "p": (232, 160, 160),
}

CHILD = [
    "................",
    ".....kkkkkk.....",
    "....k######k....",
    "...k########k...",
    "...k#------#k...",
    "...k--------k...",
    "...k--K--K--k...",
    "....k------k....",
    "...kkkbbbbkkk...",
    "..kbbbbbbbbbbk..",
    ".kbwbbbbbbbbwbk.",
    ".kbbbbbbbbbbbbk.",
    "..kbbbbbbbbbbk..",
    "..kBBBkkkkBBBk..",
    "...k-k....k-k...",
    "...kkk....kkk...",
]

DOG = [
    "................",
    "................",
    "..kk........kk..",
    ".kNNk......kNNk.",
    ".kNnkkkkkkkknNk.",
    ".knnnnnnnnnnnnk.",
    ".knKnnnnnnKnnnk.",
    ".knnnnkkknnnnnk.",
    ".knnnnnnnnnnnnk.",
    "..knnnnnnnnnnk..",
    "..kknnnnnnnnkk..",
    "...knk....knk...",
    "...knk....knk...",
    "...kkk....kkk...",
    "................",
    "................",
]

MOUSE = [
    "................",
    "................",
    "................",
    "....kk....kk....",
    "...kppk..kppk...",
    "...kppkkkkppk...",
    "....kknnnnkk....",
    "...knnnnnnnnk...",
    "..knKnnnnKnnk...",
    "..knnnnknnnnk...",
    "..knnnnnnnnnk...",
    "...knnnnnnk.....",
    "....kkkkkk......",
    "................",
    "................",
    "................",
]


def child():
    return from_text(CHILD, TEXT)


def dog():
    return from_text(DOG, TEXT)


def mouse():
    return from_text(MOUSE, TEXT)


def sun():
    w, h = 17, 17
    im, d = shapes(w, h)
    for x, y, rw, rh in ((7, 0, 3, 4), (7, 13, 3, 4), (0, 7, 4, 3), (13, 7, 4, 3), (1, 1, 4, 4), (12, 1, 4, 4), (1, 12, 4, 4), (12, 12, 4, 4)):
        d.rectangle([x, y, x + rw - 1, y + rh - 1], fill=YELLOW2)
    d.ellipse([3, 3, 13, 13], fill=YELLOW)
    outline_silhouette(im)
    d.ellipse([5, 5, 9, 9], fill=CREAM)
    return im


def mama():
    w, h = 15, 22
    im, d = shapes(w, h)
    d.polygon([(3, 9), (11, 9), (14, 21), (0, 21)], fill=RED)
    d.ellipse([4, 1, 10, 8], fill=SKIN)
    d.ellipse([3, 0, 11, 4], fill=BROWN2)
    d.rectangle([1, 10, 3, 16], fill=SKIN)
    d.rectangle([11, 10, 13, 16], fill=SKIN)
    outline_silhouette(im)
    d.point((6, 5), fill=K)
    d.point((8, 5), fill=K)
    d.rectangle([6, 12, 8, 13], fill=YELLOW)
    return im


def gnome():
    w, h = 13, 18
    im, d = shapes(w, h)
    d.polygon([(2, 17), (10, 17), (6, 8)], fill=BLUE)
    d.ellipse([3, 7, 9, 12], fill=CREAM)
    d.polygon([(3, 8), (9, 8), (6, 0)], fill=RED)
    outline_silhouette(im)
    d.ellipse([3, 13, 9, 17], fill=BLUE2)
    d.point((5, 9), fill=K)
    d.point((7, 9), fill=K)
    return im


def flower():
    w, h = 13, 16
    im, d = shapes(w, h)
    d.rectangle([6, 6, 6, 15], fill=GREEN2)
    d.ellipse([2, 8, 6, 12], fill=GREEN)
    d.ellipse([6, 9, 10, 13], fill=GREEN)
    for cx, cy in ((6, 1), (2, 4), (10, 4), (4, 6), (8, 6)):
        d.ellipse([cx - 2, cy - 1, cx + 2, cy + 3], fill=RED)
    d.ellipse([5, 3, 7, 5], fill=YELLOW)
    outline_silhouette(im)
    return im


def bee():
    w, h = 13, 10
    im, d = shapes(w, h)
    d.ellipse([2, 2, 10, 9], fill=YELLOW)
    d.circle = None
    d.ellipse([4, 0, 8, 3], fill=WHITE)
    outline_silhouette(im)
    d.rectangle([4, 3, 5, 8], fill=K)
    d.rectangle([7, 3, 8, 8], fill=K)
    d.point((9, 4), fill=K)
    return im


def bird():
    w, h = 15, 12
    im, d = shapes(w, h)
    d.ellipse([1, 3, 11, 11], fill=BLUE)
    d.ellipse([8, 1, 14, 8], fill=BLUE)
    d.polygon([(13, 3), (13, 6), (15, 4)], fill=ORANGE)
    d.polygon([(2, 5), (0, 2), (4, 4)], fill=BLUE2)
    outline_silhouette(im)
    d.ellipse([3, 5, 8, 9], fill=BLUE2)
    d.point((11, 4), fill=K)
    return im


def ball():
    w, h = 13, 13
    im, d = shapes(w, h)
    d.ellipse([0, 0, 12, 12], fill=RED)
    outline_silhouette(im)
    d.ellipse([1, 5, 11, 8], fill=WHITE)
    d.ellipse([3, 2, 6, 5], fill=CREAM)
    return im


def bench():
    w, h = 27, 13
    im, d = shapes(w, h)
    d.rectangle([0, 4, 26, 6], fill=BROWN)
    for x in (1, 8, 17, 23):
        d.rectangle([x, 7, x + 2, 12], fill=BROWN2)
    outline_silhouette(im)
    d.rectangle([0, 0, 26, 2], fill=BROWN)
    return im


def pony():
    w, h = 25, 19
    im, d = shapes(w, h)
    d.ellipse([3, 5, 17, 15], fill=BROWN)
    d.rectangle([15, 3, 20, 12], fill=BROWN)
    d.ellipse([17, 0, 23, 6], fill=BROWN)
    d.polygon([(17, 1), (18, 0), (19, 2)], fill=BROWN2)
    d.polygon([(21, 1), (22, 0), (23, 2)], fill=BROWN2)
    d.rectangle([4, 13, 6, 18], fill=BROWN2)
    d.rectangle([13, 13, 15, 18], fill=BROWN2)
    d.rectangle([0, 5, 2, 11], fill=BROWN2)
    outline_silhouette(im)
    d.point((20, 3), fill=K)
    d.ellipse([8, 6, 14, 12], fill=BROWN2)
    return im


def fox():
    w, h = 23, 14
    im, d = shapes(w, h)
    d.ellipse([2, 5, 15, 13], fill=ORANGE)
    d.ellipse([14, 2, 21, 9], fill=ORANGE)
    d.polygon([(14, 3), (15, 0), (17, 3)], fill=ORANGE)
    d.polygon([(19, 3), (20, 0), (21, 4)], fill=ORANGE)
    d.polygon([(21, 5), (22, 7), (21, 9)], fill=CREAM)
    d.polygon([(0, 4), (2, 6), (0, 9)], fill=CREAM)
    outline_silhouette(im)
    d.point((17, 5), fill=K)
    d.point((20, 5), fill=K)
    d.ellipse([2, 3, 8, 8], fill=CREAM)
    return im


def milk_can():
    w, h = 15, 20
    im, d = shapes(w, h)
    d.rectangle([2, 4, 12, 19], fill=GREY)
    d.rectangle([4, 0, 10, 5], fill=GREY)
    d.ellipse([3, 0, 11, 3], fill=GREY2)
    outline_silhouette(im)
    d.rectangle([2, 6, 12, 7], fill=GREY2)
    d.rectangle([12, 8, 14, 12], fill=GREY)
    return im


def cherry():
    w, h = 15, 17
    im, d = shapes(w, h)
    d.rectangle([3, 4, 3, 8], fill=GREEN2)
    d.rectangle([11, 4, 11, 10], fill=GREEN2)
    d.ellipse([0, 7, 7, 16], fill=RED)
    d.ellipse([8, 9, 15, 16], fill=RED2)
    d.polygon([(3, 4), (11, 3), (12, 5), (4, 6)], fill=GREEN)
    outline_silhouette(im)
    d.point((2, 9), fill=CREAM)
    d.point((10, 11), fill=CREAM)
    return im


def snail():
    w, h = 16, 11
    im, d = shapes(w, h)
    d.ellipse([1, 5, 14, 10], fill=CREAM)
    d.ellipse([3, 0, 11, 8], fill=BROWN)
    d.ellipse([1, 6, 3, 9], fill=CREAM)
    outline_silhouette(im)
    d.ellipse([5, 2, 9, 6], fill=BROWN2)
    d.point((2, 7), fill=K)
    return im


SPRITES = [child, dog, mouse, sun, mama, gnome, flower, bee, bird, ball, bench, pony, fox, milk_can, cherry, snail]
