import { History, SearchX, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";
import type { VerifyResult } from "@/lib/proof";

const MAP: Record<VerifyResult["status"], { icon: LucideIcon; title: string; text: string; cls: string }> = {
  verified: { icon: ShieldCheck, title: "Verified in this prototype", text: "The proof data is unaltered and this Proof ID is in the KaziBridge proof registry.", cls: "bg-verified text-verified-foreground border-verified" },
  integrity: { icon: ShieldCheck, title: "Integrity check passed (link snapshot)", text: "The proof data in this link is internally consistent. A production registry would confirm the issuer.", cls: "bg-verified-soft text-foreground border-verified border-2" },
  superseded: { icon: History, title: "Superseded", text: "This Proof ID is genuine, but a newer proof exists for this person.", cls: "bg-warning-soft text-foreground border-warning border-2" },
  failed: { icon: ShieldAlert, title: "Verification failed", text: "This proof data was altered or is not a valid KaziBridge proof.", cls: "bg-destructive/10 text-foreground border-destructive border-2" },
  invalid: { icon: ShieldAlert, title: "Invalid or unreadable proof link", text: "This link is damaged or is not a KaziBridge proof link. Check the link or enter the Proof ID below.", cls: "bg-destructive/10 text-foreground border-destructive border-2" },
  notfound: { icon: SearchX, title: "Proof not found", text: "Only a Proof ID was given and it isn't in this browser's registry. Ask for the full verification link or QR code.", cls: "bg-muted text-foreground border-border border-2" },
};

export function VerificationStatusBanner({ r }: { r: VerifyResult }) {
  const m = MAP[r.status]; const Icon = m.icon;
  const tone = r.status === "verified" ? "" : r.status === "integrity" ? "text-verified" : r.status === "superseded" ? "text-warning" : r.status === "notfound" ? "text-muted-foreground" : "text-destructive";
  return (
    <div role="status" data-testid="verify-status" className={`flex gap-3 rounded-2xl border p-4 sm:p-5 ${m.cls}`}>
      <Icon className={`mt-0.5 size-7 shrink-0 ${tone}`} aria-hidden />
      <div className="min-w-0">
        <p className="font-heading text-lg font-bold">{m.title}</p>
        <p className="mt-0.5 text-sm">{m.text}</p>
        {r.reason && (r.status === "failed" || r.status === "invalid") && <p className="mt-1 text-xs opacity-90">Detail: {r.reason}</p>}
      </div>
    </div>
  );
}
