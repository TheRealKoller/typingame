"""Gemeinsame Bausteine fuer die Pixelsprites der Innenraeume.

Farben im Ton der Kenney-Kacheln: dunkle Kontur, wenige, kraeftige Toene.
Vorgehen beim Zeichnen: erst die Silhouette fuellen, dann mit `outline_silhouette`
eine 1-px-Kontur legen, zuletzt die Innendetails.
"""

from PIL import Image, ImageDraw

K = (43, 43, 51)
CREAM = (244, 237, 228)
WALL = (240, 234, 222)
WALL2 = (222, 212, 194)
FLOOR = (206, 168, 116)
FLOOR2 = (188, 146, 96)
SKIN = (240, 201, 160)
RED = (224, 138, 138)
RED2 = (192, 90, 90)
YELLOW = (245, 215, 122)
YELLOW2 = (238, 198, 92)
ORANGE = (232, 164, 74)
GREEN = (169, 214, 148)
GREEN2 = (127, 176, 105)
BLUE = (111, 168, 220)
BLUE2 = (74, 127, 181)
BROWN = (192, 138, 90)
BROWN2 = (138, 90, 52)
WHITE = (255, 255, 255)
GREY = (196, 200, 208)
GREY2 = (146, 152, 164)
NIGHT = (58, 62, 98)
MOON = (247, 232, 168)

# Bild-Pixel je Entwurfs-Pixel; `set_scale` aendert das vor dem Zeichnen.
SCALE = 1


def shapes(w, h):
    """Leere Zeichenflaeche und Stift.

    Jede Koordinate gilt in Entwurfs-Pixeln. `set_scale` legt fest, wie viele Bild-Pixel
    ein Entwurfs-Pixel bekommt: Die Innenraeume zeichnen mit 2, damit ihre Kacheln bei
    vierfachem Zoom genau so dicht sind wie die Welt (dort 1 bei vierfachem Zoom).
    Konturen bleiben dabei 1 Bild-Pixel duenn und wirken dadurch feiner.
    """
    im = Image.new("RGBA", (w * SCALE, h * SCALE), (0, 0, 0, 0))
    return im, ScaledDraw(ImageDraw.Draw(im), SCALE)


def set_scale(scale):
    """Setzt die Bild-Pixel je Entwurfs-Pixel fuer alle folgenden Sprites."""
    global SCALE
    SCALE = scale


class ScaledDraw:
    """Reicht Zeichenbefehle an ImageDraw durch und rechnet Entwurfs- in Bild-Pixel um.

    Linienbreiten wachsen mit, damit eine Linie im Entwurf gleich breit bleibt.
    """

    def __init__(self, draw, scale):
        self.draw = draw
        self.scale = scale

    def _box(self, box):
        # PIL liest Rechtecke inklusiv, deshalb waechst auch die untere Kante um `scale`.
        x0, y0, x1, y1 = box
        return [x0 * self.scale, y0 * self.scale, (x1 + 1) * self.scale - 1, (y1 + 1) * self.scale - 1]

    def _points(self, points):
        if points and isinstance(points[0], (int, float)):
            return [value * self.scale for value in points]
        return [(x * self.scale, y * self.scale) for x, y in points]

    def rectangle(self, box, **kwargs):
        self.draw.rectangle(self._box(box), **kwargs)

    def ellipse(self, box, **kwargs):
        self.draw.ellipse(self._box(box), **kwargs)

    def polygon(self, points, **kwargs):
        self.draw.polygon(self._points(points), **kwargs)

    def line(self, points, **kwargs):
        kwargs["width"] = kwargs.get("width", 1) * self.scale
        self.draw.line(self._points(points), **kwargs)

    def point(self, xy, **kwargs):
        self.draw.point((xy[0] * self.scale, xy[1] * self.scale), **kwargs)

    def text(self, xy, *args, **kwargs):
        self.draw.text((xy[0] * self.scale, xy[1] * self.scale), *args, **kwargs)


def outline_silhouette(im, color=K):
    """Legt eine 1 px Kontur um jede zusammenhaengende Form."""
    px = im.load()
    w, h = im.size
    edge = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] != 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] != 0:
                    edge.append((x, y))
                    break
    for x, y in edge:
        px[x, y] = (*color, 255)


def from_text(rows, palette):
    """Zeichnet ein Sprite aus einem Textraster – so bleiben kleine Figuren im Diff lesbar."""
    im, d = shapes(len(rows[0]), len(rows))
    for y, row in enumerate(rows):
        for x, cell in enumerate(row):
            color = palette.get(cell)
            if color is not None:
                d.point((x, y), fill=color)
    return im


def contact_sheet(sprites, path, scale=4, pad=14):
    """Reiht die Sprites vergroessert aneinander, damit man sie ansehen kann."""
    width = sum(im.width * scale + pad for _, im in sprites) + pad
    height = max(im.height * scale for _, im in sprites) + 42
    sheet = Image.new("RGB", (width, height), (60, 60, 68))
    d = ImageDraw.Draw(sheet)
    x = pad
    for name, im in sprites:
        big = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        sheet.paste(big, (x, 26), big)
        d.text((x, 8), name, fill=(255, 255, 255))
        x += big.width + pad
    sheet.save(path)
    return sheet.size
