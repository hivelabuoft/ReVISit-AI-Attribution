import { describe, expect, test } from 'vitest';
import { Sequence } from '../types';
import { resolveSkipTargetIndex } from './resolveSkipTarget';

const sequence: Sequence = {
  orderPath: 'root',
  order: 'fixed',
  skip: [],
  components: [
    'consent',
    {
      id: 'followup-block',
      orderPath: 'root-1',
      order: 'fixed',
      skip: [],
      components: ['followup'],
    },
    'end',
  ],
};

describe('resolveSkipTargetIndex', () => {
  test('resolves the special end target to the terminal sequence step', () => {
    const participantSequence = ['consent', 'followup', 'end'];

    expect(resolveSkipTargetIndex('end', participantSequence, sequence)).toBe(2);
  });

  test('resolves component targets from the participant sequence', () => {
    const participantSequence = ['consent', 'followup', 'end'];

    expect(resolveSkipTargetIndex('followup', participantSequence, sequence)).toBe(1);
  });

  test('resolves block targets when the target is a sequence id', () => {
    const participantSequence = ['consent', 'followup', 'end'];

    expect(resolveSkipTargetIndex('followup-block', participantSequence, sequence)).toBe(1);
  });
});
