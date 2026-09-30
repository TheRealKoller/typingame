import { FLOOR_Y, floatText, LABEL_Y, OUTLINE, rise, rock, type Room, squash, type ThingFactory } from './thing';

const WOOD = 0xd9b99b;
const EYE = 0x4a4038;
/** Top of the tea table; teapot and cup stand on it. */
const TABLE_Y = 290;
/** Top of the wall shelf that carries the radio. */
const SHELF_Y = 170;

// --- Section 2c: tea corner, chair and cat on the left ---

const tea: ThingFactory = (scene) => {
  const x = 165;
  const view = scene.add.container(x, TABLE_Y, [
    scene.add.ellipse(-32, -26, 20, 28).setStrokeStyle(5, 0xa9c2d8),
    scene.add.triangle(36, -30, 0, 14, 22, 0, 8, 18, 0xbcd3e6).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -24, 62, 46, 0xbcd3e6).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -48, 34, 10, 0xa9c2d8).setStrokeStyle(2, OUTLINE),
    scene.add.circle(0, -55, 5, 0xf5d77a).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -22, 40, 8, 0xf2c1c1),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => rise(scene, x + 46, TABLE_Y - 42, 0xd8c8e8, 7, 7),
  };
};

const cup: ThingFactory = (scene) => {
  const x = 265;
  const view = scene.add.container(x, TABLE_Y, [
    scene.add.ellipse(0, -3, 56, 10, 0xf7f0e6).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(19, -18, 16, 18).setStrokeStyle(4, 0xe8a9a9),
    scene.add.rectangle(0, -19, 34, 28, 0xf2c1c1).setRounded(6).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -21, 18, 5, 0xf7f0e6).setRounded(2),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setPosition(x, TABLE_Y).setAngle(0);
      scene.tweens.add({ targets: view, x: x + 3, angle: 3, duration: 45, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' });
      floatText(scene, x + 10, TABLE_Y - 50, 'kling');
    },
  };
};

const chair: ThingFactory = (scene) => {
  const x = 420;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(-38, -128, 8, 90, WOOD).setRounded(3),
    scene.add.rectangle(38, -128, 8, 90, WOOD).setRounded(3),
    scene.add.rectangle(0, -164, 88, 14, WOOD).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -130, 76, 10, WOOD).setRounded(3),
    scene.add.rectangle(-38, -40, 8, 80, WOOD).setRounded(3),
    scene.add.rectangle(38, -40, 8, 80, WOOD).setRounded(3),
    scene.add.rectangle(0, -82, 96, 14, WOOD).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -93, 84, 10, 0xf2c1c1).setRounded(5).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => rock(scene, view, 5, 3),
  };
};

const cat: ThingFactory = (scene) => {
  const x = 590;
  const fur = 0xf0c89a;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.ellipse(-62, -10, 56, 14, fur).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -22, 112, 42, fur).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(-8, -30, 50, 14, 0xe4b584),
    scene.add.ellipse(34, -6, 30, 12, fur).setStrokeStyle(2, OUTLINE),
    scene.add.triangle(46, -60, 0, 16, 7, 0, 16, 16, fur).setStrokeStyle(2, OUTLINE),
    scene.add.triangle(70, -60, 0, 16, 9, 0, 16, 16, fur).setStrokeStyle(2, OUTLINE),
    scene.add.circle(58, -40, 22, fur).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(50, -42, 9, 2, EYE),
    scene.add.rectangle(66, -42, 9, 2, EYE),
    scene.add.circle(58, -34, 2.5, 0xe8995a),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.chain({
        targets: view,
        tweens: [
          { scaleX: 1.18, scaleY: 0.86, duration: 600, ease: 'Sine.easeInOut' },
          { scaleX: 1, scaleY: 1, delay: 400, duration: 500, ease: 'Sine.easeInOut' },
        ],
      });
    },
  };
};

// --- Section 2d: sofa and doll on the right, photo, radio and parrot on the wall above ---

const sofa: ThingFactory = (scene) => {
  const x = 900;
  const cover = 0xb8cfc0;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(-110, -4, 10, 10, WOOD),
    scene.add.rectangle(110, -4, 10, 10, WOOD),
    scene.add.rectangle(0, -94, 216, 76, cover).setRounded(14).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -34, 240, 44, cover).setRounded(10).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(-52, -62, 100, 24, 0xcfe0d4).setRounded(10).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(52, -62, 100, 24, 0xcfe0d4).setRounded(10).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(-118, -54, 34, 76, cover).setRounded(12).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(118, -54, 34, 76, cover).setRounded(12).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(-60, -98, 44, 40, 0xf2c1c1).setRounded(10).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => squash(scene, view, 1.04, 0.9),
  };
};

const doll: ThingFactory = (scene) => {
  const x = 1160;
  const skin = 0xf6dcc6;
  const dress = 0xd8c8e8;
  // The waving arm turns around the shoulder.
  const arm = scene.add.container(16, -66, [scene.add.rectangle(0, 13, 8, 30, skin).setRounded(4).setStrokeStyle(2, OUTLINE)]);
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(-8, -12, 7, 24, skin).setRounded(3),
    scene.add.rectangle(8, -12, 7, 24, skin).setRounded(3),
    scene.add.rectangle(-20, -52, 8, 30, skin).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.triangle(0, -45, 20, 0, 0, 46, 40, 46, dress).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -97, 46, 44, 0xc98f6b).setStrokeStyle(2, OUTLINE),
    scene.add.circle(0, -90, 18, skin).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -104, 36, 12, 0xc98f6b),
    scene.add.circle(-6, -90, 2.5, EYE),
    scene.add.circle(6, -90, 2.5, EYE),
    scene.add.circle(0, -83, 2, 0xe8a9a9),
    arm,
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(arm);
      arm.setAngle(0);
      scene.tweens.chain({
        targets: arm,
        tweens: [
          { angle: -150, duration: 300, ease: 'Sine.easeOut' },
          { angle: -115, duration: 220, ease: 'Sine.easeInOut', yoyo: true, repeat: 2 },
          { angle: 0, duration: 350, ease: 'Sine.easeIn' },
        ],
      });
    },
  };
};

const photo: ThingFactory = (scene) => {
  const x = 790;
  const nailY = 85;
  // The container sits on the nail so that the picture swings around it.
  const view = scene.add.container(x, nailY, [
    scene.add.triangle(0, 15, 40, 0, 0, 30, 80, 30).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, 75, 110, 90, 0xe0c9a6).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, 75, 86, 66, 0xdce9f2),
    scene.add.circle(24, 58, 9, 0xf5d77a),
    scene.add.triangle(-10, 90, 0, 30, 26, 0, 52, 30, 0xb8cfc0),
    scene.add.triangle(18, 94, 0, 22, 18, 0, 36, 22, 0xa7c2b0),
    scene.add.circle(0, 0, 4, OUTLINE),
  ]);
  return {
    view,
    label: { x: x + 105, y: nailY + 65 },
    react: () => rock(scene, view, 7, 3),
  };
};

const radio: ThingFactory = (scene) => {
  const x = 1010;
  const view = scene.add.container(x, SHELF_Y, [
    scene.add.rectangle(26, -72, 3, 34, OUTLINE).setAngle(30),
    scene.add.rectangle(0, -30, 110, 58, 0xf2c1c1).setRounded(10).setStrokeStyle(2, OUTLINE),
    scene.add.circle(-24, -30, 19, 0xe8dccb).setStrokeStyle(2, OUTLINE),
    scene.add.circle(-24, -30, 7, 0xd9c4a8),
    scene.add.rectangle(24, -38, 36, 14, 0xf7f0e6).setRounded(3).setStrokeStyle(2, OUTLINE),
    scene.add.circle(16, -16, 5, WOOD).setStrokeStyle(2, OUTLINE),
    scene.add.circle(33, -16, 5, WOOD).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: SHELF_Y + 42 },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scaleX: 1.03, scaleY: 0.97, duration: 250, yoyo: true, repeat: 5, ease: 'Sine.easeInOut' });
      ['♪', '♫', '♪', '♫'].forEach((note, i) => floatText(scene, x + 30, SHELF_Y - 55, note, i * 500));
    },
  };
};

const parrot: ThingFactory = (scene) => {
  const x = 1180;
  const hookY = 48;
  const cage = 0xc9b8a4;
  // The bird is its own container so that it can puff up inside the cage.
  const bird = scene.add.container(0, 128, [
    scene.add.ellipse(-4, 8, 14, 34, 0x9fc7a8).setAngle(20).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -12, 30, 38, 0xa8d5b0).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(-6, -10, 14, 24, 0x8fbf9a),
    scene.add.circle(4, -34, 13, 0xf5d77a).setStrokeStyle(2, OUTLINE),
    scene.add.triangle(18, -32, 0, 0, 9, 4, 0, 9, 0xe8995a),
    scene.add.circle(8, -37, 2.5, EYE),
  ]);
  const bars = [-30, -15, 0, 15, 30].map((barX) => scene.add.rectangle(barX, 90, 2, 88, cage));
  const view = scene.add.container(x, hookY, [
    scene.add.circle(0, 0, 6).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, 20, 2, 32, OUTLINE),
    scene.add.ellipse(0, 50, 84, 28, 0xf7f0e6).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, 90, 84, 88, 0xf7f0e6).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, 130, 64, 4, WOOD).setRounded(2),
    bird,
    ...bars,
    scene.add.rectangle(0, 138, 94, 12, cage).setRounded(4).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: hookY + 172 },
    react: () => {
      scene.tweens.killTweensOf(bird);
      bird.setScale(1);
      scene.tweens.chain({
        targets: bird,
        tweens: [
          { scale: 1.3, duration: 350, ease: 'Back.easeOut' },
          { scale: 1, delay: 700, duration: 400, ease: 'Sine.easeInOut' },
        ],
      });
    },
  };
};

/** Chapter 2: Wohnzimmer, the tea corner first (2c), then sofa and wall (2d). */
export const livingRoom: Room = {
  backdrop: (scene) => {
    const width = scene.scale.width;
    scene.add.rectangle(width / 2, FLOOR_Y + 25, width, 50, 0xd9c4a8);
    scene.add.rectangle(width / 2, FLOOR_Y - 3, width, 6, 0xe8dccb);
    // Rug for the cat.
    scene.add.ellipse(590, FLOOR_Y - 1, 210, 18, 0xe6cccc).setStrokeStyle(2, 0xd8b8b8);
    // Tea table.
    scene.add.rectangle(120, (TABLE_Y + FLOOR_Y) / 2, 8, FLOOR_Y - TABLE_Y, WOOD).setRounded(3);
    scene.add.rectangle(300, (TABLE_Y + FLOOR_Y) / 2, 8, FLOOR_Y - TABLE_Y, WOOD).setRounded(3);
    scene.add.rectangle(210, TABLE_Y + 6, 210, 12, WOOD).setRounded(4).setStrokeStyle(2, OUTLINE);
    // Wall shelf for the radio.
    scene.add.rectangle(965, SHELF_Y + 12, 6, 16, WOOD);
    scene.add.rectangle(1055, SHELF_Y + 12, 6, 16, WOOD);
    scene.add.rectangle(1010, SHELF_Y + 4, 140, 8, WOOD).setRounded(3).setStrokeStyle(2, OUTLINE);
  },
  // Free wall space above the tea corner and the chair.
  hint: { x: 330, y: 120 },
  things: { cat, chair, tea, cup, sofa, doll, photo, radio, parrot },
};
