import { moment } from 'obsidian';
import type { Moment } from 'moment';

/*
 * Obsidian types its `moment` export as a namespace import (`typeof import('moment')`). Under
 * `esModuleInterop`, which the community directory's review uses, a namespace import has no call
 * signature, so `moment()` would be untyped. At runtime it is the moment function, so the single
 * call goes through this typed alias. Everything else asks for the time through `currentMoment`.
 */
const createMoment = moment as unknown as () => Moment;

/** The current local time, in Obsidian's moment locale. */
export function currentMoment(): Moment {
  return createMoment();
}
