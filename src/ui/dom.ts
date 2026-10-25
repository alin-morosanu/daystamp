import { Notice, setIcon, setTooltip } from 'obsidian';
import type { IconName } from 'obsidian';

export const UNDO_NOTICE_MS = 5000;

let nextId = 0;

/** A document-unique id for aria-labelledby / aria-describedby links. */
export function uniqueId(prefix: string): string {
  nextId += 1;
  return `daystamp-${prefix}-${nextId}`;
}

/** Gives `el` an id if it has none and returns it. */
export function ensureId(el: HTMLElement, prefix: string): string {
  if (!el.id) el.id = uniqueId(prefix);
  return el.id;
}

/** Links `target` to the elements that describe it (read on focus, not as a live region). */
export function describeBy(target: HTMLElement, ...descriptions: HTMLElement[]): void {
  target.setAttr('aria-describedby', descriptions.map((d) => ensureId(d, 'desc')).join(' '));
}

/** An icon-only button with an accessible name and a matching tooltip. */
export function iconButton(
  parent: HTMLElement,
  icon: IconName,
  label: string,
  onClick: (evt: MouseEvent) => void
): HTMLButtonElement {
  const button = parent.createEl('button', {
    cls: 'clickable-icon daystamp-icon-button',
    attr: { type: 'button', 'aria-label': label }
  });
  setIcon(button, icon);
  setTooltip(button, label);
  button.addEventListener('click', onClick);
  return button;
}

/** A warning line marked with an icon and text, never color alone. */
export function warningLine(parent: HTMLElement, text: string): HTMLElement {
  const el = parent.createDiv({ cls: 'daystamp-warning', attr: { role: 'note' } });
  setIcon(
    el.createSpan({ cls: 'daystamp-warning__icon', attr: { 'aria-hidden': 'true' } }),
    'alert-triangle'
  );
  el.createSpan({ text });
  return el;
}

/** A Notice with an Undo button, used instead of confirmation dialogs. */
export function showUndoNotice(message: string, undoLabel: string, onUndo: () => void): void {
  const fragment = createFragment((f) => {
    f.createSpan({ text: message });
  });
  const notice = new Notice(fragment, UNDO_NOTICE_MS);
  const button = notice.messageEl.createEl('button', {
    cls: 'daystamp-undo',
    text: undoLabel,
    attr: { type: 'button' }
  });
  button.addEventListener('click', (evt) => {
    evt.stopPropagation();
    onUndo();
    notice.hide();
  });
}
