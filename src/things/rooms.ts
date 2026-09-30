import { bathroom } from './bathroom';
import { kitchen } from './kitchen';
import { livingRoom } from './livingRoom';
import { nursery } from './nursery';
import type { Room } from './thing';

/** Rooms by the `room` names used in the content. */
export const rooms: Readonly<Record<string, Room>> = {
  Kinderzimmer: nursery,
  Küche: kitchen,
  Wohnzimmer: livingRoom,
  Bad: bathroom,
};
