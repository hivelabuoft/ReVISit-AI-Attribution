import { useEffect, useRef } from 'react';
import { StimulusParams } from '../../../store/types';

interface CoursePolicyReminderParams {
  courseNumber: number;
  prefillFromCourseNumber?: number;
}

const containerStyle: React.CSSProperties = {
  maxWidth: 820,
  margin: '0 auto 1.5rem',
  padding: '1rem 1.25rem',
  background: '#eef6ff',
  border: '1px solid #c7def7',
  borderRadius: 12,
  color: '#23415f',
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#4673a3',
  marginBottom: '0.35rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.08rem',
  fontWeight: 600,
  marginBottom: '0.35rem',
};

const detailStyle: React.CSSProperties = {
  fontSize: '0.96rem',
  lineHeight: 1.55,
  margin: 0,
};

function getOrdinalLabel(courseNumber: number) {
  switch (courseNumber) {
    case 1:
      return 'Course 1';
    case 2:
      return 'Course 2';
    case 3:
      return 'Course 3';
    case 4:
      return 'Course 4';
    default:
      return `Course ${courseNumber}`;
  }
}

export default function CoursePolicyReminder({
  parameters,
  answers,
  setAnswer,
}: StimulusParams<CoursePolicyReminderParams>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const infoEntry = Object.entries(answers || {}).find(
    ([key]) => key.startsWith('inst-course-info_'),
  );
  const courseNameKey = `inst-course-${parameters.courseNumber}-name`;
  const courseName = infoEntry?.[1]?.answer?.[courseNameKey] as string | undefined;
  const label = getOrdinalLabel(parameters.courseNumber);
  const courseReference = courseName || label;
  const previousCourseNumber = parameters.prefillFromCourseNumber;

  useEffect(() => {
    const root = containerRef.current;
    const responseBlock = root?.parentElement?.nextElementSibling;

    if (!responseBlock) {
      return () => {};
    }

    const promptTexts = [
      `Does ${courseReference} explicitly allow the use of AI/LLMs?`,
      `Which of the following best describes the AI policy for ${courseReference}? (Select all that apply)`,
      `How are students asked to acknowledge or cite AI use in ${courseReference}? (Select all that apply)`,
      `In your perspective, how often do students choose to disclose AI use in ${courseReference} when it is required?`,
    ];

    const updatePromptLabels = () => {
      const promptLabels = Array.from(
        responseBlock.querySelectorAll<HTMLElement>('.no-last-child-bottom-padding'),
      );

      promptLabels.slice(0, promptTexts.length).forEach((promptLabel, index) => {
        const walker = document.createTreeWalker(promptLabel, NodeFilter.SHOW_TEXT);
        let textNode = walker.nextNode() as Text | null;

        while (textNode && textNode.textContent?.trim().length === 0) {
          textNode = walker.nextNode() as Text | null;
        }

        if (textNode) {
          textNode.textContent = promptTexts[index];
        }
      });
    };

    updatePromptLabels();

    const observer = new MutationObserver(() => {
      updatePromptLabels();
    });

    observer.observe(responseBlock, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [courseReference]);

  useEffect(() => {
    if (!previousCourseNumber) {
      return;
    }

    const currentPolicyEntry = Object.entries(answers || {}).find(
      ([key]) => key.startsWith(`inst-course-${parameters.courseNumber}-policy_`),
    );

    if (currentPolicyEntry && Object.keys(currentPolicyEntry[1]?.answer || {}).length > 0) {
      return;
    }

    const previousPolicyEntry = Object.entries(answers || {}).find(
      ([key]) => key.startsWith(`inst-course-${previousCourseNumber}-policy_`),
    );

    const previousAnswers = previousPolicyEntry?.[1]?.answer || {};
    const mappedAnswers = Object.fromEntries(
      Object.entries(previousAnswers).map(([key, value]) => [
        key.replace(`-c${previousCourseNumber}`, `-c${parameters.courseNumber}`),
        value,
      ]),
    );

    if (Object.keys(mappedAnswers).length === 0) {
      return;
    }

    setAnswer({
      status: true,
      answers: mappedAnswers,
    });
  }, [answers, parameters.courseNumber, previousCourseNumber, setAnswer]);

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={eyebrowStyle}>Course Reminder</div>
      <div style={titleStyle}>
        {label}
        {courseName ? ':' : ''}
        {' '}
        {courseName || 'Use the course you entered on the previous page.'}
      </div>
      <p style={detailStyle}>
        {previousCourseNumber
          ? `We pre-filled these answers from Course ${previousCourseNumber}. Please review them and change anything that does not apply to this course.`
          : 'Please answer the following AI policy questions for this course.'}
      </p>
    </div>
  );
}
