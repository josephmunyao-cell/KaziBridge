import { useState } from "react";
import { ArrowRight, BadgeCheck, Briefcase, CheckSquare, Handshake, MapPin, Pencil, Plus, Scale, Search, ShieldCheck, Users, X, Sparkles, Phone } from "lucide-react";
import { formatKES, proofStats, useKB, type Role } from "@/lib/store";
import { LoadSampleButton } from "./Shell";
import { useCountUp } from "./common";
import { openVerification } from "@/lib/proof-route";

function VerifyProof() {
  const [v, setV] = useState(""); const [err, setErr] = useState("");
  return (
    <form noValidate className="mx-auto w-full max-w-xl" onSubmit={(e) => {
      e.preventDefault();
      if (!v.trim()) { setErr("Enter a Proof ID or link to verify"); return; }
      let ok = false; try { ok = openVerification(v); } catch { ok = false; }
      if (ok) { setV(""); setErr(""); } else setErr("That doesn't look like a KaziBridge Proof ID or verification link.");
    }}>
      <label htmlFor="page-verify" className="mb-1.5 flex items-center justify-center gap-1.5 font-heading text-sm font-semibold text-foreground"><ShieldCheck className="size-4 text-[#00897B]" />Verify Proof</label>
      <p className="mb-3 text-center text-sm text-muted-foreground">Paste a Proof ID or verification link to check a proof of work.</p>
      <div className="flex flex-col gap-2 min-[360px]:flex-row">
        <input id="page-verify" type="text" autoComplete="off" spellCheck={false} inputMode="text" className="kb-input min-h-11 w-full min-w-0 text-sm 2xl:text-base" value={v} onChange={(e) => { setV(e.target.value); setErr(""); }} placeholder="Paste a Proof ID or verification link" aria-invalid={!!err} aria-describedby={err ? "page-verify-err" : undefined} />
        <button type="submit" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#00897B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#00695C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00897B] 2xl:text-base"><ShieldCheck className="size-4" />Verify</button>
      </div>
      {err && <p id="page-verify-err" role="alert" className="mt-1 text-xs text-destructive">{err}</p>}
    </form>
  );
}

function Stat({ label, value, format }: { label: string; value: number; format?: (n: number) => string }) {
  const v = useCountUp(value);
  return (
    <div className="kb-card p-4 sm:p-5">
      <div className="font-heading text-2xl font-extrabold text-primary sm:text-3xl">{format ? format(v) : Math.round(v)}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export function Overview() {
  const { state, setTab, setRole, updateSkills, matchFor } = useKB();
  const p = state.currentProfile;
  const [editing, setEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const open = state.sprints.filter((s) => s.status === "open");
  const totalKES = open.reduce((a, s) => a + s.payKES, 0);
  const avgDays = open.length ? open.reduce((a, s) => a + s.days, 0) / open.length : 0;
  const completed = state.sprints.filter((s) => state.applications[s.id] === "completed");
  const verifiedPct = completed.length ? (completed.filter((s) => state.endorsements[s.id]).length / completed.length) * 100 : 0;
  const ps = proofStats(state);
  const topMatches = p ? open.map((s) => ({ s, m: matchFor(s)! })).sort((a, b) => b.m.score - a.m.score).slice(0, 3) : [];

  const go = (role: Role, tab: "sprints" | "creator" | "proof") => { setRole(role); setTab(tab); };
  const addSkill = () => { const v = newSkill.trim(); if (!p || !v || p.skills.includes(v)) return; updateSkills([...p.skills, v]); setNewSkill(""); };

  const quick: Record<Role, { label: string; action: () => void; icon: typeof Search }[]> = {
    talent: [{ label: "Browse matched sprints", action: () => go("talent", "sprints"), icon: Search }, { label: "View my proof card", action: () => go("talent", "proof"), icon: ShieldCheck }],
    business: [{ label: "Post a sprint with the AI-style scoper", action: () => go("business", "creator"), icon: Sparkles }, { label: "Endorse completed work", action: () => go("business", "creator"), icon: BadgeCheck }],
    mentor: [{ label: "Open mentee tracker", action: () => go("mentor", "proof"), icon: Users }, { label: "Review coordinator actions", action: () => go("mentor", "proof"), icon: CheckSquare }],
  };

  return (
    <div className="space-y-10">
      <section className="kb-card kb-hero overflow-hidden p-6 sm:p-10">
        <p className="kb-chip mb-4 bg-card"><Handshake className="size-3.5 text-primary" /> Track 3 · Local Experience &amp; Networks</p>
        <h1 className="max-w-3xl break-words">Turn skills into paid, verified experience, in days, not months.</h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          KaziBridge connects displaced and host-community youth with local businesses, NGOs and mentors in Garissa, Dadaab, Kakuma and Nairobi through 3–7 day paid micro-sprints — each ending in verified proof of work and a supervisor referral.
        </p>
        <div className="mt-6"><LoadSampleButton large /></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button className="kb-btn kb-btn-secondary justify-between text-left" onClick={() => go("talent", "sprints")}><span className="flex items-center gap-2"><Search className="size-4" />Find Paid Micro-Sprints</span><ArrowRight className="size-4" /></button>
          <button className="kb-btn kb-btn-secondary justify-between text-left" onClick={() => go("business", "creator")}><span className="flex items-center gap-2"><Plus className="size-4" />Post a Micro-Sprint</span><ArrowRight className="size-4" /></button>
          <button className="kb-btn kb-btn-secondary justify-between text-left" onClick={() => go("mentor", "proof")}><span className="flex items-center gap-2"><Users className="size-4" />Mentor &amp; Coordinator Hub</span><ArrowRight className="size-4" /></button>
        </div>
      </section>

      <section aria-label="Impact" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sprints available" value={open.length} />
        <Stat label="Total pay available" value={totalKES} format={(n) => formatKES(n)} />
        <Stat label="Avg days per sprint" value={avgDays} format={(n) => n.toFixed(1)} />
        <Stat label="Completed work verified" value={verifiedPct} format={(n) => `${Math.round(n)}%`} />
      </section>

      <section aria-label="Role and top matches" className="grid items-start gap-6 lg:grid-cols-2">
          <div className="kb-card p-5">
            <h3>I'm here as…</h3>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Role">
              {(["talent", "business", "mentor"] as Role[]).map((r) => (
                <button key={r} role="radio" aria-checked={state.role === r} onClick={() => setRole(r)} className={`kb-btn min-h-10 rounded-full px-4 text-sm ${state.role === r ? "kb-btn-primary" : "kb-btn-secondary"}`}>
                  {r === "talent" ? "Talent" : r === "business" ? "Business / NGO" : "Mentor"}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {quick[state.role].map((q) => (
                <button key={q.label} onClick={q.action} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border px-3 text-left text-sm font-medium hover:bg-muted">
                  <span className="flex min-w-0 items-center gap-2"><q.icon className="size-4 shrink-0 text-primary" /><span className="break-words">{q.label}</span></span><ArrowRight className="size-4 shrink-0" />
                </button>
              ))}
            </div>
          </div>
          {p && (
            <div className="kb-card p-5">
              <h3>Top matches for {p.name.split(" ")[0]}</h3>
              <ul className="mt-3 space-y-2">
                {topMatches.map(({ s, m }) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2 text-sm">
                    <span className="min-w-0 break-words font-medium">{s.title}</span><span className="shrink-0 font-heading font-bold text-verified">{m.score}%</span>
                  </li>
                ))}
              </ul>
              <button className="kb-btn kb-btn-secondary mt-3 w-full" onClick={() => go("talent", "sprints")}>See all sprints</button>
            </div>
          )}
      </section>

      <section aria-label="Talent profile">
          {p ? (
            <div className="kb-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading text-xl font-extrabold text-primary-foreground">{p.initials}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-xl">{p.name}, {p.age}</h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" />{p.location} · {p.background}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"><Phone className="size-4" />{p.phone}</p>
                </div>
                {ps.endorsed.length > 0 ? (
                  <span className="kb-chip border-verified bg-verified-soft font-semibold text-verified"><BadgeCheck className="size-4" />Verified Contributor</span>
                ) : <span className="kb-chip">New Contributor</span>}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-muted p-3"><div className="font-heading text-xl font-bold">{ps.completed.length}</div><div className="text-xs text-muted-foreground">Sprints done</div></div>
                <div className="rounded-xl bg-muted p-3"><div className="font-heading text-xl font-bold">{ps.endorsed.length}</div><div className="text-xs text-muted-foreground">Endorsements</div></div>
                <div className="rounded-xl bg-muted p-3"><div className="font-heading text-xl font-bold">{ps.trust}</div><div className="text-xs text-muted-foreground">Trust score</div></div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-heading font-semibold">Skills</h4>
                  <button className="kb-btn kb-btn-ghost min-h-9 px-2 text-sm" onClick={() => setEditing((e) => !e)}><Pencil className="size-4" />{editing ? "Done" : "Edit skills"}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.skills.map((s) => (
                    <span key={s} className="kb-chip border-primary/20 bg-primary-soft text-primary">{s}
                      {editing && <button aria-label={`Remove ${s}`} className="-mr-1 rounded-full p-0.5 hover:bg-card" onClick={() => updateSkills(p.skills.filter((x) => x !== s))}><X className="size-3.5" /></button>}
                    </span>
                  ))}
                </div>
                {editing && (
                  <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); addSkill(); }}>
                    <label className="sr-only" htmlFor="new-skill">Add a skill</label>
                    <input id="new-skill" className="kb-input" placeholder="e.g. Copywriting" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
                    <button className="kb-btn kb-btn-primary shrink-0" type="submit"><Plus className="size-4" />Add</button>
                  </form>
                )}
                <p className="mt-3 text-sm text-muted-foreground">Languages: {p.languages.join(", ")} · {p.availability}</p>
              </div>
            </div>
          ) : (
            <div className="kb-card flex flex-col items-center p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Users className="size-7" /></div>
              <h3 className="mt-4">See KaziBridge through a talent's eyes</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">Load a realistic sample profile to see match scores, proof of work and endorsements instantly.</p>
              <div className="mt-5"><LoadSampleButton /></div>
            </div>
          )}
      </section>

      <section className="kb-card p-5 sm:p-6">
        <VerifyProof />
      </section>

      <section>
        <h2>How it works</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { t: "Match", d: "Local scoring pairs your skills, location and availability with real sprints.", i: Search },
            { t: "Sprint", d: "3–7 days of paid, scoped work for a local business or NGO.", i: Briefcase },
            { t: "Milestones", d: "Clear checkpoints keep talent, supervisors and mentors aligned.", i: CheckSquare },
            { t: "Verified Proof", d: "Supervisor endorsements become a shareable referral card.", i: BadgeCheck },
          ].map((s, n) => (
            <li key={s.t} className="kb-card p-5">
              <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><s.i className="size-5" /></span><span className="text-sm font-semibold text-muted-foreground">Step {n + 1}</span></div>
              <h3 className="mt-3">{s.t}</h3><p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Our Track 3 mission</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { n: "SDG 8", t: "Decent Work & Economic Growth", d: "Every sprint is paid fairly in KES with a transparent pay rationale and an inclusion uplift.", i: Briefcase },
            { n: "SDG 10", t: "Reduced Inequalities", d: "Displaced and host-community youth build verified work histories that open doors to employers.", i: Scale },
            { n: "SDG 17", t: "Partnerships for the Goals", d: "Businesses, NGOs and mentors co-create local opportunity through one shared network.", i: Handshake },
          ].map((c) => (
            <div key={c.n} className="kb-card p-5">
              <span className="kb-chip border-verified/30 bg-verified-soft font-semibold text-verified"><c.i className="size-3.5" />{c.n}</span>
              <h3 className="mt-3">{c.t}</h3><p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
