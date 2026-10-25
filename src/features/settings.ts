import { DaystampSettingTab } from '../ui/settings-tab';
import { describeFailure } from './feature';
import type { Feature } from './feature';

export const settingsFeature: Feature = {
  id: 'settings',
  register(ctx) {
    ctx.plugin.addSettingTab(
      new DaystampSettingTab(ctx.plugin.app, ctx.plugin, {
        store: ctx.store,
        insert: ctx.insert,
        now: ctx.now,
        getDailyNoteFormat: ctx.env.getDailyNoteFormat,
        isNaturalLanguageDatesEnabled: ctx.env.isNaturalLanguageDatesEnabled,
        describeFailure
      })
    );
  }
};
