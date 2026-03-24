import { useCallback, useEffect, useState } from 'react';
import { StimulusParams } from '../../../store/types';
import { getParticipantId, getVignetteAssignment } from './vignetteAssignment';

// Import all vignette HTML files as raw strings at build time
const vignetteModules = import.meta.glob('./vigs/*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

interface Slide {
  emoji: string;
  title: string;
  items: string[];
  segmentId: string;
}

interface VignetteData {
  heading: string;
  slides: Slide[];
  segments: { id: string; text: string }[];
}

/** Parse the structured HTML file into slide data */
function parseVignetteHtml(html: string): VignetteData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract heading
  const h1 = doc.querySelector('h1');
  const heading = h1?.textContent?.trim() || 'Scenario';

  // Extract slides
  const slideEls = doc.querySelectorAll('.slide');
  const slides: Slide[] = Array.from(slideEls).map((el) => {
    const h2 = el.querySelector('h2');
    const emojiEl = h2?.querySelector('.emoji');
    const emoji = emojiEl?.textContent?.trim() || '';
    const title = h2?.textContent?.replace(emoji, '').trim() || '';
    const items = Array.from(el.querySelectorAll('li')).map((li) => li.innerHTML);
    const segmentId = el.getAttribute('data-highlight') || '';
    return {
      emoji, title, items, segmentId,
    };
  });

  // Extract vignette text segments
  const segmentEls = doc.querySelectorAll('.vignette-segment');
  const segments = Array.from(segmentEls).map((el) => ({
    id: el.id,
    text: el.innerHTML,
  }));

  return { heading, slides, segments };
}

function getVignetteHtml(vignetteId: number): string | null {
  const key = `./vigs/${vignetteId}.html`;
  return vignetteModules[key] ?? null;
}

/* ── Styles ─────────────────────────────────────────────────────────── */

const styles = {
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    fontSize: '1.1rem',
    fontWeight: 600,
    padding: '0.8em 1em',
    background: '#f5f7fa',
    borderBottom: '1px solid #e0e0e0',
    borderRadius: '8px 8px 0 0',
    color: '#2c3e50',
    letterSpacing: 0.3,
  } as React.CSSProperties,
  mainLayout: {
    display: 'flex',
    gap: 28,
    padding: '24px 0',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  slidePanel: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  slideCard: {
    background: '#fff',
    borderRadius: 14,
    padding: '32px 30px 28px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    minHeight: 220,
  } as React.CSSProperties,
  slideTitle: {
    fontSize: '1.15rem',
    color: '#2b6cb0',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
  slideList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  } as React.CSSProperties,
  slideItem: {
    position: 'relative' as const,
    padding: '7px 0 7px 22px',
    fontSize: '0.97rem',
    lineHeight: 1.55,
    color: '#4a5568',
  } as React.CSSProperties,
  bullet: {
    position: 'absolute' as const,
    left: 0,
    color: '#63b3ed',
    fontWeight: 'bold' as const,
  } as React.CSSProperties,
  controls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 18,
  } as React.CSSProperties,
  navBtn: (disabled: boolean) => ({
    background: disabled ? '#cbd5e0' : '#2b6cb0',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '9px 22px',
    fontSize: '0.95rem',
    cursor: disabled ? 'default' : 'pointer',
  } as React.CSSProperties),
  pageInfo: {
    fontSize: '0.9rem',
    color: '#718096',
    fontWeight: 600,
    minWidth: 70,
    textAlign: 'center' as const,
  } as React.CSSProperties,
  vignettePanel: {
    flex: 1,
    background: '#fff',
    borderRadius: 14,
    padding: '28px 26px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    position: 'sticky' as const,
    top: 24,
  } as React.CSSProperties,
  vignettePanelTitle: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: 14,
  } as React.CSSProperties,
  segment: (highlighted: boolean) => ({
    fontSize: '0.93rem',
    lineHeight: 1.7,
    color: highlighted ? '#2b6cb0' : '#4a5568',
    padding: '5px 6px',
    borderRadius: highlighted ? 4 : 5,
    background: highlighted ? '#ebf8ff' : 'transparent',
    fontWeight: highlighted ? 600 : 'normal' as const,
    transition: 'background 0.35s, color 0.35s',
    display: 'inline',
    boxDecorationBreak: 'clone' as const,
  } as React.CSSProperties),
};

/* ── Slide Viewer Component ─────────────────────────────────────────── */

function SlideViewer({ data }: { data: VignetteData }) {
  const [current, setCurrent] = useState(0);
  const total = data.slides.length;
  const activeSegId = data.slides[current]?.segmentId || '';

  const navigate = useCallback((dir: number) => {
    setCurrent((prev) => {
      const next = prev + dir;
      return next >= 0 && next < total ? next : prev;
    });
  }, [total]);

  const slide = data.slides[current];

  return (
    <div style={styles.mainLayout}>
      {/* Left: Slides */}
      <div style={styles.slidePanel}>
        <div style={styles.slideCard}>
          <div style={styles.slideTitle}>
            <span style={{ fontSize: '1.3rem' }}>{slide.emoji}</span>
            {' '}
            {slide.title}
          </div>
          <ul style={styles.slideList}>
            {slide.items.map((item, i) => (
              <li key={i} style={styles.slideItem}>
                <span style={styles.bullet}>&#9656;</span>
                {/* eslint-disable-next-line react/no-danger */}
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </div>
        <div style={styles.controls}>
          <button
            type="button"
            style={styles.navBtn(current === 0)}
            disabled={current === 0}
            onClick={() => navigate(-1)}
          >
            &larr; Back
          </button>
          <span style={styles.pageInfo}>
            {current + 1}
            {' / '}
            {total}
          </span>
          <button
            type="button"
            style={styles.navBtn(current === total - 1)}
            disabled={current === total - 1}
            onClick={() => navigate(1)}
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Right: Vignette text */}
      <div style={styles.vignettePanel}>
        <div style={styles.vignettePanelTitle}>
          <span style={{ fontSize: '1.1rem' }}>&#128214;</span>
          {' Original Vignette Text'}
        </div>
        <p>
          {data.segments.map((seg) => (
            <span
              key={seg.id}
              style={styles.segment(seg.id === activeSegId)}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: seg.text }}
            />
          ))}
        </p>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */

interface VignetteParams {
  slotIndex: number;
}

export default function VignetteScenario({ parameters, setAnswer, answers }: StimulusParams<VignetteParams>) {
  const [vignetteIds, setVignetteIds] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // answers keys are "componentName_index", so find by prefix
  const infoEntry = Object.entries(answers || {}).find(
    ([key]) => key.startsWith('information_'),
  );
  const participantId = getParticipantId(
    infoEntry?.[1]?.answer?.['contact-email'] as string | undefined,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {' '}
          {error}
        </p>
      </div>
    );
  }

  const vignetteId = vignetteIds[parameters.slotIndex];
  const slotNum = parameters.slotIndex + 1;
  const html = getVignetteHtml(vignetteId);

  if (!html) {
    return (
      <div style={{ textAlign: 'center', padding: '3em', color: '#c00' }}>
        <p>
          Vignette #
          {vignetteId}
          {' '}
          not found.
        </p>
      </div>
    );
  }

  const data = parseVignetteHtml(html);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        Scenario
        {' '}
        {slotNum}
        {' '}
        of 5
      </div>
      <SlideViewer data={data} />
    </div>
  );
}
