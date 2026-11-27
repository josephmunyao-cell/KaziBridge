import { useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { openVerification } from "@/lib/proof-route";

export function VerifyIdInput({ compact, id = "verify-id" }: { compact?: boolean; id?: string }) {
  const [v, setV] = useState(""); const [err, setErr] = useState("");
  return (
    <form className={`min-w-0 ${compact ? "w-full sm:w-auto" : "kb-card p-4 sm:p-5"}`} onSubmit={(e) => { e.preventDefault(); if (openVerification(v)) { setV(""); setErr(""); } else setErr("That doesn't look like a KaziBridge Proof ID or verification link."); }}>
      <label htmlFor={id} className={compact ? "sr-only" : "font-heading font-bold"}>Verify a Proof ID</label>
      {!compact && <p className="mt-0.5 text-sm text-muted-foreground">Paste a Proof ID (e.g. KB-PRF-2611-7K3M-9QXD) or a full verification link.</p>}
      <div className={`flex gap-2 ${compact ? "" : "mt-2"}`}>
        <input id={id} className="kb-input min-w-0 text-sm" value={v} onChange={(e) => { setV(e.target.value); setErr(""); }} placeholder={compact ? "Verify a Proof ID or link" : "KB-PRF-… or https://…"} aria-invalid={!!err} />
        <button type="submit" className="kb-btn kb-btn-verified shrink-0 px-3 text-sm"><ShieldCheck className="size-4" />Verify</button>
      </div>
      {err && <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="size-3.5" />{err}</p>}
    </form>
  );
}
