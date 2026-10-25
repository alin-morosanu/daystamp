import { Modal, Setting } from 'obsidian';
import type { App } from 'obsidian';

import { hasRiskyLinkChars } from '../core/format';
import type { PresetPatch } from '../core/presets';
import type { InsertResult, Preset } from '../core/types';
import { STRINGS } from '../strings';
import { describeBy, warningLine } from './dom';

export interface PresetModalDeps {
  /** Current version of the preset, or undefined once it has been deleted elsewhere (e.g. Sync). */
  readonly getPreset: () => Preset | undefined;
  readonly isDefault: () => boolean;
  readonly update: (patch: PresetPatch) => void;
  readonly setTransform: (transformId: string, enabled: boolean) => void;
  readonly makeDefault: () => void;
  readonly preview: () => InsertResult;
  /** The rendered link target for today, to warn about characters Obsidian treats specially. */
  readonly linkTarget: () => string;
  readonly describeFailure: (result: Extract<InsertResult, { ok: false }>) => string;
}

const WIKI_LINK = 'wiki-link';

/**
 * Edits one preset. Every input saves through the store as you type (debounced), and only
 * the preview and warnings redraw, so the focused input never loses focus.
 */
export class PresetModal extends Modal {
  private previewEl: HTMLElement | null = null;
  private formatErrorEl: HTMLElement | null = null;
  private linkWarningEl: HTMLElement | null = null;

  constructor(
    app: App,
    private readonly deps: PresetModalDeps
  ) {
    super(app);
  }

  override onOpen(): void {
    const preset = this.deps.getPreset();
    if (!preset) {
      this.close();
      return;
    }
    this.setTitle(preset.name);
    this.modalEl.addClass('daystamp-preset-modal');
    this.buildName(preset);
    this.buildFormat(preset);
    this.buildOffset(preset);
    this.buildLink(preset);
    this.buildDefault();
    this.refresh();
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private buildName(preset: Preset): void {
    new Setting(this.contentEl).setName(STRINGS.settings.preset.name).addText((text) => {
      text.setValue(preset.name);
      text.inputEl.setAttr('aria-label', STRINGS.settings.preset.nameAria(preset.name));
      text.onChange((value) => {
        this.deps.update({ name: value });
        this.setTitle(value);
      });
    });
  }

  private buildFormat(preset: Preset): void {
    const setting = new Setting(this.contentEl)
      .setName(STRINGS.settings.preset.format)
      .setDesc(STRINGS.settings.preset.formatDesc);
    const previewEl = setting.descEl.createDiv({ cls: 'daystamp-preview' });
    const errorEl = setting.descEl.createDiv({ cls: 'daystamp-hidden' });
    warningLine(errorEl, STRINGS.settings.preset.formatEmpty);
    this.previewEl = previewEl;
    this.formatErrorEl = errorEl;
    setting.addText((text) => {
      text.setValue(preset.format);
      text.inputEl.addClass('daystamp-format-input');
      text.inputEl.setAttr('aria-label', STRINGS.settings.preset.formatAria(preset.name));
      describeBy(text.inputEl, previewEl, errorEl);
      text.onChange((value) => {
        this.deps.update({ format: value });
        this.refresh();
      });
      const chips = this.contentEl.createDiv({
        cls: 'daystamp-chips',
        attr: { role: 'group', 'aria-label': STRINGS.settings.preset.chips }
      });
      for (const chip of STRINGS.settings.chips) {
        const button = chips.createEl('button', {
          cls: 'daystamp-chip',
          text: chip.label,
          attr: { type: 'button', 'aria-label': STRINGS.settings.preset.chip(chip.label, chip.format) }
        });
        button.addEventListener('click', () => {
          text.setValue(chip.format);
          this.deps.update({ format: chip.format });
          this.refresh();
          text.inputEl.focus();
        });
      }
    });
  }

  private buildOffset(preset: Preset): void {
    const setting = new Setting(this.contentEl)
      .setName(STRINGS.settings.preset.offset)
      .setDesc(STRINGS.settings.preset.offsetDesc);
    const errorEl = setting.descEl.createDiv({ cls: 'daystamp-hidden' });
    warningLine(errorEl, STRINGS.settings.preset.offsetInvalid);
    setting.addText((text) => {
      text.inputEl.type = 'number';
      text.inputEl.step = '1';
      text.setValue(String(preset.offsetDays));
      text.inputEl.setAttr('aria-label', STRINGS.settings.preset.offsetAria(preset.name));
      describeBy(text.inputEl, errorEl);
      text.onChange((value) => {
        const days = Number(value);
        const valid = value.trim() !== '' && Number.isInteger(days);
        errorEl.toggleClass('daystamp-hidden', valid);
        text.inputEl.setAttr('aria-invalid', String(!valid));
        if (valid) {
          this.deps.update({ offsetDays: days });
          this.refresh();
        }
      });
    });
  }

  private buildLink(preset: Preset): void {
    const setting = new Setting(this.contentEl)
      .setName(STRINGS.settings.preset.link)
      .setDesc(STRINGS.settings.preset.linkDesc);
    this.linkWarningEl = setting.descEl.createDiv({ cls: 'daystamp-hidden' });
    setting.addToggle((toggle) => {
      toggle.setValue(preset.transforms.includes(WIKI_LINK));
      toggle.toggleEl.setAttr('aria-label', STRINGS.settings.preset.link);
      if (this.linkWarningEl) describeBy(toggle.toggleEl, this.linkWarningEl);
      toggle.onChange((enabled) => {
        this.deps.setTransform(WIKI_LINK, enabled);
        this.refresh();
      });
    });
  }

  private buildDefault(): void {
    const setting = new Setting(this.contentEl)
      .setName(STRINGS.settings.preset.makeDefault)
      .setDesc(STRINGS.settings.preset.makeDefaultDesc);
    if (this.deps.isDefault()) {
      setting.controlEl.createSpan({ cls: 'daystamp-badge', text: STRINGS.settings.preset.isDefault });
      return;
    }
    setting.addButton((button) =>
      button.setButtonText(STRINGS.settings.preset.makeDefault).onClick(() => {
        this.deps.makeDefault();
        setting.controlEl.empty();
        setting.controlEl.createSpan({ cls: 'daystamp-badge', text: STRINGS.settings.preset.isDefault });
      })
    );
  }

  /** Updates only the preview and warning elements. */
  private refresh(): void {
    const preset = this.deps.getPreset();
    if (!preset) return;
    const result = this.deps.preview();
    this.previewEl?.setText(
      STRINGS.settings.preset.preview(result.ok ? result.text : this.deps.describeFailure(result))
    );
    this.formatErrorEl?.toggleClass('daystamp-hidden', preset.format.trim() !== '');
    const linked = preset.transforms.includes(WIKI_LINK);
    const target = this.deps.linkTarget();
    const risky = linked && hasRiskyLinkChars(target);
    if (this.linkWarningEl) {
      this.linkWarningEl.empty();
      this.linkWarningEl.toggleClass('daystamp-hidden', !risky);
      if (risky) warningLine(this.linkWarningEl, STRINGS.settings.preset.linkWarning(target));
    }
  }
}
