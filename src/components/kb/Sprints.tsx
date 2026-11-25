import { useMemo, useState } from "react";
import { BadgeCheck, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, Clock, FilterX, HeartHandshake, Hourglass, MapPin, Play, Search, SlidersHorizontal, Sparkles, Trophy, User, Wallet } from "lucide-react";
import { CATEGORIES, type Sprint } from "@/data/seed";
import { formatKES, useKB } from "@/lib/store";
import { skillMatches } from "@/lib/matching";
import { MatchRing, Modal, ProgressBar } from "./common";
import { LoadSampleButton } from "./Shell";

type Dur = "any" | "short" | "long"; type Pay = "any" | "low" | "mid" | "high"; type Sort = "match" | "pay" | "short";

function StatusAction({ s }: { s: Sprint }) {
  const { state, apply, advance } = useKB();
  const st = state.applications[s.id];
  if (!st) return <button className="kb-btn kb-btn-primary w-full" onClick={(e) => { e.stopPropagation(); apply(s.id); }}><Sparkles className="size-4" />Apply</button>;
  if (st === "applied") return (
    <div className="flex w-full flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      <span className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-warning-soft text-sm font-semibold text-warning"><Hourglass className="size-4" />Applied · pending</span>
      <button className="kb-btn kb-btn-ghost min-h-10 text-sm underline" onClick={() => advance(s.id, "accepted")}>Simulate acceptance (demo)</button>
    </div>
  );
  if (st === "accepted") return <button className="kb-btn kb-btn-verified w-full" onClick={(e) => { e.stopPropagation(); advance(s.id, "in_progress"); }}><Play className="size-4" />Accepted · Start sprint</button>;
  if (st === "in_progress") return <span className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-soft text-sm font-semibold text-primary"><Clock className="size-4" />In progress</span>;
  return <span className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-verified-soft text-sm font-semibold text-verified"><CheckCircle2 className="size-4" />Completed</span>;
}

function ActivePanel() {
  const { state, toggleMilestone, completeSprint } = useKB();
  const active = state.sprints.filter((s) => state.applications[s.id] === "accepted" || state.applications[s.id] === "in_progress");
  if (!active.length) return null;
  return (
    <section className="space-y-4" aria-label="Active sprints">
      {active.map((s) => {
        const prog = state.milestoneProgress[s.id] ?? {};
        const done = s.milestones.filter((m) => prog[m.id]).length;
        const pct = (done / s.milestones.length) * 100;
        return (
          <div key={s.id} className="kb-card border-primary/40 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-sm font-semibold text-primary">Active sprint</p><h3 className="break-words text-lg">{s.title}</h3><p className="text-sm text-muted-foreground">{s.org} · {s.days} days · {formatKES(s.payKES)}</p></div>
              <span className="font-heading text-sm font-bold">{done}/{s.milestones.length} milestones</span>
            </div>
            <div className="mt-3"><ProgressBar value={pct} label={`${s.title} progress`} /></div>
            <ul className="mt-4 space-y-2">
              {s.milestones.map((m) => (
                <li key={m.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 hover:bg-muted">
                    <input type="checkbox" className="size-5 shrink-0 accent-[var(--verified)]" checked={!!prog[m.id]} onChange={() => toggleMilestone(s.id, m.id)} />
                    <span className={`min-w-0 flex-1 break-words ${prog[m.id] ? "text-muted-foreground line-through" : ""}`}>{m.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">Day {m.dayDue}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button className="kb-btn kb-btn-verified mt-4 w-full sm:w-auto" disabled={done < s.milestones.length} onClick={() => completeSprint(s.id)}><Trophy className="size-4" />Mark sprint complete</button>
            {done < s.milestones.length && <p className="mt-2 text-xs text-muted-foreground">Check all milestones to complete.</p>}
          </div>
        );
      })}
    </section>
  );
}

function SprintCard({ s, onOpen }: { s: Sprint; onOpen: () => void }) {
  const { state, matchFor } = useKB();
  const [why, setWhy] = useState(false);
  const m = matchFor(s);
  const have = state.currentProfile ? [...state.currentProfile.skills, ...state.currentProfile.languages] : [];
  return (
    <article className="kb-card kb-card-hover flex cursor-pointer flex-col p-5" onClick={onOpen} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }} aria-label={s.title}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {s.isNew && <span className="kb-chip border-primary bg-primary font-semibold text-primary-foreground">New</span>}
            <span className="kb-chip">{s.category}</span>
          </div>
          <h3 className="break-words leading-snug">{s.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><Building2 className="size-4" />{s.org}<span className={`kb-chip py-0 text-xs ${s.orgType === "NGO" ? "bg-verified-soft text-verified" : ""}`}>{s.orgType}</span></p>
        </div>
        {m && <MatchRing score={m.score} />}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="size-4" />{s.location} · {s.mode}</span>
        <span className="flex items-center gap-1"><CalendarDays className="size-4" />{s.days} days</span>
      </div>
      <p className="mt-3 font-heading text-2xl font-extrabold text-primary">{formatKES(s.payKES)}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {s.skillsRequired.map((k) => {
          const ok = have.length > 0 && skillMatches(have, k);
          return <span key={k} className={`kb-chip ${ok ? "border-verified/40 bg-verified-soft text-verified" : ""}`}>{ok && <Check className="size-3.5" />}{k}</span>;
        })}
      </div>
      {m ? (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <button className="flex min-h-10 items-center gap-1 text-sm font-semibold text-primary" aria-expanded={why} onClick={() => setWhy((w) => !w)}>Why you match <ChevronDown className={`size-4 transition-transform ${why ? "rotate-180" : ""}`} /></button>
          {why && <ul className="space-y-1 text-sm text-muted-foreground">{m.reasons.map((r) => <li key={r} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-verified" />{r}</li>)}</ul>}
        </div>
      ) : <p className="mt-3 text-sm text-muted-foreground"><User className="mr-1 inline size-4" />Load sample to see your match</p>}
      <div className="mt-auto pt-4"><StatusAction s={s} /></div>
    </article>
  );
}

export function Sprints() {
  const { state, matchFor } = useKB();
  const [q, setQ] = useState(""); const [cats, setCats] = useState<string[]>([]);
  const [dur, setDur] = useState<Dur>("any"); const [pay, setPay] = useState<Pay>("any");
  const [modes, setModes] = useState<string[]>([]); const [sort, setSort] = useState<Sort>("match");
  const [showFilters, setShowFilters] = useState(false); const [detail, setDetail] = useState<Sprint | null>(null);

  const clear = () => { setQ(""); setCats([]); setDur("any"); setPay("any"); setModes([]); };
  const toggle = (arr: string[], v: string, fn: (a: string[]) => void) => fn(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const res = state.sprints.filter((s) => s.status === "open").filter((s) =>
      (!t || [s.title, s.org, ...s.skillsRequired].join(" ").toLowerCase().includes(t)) &&
      (!cats.length || cats.includes(s.category)) &&
      (dur === "any" || (dur === "short" ? s.days <= 4 : s.days >= 5)) &&
      (pay === "any" || (pay === "low" ? s.payKES < 5000 : pay === "mid" ? s.payKES >= 5000 && s.payKES <= 8000 : s.payKES > 8000)) &&
      (!modes.length || modes.includes(s.mode)));
    return res.sort((a, b) => {
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
      if (sort === "pay") return b.payKES - a.payKES;
      if (sort === "short") return a.days - b.days;
      return (matchFor(b)?.score ?? 0) - (matchFor(a)?.score ?? 0);
    });
  }, [state.sprints, q, cats, dur, pay, modes, sort, matchFor]);

  const pill = (on: boolean) => `kb-btn min-h-10 rounded-full px-3 text-sm ${on ? "kb-btn-primary" : "kb-btn-secondary"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0"><h2>Paid micro-sprints</h2><p className="mt-1 text-muted-foreground">Short, paid, local work that ends in verified proof.</p></div>
        {!state.currentProfile && <LoadSampleButton />}
      </div>
      <ActivePanel />

      <div className="kb-card sticky top-[4.5rem] z-30 p-3 sm:p-4">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="sprint-search" className="sr-only">Search sprints</label>
            <input id="sprint-search" className="kb-input pl-9" placeholder="Search title, org or skill" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="kb-btn kb-btn-secondary shrink-0 px-3 lg:hidden" aria-expanded={showFilters} onClick={() => setShowFilters((f) => !f)}><SlidersHorizontal className="size-4" /><span className="hidden sm:inline">Filters</span></button>
          <label htmlFor="sort" className="sr-only">Sort</label>
          <select id="sort" className="kb-input w-auto shrink-0" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="match">Best match</option><option value="pay">Highest pay</option><option value="short">Shortest</option>
          </select>
        </div>
        <div className={`${showFilters ? "block" : "hidden"} mt-3 max-h-[50dvh] space-y-3 overflow-y-auto lg:block lg:max-h-none lg:overflow-visible`}>
          <div className="flex flex-wrap gap-2" aria-label="Categories">
            {CATEGORIES.map((c) => <button key={c} aria-pressed={cats.includes(c)} className={pill(cats.includes(c))} onClick={() => toggle(cats, c, setCats)}>{cats.includes(c) && <Check className="size-3.5" />}{c}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="dur">Duration</label>
            <select id="dur" className="kb-input w-auto" value={dur} onChange={(e) => setDur(e.target.value as Dur)}><option value="any">Any duration</option><option value="short">3–4 days</option><option value="long">5–7 days</option></select>
            <label className="sr-only" htmlFor="pay">Pay range</label>
            <select id="pay" className="kb-input w-auto" value={pay} onChange={(e) => setPay(e.target.value as Pay)}><option value="any">Any pay</option><option value="low">Under KES 5k</option><option value="mid">KES 5k–8k</option><option value="high">KES 8k+</option></select>
            {["On-site", "Remote", "Hybrid"].map((m) => <button key={m} aria-pressed={modes.includes(m)} className={pill(modes.includes(m))} onClick={() => toggle(modes, m, setModes)}>{modes.includes(m) && <Check className="size-3.5" />}{m}</button>)}
            <button className="kb-btn kb-btn-ghost min-h-10 text-sm" onClick={clear}><FilterX className="size-4" />Clear filters</button>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">{list.length} sprint{list.length === 1 ? "" : "s"} found</p>
      </div>

      {list.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((s) => <SprintCard key={s.id} s={s} onOpen={() => setDetail(s)} />)}</div>
      ) : (
        <div className="kb-card p-10 text-center"><FilterX className="mx-auto size-10 text-muted-foreground" /><h3 className="mt-3">No sprints match those filters</h3><p className="mt-1 text-muted-foreground">Try widening your search.</p><button className="kb-btn kb-btn-primary mt-4" onClick={clear}>Clear filters</button></div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ""} wide>
        {detail && (
          <div className="space-y-4">
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><Building2 className="size-4" />{detail.org} · {detail.orgType} · Posted by {detail.postedBy}</p>
            <p className="break-words">{detail.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl bg-muted p-3"><MapPin className="mb-1 size-4" />{detail.location} · {detail.mode}</div>
              <div className="rounded-xl bg-muted p-3"><CalendarDays className="mb-1 size-4" />{detail.days} days</div>
              <div className="rounded-xl bg-muted p-3"><Wallet className="mb-1 size-4" />{formatKES(detail.payKES)}</div>
            </div>
            <div><h4 className="font-heading font-semibold">Milestones</h4>
              <ol className="mt-2 space-y-1.5">{detail.milestones.map((m, i) => <li key={m.id} className="flex gap-2 text-sm"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span><span className="min-w-0 flex-1">{m.title}</span><span className="text-muted-foreground">Day {m.dayDue}</span></li>)}</ol>
            </div>
            <div className="rounded-xl border border-verified/30 bg-verified-soft p-3 text-sm"><HeartHandshake className="mr-1 inline size-4 text-verified" /><strong>Pay breakdown:</strong> 50% ({formatKES(detail.payKES / 2)}) via M-Pesa at midpoint, 50% on verified completion.</div>
            {state.endorsements[detail.id] && <p className="text-sm text-verified"><BadgeCheck className="mr-1 inline size-4" />Verified</p>}
            <StatusAction s={detail} />
          </div>
        )}
      </Modal>
    </div>
  );
}
