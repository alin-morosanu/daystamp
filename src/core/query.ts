import type { Moment } from 'moment';

import type { Preset } from './types';

/** How far back from the cursor the trigger may start; also bounds regex input. */
export const MAX_TRIGGER_WINDOW = 50;

/** Structured description of what a parser understood; the UI turns it into text. */
export type QueryLabel = { readonly kind: 'offset'; readonly days: number };

export interface QueryMatch {
  /** Whole days added on top of each preset's own offset. */
  readonly offsetDays: number;
  /** Text left over for filtering presets by name. */
  readonly filter: string;
  readonly label: QueryLabel | null;
}

export interface QueryParser {
  readonly id: string;
  parse(query: string, now: Moment): QueryMatch | null;
}

const OFFSET_PATTERN = /^([+-]?)(\d{1,3})(?!\d)\s*(.*)$/su;
const LONE_SIGN_PATTERN = /^[+-](?!\d)\s*(.*)$/su;

/** `+3`, `-1`, `3` (= +3), optionally followed by filter text: `+3 date`. More than 3 digits is not an offset. */
export const offsetParser: QueryParser = {
  id: 'offset',
  parse(query) {
    const match = OFFSET_PATTERN.exec(query);
    if (!match) return null;
    const days = Number(match[2]) * (match[1] === '-' ? -1 : 1);
    return { offsetDays: days, filter: (match[3] ?? '').trim(), label: { kind: 'offset', days } };
  }
};

/** Fallback: everything is filter text. A sign with no digits yet (`@@+`) is dropped so the list stays visible. */
export const filterOnlyParser: QueryParser = {
  id: 'filter',
  parse(query) {
    const sign = LONE_SIGN_PATTERN.exec(query);
    return { offsetDays: 0, filter: (sign ? (sign[1] ?? '') : query).trim(), label: null };
  }
};

/** Tried in order; the first match wins. v2 natural language adds a parser here. */
export const QUERY_PARSERS: ReadonlyArray<QueryParser> = [offsetParser, filterOnlyParser];

/** Parses the text typed after the trigger; always returns a match (the fallback accepts anything). */
export function parseTriggerQuery(
  query: string,
  now: Moment,
  parsers: ReadonlyArray<QueryParser> = QUERY_PARSERS
): QueryMatch {
  for (const parser of parsers) {
    const match = parser.parse(query, now);
    if (match) return match;
  }
  return { offsetDays: 0, filter: query.trim(), label: null };
}

/** Escapes text for literal use in a `u`-flag RegExp. */
export function escapeRegExp(text: string): string {
  return text.replace(/[\\^$.*+?()[\]{}|/]/gu, '\\$&');
}

/**
 * Compiles the trigger pattern once per trigger change. Linear-time: no nested quantifiers,
 * offset capped at 3 digits, Unicode letters so names with diacritics filter.
 */
export function buildTriggerPattern(trigger: string): RegExp {
  return new RegExp(`^${escapeRegExp(trigger)}([+-]?\\d{0,3}\\s*[\\p{L}\\p{N}_+-]*)$`, 'u');
}

export interface TriggerHit {
  /** Column where the trigger starts. */
  readonly start: number;
  readonly query: string;
}

/**
 * Hot path, runs on every keystroke: a backward scan over at most MAX_TRIGGER_WINDOW chars
 * (never the whole line), the regex only after that finds the trigger, and no allocation before it.
 */
export function findTrigger(line: string, ch: number, trigger: string, pattern: RegExp): TriggerHit | null {
  const min = Math.max(0, ch - MAX_TRIGGER_WINDOW);
  let start = -1;
  for (let i = ch - trigger.length; i >= min; i--) {
    if (line.startsWith(trigger, i)) {
      start = i;
      break;
    }
  }
  if (start < 0) return null;
  const match = pattern.exec(line.slice(start, ch));
  if (!match) return null;
  return { start, query: match[1] ?? '' };
}

/** True when an odd number of backticks precede `index` on the line, i.e. we are inside inline code. */
export function isInInlineCode(line: string, index: number): boolean {
  let count = 0;
  for (let i = 0; i < index; i++) if (line.charCodeAt(i) === 96) count++;
  return count % 2 === 1;
}

/** Structural subset of Obsidian's SectionCache, so core stays free of the obsidian import. */
export interface SectionLike {
  readonly type: string;
  readonly position: { readonly start: { readonly line: number }; readonly end: { readonly line: number } };
}

const BLOCKED_SECTION_TYPES: ReadonlySet<string> = new Set(['code', 'yaml']);

/** True when `line` falls inside a fenced code block or the frontmatter. */
export function isInBlockedSection(sections: ReadonlyArray<SectionLike> | undefined, line: number): boolean {
  if (!sections) return false;
  return sections.some(
    (s) => BLOCKED_SECTION_TYPES.has(s.type) && line >= s.position.start.line && line <= s.position.end.line
  );
}

/** Presets whose name contains `filter`, case-insensitively and Unicode-normalised; empty filter keeps all. */
export function filterPresets(presets: ReadonlyArray<Preset>, filter: string): Preset[] {
  const needle = normalise(filter);
  if (!needle) return [...presets];
  return presets.filter((p) => normalise(p.name).includes(needle));
}

function normalise(text: string): string {
  return text.normalize('NFC').toLocaleLowerCase();
}
