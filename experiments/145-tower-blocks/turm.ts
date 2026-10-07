/// <reference types="vite/client" />
// Probe for issue #145: a tower of the journey put together from its sentence. The tower kind gives the base, the
// number of words its stage (I to III, as `compose` counts it); every other word adds its building block at an anchor
// of the base. Anchors are found from each base's outline, so new bases need no hand-made coordinates.
import { compose, fit, read, type Lexeme } from '../../src/battle/sentence';
import { GRAMMAR, LEXICON } from '../../src/content/lexicon';

const art = import.meta.glob('./teile/*.png', { eager: true, import: 'default', query: '?url' }) as Record<string, string>;
const mapArt = import.meta.glob('./karte/*', { eager: true, import: 'default', query: '?url' }) as Record<string, string>;
/** Where each plain base lies in its wrapped picture: wrapped pixel = plain pixel × scale + (dx, dy) (ausrichten.py). */
const ALIGN = (Object.values(import.meta.glob('./teile/ausrichtung.json', { eager: true, import: 'default' }))[0] ?? {}) as Record<
  string,
  { readonly scale: number; readonly dx: number; readonly dy: number }
>;

/** Base pictures per tower kind and stage (tuerme.py, CHOSEN). */
const BASES: Record<string, readonly [string, string, string]> = {
  jagd: ['jagd-1-11', 'jagd-2-sockel-11', 'jagd-3-sockel-22'],
  eisnadel: ['eisnadel-1-11', 'eisnadel-2-sockel-11', 'eisnadel-3-sockel-11'],
  viper: ['viper-1-22', 'viper-2-sockel-22', 'viper-3-sockel-11'],
};
/**
 * »der viper« was a living snake laid on the tower; two other ways, switched on the page: a snake winding around the
 * whole tower, painted into each base (tuerme.py umschlungen), or a snake carved from stone as a block.
 */
const WRAPPED: Record<string, readonly [string, string, string]> = {
  jagd: ['jagd-1-viper-11', 'jagd-2-viper-22', 'jagd-3-viper-11'],
  eisnadel: ['eisnadel-1-viper-11', 'eisnadel-2-viper-22', 'eisnadel-3-viper-22'],
  viper: ['viper-1-viper-11', 'viper-2-viper-22', 'viper-3-viper-11'],
};
const SNAKES = { umschlungen: 'Schlange um den Turm', stein: 'Stein-Schlange', lebend: 'lebende Schlange (bisher)' } as const;
let snake: keyof typeof SNAKES = 'umschlungen';
/** Each stage stands a little taller on the map. */
const STAGE_HEIGHT = [0.82, 1, 1.15];

type Anchor = 'top' | 'topLeft' | 'topRight' | 'crown' | 'band' | 'front' | 'emblem';
/**
 * Where a word's block sits, how wide it is (share of the width of the tower at that point) and its layer:
 * below 0 behind the tower, above 0 in front, higher numbers over lower ones.
 */
interface Block {
  readonly file: string;
  readonly anchor: Anchor;
  readonly width: number;
  readonly layer: number;
}
const BLOCKS: Record<string, Block> = {
  wilde: { file: 'baustein-wilde-11', anchor: 'topLeft', width: 0.6, layer: -1 },
  schwere: { file: 'baustein-schwere-22', anchor: 'band', width: 1.04, layer: 1 },
  weite: { file: 'baustein-weite-11', anchor: 'topRight', width: 0.55, layer: 4 },
  frostige: { file: 'baustein-frostige-22', anchor: 'crown', width: 1.02, layer: 2 },
  flammende: { file: 'baustein-flammende-11', anchor: 'top', width: 0.6, layer: 3 },
  'der viper': { file: 'baustein-der-viper-22', anchor: 'front', width: 0.55, layer: 3 },
  'im morgengrauen': { file: 'baustein-im-morgengrauen-11', anchor: 'emblem', width: 0.36, layer: 2 },
  'um mitternacht': { file: 'baustein-um-mitternacht-22', anchor: 'emblem', width: 0.36, layer: 2 },
};
const STONE_SNAKE: Block = { file: 'baustein-der-viper-stein-22', anchor: 'front', width: 0.5, layer: 3 };

/** The outline of a base: for each row of the picture the leftmost and rightmost opaque pixel. */
interface Shape {
  readonly image: HTMLImageElement;
  readonly top: number;
  readonly bottom: number;
  /** Widest row of the crown (battlements, the rim below a spike, a cauldron's rim): things on top stand there. */
  readonly crownRow: number;
  /** Row below the crown where it gives way to the narrower body. */
  readonly crownBottom: number;
  readonly left: Int32Array;
  readonly right: Int32Array;
}

const images = new Map<string, HTMLImageElement>();
const shapes = new Map<string, Shape>();

function load(url: string): Promise<HTMLImageElement> {
  const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>();
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = url;
  return promise;
}

function measure(image: HTMLImageElement): Shape {
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [image.width, image.height];
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, image.width, image.height);
  const left = new Int32Array(image.height).fill(-1);
  const right = new Int32Array(image.height).fill(-1);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (data[(y * image.width + x) * 4 + 3]! < 40) continue;
      if (left[y] === -1) left[y] = x;
      right[y] = x;
    }
  }
  const rows = [...left.keys()].filter((y) => left[y]! >= 0);
  const top = rows[0]!;
  const bottom = rows[rows.length - 1]!;
  const height = bottom - top;
  const width = (y: number) => (left[y]! >= 0 ? right[y]! - left[y]! : 0);
  // The crown is the widest part near the top; a spike above it is narrower, so it is measured at its widest row,
  // and the body starts where the outline narrows below that row.
  const upper = rows.filter((y) => y < top + height * 0.35);
  const crownRow = upper.reduce((best, y) => (width(y) > width(best) ? y : best), upper[0]!);
  const crownBottom = rows.find((y) => y > crownRow && width(y) < width(crownRow) * 0.85) ?? Math.round(top + height * 0.25);
  return { image, top, bottom, crownRow, crownBottom, left, right };
}

const widthAt = (shape: Shape, y: number) => shape.right[Math.round(y)]! - shape.left[Math.round(y)]!;
const middleAt = (shape: Shape, y: number) => (shape.right[Math.round(y)]! + shape.left[Math.round(y)]!) / 2;

/** Centre-bottom point (x, y) of a block and the width of the tower it is measured against, in base pixels. */
function place(shape: Shape, anchor: Anchor): { x: number; y: number; across: number; centre: boolean } {
  const crown = shape.crownBottom - shape.crownRow;
  const body = shape.bottom - shape.crownBottom;
  const crownWidth = widthAt(shape, shape.crownRow);
  const cx = middleAt(shape, shape.crownRow);
  switch (anchor) {
    case 'top':
      return { x: cx, y: shape.crownRow + crown * 0.3, across: crownWidth, centre: false };
    case 'topLeft':
      return { x: cx - crownWidth * 0.32, y: shape.crownRow + crown * 0.2, across: crownWidth, centre: false };
    case 'topRight':
      return { x: cx + crownWidth * 0.28, y: shape.crownRow + crown * 0.2, across: crownWidth, centre: false };
    case 'crown': {
      // The icicles hang from the lower edge of the crown.
      const y = shape.crownBottom - crown * 0.15;
      return { x: middleAt(shape, y), y, across: widthAt(shape, y), centre: true };
    }
    case 'band': {
      const y = shape.crownBottom + body * 0.42;
      return { x: middleAt(shape, y), y, across: widthAt(shape, y), centre: true };
    }
    case 'front': {
      const y = shape.crownBottom + body * 0.78;
      return { x: middleAt(shape, y) - widthAt(shape, y) * 0.08, y, across: widthAt(shape, shape.crownBottom + body * 0.5), centre: false };
    }
    case 'emblem': {
      const y = shape.crownBottom + body * 0.2;
      return { x: middleAt(shape, y), y, across: widthAt(shape, y), centre: true };
    }
  }
}

/** Draws the tower of `sentence` standing with its foot on (x, y), `height` px tall at stage II. */
function drawTower(ctx: CanvasRenderingContext2D, sentence: readonly Lexeme[], x: number, y: number, height: number): void {
  const tower = compose(sentence);
  const base = sentence.find((lexeme) => lexeme.role === 'base');
  if (!tower || !base) return;
  const stage = (tower.level ?? 1) - 1;
  const wrapped = snake === 'umschlungen' && sentence.some((lexeme) => lexeme.word === 'der viper');
  // Anchors and size always come from the plain base; a wrapped one is drawn over it, lined up pixel for pixel.
  const shape = shapes.get(BASES[base.word]![stage]!)!;
  const scale = (height * STAGE_HEIGHT[stage]!) / (shape.bottom - shape.top);
  const originX = x - middleAt(shape, shape.bottom - 2) * scale;
  const originY = y - shape.bottom * scale;
  const blockOf = (word: string): Block | undefined => (word === 'der viper' ? (wrapped ? undefined : snake === 'stein' ? STONE_SNAKE : BLOCKS[word]) : BLOCKS[word]);
  const blocks = sentence.flatMap((lexeme) => blockOf(lexeme.word) ?? []).sort((a, b) => a.layer - b.layer);
  const drawBlock = (block: Block) => {
    const image = images.get(block.file)!;
    const at = place(shape, block.anchor);
    const width = at.across * block.width * scale;
    const h = (image.height / image.width) * width;
    const bx = originX + at.x * scale - width / 2;
    const by = originY + at.y * scale - (at.centre ? h / 2 : h);
    ctx.drawImage(image, bx, by, width, h);
  };
  for (const block of blocks.filter((b) => b.layer < 0)) drawBlock(block);
  if (wrapped) {
    const file = WRAPPED[base.word]![stage]!;
    const image = images.get(file)!;
    const { scale: s, dx, dy } = ALIGN[file]!;
    ctx.drawImage(image, originX - (dx / s) * scale, originY - (dy / s) * scale, (image.width / s) * scale, (image.height / s) * scale);
  } else {
    ctx.drawImage(shape.image, originX, originY, shape.image.width * scale, shape.image.height * scale);
  }
  for (const block of blocks.filter((b) => b.layer >= 0)) drawBlock(block);
}

const byWord = (word: string) => LEXICON.find((lexeme) => lexeme.word === word)!;
const sentenceOf = (words: readonly string[]) => words.map(byWord);

// --- the builder ------------------------------------------------------------------------------------

let chosen: Lexeme[] = [byWord('jagd')];

function renderBuilder(): void {
  const kinds = document.querySelector('#arten')!;
  const words = document.querySelector('#woerter')!;
  kinds.replaceChildren(
    ...Object.keys(BASES).map((word) => {
      const button = document.createElement('button');
      button.textContent = word;
      button.classList.toggle('on', chosen.some((lexeme) => lexeme.word === word));
      button.onclick = () => {
        chosen = [byWord(word), ...chosen.filter((lexeme) => lexeme.role !== 'base' && fit(GRAMMAR, [byWord(word)], lexeme) === 'ok')];
        renderBuilder();
      };
      return button;
    }),
  );
  words.replaceChildren(
    ...LEXICON.filter((lexeme) => lexeme.role !== 'base').map((lexeme) => {
      const button = document.createElement('button');
      const on = chosen.includes(lexeme);
      const why = fit(GRAMMAR, chosen, lexeme);
      button.textContent = lexeme.word;
      button.classList.toggle('on', on);
      button.disabled = !on && why !== 'ok';
      button.title = why;
      button.onclick = () => {
        chosen = on ? chosen.filter((other) => other !== lexeme) : [...chosen, lexeme];
        renderBuilder();
      };
      return button;
    }),
  );
  document.querySelector('#satz')!.textContent = `${read(chosen)} – Stufe ${'I'.repeat(compose(chosen)?.level ?? 1)}`;
  const canvas = document.querySelector<HTMLCanvasElement>('#turm')!;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTower(ctx, chosen, canvas.width / 2, canvas.height - 20, 330);
}

// --- examples -----------------------------------------------------------------------------------------

/** Sentences of two to five words, every word at least once, »der viper« on every kind of tower. */
const EXAMPLES = [
  ['jagd'],
  ['wilde', 'jagd'],
  ['frostige', 'eisnadel', 'um mitternacht'],
  ['weite', 'flammende', 'jagd', 'im morgengrauen'],
  ['wilde', 'schwere', 'viper', 'der viper'],
  ['schwere', 'jagd', 'der viper'],
  ['frostige', 'eisnadel', 'der viper'],
  ['wilde', 'schwere', 'weite', 'flammende', 'jagd'],
  ['schwere', 'weite', 'frostige', 'eisnadel', 'im morgengrauen'],
] as const;

function renderGallery(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#galerie')!;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const step = canvas.width / EXAMPLES.length;
  ctx.font = '12px Georgia';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2b2116';
  EXAMPLES.forEach((words, i) => {
    const sentence = sentenceOf(words);
    drawTower(ctx, sentence, step * (i + 0.5), canvas.height - 40, 190);
    ctx.fillText(read(sentence), step * (i + 0.5), canvas.height - 14, step - 6);
  });
}

// --- on a map -------------------------------------------------------------------------------------------

interface MapData {
  readonly scale: number;
  readonly sites: readonly { readonly x: number; readonly y: number }[];
}

async function renderMap(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#karte')!;
  const ctx = canvas.getContext('2d')!;
  const map = (await (await fetch(mapArt['./karte/karte.json']!)).json()) as MapData;
  ctx.drawImage(await load(mapArt['./karte/karte.png']!), 0, 0, canvas.width, canvas.height);
  // A tower stage II is 104 px tall at scale 1, as in the game; it stands on its site, lower ones in front.
  const placed = map.sites.map((site, i) => ({ site, sentence: sentenceOf(EXAMPLES[i % EXAMPLES.length]!) })).sort((a, b) => a.site.y - b.site.y);
  for (const { site, sentence } of placed) drawTower(ctx, sentence, site.x, site.y + 14 * map.scale, 104 * map.scale);
}

async function start(): Promise<void> {
  const bases = Object.values(BASES).flat();
  const files = [...bases, ...Object.values(WRAPPED).flat(), ...Object.values(BLOCKS).map((block) => block.file), STONE_SNAKE.file];
  await Promise.all(files.map(async (file) => images.set(file, await load(art[`./teile/${file}.png`]!))));
  for (const file of bases) shapes.set(file, measure(images.get(file)!));
  await renderAll();
}

/** Switches how »der viper« looks and draws everything again. */
async function renderAll(): Promise<void> {
  document.querySelector('#schlange')!.replaceChildren(
    ...Object.entries(SNAKES).map(([key, label]) => {
      const button = document.createElement('button');
      button.textContent = `der viper: ${label}`;
      button.classList.toggle('on', key === snake);
      button.onclick = () => {
        snake = key as keyof typeof SNAKES;
        void renderAll();
      };
      return button;
    }),
  );
  renderBuilder();
  renderGallery();
  await renderMap();
}

void start();
