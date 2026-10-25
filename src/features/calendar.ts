import { moment, setTooltip } from 'obsidian';
import type { Editor } from 'obsidian';

import { resolveWeekStart } from '../core/calendar-grid';
import { isEditableContext } from '../services/insert-service';
import type { EditorRange } from '../services/insert-service';
import { STRINGS } from '../strings';
import { CalendarModal } from '../ui/calendar-modal';
import { describeFailure } from './feature';
import type { Feature, FeatureContext } from './feature';

export interface CalendarTarget {
  readonly editor?: Editor;
  /** Trigger text to replace on pick and delete on cancel. */
  readonly range?: EditorRange;
}

/** Opens the calendar for an editor captured now, so the insert lands at the original cursor. */
export function openCalendar(ctx: FeatureContext, target: CalendarTarget = {}): void {
  const editor = target.editor ?? ctx.getActiveEditor();
  if (!editor) {
    ctx.notify(STRINGS.notices.failure['no-editor']);
    return;
  }
  const settings = ctx.store.get();
  const derived = ctx.store.getDerived();
  const remembered = ctx.session.calendarPresetId;
  const range = target.range;
  new CalendarModal(ctx.plugin.app, {
    presets: settings.presets,
    initialPresetId:
      remembered && derived.presetsById.has(remembered) ? remembered : derived.defaultPreset.id,
    weekStart: resolveWeekStart(settings.weekStartsOn, moment.localeData().firstDayOfWeek()),
    preview: (presetId, day) => ctx.insert.preview({ presetId, date: day }),
    describeFailure,
    onPresetChange: (presetId) => {
      ctx.session.calendarPresetId = presetId;
    },
    onPick: (day, presetId) => {
      ctx.insert.insert({ presetId, date: day, editor, ...(range ? { range } : {}) });
    },
    onCancel: () => {
      if (range) ctx.insert.deleteRange(editor, range);
      else editor.focus();
    }
  }).open();
}

export const calendarFeature: Feature = {
  id: 'calendar',
  register(ctx) {
    ctx.plugin.addCommand({
      id: 'open-calendar',
      name: STRINGS.commands.openCalendar,
      icon: 'calendar-days',
      editorCheckCallback: (checking, editor, info) => {
        if (!isEditableContext(info)) return false;
        if (!checking) openCalendar(ctx, { editor });
        return true;
      }
    });

    const ribbon = ctx.plugin.addRibbonIcon('calendar-days', STRINGS.ribbon.calendar, () =>
      openCalendar(ctx)
    );
    setTooltip(ribbon, STRINGS.ribbon.calendar);
    const sync = () => ribbon.toggleClass('daystamp-hidden', !ctx.store.get().showCalendarRibbon);
    sync();
    ctx.plugin.register(
      ctx.store.onChange((prev, next) => {
        if (prev.showCalendarRibbon !== next.showCalendarRibbon) sync();
      })
    );
  }
};
