import { DateSuggest } from '../ui/date-suggest';
import { openCalendar } from './calendar';
import { describeFailure } from './feature';
import type { Feature } from './feature';

/** The `@@` suggester. Tracks IME composition per window so the trigger never fires mid-composition. */
export const inlineTriggerFeature: Feature = {
  id: 'inline-trigger',
  register(ctx) {
    const plugin = ctx.plugin;
    let composing = false;
    const track = (doc: Document) => {
      plugin.registerDomEvent(doc, 'compositionstart', () => (composing = true), true);
      plugin.registerDomEvent(doc, 'compositionend', () => (composing = false), true);
    };
    track(activeDocument);
    plugin.registerEvent(plugin.app.workspace.on('window-open', (win) => track(win.doc)));

    plugin.registerEditorSuggest(
      new DateSuggest(plugin.app, {
        store: ctx.store,
        insert: ctx.insert,
        now: ctx.now,
        isComposing: () => composing,
        openCalendar: (editor, range) => openCalendar(ctx, { editor, range }),
        describeFailure
      })
    );
  }
};
