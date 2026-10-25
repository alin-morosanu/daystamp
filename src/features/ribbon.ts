import { setTooltip } from 'obsidian';

import type { Settings } from '../core/types';
import { getDefaultPreset } from '../core/presets';
import { STRINGS } from '../strings';
import type { Feature } from './feature';

function tooltip(settings: Settings): string {
  const preset = getDefaultPreset(settings);
  return STRINGS.ribbon.insert(preset.name, preset.format);
}

/** One click inserts the default preset; the tooltip follows the default. */
export const ribbonFeature: Feature = {
  id: 'ribbon',
  register(ctx) {
    const settings = ctx.store.get();
    const el = ctx.plugin.addRibbonIcon('calendar-clock', tooltip(settings), () => {
      ctx.insert.insert({ presetId: ctx.store.getDerived().defaultPreset.id });
    });
    ctx.plugin.register(
      ctx.store.onChange((prev, next) => {
        const text = tooltip(next);
        if (text === tooltip(prev)) return;
        el.setAttr('aria-label', text);
        setTooltip(el, text);
      })
    );
  }
};
