import { describe, expect, test } from 'vitest';
import { ParticipantData } from '../../storage/types';
import { interpolateAnswerReferences } from './promptInterpolation';

const answers = {
  'inst-course-info_10': {
    answer: {
      'inst-course-1-name': 'CSC108',
      'inst-course-2-name': '<script>alert("oops")</script>',
    },
    identifier: 'inst-course-info_10',
    componentName: 'inst-course-info',
    trialOrder: '10',
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
} satisfies ParticipantData['answers'];

describe('interpolateAnswerReferences', () => {
  test('replaces answer references with stored response values', () => {
    const prompt = 'Does <strong>{answer:inst-course-info.inst-course-1-name|Course 1}</strong> allow AI?';

    expect(interpolateAnswerReferences(prompt, answers)).toBe(
      'Does <strong>CSC108</strong> allow AI?',
    );
  });

  test('uses fallback text when the referenced answer is missing', () => {
    const prompt = 'Does <strong>{answer:inst-course-info.inst-course-4-name|Course 4}</strong> allow AI?';

    expect(interpolateAnswerReferences(prompt, answers)).toBe(
      'Does <strong>Course 4</strong> allow AI?',
    );
  });

  test('escapes stored answer values before markdown rendering', () => {
    const prompt = 'Does <strong>{answer:inst-course-info.inst-course-2-name|Course 2}</strong> allow AI?';

    expect(interpolateAnswerReferences(prompt, answers)).toBe(
      'Does <strong>&lt;script&gt;alert(&quot;oops&quot;)&lt;/script&gt;</strong> allow AI?',
    );
  });
});
