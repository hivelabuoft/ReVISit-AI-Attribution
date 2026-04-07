import { describe, expect, test } from 'vitest';
import { ParticipantData } from '../storage/types';
import { getStudyEndMessage } from './studyEndMessage';

function createAnswers(consent: 'Yes' | 'No'): ParticipantData['answers'] {
  return {
    consent_0: {
      answer: { 'consent-agree': consent },
      identifier: 'consent_0',
      componentName: 'consent',
      trialOrder: '0',
      incorrectAnswers: {},
      startTime: 0,
      endTime: 1,
      provenanceGraph: {
        aboveStimulus: undefined,
        belowStimulus: undefined,
        stimulus: undefined,
        sidebar: undefined,
      },
      windowEvents: [],
      timedOut: false,
      helpButtonClickedCount: 0,
      parameters: {},
      correctAnswer: [],
      optionOrders: {},
      questionOrders: {},
    },
  };
}

describe('getStudyEndMessage', () => {
  test('returns the declined-consent message when the participant opts out', () => {
    const message = getStudyEndMessage(
      createAnswers('No'),
      'Completion message',
      'participant-123',
      'PROLIFIC_ID',
    );

    expect(message).toBe('You have declined to participate in this study. Thank you for your time. You may now close this window.');
  });

  test('replaces the participant id placeholder for completed participants', () => {
    const message = getStudyEndMessage(
      createAnswers('Yes'),
      'Your completion code is {PARTICIPANT_ID}.',
      'participant-123',
      'PROLIFIC_ID',
    );

    expect(message).toBe('Your completion code is participant-123.');
  });

  test('returns the configured message unchanged when there is no placeholder support', () => {
    const message = getStudyEndMessage(
      createAnswers('Yes'),
      'Thanks for participating.',
      'participant-123',
    );

    expect(message).toBe('Thanks for participating.');
  });
});
