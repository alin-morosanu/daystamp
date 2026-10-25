import type { App } from 'obsidian';

import { MAX_FORMAT_LENGTH } from '../core/settings-schema';

/*
 * The ONLY place that reads undocumented Obsidian internals.
 * Everything here is read-only, typed as a narrow optional shape instead of `any`,
 * returns a fallback instead of throwing, and is never called on the keystroke path.
 */

interface InternalPluginsShape {
  internalPlugins?: {
    getPluginById?: (
      id: string
    ) => { enabled?: unknown; instance?: { options?: { format?: unknown } } } | null;
  };
  plugins?: { enabledPlugins?: { has?: (id: string) => boolean } };
}

/**
 * Reads the core Daily Notes "Date format" option. Returns null when the plugin is off,
 * the internals moved, or the value is not a usable format; callers then use YYYY-MM-DD.
 */
export function getDailyNoteFormat(app: App): string | null {
  try {
    const plugin = (app as unknown as InternalPluginsShape).internalPlugins?.getPluginById?.('daily-notes');
    if (!plugin || plugin.enabled !== true) return null;
    const format = plugin.instance?.options?.format;
    if (typeof format !== 'string') return null;
    const trimmed = format.trim();
    return trimmed && trimmed.length <= MAX_FORMAT_LENGTH ? trimmed : null;
  } catch {
    return null;
  }
}

/** Whether a community plugin is enabled (used for the Natural Language Dates hint); false if unknown. */
export function isCommunityPluginEnabled(app: App, id: string): boolean {
  try {
    return (app as unknown as InternalPluginsShape).plugins?.enabledPlugins?.has?.(id) === true;
  } catch {
    return false;
  }
}
