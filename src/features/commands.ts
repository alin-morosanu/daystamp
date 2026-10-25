import type { Command } from 'obsidian';

import type { CommandSpec } from '../core/commands-diff';
import type { Settings } from '../core/types';
import { CommandRegistry } from '../services/command-registry';
import { isEditableContext } from '../services/insert-service';
import { STRINGS } from '../strings';
import type { Feature, FeatureContext } from './feature';

interface PresetCommandSpec extends CommandSpec {
  readonly presetId: string;
}

/** Command ids use the preset's stable id, so hotkeys survive renames. */
function presetSpecs(settings: Settings): PresetCommandSpec[] {
  return settings.presets.map((p) => ({
    id: `insert-preset-${p.id}`,
    name: STRINGS.commands.insertPreset(p.name, p.format),
    presetId: p.id
  }));
}

function insertCommand(ctx: FeatureContext, id: string, name: string, presetId: () => string): Command {
  return {
    id,
    name,
    icon: 'calendar-clock',
    editorCheckCallback: (checking, editor, info) => {
      if (!isEditableContext(info)) return false;
      if (!checking) ctx.insert.insert({ presetId: presetId(), editor });
      return true;
    }
  };
}

export const commandsFeature: Feature = {
  id: 'commands',
  register(ctx) {
    const plugin = ctx.plugin;
    plugin.addCommand(
      insertCommand(
        ctx,
        'insert-default',
        STRINGS.commands.insertDefault,
        () => ctx.store.getDerived().defaultPreset.id
      )
    );
    const registry = new CommandRegistry<PresetCommandSpec>(
      { addCommand: (c) => plugin.addCommand(c), removeCommand: (id) => plugin.removeCommand(id) },
      (spec) => insertCommand(ctx, spec.id, spec.name, () => spec.presetId)
    );
    registry.sync(presetSpecs(ctx.store.get()));
    plugin.register(
      ctx.store.onChange((prev, next) => {
        if (prev.presets !== next.presets) registry.sync(presetSpecs(next));
      })
    );
  }
};
