import { useEffect } from 'react';
import { StimulusParams } from '../../../store/types';

/**
 * Invisible "gate" component that copies the participant's role
 * from the information page into its own answer, so that skip
 * conditions on the surrounding block can reference it locally
 * (ReVISit skip logic can only see answers within the same block).
 */
export default function RoleGate({ setAnswer, answers }: StimulusParams<Record<string, never>>) {
  const role = (answers?.information?.answer?.role as string) || 'Unknown';

  useEffect(() => {
    setAnswer({
      status: true,
      answers: { role },
    });
  }, [role, setAnswer]);

  return (
    <div style={{
      textAlign: 'center', padding: '2em', color: '#555', fontSize: '1.05rem',
    }}
    >
      <p>Preparing your follow-up question&hellip;</p>
    </div>
  );
}
