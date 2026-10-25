import type { Command } from 'obsidian';

import { diffCommands, isEmptyDiff } from '../core/commands-diff';
import type { CommandSpec } from '../core/commands-diff';

/** The two Plugin methods the registry needs; ids are passed without the plugin prefix. */
export interface CommandHost {
  addCommand(command: Command): Command;
  removeCommand(id: string): void;
}

/** Keeps a dynamic set of commands in step with a spec list, touching only what changed. */
export class CommandRegistry<S extends CommandSpec> {
  private current: ReadonlyArray<S> = [];

  constructor(
    private readonly host: CommandHost,
    private readonly build: (spec: S) => Command
  ) {}

  sync(next: ReadonlyArray<S>): void {
    const diff = diffCommands(this.current, next);
    if (isEmptyDiff(diff)) return;
    for (const id of diff.remove) this.host.removeCommand(id);
    for (const spec of diff.rename) {
      this.host.removeCommand(spec.id);
      this.host.addCommand(this.build(spec));
    }
    for (const spec of diff.add) this.host.addCommand(this.build(spec));
    this.current = next;
  }
}
