import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AMINA, HISTORY_SPRINTS, SEED_ACTIONS, SEED_MENTEES, SEED_SPRINTS, bundleFor,
  type ActionItem, type AppStatus, type Endorsement, type Mentee, type Profile, type Sprint,
} from "@/data/seed";
import { loadJSON, saveJSON, safeRemove } from "./storage";
import { matchSprint, type MatchResult } from "./matching";

export type Role = "talent" | "business" | "mentor";
export type Tab = "overview" | "sprints" | "creator" | "proof";

export interface KBState {
  role: Role; activeTab: Tab; currentProfile: Profile | null; sprints: Sprint[];
  applications: Record<string, AppStatus>; milestoneProgress: Record<string, Record<string, boolean>>;
  endorsements: Record<string, Endorsement>; mentees: Mentee[]; actions: ActionItem[];
  completedThisWeek: number; bannerDismissed: boolean;
}
const KEY = "kazibridge_v1"; const VERSION = 1;

export function seedState(): KBState {
  const b = bundleFor(AMINA);
  return {
    role: "talent", activeTab: "overview", currentProfile: null,
    sprints: [...SEED_SPRINTS, ...HISTORY_SPRINTS],
    applications: b.applications, milestoneProgress: b.milestoneProgress, endorsements: b.endorsements,
    mentees: SEED_MENTEES.map((m) => ({ ...m })), actions: SEED_ACTIONS.map((a) => ({ ...a })),
    completedThisWeek: 0, bannerDismissed: false,
  };
}

function valid(s: unknown): s is KBState {
  const x = s as KBState;
  return !!x && Array.isArray(x.sprints) && typeof x.applications === "object" && Array.isArray(x.mentees) && Array.isArray(x.actions);
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
  matchFor: (s: Sprint) => MatchResult | null;
  sprintById: (id: string) => Sprint | undefined;
}
const KBContext = createContext<Ctx | null>(null);

export function KBProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KBState>(seedState);
  const hydrated = useRef(false);

  useEffect(() => {
    const saved = loadJSON<KBState>(KEY, VERSION);
    if (saved && valid(saved)) setState({ ...seedState(), ...saved });
    hydrated.current = true;
  }, []);
  useEffect(() => { if (hydrated.current) saveJSON(KEY, VERSION, state); }, [state]);

  const set = useCallback((fn: (s: KBState) => KBState) => setState((s) => { try { return fn(s); } catch { return s; } }), []);

  const setTab = useCallback((t: Tab) => {
    set((s) => ({ ...s, activeTab: t }));
    try { window.scrollTo({ top: 0, behavior: "auto" }); } catch { /* ignore */ }
  }, [set]);
  const setRole = useCallback((r: Role) => set((s) => ({ ...s, role: r })), [set]);

  const loadProfile = useCallback((p: Profile) => {
    const b = bundleFor(p);
    set((s) => {
      // keep non-history user activity, replace history
      const keepApps = Object.fromEntries(Object.entries(s.applications).filter(([k]) => !k.startsWith("h")));
      const keepMs = Object.fromEntries(Object.entries(s.milestoneProgress).filter(([k]) => !k.startsWith("h")));
      const keepEnd = Object.fromEntries(Object.entries(s.endorsements).filter(([k]) => !k.startsWith("h")));
      return { ...s, currentProfile: p, applications: { ...keepApps, ...b.applications }, milestoneProgress: { ...keepMs, ...b.milestoneProgress }, endorsements: { ...keepEnd, ...b.endorsements } };
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
    set((s) => ({ ...s, applications: { ...s.applications, [id]: "completed" }, completedThisWeek: s.completedThisWeek + 1 }));
    toast.success("🎉 Sprint complete! Sent to the supervisor for endorsement.");
  }, [set]);
  const endorse = useCallback((id: string, e: Endorsement) => { set((s) => ({ ...s, endorsements: { ...s.endorsements, [id]: e } })); toast.success("Work endorsed — now Verified"); }, [set]);
  const publish = useCallback((sp: Sprint) => { set((s) => ({ ...s, sprints: [sp, ...s.sprints.map((x) => ({ ...x, isNew: x.userPosted ? !!x.isNew : false }))] })); }, [set]);
  const updateSkills = useCallback((skills: string[]) => set((s) => (s.currentProfile ? { ...s, currentProfile: { ...s.currentProfile, skills } } : s)), [set]);

  const endorsedCount = Object.keys(state.endorsements).filter((k) => state.applications[k] === "completed").length;
  const matchFor = useCallback((sp: Sprint) => (state.currentProfile ? matchSprint(state.currentProfile, sp, endorsedCount) : null), [state.currentProfile, endorsedCount]);
  const sprintById = useCallback((id: string) => state.sprints.find((x) => x.id === id), [state.sprints]);

  const value = useMemo<Ctx>(() => ({ state, set, setTab, setRole, loadProfile, reset, apply, advance, toggleMilestone, completeSprint, endorse, publish, updateSkills, matchFor, sprintById }),
    [state, set, setTab, setRole, loadProfile, reset, apply, advance, toggleMilestone, completeSprint, endorse, publish, updateSkills, matchFor, sprintById]);
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
  };
}
