import type * as Phaser from 'phaser';
import { FLOOR_Y, floatText, LABEL_Y, OUTLINE, rock, type Room, type ThingFactory } from './thing';

const bed: ThingFactory = (scene) => {
  const x = 330;
  const frame = 0xd9b99b;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(-120, -60, 14, 120, frame).setRounded(4),
    scene.add.rectangle(120, -60, 14, 120, frame).setRounded(4),
    scene.add.rectangle(0, -40, 240, 40, 0xf7f0e6).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -40, 240, 16, 0xbcd3e6),
    scene.add.ellipse(-80, -68, 70, 30, 0xffffff).setStrokeStyle(2, OUTLINE),
    ...[-90, -60, -30, 0, 30, 60, 90].map((barX) => scene.add.rectangle(barX, -85, 6, 50, frame)),
    scene.add.rectangle(0, -110, 254, 8, frame).setRounded(3),
    scene.add.rectangle(0, -14, 254, 12, frame).setRounded(3),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => rock(scene, view, 4, 3),
  };
};

const mobile: ThingFactory = (scene) => {
  const x = 330;
  const armY = 110;
  const hanging = (offset: number, length: number, shape: Phaser.GameObjects.Shape) =>
    scene.add.container(offset, 0, [scene.add.rectangle(0, length / 2, 2, length, OUTLINE), shape.setPosition(0, length)]);
  const arm = scene.add.container(0, armY, [
    scene.add.rectangle(0, 0, 180, 4, OUTLINE).setRounded(2),
    hanging(-88, 40, scene.add.star(0, 0, 5, 8, 18, 0xf5d77a)),
    hanging(0, 60, scene.add.circle(0, 0, 14, 0xbcd3e6)),
    hanging(88, 36, scene.add.ellipse(0, 0, 40, 22, 0xf2c1c1)),
  ]);
  const view = scene.add.container(x, 0, [scene.add.rectangle(0, armY / 2, 3, armY, OUTLINE), arm]);
  return {
    view,
    label: { x: x + 170, y: armY },
    react: () => {
      scene.tweens.killTweensOf(arm);
      arm.setScale(1, 1);
      // Mirroring the arm back and forth reads as the mobile turning around its string.
      scene.tweens.add({ targets: arm, scaleX: -1, duration: 700, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    },
  };
};

const musicBox: ThingFactory = (scene) => {
  const x = 610;
  const lid = scene.add.rectangle(-45, -60, 90, 12, 0xc98f6b).setOrigin(0, 1).setStrokeStyle(2, OUTLINE);
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(0, -30, 90, 60, 0xe0a882).setStrokeStyle(2, OUTLINE),
    scene.add.circle(0, -30, 8, 0xf5d77a),
    scene.add.rectangle(52, -30, 14, 4, OUTLINE),
    scene.add.circle(60, -30, 5, OUTLINE),
    lid,
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(lid);
      scene.tweens.chain({
        targets: lid,
        tweens: [
          { angle: -35, duration: 250, ease: 'Quad.easeOut' },
          { angle: 0, delay: 2200, duration: 400, ease: 'Quad.easeIn' },
        ],
      });
      ['♪', '♫', '♪', '♫'].forEach((note, i) => floatText(scene, x, FLOOR_Y - 90, note, 200 + i * 450));
    },
  };
};

const teddy: ThingFactory = (scene) => {
  const x = 820;
  const fur = 0xc49a74;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.ellipse(0, -42, 84, 84, fur).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -36, 46, 50, 0xe2c4a4),
    scene.add.circle(-26, -128, 13, fur).setStrokeStyle(2, OUTLINE),
    scene.add.circle(26, -128, 13, fur).setStrokeStyle(2, OUTLINE),
    scene.add.circle(0, -108, 32, fur).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -98, 24, 16, 0xe2c4a4),
    scene.add.circle(-11, -114, 3.5, 0x4a4038),
    scene.add.circle(11, -114, 3.5, 0x4a4038),
    scene.add.circle(0, -101, 4, 0x4a4038),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => rock(scene, view, 12, 4),
  };
};

const duck: ThingFactory = (scene) => {
  const x = 980;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.ellipse(0, -22, 76, 44, 0xf5d77a).setStrokeStyle(2, OUTLINE),
    scene.add.circle(22, -54, 19, 0xf5d77a).setStrokeStyle(2, OUTLINE),
    scene.add.triangle(44, -52, 0, 0, 18, 5, 0, 10, 0xe8995a),
    scene.add.circle(27, -59, 3, 0x4a4038),
    scene.add.ellipse(-8, -24, 34, 16, 0xeec65c),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scaleY: 0.8, scaleX: 1.12, duration: 110, yoyo: true, repeat: 1 });
      floatText(scene, x + 30, FLOOR_Y - 90, 'quietsch!');
    },
  };
};

const nightLight: ThingFactory = (scene) => {
  const x = 1140;
  const y = 230;
  const off = 0xf1e6cf;
  const on = 0xfff1b8;
  const glow = scene.add.circle(0, 0, 90, on).setAlpha(0);
  const bulb = scene.add.circle(0, -4, 22, off).setStrokeStyle(2, OUTLINE);
  const view = scene.add.container(x, y, [
    glow,
    scene.add.rectangle(0, 18, 50, 34, 0xf7f0e6).setRounded(8).setStrokeStyle(2, OUTLINE),
    bulb,
  ]);
  return {
    view,
    label: { x, y: y + 70 },
    react: () => {
      scene.tweens.killTweensOf(glow);
      bulb.setFillStyle(on);
      scene.tweens.chain({
        targets: glow,
        tweens: [
          { alpha: 0.7, duration: 500, ease: 'Sine.easeOut' },
          { alpha: 0, delay: 3000, duration: 800, ease: 'Sine.easeIn', onComplete: () => bulb.setFillStyle(off) },
        ],
      });
    },
  };
};

/** Chapter 1: the baby's room with the things that react to its first sounds. */
export const nursery: Room = {
  backdrop: (scene) => {
    scene.add.rectangle(scene.scale.width / 2, FLOOR_Y + 25, scene.scale.width, 50, 0xe8dccb);
  },
  // Free wall space between the mobile and the night light.
  hint: { x: 820, y: 115 },
  things: { bed, mobile, musicBox, teddy, duck, nightLight },
};
