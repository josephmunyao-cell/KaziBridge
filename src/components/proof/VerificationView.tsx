import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Building2, CalendarDays, Check, Hourglass, Link2, MapPin, Printer, Quote, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { displayProofId, encodePayload, normalizeProofId, verifyProof, type ProofSnapshot } from "@/lib/proof";
import { fetchProof } from "@/lib/proof-cloud";
import { closeVerification, type ProofRoute } from "@/lib/proof-route";
import { formatKES, useKB } from "@/lib/store";
import { Stars, copyText } from "@/components/kb/common";
import { ProofIdChip } from "./ProofIdChip";
import { VerificationStatusBanner } from "./VerificationStatusBanner";
import { ProofScopeNote } from "./ProofScopeNote";
import { VerifyIdInput } from "./VerifyIdInput";

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

function Details({ s, hash, id }: { s: ProofSnapshot; hash: string; id: string }) {
  const [full, setFull] = useState(false);
  const sp = Array.isArray(s.sp) ? s.sp : [];
  const verified = Array.from(new Set(sp.filter((x) => x.e).flatMap((x) => x.sk ?? [])));
  const pending = Array.from(new Set(sp.filter((x) => !x.e).flatMap((x) => x.sk ?? []))).filter((k) => !verified.includes(k));
  const days = sp.reduce((a, x) => a + (Number(x.d) || 0), 0);
  const kes = sp.reduce((a, x) => a + (Number(x.kes) || 0), 0);
  return (
    <article id="proof-card" className="kb-card overflow-hidden rounded-2xl">
      <header className="bg-primary p-5 text-primary-foreground sm:p-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground font-heading text-lg font-extrabold text-primary">{initials(String(s.n))}</div>
          <div className="min-w-0">
            <h2 className="break-words text-2xl">{String(s.n)}</h2>
            <p className="flex items-center gap-1 text-sm opacity-90"><MapPin className="size-4" />{String(s.loc)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm"><ProofIdChip id={id} onDark /><span className="opacity-90">Issued {String(s.iat)}</span></div>
        <p className="mt-2 break-all font-mono text-xs opacity-90">Fingerprint (SHA-256): {full ? hash : `${hash.slice(0, 12)}…`}{" "}
          <button type="button" className="no-print min-h-11 px-1 underline" onClick={() => setFull((f) => !f)}>{full ? "Hide" : "Show full hash"}</button></p>
      </header>
      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[["Sprints completed", String(sp.length)], ["Total days", days ? String(days) : "—"], ["Total earned", formatKES(kes)]].map(([l, v]) => (
            <div key={l} className="min-w-0 rounded-xl bg-muted p-3"><div className="whitespace-nowrap font-heading text-sm font-bold sm:text-xl">{v}</div><div className="text-xs text-muted-foreground">{l}</div></div>
          ))}
        </div>
        {(verified.length > 0 || pending.length > 0) && (
          <div>
            <h3 className="text-base">Skills</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {verified.map((k) => <span key={k} className="kb-chip border-verified/40 bg-verified-soft text-verified"><Check className="size-3.5" />{k}</span>)}
              {pending.map((k) => <span key={k} className="kb-chip border-warning/40 bg-warning-soft text-warning"><Hourglass className="size-3.5" />{k} · Demonstrated, awaiting endorsement</span>)}
            </div>
          </div>
        )}
        <div>
          <h3 className="text-base">Completed sprints</h3>
          <ul className="mt-2 space-y-3">
            {sp.map((x) => (
              <li key={x.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="break-words font-heading font-semibold">{x.t}</h4>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><Building2 className="size-4" />{x.o}
                      <span className={`kb-chip py-0 text-xs ${x.ot === "N" ? "bg-verified-soft text-verified" : ""}`}>{x.ot === "N" ? "NGO" : "Business"}</span></p>
                  </div>
                  {x.e ? <span className="kb-chip border-verified/40 bg-verified-soft font-semibold text-verified"><BadgeCheck className="size-3.5" />Endorsed</span>
                    : <span className="kb-chip border-warning/40 bg-warning-soft font-semibold text-warning"><Hourglass className="size-3.5" />Awaiting endorsement</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {x.d > 0 && <span className="flex items-center gap-1"><CalendarDays className="size-4" />{x.d} days</span>}
                  {x.c && <span>Completed {x.c}</span>}
                  <span className="flex items-center gap-1"><Wallet className="size-4" />{formatKES(Number(x.kes) || 0)}</span>
                </div>
                {x.e && (
                  <blockquote className="mt-3 rounded-xl border border-verified/30 bg-verified-soft p-3">
                    {x.e.q && <p className="break-words text-sm"><Quote className="mr-1 inline size-3.5 text-verified" />"{x.e.q}"</p>}
                    <footer className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span><strong className="text-foreground">{x.e.by}</strong>, {x.e.org} · {x.e.role === "mentor" ? "Mentor" : "Supervisor"} · {x.e.dt}</span>
                      <Stars value={Number(x.e.r) || 0} size={13} />
                    </footer>
                  </blockquote>
                )}
              </li>
            ))}
          </ul>
        </div>
        {s.m && <p className="rounded-xl bg-muted p-3 text-sm"><strong>{s.m.by}</strong>, {s.m.org} ({s.m.dt}): {s.m.note}</p>}
        <p className="text-xs text-muted-foreground">Verification fingerprint: {hash.slice(0, 12)}. KaziBridge prototype verification.</p>
      </div>
    </article>
  );
}

export function VerificationView({ route }: { route: ProofRoute }) {
  const { state, hydrated } = useKB();
  const [online, setOnline] = useState<{ id: string; d: string | null } | null>(null);
  const nid = normalizeProofId(route.proof);
  const needsLookup = !route.d && !!nid && hydrated && !state.proofRecords[nid];
  useEffect(() => {
    if (!needsLookup || !nid || online?.id === nid) return;
    let live = true;
    fetchProof(nid).then((p) => { if (live) setOnline({ id: nid, d: p ? encodePayload(p.snapshot, p.hash) : null }); }).catch(() => { if (live) setOnline({ id: nid, d: null }); });
    return () => { live = false; };
  }, [needsLookup, nid, online?.id]);
  const looking = needsLookup && online?.id !== nid;
  const d = route.d ?? (online?.id === nid ? online.d : null);
  const r = useMemo(() => {
    const res = verifyProof(route.proof, d, state.proofRecords);
    return !route.d && d && res.status === "integrity" ? { ...res, status: "verified" as const } : res;
  }, [route, d, state.proofRecords]);
  const link = typeof window !== "undefined" ? window.location.href : "";
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <span className="flex min-w-0 items-center gap-2 font-heading font-extrabold text-primary"><ShieldCheck className="size-6 shrink-0" /><span className="truncate">KaziBridge · Proof verification</span></span>
          <button type="button" className="kb-btn kb-btn-ghost shrink-0 px-2 text-sm" onClick={closeVerification}><ArrowLeft className="size-4" /><span className="hidden sm:inline">Back to KaziBridge</span><span className="sm:hidden">Back</span></button>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-4xl flex-1 space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {!hydrated || looking ? <div className="kb-shimmer h-24 rounded-2xl" aria-label="Checking proof" /> : (
          <>
            <div className="no-print"><VerificationStatusBanner r={r} /></div>
            {r.status === "superseded" && r.supersededBy && <p className="no-print text-sm">Newer proof: <code className="font-mono font-semibold">{displayProofId(r.supersededBy)}</code></p>}
            {r.snapshot && r.hash && r.id && r.status !== "failed" && <Details s={r.snapshot} hash={r.hash} id={r.id} />}
            {r.status === "failed" && r.snapshot && <p className="text-sm text-muted-foreground">The proof details are hidden because they can't be trusted.</p>}
            {r.snapshot && r.status !== "failed" && (
              <div className="no-print flex flex-wrap gap-2">
                <button type="button" className="kb-btn kb-btn-secondary" onClick={() => window.print()}><Printer className="size-4" />Print this verification</button>
                <button type="button" className="kb-btn kb-btn-secondary" onClick={async () => { if (await copyText(link)) toast.success("Verification link copied"); else toast.error("Couldn't copy automatically"); }}><Link2 className="size-4" />Copy verification link</button>
              </div>
            )}
            <div className="no-print"><VerifyIdInput id="verify-another" /></div>
            <div className="no-print"><ProofScopeNote /></div>
            <button type="button" className="no-print kb-btn kb-btn-primary w-full sm:w-auto" onClick={closeVerification}><ArrowLeft className="size-4" />Back to KaziBridge</button>
          </>
        )}
      </main>
    </div>
  );
}
