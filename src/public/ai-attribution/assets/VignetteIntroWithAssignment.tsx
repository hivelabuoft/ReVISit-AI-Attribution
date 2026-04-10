import { useEffect, useState } from 'react';
import { StimulusParams } from '../../../store/types';
import { getParticipantId, getVignetteAssignment } from './vignetteAssignment';

export default function VignetteIntroWithAssignment({ setAnswer, answers }: StimulusParams<Record<string, never>>) {
  const [vignetteIds, setVignetteIds] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const infoEntry = Object.entries(answers || {}).find(
    ([key]) => key.startsWith('information_'),
  );

  const participantId = getParticipantId(
    (infoEntry?.[1]?.answer?.['contact-email'] as string | undefined)
      || (answers?.information?.answer?.['contact-email'] as string | undefined),
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const ids = await getVignetteAssignment(participantId);
        if (!cancelled) {
          setVignetteIds(ids);
          setLoading(false);
          setAnswer({
            status: true,
            answers: { assignedVignettes: ids.join(', ') },
          });
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

  return (
    <div style={{
      maxWidth: 860,
      margin: '0 auto',
      fontSize: '1.05rem',
      lineHeight: 1.7,
      color: '#2c3e50',
    }}
    >
      <h1 style={{ textAlign: 'center' }}>
        <strong>Next Section: AI in Coursework Scenarios</strong>
      </h1>

      <img
        src="https://rotman.az1.qualtrics.com/CP/Graphic.php?IM=IM_bmgQoer6NQ9zwZo"
        alt="AI in Coursework"
        style={{
          display: 'block', margin: '1em auto 2em', maxWidth: 500, width: '100%', height: 'auto',
        }}
      />

      {/* Assignment badge */}
      <div style={{
        textAlign: 'center',
        margin: '1.5em 0',
        padding: '1em 1.5em',
        background: '#eef6ff',
        border: '1px solid #4a90d9',
        borderRadius: 8,
        fontSize: '1.1rem',
      }}
      >
        {loading ? (
          <span>Assigning your scenarios...</span>
        ) : vignetteIds ? (
          <>
            <strong>You are assigned vignettes: </strong>
            {vignetteIds.map((id) => (
              <span
                key={id}
                style={{
                  display: 'inline-block',
                  background: '#4a90d9',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '0.2em 0.6em',
                  margin: '0 0.2em',
                  fontWeight: 'bold',
                }}
              >
                #
                {id}
              </span>
            ))}
          </>
        ) : (
          <span>Could not load assignments. Random scenarios will be shown.</span>
        )}
      </div>

      <p>
        In the next part of the survey, you will be presented with
        {' '}
        <strong>5 different scenarios</strong>
        .
        Each one describes a hypothetical computer science
        {' '}
        <strong>student</strong>
        {' '}
        and
        {' '}
        <strong>their approach to using (or not using) AI for graded coursework</strong>
        ,
        such as a lab, assignment, or team project.
      </p>

      <hr style={{ border: 'none', borderTop: '2px solid #e0e0e0', margin: '2em 0' }} />

      <div style={{
        background: '#f5f7fa',
        borderLeft: '4px solid #4a90d9',
        borderRadius: 6,
        padding: '1.2em 1.5em',
        margin: '1.5em 0',
      }}
      >
        <h2 style={{ marginTop: 0, fontSize: '1.2rem', color: '#2c3e50' }}>Instructions</h2>
        <ul style={{ margin: '0.5em 0 0 0', paddingLeft: '1.2em' }}>
          <li style={{ marginBottom: '0.6em' }}>
            <strong>Your Task:</strong>
            {' '}
            After you review each scenario, we will ask for your personal perspective on the situation.
          </li>
          <li style={{ marginBottom: '0.6em' }}>
            <strong>How to View:</strong>
            {' '}
            Each scenario is available in both
            <u>plain text</u>
            {' '}
            and
            <u>interactive slide deck</u>
            {' '}
            formats.
            Feel free to use whichever format you prefer (or both). An example can be seen below.
          </li>
          <li style={{ marginBottom: '0.6em' }}>
            <strong>A Note on Content:</strong>
            {' '}
            If some technical concepts or course names are unfamiliar, do not worry.
            We are interested in your best judgment.
          </li>
          <li style={{ marginBottom: '0.6em' }}>
            <strong>Don&apos;t worry if you forget the scenario:</strong>
            {' '}
            Simply click the
            <strong>back</strong>
            {' '}
            button
            to see the scenario shown previously.
          </li>
        </ul>
      </div>

      <hr style={{ border: 'none', borderTop: '2px solid #e0e0e0', margin: '2em 0' }} />

      <div style={{
        textAlign: 'center',
        fontSize: '1.3rem',
        margin: '2em 0 1em',
        padding: '0.8em',
        background: '#f5f5f5',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
      }}
      >
        You are free to continue when you are ready!
      </div>
    </div>
  );
}
