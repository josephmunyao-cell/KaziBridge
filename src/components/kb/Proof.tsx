import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle, BadgeCheck, Download, ExternalLink, Building2, CalendarDays, Check, CheckCircle2, ClipboardCopy, Eye, Hourglass, Info, Link2, MapPin,
  MessageCircle, MessageSquarePlus, Plus, Printer, Quote, Search, ShieldCheck, Users, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AMINA_MENTOR, SEED_PAID_OUT, SEED_WEEKLY, type EndorseState, type Mentee, type Note, type Sprint } from "@/data/seed";
import { formatKES, proofStats, useKB, type KBState } from "@/lib/store";
import { Modal, ProgressBar, SectionTitle, Stars, copyText } from "./common";
import { LoadSampleButton } from "./Shell";
import { displayProofId, issueFromSnapshot, type IssuedProof } from "@/lib/proof";
import { ProofQR, ShareSettings, downloadQrPng, useVerifyUrl } from "@/components/proof/ProofQR";
import { ProofIdChip } from "@/components/proof/ProofIdChip";
import { VerifyIdInput } from "@/components/proof/VerifyIdInput";

const TODAY = () => new Date().toISOString().slice(0, 10);

/* ---------------- Proof card ---------------- */

function TrustInfo() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button type="button" className="flex size-11 items-center justify-center rounded-full hover:bg-primary-foreground/15" aria-label="How this is calculated" aria-expanded={open} onClick={() => setOpen((o) => !o)}><Info className="size-4" /></button>
      {open && (
        <span role="tooltip" className="kb-card absolute right-0 top-full z-20 mt-1 w-64 p-3 text-left text-xs font-normal text-foreground">
          Trust Score (0–100) = 12 per completed sprint + 15 per supervisor endorsement + 8 × average star rating, capped at 100. Calculated on this device.
        </span>
      )}
    </span>
  );
}

function ProofCard({ state, id, readOnly, proof }: { state: KBState; id?: string; readOnly?: boolean; proof?: IssuedProof | null }) {
  const p = state.currentProfile!;
  const ps = proofStats(state);
  const endorsedList = ps.completed.filter((s) => state.endorsements[s.id]);
  return (
    <article id={id} className="kb-card overflow-hidden rounded-2xl">
      <header className="bg-primary p-5 text-primary-foreground sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground font-heading text-xl font-extrabold text-primary">{p.initials}</div>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-2xl">{p.name}</h2>
            <p className="flex flex-wrap items-center gap-1 text-sm opacity-90"><MapPin className="size-4" />{p.location}</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><BadgeCheck className="size-4" />Verified micro-sprint contributor</p>
            {proof && <div className="mt-2"><ProofIdChip id={proof.id} onDark /></div>}
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-primary-foreground/15 px-4 py-2 text-center">
            <div><div className="font-heading text-3xl font-extrabold">{ps.trust}</div><div className="text-xs opacity-90">Trust Score</div></div>
            {!readOnly && <TrustInfo />}
          </div>
        </div>
      </header>
      <div className={`p-5 sm:p-6 ${proof ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] print:grid-cols-[minmax(0,1fr)_auto]" : ""}`}>
      <div className="min-w-0 space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["Sprints completed", String(ps.completed.length)], ["Days worked", String(ps.days)], ["Total earned", formatKES(ps.earned)], ["Avg rating", ps.avg ? `${ps.avg.toFixed(1)} / 5` : "—"]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-muted p-3"><div className="font-heading text-lg font-bold sm:text-xl">{v}</div><div className="text-xs text-muted-foreground">{l}</div></div>
          ))}
        </div>
        {proof && <div className="flex justify-center lg:hidden print:hidden"><ProofQR proof={proof} /></div>}
        <div>
          <h3 className="text-base">Skills verified</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ps.verifiedSkills.map((k) => <span key={k} className="kb-chip border-verified/40 bg-verified-soft text-verified"><Check className="size-3.5" />{k}</span>)}
            {ps.pendingSkills.map((k) => <span key={k} className="kb-chip border-warning/40 bg-warning-soft text-warning"><Hourglass className="size-3.5" />{k} · Demonstrated, awaiting endorsement</span>)}
            {!ps.verifiedSkills.length && !ps.pendingSkills.length && <span className="text-sm text-muted-foreground">No skills verified yet.</span>}
          </div>
        </div>
        <div>
          <h3 className="text-base">Completed sprints</h3>
          <ul className="mt-2 space-y-3">
            {ps.completed.map((s) => <CompletedItem key={s.id} s={s} state={state} />)}
          </ul>
        </div>
        {endorsedList.length > 0 && (
          <div>
            <h3 className="text-base">Supervisor referrals</h3>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {endorsedList.map((s) => { const e = state.endorsements[s.id]!; return (
                <blockquote key={s.id} className="rounded-xl border border-verified/30 bg-verified-soft p-4">
                  <Quote className="size-4 text-verified" />
                  <p className="mt-1 break-words text-sm">"{e.note}"</p>
                  <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span><strong className="text-foreground">{e.by}</strong>, {e.org ?? s.org} · {e.date}</span><Stars value={e.rating} size={13} /></footer>
                </blockquote>
              ); })}
            </div>
          </div>
        )}
        {proof ? <p className="text-xs text-muted-foreground">Generated by KaziBridge · Proof ID {displayProofId(proof.id)} · issued {proof.snapshot.iat}</p>
          : <p className="text-xs text-muted-foreground">Generated by KaziBridge</p>}
      </div>
      {proof && <aside className="hidden min-w-0 lg:block print:block"><div className="lg:sticky lg:top-24"><ProofQR proof={proof} /></div></aside>}
      </div>
    </article>
  );
}

function CompletedItem({ s, state }: { s: Sprint; state: KBState }) {
  const e = state.endorsements[s.id];
  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="break-words font-heading font-semibold">{s.title}</h4>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><Building2 className="size-4" />{s.org}
            <span className={`kb-chip py-0 text-xs ${s.orgType === "NGO" ? "bg-verified-soft text-verified" : ""}`}>{s.orgType === "NGO" ? "NGO" : "Business"}</span></p>
        </div>
        {e ? <span className="kb-chip border-verified/40 bg-verified-soft font-semibold text-verified"><BadgeCheck className="size-3.5" />Verified by supervisor</span>
          : <span className="kb-chip border-warning/40 bg-warning-soft font-semibold text-warning"><Hourglass className="size-3.5" />Awaiting endorsement</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="size-4" />{s.location}</span>
        <span className="flex items-center gap-1"><CalendarDays className="size-4" />{s.days} days · completed {state.completedOn[s.id] ?? "recently"}</span>
        <span className="flex items-center gap-1"><Wallet className="size-4" />{formatKES(s.payKES)}</span>
      </div>
      <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
        {s.milestones.map((m) => <li key={m.id} className="flex gap-1.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-verified" /><span className="min-w-0 break-words">{m.title}</span></li>)}
      </ul>
      {e && <p className="mt-2 break-words text-sm"><strong>{e.by}</strong>, {e.org ?? s.org} <Stars value={e.rating} size={12} /> <span className="text-muted-foreground">"{e.note}"</span></p>}
    </li>
  );
}

function summaryText(state: KBState, url: string, proofId: string) {
  const p = state.currentProfile!; const ps = proofStats(state);
  const lines = [
    `✅ ${p.name} — Verified micro-sprint contributor (${p.location})`,
    `Trust Score: ${ps.trust}/100 · ${ps.completed.length} sprints · ${ps.days} days · ${formatKES(ps.earned)} earned · Avg rating ${ps.avg ? ps.avg.toFixed(1) : "—"}/5`,
    `Verified skills: ${ps.verifiedSkills.join(", ") || "—"}`,
    ...ps.completed.map((s) => `• ${s.title} — ${s.org} (${s.days} days)${state.endorsements[s.id] ? ` ★${state.endorsements[s.id]!.rating} "${state.endorsements[s.id]!.note}" — ${state.endorsements[s.id]!.by}` : " (awaiting endorsement)"}`),
    `Proof ID: ${displayProofId(proofId)}`,
    `Verify: ${url}`,
  ];
  return lines.join("\n");
}

function ProofSection() {
  const { state, setTab, setRole, currentProof } = useKB();
  const verifyUrl = useVerifyUrl(currentProof);
  const [preview, setPreview] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const p = state.currentProfile;
  if (!p) return (
    <div className="kb-card flex flex-col items-center p-8 text-center sm:p-12">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><ShieldCheck className="size-7" /></div>
      <h3 className="mt-4">No proof card yet</h3>
      <p className="mt-2 max-w-md text-muted-foreground">Load a sample talent profile to see a verified, shareable proof-of-work card built from real sprint activity.</p>
      <div className="mt-5"><LoadSampleButton large /></div>
    </div>
  );
  const ps = proofStats(state);
  if (!ps.completed.length) return (
    <div className="kb-card flex flex-col items-center p-8 text-center sm:p-12">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-verified-soft text-verified"><BadgeCheck className="size-7" /></div>
      <h3 className="mt-4">{p.name.split(" ")[0]}'s proof card starts with one sprint</h3>
      <p className="mt-2 max-w-md text-muted-foreground">Apply, finish milestones, get endorsed — each verified sprint is added here automatically.</p>
      <button className="kb-btn kb-btn-primary mt-5" onClick={() => { setRole("talent"); setTab("sprints"); }}><Search className="size-4" />Find Micro-Sprints</button>
    </div>
  );
  const url = verifyUrl;
  const sum = currentProof ? summaryText(state, url, currentProof.id) : "";
  const doCopy = async (text: string, msg: string) => {
    if (await copyText(text)) { toast.success(msg); setFallback(null); } else { setFallback(text); toast.error("Couldn't copy automatically — select the text below"); }
  };
  return (
    <div className="space-y-4">
      {state.role === "business" && <p className="kb-card p-3 text-sm text-muted-foreground"><Building2 className="mr-1 inline size-4 text-primary" />Provider view: this is the proof card employers see after you endorse work.</p>}
      <div className="no-print flex flex-wrap gap-2">
        <button className="kb-btn kb-btn-primary" onClick={() => doCopy(url, "Shareable link copied")}><Link2 className="size-4" />Copy shareable link</button>
        <button className="kb-btn kb-btn-secondary" onClick={() => doCopy(sum, "Summary copied — paste into WhatsApp")}><ClipboardCopy className="size-4" />Copy summary as text</button>
        <a className="kb-btn kb-btn-verified" href={`https://wa.me/?text=${encodeURIComponent(sum)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" />Share on WhatsApp</a>
        <button className="kb-btn kb-btn-secondary" onClick={() => window.print()}><Printer className="size-4" />Print / Save as PDF</button>
        <button className="kb-btn kb-btn-ghost" onClick={() => setPreview(true)}><Eye className="size-4" />Open proof view</button>
        <a className="kb-btn kb-btn-secondary" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />Open verification page</a>
        <button className="kb-btn kb-btn-ghost" onClick={() => currentProof && downloadQrPng(document.querySelector<SVGSVGElement>("#proof-card [data-proof-qr] svg"), displayProofId(currentProof.id))}><Download className="size-4" />Download QR (PNG)</button>
      </div>
      <ShareSettings />
      {fallback && (
        <div className="no-print kb-card p-3">
          <label htmlFor="copy-fallback" className="text-sm font-medium">Select and copy:</label>
          <textarea id="copy-fallback" readOnly className="kb-input mt-1 min-h-20 text-sm" value={fallback} onFocus={(e) => e.currentTarget.select()} autoFocus />
        </div>
      )}
      <ProofCard state={state} id="proof-card" proof={currentProof} />
      <Modal open={preview} onClose={() => setPreview(false)} title="Proof view (as an employer sees it)" wide>
        <ProofCard state={state} readOnly proof={currentProof} />
      </Modal>
    </div>
  );
}

/* ---------------- Tracker ---------------- */

interface Row extends Mentee { live?: boolean }

function statusOf(m: Mentee): Mentee["status"] {
  if (m.progress >= 100 && m.status === "Completed") return "Completed";
  if (m.needsSupport || m.overdue) return "At risk";
  return m.status === "Completed" ? "Completed" : "Active";
}

function useRows(): Row[] {
  const { state } = useKB();
  return useMemo(() => {
    const rows: Row[] = state.mentees.map((m) => ({ ...m, status: statusOf(m) }));
    const p = state.currentProfile;
    if (p) {
      const ps = proofStats(state);
      const act = ps.active[0];
      const prog = act ? (act.milestones.filter((m) => state.milestoneProgress[act.id]?.[m.id]).length / act.milestones.length) * 100 : 100;
      const pend = ps.completed.some((s) => !state.endorsements[s.id]);
      const endorsement: EndorseState = pend ? "Awaiting" : ps.endorsed.length ? "Verified" : "None";
      const own = state.mentees.find((m) => m.id === `live-${p.id}`);
      rows.unshift({
        id: `live-${p.id}`, live: true, name: p.name, location: p.location, currentSprint: act?.title ?? "—", org: act?.org ?? "—",
        progress: Math.round(prog), status: own?.needsSupport ? "At risk" : act ? "Active" : "Completed",
        sprintsCompleted: ps.completed.length, avgRating: ps.avg, lastCheckIn: own?.lastCheckIn ?? "2026-11-24", nextCheckIn: own?.nextCheckIn ?? "2026-11-28",
        needsSupport: !!own?.needsSupport, overdue: false, endorsement, earnedKES: ps.earned, skills: p.skills,
        notes: own?.notes ?? [{ date: "2026-11-24", author: "Mentor", text: `Strong start on ${act?.title ?? "her sprints"}. Reminded to upload drafts before midpoint payout.` }],
      });
    }
    return rows;
  }, [state]);
}

const StatusChip = ({ s }: { s: Mentee["status"] }) => s === "At risk"
  ? <span className="kb-chip border-warning/40 bg-warning-soft font-semibold text-warning"><AlertTriangle className="size-3.5" />At risk</span>
  : s === "Completed" ? <span className="kb-chip border-verified/40 bg-verified-soft font-semibold text-verified"><CheckCircle2 className="size-3.5" />Completed</span>
  : <span className="kb-chip border-primary/30 bg-primary-soft font-semibold text-primary"><Hourglass className="size-3.5" />Active</span>;
const EndChip = ({ e }: { e: EndorseState }) => e === "Verified"
  ? <span className="kb-chip text-xs text-verified"><BadgeCheck className="size-3.5" />Verified</span>
  : e === "Awaiting" ? <span className="kb-chip text-xs text-warning"><Hourglass className="size-3.5" />Awaiting</span>
  : <span className="kb-chip text-xs text-muted-foreground">None</span>;

function Tile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="kb-card p-4"><div className={`font-heading text-xl font-extrabold sm:text-2xl ${tone ?? "text-primary"}`}>{value}</div><div className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</div></div>;
}

function Notes({ notes }: { notes: Note[] }) {
  if (!notes.length) return <p className="text-sm text-muted-foreground">No check-ins yet.</p>;
  return (
    <ol className="space-y-2 border-l-2 border-border pl-3">
      {notes.map((n, i) => <li key={i} className="text-sm"><span className="text-xs font-semibold text-muted-foreground">{n.date} · {n.author}</span><p className="break-words">{n.text}</p></li>)}
    </ol>
  );
}

function CheckInForm({ row, onDone }: { row: Row; onDone: () => void }) {
  const { set, logCheckIn } = useKB();
  const [text, setText] = useState(""); const [flag, setFlag] = useState(row.needsSupport); const [next, setNext] = useState(""); const [err, setErr] = useState("");
  const submit = () => {
    if (text.trim().length < 5) { setErr("Write a short note (5+ characters)."); return; }
    if (row.live) {
      // create a persistent mentee record for the live-linked talent the first time
      set((s) => s.mentees.some((m) => m.id === row.id) ? s : { ...s, mentees: [...s.mentees, { ...row, live: undefined } as Mentee] });
    }
    logCheckIn(row.id, text.trim(), flag, next); onDone();
  };
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div><label htmlFor="ci-text" className="text-sm font-medium">Note</label><textarea id="ci-text" className="kb-input mt-1 min-h-24" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Finished milestone 2, needs feedback on drafts." /></div>
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5 accent-[var(--warning)]" checked={flag} onChange={(e) => setFlag(e.target.checked)} />Needs support (marks as At risk)</label>
      <div><label htmlFor="ci-next" className="text-sm font-medium">Next check-in</label><input id="ci-next" type="date" className="kb-input mt-1" value={next} min={TODAY()} onChange={(e) => setNext(e.target.value)} /></div>
      {err && <p className="flex items-center gap-1 text-sm text-destructive" role="alert"><AlertTriangle className="size-4" />{err}</p>}
      <button type="submit" className="kb-btn kb-btn-primary w-full"><MessageSquarePlus className="size-4" />Save check-in</button>
    </form>
  );
}

function MenteeProof({ row }: { row: Row }) {
  const { state, currentProof } = useKB();
  const seeded = useMemo(() => row.live || row.sprintsCompleted < 1 ? null : issueFromSnapshot({
    v: 1, n: row.name, loc: row.location, iat: row.lastCheckIn || "2026-11-01",
    sp: [{ id: `${row.id}-done`, t: `${row.sprintsCompleted} completed micro-sprint${row.sprintsCompleted > 1 ? "s" : ""}`, o: row.org === "—" ? "KaziBridge partners" : row.org, ot: "B", d: 0, kes: row.earnedKES, c: row.lastCheckIn, sk: row.skills.slice(0, 6),
      ...(row.endorsement === "Verified" && row.avgRating ? { e: { by: AMINA_MENTOR, org: "KaziBridge mentor network", r: Math.round(row.avgRating), dt: row.lastCheckIn, role: "mentor" as const } } : {}) }],
  }), [row]);
  if (row.live && state.currentProfile) return <ProofCard state={state} readOnly proof={currentProof} />;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary font-heading text-lg font-extrabold text-primary-foreground">{row.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
        <div className="min-w-0"><h3 className="break-words">{row.name}</h3><p className="text-sm text-muted-foreground"><MapPin className="mr-1 inline size-4" />{row.location}</p></div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted p-3"><div className="font-heading font-bold">{row.sprintsCompleted}</div><div className="text-xs text-muted-foreground">Sprints</div></div>
        <div className="rounded-xl bg-muted p-3"><div className="font-heading font-bold">{row.avgRating ? row.avgRating.toFixed(1) : "—"}</div><div className="text-xs text-muted-foreground">Avg rating</div></div>
        <div className="rounded-xl bg-muted p-3"><div className="font-heading font-bold">{formatKES(row.earnedKES)}</div><div className="text-xs text-muted-foreground">Earned</div></div>
      </div>
      <div className="flex flex-wrap gap-1.5">{row.skills.map((k) => <span key={k} className={`kb-chip ${row.endorsement === "Verified" ? "bg-verified-soft text-verified" : ""}`}>{row.endorsement === "Verified" && <Check className="size-3.5" />}{k}</span>)}</div>
      {seeded && <div className="max-w-xs"><ProofQR proof={seeded} /></div>}
      <div><h4 className="mb-2 font-heading font-semibold">Check-in notes</h4><Notes notes={row.notes} /></div>
    </div>
  );
}

function TrackerSection() {
  const { state, setTab, toggleAction, addAction } = useKB();
  const rows = useRows();
  const role = state.role;
  const [viewing, setViewing] = useState<Row | null>(null);
  const [logging, setLogging] = useState<Row | null>(null);
  const [newAction, setNewAction] = useState("");

  const live = rows.find((r) => r.live);
  const ps = proofStats(state);
  const visible = role === "talent" ? (live ? [live] : []) : role === "business" ? rows.filter((r) => r.live || r.org !== "—") : rows;
  const inProgress = rows.filter((r) => r.status !== "Completed" && r.currentSprint !== "—").length;
  const completed = rows.reduce((a, r) => a + r.sprintsCompleted, 0);
  const rated = rows.filter((r) => r.avgRating > 0);
  const avg = rated.length ? rated.reduce((a, r) => a + r.avgRating, 0) / rated.length : 0;
  const paid = SEED_PAID_OUT + ps.earned;
  const atRisk = rows.filter((r) => r.status === "At risk").length;
  const chart = SEED_WEEKLY.map((w, i) => i === SEED_WEEKLY.length - 1 ? { ...w, completed: w.completed + state.completedThisWeek } : w);

  const activeList = state.sprints.filter((s) => state.applications[s.id] === "accepted" || state.applications[s.id] === "in_progress");
  const doneList = state.sprints.filter((s) => state.applications[s.id] === "completed");
  const talentName = state.currentProfile?.name ?? "Talent";

  if (role === "talent") return (
    <div className="space-y-6">
      {!live ? (
        <div className="kb-card flex flex-col items-center p-8 text-center"><Users className="size-8 text-primary" /><h3 className="mt-3">Load a profile to see your mentor tracker</h3><div className="mt-4"><LoadSampleButton /></div></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="kb-card space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3>My progress</h3><StatusChip s={live.status} /></div>
            <p className="text-sm text-muted-foreground">Current sprint: <strong className="text-foreground">{live.currentSprint}</strong></p>
            <ProgressBar value={live.progress} label="My sprint progress" />
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl bg-muted p-3"><div className="font-heading font-bold">{live.sprintsCompleted}</div>Completed</div>
              <div className="rounded-xl bg-muted p-3"><div className="font-heading font-bold">{live.avgRating ? live.avgRating.toFixed(1) : "—"}</div>Avg rating</div>
              <div className="rounded-xl bg-muted p-3"><EndChip e={live.endorsement} /></div>
            </div>
            <p className="text-sm"><Users className="mr-1 inline size-4 text-primary" />Your mentor: <strong>{AMINA_MENTOR}</strong> · next check-in {live.nextCheckIn}</p>
          </div>
          <div className="kb-card p-5 sm:p-6"><h3 className="mb-3">Check-in notes (read-only)</h3><Notes notes={live.notes} /></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <section aria-label="Tracker stats" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Tile label="Active mentees" value={String(rows.filter((r) => r.status !== "Completed").length)} />
        <Tile label="Sprints in progress" value={String(inProgress)} />
        <Tile label="Sprints completed" value={String(completed)} tone="text-verified" />
        <Tile label="Completion rate" value={`${Math.round((completed / Math.max(1, completed + inProgress)) * 100)}%`} tone="text-verified" />
        <Tile label="Avg endorsement" value={avg ? `${avg.toFixed(1)}★` : "—"} />
        <Tile label="KES paid to talent" value={formatKES(paid)} />
        <Tile label="At risk" value={String(atRisk)} tone="text-warning" />
      </section>

      <section>
        <SectionTitle title={role === "business" ? "Talent on your sprints" : "Youth progress"} sub={role === "business" ? "Milestone progress for talent working on your sprints." : "Full roster with live milestone progress and check-ins."} />
        <div className="kb-card hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>{["Name", "Current sprint", "Progress", "Status", "Done", "Endorsement", "Last check-in", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><div className="font-semibold">{r.name}{r.live && <span className="kb-chip ml-2 py-0 text-xs text-primary">Live</span>}</div><div className="text-xs text-muted-foreground">{r.location}</div></td>
                  <td className="max-w-56 px-4 py-3"><div className="break-words">{r.currentSprint}</div><div className="text-xs text-muted-foreground">{r.org}</div></td>
                  <td className="w-36 px-4 py-3"><ProgressBar value={r.progress} label={`${r.name} progress`} /><span className="text-xs text-muted-foreground">{r.progress}%</span></td>
                  <td className="px-4 py-3"><StatusChip s={r.status} /></td>
                  <td className="px-4 py-3">{r.sprintsCompleted}</td>
                  <td className="px-4 py-3"><EndChip e={r.endorsement} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.lastCheckIn}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <button className="kb-btn kb-btn-ghost px-2 text-sm" onClick={() => setViewing(r)}><Eye className="size-4" />View proof</button>
                    {role === "mentor" && <button className="kb-btn kb-btn-secondary px-2 text-sm" onClick={() => setLogging(r)}><MessageSquarePlus className="size-4" />Log</button>}
                    {role === "business" && r.endorsement === "Awaiting" && <button className="kb-btn kb-btn-verified px-2 text-sm" onClick={() => setTab("creator")}><BadgeCheck className="size-4" />Endorse</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="grid gap-3 md:grid-cols-2 lg:hidden">
          {visible.map((r) => (
            <li key={r.id} className="kb-card space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><div className="break-words font-semibold">{r.name}{r.live && <span className="kb-chip ml-2 py-0 text-xs text-primary">Live</span>}</div><div className="text-xs text-muted-foreground">{r.location}</div></div><StatusChip s={r.status} /></div>
              <p className="break-words text-sm">{r.currentSprint} <span className="text-muted-foreground">· {r.org}</span></p>
              <ProgressBar value={r.progress} label={`${r.name} progress`} />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{r.sprintsCompleted} done</span><EndChip e={r.endorsement} /><span>Last check-in {r.lastCheckIn}</span></div>
              <div className="flex flex-wrap gap-2">
                <button className="kb-btn kb-btn-ghost flex-1 text-sm" onClick={() => setViewing(r)}><Eye className="size-4" />View proof</button>
                {role === "mentor" && <button className="kb-btn kb-btn-secondary flex-1 text-sm" onClick={() => setLogging(r)}><MessageSquarePlus className="size-4" />Log check-in</button>}
                {role === "business" && r.endorsement === "Awaiting" && <button className="kb-btn kb-btn-verified flex-1 text-sm" onClick={() => setTab("creator")}><BadgeCheck className="size-4" />Endorse</button>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {[{ t: "Active sprints", list: activeList, tone: "text-primary", label: "In progress" }, { t: "Completed sprints", list: doneList, tone: "text-verified", label: "Completed" }].map((g) => (
          <div key={g.t} className="kb-card p-5">
            <h3>{g.t} <span className="text-sm font-normal text-muted-foreground">({g.list.length})</span></h3>
            {g.list.length ? (
              <ul className="mt-3 divide-y divide-border">
                {g.list.map((s) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"><div className="min-w-0"><div className="break-words font-medium">{s.title}</div><div className="text-xs text-muted-foreground">{talentName} · {s.org} · {s.days} days</div></div><span className={`flex items-center gap-1 text-xs font-semibold ${g.tone}`}>{g.label === "Completed" ? <CheckCircle2 className="size-3.5" /> : <Hourglass className="size-3.5" />}{g.label === "Completed" && !state.endorsements[s.id] ? "Awaiting endorsement" : g.label}</span></li>)}
              </ul>
            ) : <p className="mt-3 text-sm text-muted-foreground">Nothing here yet.</p>}
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="kb-card p-5 lg:col-span-3">
          <h3>Sprints completed per week</h3>
          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis yAxisId="l" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis yAxisId="r" orientation="right" domain={[0, 5]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Legend />
                <Bar yAxisId="l" dataKey="completed" name="Completed" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Line yAxisId="r" type="monotone" dataKey="rating" name="Avg rating" stroke="var(--verified)" strokeWidth={3} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="kb-card p-5 lg:col-span-2">
          <h3>Coordinator action items</h3>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = newAction.trim(); if (v) { addAction(v); setNewAction(""); } }}>
            <label htmlFor="new-action" className="sr-only">New action item</label>
            <input id="new-action" className="kb-input" placeholder="Add action item" value={newAction} onChange={(e) => setNewAction(e.target.value)} />
            <button className="kb-btn kb-btn-primary shrink-0 px-3" type="submit" aria-label="Add action item"><Plus className="size-4" /></button>
          </form>
          <ul className="mt-3 space-y-1">
            {state.actions.map((a) => (
              <li key={a.id}><label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-muted">
                <input type="checkbox" className="size-5 shrink-0 accent-[var(--verified)]" checked={a.done} onChange={() => toggleAction(a.id)} />
                <span className={`min-w-0 break-words text-sm ${a.done ? "text-muted-foreground line-through" : ""}`}>{a.text}</span>
              </label></li>
            ))}
          </ul>
        </div>
      </section>

      {role === "mentor" && (
        <section>
          <SectionTitle title="Support & check-in notes" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <div key={r.id} className="kb-card flex flex-col p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{r.name}</span><StatusChip s={r.status} /></div>
                <Notes notes={r.notes.slice(0, 3)} />
                <button className="kb-btn kb-btn-secondary mt-3 w-full text-sm" onClick={() => setLogging(r)}><MessageSquarePlus className="size-4" />Log check-in</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `Proof: ${viewing.name}` : ""} wide>{viewing && <MenteeProof row={viewing} />}</Modal>
      <Modal open={!!logging} onClose={() => setLogging(null)} title={logging ? `Log check-in: ${logging.name}` : ""}>{logging && <CheckInForm row={logging} onDone={() => setLogging(null)} />}</Modal>
    </div>
  );
}

export function Proof() {
  const { state, setSegment } = useKB();
  const seg = state.proofSegment;
  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0"><h2>Proof &amp; Mentor</h2><p className="mt-1 text-muted-foreground">Verified proof of work and the support network behind it.</p></div>
        <div role="group" aria-label="Section" className="flex rounded-xl border border-border bg-card p-1">
          {([["proof", "Proof-of-Work"], ["tracker", "Mentor & Coordinator Tracker"]] as const).map(([id, l]) => (
            <button key={id} aria-pressed={seg === id} onClick={() => setSegment(id)} className={`kb-btn min-h-11 px-3 text-sm ${seg === id ? "kb-btn-primary" : "kb-btn-ghost"}`}>{l}</button>
          ))}
        </div>
      </div>
      {seg === "proof" ? <><ProofSection /><div className="no-print"><VerifyIdInput /></div></> : <TrackerSection />}
    </div>
  );
}
