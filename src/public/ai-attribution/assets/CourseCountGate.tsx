import { useEffect, useRef } from 'react';
import { StimulusParams } from '../../../store/types';

/**
 * Invisible gate that copies the course count into this block's answer
 * so skip conditions can check it locally. Auto-advances by clicking
 * the Next button, so the participant never sees this page.
 */
export default function CourseCountGate({ setAnswer, answers }: StimulusParams<Record<string, never>>) {
  const hasAdvanced = useRef(false);

  // answers keys are "componentName_index", so find by prefix
  const infoEntry = Object.entries(answers || {}).find(
    ([key]) => key.startsWith('inst-course-info_'),
  );
  const courseCount = (infoEntry?.[1]?.answer?.['inst-course-count'] as string) || '1';

  useEffect(() => {
    setAnswer({
      status: true,
      answers: { 'course-count': courseCount },
    });
  }, [courseCount, setAnswer]);

  // Auto-advance: wait for the Next button to become enabled, then click it
  useEffect(() => {
    if (hasAdvanced.current) {
      return () => {};
    }

    const tryClick = () => {
      if (hasAdvanced.current) return;
      const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (btn && !btn.disabled) {
        hasAdvanced.current = true;
        btn.click();
      }
    };

    // Try immediately, then poll briefly in case the store hasn't updated yet
    const id = setInterval(tryClick, 50);
    const timeout = setTimeout(() => clearInterval(id), 3000);

    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, []);

  // Render nothing visible
  return null;
}
