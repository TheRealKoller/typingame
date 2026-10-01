import clockImage from '../assets/interior/kitchen/clock.png';
import coffeeImage from '../assets/interior/kitchen/coffee.png';
import cookieImage from '../assets/interior/kitchen/cookie.png';
import counterImage from '../assets/interior/kitchen/counter_tile.png';
import cucumberImage from '../assets/interior/kitchen/cucumber.png';
import iceCreamImage from '../assets/interior/kitchen/ice_cream.png';
import riceImage from '../assets/interior/kitchen/rice.png';
import vinegarImage from '../assets/interior/kitchen/vinegar.png';
import floorImage from '../assets/interior/shared/floor_tile.png';
import wallImage from '../assets/interior/shared/wall_tile.png';
import windowImage from '../assets/interior/shared/window.png';
import { fall, fillTiles, floatText, rise, rock, standingPicture, type Room, type ThingFactory } from './thing';

const ZOOM = 8;
/** Wall above, floor below; the things stand on the floor line or on the worktop. */
const FLOOR_TOP = 384;
/** The worktop is a row of tiles; its things stand on the top edge. */
const COUNTER_TOP = FLOOR_TOP - 10 * ZOOM;
/** The worktop things put their word on the cabinet doors below them. */
const COUNTER_LABEL = COUNTER_TOP + 46;

const iceCream: ThingFactory = (scene) => {
  const x = 230;
  const view = standingPicture(scene, 'iceCream', x, COUNTER_TOP, ZOOM);
  return {
    view,
    label: { x, y: COUNTER_LABEL },
    react: () => {
      // Melting: the scoops sag a little and drip over the rim of the bowl.
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({
        targets: view,
        scaleY: 0.93,
        scaleX: 1.05,
        duration: 500,
        yoyo: true,
        hold: 700,
        ease: 'Sine.easeInOut',
      });
      fall(scene, x - 30, COUNTER_TOP - 30, 0xf2c1c1, 4, 30);
      fall(scene, x + 30, COUNTER_TOP - 30, 0xf7f0e6, 4, 30);
    },
  };
};

const cookie: ThingFactory = (scene) => {
  const x = 430;
  const view = standingPicture(scene, 'cookie', x, COUNTER_TOP, ZOOM);
  return {
    view,
    label: { x, y: COUNTER_LABEL },
    react: () => {
      rock(scene, view, 3, 1);
      fall(scene, x - 40, COUNTER_TOP - 16, 0xc9a27e, 6, 28);
      fall(scene, x + 40, COUNTER_TOP - 16, 0xc9a27e, 6, 28);
    },
  };
};

const coffee: ThingFactory = (scene) => {
  const x = 620;
  const view = standingPicture(scene, 'coffee', x, COUNTER_TOP, ZOOM);
  return {
    view,
    label: { x, y: COUNTER_LABEL },
    react: () => {
      rise(scene, x - 12, COUNTER_TOP - 80, 0xe4ddd4, 6, 8);
      rise(scene, x + 12, COUNTER_TOP - 80, 0xe4ddd4, 5, 7);
    },
  };
};

const vinegar: ThingFactory = (scene) => {
  const x = 800;
  const view = standingPicture(scene, 'vinegar', x, COUNTER_TOP, ZOOM);
  return {
    view,
    label: { x, y: COUNTER_LABEL },
    react: () => {
      rock(scene, view, 6, 3);
      floatText(scene, x + 60, COUNTER_TOP - 140, 'gluck');
      floatText(scene, x + 60, COUNTER_TOP - 140, 'gluck', 700);
    },
  };
};

const clock: ThingFactory = (scene) => {
  const x = 420;
  const y = 210;
  const minute = scene.add.rectangle(0, -52, 4, 40, 0x4a3a2a).setOrigin(0.5, 1).setRounded(2);
  const hour = scene.add.rectangle(0, -52, 5, 26, 0x4a3a2a).setOrigin(0.5, 1).setRounded(2).setAngle(120);
  const view = scene.add.container(x, y, [
    scene.add.image(0, 0, 'clock').setOrigin(0.5, 1).setScale(ZOOM),
    minute,
    hour,
  ]);
  return {
    view,
    label: { x, y: y - 130 },
    react: () => {
      scene.tweens.killTweensOf([minute, hour]);
      minute.setAngle(0);
      hour.setAngle(120);
      // Four ticks: the minute hand jumps a step each time, the hour hand creeps along.
      scene.tweens.chain({
        targets: minute,
        tweens: [0, 1, 2, 3].map((i) => ({
          angle: 30 * (i + 1),
          delay: i === 0 ? 0 : 380,
          duration: 120,
          ease: 'Back.easeOut',
        })),
      });
      scene.tweens.add({ targets: hour, angle: 130, duration: 2000, ease: 'Linear' });
      floatText(scene, x - 60, y - 60, 'tick');
      floatText(scene, x + 60, y - 60, 'tack', 600);
    },
  };
};

const cucumber: ThingFactory = (scene) => {
  const x = 1000;
  const view = standingPicture(scene, 'cucumber', x, COUNTER_TOP, ZOOM);
  return {
    view,
    label: { x, y: COUNTER_LABEL },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setPosition(x, COUNTER_TOP).setAngle(0);
      scene.tweens.chain({
        targets: view,
        tweens: [
          { x: x + 40, angle: 6, duration: 450, ease: 'Sine.easeInOut' },
          { x: x - 40, angle: -6, duration: 900, ease: 'Sine.easeInOut', yoyo: true },
          { x, angle: 0, duration: 450, ease: 'Sine.easeInOut' },
        ],
      });
    },
  };
};

const rice: ThingFactory = (scene) => {
  const x = 1160;
  const view = standingPicture(scene, 'rice', x, COUNTER_TOP, ZOOM);
  return {
    view,
    label: { x, y: COUNTER_LABEL },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setAngle(0);
      scene.tweens.add({ targets: view, angle: 12, duration: 350, yoyo: true, hold: 1100, ease: 'Sine.easeInOut' });
      for (let i = 0; i < 3; i++) {
        scene.time.delayedCall(350 + i * 350, () => fall(scene, x + 40, COUNTER_TOP - 90, 0xfffaf2, 5, 80));
      }
    },
  };
};

/** Chapter 2: the kitchen with its worktop; 2b's things sit at the right end and on the wall. */
export const kitchen: Room = {
  assets: [
    { key: 'wall', url: wallImage },
    { key: 'floor', url: floorImage },
    { key: 'window', url: windowImage },
    { key: 'counter', url: counterImage },
    { key: 'iceCream', url: iceCreamImage },
    { key: 'cookie', url: cookieImage },
    { key: 'coffee', url: coffeeImage },
    { key: 'vinegar', url: vinegarImage },
    { key: 'clock', url: clockImage },
    { key: 'cucumber', url: cucumberImage },
    { key: 'rice', url: riceImage },
  ],
  backdrop: (scene) => {
    fillTiles(scene, 'wall', 0, 0, scene.scale.width, FLOOR_TOP, ZOOM);
    fillTiles(scene, 'floor', 0, FLOOR_TOP, scene.scale.width, scene.scale.height, ZOOM);
    scene.add.image(1080, 250, 'window').setOrigin(0.5, 1).setScale(ZOOM);
    // The worktop: one row of tiles across the wall.
    fillTiles(scene, 'counter', 64, COUNTER_TOP, 1216, FLOOR_TOP, ZOOM);
  },
  // Free wall space between the clock and the window.
  hint: { x: 760, y: 130 },
  things: { iceCream, cookie, coffee, vinegar, clock, cucumber, rice },
};
