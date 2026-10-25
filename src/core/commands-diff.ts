export interface CommandSpec {
  readonly id: string;
  /** The displayed name; a change here (preset name or format) re-registers the command. */
  readonly name: string;
}

export interface CommandsDiff<S extends CommandSpec = CommandSpec> {
  readonly add: S[];
  readonly remove: string[];
  /** Same id, new displayed name: remove then re-add; hotkeys are keyed by id, so they survive. */
  readonly rename: S[];
}

/** What changes between two command lists, by id. Order of `next` is preserved in `add` and `rename`. */
export function diffCommands<S extends CommandSpec>(
  prev: ReadonlyArray<CommandSpec>,
  next: ReadonlyArray<S>
): CommandsDiff<S> {
  const before = new Map(prev.map((c) => [c.id, c.name]));
  const after = new Set(next.map((c) => c.id));
  const add: S[] = [];
  const rename: S[] = [];
  for (const spec of next) {
    const oldName = before.get(spec.id);
    if (oldName === undefined) add.push(spec);
    else if (oldName !== spec.name) rename.push(spec);
  }
  const remove = prev.filter((c) => !after.has(c.id)).map((c) => c.id);
  return { add, remove, rename };
}

/** True when nothing needs to change. */
export function isEmptyDiff(diff: CommandsDiff): boolean {
  return diff.add.length === 0 && diff.remove.length === 0 && diff.rename.length === 0;
}
