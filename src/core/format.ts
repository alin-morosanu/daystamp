import type { Moment } from 'moment';

import type { InsertResult, Preset } from './types';

export const FALLBACK_LINK_FORMAT = 'YYYY-MM-DD';

export interface RenderContext {
  readonly date: Moment;
  /** Already resolved: the setting, else the Daily Notes format, else FALLBACK_LINK_FORMAT. */
  readonly linkTargetFormat: string;
}

export interface OutputTransform {
  readonly id: string;
  apply(text: string, ctx: RenderContext): string;
}

const LINK_MARKUP = /[[\]|]/gu;
const RISKY_LINK_CHARS = /[:\\#^]/u;

/** Removes `[ ] |` so a format cannot break out of `[[…]]` or add an alias. */
export function sanitizeLinkTarget(target: string): string {
  return target.replace(LINK_MARKUP, '').trim();
}

/** True when a link target contains characters Obsidian treats specially in links (`: \ # ^`). */
export function hasRiskyLinkChars(target: string): boolean {
  return RISKY_LINK_CHARS.test(target);
}

const BRACKETED_LITERAL = /\[[^\]]*\]/gu;
const TIME_TOKENS = /[HhkmsSaAXx]|LT/u;

/** True when a moment format shows a time of day (literals in [brackets] ignored); drives the calendar time hint. */
export function hasTimeTokens(format: string): boolean {
  return TIME_TOKENS.test(format.replace(BRACKETED_LITERAL, ''));
}

/** `[[target|display]]`, or `[[target]]` when both are equal; falls back to plain text if the target is empty. */
export const wikiLinkTransform: OutputTransform = {
  id: 'wiki-link',
  apply(text, ctx) {
    const target = sanitizeLinkTarget(ctx.date.format(ctx.linkTargetFormat || FALLBACK_LINK_FORMAT));
    if (!target) return text;
    const alias = text.replace(/[[\]]/gu, '');
    return alias === target ? `[[${target}]]` : `[[${target}|${alias}]]`;
  }
};

/** Applied in this order for every transform a preset enables. */
export const TRANSFORMS: ReadonlyArray<OutputTransform> = [wikiLinkTransform];

/** Formats `date` with the preset and its transforms; empty formats and invalid dates are failures, never text. */
export function render(
  preset: Pick<Preset, 'format' | 'transforms'>,
  date: Moment,
  linkTargetFormat: string,
  transforms: ReadonlyArray<OutputTransform> = TRANSFORMS
): InsertResult {
  if (preset.format.trim() === '') return { ok: false, reason: 'empty-format' };
  if (!date.isValid()) return { ok: false, reason: 'invalid-date' };
  const ctx: RenderContext = { date, linkTargetFormat };
  let text = date.format(preset.format);
  for (const transform of transforms) {
    if (preset.transforms.includes(transform.id)) text = transform.apply(text, ctx);
  }
  return { ok: true, text };
}
