import { useEffect, useState } from 'react';
import { StimulusParams } from '../../../store/types';
import { getParticipantId, getVignetteAssignment } from './vignetteAssignment';

const BASE_URL = 'https://hivelabuoft.github.io/ai-attribution-in-cs/pages';

interface VignetteParams {
  /** Which vignette slot this is (0-4) */
  slotIndex: number;
}

export default function VignetteScenario({ parameters, setAnswer, answers }: StimulusParams<VignetteParams>) {
  const [vignetteIds, setVignetteIds] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const participantId = getParticipantId(
    answers?.information?.answer?.['contact-email'] as string | undefined,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const ids = await getVignetteAssignment(participantId);
        if (!cancelled) {
          setVignetteIds(ids);
          setLoading(false);
          // Report the assigned vignette ID so it's saved with the response data
          setAnswer({
            status: true,
            answers: { assignedVignetteId: ids[parameters.slotIndex] },
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load vignette assignment');
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [participantId, parameters.slotIndex]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3em', color: '#666' }}>
        <p style={{ fontSize: '1.2rem' }}>Loading your scenario...</p>
      </div>
    );
  }

  if (error || !vignetteIds) {
    return (
      <div style={{ textAlign: 'center', padding: '3em', color: '#c00' }}>
        <p>
          Error loading scenario:
          {error}
        </p>
      </div>
    );
  }

  const vignetteId = vignetteIds[parameters.slotIndex];
  const slotNum = parameters.slotIndex + 1;

  return (
    <div style={{
      maxWidth: 900, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.7,
    }}
    >
      <div style={{
        textAlign: 'center',
        fontSize: '1.1rem',
        fontWeight: 600,
        padding: '0.8em 1em',
        background: '#f5f7fa',
        borderBottom: '1px solid #e0e0e0',
        borderRadius: '8px 8px 0 0',
        color: '#2c3e50',
        letterSpacing: 0.3,
      }}
      >
        Scenario
        {' '}
        {slotNum}
        {' '}
        of 5 &mdash; Vignette #
        {vignetteId}
      </div>
      <div style={{
        border: '1px solid #ddd',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
      >
        <iframe
          src={`${BASE_URL}/${vignetteId}`}
          title={`Scenario ${slotNum} - Vignette ${vignetteId}`}
          style={{
            display: 'block',
            width: '100%',
            minHeight: 900,
            height: 'calc(100vh - 260px)',
            border: 'none',
          }}
        />
      </div>
      <p style={{
        textAlign: 'center',
        color: '#888',
        fontSize: '0.85rem',
        marginTop: '0.8em',
      }}
      >
        Scroll within the frame above to read the full scenario. When ready, answer the questions on the next page.
      </p>
    </div>
  );
}
