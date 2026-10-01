import { floatText, FLOOR_Y, LABEL_Y, OUTLINE, rock, type Room, type ThingFactory } from './thing';

const SKY = 0xdcecf7;
const CLOUD = 0xffffff;
const GRASS = 0xcfe3b8;
const GRASS_DARK = 0xb7d29a;

const mama: ThingFactory = (scene) => {
  const x = 190;
  const dress = 0xe8a0b4;
  const skin = 0xf0c9a8;
  const hair = 0x8a6a52;
  const waveArm = scene.add.rectangle(-38, -104, 12, 48, dress).setOrigin(0.5, 1).setRounded(6).setAngle(-24);
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.triangle(0, -50, -44, 58, 44, 58, 0, -44, dress).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(38, -96, 12, 46, dress).setOrigin(0.5, 1).setRounded(6).setAngle(10),
    scene.add.circle(0, -132, 34, skin).setStrokeStyle(2, OUTLINE),
    scene.add.arc(0, -138, 36, 180, 360, false, hair).setStrokeStyle(2, OUTLINE),
    scene.add.circle(-12, -130, 3.5, 0x4a4038),
    scene.add.circle(12, -130, 3.5, 0x4a4038),
    scene.add.arc(0, -120, 12, 20, 160, false, 0xd97a8a),
    waveArm,
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(waveArm);
      waveArm.setAngle(-24);
      scene.tweens.chain({
        targets: waveArm,
        tweens: [
          { angle: -84, duration: 200, ease: 'Sine.easeOut' },
          { angle: -44, duration: 200, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' },
          { angle: -24, duration: 200, ease: 'Sine.easeInOut' },
        ],
      });
      floatText(scene, x, FLOOR_Y - 190, 'hallo!');
    },
  };
};

const sun: ThingFactory = (scene) => {
  const x = 1110;
  const y = 118;
  const glow = scene.add.circle(0, 0, 96, 0xfff1b8).setAlpha(0);
  const view = scene.add.container(x, y, [
    glow,
    scene.add.star(0, 0, 8, 40, 66, 0xf7cf5a).setStrokeStyle(2, OUTLINE),
    scene.add.circle(0, 0, 42, 0xfbe08a).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: y + 92 },
    react: () => {
      scene.tweens.killTweensOf(glow);
      scene.tweens.chain({
        targets: glow,
        tweens: [
          { alpha: 0.75, duration: 400, ease: 'Sine.easeOut' },
          { alpha: 0, delay: 1600, duration: 900, ease: 'Sine.easeIn' },
        ],
      });
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scale: 1.08, duration: 400, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    },
  };
};

const dog: ThingFactory = (scene) => {
  const x = 470;
  const fur = 0xd9b48a;
  const dark = 0x8a6a52;
  const tail = scene.add.rectangle(-52, -54, 34, 9, fur).setOrigin(0, 0.5).setRounded(4).setAngle(-35);
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(-30, -16, 12, 32, fur).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(30, -16, 12, 32, fur).setRounded(4).setStrokeStyle(2, OUTLINE),
    tail,
    scene.add.ellipse(0, -46, 96, 46, fur).setStrokeStyle(2, OUTLINE),
    scene.add.circle(48, -78, 26, fur).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(34, -102, 20, 30, dark).setAngle(-24).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(62, -102, 20, 30, dark).setAngle(24).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(70, -68, 18, 12, dark),
    scene.add.circle(56, -84, 4, 0x4a4038),
    scene.add.circle(42, -86, 4, 0x4a4038),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(tail);
      tail.setAngle(-35);
      scene.tweens.chain({
        targets: tail,
        tweens: [
          { angle: -78, duration: 120, ease: 'Sine.easeInOut' },
          { angle: -12, duration: 120, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' },
          { angle: -35, duration: 120, ease: 'Sine.easeInOut' },
        ],
      });
      floatText(scene, x + 40, FLOOR_Y - 160, 'wau!');
    },
  };
};

const mouse: ThingFactory = (scene) => {
  const x = 740;
  const fur = 0xc9c3bb;
  const earFur = 0xe3b8c4;
  const tail = scene.add.rectangle(-30, -16, 42, 6, fur).setOrigin(0, 0.5).setRounded(3).setAngle(-18);
  const view = scene.add.container(x, FLOOR_Y - 2, [
    scene.add.circle(-20, -30, 15, earFur).setStrokeStyle(2, OUTLINE),
    scene.add.circle(16, -30, 15, earFur).setStrokeStyle(2, OUTLINE),
    tail,
    scene.add.ellipse(0, -18, 62, 38, fur).setStrokeStyle(2, OUTLINE),
    scene.add.circle(30, -22, 15, fur).setStrokeStyle(2, OUTLINE),
    scene.add.circle(35, -25, 3, 0x4a4038),
    scene.add.circle(26, -26, 2.5, 0x4a4038),
    scene.add.circle(34, -16, 3, 0xd97a8a),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(tail);
      tail.setAngle(-18);
      scene.tweens.chain({
        targets: tail,
        tweens: [
          { angle: -58, duration: 100, ease: 'Sine.easeInOut' },
          { angle: 0, duration: 100, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' },
          { angle: -18, duration: 100, ease: 'Sine.easeInOut' },
        ],
      });
      floatText(scene, x - 30, FLOOR_Y - 100, 'piep!');
    },
  };
};

const gnome: ThingFactory = (scene) => {
  const x = 980;
  const hat = 0xd96a5a;
  const body = 0x7a9ec9;
  const beard = 0xf2ece2;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.triangle(0, -30, -34, 34, 34, 34, 0, -30, body).setStrokeStyle(2, OUTLINE),
    scene.add.circle(0, -66, 20, 0xf0c9a8).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -48, 30, 26, beard).setStrokeStyle(2, OUTLINE),
    scene.add.triangle(0, -96, -26, 30, 26, 30, 0, -30, hat).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => rock(scene, view, 5, 3),
  };
};

/** Chapter 3: the meadow where the first own words wake the garden up. */
export const meadow: Room = {
  backdrop: (scene) => {
    const width = scene.scale.width;
    scene.add.rectangle(width / 2, 200, width, 400, SKY);
    scene.add.ellipse(300, 120, 180, 60, CLOUD).setAlpha(0.7);
    scene.add.ellipse(360, 142, 140, 50, CLOUD).setAlpha(0.7);
    scene.add.ellipse(880, 92, 160, 54, CLOUD).setAlpha(0.6);
    // Two rolling hills, then the flat grass the things stand on.
    scene.add.ellipse(340, 392, 900, 260, GRASS_DARK);
    scene.add.ellipse(980, 404, 860, 250, GRASS);
    scene.add.rectangle(width / 2, 400, width, 80, GRASS);
    scene.add.rectangle(width / 2, FLOOR_Y + 25, width, 50, GRASS_DARK);
    for (let i = 0; i < 14; i++) {
      const tuftX = 70 + i * 90;
      scene.add.triangle(tuftX, 306 + ((i * 37) % 74), 0, 0, 6, 14, 12, 0, GRASS_DARK);
    }
  },
  // Open sky between the clouds and the sun.
  hint: { x: 600, y: 108 },
  things: { mama, sun, dog, mouse, gnome },
};
