import { fall, floatText, FLOOR_Y, OUTLINE, rise, rock, type Room, type ThingFactory } from './thing';

/** Top of the kitchen worktop; things on the counter stand on this line. */
const WORKTOP_Y = 290;
/** Labels of worktop things sit on the cabinet doors below them. */
const DOOR_LABEL_Y = 345;
const COUNTER_LEFT = 130;
const DOOR_WIDTH = 180;
const DOORS = 6;

const iceCream: ThingFactory = (scene) => {
  const x = 220;
  const view = scene.add.container(x, WORKTOP_Y, [
    scene.add.rectangle(0, -6, 34, 12, 0xd9c8b4).setRounded(4).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -18, 8, 16, 0xd9c8b4),
    scene.add.circle(0, -84, 19, 0xc9a27e).setStrokeStyle(2, OUTLINE),
    scene.add.circle(-18, -62, 20, 0xf2c1c1).setStrokeStyle(2, OUTLINE),
    scene.add.circle(18, -62, 20, 0xf7f0e6).setStrokeStyle(2, OUTLINE),
    scene.add.arc(0, -56, 44, 0, 180, false, 0xbcd3e6).setScale(1, 0.75).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -56, 88, 10, 0xd3e3ef).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: DOOR_LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      // Melting: the scoops sag a little and drip over the rim of the bowl.
      scene.tweens.add({ targets: view, scaleY: 0.93, scaleX: 1.05, duration: 500, yoyo: true, hold: 700, ease: 'Sine.easeInOut' });
      fall(scene, x - 38, WORKTOP_Y - 40, 0xf2c1c1, 4, 36);
      fall(scene, x + 38, WORKTOP_Y - 40, 0xf7f0e6, 4, 36);
    },
  };
};

const cookie: ThingFactory = (scene) => {
  const x = 400;
  const dough = 0xe0b98a;
  const chip = 0x8a6a52;
  const biscuit = (cx: number, cy: number) => [
    scene.add.ellipse(cx, cy, 64, 20, dough).setStrokeStyle(2, OUTLINE),
    scene.add.circle(cx - 14, cy - 2, 3, chip),
    scene.add.circle(cx + 6, cy + 3, 3, chip),
    scene.add.circle(cx + 18, cy - 3, 3, chip),
  ];
  const view = scene.add.container(x, WORKTOP_Y, [
    scene.add.ellipse(0, -8, 130, 22, 0xf7f0e6).setStrokeStyle(2, OUTLINE),
    ...biscuit(-22, -20),
    ...biscuit(24, -22),
    ...biscuit(0, -38),
  ]);
  return {
    view,
    label: { x, y: DOOR_LABEL_Y },
    react: () => {
      rock(scene, view, 3, 1);
      fall(scene, x - 50, WORKTOP_Y - 24, 0xc9a27e, 6, 34);
      fall(scene, x + 52, WORKTOP_Y - 24, 0xc9a27e, 6, 34);
    },
  };
};

const coffee: ThingFactory = (scene) => {
  const x = 580;
  const view = scene.add.container(x, WORKTOP_Y, [
    scene.add.ellipse(0, -5, 96, 16, 0xf7f0e6).setStrokeStyle(2, OUTLINE),
    scene.add.circle(34, -36, 14).setStrokeStyle(6, 0xe8b4a0),
    scene.add.rectangle(0, -36, 60, 58, 0xe8b4a0).setRounded(10).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -62, 52, 12, 0x9a7458),
    scene.add.rectangle(0, -32, 60, 8, 0xf7f0e6),
  ]);
  return {
    view,
    label: { x, y: DOOR_LABEL_Y },
    react: () => {
      rise(scene, x - 10, WORKTOP_Y - 72, 0xe4ddd4, 6, 8);
      rise(scene, x + 10, WORKTOP_Y - 72, 0xe4ddd4, 5, 7);
    },
  };
};

const vinegar: ThingFactory = (scene) => {
  const x = 760;
  const liquid = 0xe9d9a6;
  const view = scene.add.container(x, WORKTOP_Y, [
    scene.add.rectangle(0, -38, 44, 76, 0xd8e8dc).setRounded(10).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -30, 36, 54, liquid).setRounded(8),
    scene.add.rectangle(0, -90, 18, 34, 0xd8e8dc).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -112, 20, 12, 0xc98f6b).setRounded(3).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -38, 36, 22, 0xf7f0e6).setStrokeStyle(2, OUTLINE),
  ]);
  return {
    view,
    label: { x, y: DOOR_LABEL_Y },
    react: () => {
      rock(scene, view, 6, 3);
      floatText(scene, x + 34, WORKTOP_Y - 110, 'gluck');
      floatText(scene, x + 34, WORKTOP_Y - 110, 'gluck', 700);
    },
  };
};

const clock: ThingFactory = (scene) => {
  const x = 220;
  const y = 100;
  const minute = scene.add.rectangle(0, 0, 4, 30, 0x6a5a4a).setOrigin(0.5, 1).setRounded(2);
  const hour = scene.add.rectangle(0, 0, 5, 20, 0x6a5a4a).setOrigin(0.5, 1).setRounded(2).setAngle(120);
  const view = scene.add.container(x, y, [
    scene.add.circle(0, 0, 46, 0xf5d77a).setStrokeStyle(2, OUTLINE),
    scene.add.circle(0, 0, 38, 0xfffaf2).setStrokeStyle(2, OUTLINE),
    ...[0, 90, 180, 270].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      return scene.add.circle(Math.sin(rad) * 30, -Math.cos(rad) * 30, 3, OUTLINE);
    }),
    hour,
    minute,
    scene.add.circle(0, 0, 4, 0x6a5a4a),
  ]);
  return {
    view,
    label: { x: x + 90, y },
    react: () => {
      scene.tweens.killTweensOf([minute, hour]);
      minute.setAngle(0);
      hour.setAngle(120);
      // Four ticks: the minute hand jumps a step each time, the hour hand creeps along.
      scene.tweens.chain({
        targets: minute,
        tweens: [0, 1, 2, 3].map((i) => ({ angle: 30 * (i + 1), delay: i === 0 ? 0 : 380, duration: 120, ease: 'Back.easeOut' })),
      });
      scene.tweens.add({ targets: hour, angle: 130, duration: 2000, ease: 'Linear' });
      floatText(scene, x - 30, y - 30, 'tick');
      floatText(scene, x + 30, y - 30, 'tack', 600);
    },
  };
};

const cucumber: ThingFactory = (scene) => {
  const x = 940;
  const y = WORKTOP_Y - 17;
  const green = 0xa9cf9a;
  const view = scene.add.container(x, y, [
    scene.add.ellipse(0, 0, 130, 32, green).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -5, 110, 8, 0xc4e0b6),
    ...[-40, -16, 8, 32].map((dx) => scene.add.circle(dx, 6, 2.5, 0x86b376)),
    scene.add.rectangle(-66, 0, 8, 6, 0x86b376).setRounded(2),
  ]);
  return {
    view,
    label: { x, y: DOOR_LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setPosition(x, y).setAngle(0);
      scene.tweens.chain({
        targets: view,
        tweens: [
          { x: x + 28, angle: 6, duration: 450, ease: 'Sine.easeInOut' },
          { x: x - 28, angle: -6, duration: 900, ease: 'Sine.easeInOut', yoyo: true },
          { x, angle: 0, duration: 450, ease: 'Sine.easeInOut' },
        ],
      });
    },
  };
};

const rice: ThingFactory = (scene) => {
  const x = 1120;
  const grain = 0xd9c8b4;
  const view = scene.add.container(x, WORKTOP_Y, [
    scene.add.rectangle(0, -48, 70, 96, 0xe8d7b8).setRounded(6).setStrokeStyle(2, OUTLINE),
    scene.add.rectangle(0, -100, 74, 14, 0xf0e3c8).setRounded(3).setStrokeStyle(2, OUTLINE),
    scene.add.ellipse(0, -52, 46, 30, 0xfffaf2).setStrokeStyle(2, OUTLINE),
    ...[-10, 0, 10].map((dx) => scene.add.ellipse(dx, -52, 6, 10, 0xd9c8b4)),
  ]);
  return {
    view,
    label: { x, y: DOOR_LABEL_Y },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setAngle(0);
      scene.tweens.add({ targets: view, angle: 12, duration: 350, yoyo: true, hold: 1100, ease: 'Sine.easeInOut' });
      // Grains trickle out of the open corner of the tipped bag.
      for (let i = 0; i < 3; i++) {
        scene.time.delayedCall(350 + i * 350, () => fall(scene, x + 46, WORKTOP_Y - 92, grain, 5, 88));
      }
    },
  };
};

/** Chapter 2: the kitchen with its counter; section 2b's things sit at the right end and on the wall. */
export const kitchen: Room = {
  backdrop: (scene) => {
    const width = scene.scale.width;
    const counterWidth = DOOR_WIDTH * DOORS;
    const counterX = COUNTER_LEFT + counterWidth / 2;

    // Pale tiled splashback behind the counter.
    const tilesTop = 190;
    const tile = 50;
    scene.add.rectangle(counterX, (tilesTop + WORKTOP_Y) / 2, counterWidth, WORKTOP_Y - tilesTop, 0xeef1ea);
    for (let tx = COUNTER_LEFT + tile; tx < COUNTER_LEFT + counterWidth; tx += tile) {
      scene.add.rectangle(tx, (tilesTop + WORKTOP_Y) / 2, 1, WORKTOP_Y - tilesTop, 0xdcdfd6);
    }
    for (let ty = tilesTop; ty < WORKTOP_Y; ty += tile) {
      scene.add.rectangle(counterX, ty, counterWidth, 1, 0xdcdfd6);
    }

    // Window above the right end of the counter.
    scene.add.rectangle(1030, 115, 150, 110, 0xe3eef4).setRounded(6).setStrokeStyle(2, 0xc9bba8);
    scene.add.rectangle(1030, 115, 2, 110, 0xc9bba8);
    scene.add.rectangle(1030, 115, 150, 2, 0xc9bba8);

    // Floor, cabinets and worktop.
    scene.add.rectangle(width / 2, FLOOR_Y + 25, width, 50, 0xe9e2d0);
    scene.add.rectangle(counterX, (WORKTOP_Y + FLOOR_Y) / 2 + 4, counterWidth, FLOOR_Y - WORKTOP_Y - 8, 0xf7efe2).setStrokeStyle(1, 0xd9c8b4);
    for (let i = 0; i < DOORS; i++) {
      const doorX = COUNTER_LEFT + DOOR_WIDTH * (i + 0.5);
      scene.add.rectangle(doorX, 344, DOOR_WIDTH - 14, 62, 0xfaf4ea).setRounded(6).setStrokeStyle(1, 0xe0d2c0);
      scene.add.rectangle(doorX, 318, 40, 4, 0xd9c8b4).setRounded(2);
    }
    scene.add.rectangle(counterX, WORKTOP_Y + 7, counterWidth + 16, 14, 0xd9c2a4).setRounded(3);
  },
  // Free wall space between the clock and the window, above the counter things.
  hint: { x: 590, y: 95 },
  things: { iceCream, cookie, coffee, vinegar, clock, cucumber, rice },
};
