import { findIndexOfBlock } from '../../utils/getSequenceFlatMap';
import { Sequence } from '../types';

export function resolveSkipTargetIndex(
  skipTarget: string,
  participantSequence: string[],
  sequence: Sequence,
): number {
  if (skipTarget === 'end') {
    return participantSequence.lastIndexOf('end');
  }

  const nextStepIndex = participantSequence.indexOf(skipTarget);
  return nextStepIndex === -1 ? findIndexOfBlock(sequence, skipTarget) : nextStepIndex;
}
