/// <reference types="vite/client" />
// Probe for issue #135: a battle map assembled from painted parts.
// Ground textures and the road are painted into a canvas along the path of the real map generator;
// props, towers and enemies are cut-outs with a paper rim. Reload for a new map, `?seed=N` for a fixed one.
// `?runde=3` shows round 3 (bright pen style, ink-edged road); the default is round 4, variant B: muted
// watercolour parts, a road with a soft wash edge, painted clearings and Atramentus' ink monsters with neon paint.
import Phaser from 'phaser';
import { generateAshMap, LAYOUT, seededRandom } from '../../src/content/mapgen';
import type { Point } from '../../src/battle/path';

type Part =
  | 'meadow'
  | 'earth'
  | 'road'
  | 'clearing'
  | 'tower'
  | 'tree'
  | 'grove'
  | 'rocks'
  | 'pond'
  | 'ruin'
  | 'golem'
  | 'beetle'
  | 'scorpion'
  | 'shell';

interface Round {
  /** Image per part, as `<folder>/<file>` without `.png`; clearings may have several. */
  readonly pick: Partial<Record<Exclude<Part, 'clearing'>, string>> & { readonly clearing?: readonly string[] };
  /** Enemies walking the road, in turn. */
  readonly walkers: readonly Part[];
  /** Cut-outs painted facing left; they are mirrored while walking right. */
  readonly facesLeft: readonly Part[];
  /** Round 3 outlines the road in ink; round 4 lets it bleed into the meadow like a wash; crisp styles get a clean edge. */
  readonly roadEdge: 'ink' | 'wash' | 'clean';
  readonly meadowScale: number;
  /** Width of a clearing under a build site. */
  readonly clearingWidth: number;
  /** Round 5 drops the paper rim and grounds cut-outs with a soft shadow instead. */
  readonly shadows: boolean;
}

type StyleFiles = Record<'meadow' | 'road' | 'clearing' | 'tower' | 'golem' | 'tree' | 'grove' | 'rocks' | 'ruin' | 'pond' | 'scorpion' | 'shell', string> & {
  readonly beetle?: string;
};

/** A round 6 or 7 map: every part in one style from `<folder>/<style>-…`, laid out like round 5. */
function styleRound(style: string, files: StyleFiles, folder = 'demo6', roadEdge: Round['roadEdge'] = 'wash'): Round {
  const pick = Object.fromEntries(
    Object.entries(files).map(([part, file]) => [part, file.includes('/') ? file : `${folder}/${style}-${file}`]),
  ) as Record<keyof StyleFiles, string>;
  return {
    pick: { ...pick, clearing: [pick.clearing] },
    walkers: files.beetle ? ['scorpion', 'beetle', 'golem', 'shell'] : ['scorpion', 'golem', 'shell'],
    // Monsters were not checked one by one for their facing; they are not mirrored.
    facesLeft: [],
    roadEdge,
    meadowScale: 0.6,
    clearingWidth: 110,
    shadows: true,
  };
}

const ROUNDS: Record<string, Round> = {
  '3': {
    pick: {
      meadow: 'demo3/boden-wiese-22',
      earth: 'demo3/boden-erde-22',
      road: 'demo3/weg-22',
      golem: 'demo3/golem-22',
      tower: 'demo3/turm-33',
      tree: 'demo3/baum-33',
      grove: 'demo3/baumgruppe-11',
      rocks: 'demo3/felsen-22',
      pond: 'demo3/weiher-33',
      ruin: 'demo3/ruine-11',
    },
    walkers: ['golem'],
    facesLeft: [],
    roadEdge: 'ink',
    // At full size the flowers are as large as the props and drown them.
    meadowScale: 0.45,
    clearingWidth: 0,
    shadows: false,
  },
  '4': {
    pick: {
      meadow: 'demo4/boden-wiese-33',
      road: 'demo4/weg-11',
      clearing: ['demo4/lichtung-11', 'demo4/lichtung-22'],
      // Towers and golems are not redone in the muted style yet.
      golem: 'demo3/golem-22',
      tower: 'demo3/turm-33',
      tree: 'demo4/baum-22',
      grove: 'demo4/baumgruppe-22',
      rocks: 'demo4/felsen-22',
      pond: 'demo4/weiher-11',
      ruin: 'demo4/ruine-22',
      beetle: 'demo4/feuerkaefer-neonstark-22',
      scorpion: 'demo4/skorpion-neonstark-11',
      shell: 'demo4/panzerkaefer-neonstark-33',
    },
    walkers: ['scorpion', 'beetle', 'golem', 'shell'],
    facesLeft: ['beetle', 'scorpion', 'shell'],
    roadEdge: 'wash',
    meadowScale: 0.5,
    clearingWidth: 140,
    shadows: false,
  },
  // One camera for all parts (high three-quarter view), matched saturation, no paper rim, simpler monsters.
  '5': {
    pick: {
      meadow: 'demo5/wiese-aquarell-33',
      road: 'demo4/weg-11',
      clearing: ['demo5/lichtung-22'],
      golem: 'demo5/golem-11',
      tower: 'demo5/turm-11',
      tree: 'demo5/baum-33',
      grove: 'demo5/baumgruppe-33',
      rocks: 'demo5/felsen-11',
      pond: 'demo5/weiher-11',
      ruin: 'demo5/ruine-11',
      beetle: 'demo5/feuerkaefer-33',
      scorpion: 'demo5/skorpion-22',
      shell: 'demo5/panzerkaefer-33',
    },
    walkers: ['scorpion', 'beetle', 'golem', 'shell'],
    facesLeft: ['shell'],
    roadEdge: 'wash',
    meadowScale: 0.8,
    clearingWidth: 104,
    shadows: true,
  },
  // Round 6: one map per style (replicate.py STYLES6). Files are `<motif>-<seed>` in demo6/<style>-…,
  // or a full path where a style had no usable picture of its own.
  holzschnitt: styleRound('holzschnitt', {
    meadow: 'boden2-22',
    road: 'weg2-22',
    clearing: 'lichtung-11',
    tower: 'turm-22',
    golem: 'golem-11',
    tree: 'baum-11',
    grove: 'baum-22',
    rocks: 'felsen-22',
    ruin: 'ruine-33',
    pond: 'weiher-11',
    scorpion: 'monster-skorpion-11',
    shell: 'monster-panzerkaefer-11',
  }),
  buchmalerei: styleRound('buchmalerei', {
    meadow: 'boden2-11',
    road: 'weg2-22',
    clearing: 'lichtung-11',
    tower: 'turm-33',
    golem: 'golem-22',
    tree: 'baum-11',
    grove: 'baum-22',
    rocks: 'felsen-11',
    ruin: 'ruine-22',
    pond: 'weiher-22',
    scorpion: 'monster-skorpion-22',
    shell: 'monster-panzerkaefer-22',
  }),
  scherenschnitt: styleRound('scherenschnitt', {
    meadow: 'boden-22',
    road: 'weg-22',
    clearing: 'lichtung-22',
    tower: 'turm-11',
    golem: 'golem-22',
    tree: 'baum-11',
    grove: 'baum-22',
    rocks: 'felsen-22',
    ruin: 'ruine-33',
    pond: 'weiher-22',
    scorpion: 'monster-skorpion-11',
    shell: 'monster-panzerkaefer-33',
  }),
  gouache: styleRound('gouache', {
    meadow: 'boden-22',
    road: 'weg-22',
    clearing: 'lichtung-11',
    tower: 'turm-22',
    golem: 'golem-11',
    tree: 'baum-11',
    grove: 'baum-33',
    rocks: 'felsen-22',
    ruin: 'ruine-33',
    pond: 'weiher-11',
    scorpion: 'monster-skorpion-22',
    shell: 'monster-panzerkaefer-22',
  }),
  tusche: styleRound('tusche', {
    meadow: 'boden2-22',
    // Every ink wash road and pond came out as a landscape: plain parchment and a second rock group instead.
    road: 'demo6/buchmalerei-weg2-22',
    clearing: 'lichtung2-22',
    tower: 'turm-11',
    golem: 'golem-33',
    tree: 'baum-11',
    grove: 'baum-33',
    rocks: 'felsen-22',
    ruin: 'ruine-22',
    pond: 'felsen-33',
    scorpion: 'monster-skorpion-22',
    shell: 'monster-panzerkaefer-22',
  }),
  kupferstich: styleRound('kupferstich', {
    meadow: 'boden2-33',
    road: 'weg2-11',
    clearing: 'lichtung2-22',
    tower: 'turm-11',
    golem: 'golem-22',
    tree: 'baum-22',
    grove: 'baum-33',
    rocks: 'felsen-11',
    ruin: 'ruine-22',
    pond: 'weiher2-22',
    scorpion: 'monster-skorpion-11',
    shell: 'monster-panzerkaefer-33',
  }),
  // Round 7: styles picked only for a tower defense game (replicate.py STYLES7).
  cartoon: styleRound(
    'cartoon',
    {
      meadow: 'boden3-33',
      road: 'weg3-22',
      clearing: 'lichtung-22',
      tower: 'turm-22',
      golem: 'golem-22',
      tree: 'baum-33',
      grove: 'baum-11',
      rocks: 'felsen-22',
      ruin: 'ruine-22',
      pond: 'weiher-22',
      scorpion: 'monster-skorpion-22',
      shell: 'monster-panzerkaefer-22',
      beetle: 'monster-feuerwespe-22',
    },
    'demo7',
    'clean',
  ),
  lowpoly: styleRound(
    'lowpoly',
    {
      meadow: 'boden-22',
      road: 'weg-11',
      clearing: 'lichtung-22',
      tower: 'turm-11',
      golem: 'golem-11',
      tree: 'baum-11',
      grove: 'baum-22',
      rocks: 'felsen-22',
      ruin: 'ruine-22',
      pond: 'weiher-22',
      scorpion: 'monster-skorpion-11',
      shell: 'monster-panzerkaefer-22',
      beetle: 'monster-feuerwespe-22',
    },
    'demo7',
    'clean',
  ),
  // Cartoon and watercolour mixed; trees and props come with a small ground plate in both.
  cartoonaquarell: styleRound(
    'cartoonaquarell',
    {
      meadow: 'boden3-11',
      road: 'weg3-22',
      // Its own clearings and ponds came with posts and towers in them.
      clearing: 'demo7/aquarellcartoon-lichtung-22',
      tower: 'turm-22',
      golem: 'golem-22',
      tree: 'baum-22',
      grove: 'baum-33',
      rocks: 'felsen-22',
      ruin: 'ruine-22',
      pond: 'demo7/aquarellcartoon-weiher-22',
      scorpion: 'monster-skorpion-22',
      shell: 'monster-panzerkaefer-11',
      beetle: 'monster-feuerwespe-22',
    },
    'demo7',
    'clean',
  ),
  aquarellcartoon: styleRound(
    'aquarellcartoon',
    {
      meadow: 'boden3-22',
      // Its own roads came out grey-green; the sandy one of the other mix.
      road: 'demo7/cartoonaquarell-weg3-22',
      clearing: 'lichtung-22',
      tower: 'turm-11',
      golem: 'golem-22',
      tree: 'baum-22',
      grove: 'baum-11',
      rocks: 'felsen-22',
      ruin: 'ruine-22',
      pond: 'weiher-22',
      scorpion: 'monster-skorpion-22',
      shell: 'monster-panzerkaefer-22',
      beetle: 'monster-feuerwespe-22',
    },
    'demo7',
  ),
  vektor: styleRound(
    'vektor',
    {
      meadow: 'boden-22',
      road: 'weg-22',
      clearing: 'lichtung-11',
      tower: 'turm-22',
      golem: 'golem-11',
      tree: 'baum-11',
      grove: 'baum-22',
      rocks: 'felsen-22',
      ruin: 'ruine-11',
      pond: 'weiher-11',
      scorpion: 'monster-skorpion-11',
      shell: 'monster-panzerkaefer-11',
      beetle: 'monster-feuerwespe-11',
    },
    'demo7',
    'clean',
  ),
};
const ROUND = ROUNDS[new URLSearchParams(location.search).get('runde') ?? '5'] ?? ROUNDS['5']!;

const urls = import.meta.glob('./demo[3-7]/*.png', { eager: true, import: 'default', query: '?url' }) as Record<string, string>;

const { width: WIDTH, deskTop: HEIGHT, pathHalf: PATH_HALF } = LAYOUT;
const INK = 'rgba(43, 33, 22, 0.85)';
/** The darker rim a watercolour wash leaves where it dries. */
const WASH = 'rgba(120, 92, 58, 0.45)';
const CORNER_RADIUS = 70;
/** On-screen heights of the cut-outs. */
const HEIGHTS: Partial<Record<Part, number>> = {
  golem: 64,
  tower: 104,
  tree: 92,
  grove: 110,
  rocks: 56,
  pond: 70,
  ruin: 72,
  beetle: 62,
  scorpion: 54,
  shell: 66,
};

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
    const { clearing = [], ...parts } = ROUND.pick;
    for (const [part, file] of Object.entries(parts)) this.load.image(part, urls[`./${file}.png`]!);
    clearing.forEach((file, i) => this.load.image(`clearing-${i}`, urls[`./${file}.png`]!));
  }

  create(): void {
    const seed = Number(new URLSearchParams(location.search).get('seed') ?? Math.floor(Math.random() * 1e6));
    // The links in karte.html switch the style but keep this map, so styles compare on the same layout.
    for (const link of document.querySelectorAll<HTMLAnchorElement>('nav a')) link.search += `&seed=${seed}`;
    const map = generateAshMap(seededRandom(seed), 'probe', 'Probe');
    const road = roundCorners(map.path, CORNER_RADIUS);
    this.#paintGround(road, map.sites);
    // Round 4: build sites stand on painted clearings; they lie flat, under everything that stands.
    const clearings = ROUND.pick.clearing ?? [];
    map.sites.forEach((site, i) => {
      if (clearings.length === 0) return;
      const image = this.add.image(site.x, site.y + 8, `clearing-${i % clearings.length}`).setDepth(1);
      image.setScale(ROUND.clearingWidth / image.width);
    });

    for (const prop of map.props) {
      const part: Part = prop.kind === 'rock' ? (prop.variant === 0 ? 'rocks' : 'ruin') : (['tree', 'grove', 'tree', 'pond'] as const)[(prop.variant ?? 0) % 4]!;
      // Props are placed by their centre, half of 64 px above the ground.
      this.#cutOut(part, prop.x, prop.y + 32);
    }
    map.sites.forEach((site, i) => {
      if (i % 2 === 0) this.#cutOut('tower', site.x, site.y + 24);
      else this.add.ellipse(site.x, site.y + 10, 56, 22).setStrokeStyle(2, 0x2b2116, 0.6).setDepth(site.y);
    });
    for (let i = 0; i < 4; i++) this.#walker(ROUND.walkers[i % ROUND.walkers.length]!, road, i * 2600);
    this.add.text(8, HEIGHT - 22, `seed ${seed}`, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#2b2116' }).setDepth(2000);
  }

  #paintGround(road: readonly Point[], sites: readonly Point[]): void {
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [WIDTH, HEIGHT];
    const ctx = canvas.getContext('2d')!;
    const image = (key: Part) => this.textures.get(key).getSourceImage() as HTMLImageElement;
    const meadow = ctx.createPattern(image('meadow'), 'repeat')!;
    meadow.setTransform(new DOMMatrix().scale(ROUND.meadowScale));
    ctx.fillStyle = meadow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.lineCap = ctx.lineJoin = 'round';
    if (ROUND.roadEdge === 'ink') {
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
      ctx.strokeStyle = INK;
      for (const [dx, dy, w] of [[0, 0, 10], [2, -1.5, 7]] as const) {
        ctx.save();
        ctx.translate(dx, dy);
        ctx.lineWidth = 2 * PATH_HALF + w;
        trace(ctx, road);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Wash: a soft, slightly darker band where the wash dried, the road bleeding out over it.
      // Clean (crisp game styles): the same band with a sharp edge.
      ctx.save();
      if (ROUND.roadEdge === 'wash') ctx.filter = 'blur(4px)';
      ctx.strokeStyle = WASH;
      ctx.lineWidth = 2 * PATH_HALF + 8;
      trace(ctx, road);
      ctx.stroke();
      ctx.restore();
    }
    paintMasked(ctx, image('road'), 0.4, (mask) => {
      mask.lineCap = mask.lineJoin = 'round';
      mask.lineWidth = 2 * PATH_HALF - 2;
      mask.strokeStyle = '#fff';
      if (ROUND.roadEdge === 'wash') mask.filter = 'blur(5px)';
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
    image.setScale(height / image.height);
    if (ROUND.shadows) image.setData('shadow', this.#shadow(x, y, image.displayWidth));
    return image;
  }

  /** A soft shadow on the ground (light from the top left), two faint ellipses so the edge is not hard. */
  #shadow(x: number, y: number, width: number): Phaser.GameObjects.Container {
    const shadow = this.add.container(x + width * 0.08, y - 2).setDepth(2);
    shadow.add(this.add.ellipse(0, 0, width * 0.95, width * 0.26, 0x2b2116, 0.1));
    shadow.add(this.add.ellipse(0, 0, width * 0.7, width * 0.18, 0x2b2116, 0.14));
    return shadow;
  }

  #walker(part: Part, road: readonly Point[], delay: number): void {
    const enemy = this.#cutOut(part, road[0]!.x, road[0]!.y + 20);
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
        // The monsters are painted facing left: mirror them while they walk right.
        if (ROUND.facesLeft.includes(part) && point.x !== enemy.x) enemy.setFlipX(point.x > enemy.x);
        enemy.setPosition(point.x, point.y + 20).setDepth(point.y + 20);
        (enemy.getData('shadow') as Phaser.GameObjects.Container | undefined)?.setPosition(point.x + enemy.displayWidth * 0.08, point.y + 18);
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
