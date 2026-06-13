import { useEffect, useRef } from 'react';
import { StimulusParams } from '../../../store/types';
import { getVignetteCountForRole } from './vignetteAssignment';

export default function VignetteCountGate({ setAnswer, answers }: StimulusParams<Record<string, never>>) {
  const hasAdvanced = useRef(false);
  const infoEntry = Object.entries(answers || {}).find(
    ([key]) => key.startsWith('information_'),
  );
  const gradingEntry = Object.entries(answers || {}).find(
    ([key]) => key.startsWith('inst-grading-eval_'),
  );
  const role = (infoEntry?.[1]?.answer?.role as string | undefined)
    || (answers?.information?.answer?.role as string | undefined);
  const requestedVignetteCount = gradingEntry?.[1]?.answer?.['inst-vignette-count'] as string | undefined;
  const vignetteCount = getVignetteCountForRole(role, requestedVignetteCount);

  useEffect(() => {
    setAnswer({
      status: true,
      answers: { 'vignette-count': String(vignetteCount) },
    });
  }, [setAnswer, vignetteCount]);

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

    const id = setInterval(tryClick, 50);
    const timeout = setTimeout(() => clearInterval(id), 3000);

    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, []);

  return null;
}
