import moment from 'moment';
import { describe, expect, it, vi } from 'vitest';

import { setTransform, updatePreset } from '../../src/core/presets';
import { createDefaultSettings } from '../../src/core/settings-schema';
import type { Settings } from '../../src/core/types';
import { InsertService, isEditableContext } from '../../src/services/insert-service';
import { SettingsStore } from '../../src/services/settings-store';
import { UsageTracker } from '../../src/services/usage-tracker';
import { STRINGS } from '../../src/strings';
import { MarkdownView } from '../obsidian-stub';
import { FakeEditor } from './fake-editor';

const NOW = moment('2026-10-25T14:30:00');

function setup(
  settings: Settings = createDefaultSettings(),
  active: FakeEditor | null = null,
  daily: string | null = null
) {
  const store = new SettingsStore(settings, () => Promise.resolve());
  const usage = new UsageTracker(store);
  const notify = vi.fn<(message: string) => void>();
  const service = new InsertService({
    store,
    usage,
    getActiveEditor: () => active?.asEditor() ?? null,
    notify,
    now: () => NOW.clone(),
    getDailyNoteFormat: () => daily,
    messages: STRINGS.notices.failure
  });
  return { service, notify, usage, store };
}

describe('InsertService.insert', () => {
  it('inserts the preset at the cursor and puts the cursor after it', () => {
    const editor = new FakeEditor('Due ');
    const { service } = setup(undefined, editor);
    expect(service.insert({ presetId: 'date' })).toEqual({ ok: true, text: '2026-10-25' });
    expect(editor.show()).toBe('Due 2026-10-25|');
    expect(editor.transactions).toBe(1);
    expect(editor.focused).toBe(true);
  });

  it('replaces the selection', () => {
    const editor = new FakeEditor('Due XXX!', [4, 7]);
    setup(undefined, editor).service.insert({ presetId: 'date' });
    expect(editor.show()).toBe('Due 2026-10-25|!');
  });

  it('replaces the trigger range in a captured editor', () => {
    const editor = new FakeEditor('Due @@+3');
    const { service } = setup();
    service.insert({
      presetId: 'date',
      extraOffset: 3,
      editor: editor.asEditor(),
      range: { from: { line: 0, ch: 4 }, to: { line: 0, ch: 8 } }
    });
    expect(editor.show()).toBe('Due 2026-10-28|');
  });

  it('applies the preset offset', () => {
    const editor = new FakeEditor('');
    setup(undefined, editor).service.insert({ presetId: 'tomorrow' });
    expect(editor.text).toBe('2026-10-26');
  });

  it('uses the picked day at the current time plus the preset offset', () => {
    const editor = new FakeEditor('');
    const { service } = setup(undefined, editor);
    service.insert({ presetId: 'date-time', date: moment('2026-11-03T00:00:00') });
    expect(editor.text).toBe('2026-11-03 14:30');
    service.insert({ presetId: 'tomorrow', date: moment('2026-11-03T00:00:00') });
    expect(editor.text).toBe('2026-11-03 14:302026-11-04');
  });

  it('falls back to the default preset for an unknown id', () => {
    const editor = new FakeEditor('');
    setup(undefined, editor).service.insert({ presetId: 'gone' });
    expect(editor.text).toBe('2026-10-25');
  });

  it('shows a Notice and changes nothing without an editor', () => {
    const { service, notify } = setup();
    expect(service.insert({ presetId: 'date' })).toEqual({ ok: false, reason: 'no-editor' });
    expect(notify).toHaveBeenCalledWith('Open a note in editing mode to insert a date');
  });

  it('inserts nothing for an empty format', () => {
    const editor = new FakeEditor('x');
    const settings = updatePreset(createDefaultSettings(), 'date', { format: '' });
    const { service, notify } = setup(settings, editor);
    expect(service.insert({ presetId: 'date' }).ok).toBe(false);
    expect(editor.text).toBe('x');
    expect(notify).toHaveBeenCalledOnce();
  });

  it('inserts nothing for an invalid date', () => {
    const editor = new FakeEditor('x');
    const { service } = setup(undefined, editor);
    expect(service.insert({ presetId: 'date', date: moment.invalid() })).toEqual({
      ok: false,
      reason: 'invalid-date'
    });
    expect(editor.text).toBe('x');
  });

  it('turns an unexpected exception into a Notice instead of throwing', () => {
    const editor = new FakeEditor('x');
    editor.transaction = () => {
      throw new Error('boom');
    };
    const { service, notify } = setup(undefined, editor);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(service.insert({ presetId: 'date' })).toEqual({ ok: false, reason: 'error' });
    expect(notify).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  describe('space after insert', () => {
    const withSpace = { ...createDefaultSettings(), spaceAfter: true };

    it('adds a space and puts the cursor after it', () => {
      const editor = new FakeEditor('a');
      setup(withSpace, editor).service.insert({ presetId: 'date' });
      expect(editor.show()).toBe('a2026-10-25 |');
    });

    it('steps over an existing space instead of doubling it', () => {
      const editor = new FakeEditor('a b', [1, 1]);
      setup(withSpace, editor).service.insert({ presetId: 'date' });
      expect(editor.show()).toBe('a2026-10-25 |b');
    });
  });

  describe('link target', () => {
    const linked = setTransform(createDefaultSettings(), 'date-time', 'wiki-link', true);

    it('uses the Daily Notes format when the setting is empty', () => {
      const editor = new FakeEditor('');
      setup(linked, editor, 'DD.MM.YYYY').service.insert({ presetId: 'date-time' });
      expect(editor.text).toBe('[[25.10.2026|2026-10-25 14:30]]');
    });

    it('prefers the setting, and falls back to YYYY-MM-DD', () => {
      const a = new FakeEditor('');
      setup({ ...linked, linkTargetFormat: 'YYYY/MM/DD' }, a, 'DD.MM.YYYY').service.insert({
        presetId: 'date-time'
      });
      expect(a.text).toBe('[[2026/10/25|2026-10-25 14:30]]');
      const b = new FakeEditor('');
      setup(linked, b).service.insert({ presetId: 'date-time' });
      expect(b.text).toBe('[[2026-10-25|2026-10-25 14:30]]');
    });
  });

  it('records usage without saving on every insert', () => {
    vi.useFakeTimers();
    const persist = vi.fn(() => Promise.resolve());
    const store = new SettingsStore(createDefaultSettings(), persist);
    const usage = new UsageTracker(store);
    const editor = new FakeEditor('');
    const service = new InsertService({
      store,
      usage,
      getActiveEditor: () => editor.asEditor(),
      notify: () => undefined,
      now: () => NOW.clone(),
      getDailyNoteFormat: () => null,
      messages: STRINGS.notices.failure
    });
    service.insert({ presetId: 'date' });
    service.insert({ presetId: 'date' });
    vi.advanceTimersByTime(1000);
    expect(persist).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10_000);
    expect(store.get().usage.date).toBe(2);
    vi.advanceTimersByTime(1000);
    expect(persist).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});

describe('InsertService.deleteRange', () => {
  it('removes the trigger text when the calendar is cancelled', () => {
    const editor = new FakeEditor('Due @@ x');
    setup().service.deleteRange(editor.asEditor(), { from: { line: 0, ch: 4 }, to: { line: 0, ch: 6 } });
    expect(editor.show()).toBe('Due | x');
  });
});

describe('isEditableContext', () => {
  it('rejects Reading view and missing editors', () => {
    const editor = new FakeEditor('').asEditor();
    expect(isEditableContext(new MarkdownView(editor, 'preview') as never)).toBe(false);
    expect(isEditableContext(new MarkdownView(editor, 'source') as never)).toBe(true);
    expect(isEditableContext({ editor } as never)).toBe(true);
    expect(isEditableContext(null)).toBe(false);
  });
});
