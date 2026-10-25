import type { Command } from 'obsidian';
import { describe, expect, it } from 'vitest';

import { CommandRegistry } from '../../src/services/command-registry';

describe('CommandRegistry', () => {
  const host = () => {
    const log: string[] = [];
    return {
      log,
      addCommand: (c: Command) => {
        log.push(`add ${c.id} ${c.name}`);
        return c;
      },
      removeCommand: (id: string) => {
        log.push(`remove ${id}`);
      }
    };
  };

  it('adds, renames and removes only what changed', () => {
    const h = host();
    const registry = new CommandRegistry(h, (spec) => ({ id: spec.id, name: spec.name }));
    registry.sync([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' }
    ]);
    registry.sync([
      { id: 'a', name: 'A2' },
      { id: 'c', name: 'C' }
    ]);
    registry.sync([
      { id: 'a', name: 'A2' },
      { id: 'c', name: 'C' }
    ]);
    expect(h.log).toEqual(['add a A', 'add b B', 'remove b', 'remove a', 'add a A2', 'add c C']);
  });
});
