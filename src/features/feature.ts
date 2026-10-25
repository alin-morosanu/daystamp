import type { Editor, Plugin } from 'obsidian';
import type { Moment } from 'moment';

import type { InsertResult } from '../core/types';
import type { InsertService } from '../services/insert-service';
import type { SettingsStore } from '../services/settings-store';
import { STRINGS } from '../strings';

/** Read-only facts about the environment, backed by obsidian-internals (which ui/ may not import). */
export interface Environment {
  readonly getDailyNoteFormat: () => string | null;
  readonly isNaturalLanguageDatesEnabled: () => boolean;
}

/** In-memory state for this session only; never saved. */
export interface Session {
  calendarPresetId: string | null;
}

export interface FeatureContext {
  readonly plugin: Plugin;
  readonly store: SettingsStore;
  readonly insert: InsertService;
  readonly env: Environment;
  readonly session: Session;
  readonly now: () => Moment;
  readonly getActiveEditor: () => Editor | null;
  readonly notify: (message: string) => void;
}

/** An entry point. Adding one means a new file plus one line in FEATURES (docs/developer/extending.md). */
export interface Feature {
  readonly id: string;
  register(ctx: FeatureContext): void;
}

/** Notice/preview text for a failed render. */
export function describeFailure(result: Extract<InsertResult, { ok: false }>): string {
  return STRINGS.notices.failure[result.reason];
}
