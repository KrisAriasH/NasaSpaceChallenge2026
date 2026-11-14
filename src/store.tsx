import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  AccessLogEntry,
  CheckIn,
  CrewMember,
  DataCategory,
  Environment,
  FollowUp,
  MemberDay,
  ReactionResult,
  SharingSettings,
  SystemStatus,
} from './types';
import { CREW, MISSION_DAYS, memberById } from './data/crew';
import { simulateEnvironment, simulateMember } from './data/simulate';
import { type Baselines, computeBaselines } from './engine/baseline';
import { DEFAULT_SHARING, canSee, recordAccess } from './engine/privacy';
import { assessMember } from './engine/rules';

/**
 * App state. Everything a person types is saved in this browser (localStorage).
 * Simulated sensor data is regenerated on load; manual entries override it per day.
 */

export type Page =
  | 'overview'
  | 'alerts'
  | 'member'
  | 'followups'
  | 'environment'
  | 'checkin'
  | 'mystatus'
  | 'privacy'
  | 'journal';

interface Persisted {
  checkIns: Record<string, Record<number, CheckIn>>; // memberId -> day -> manual check-in
  reactions: Record<string, Record<number, ReactionResult>>;
  sharing: Record<string, SharingSettings>;
  followUps: FollowUp[];
  accessLog: AccessLogEntry[];
  journal: Record<string, { day: number; text: string }[]>;
}

const STORAGE_KEY = 'asclepio-v1';

const INITIAL: Persisted = {
  checkIns: {},
  reactions: {},
  // Ben already shares his answers with the medical officer; the others don't.
  sharing: Object.fromEntries(
    CREW.map((m) => [m.id, { ...DEFAULT_SHARING, checkInAnswersToCmo: m.id === 'ben' }]),
  ),
  followUps: [],
  accessLog: [],
  journal: {},
};

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL;
  } catch {
    return INITIAL;
  }
}

interface Store {
  day: number;
  setDay: (d: number) => void;
  viewer: CrewMember;
  setViewer: (id: string) => void;
  page: Page;
  subjectId: string; // crew member opened in the detail page
  go: (page: Page, subjectId?: string) => void;

  env: Environment[];
  /** History of a member up to the current day, with manual entries applied. */
  history: (memberId: string) => MemberDay[];
  baselines: (memberId: string) => Baselines;
  assess: (memberId: string) => SystemStatus[];
  /** Privacy check from the current viewer's point of view. */
  can: (subjectId: string, category: DataCategory) => boolean;

  data: Persisted;
  saveCheckIn: (memberId: string, c: CheckIn) => void;
  saveReaction: (memberId: string, r: ReactionResult) => void;
  setSharing: (memberId: string, s: SharingSettings) => void;
  addFollowUp: (f: Omit<FollowUp, 'id' | 'status' | 'createdDay'>) => void;
  setFollowUpStatus: (id: string, status: FollowUp['status']) => void;
  addJournal: (memberId: string, text: string) => void;
  logAccess: (subjectId: string, categories: DataCategory[]) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [day, setDay] = useState(24); // start mid-story for the demo
  const [viewerId, setViewerId] = useState('ana');
  const [page, setPage] = useState<Page>('overview');
  const [subjectId, setSubjectId] = useState('chen');
  const [data, setData] = useState<Persisted>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable: keep in memory */
    }
  }, [data]);

  const env = useMemo(() => simulateEnvironment(), []);
  const simulated = useMemo(() => Object.fromEntries(CREW.map((m) => [m.id, simulateMember(m.id)])), []);

  const store = useMemo<Store>(() => {
    const full = (id: string): MemberDay[] =>
      simulated[id].map((d) => ({
        ...d,
        checkIn: data.checkIns[id]?.[d.day] ?? d.checkIn,
        reaction: data.reactions[id]?.[d.day] ?? d.reaction,
      }));
    const baselineCache: Record<string, Baselines> = {};
    const baselines = (id: string) => (baselineCache[id] ??= computeBaselines(full(id)));
    const history = (id: string) => full(id).slice(0, day);
    const viewer = memberById(viewerId);

    return {
      day,
      setDay,
      viewer,
      setViewer: (id) => {
        setViewerId(id);
        const role = memberById(id).role;
        setPage(role === 'cmo' ? 'overview' : 'mystatus');
      },
      page,
      subjectId,
      go: (p, s) => {
        setPage(p);
        if (s) setSubjectId(s);
      },
      env,
      history,
      baselines,
      assess: (id) => assessMember(id, history(id), baselines(id), env),
      can: (sid, category) => canSee(viewer, memberById(sid), category, data.sharing[sid] ?? DEFAULT_SHARING),
      data,
      saveCheckIn: (id, c) =>
        setData((p) => ({ ...p, checkIns: { ...p.checkIns, [id]: { ...p.checkIns[id], [day]: c } } })),
      saveReaction: (id, r) =>
        setData((p) => ({ ...p, reactions: { ...p.reactions, [id]: { ...p.reactions[id], [day]: r } } })),
      setSharing: (id, s) => setData((p) => ({ ...p, sharing: { ...p.sharing, [id]: s } })),
      addFollowUp: (f) =>
        setData((p) => ({
          ...p,
          followUps: [...p.followUps, { ...f, id: `${Date.now()}`, status: 'pending', createdDay: day }],
        })),
      setFollowUpStatus: (id, status) =>
        setData((p) => ({ ...p, followUps: p.followUps.map((f) => (f.id === id ? { ...f, status } : f)) })),
      addJournal: (id, text) =>
        setData((p) => ({ ...p, journal: { ...p.journal, [id]: [...(p.journal[id] ?? []), { day, text }] } })),
      logAccess: (sid, categories) =>
        setData((p) => {
          const next = recordAccess(p.accessLog, { viewerId, subjectId: sid, day, categories });
          return next === p.accessLog ? p : { ...p, accessLog: next };
        }),
      reset: () => setData(INITIAL),
    };
  }, [day, viewerId, page, subjectId, data, env, simulated]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

export { MISSION_DAYS };
