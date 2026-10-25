import { Notice, Plugin } from 'obsidian';

import { sanitizeSettings } from './core/settings-schema';
import type { FeatureContext } from './features/feature';
import { FEATURES } from './features/index';
import { currentMoment } from './services/clock';
import { getEditableEditor, InsertService } from './services/insert-service';
import { getDailyNoteFormat, isCommunityPluginEnabled } from './services/obsidian-internals';
import { SettingsStore } from './services/settings-store';
import { UsageTracker } from './services/usage-tracker';
import { STRINGS } from './strings';

const NATURAL_LANGUAGE_DATES_ID = 'nldates-obsidian';

/** Composition root: builds the services and registers every feature. No logic lives here. */
export default class DaystampPlugin extends Plugin {
  private store: SettingsStore | null = null;

  override async onload(): Promise<void> {
    const store = new SettingsStore(sanitizeSettings(await this.loadData()), (s) => this.saveData(s));
    const usage = new UsageTracker(store);
    const notify = (message: string) => {
      new Notice(message);
    };
    const getActiveEditor = () => getEditableEditor(this.app);
    const env = {
      getDailyNoteFormat: () => getDailyNoteFormat(this.app),
      isNaturalLanguageDatesEnabled: () => isCommunityPluginEnabled(this.app, NATURAL_LANGUAGE_DATES_ID)
    };
    const now = currentMoment;
    const insert = new InsertService({
      store,
      usage,
      getActiveEditor,
      notify,
      now,
      getDailyNoteFormat: env.getDailyNoteFormat,
      messages: STRINGS.notices.failure
    });
    const ctx: FeatureContext = {
      plugin: this,
      store,
      insert,
      env,
      session: { calendarPresetId: null },
      now,
      getActiveEditor,
      notify
    };
    for (const feature of FEATURES) feature.register(ctx);
    this.store = store;
    this.register(() => {
      usage.dispose();
      void store.flush();
    });
  }

  /** Settings changed on another device via Sync. */
  override async onExternalSettingsChange(): Promise<void> {
    if (!this.store) return;
    this.store.replace(sanitizeSettings(await this.loadData()));
  }
}
