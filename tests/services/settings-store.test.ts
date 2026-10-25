import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { removePreset } from '../../src/core/presets';
import { createDefaultSettings } from '../../src/core/settings-schema';
import { SettingsStore } from '../../src/services/settings-store';
import { UsageTracker } from '../../src/services/usage-tracker';

describe('SettingsStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const make = () => {
    const persist = vi.fn((_settings: unknown) => Promise.resolve());
    return { persist, store: new SettingsStore(createDefaultSettings(), persist) };
  };

  it('notifies listeners right away and saves once after the debounce', () => {
    const { store, persist } = make();
    const listener = vi.fn();
    store.onChange(listener);
    store.update((s) => ({ ...s, trigger: ';' }));
    store.update((s) => ({ ...s, trigger: ';;' }));
    expect(listener).toHaveBeenCalledTimes(2);
    expect(persist).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(persist).toHaveBeenCalledOnce();
    expect(persist.mock.calls[0]?.[0]).toMatchObject({ trigger: ';;' });
  });

  it('does nothing when the update returns the same object', () => {
    const { store, persist } = make();
    const listener = vi.fn();
    store.onChange(listener);
    store.update((s) => s);
    vi.advanceTimersByTime(1000);
    expect(listener).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it('flushes a pending save immediately', async () => {
    const { store, persist } = make();
    store.update((s) => ({ ...s, spaceAfter: true }));
    await store.flush();
    expect(persist).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1000);
    expect(persist).toHaveBeenCalledOnce();
  });

  it('does not save on flush when nothing is pending', async () => {
    const { store, persist } = make();
    await store.flush();
    expect(persist).not.toHaveBeenCalled();
  });

  it('applies external changes without saving them back', () => {
    const { store, persist } = make();
    const listener = vi.fn();
    store.onChange(listener);
    store.replace({ ...store.get(), trigger: '!!' });
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledOnce();
    expect(persist).not.toHaveBeenCalled();
  });

  it('keeps derived values current and reuses the regex when the trigger is unchanged', () => {
    const { store } = make();
    const first = store.getDerived().triggerPattern;
    store.update((s) => removePreset(s, 'date'));
    expect(store.getDerived().triggerPattern).toBe(first);
    expect(store.getDerived().defaultPreset.id).toBe('date-time');
    expect(store.getDerived().presetsById.has('date')).toBe(false);
    store.update((s) => ({ ...s, trigger: '!!' }));
    expect(store.getDerived().triggerPattern).not.toBe(first);
    expect(store.getDerived().triggerPattern.test('!!+1')).toBe(true);
  });

  it('stops notifying after unsubscribe', () => {
    const { store } = make();
    const listener = vi.fn();
    const off = store.onChange(listener);
    off();
    store.update((s) => ({ ...s, spaceAfter: true }));
    expect(listener).not.toHaveBeenCalled();
  });

  it('logs instead of throwing when saving fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = new SettingsStore(createDefaultSettings(), () => Promise.reject(new Error('disk')));
    store.update((s) => ({ ...s, spaceAfter: true }));
    await store.flush();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('UsageTracker', () => {
  it('ignores invalid and deleted ids, keeps a null prototype', () => {
    const store = new SettingsStore(createDefaultSettings(), () => Promise.resolve());
    const usage = new UsageTracker(store);
    usage.record('__proto__');
    usage.record('date');
    usage.record('gone');
    usage.dispose();
    expect(Object.getPrototypeOf(store.get().usage)).toBeNull();
    expect({ ...store.get().usage }).toEqual({ date: 1 });
  });
});
