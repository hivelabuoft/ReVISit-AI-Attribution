import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { parse as hjsonParse } from 'hjson';
import { availableVignetteIds } from './vignetteRegistry';

const MAX_VIGNETTE_ID = availableVignetteIds.at(-1) ?? 0;
const VIGNETTES_PER_PARTICIPANT = Math.min(5, availableVignetteIds.length);
const STUDY_ID = 'ai-attribution';
const TABLE = 'revisit';
const FIRESTORE_COLLECTION = '_revisit';
const LOCAL_STORAGE_KEY = 'vignette_assignment';

const MODE: 'local' | 'supabase' | 'firebase' = (import.meta.env.VITE_VIGNETTE_MODE as string) === 'supabase'
  ? 'supabase'
  : (import.meta.env.VITE_VIGNETTE_MODE as string) === 'firebase'
    ? 'firebase'
    : (import.meta.env.VITE_STORAGE_ENGINE as string) === 'firebase'
      ? 'firebase'
      : 'local';

// ── Supabase client (only created when needed) ──────────────────────────
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    );
  }
  return _supabase;
}

// ── Firebase client (only created when needed) ─────────────────────────
let _firestore: ReturnType<typeof getFirestore> | null = null;
function getFirestore_() {
  if (!_firestore) {
    const firebaseConfig = hjsonParse(import.meta.env.VITE_FIREBASE_CONFIG);
    const app = initializeApp(firebaseConfig);
    _firestore = getFirestore(app);
  }
  return _firestore;
}

// ── Picking logic (shared) ──────────────────────────────────────────────
function pickLeastAssigned(counts: number[]): number[] {
  const indexed = availableVignetteIds.map((id) => ({ id, count: counts[id - 1] ?? 0 }));
  // Shuffle for random tie-breaking
  for (let i = indexed.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  // Sort by count (stable sort preserves shuffle for ties)
  indexed.sort((a, b) => a.count - b.count);
  const selected = indexed.slice(0, VIGNETTES_PER_PARTICIPANT).map((v) => v.id);
  selected.sort((a, b) => a - b);
  return selected;
}

// ── Local (localStorage) backend ────────────────────────────────────────
interface LocalStore {
  counts: number[];
  assignments: Record<string, number[]>;
}

function getLocalStore(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LocalStore;
  } catch { /* ignore */ }
  return {
    counts: new Array(MAX_VIGNETTE_ID).fill(0),
    assignments: {},
  };
}

function saveLocalStore(store: LocalStore): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
}

async function getAssignmentLocal(participantId: string): Promise<number[]> {
  const store = getLocalStore();

  // Already assigned? Return it.
  if (store.assignments[participantId]) {
    return store.assignments[participantId];
  }

  // Pick least-assigned
  const selected = pickLeastAssigned(store.counts);

  // Update counts
  for (const id of selected) {
    store.counts[id - 1] += 1;
  }

  // Save assignment
  store.assignments[participantId] = selected;
  saveLocalStore(store);

  return selected;
}

// ── Supabase backend ────────────────────────────────────────────────────
async function getAssignmentSupabase(participantId: string): Promise<number[]> {
  const supabase = getSupabase();

  // 1. Check for existing assignment
  const { data: existing } = await supabase
    .from(TABLE)
    .select('data')
    .eq('studyId', STUDY_ID)
    .eq('docId', `vignette_assignment_${participantId}`)
    .single();

  const existingAssignment = existing?.data?.vignettes as number[] | undefined;
  if (existingAssignment) {
    return existingAssignment;
  }

  // 2. Fetch global counts
  const { data: countRow } = await supabase
    .from(TABLE)
    .select('data')
    .eq('studyId', STUDY_ID)
    .eq('docId', 'vignette_counts')
    .single();

  const counts: number[] = countRow?.data?.counts
    ?? new Array(MAX_VIGNETTE_ID).fill(0);

  // 3. Pick least-assigned
  const selected = pickLeastAssigned(counts);

  // 4. Update counts
  for (const id of selected) {
    counts[id - 1] += 1;
  }

  // Save counts (upsert)
  await supabase.from(TABLE).upsert({
    studyId: STUDY_ID,
    docId: 'vignette_counts',
    data: { counts },
  });

  // Save participant assignment (upsert)
  await supabase.from(TABLE).upsert({
    studyId: STUDY_ID,
    docId: `vignette_assignment_${participantId}`,
    data: { vignettes: selected },
  });

  return selected;
}

// ── Firebase backend ────────────────────────────────────────────────────
async function getAssignmentFirebase(participantId: string): Promise<number[]> {
  const firestore = getFirestore_();

  // 1. Check for existing assignment
  const participantDoc = doc(firestore, FIRESTORE_COLLECTION, `${STUDY_ID}_vignette_assignment_${participantId}`);
  const participantSnap = await getDoc(participantDoc);

  if (participantSnap.exists()) {
    const data = participantSnap.data();
    return data.vignettes || [];
  }

  // 2. Get global counts (with transaction-like behavior for consistency)
  const countsDoc = doc(firestore, FIRESTORE_COLLECTION, `${STUDY_ID}_vignette_counts`);
  const countsSnap = await getDoc(countsDoc);

  const counts: number[] = countsSnap.exists()
    ? (countsSnap.data().counts || new Array(MAX_VIGNETTE_ID).fill(0))
    : new Array(MAX_VIGNETTE_ID).fill(0);

  // 3. Pick least-assigned
  const selected = pickLeastAssigned(counts);

  // 4. Update counts
  for (const id of selected) {
    counts[id - 1] += 1;
  }

  // 5. Save updated counts
  await setDoc(countsDoc, {
    counts,
    lastUpdated: serverTimestamp(),
    studyId: STUDY_ID,
  });

  // 6. Save participant assignment
  await setDoc(participantDoc, {
    vignettes: selected,
    assignedAt: serverTimestamp(),
    participantId,
    studyId: STUDY_ID,
  });

  return selected;
}

// ── Stable participant ID ────────────────────────────────────────────────
const SESSION_PID_KEY = 'vignette_participant_id';

/**
 * Returns a stable participant ID for the current session.
 * Uses the email from answers if available, otherwise generates an anonymous
 * ID once and stores it in sessionStorage so it survives page navigations.
 */
export function getParticipantId(email: string | undefined | null): string {
  if (email) return email;

  const existing = sessionStorage.getItem(SESSION_PID_KEY);
  if (existing) return existing;

  const id = `anon-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(SESSION_PID_KEY, id);
  return id;
}

// ── Public API ──────────────────────────────────────────────────────────
export async function getVignetteAssignment(participantId: string): Promise<number[]> {
  if (MODE === 'supabase') {
    return getAssignmentSupabase(participantId);
  }
  if (MODE === 'firebase') {
    return getAssignmentFirebase(participantId);
  }
  return getAssignmentLocal(participantId);
}
