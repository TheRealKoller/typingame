import { bathroom } from './bathroom';
import { gardenBed } from './gardenBed';
import { kitchen } from './kitchen';
import { livingRoom } from './livingRoom';
import { meadow } from './meadow';
import { nursery } from './nursery';
import type { Room } from './thing';
import { yard } from './yard';

/** Rooms by the `room` names used in the content. */
export const rooms: Readonly<Record<string, Room>> = {
  Kinderzimmer: nursery,
  Küche: kitchen,
  Wohnzimmer: livingRoom,
  Bad: bathroom,
  Wiese: meadow,
  Beet: gardenBed,
  Hof: yard,
};
