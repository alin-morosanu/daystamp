import { EditorSuggest } from 'obsidian';
import type {
  App,
  Editor,
  EditorPosition,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile
} from 'obsidian';
import type { Moment } from 'moment';

import { orderDefaultFirst } from '../core/presets';
import {
  filterPresets,
  findTrigger,
  isInBlockedSection,
  isInInlineCode,
  parseTriggerQuery
} from '../core/query';
import type { QueryMatch } from '../core/query';
import type { InsertResult, Preset } from '../core/types';
import type { EditorRange, InsertService } from '../services/insert-service';
import type { SettingsStore } from '../services/settings-store';
import { STRINGS } from '../strings';

type SuggestItem =
  | {
      readonly kind: 'preset';
      readonly preset: Preset;
      readonly result: InsertResult;
      readonly isDefault: boolean;
      /** Shown on the first row only: "+3 days → Wed, 28 Oct". */
      readonly header: string | null;
    }
  | { readonly kind: 'calendar' };

export interface DateSuggestDeps {
  readonly store: SettingsStore;
  readonly insert: InsertService;
  readonly now: () => Moment;
  /** True while an IME composition is active; the trigger is ignored then. */
  readonly isComposing: () => boolean;
  readonly openCalendar: (editor: Editor, range: EditorRange) => void;
  readonly describeFailure: (result: Extract<InsertResult, { ok: false }>) => string;
}

/** The inline trigger popup (`@@`). */
export class DateSuggest extends EditorSuggest<SuggestItem> {
  private match: QueryMatch | null = null;

  constructor(
    app: App,
    private readonly deps: DateSuggestDeps
  ) {
    super(app);
    this.setInstructions([
      { command: '↑↓', purpose: STRINGS.suggest.instructionNavigate },
      { command: '↵', purpose: STRINGS.suggest.instructionInsert },
      { command: 'esc', purpose: STRINGS.suggest.instructionDismiss }
    ]);
  }

  /** Runs on every keystroke: cheapest checks first, stop at the first that fails. */
  onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
    const settings = this.deps.store.get();
    if (!settings.triggerEnabled) return null;
    const line = editor.getLine(cursor.line);
    const hit = findTrigger(line, cursor.ch, settings.trigger, this.deps.store.getDerived().triggerPattern);
    if (!hit || this.deps.isComposing()) return null;
    if (isInInlineCode(line, hit.start)) return null;
    if (file && isInBlockedSection(this.app.metadataCache.getFileCache(file)?.sections, cursor.line))
      return null;
    return { start: { line: cursor.line, ch: hit.start }, end: cursor, query: hit.query };
  }

  getSuggestions(context: EditorSuggestContext): SuggestItem[] {
    const settings = this.deps.store.get();
    const now = this.deps.now();
    const match = parseTriggerQuery(context.query, now);
    this.match = match;
    const defaultId = this.deps.store.getDerived().defaultPreset.id;
    const header =
      match.label?.kind === 'offset'
        ? STRINGS.suggest.offset(
            match.label.days,
            now.clone().add(match.label.days, 'days').format('ddd, D MMM')
          )
        : null;
    const items: SuggestItem[] = filterPresets(orderDefaultFirst(settings), match.filter).map(
      (preset, i) => ({
        kind: 'preset',
        preset,
        result: this.deps.insert.preview({ presetId: preset.id, extraOffset: match.offsetDays }),
        isDefault: preset.id === defaultId,
        header: i === 0 ? header : null
      })
    );
    items.push({ kind: 'calendar' });
    return items;
  }

  renderSuggestion(item: SuggestItem, el: HTMLElement): void {
    el.addClass('mod-complex', 'daystamp-suggest');
    const content = el.createDiv({ cls: 'suggestion-content' });
    if (item.kind === 'calendar') {
      content.createDiv({ cls: 'suggestion-title', text: STRINGS.suggest.calendarItem });
      content.createDiv({ cls: 'suggestion-note', text: STRINGS.suggest.calendarHint });
      return;
    }
    if (item.header) content.createDiv({ cls: 'daystamp-suggest__header', text: item.header });
    content.createDiv({
      cls: 'suggestion-title',
      text: item.result.ok ? item.result.text : this.deps.describeFailure(item.result)
    });
    content.createDiv({
      cls: 'suggestion-note',
      text: STRINGS.suggest.meta(item.preset.name, item.preset.format)
    });
    if (item.isDefault) {
      el.createDiv({ cls: 'suggestion-aux' }).createSpan({
        cls: 'daystamp-badge',
        text: STRINGS.suggest.defaultBadge
      });
    }
  }

  selectSuggestion(item: SuggestItem): void {
    const context = this.context;
    if (!context) return;
    const range: EditorRange = { from: context.start, to: context.end };
    const editor = context.editor;
    const offset = this.match?.offsetDays ?? 0;
    this.close();
    if (item.kind === 'calendar') {
      this.deps.openCalendar(editor, range);
      return;
    }
    this.deps.insert.insert({ presetId: item.preset.id, extraOffset: offset, range, editor });
  }
}
