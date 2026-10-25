import { MarkdownView } from 'obsidian';
import type { App, Editor, EditorPosition, MarkdownFileInfo } from 'obsidian';
import type { Moment } from 'moment';

import { atTimeOfDay, resolveDate } from '../core/date';
import { FALLBACK_LINK_FORMAT, render } from '../core/format';
import type { InsertFailure, InsertResult, Preset } from '../core/types';
import type { SettingsStore } from './settings-store';
import type { UsageTracker } from './usage-tracker';

export interface EditorRange {
  readonly from: EditorPosition;
  readonly to: EditorPosition;
}

export interface InsertRequest {
  readonly presetId: string;
  /** A calendar pick: this day at the current time, plus the preset offset. Otherwise "now". */
  readonly date?: Moment;
  /** From the inline trigger query, e.g. `@@+3`. */
  readonly extraOffset?: number;
  /** Text to replace (the trigger and query); otherwise the selection. */
  readonly range?: EditorRange;
  /** Editor captured by the suggester, calendar or command; otherwise the active editable one. */
  readonly editor?: Editor;
}

export type PreviewRequest = Pick<InsertRequest, 'presetId' | 'date' | 'extraOffset'>;

export interface InsertDeps {
  readonly store: SettingsStore;
  readonly usage: UsageTracker;
  readonly getActiveEditor: () => Editor | null;
  readonly notify: (message: string) => void;
  readonly now: () => Moment;
  readonly getDailyNoteFormat: () => string | null;
  readonly messages: Readonly<Record<InsertFailure, string>>;
}

/** The single insert pipeline every entry point goes through (docs/developer/architecture.md). */
export class InsertService {
  constructor(private readonly deps: InsertDeps) {}

  /** Renders without touching an editor: used for suggester rows, calendar and settings previews. */
  preview(request: PreviewRequest): InsertResult {
    const preset = this.findPreset(request.presetId);
    const now = this.deps.now();
    // The preset offset applies to every entry point, the calendar included.
    const base = request.date ? atTimeOfDay(request.date, now) : now;
    const date = resolveDate(base, preset, request.extraOffset ?? 0);
    return render(preset, date, this.linkTargetFormat());
  }

  /** Renders and inserts; failures become a Notice and leave the note untouched. Never throws. */
  insert(request: InsertRequest): InsertResult {
    try {
      const editor = request.editor ?? this.deps.getActiveEditor();
      if (!editor) return this.fail('no-editor');
      const result = this.preview(request);
      if (!result.ok) return this.fail(result.reason);
      this.write(editor, result.text, request.range);
      this.deps.usage.record(this.findPreset(request.presetId).id);
      return result;
    } catch (err) {
      console.error('[daystamp]', err);
      return this.fail('error');
    }
  }

  /** Deletes the trigger text when the calendar opened from the suggester is cancelled. */
  deleteRange(editor: Editor, range: EditorRange): void {
    editor.transaction({ changes: [{ from: range.from, to: range.to, text: '' }] });
    editor.setCursor(range.from);
    editor.focus();
  }

  /** One transaction, so one undo step. v2 multi-cursor changes only this method. */
  private write(editor: Editor, rendered: string, range: EditorRange | undefined): void {
    const from = range?.from ?? editor.getCursor('from');
    const to = range?.to ?? editor.getCursor('to');
    let text = rendered;
    let skip = 0;
    if (this.deps.store.get().spaceAfter) {
      // Never double a space that is already there; step over it instead.
      if (editor.getRange(to, { line: to.line, ch: to.ch + 1 }) === ' ') skip = 1;
      else text += ' ';
    }
    const end = editor.posToOffset(from) + text.length + skip;
    editor.transaction({ changes: [{ from, to, text }] });
    editor.setCursor(editor.offsetToPos(end));
    editor.focus();
  }

  /** Unknown ids (a preset deleted while a popup was open) fall back to the default preset. */
  private findPreset(id: string): Preset {
    const derived = this.deps.store.getDerived();
    return derived.presetsById.get(id) ?? derived.defaultPreset;
  }

  private linkTargetFormat(): string {
    return this.deps.store.get().linkTargetFormat || this.deps.getDailyNoteFormat() || FALLBACK_LINK_FORMAT;
  }

  private fail(reason: InsertFailure): InsertResult {
    this.deps.notify(this.deps.messages[reason]);
    return { ok: false, reason };
  }
}

/** False for a Markdown view in Reading mode; true for source, live preview, embedded and canvas editors. */
export function isEditableContext(info: MarkdownView | MarkdownFileInfo | null | undefined): boolean {
  if (!info?.editor) return false;
  return !(info instanceof MarkdownView && info.getMode() === 'preview');
}

/** The active editor if it can be typed into, else null. */
export function getEditableEditor(app: App): Editor | null {
  const info = app.workspace.activeEditor;
  return isEditableContext(info) ? (info?.editor ?? null) : null;
}
