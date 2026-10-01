import { floatText, FLOOR_Y, LABEL_Y, OUTLINE, rock, type Room, type ThingFactory } from './thing';

const SKY = 0xdcecf7;
const GRASS = 0xcfe3b8;
const WOOD = 0xd9b99b;
const WOOD_DARK = 0xb08a63;
const FUR = 0xd9b48a;
const MANE = 0x8a6a52;

const axe: ThingFactory = (scene) => {
  const x = 150;
  const block = WOOD_DARK;
  const handle = 0xd9c8b4;
  const metal = 0x9aa4ad;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(0, -26, 78, 52, block).setRounded(6).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -26, 78, 14, 0x8f6f4e),
    scene.add.rectangle(0, -70, 12, 92, handle).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -100, 54, 26, metal).setStrokeStyle(2, OUTLINE),
    scene.add.triangle(38, -100, -6, -13, -6, 13, 22, 0, 0xd7dee4).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      rock(scene, view, 4, 2);
      floatText(scene, x + 34, FLOOR_Y - 160, 'hack!');
    },
  };
};

const pony: ThingFactory = (scene) => {
  const x = 420;
  const tail = scene.add.ellipse(-78, -70, 20, 62, MANE).setAngle(-20).setStrokeStyle(2, OUTLINE);
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(-40, -22, 14, 44, FUR).setRounded(5).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(28, -22, 14, 44, FUR).setRounded(5).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(54, -22, 14, 44, FUR).setRounded(5).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(-14, -22, 14, 44, FUR).setRounded(5).setStrokeStyle(2, OUTLINE),
    tail,
    scene.add.ellipse(0, -78, 150, 70, FUR).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(74, -122, 34, 70, FUR).setRounded(12).setStrokeStyle(2, OUTLINE),
    scene.add.circle(80, -160, 26, FUR).setStrokeStyle(2, OUTLINE),
    scene.add.triangle(70, -186, 0, 0, 18, 20, -2, 22, MANE),
    scene.add.triangle(90, -186, 0, 0, -2, 22, 18, 20, MANE),
    scene.add.circle(90, -164, 4, 0x4a4038),
    scene.add.ellipse(110, -152, 20, 12, MANE),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(tail);
      tail.setAngle(-20);
      scene.tweens.chain({
        targets: tail,
        tweens: [
          { angle: 12, duration: 400, ease: 'Sine.easeInOut' },
          { angle: -20, duration: 400, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' },
        ],
      });
      rock(scene, view, 2, 2);
      floatText(scene, x, FLOOR_Y - 230, 'wieher!');
    },
  };
};

const fox: ThingFactory = (scene) => {
  const x = 660;
  const fur = 0xd97a4a;
  const light = 0xf2ece2;
  const tail = scene.add.ellipse(-74, -44, 60, 26, fur).setAngle(18).setStrokeStyle(2, OUTLINE);
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.rectangle(-30, -14, 12, 28, 0x8a4a2a).setRounded(4),
    scene.add.rectangle(30, -14, 12, 28, 0x8a4a2a).setRounded(4),
    tail,
    scene.add.ellipse(0, -40, 104, 46, fur).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -24, 78, 22, light),
    scene.add.circle(48, -66, 24, fur).setStrokeStyle(2, OUTLINE),
    scene.add.triangle(36, -94, 0, 0, 20, 18, -2, 22, fur),
    scene.add.triangle(62, -94, 0, 0, -2, 22, 20, 18, fur),
    scene.add.triangle(72, -58, 0, 0, 24, 8, 0, 12, light),
    scene.add.circle(56, -72, 4, 0x4a4038),
    scene.add.circle(42, -74, 4, 0x4a4038),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(tail);
      tail.setAngle(18);
      scene.tweens.chain({
        targets: tail,
        tweens: [
          { angle: -22, duration: 300, ease: 'Sine.easeInOut' },
          { angle: 18, duration: 300, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' },
        ],
      });
      floatText(scene, x + 44, FLOOR_Y - 150, 'wuff');
    },
  };
};

const milkCan: ThingFactory = (scene) => {
  const x = 860;
  const metal = 0xc3ccd4;
  const lid = 0xd7dee4;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.ellipse(0, -6, 120, 24, 0xe8edf1).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -82, 96, 152, metal).setRounded(12).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -82, 96, 26, lid),
    scene.add.rectangle(0, -162, 58, 42, lid).setRounded(6).setStrokeStyle(2, OUTLINE),
    scene.add.arc(62, -98, 26, -80, 80, false, lid).setStrokeStyle(6, lid),
    scene.add.ellipse(0, -186, 70, 18, lid).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -188, 42, 10, 0xb0bac2).setRounded(5),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      rock(scene, view, 3, 2);
      floatText(scene, x, FLOOR_Y - 220, 'klirr');
    },
  };
};

const cherry: ThingFactory = (scene) => {
  const x = 1050;
  const fruit = 0xd94a5a;
  const view = scene.add.container(x, FLOOR_Y, [
    scene.add.ellipse(0, -6, 116, 24, 0xe8f2df).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(-16, -72, 6, 130, 0x86b376),
    scene.add.rectangle(20, -62, 6, 112, 0x86b376),
    scene.add.ellipse(26, -122, 44, 22, 0x9ccb86).setAngle(-22).setStrokeStyle(2, OUTLINE),
    scene.add.circle(-16, -64, 34, fruit).setStrokeStyle(2, OUTLINE),
    scene.add.circle(20, -54, 34, fruit).setStrokeStyle(2, OUTLINE),
    scene.add.circle(-27, -77, 10, 0xf2a7a7),
    scene.add.circle(9, -67, 10, 0xf2a7a7),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      rock(scene, view, 5, 3);
      floatText(scene, x, FLOOR_Y - 180, 'yum');
    },
  };
};

const snail: ThingFactory = (scene) => {
  const x = 1200;
  const body = 0xe3d9b8;
  const shell = 0xc9a27e;
  const view = scene.add.container(x, FLOOR_Y - 2, [
    scene.add.ellipse(0, -10, 96, 24, body).setStrokeStyle(2, OUTLINE),
    scene.add.circle(-42, -20, 12, body).setStrokeStyle(2, OUTLINE),
    scene.add.circle(-48, -25, 3, 0x4a4038),
    scene.add.circle(-38, -25, 3, 0x4a4038),
    scene.add.circle(16, -32, 30, shell).setStrokeStyle(2, OUTLINE),
    scene.add.circle(16, -32, 8, 0xb08a63),
  ]);
  return {
    view,
    label: { x, y: LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setPosition(x, FLOOR_Y - 2);
      scene.tweens.add({ targets: view, x: x - 28, duration: 800, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    },
  };
};

/** Chapter 3: the farmyard with the barn, where the last letters of the bottom row are learned. */
export const yard: Room = {
  backdrop: (scene) => {
    const width = scene.scale.width;
    scene.add.rectangle(width / 2, 160, width, 320, SKY);
    scene.add.rectangle(width / 2, 366, width, 132, GRASS);
    scene.add.rectangle(width / 2, FLOOR_Y + 25, width, 50, 0xd8c8a8);
    // Barn on the left with a roof and a big door.
    scene.add.rectangle(300, 220, 560, 240, WOOD).setStrokeStyle(3, WOOD_DARK);
    for (let x = 40; x < 560; x += 46) {
      scene.add.rectangle(x + 20, 220, 3, 240, 0xc9a882);
    }
    scene.add.triangle(300, 100, -300, 0, 300, 0, 0, -80, 0xc98f6b).setStrokeStyle(3, 0xa87250);
    scene.add.rectangle(300, 285, 150, 110, WOOD_DARK).setStrokeStyle(3, 0x8f6f4e);
    scene.add.rectangle(300, 285, 4, 110, 0x8f6f4e);
    scene.add.circle(340, 290, 5, 0xf5d77a);
    // Fence along the right side of the yard.
    for (let i = 0; i < 5; i++) {
      scene.add.rectangle(660 + i * 150, 210, 14, 120, WOOD).setStrokeStyle(2, OUTLINE);
    }
    scene.add.rectangle(width / 2 + 200, 250, 700, 14, WOOD).setStrokeStyle(2, OUTLINE);
    scene.add.rectangle(width / 2 + 200, 190, 700, 12, WOOD).setStrokeStyle(2, OUTLINE);
  },
  // Open sky to the right of the barn roof.
  hint: { x: 940, y: 92 },
  things: { axe, pony, fox, milkCan, cherry, snail },
};
