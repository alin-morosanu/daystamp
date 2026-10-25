import { isEditableContext } from '../services/insert-service';
import { STRINGS } from '../strings';
import { openCalendar } from './calendar';
import type { Feature } from './feature';

/** "Insert date" and "Insert date from calendar…" in the editor context menu. */
export const editorMenuFeature: Feature = {
  id: 'editor-menu',
  register(ctx) {
    ctx.plugin.registerEvent(
      ctx.plugin.app.workspace.on('editor-menu', (menu, editor, info) => {
        if (!isEditableContext(info)) return;
        menu.addItem((item) =>
          item
            .setTitle(STRINGS.menu.insert)
            .setIcon('calendar-clock')
            .onClick(() => ctx.insert.insert({ presetId: ctx.store.getDerived().defaultPreset.id, editor }))
        );
        menu.addItem((item) =>
          item
            .setTitle(STRINGS.menu.calendar)
            .setIcon('calendar-days')
            .onClick(() => openCalendar(ctx, { editor }))
        );
      })
    );
  }
};
