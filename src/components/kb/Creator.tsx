import { useState } from "react";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, BadgeCheck, CheckCircle2, Hourglass, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import { CATEGORIES, type Mode, type OrgType, type Sprint } from "@/data/seed";
import { formatKES, useKB } from "@/lib/store";
import { scopeSprint, type ScopeResult } from "@/lib/scoper";
import { Modal, SectionTitle, Stars } from "./common";

interface Form { title: string; org: string; orgType: OrgType; category: string; location: string; mode: Mode; description: string; skills: string[]; days: number; budget: string }
const EMPTY: Form = { title: "", org: "", orgType: "Local Business", category: CATEGORIES[0], location: "Garissa", mode: "Hybrid", description: "", skills: [], days: 4, budget: "" };

const PRESETS: { label: string; f: Partial<Form> }[] = [
  { label: "Flyers & Promo Pack", f: { title: "Promo flyer pack for weekend offers", org: "Al-Amin Supermarket", category: "Digital Outreach & Flyers", description: "Design 4 bilingual promo flyers and WhatsApp status images for our weekend offers.", skills: ["Canva design", "Kiswahili", "Social media posting"], days: 3, budget: "4000", mode: "Hybrid" } },
  { label: "Inventory to Spreadsheet", f: { title: "Move shop inventory into a Google Sheet", org: "Garissa Agrovet", category: "Data & Inventory Organization", description: "Count stock and record 250 products in a spreadsheet with reorder levels.", skills: ["Excel/Google Sheets", "Data entry", "Inventory"], days: 5, budget: "7000", mode: "On-site" } },
  { label: "WhatsApp Business Setup", f: { title: "WhatsApp Business catalogue & auto-replies", org: "Nuur Beauty Salon", category: "Basic Web & Customer Setup", description: "Set up a WhatsApp Business catalogue with prices and configure customer auto-replies.", skills: ["Basic WhatsApp Business setup", "Customer service"], days: 3, budget: "3500", mode: "Hybrid" } },
  { label: "Simple Website", f: { title: "Simple 1-page website with M-Pesa Till", org: "Sahan Hardware", category: "Basic Web & Customer Setup", description: "Build a one-page website with products, location, WhatsApp button and M-Pesa till number.", skills: ["Basic JS/HTML", "Canva design"], days: 6, budget: "9000", mode: "Remote" } },
  { label: "Data Cleaning & Records", f: { title: "Digitise and clean 150 member records", org: "Dadaab Youth Network", orgType: "NGO", category: "Data & Inventory Organization", description: "Digitise paper member records, clean the dataset and remove duplicates.", skills: ["Data entry", "Data cleaning", "Excel/Google Sheets"], days: 5, budget: "7500", mode: "On-site", location: "Dadaab" } },
  { label: "Community Survey", f: { title: "Household survey on solar energy use", org: "Jua Safi Initiative", orgType: "NGO", category: "Translation & Community Surveys", description: "Enumerate 50 household interviews in Somali and Kiswahili using KoboCollect.", skills: ["Somali", "Kiswahili", "Data entry"], days: 5, budget: "8000", mode: "On-site" } },
];

function EndorseSection() {
  const { state, endorse } = useKB();
  const [target, setTarget] = useState<Sprint | null>(null);
  const [rating, setRating] = useState(5); const [note, setNote] = useState(""); const [by, setBy] = useState(""); const [err, setErr] = useState("");
  const pending = state.sprints.filter((s) => state.applications[s.id] === "completed" && !state.endorsements[s.id]);
  const done = state.sprints.filter((s) => state.applications[s.id] === "completed" && state.endorsements[s.id]);
  const talent = state.currentProfile?.name ?? "Amina Hassan Warsame";
  const submit = () => {
    if (!target) return;
    if (!by.trim() || note.trim().length < 10) { setErr("Add your name and a short note (at least 10 characters)."); return; }
    endorse(target.id, { by: by.trim(), org: target.org, note: note.trim(), rating, date: new Date().toISOString().slice(0, 10) });
    setTarget(null);
  };
  return (
    <section>
      <SectionTitle title="Completed work awaiting your endorsement" sub="Your endorsement turns finished work into verified proof for talent." />
      {pending.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {pending.map((s) => (
            <div key={s.id} className="kb-card flex flex-col p-5">
              <span className="kb-chip w-fit border-warning/30 bg-warning-soft font-semibold text-warning"><Hourglass className="size-3.5" />Awaiting endorsement</span>
              <h3 className="mt-2 break-words">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{talent} · {s.org} · {s.days} days</p>
              <button className="kb-btn kb-btn-verified mt-4 w-full sm:w-auto" onClick={() => { setTarget(s); setRating(5); setNote(""); setBy(s.postedBy.split(",")[0] ?? ""); setErr(""); }}><BadgeCheck className="size-4" />Endorse</button>
            </div>
          ))}
        </div>
      ) : <div className="kb-card p-6 text-center text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 size-8 text-verified" />All completed work is endorsed.</div>}
      {done.length > 0 && <p className="mt-3 text-sm text-muted-foreground"><BadgeCheck className="mr-1 inline size-4 text-verified" />{done.length} sprint{done.length > 1 ? "s" : ""} already verified.</p>}

      <Modal open={!!target} onClose={() => setTarget(null)} title={`Endorse: ${target?.title ?? ""}`}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div><span className="text-sm font-medium">Rating</span><Stars value={rating} onChange={setRating} size={22} /></div>
          <div><label htmlFor="e-note" className="text-sm font-medium">Note (1–2 sentences)</label><textarea id="e-note" className="kb-input mt-1 min-h-24" maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Delivered on time with excellent attention to detail." /></div>
          <div><label htmlFor="e-by" className="text-sm font-medium">Supervisor name</label><input id="e-by" className="kb-input mt-1" value={by} onChange={(e) => setBy(e.target.value)} /></div>
          {err && <p className="flex items-center gap-1 text-sm text-destructive" role="alert"><AlertTriangle className="size-4" />{err}</p>}
          <button className="kb-btn kb-btn-verified w-full" type="submit"><BadgeCheck className="size-4" />Submit endorsement</button>
        </form>
      </Modal>
    </section>
  );
}

export function Creator() {
  const { state, publish, setTab } = useKB();
  const [f, setF] = useState<Form>(EMPTY);
  const [skillIn, setSkillIn] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scoping, setScoping] = useState(false);
  const [scope, setScope] = useState<ScopeResult | null>(null);
  const [ms, setMs] = useState<string[]>([]);
  const [published, setPublished] = useState<string | null>(null);
  const up = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  const runScope = () => {
    setScoping(true); setScope(null);
    setTimeout(() => {
      const r = scopeSprint(`${f.title} ${f.description} ${f.category}`, f.days);
      setScope(r); setMs(r.milestones); up("days", r.days); setScoping(false);
    }, 750);
  };
  const addSkill = () => { const v = skillIn.trim(); if (v && !f.skills.includes(v)) up("skills", [...f.skills, v]); setSkillIn(""); };
  const move = (i: number, d: number) => setMs((a) => { const b = [...a]; const j = i + d; if (j < 0 || j >= b.length) return a; [b[i], b[j]] = [b[j]!, b[i]!]; return b; });

  const submit = () => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 5) e["title"] = "Add a clear title (5+ characters).";
    if (!f.org.trim()) e["org"] = "Organisation name is required.";
    if (f.description.trim().length < 15) e["description"] = "Describe the work (15+ characters).";
    if (!f.skills.length) e["skills"] = "Add at least one required skill.";
    const b = Number(f.budget); if (!b || b < 1000) e["budget"] = "Enter a budget of at least KES 1,000.";
    const milestones = (ms.length ? ms : scopeSprint(`${f.title} ${f.description}`, f.days).milestones).filter((m) => m.trim());
    if (ms.length && milestones.length < 3) e["ms"] = "Keep at least 3 milestones.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const id = `u${Date.now()}`;
    publish({
      id, title: f.title.trim(), org: f.org.trim(), orgType: f.orgType, category: f.category, location: f.location.trim() || "Garissa", mode: f.mode,
      days: f.days, payKES: b, skillsRequired: f.skills, description: f.description.trim(),
      milestones: milestones.map((t, i) => ({ id: `${id}-m${i + 1}`, title: t, dayDue: Math.max(1, Math.round(((i + 1) / milestones.length) * f.days)) })),
      status: "open", postedBy: f.org.trim(), isNew: true, userPosted: true, createdAt: new Date().toISOString(),
    });
    setPublished(f.title.trim()); setF(EMPTY); setScope(null); setMs([]);
  };

  const budget = Number(f.budget) || 0;
  const below = scope && budget > 0 && budget < scope.min;
  const mine = state.sprints.filter((s) => s.userPosted);
  const err = (k: string) => errors[k] && <p className="mt-1 text-sm text-destructive" role="alert">{errors[k]}</p>;

  return (
    <div className="space-y-10">
      <section>
        <SectionTitle title="Post a micro-sprint" sub="Scope fair, short, paid work for local talent in minutes." />
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="w-full text-sm font-medium text-muted-foreground sm:w-auto sm:self-center">Quick presets:</span>
          {PRESETS.map((p) => <button key={p.label} className="kb-btn kb-btn-secondary min-h-10 rounded-full px-3 text-sm" onClick={() => { setF({ ...EMPTY, ...p.f }); setScope(null); setMs([]); setErrors({}); }}>{p.label}</button>)}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <form className="kb-card space-y-4 p-5 sm:p-6 lg:col-span-3" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
            <div><label htmlFor="f-title" className="text-sm font-medium">Sprint title</label><input id="f-title" className="kb-input mt-1" value={f.title} onChange={(e) => up("title", e.target.value)} />{err("title")}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="f-org" className="text-sm font-medium">Organisation name</label><input id="f-org" className="kb-input mt-1" value={f.org} onChange={(e) => up("org", e.target.value)} />{err("org")}</div>
              <div><label htmlFor="f-type" className="text-sm font-medium">Organisation type</label><select id="f-type" className="kb-input mt-1" value={f.orgType} onChange={(e) => up("orgType", e.target.value as OrgType)}><option value="Local Business">Business</option><option value="NGO">NGO</option></select></div>
              <div><label htmlFor="f-cat" className="text-sm font-medium">Category</label><select id="f-cat" className="kb-input mt-1" value={f.category} onChange={(e) => up("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label htmlFor="f-loc" className="text-sm font-medium">Location</label><input id="f-loc" className="kb-input mt-1" value={f.location} onChange={(e) => up("location", e.target.value)} /></div>
              <div><label htmlFor="f-mode" className="text-sm font-medium">Mode</label><select id="f-mode" className="kb-input mt-1" value={f.mode} onChange={(e) => up("mode", e.target.value as Mode)}><option>On-site</option><option>Remote</option><option>Hybrid</option></select></div>
              <div><label htmlFor="f-budget" className="text-sm font-medium">Budget (KES)</label><input id="f-budget" inputMode="numeric" className="kb-input mt-1" value={f.budget} onChange={(e) => up("budget", e.target.value.replace(/\D/g, ""))} />{err("budget")}</div>
            </div>
            <div><label htmlFor="f-desc" className="text-sm font-medium">Description</label><textarea id="f-desc" className="kb-input mt-1 min-h-24" value={f.description} onChange={(e) => up("description", e.target.value)} />{err("description")}</div>
            <div>
              <label htmlFor="f-skill" className="text-sm font-medium">Required skills</label>
              <div className="mt-1 flex gap-2"><input id="f-skill" className="kb-input" placeholder="Type a skill and press Add" value={skillIn} onChange={(e) => setSkillIn(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} /><button type="button" className="kb-btn kb-btn-secondary shrink-0" onClick={addSkill}><Plus className="size-4" />Add</button></div>
              <div className="mt-2 flex flex-wrap gap-1.5">{f.skills.map((s) => <span key={s} className="kb-chip bg-primary-soft text-primary">{s}<button type="button" aria-label={`Remove ${s}`} onClick={() => up("skills", f.skills.filter((x) => x !== s))}><X className="size-3.5" /></button></span>)}</div>
              {err("skills")}
            </div>
            <div><label htmlFor="f-days" className="text-sm font-medium">Preferred days: <strong>{f.days}</strong></label><input id="f-days" type="range" min={3} max={7} value={f.days} onChange={(e) => up("days", Number(e.target.value))} className="mt-2 w-full accent-[var(--primary)]" /></div>
            {err("ms")}
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" className="kb-btn kb-btn-secondary" onClick={runScope} disabled={scoping}><Sparkles className="size-4" />Scope this sprint</button>
              <button type="submit" className="kb-btn kb-btn-primary"><Send className="size-4" />Publish sprint</button>
            </div>
          </form>

          <aside className="kb-card p-5 sm:p-6 lg:col-span-2" aria-live="polite">
            <div className="flex items-center gap-2"><Sparkles className="size-5 text-primary" /><h3>AI-style scoper</h3></div>
            <p className="text-xs text-muted-foreground">Works offline · local template library, no data leaves your device</p>
            {scoping ? (
              <div className="mt-4 space-y-3"><p className="text-sm font-medium text-primary">Analyzing your request…</p>{[0, 1, 2, 3].map((i) => <div key={i} className="kb-shimmer h-10 rounded-xl" />)}</div>
            ) : scope ? (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-muted p-3"><div className="text-xs text-muted-foreground">Estimated days</div><div className="font-heading text-xl font-bold">{scope.days}</div></div>
                  <div className="rounded-xl bg-verified-soft p-3"><div className="text-xs text-muted-foreground">Fair pay</div><div className="font-heading text-xl font-bold text-verified">{formatKES(scope.suggested)}</div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{formatKES(scope.min)}</span><span>Fair pay range</span><span>{formatKES(scope.max)}</span></div>
                  <div className="relative mt-1 h-3 rounded-full bg-verified-soft">
                    <div className="absolute inset-y-0 rounded-full bg-verified/60" style={{ left: "0%", right: "0%" }} />
                    {budget > 0 && <div className="absolute -top-1 h-5 w-1.5 rounded bg-foreground" style={{ left: `${Math.max(0, Math.min(100, ((budget - scope.min) / (scope.max - scope.min)) * 100))}%` }} aria-label="Your budget" />}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{scope.rationale}</p>
                </div>
                {below && <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm text-warning"><AlertTriangle className="mt-0.5 size-4 shrink-0" />Your budget ({formatKES(budget)}) is below the fair range.</div>}
                <button className="kb-btn kb-btn-verified w-full" onClick={() => up("budget", String(scope.suggested))}>Use suggested pay</button>
                <div>
                  <h4 className="font-heading text-sm font-semibold">Milestones (editable)</h4>
                  <ul className="mt-2 space-y-2">
                    {ms.map((m, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <label className="sr-only" htmlFor={`ms-${i}`}>Milestone {i + 1}</label>
                        <input id={`ms-${i}`} className="kb-input min-h-10 text-sm" value={m} onChange={(e) => setMs((a) => a.map((x, j) => (j === i ? e.target.value : x)))} />
                        <button className="kb-btn kb-btn-ghost size-10 min-h-10 shrink-0 p-0" aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp className="size-4" /></button>
                        <button className="kb-btn kb-btn-ghost size-10 min-h-10 shrink-0 p-0" aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown className="size-4" /></button>
                        <button className="kb-btn kb-btn-ghost size-10 min-h-10 shrink-0 p-0" aria-label="Remove milestone" disabled={ms.length <= 3} onClick={() => setMs((a) => a.filter((_, j) => j !== i))}><Trash2 className="size-4" /></button>
                      </li>
                    ))}
                  </ul>
                  {ms.length < 5 && <button className="kb-btn kb-btn-ghost mt-2 min-h-10 text-sm" onClick={() => setMs((a) => [...a, "New milestone"])}><Plus className="size-4" />Add milestone</button>}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Pick a preset or describe your task, then tap <strong>Scope this sprint</strong> for milestones, days and a fair pay suggestion.</p>
            )}
          </aside>
        </div>
      </section>

      <EndorseSection />

      <section>
        <SectionTitle title="My posted sprints" />
        {mine.length ? (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((s) => {
              const st = state.applications[s.id];
              return (
                <li key={s.id} className="kb-card p-4">
                  <h3 className="break-words text-base">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.days} days · {formatKES(s.payKES)}</p>
                  <span className="kb-chip mt-2">{st ? `Talent: ${st.replace("_", " ")}` : "Open · accepting applications"}</span>
                </li>
              );
            })}
          </ul>
        ) : <p className="kb-card p-6 text-center text-muted-foreground">Sprints you publish appear here.</p>}
      </section>

      <Modal open={!!published} onClose={() => setPublished(null)} title="Sprint published">
        <p className="text-muted-foreground"><CheckCircle2 className="mr-1 inline size-4 text-verified" />"{published}" is live at the top of the Talent tab with a New badge.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="kb-btn kb-btn-secondary" onClick={() => setPublished(null)}>Post another</button>
          <button className="kb-btn kb-btn-primary" onClick={() => { setPublished(null); setTab("sprints"); }}>View in Talent tab <ArrowRight className="size-4" /></button>
        </div>
      </Modal>
    </div>
  );
}
