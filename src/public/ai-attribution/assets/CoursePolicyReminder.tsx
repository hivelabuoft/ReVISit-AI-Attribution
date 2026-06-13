import { useEffect } from 'react';
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

function getCourseTitle(courseName: string | undefined, fallbackLabel: string) {
  const trimmedName = courseName?.trim();
  return trimmedName || fallbackLabel;
}

export default function CoursePolicyReminder({
  parameters,
  answers,
  setAnswer,
}: StimulusParams<CoursePolicyReminderParams>) {
  const infoEntry = Object.entries(answers || {}).find(
    ([key]) => key.startsWith('inst-course-info_'),
  );
  const courseNameKey = `inst-course-${parameters.courseNumber}-name`;
  const courseName = infoEntry?.[1]?.answer?.[courseNameKey] as string | undefined;
  const label = getOrdinalLabel(parameters.courseNumber);
  const title = getCourseTitle(courseName, label);
  const previousCourseNumber = parameters.prefillFromCourseNumber;
  const previousCourseName = previousCourseNumber
    ? infoEntry?.[1]?.answer?.[`inst-course-${previousCourseNumber}-name`] as string | undefined
    : undefined;
  const previousCourseTitle = previousCourseNumber
    ? getCourseTitle(previousCourseName, getOrdinalLabel(previousCourseNumber))
    : undefined;

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
    <div style={containerStyle}>
      <div style={eyebrowStyle}>Course Reminder</div>
      <div style={titleStyle}>{title || 'Use the course you entered on the previous page.'}</div>
      <p style={detailStyle}>
        {previousCourseNumber
          ? `We pre-filled these answers from ${previousCourseTitle}. Please review them and change anything that does not apply to this course.`
          : 'Please answer the following AI policy questions for this course.'}
      </p>
    </div>
  );
}
