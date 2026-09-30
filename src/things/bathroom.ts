import { FLOOR_Y, floatText, LABEL_Y, OUTLINE, rise, rock, type Room, type ThingFactory } from './thing';

const TUB_X = 320;
const TUB_WIDTH = 320;
/** Top edge of the tub; the water surface sits here. */
const TUB_TOP = 292;
const BASIN_X = 700;
/** Top edge of the washbasin, where the soap lies. */
const BASIN_TOP = 238;
const TILE = 48;
const TILES_FROM = 188;

const water: ThingFactory = (scene) => {
  const color = 0xbcdcea;
  const crests = [-100, -50, 0, 50, 100].map((offset) => scene.add.ellipse(offset, -10, 40, 12, 0xa9cfe0));
  const view = scene.add.container(TUB_X, TUB_TOP, [
    ...crests,
    scene.add.rectangle(0, -2, TUB_WIDTH - 20, 16, color).setRounded(6).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x: TUB_X, y: LABEL_Y },
    react: () => {
      // A wave runs along the surface from one end of the tub to the other.
      crests.forEach((crest, i) => {
        scene.tweens.killTweensOf(crest);
        crest.setY(-10);
        scene.tweens.add({ targets: crest, y: -20, delay: i * 120, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
      });
      floatText(scene, TUB_X - 60, TUB_TOP - 30, 'plitsch!');
    },
  };
};

const jellyfish: ThingFactory = (scene) => {
  const x = TUB_X - 90;
  const body = 0xd9c2e8;
  const view = scene.add.container(x, TUB_TOP - 8, [
    ...[-12, -4, 4, 12].map((offset) => scene.add.rectangle(offset, -10, 3, 18, 0xc3a6d8).setRounded(1)),
    scene.add.arc(0, -18, 22, 180, 360, false, body).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -18, 44, 4, body),
    scene.add.circle(-8, -28, 2.5, 0x4a4038),
    scene.add.circle(8, -28, 2.5, 0x4a4038),
  ]);
  return {
    view,
    label: { x, y: 212 },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setPosition(x, TUB_TOP - 8).setScale(1);
      // Swims along the tub to the tap end, turns around and comes back.
      scene.tweens.chain({
        targets: view,
        tweens: [
          { x: x + 170, duration: 1100, ease: 'Sine.easeInOut' },
          { scaleX: -1, duration: 200 },
          { x, duration: 1100, ease: 'Sine.easeInOut' },
          { scaleX: 1, duration: 200 },
        ],
      });
      scene.tweens.add({ targets: view, y: TUB_TOP - 16, duration: 330, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
    },
  };
};

const scale: ThingFactory = (scene) => {
  const x = 1010;
  const needle = scene.add.rectangle(0, -14, 3, 12, 0xd98a7a).setOrigin(0.5, 1);
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(0, -9, 120, 18, 0xf2eee6).setRounded(7).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -14, 34, 8, 0xdfe9ee).setRounded(3).setStrokeStyle(2, OUTLINE),
    needle,
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      rock(scene, view, 4, 2);
      scene.tweens.killTweensOf(needle);
      needle.setAngle(0);
      scene.tweens.add({ targets: needle, angle: 50, duration: 300, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    },
  };
};

const soap: ThingFactory = (scene) => {
  const x = BASIN_X + 52;
  const view = scene.add.container(x, BASIN_TOP, [
    scene.add.ellipse(0, -8, 40, 16, 0xf2c1c1).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(-4, -11, 16, 5, 0xf8dada),
  ]);
  return {
    view,
    label: { x: x + 92, y: BASIN_TOP - 10 },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scaleX: 1.1, scaleY: 0.85, duration: 140, yoyo: true, ease: 'Sine.easeInOut' });
      rise(scene, x, BASIN_TOP - 16, 0xc9e2f0, 8, 8);
    },
  };
};

const mirror: ThingFactory = (scene) => {
  const x = BASIN_X;
  const y = 125;
  const shine = scene.add.rectangle(-36, 0, 12, 70, 0xffffff).setAngle(25).setAlpha(0);
  const sparkle = scene.add.star(34, -28, 4, 3, 11, 0xffffff).setAlpha(0);
  const view = scene.add.container(x, y, [
    scene.add.rectangle(0, 0, 134, 114, 0xe8dccb).setRounded(12).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, 0, 110, 90, 0xdbe8ee).setRounded(8).setStrokeStyle(2, OUTLINE),
    shine,
    sparkle,
  ]);
  return {
    view,
    label: { x: x - 150, y },
    react: () => {
      scene.tweens.killTweensOf([shine, sparkle]);
      shine.setX(-36).setAlpha(0);
      sparkle.setAlpha(0).setScale(0.5);
      // A streak of light sweeps across the glass, then a sparkle flashes in the corner.
      scene.tweens.add({ targets: shine, x: 36, duration: 700, ease: 'Sine.easeInOut' });
      scene.tweens.add({ targets: shine, alpha: 0.9, duration: 350, yoyo: true });
      scene.tweens.add({ targets: sparkle, alpha: 1, scale: 1.3, delay: 600, duration: 250, yoyo: true, hold: 200 });
    },
  };
};

/** Chapter 2: the bathroom with its tub, washbasin and scale. */
export const bathroom: Room = {
  backdrop: (scene) => {
    const width = scene.scale.width;
    // Pale wall tiles up to about basin height, plain wall above.
    const tiled = FLOOR_Y - TILES_FROM;
    scene.add.rectangle(width / 2, TILES_FROM + tiled / 2, width, tiled, 0xe4eef1);
    for (let y = TILES_FROM + TILE; y < FLOOR_Y; y += TILE) scene.add.rectangle(width / 2, y, width, 2, 0xd5e3e8);
    for (let x = TILE / 2; x < width; x += TILE) scene.add.rectangle(x, TILES_FROM + tiled / 2, 2, tiled, 0xd5e3e8);
    scene.add.rectangle(width / 2, TILES_FROM, width, 4, 0xd5e3e8);
    scene.add.rectangle(width / 2, FLOOR_Y + 25, width, 50, 0xd6e4ea);

    // Tub on two feet with the tap at its right end.
    const tubHeight = FLOOR_Y - 10 - TUB_TOP;
    scene.add.rectangle(TUB_X - 120, FLOOR_Y - 6, 22, 12, 0xd9c8b4).setRounded(4).setStrokeStyle(2, OUTLINE);
    scene.add.rectangle(TUB_X + 120, FLOOR_Y - 6, 22, 12, 0xd9c8b4).setRounded(4).setStrokeStyle(2, OUTLINE);
    scene.add
      .rectangle(TUB_X, TUB_TOP + tubHeight / 2, TUB_WIDTH, tubHeight, 0xfaf8f3)
      .setRounded(20)
      .setStrokeStyle(2, OUTLINE);
    const tapX = TUB_X + TUB_WIDTH / 2 - 22;
    scene.add.rectangle(tapX, TUB_TOP - 30, 8, 40, 0xc9d3d8).setStrokeStyle(2, OUTLINE);
    scene.add.rectangle(tapX - 14, TUB_TOP - 48, 34, 8, 0xc9d3d8).setRounded(3).setStrokeStyle(2, OUTLINE);

    // Washbasin on a pedestal with a small tap.
    scene.add.rectangle(BASIN_X, (BASIN_TOP + FLOOR_Y) / 2 + 10, 36, FLOOR_Y - BASIN_TOP - 20, 0xfaf8f3).setStrokeStyle(2, OUTLINE);
    scene.add.rectangle(BASIN_X, BASIN_TOP - 12, 8, 24, 0xc9d3d8).setStrokeStyle(2, OUTLINE);
    scene.add.rectangle(BASIN_X + 8, BASIN_TOP - 22, 24, 7, 0xc9d3d8).setRounded(3).setStrokeStyle(2, OUTLINE);
    scene.add.rectangle(BASIN_X, BASIN_TOP + 18, 150, 36, 0xfaf8f3).setRounded(14).setStrokeStyle(2, OUTLINE);
  },
  // Free wall space to the right of the soap, above the scale.
  hint: { x: 1080, y: 170 },
  things: { water, scale, soap, mirror, jellyfish },
};
