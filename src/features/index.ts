import { calendarFeature } from './calendar';
import { commandsFeature } from './commands';
import { editorMenuFeature } from './editor-menu';
import type { Feature } from './feature';
import { inlineTriggerFeature } from './inline-trigger';
import { ribbonFeature } from './ribbon';
import { settingsFeature } from './settings';

/** Every entry point, registered in this order by main.ts. */
export const FEATURES: ReadonlyArray<Feature> = [
  ribbonFeature,
  commandsFeature,
  editorMenuFeature,
  inlineTriggerFeature,
  calendarFeature,
  settingsFeature
];
