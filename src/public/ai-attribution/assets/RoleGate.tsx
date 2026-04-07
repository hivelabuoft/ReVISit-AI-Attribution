import { useEffect, useRef } from 'react';
import { StimulusParams } from '../../../store/types';

/**
 * Invisible "gate" component that copies the participant's role
 * from the information page into its own answer, so that skip
 * conditions on the surrounding block can reference it locally
 * (ReVISit skip logic can only see answers within the same block).
 * Auto-advances once the Next button becomes enabled.
 */
export default function RoleGate({ setAnswer, answers }: StimulusParams<Record<string, never>>) {
  const hasAdvanced = useRef(false);
  const infoEntry = Object.entries(answers || {}).find(
    ([key]) => key.startsWith('information_'),
  );
  const role = (infoEntry?.[1]?.answer?.role as string)
    || (answers?.information?.answer?.role as string)
    || 'Unknown';

  useEffect(() => {
    setAnswer({
      status: true,
      answers: { role },
    });
  }, [role, setAnswer]);

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
