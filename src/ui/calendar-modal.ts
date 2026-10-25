import { Modal, moment } from 'obsidian';
import type { App } from 'obsidian';
import type { Moment } from 'moment';

import { buildMonthGrid, moveFocus, weekdayOrder } from '../core/calendar-grid';
import { hasTimeTokens } from '../core/format';
import type { InsertResult, Preset } from '../core/types';
import { STRINGS } from '../strings';
import { describeBy, ensureId, iconButton } from './dom';

export interface CalendarModalOptions {
  readonly presets: ReadonlyArray<Preset>;
  readonly initialPresetId: string;
  /** 0 = Sunday, 1 = Monday, already resolved from the setting and locale. */
  readonly weekStart: number;
  readonly preview: (presetId: string, day: Moment) => InsertResult;
  readonly describeFailure: (result: Extract<InsertResult, { ok: false }>) => string;
  readonly onPresetChange: (presetId: string) => void;
  /** Called after the modal has closed, so focus can go back to the editor. */
  readonly onPick: (day: Moment, presetId: string) => void;
  readonly onCancel: () => void;
}

const MIN_YEAR = 1000;
const MAX_YEAR = 9999;

interface CellRef {
  readonly el: HTMLElement;
  readonly date: Moment;
}

/** Month calendar following the ARIA date-grid pattern. */
export class CalendarModal extends Modal {
  private focused: Moment = moment().startOf('day');
  private shownMonth: Moment | null = null;
  private presetId: string;
  private picked = false;
  private cells: CellRef[] = [];
  private readonly titleButton: HTMLButtonElement;
  private readonly pickersEl: HTMLElement;
  private readonly monthSelect: HTMLSelectElement;
  private readonly yearInput: HTMLInputElement;
  private readonly bodyEl: HTMLElement;
  private readonly previewEl: HTMLElement;
  private readonly timeHintEl: HTMLElement;

  /** The DOM is built here, once per open (a new modal is created for every use). */
  constructor(
    app: App,
    private readonly options: CalendarModalOptions
  ) {
    super(app);
    this.presetId = options.initialPresetId;
    this.setTitle(STRINGS.calendar.title);
    this.modalEl.addClass('daystamp-calendar-modal');
    const root = this.contentEl.createDiv({ cls: 'daystamp-calendar' });
    const nav = root.createDiv({ cls: 'daystamp-calendar__nav' });
    this.titleButton = this.buildNav(nav);
    this.pickersEl = root.createDiv({ cls: 'daystamp-calendar__pickers daystamp-hidden' });
    this.monthSelect = this.buildMonthSelect(this.pickersEl);
    this.yearInput = this.buildYearInput(this.pickersEl);
    this.titleButton.setAttr('aria-controls', ensureId(this.pickersEl, 'pickers'));
    const grid = this.buildGrid(root);
    this.bodyEl = grid.createDiv({ cls: 'daystamp-calendar__body', attr: { role: 'rowgroup' } });
    const footer = root.createDiv({ cls: 'daystamp-calendar__footer' });
    this.timeHintEl = this.buildPresetPicker(footer);
    this.previewEl = footer.createDiv({ cls: 'daystamp-calendar__preview' });
    describeBy(grid, this.previewEl);
    this.buildActions(footer);
  }

  override onOpen(): void {
    this.renderMonth();
    this.updatePreview();
    // Obsidian focuses the modal's first control after onOpen; move focus to the day afterwards.
    this.contentEl.win.setTimeout(() => this.focusedCell()?.el.focus(), 0);
  }

  override onClose(): void {
    this.contentEl.empty();
    if (this.picked) this.options.onPick(this.focused.clone(), this.presetId);
    else this.options.onCancel();
  }

  private buildNav(nav: HTMLElement): HTMLButtonElement {
    iconButton(nav, 'chevron-left', STRINGS.calendar.previousMonth, () => this.shift(-1, 'month'));
    const title = nav.createEl('button', {
      cls: 'daystamp-calendar__title',
      attr: { type: 'button', 'aria-live': 'polite', 'aria-expanded': 'false' }
    });
    title.addEventListener('click', () => this.togglePickers());
    iconButton(nav, 'chevron-right', STRINGS.calendar.nextMonth, () => this.shift(1, 'month'));
    const today = nav.createEl('button', {
      cls: 'daystamp-calendar__today',
      text: STRINGS.calendar.today,
      attr: { type: 'button' }
    });
    today.addEventListener('click', () => this.setFocused(moment(), true));
    return title;
  }

  private buildMonthSelect(parent: HTMLElement): HTMLSelectElement {
    const select = parent.createEl('select', {
      cls: 'dropdown',
      attr: { 'aria-label': STRINGS.calendar.month }
    });
    moment.months().forEach((name, i) => select.createEl('option', { text: name, value: String(i) }));
    select.addEventListener('change', () =>
      this.setFocused(this.focused.clone().month(Number(select.value)), false)
    );
    return select;
  }

  private buildYearInput(parent: HTMLElement): HTMLInputElement {
    const input = parent.createEl('input', {
      type: 'number',
      attr: { 'aria-label': STRINGS.calendar.year, min: String(MIN_YEAR), max: String(MAX_YEAR) }
    });
    input.addEventListener('change', () => {
      const year = Math.trunc(Number(input.value));
      if (year >= MIN_YEAR && year <= MAX_YEAR) this.setFocused(this.focused.clone().year(year), false);
    });
    return input;
  }

  private buildGrid(root: HTMLElement): HTMLElement {
    const grid = root.createDiv({
      cls: 'daystamp-calendar__grid',
      attr: { role: 'grid', 'aria-labelledby': ensureId(this.titleButton, 'title') }
    });
    const head = grid.createDiv({ cls: 'daystamp-calendar__row', attr: { role: 'row' } });
    const locale = moment.localeData();
    for (const day of weekdayOrder(this.options.weekStart)) {
      head.createDiv({
        cls: 'daystamp-calendar__weekday',
        text: locale.weekdaysMin(moment().day(day)),
        attr: { role: 'columnheader', 'aria-label': locale.weekdays(moment().day(day)) }
      });
    }
    grid.addEventListener('keydown', (evt) => this.onGridKey(evt));
    grid.addEventListener('click', (evt) => {
      const cell = this.cellFromEvent(evt);
      if (cell) this.setFocused(cell.date, true);
    });
    grid.addEventListener('dblclick', (evt) => {
      if (this.cellFromEvent(evt)) this.pick();
    });
    return grid;
  }

  /** Preset dropdown plus its hints; returns the time hint, which depends on the chosen preset. */
  private buildPresetPicker(footer: HTMLElement): HTMLElement {
    const row = footer.createDiv({ cls: 'daystamp-calendar__preset' });
    const label = row.createEl('label', { text: STRINGS.calendar.preset });
    const select = row.createEl('select', { cls: 'dropdown' });
    label.htmlFor = ensureId(select, 'preset');
    for (const preset of this.options.presets) {
      select.createEl('option', { text: `${preset.name} (${preset.format})`, value: preset.id });
    }
    select.value = this.presetId;
    const hints = footer.createDiv({ cls: 'daystamp-calendar__hints' });
    const offsetHint = hints.createDiv({ text: STRINGS.calendar.presetHint });
    const timeHint = hints.createDiv({ text: STRINGS.calendar.timeHint });
    describeBy(select, offsetHint, timeHint);
    select.addEventListener('change', () => {
      this.presetId = select.value;
      this.options.onPresetChange(this.presetId);
      this.updatePreview();
    });
    return timeHint;
  }

  private buildActions(footer: HTMLElement): void {
    const actions = footer.createDiv({ cls: 'daystamp-calendar__actions' });
    const insert = actions.createEl('button', {
      cls: 'mod-cta',
      text: STRINGS.calendar.insert,
      attr: { type: 'button' }
    });
    insert.addEventListener('click', () => this.pick());
  }

  /** Rebuilds the 42 cells; only called when the shown month changes. */
  private renderMonth(): void {
    this.shownMonth = this.focused.clone().startOf('month');
    this.titleButton.setText(this.shownMonth.format('MMMM YYYY'));
    this.monthSelect.value = String(this.shownMonth.month());
    this.yearInput.value = String(this.shownMonth.year());
    this.bodyEl.empty();
    const cells = buildMonthGrid(this.shownMonth, this.options.weekStart, moment());
    this.cells = [];
    let row: HTMLElement | null = null;
    cells.forEach((cell, i) => {
      if (i % 7 === 0) row = this.bodyEl.createDiv({ cls: 'daystamp-calendar__row', attr: { role: 'row' } });
      if (!row) return;
      const el = row.createDiv({
        cls: 'daystamp-calendar__cell',
        text: String(cell.date.date()),
        attr: {
          role: 'gridcell',
          tabindex: '-1',
          'aria-selected': 'false',
          'aria-label': cell.date.format('dddd, LL'),
          'data-index': String(i)
        }
      });
      el.toggleClass('daystamp-calendar__cell--outside', !cell.inMonth);
      if (cell.isToday) {
        el.addClass('daystamp-calendar__cell--today');
        el.setAttr('aria-current', 'date');
      }
      this.cells.push({ el, date: cell.date });
    });
    this.markFocused(null);
  }

  private setFocused(day: Moment, moveDomFocus: boolean): void {
    const previous = this.focusedCell();
    this.focused = day.clone().startOf('day');
    if (!this.shownMonth || !this.focused.isSame(this.shownMonth, 'month')) this.renderMonth();
    else this.markFocused(previous);
    this.updatePreview();
    if (moveDomFocus) this.focusedCell()?.el.focus();
  }

  /** Roving tabindex: only the focused day is tabbable; selection follows focus. */
  private markFocused(previous: CellRef | undefined | null): void {
    // previous is null right after a month rebuild: every cell starts unselected.
    if (previous) {
      previous.el.setAttr('tabindex', '-1');
      previous.el.setAttr('aria-selected', 'false');
      previous.el.removeClass('daystamp-calendar__cell--selected');
    }
    const current = this.focusedCell();
    if (!current) return;
    current.el.setAttr('tabindex', '0');
    current.el.setAttr('aria-selected', 'true');
    current.el.addClass('daystamp-calendar__cell--selected');
  }

  private onGridKey(evt: KeyboardEvent): void {
    if (evt.ctrlKey || evt.metaKey || evt.altKey) return;
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      this.pick();
      return;
    }
    const rtl = this.contentEl.win.getComputedStyle(this.contentEl).direction === 'rtl';
    const next = moveFocus(
      this.focused,
      { key: evt.key, shiftKey: evt.shiftKey },
      { weekStart: this.options.weekStart, rtl, today: moment() }
    );
    if (!next) return;
    evt.preventDefault();
    this.setFocused(next, true);
  }

  private shift(amount: number, unit: 'month' | 'year'): void {
    this.setFocused(this.focused.clone().add(amount, unit), false);
  }

  private togglePickers(): void {
    const show = this.pickersEl.hasClass('daystamp-hidden');
    this.pickersEl.toggleClass('daystamp-hidden', !show);
    this.titleButton.setAttr('aria-expanded', String(show));
    if (show) this.monthSelect.focus();
  }

  private updatePreview(): void {
    const preset = this.options.presets.find((p) => p.id === this.presetId);
    this.timeHintEl.toggleClass('daystamp-hidden', !preset || !hasTimeTokens(preset.format));
    const result = this.options.preview(this.presetId, this.focused);
    this.previewEl.setText(
      result.ok
        ? STRINGS.calendar.preview(result.text)
        : STRINGS.calendar.previewInvalid(this.options.describeFailure(result))
    );
  }

  private pick(): void {
    this.picked = true;
    this.close();
  }

  private focusedCell(): CellRef | undefined {
    return this.cells.find((c) => c.date.isSame(this.focused, 'day'));
  }

  private cellFromEvent(evt: MouseEvent): CellRef | undefined {
    const target = evt.targetNode;
    if (!target?.instanceOf(HTMLElement)) return undefined;
    const el = target.closest<HTMLElement>('.daystamp-calendar__cell');
    const index = Number(el?.dataset.index);
    return Number.isInteger(index) ? this.cells[index] : undefined;
  }
}
