import { Notice, PluginSettingTab } from 'obsidian';
import type { App, Plugin, Setting, SettingDefinitionItem } from 'obsidian';
import type { Moment } from 'moment';

import { FALLBACK_LINK_FORMAT, hasRiskyLinkChars, sanitizeLinkTarget } from '../core/format';
import {
  addPreset,
  findPreset,
  movePreset,
  removePreset,
  resetPresets,
  restorePreset,
  setTransform,
  updatePreset
} from '../core/presets';
import { isValidTrigger, MAX_FORMAT_LENGTH } from '../core/settings-schema';
import type { InsertResult, Preset, Settings } from '../core/types';
import type { InsertService } from '../services/insert-service';
import type { SettingsStore } from '../services/settings-store';
import { STRINGS } from '../strings';
import { iconButton, showUndoNotice, warningLine } from './dom';
import { PresetModal } from './preset-modal';

export interface SettingsTabDeps {
  readonly store: SettingsStore;
  readonly insert: InsertService;
  readonly now: () => Moment;
  readonly getDailyNoteFormat: () => string | null;
  readonly isNaturalLanguageDatesEnabled: () => boolean;
  readonly describeFailure: (result: Extract<InsertResult, { ok: false }>) => string;
}

const MOMENT_FORMAT_DOCS = 'https://momentjs.com/docs/#/displaying/format/';
const WIKI_LINK = 'wiki-link';
const T = STRINGS.settings;

/**
 * Declarative settings tab (getSettingDefinitions, so Obsidian's settings search finds it; D2).
 * Redraws with update() only on structural preset changes; scalar inputs never redraw, so they keep focus.
 */
export class DaystampSettingTab extends PluginSettingTab {
  private linkWarningSetting: Setting | null = null;

  constructor(
    app: App,
    plugin: Plugin,
    private readonly deps: SettingsTabDeps
  ) {
    super(app, plugin);
    plugin.register(
      deps.store.onChange((prev, next) => {
        if (prev.presets !== next.presets || prev.defaultPresetId !== next.defaultPresetId) this.update();
        else if (prev !== next) this.refreshDomState();
      })
    );
  }

  override getSettingDefinitions(): SettingDefinitionItem[] {
    const settings = this.deps.store.get();
    return [
      this.presetList(settings),
      {
        type: 'group',
        items: [
          {
            name: T.defaultPreset,
            desc: T.defaultPresetDesc,
            control: {
              type: 'dropdown',
              key: 'defaultPresetId',
              options: Object.fromEntries(settings.presets.map((p) => [p.id, `${p.name} (${p.format})`]))
            }
          },
          { name: T.resetPresets, desc: T.resetPresetsDesc, action: () => this.resetPresets() },
          { name: T.formatDocs, desc: this.formatDocsDesc() }
        ]
      },
      {
        type: 'group',
        heading: T.headings.insert,
        items: [
          { name: T.spaceAfter, desc: T.spaceAfterDesc, control: { type: 'toggle', key: 'spaceAfter' } }
        ]
      },
      this.triggerGroup(),
      {
        type: 'group',
        heading: T.headings.calendar,
        items: [
          {
            name: T.showCalendarRibbon,
            desc: T.showCalendarRibbonDesc,
            control: { type: 'toggle', key: 'showCalendarRibbon' }
          },
          {
            name: T.weekStart,
            control: { type: 'dropdown', key: 'weekStartsOn', options: { ...T.weekStartOptions } }
          }
        ]
      },
      this.linksGroup()
    ];
  }

  override getControlValue(key: string): unknown {
    const s = this.deps.store.get();
    switch (key) {
      case 'weekStartsOn':
        return String(s.weekStartsOn);
      case 'defaultPresetId':
      case 'spaceAfter':
      case 'triggerEnabled':
      case 'trigger':
      case 'showCalendarRibbon':
      case 'linkTargetFormat':
        return s[key];
      default:
        return undefined;
    }
  }

  /** Every write is validated again here; the store saves on its debounce. */
  override setControlValue(key: string, value: unknown): void {
    this.deps.store.update((s) => applyControl(s, key, value));
    if (key === 'linkTargetFormat') this.renderLinkWarning();
  }

  override hide(): void {
    super.hide();
    void this.deps.store.flush();
  }

  private presetList(settings: Settings): SettingDefinitionItem {
    const last = settings.presets.length - 1;
    return {
      type: 'list',
      heading: T.headings.presets,
      emptyState: T.presetList.empty,
      addItem: { name: T.presetList.add, action: () => this.addPreset() },
      onReorder: (from, to) => this.deps.store.update((s) => movePreset(s, from, to)),
      onDelete: (index) => this.deletePreset(index),
      items: settings.presets.map((preset, index) => ({
        name: preset.name,
        desc: this.previewText(preset),
        aliases: [preset.format],
        render: (setting: Setting) => this.renderPresetRow(setting, preset, index, last, settings)
      }))
    };
  }

  private renderPresetRow(
    setting: Setting,
    preset: Preset,
    index: number,
    last: number,
    settings: Settings
  ): void {
    setting.setName(preset.name).setDesc(this.previewText(preset));
    if (preset.id === settings.defaultPresetId) {
      setting.nameEl.createSpan({ cls: 'daystamp-badge', text: T.presetList.defaultBadge });
    }
    const move = (to: number) => () => this.deps.store.update((s) => movePreset(s, index, to));
    const up = iconButton(setting.controlEl, 'arrow-up', T.preset.moveUpAria(preset.name), move(index - 1));
    up.disabled = index === 0;
    const down = iconButton(
      setting.controlEl,
      'arrow-down',
      T.preset.moveDownAria(preset.name),
      move(index + 1)
    );
    down.disabled = index === last;
    iconButton(setting.controlEl, 'pencil', T.presetList.editAria(preset.name), () =>
      this.editPreset(preset.id)
    );
  }

  private triggerGroup(): SettingDefinitionItem {
    const store = this.deps.store;
    return {
      type: 'group',
      heading: T.headings.trigger,
      items: [
        {
          name: T.triggerEnabled,
          desc: T.triggerEnabledDesc,
          control: { type: 'toggle', key: 'triggerEnabled' }
        },
        {
          name: T.trigger,
          desc: T.triggerDesc,
          control: {
            type: 'text',
            key: 'trigger',
            placeholder: '@@',
            validate: (value) => (isValidTrigger(value) ? undefined : T.triggerInvalid),
            disabled: () => !store.get().triggerEnabled
          }
        },
        {
          name: T.triggerConflictName,
          searchable: false,
          visible: () => {
            const s = store.get();
            return s.triggerEnabled && s.trigger.startsWith('@') && this.deps.isNaturalLanguageDatesEnabled();
          },
          render: (setting: Setting) => {
            setting.setName('');
            warningLine(setting.descEl, T.triggerConflict);
          }
        }
      ]
    };
  }

  private linksGroup(): SettingDefinitionItem {
    const auto = this.deps.getDailyNoteFormat() ?? FALLBACK_LINK_FORMAT;
    return {
      type: 'group',
      heading: T.headings.links,
      items: [
        {
          name: T.linkTarget,
          desc: T.linkTargetDesc,
          control: { type: 'text', key: 'linkTargetFormat', placeholder: T.linkTargetPlaceholder(auto) }
        },
        {
          name: T.linkTargetWarningName,
          searchable: false,
          // Only relevant once some preset actually inserts links.
          visible: () =>
            this.deps.store.get().presets.some((p) => p.transforms.includes(WIKI_LINK)) &&
            hasRiskyLinkChars(this.linkTarget()),
          render: (setting: Setting) => {
            this.linkWarningSetting = setting;
            this.renderLinkWarning();
          }
        }
      ]
    };
  }

  private renderLinkWarning(): void {
    const setting = this.linkWarningSetting;
    if (!setting) return;
    setting.setName('');
    setting.descEl.empty();
    warningLine(setting.descEl, T.preset.linkWarning(this.linkTarget()));
  }

  private formatDocsDesc(): DocumentFragment {
    return createFragment((f) => {
      f.appendText(`${T.formatDocsDesc} `);
      f.createEl('a', { text: T.formatDocsLink, href: MOMENT_FORMAT_DOCS });
    });
  }

  private previewText(preset: Preset): string {
    const result = this.deps.insert.preview({ presetId: preset.id });
    return T.preset.preview(result.ok ? result.text : this.deps.describeFailure(result));
  }

  private linkTarget(): string {
    const format =
      this.deps.store.get().linkTargetFormat || this.deps.getDailyNoteFormat() || FALLBACK_LINK_FORMAT;
    return sanitizeLinkTarget(this.deps.now().format(format));
  }

  private addPreset(): void {
    const store = this.deps.store;
    const before = new Set(store.get().presets.map((p) => p.id));
    store.update((s) =>
      addPreset(s, { name: T.presetList.newPresetName, format: 'YYYY-MM-DD', offsetDays: 0, transforms: [] })
    );
    const added = store.get().presets.find((p) => !before.has(p.id));
    if (added) this.editPreset(added.id);
  }

  private deletePreset(index: number): void {
    const store = this.deps.store;
    const before = store.get();
    const preset = before.presets[index];
    if (!preset) return;
    if (before.presets.length <= 1) {
      new Notice(T.presetList.cannotDeleteLast);
      return;
    }
    store.update((s) => removePreset(s, preset.id));
    showUndoNotice(STRINGS.notices.presetDeleted(preset.name), STRINGS.notices.undo, () =>
      store.update((s) => {
        const restored = restorePreset(s, preset, index);
        return before.defaultPresetId === preset.id ? { ...restored, defaultPresetId: preset.id } : restored;
      })
    );
  }

  private resetPresets(): void {
    const store = this.deps.store;
    const { presets, defaultPresetId } = store.get();
    store.update(resetPresets);
    showUndoNotice(STRINGS.notices.presetsReset, STRINGS.notices.undo, () =>
      store.update((s) => ({ ...s, presets, defaultPresetId }))
    );
  }

  private editPreset(id: string): void {
    const store = this.deps.store;
    new PresetModal(this.app, {
      getPreset: () => findPreset(store.get(), id),
      isDefault: () => store.get().defaultPresetId === id,
      update: (patch) => store.update((s) => updatePreset(s, id, patch)),
      setTransform: (transformId, enabled) => store.update((s) => setTransform(s, id, transformId, enabled)),
      makeDefault: () => store.update((s) => ({ ...s, defaultPresetId: id })),
      preview: () => this.deps.insert.preview({ presetId: id }),
      linkTarget: () => this.linkTarget(),
      describeFailure: this.deps.describeFailure
    }).open();
  }
}

/** Applies one control change with the same validation as sanitizeSettings; invalid values are ignored. */
function applyControl(s: Settings, key: string, value: unknown): Settings {
  switch (key) {
    case 'spaceAfter':
    case 'triggerEnabled':
    case 'showCalendarRibbon':
      return typeof value === 'boolean' ? { ...s, [key]: value } : s;
    case 'trigger':
      return isValidTrigger(value) ? { ...s, trigger: value } : s;
    case 'linkTargetFormat':
      return typeof value === 'string'
        ? { ...s, linkTargetFormat: value.trim().slice(0, MAX_FORMAT_LENGTH) }
        : s;
    case 'weekStartsOn':
      if (value === 'locale') return { ...s, weekStartsOn: 'locale' };
      return value === '0' || value === '1' ? { ...s, weekStartsOn: Number(value) as 0 | 1 } : s;
    case 'defaultPresetId':
      return typeof value === 'string' && findPreset(s, value) ? { ...s, defaultPresetId: value } : s;
    default:
      return s;
  }
}
