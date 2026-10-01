import { fall, floatText, FLOOR_Y, LABEL_Y, OUTLINE, rock, squash, type Room, type ThingFactory } from './thing';

const SKY = 0xdcecf7;
const CLOUD = 0xffffff;
const GRASS = 0xcfe3b8;
const GRASS_DARK = 0xb7d29a;
const SOIL = 0xb08a63;
const SOIL_DARK = 0x8f6f4e;
const WOOD = 0xd9b99b;

const tree: ThingFactory = (scene) => {
  const x = 1090;
  const leaves = scene.add.container(0, -190, [
    scene.add.circle(-46, 10, 54, 0x9ccb86).setStrokeStyle(2, OUTLINE),
    scene.add.circle(48, 14, 52, 0x9ccb86).setStrokeStyle(2, OUTLINE),
    scene.add.circle(0, -30, 62, 0xa9d694).setStrokeStyle(2, OUTLINE),
    scene.add.circle(0, 14, 58, 0xa9d694).setStrokeStyle(2, OUTLINE),
    scene.add.circle(-70, -40, 16, 0xe8a0b4),
    scene.add.circle(42, -58, 16, 0xe8a0b4),
  ]);
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(0, -110, 40, 220, WOOD).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -110, 12, 220, 0xc9a882),
    leaves,
  ]);
  return {
    view,
    label: { x: 1170, y: 288 },
    react: () => {
      scene.tweens.killTweensOf(leaves);
      leaves.setAngle(0);
      scene.tweens.add({
        targets: leaves,
        angle: 5,
        duration: 520,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut',
        onComplete: () => leaves.setAngle(0),
      });
      fall(scene, x - 40, 150, 0xa9d694, 5, 170);
      fall(scene, x + 50, 130, 0x9ccb86, 5, 190);
    },
  };
};

const flower: ThingFactory = (scene) => {
  const x = 520;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(0, -70, 8, 140, 0x86b376).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(-22, -70, 40, 20, 0x9ccb86).setAngle(-24).setStrokeStyle(2, OUTLINE),
    scene.add.star(0, -142, 6, 16, 38, 0xf2a7c3).setStrokeStyle(2, OUTLINE),
    scene.add.circle(0, -142, 16, 0xf7d76a).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      rock(scene, view, 6, 3);
      floatText(scene, x, FLOOR_Y - 210, '♪');
    },
  };
};

const bee: ThingFactory = (scene) => {
  const x = 680;
  const y = 250;
  const body = 0xf5d77a;
  const wing = 0xf2f6fa;
  const wings = scene.add.container(0, -16, [
    scene.add.ellipse(-24, 0, 34, 22, wing).setAlpha(0.85).setAngle(-24),
    scene.add.ellipse(24, 0, 34, 22, wing).setAlpha(0.85).setAngle(24),
  ]);
  const view = scene.add.container(x, y, [
    wings,
    scene.add.ellipse(0, 0, 56, 40, body).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(-8, 0, 8, 38, 0x4a4038),
    scene.add.rectangle(12, 0, 8, 38, 0x4a4038),
    scene.add.circle(28, -2, 15, 0x4a4038),
    scene.add.circle(32, -7, 3, 0xffffff),
  ]);
  return {
    view,
    label: { x, y: y + 62 },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setPosition(x, y);
      scene.tweens.chain({
        targets: view,
        tweens: [
          { x: x + 42, y: y - 26, duration: 500, ease: 'Sine.easeInOut' },
          { x: x - 42, y: y + 12, duration: 700, ease: 'Sine.easeInOut' },
          { x, y, duration: 500, ease: 'Sine.easeInOut' },
        ],
      });
      floatText(scene, x, y - 66, 'summ!');
    },
  };
};

const bird: ThingFactory = (scene) => {
  const x = 880;
  const y = 232;
  const body = 0x9fc4ea;
  const wing = scene.add.ellipse(-4, -2, 34, 22, 0x7ba7d4).setAngle(-20).setStrokeStyle(2, OUTLINE);
  const view = scene.add.container(x, y, [
    wing,
    scene.add.ellipse(-28, 8, 34, 24, 0x7ba7d4).setAngle(26).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, 0, 60, 42, body).setStrokeStyle(2, OUTLINE),
    scene.add.circle(24, -14, 18, body).setStrokeStyle(2, OUTLINE),
    scene.add.circle(28, -17, 3, 0x4a4038),
    scene.add.triangle(44, -12, 0, 0, 16, 6, 0, 10, 0xe8995a),
  ]);
  return {
    view,
    label: { x, y: y + 60 },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scaleX: 0.9, scaleY: 1.12, duration: 160, yoyo: true, repeat: 1 });
      scene.tweens.killTweensOf(wing);
      wing.setAngle(-20);
      scene.tweens.chain({
        targets: wing,
        tweens: [
          { angle: -64, duration: 200, ease: 'Sine.easeInOut' },
          { angle: -20, duration: 200, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' },
        ],
      });
      floatText(scene, x, y - 60, 'piep');
    },
  };
};

const ball: ThingFactory = (scene) => {
  const x = 340;
  const rest = FLOOR_Y - 34;
  const view = scene.add.container(x, rest, [
    scene.add.circle(0, 0, 34, 0xf2c1c1).setStrokeStyle(2, OUTLINE),
    scene.add.arc(0, 0, 34, 200, 340, false, 0xffffff),
    scene.add.arc(0, 0, 34, 20, 160, false, 0xffffff),
    scene.add.circle(0, 0, 34).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setPosition(x, rest).setScale(1);
      scene.tweens.chain({
        targets: view,
        tweens: [
          { y: rest - 130, duration: 300, ease: 'Quad.easeOut' },
          { y: rest, duration: 300, ease: 'Quad.easeIn' },
        ],
      });
      scene.time.delayedCall(600, () => squash(scene, view, 1.15, 0.85));
    },
  };
};

const bench: ThingFactory = (scene) => {
  const x = 150;
  const frame = 0xc98f6b;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(-58, -34, 14, 68, frame).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(58, -34, 14, 68, frame).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -58, 154, 16, frame).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(-58, -96, 12, 44, frame).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(58, -96, 12, 44, frame).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -102, 154, 14, frame).setRounded(4).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      // A leaf drifts down and settles on the bench.
      fall(scene, x + 12, 120, 0xa9d694, 3, 240);
    },
  };
};

/** Chapter 3: the bed where flowers, bee and bird share the tree and the fence. */
export const gardenBed: Room = {
  backdrop: (scene) => {
    const width = scene.scale.width;
    scene.add.rectangle(width / 2, 168, width, 336, SKY);
    scene.add.ellipse(240, 104, 170, 56, CLOUD).setAlpha(0.65);
    scene.add.ellipse(1040, 86, 150, 50, CLOUD).setAlpha(0.55);
    scene.add.rectangle(width / 2, 384, width, 108, GRASS);
    scene.add.rectangle(width / 2, FLOOR_Y + 25, width, 50, GRASS_DARK);
    // Fence along the back, where the bird sits.
    for (let i = 0; i < 9; i++) {
      scene.add.rectangle(60 + i * 150, 210, 14, 120, WOOD).setStrokeStyle(2, OUTLINE);
    }
    scene.add.rectangle(width / 2, 250, width, 14, WOOD).setStrokeStyle(2, OUTLINE);
    scene.add.rectangle(width / 2, 196, width, 12, WOOD).setStrokeStyle(2, OUTLINE);
    // Raised bed with a wooden frame in the middle of the grass.
    const bedLeft = 370;
    const bedRight = 750;
    scene.add.rectangle((bedLeft + bedRight) / 2, 370, bedRight - bedLeft, 68, SOIL).setRounded(8);
    scene.add.rectangle((bedLeft + bedRight) / 2, 344, bedRight - bedLeft, 18, WOOD).setRounded(5).setStrokeStyle(2, OUTLINE);
    scene.add.rectangle((bedLeft + bedRight) / 2, 398, bedRight - bedLeft, 16, WOOD).setRounded(5).setStrokeStyle(2, 0xb08a63);
    for (let i = 0; i < 4; i++) {
      const moundX = bedLeft + 48 + i * 94;
      scene.add.ellipse(moundX, 372, 56, 18, SOIL_DARK).setAlpha(0.6);
    }
  },
  // Open sky above the bed and the fence.
  hint: { x: 560, y: 100 },
  things: { tree, flower, bee, bird, ball, bench },
};
