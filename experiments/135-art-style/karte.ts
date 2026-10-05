/// <reference types="vite/client" />
// Probe for issue #135: a battle map assembled from painted parts.
// Ground textures and the road are painted into a canvas along the path of the real map generator;
// props, towers and enemies are cut-outs with a paper rim. Reload for a new map, `?seed=N` for a fixed one.
import Phaser from 'phaser';
import { generateAshMap, LAYOUT, seededRandom } from '../../src/content/mapgen';
import type { Point } from '../../src/battle/path';

const PICK = {
  meadow: 'boden-wiese-22',
  earth: 'boden-erde-22',
  road: 'weg-22',
  golem: 'golem-22',
  tower: 'turm-33',
  tree: 'baum-33',
  grove: 'baumgruppe-11',
  rocks: 'felsen-22',
  pond: 'weiher-33',
  ruin: 'ruine-11',
} as const;
type Part = keyof typeof PICK;

const urls = import.meta.glob('./demo3/*.png', { eager: true, import: 'default', query: '?url' }) as Record<string, string>;

const { width: WIDTH, deskTop: HEIGHT, pathHalf: PATH_HALF } = LAYOUT;
const INK = 'rgba(43, 33, 22, 0.85)';
const CORNER_RADIUS = 70;
/** On-screen heights of the cut-outs. */
const HEIGHTS: Partial<Record<Part, number>> = { golem: 64, tower: 104, tree: 92, grove: 110, rocks: 56, pond: 70, ruin: 72 };

/** The generator's path turns at right angles; round each corner with a quadratic curve. */
function roundCorners(points: readonly Point[], radius: number): Point[] {
  const out: Point[] = [points[0]!];
  for (let i = 1; i < points.length - 1; i++) {
    const [a, p, b] = [points[i - 1]!, points[i]!, points[i + 1]!];
    const r = Math.min(radius, Math.hypot(p.x - a.x, p.y - a.y) / 2, Math.hypot(b.x - p.x, b.y - p.y) / 2);
    const unit = (from: Point, to: Point) => {
      const d = Math.hypot(to.x - from.x, to.y - from.y);
      return { x: (to.x - from.x) / d, y: (to.y - from.y) / d };
    };
    const [in_, out_] = [unit(p, a), unit(p, b)];
    const start = { x: p.x + in_.x * r, y: p.y + in_.y * r };
    const end = { x: p.x + out_.x * r, y: p.y + out_.y * r };
    for (let s = 0; s <= 10; s++) {
      const t = s / 10;
      out.push({
        x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * p.x + t ** 2 * end.x,
        y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * p.y + t ** 2 * end.y,
      });
    }
  }
  out.push(points[points.length - 1]!);
  return out;
}

function trace(ctx: CanvasRenderingContext2D, line: readonly Point[]): void {
  ctx.beginPath();
  ctx.moveTo(line[0]!.x, line[0]!.y);
  for (const p of line.slice(1)) ctx.lineTo(p.x, p.y);
}

/** Paint `texture` only where `shape` draws, with soft, frayed edges. */
function paintMasked(ctx: CanvasRenderingContext2D, texture: HTMLImageElement, scale: number, shape: (mask: CanvasRenderingContext2D) => void): void {
  const layer = document.createElement('canvas');
  [layer.width, layer.height] = [WIDTH, HEIGHT];
  const mask = layer.getContext('2d')!;
  mask.filter = 'blur(3px)';
  shape(mask);
  mask.filter = 'none';
  mask.globalCompositeOperation = 'source-in';
  const pattern = mask.createPattern(texture, 'repeat')!;
  pattern.setTransform(new DOMMatrix().scale(scale));
  mask.fillStyle = pattern;
  mask.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.drawImage(layer, 0, 0);
}

class MapScene extends Phaser.Scene {
  preload(): void {
    for (const part of Object.keys(PICK) as Part[]) this.load.image(part, urls[`./demo3/${PICK[part]}.png`]!);
  }

  create(): void {
    const seed = Number(new URLSearchParams(location.search).get('seed') ?? Math.floor(Math.random() * 1e6));
    const map = generateAshMap(seededRandom(seed), 'probe', 'Probe');
    const road = roundCorners(map.path, CORNER_RADIUS);
    this.#paintGround(road, map.sites);

    for (const prop of map.props) {
      const part: Part = prop.kind === 'rock' ? (prop.variant === 0 ? 'rocks' : 'ruin') : (['tree', 'grove', 'tree', 'pond'] as const)[(prop.variant ?? 0) % 4]!;
      // Props are placed by their centre, half of 64 px above the ground.
      this.#cutOut(part, prop.x, prop.y + 32);
    }
    map.sites.forEach((site, i) => {
      if (i % 2 === 0) this.#cutOut('tower', site.x, site.y + 24);
      else this.add.ellipse(site.x, site.y + 10, 56, 22).setStrokeStyle(2, 0x2b2116, 0.6).setDepth(site.y);
    });
    for (let i = 0; i < 4; i++) this.#walker(road, i * 2600);
    this.add.text(8, HEIGHT - 22, `seed ${seed}`, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#2b2116' }).setDepth(2000);
  }

  #paintGround(road: readonly Point[], sites: readonly Point[]): void {
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [WIDTH, HEIGHT];
    const ctx = canvas.getContext('2d')!;
    const image = (key: Part) => this.textures.get(key).getSourceImage() as HTMLImageElement;
    const meadow = ctx.createPattern(image('meadow'), 'repeat')!;
    // At full size the flowers are as large as the props and drown them.
    meadow.setTransform(new DOMMatrix().scale(0.45));
    ctx.fillStyle = meadow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Build sites stand on clearings of bare earth.
    paintMasked(ctx, image('earth'), 0.5, (mask) => {
      mask.filter = 'blur(10px)';
      for (const site of sites) {
        mask.beginPath();
        mask.ellipse(site.x, site.y + 8, 62, 40, 0, 0, Math.PI * 2);
        mask.fill();
      }
    });
    // Ink edge first, then the road surface over it: a pen outline with a little wobble.
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    for (const [dx, dy, w] of [[0, 0, 10], [2, -1.5, 7]] as const) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.lineWidth = 2 * PATH_HALF + w;
      trace(ctx, road);
      ctx.stroke();
      ctx.restore();
    }
    paintMasked(ctx, image('road'), 0.4, (mask) => {
      mask.lineCap = mask.lineJoin = 'round';
      mask.lineWidth = 2 * PATH_HALF - 2;
      mask.strokeStyle = '#fff';
      trace(mask, road);
      mask.stroke();
    });
    this.textures.addCanvas('ground', canvas);
    this.add.image(0, 0, 'ground').setOrigin(0);
  }

  /** A cut-out standing on (x, y); lower things are drawn in front. */
  #cutOut(part: Part, x: number, y: number): Phaser.GameObjects.Image {
    const height = HEIGHTS[part]!;
    const image = this.add.image(x, y, part).setOrigin(0.5, 1).setDepth(y);
    return image.setScale(height / image.height);
  }

  #walker(road: readonly Point[], delay: number): void {
    const enemy = this.#cutOut('golem', road[0]!.x, road[0]!.y + 20);
    const baseScale = enemy.scaleX;
    this.tweens.add({ targets: enemy, angle: { from: -5, to: 5 }, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: enemy, scaleY: baseScale * 0.93, duration: 190, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const path = new Phaser.Curves.Path(road[0]!.x, road[0]!.y);
    for (const p of road.slice(1)) path.lineTo(p.x, p.y);
    const progress = { t: 0 };
    this.tweens.add({
      targets: progress,
      t: 1,
      delay,
      duration: 14000,
      repeat: -1,
      onUpdate: () => {
        const point = path.getPoint(progress.t);
        enemy.setPosition(point.x, point.y + 20).setDepth(point.y + 20);
      },
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#efe6cf',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: MapScene,
});
