import { Info } from "lucide-react";

const PROTO = [
  "The QR link carries the proof data and a SHA-256 fingerprint. We recompute the fingerprint to detect edits, so a changed amount, name or rating fails the check.",
  "The record is also saved in this browser. There is no server, so scanning on a different device confirms the data is unaltered but cannot confirm who issued it.",
  "Anyone could still generate a self-consistent fake link, because the fingerprint is not secret.",
];
const PROD = [
  "Proofs are issued and digitally signed server-side (e.g. Ed25519 or HMAC with a private key), and the QR carries only the Proof ID.",
  "A public registry confirms the issuer, shows live status (valid, revoked, superseded) and supports revocation.",
  "Endorsers confirm via a one-time SMS or email link (and USSD for low-data users), and each issuance is written to an audit log.",
];

export function ProofScopeNote() {
  const cols = (
    <div className="mt-3 grid gap-4 md:grid-cols-2">
      {[["In this prototype", PROTO], ["In production", PROD]].map(([t, list]) => (
        <div key={t as string} className="min-w-0"><h4 className="font-heading text-sm font-bold">{t as string}</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{(list as string[]).map((x) => <li key={x}>{x}</li>)}</ul></div>
      ))}
    </div>
  );
  return (
    <section className="rounded-2xl border border-verified/30 bg-verified-soft p-4 sm:p-5">
      <details className="group md:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-heading font-bold"><Info className="size-5 text-verified" />How verification works here</summary>
        {cols}
      </details>
      <div className="hidden md:block">
        <h3 className="flex items-center gap-2 text-base"><Info className="size-5 text-verified" />How verification works here</h3>
        {cols}
      </div>
    </section>
  );
}
