import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AMINA, HISTORY_SPRINTS, SEED_ACTIONS, SEED_COMPLETED_ON, SEED_MENTEES, SEED_SPRINTS, bundleFor,
  type ActionItem, type AppStatus, type Endorsement, type Mentee, type Note, type Profile, type Sprint,
} from "@/data/seed";
import { safeGet, saveJSON, safeRemove } from "./storage";
import { matchSprint, type MatchResult } from "./matching";
import { issueProof, upsertRecord, type IssuedProof, type ProofRecord } from "./proof";

export type Role = "talent" | "business" | "mentor";
export type Tab = "overview" | "sprints" | "creator" | "proof";

export interface KBState {
  role: Role; activeTab: Tab; currentProfile: Profile | null; sprints: Sprint[];
  applications: Record<string, AppStatus>; milestoneProgress: Record<string, Record<string, boolean>>;
  endorsements: Record<string, Endorsement>; mentees: Mentee[]; actions: ActionItem[];
  completedThisWeek: number; bannerDismissed: boolean;
  proofSegment: Segment; completedOn: Record<string, string>; proofSlugs: Record<string, string>;
  proofRecords: Record<string, ProofRecord>; verifyBaseUrl: string;
}
export type Segment = "proof" | "tracker";
const KEY = "kazibridge_v1"; const VERSION = 2;
export const segmentForRole = (r: Role): Segment => (r === "mentor" ? "tracker" : "proof");

export function seedState(): KBState {
  const b = bundleFor(AMINA);
  return {
    role: "talent", activeTab: "overview", currentProfile: null,
    sprints: [...SEED_SPRINTS, ...HISTORY_SPRINTS],
    applications: b.applications, milestoneProgress: b.milestoneProgress, endorsements: b.endorsements,
    mentees: SEED_MENTEES.map((m) => ({ ...m })), actions: SEED_ACTIONS.map((a) => ({ ...a })),
    completedThisWeek: 0, bannerDismissed: false,
    proofSegment: "proof", completedOn: { ...SEED_COMPLETED_ON }, proofSlugs: {},
    proofRecords: {}, verifyBaseUrl: "",
  };
}

const ROLES: Role[] = ["talent", "business", "mentor"];
const TABS_OK: Tab[] = ["overview", "sprints", "creator", "proof"];

/** Merge any stored (v1/v2, possibly partial) state onto fresh seed data without losing user work. */
export function migrate(raw: unknown): KBState | null {
  try {
    const wrap = raw as { v?: number; data?: unknown };
    const d = (wrap && typeof wrap === "object" && "data" in wrap ? wrap.data : raw) as Partial<KBState> | null;
    if (!valid(d)) return null;
    const seed = seedState();
    const ids = new Set(d.sprints.map((x) => x?.id));
    const sprints = [...d.sprints.filter((x) => x && typeof x.id === "string" && Array.isArray(x.milestones)), ...seed.sprints.filter((x) => !ids.has(x.id))]
      .map((x) => { const sd = seed.sprints.find((y) => y.id === x.id); return sd && !x.userPosted ? { ...sd, isNew: !!x.isNew } : x; });
    const mentees = d.mentees.map((m) => {
      const sd = SEED_MENTEES.find((x) => x.id === m.id);
      const notes: Note[] = Array.isArray(m.notes) ? m.notes.map((n) => (typeof n === "string" ? { date: m.lastCheckIn ?? "", author: "Mentor", text: n } : n)) : [];
      return { ...(sd ?? {}), ...m, notes: notes.length ? notes : sd?.notes ?? [] } as Mentee;
    });
    return {
      ...seed, ...d, sprints, mentees,
      role: ROLES.includes(d.role as Role) ? (d.role as Role) : "talent",
      activeTab: TABS_OK.includes(d.activeTab as Tab) ? (d.activeTab as Tab) : "overview",
      proofSegment: d.proofSegment === "tracker" ? "tracker" : d.proofSegment === "proof" ? "proof" : segmentForRole((d.role as Role) ?? "talent"),
      completedOn: { ...seed.completedOn, ...(d.completedOn ?? {}) }, proofSlugs: d.proofSlugs ?? {},
      endorsements: d.endorsements ?? {}, milestoneProgress: d.milestoneProgress ?? {},
      proofRecords: d.proofRecords && typeof d.proofRecords === "object" ? d.proofRecords : {},
      verifyBaseUrl: typeof d.verifyBaseUrl === "string" ? d.verifyBaseUrl : "",
    };
  } catch { return null; }
}

function valid(s: unknown): s is KBState {
  const x = s as KBState;
  return !!x && typeof x === "object" && Array.isArray(x.sprints) && !!x.applications && typeof x.applications === "object" && Array.isArray(x.mentees) && Array.isArray(x.actions);
}

interface Ctx {
  state: KBState;
  set: (fn: (s: KBState) => KBState) => void;
  setTab: (t: Tab) => void;
  setRole: (r: Role) => void;
  loadProfile: (p: Profile) => void;
  reset: () => void;
  apply: (id: string) => void;
  advance: (id: string, to: AppStatus) => void;
  toggleMilestone: (sid: string, mid: string) => void;
  completeSprint: (id: string) => void;
  endorse: (id: string, e: Endorsement) => void;
  publish: (s: Sprint) => void;
  updateSkills: (skills: string[]) => void;
  setSegment: (g: Segment) => void;
  logCheckIn: (id: string, text: string, needsSupport: boolean, next: string) => void;
  toggleAction: (id: string) => void;
  addAction: (text: string) => void;
  proofSlug: (p: Profile) => string;
  matchFor: (s: Sprint) => MatchResult | null;
  sprintById: (id: string) => Sprint | undefined;
  hydrated: boolean;
  currentProof: IssuedProof | null;
  setVerifyBaseUrl: (u: string) => void;
}
const KBContext = createContext<Ctx | null>(null);

export function KBProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KBState>(seedState);
  const hydrated = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let parsed: unknown = null;
    try { const raw = safeGet(KEY); parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
    const saved = parsed ? migrate(parsed) : null;
    if (saved) setState(saved);
    hydrated.current = true;
    setIsHydrated(true);
  }, []);
  useEffect(() => { if (hydrated.current) saveJSON(KEY, VERSION, state); }, [state]);

  const set = useCallback((fn: (s: KBState) => KBState) => setState((s) => { try { return fn(s); } catch { return s; } }), []);

  const setTab = useCallback((t: Tab) => {
    set((s) => ({ ...s, activeTab: t }));
    try { window.scrollTo({ top: 0, behavior: "auto" }); } catch { /* ignore */ }
  }, [set]);
  const setRole = useCallback((r: Role) => set((s) => ({ ...s, role: r, proofSegment: segmentForRole(r) })), [set]);
  const setSegment = useCallback((g: Segment) => set((s) => ({ ...s, proofSegment: g })), [set]);
  const today = () => new Date().toISOString().slice(0, 10);
  const logCheckIn = useCallback((id: string, text: string, needsSupport: boolean, next: string) => {
    set((s) => ({ ...s, mentees: s.mentees.map((m) => m.id === id ? { ...m, notes: [{ date: today(), author: "Mentor", text }, ...m.notes], lastCheckIn: today(), nextCheckIn: next || m.nextCheckIn, needsSupport } : m) }));
    toast.success("Check-in logged");
  }, [set]);
  const toggleAction = useCallback((id: string) => set((s) => ({ ...s, actions: s.actions.map((a) => a.id === id ? { ...a, done: !a.done } : a) })), [set]);
  const addAction = useCallback((text: string) => { set((s) => ({ ...s, actions: [{ id: `a${Date.now()}`, text, done: false }, ...s.actions] })); toast.success("Action item added"); }, [set]);
  const proofSlug = useCallback((p: Profile) => state.proofSlugs[p.id] ?? p.slug, [state.proofSlugs]);

  const loadProfile = useCallback((p: Profile) => {
    const b = bundleFor(p);
    set((s) => {
      // keep non-history user activity, replace history
      const keepApps = Object.fromEntries(Object.entries(s.applications).filter(([k]) => !k.startsWith("h")));
      const keepMs = Object.fromEntries(Object.entries(s.milestoneProgress).filter(([k]) => !k.startsWith("h")));
      const keepEnd = Object.fromEntries(Object.entries(s.endorsements).filter(([k]) => !k.startsWith("h")));
      return { ...s, currentProfile: p, proofSlugs: { ...s.proofSlugs, [p.id]: s.proofSlugs[p.id] ?? p.slug }, applications: { ...keepApps, ...b.applications }, milestoneProgress: { ...keepMs, ...b.milestoneProgress }, endorsements: { ...keepEnd, ...b.endorsements } };
    });
    toast.success(`Sample profile loaded: ${p.shortName}`);
  }, [set]);

  const reset = useCallback(() => { safeRemove(KEY); setState(seedState()); toast.success("Demo reset to seed data"); }, []);

  const apply = useCallback((id: string) => { set((s) => ({ ...s, applications: { ...s.applications, [id]: "applied" } })); toast.success("Application sent — pending review"); }, [set]);
  const advance = useCallback((id: string, to: AppStatus) => {
    set((s) => ({ ...s, applications: { ...s.applications, [id]: to } }));
    toast.success(to === "accepted" ? "Accepted! You can start the sprint." : to === "in_progress" ? "Sprint started — track milestones above" : "Updated");
  }, [set]);
  const toggleMilestone = useCallback((sid: string, mid: string) => {
    let nowDone = false;
    set((s) => {
      const cur = s.milestoneProgress[sid] ?? {};
      nowDone = !cur[mid];
      const apps = s.applications[sid] === "accepted" ? { ...s.applications, [sid]: "in_progress" as AppStatus } : s.applications;
      return { ...s, applications: apps, milestoneProgress: { ...s.milestoneProgress, [sid]: { ...cur, [mid]: nowDone } } };
    });
    toast(nowDone ? "Milestone checked ✓" : "Milestone unchecked");
  }, [set]);
  const completeSprint = useCallback((id: string) => {
    set((s) => ({ ...s, applications: { ...s.applications, [id]: "completed" }, completedOn: { ...s.completedOn, [id]: new Date().toISOString().slice(0, 10) }, completedThisWeek: s.completedThisWeek + 1 }));
    toast.success("🎉 Sprint complete! Sent to the supervisor for endorsement.");
  }, [set]);
  const endorse = useCallback((id: string, e: Endorsement) => { set((s) => ({ ...s, endorsements: { ...s.endorsements, [id]: e } })); toast.success("Work endorsed — now Verified"); }, [set]);
  const publish = useCallback((sp: Sprint) => { set((s) => ({ ...s, sprints: [sp, ...s.sprints.map((x) => ({ ...x, isNew: x.userPosted ? !!x.isNew : false }))] })); }, [set]);
  const updateSkills = useCallback((skills: string[]) => set((s) => (s.currentProfile ? { ...s, currentProfile: { ...s.currentProfile, skills } } : s)), [set]);

  const endorsedCount = Object.keys(state.endorsements).filter((k) => state.applications[k] === "completed").length;
  const matchFor = useCallback((sp: Sprint) => (state.currentProfile ? matchSprint(state.currentProfile, sp, endorsedCount) : null), [state.currentProfile, endorsedCount]);
  const sprintById = useCallback((id: string) => state.sprints.find((x) => x.id === id), [state.sprints]);

  const currentProof = useMemo(() => (state.currentProfile ? issueProof(state.currentProfile, state) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.currentProfile, state.sprints, state.applications, state.endorsements, state.completedOn]);
  // Keep the proof registry in step with live work: same content = same ID, new content = new ID, old one superseded.
  useEffect(() => {
    if (!isHydrated || !state.currentProfile || !currentProof) return;
    const pid = state.currentProfile.id;
    const prev = Object.values(state.proofRecords).find((r) => r.profileId === pid && !r.supersededBy);
    if (upsertRecord(state.proofRecords, currentProof, pid) === state.proofRecords) return;
    setState((s) => ({ ...s, proofRecords: upsertRecord(s.proofRecords, currentProof, pid) }));
    if (prev && prev.id !== currentProof.id) toast.success("Proof updated: new Proof ID issued");
  }, [isHydrated, currentProof, state.currentProfile, state.proofRecords]);
  const setVerifyBaseUrl = useCallback((u: string) => set((s) => ({ ...s, verifyBaseUrl: u })), [set]);

  const value = useMemo<Ctx>(() => ({ hydrated: isHydrated, currentProof, setVerifyBaseUrl, state, set, setTab, setRole, loadProfile, reset, apply, advance, toggleMilestone, completeSprint, endorse, publish, updateSkills, matchFor, sprintById, setSegment, logCheckIn, toggleAction, addAction, proofSlug }),
    [state, set, setTab, setRole, loadProfile, reset, apply, advance, toggleMilestone, completeSprint, endorse, publish, updateSkills, matchFor, sprintById, setSegment, logCheckIn, toggleAction, addAction, proofSlug, isHydrated, currentProof, setVerifyBaseUrl]);
  return <KBContext.Provider value={value}>{children}</KBContext.Provider>;
}

export function useKB() {
  const c = useContext(KBContext);
  if (!c) throw new Error("useKB outside provider");
  return c;
}

export const formatKES = (n: number) => `KES ${Math.round(n).toLocaleString("en-KE")}`;

export function proofStats(state: KBState) {
  const completed = state.sprints.filter((s) => state.applications[s.id] === "completed");
  const endorsed = completed.filter((s) => state.endorsements[s.id]);
  const ratings = endorsed.map((s) => state.endorsements[s.id]!.rating);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const trust = Math.min(100, Math.round(completed.length * 12 + endorsed.length * 15 + avg * 8));
  return {
    completed, endorsed, avg, trust,
    days: completed.reduce((a, s) => a + s.days, 0),
    earned: completed.reduce((a, s) => a + s.payKES, 0),
    skills: Array.from(new Set(completed.flatMap((s) => s.skillsRequired))),
    verifiedSkills: Array.from(new Set(endorsed.flatMap((s) => s.skillsRequired))),
    pendingSkills: Array.from(new Set(completed.filter((s) => !state.endorsements[s.id]).flatMap((s) => s.skillsRequired))).filter((k) => !endorsed.some((s) => s.skillsRequired.includes(k))),
    active: state.sprints.filter((s) => state.applications[s.id] === "accepted" || state.applications[s.id] === "in_progress"),
  };
}
