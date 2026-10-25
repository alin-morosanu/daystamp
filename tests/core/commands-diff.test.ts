import { describe, expect, it } from 'vitest';

import { diffCommands, isEmptyDiff } from '../../src/core/commands-diff';

describe('diffCommands', () => {
  const prev = [
    { id: 'a', name: 'Insert A (L)' },
    { id: 'b', name: 'Insert B (L)' }
  ];

  it('finds added, removed and renamed commands', () => {
    const next = [
      { id: 'a', name: 'Insert A (LL)' },
      { id: 'c', name: 'Insert C (L)' }
    ];
    expect(diffCommands(prev, next)).toEqual({
      add: [{ id: 'c', name: 'Insert C (L)' }],
      remove: ['b'],
      rename: [{ id: 'a', name: 'Insert A (LL)' }]
    });
  });

  it('is empty when nothing changed', () => {
    expect(isEmptyDiff(diffCommands(prev, [...prev]))).toBe(true);
  });

  it('adds everything from an empty start', () => {
    expect(diffCommands([], prev).add).toEqual(prev);
  });
});
