import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, Download, ExternalLink, Link2, ScanLine, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { buildVerifyUrl, defaultBaseUrl, displayProofId, isPrivateBase, type IssuedProof } from "@/lib/proof";
import { useKB } from "@/lib/store";
import { copyText } from "@/components/kb/common";

export function useVerifyUrl(p: Pick<IssuedProof, "id" | "snapshot" | "hash"> | null) {
  const { state } = useKB();
  return p ? buildVerifyUrl(state.verifyBaseUrl || defaultBaseUrl(), p) : "";
}

function downloadPng(svg: SVGSVGElement | null, name: string) {
  try {
    if (!svg) throw new Error("no svg");
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const size = 768;
    img.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = size; c.height = size;
        const ctx = c.getContext("2d"); if (!ctx) throw new Error("no ctx");
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size, size); ctx.drawImage(img, 0, 0, size, size);
        c.toBlob((b) => {
          if (!b) { toast.error("Couldn't create the QR image"); return; }
          const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `${name}.png`; a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
          toast.success("QR code downloaded");
        }, "image/png");
      } catch { toast.error("Couldn't create the QR image"); }
    };
    img.onerror = () => toast.error("Couldn't create the QR image");
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  } catch { toast.error("Couldn't create the QR image"); }
}

export function ProofQR({ proof, actions = true }: { proof: IssuedProof; actions?: boolean }) {
  const { state, setVerifyBaseUrl } = useKB();
  const url = useVerifyUrl(proof);
  const wrap = useRef<HTMLDivElement>(null);
  const base = state.verifyBaseUrl || defaultBaseUrl();
  const [draft, setDraft] = useState(base);
  const local = isPrivateBase(base);
  return (
    <div className="min-w-0 space-y-3 rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 font-heading text-sm font-bold"><ScanLine className="size-4 text-primary" />Scan to verify</p>
      <div ref={wrap} className="mx-auto w-fit rounded-xl bg-white p-1">
        <QRCodeSVG value={url} size={176} level="M" marginSize={4} fgColor="#0F172A" bgColor="#FFFFFF" title={`Verification QR for ${displayProofId(proof.id)}`} className="block size-44 print:size-[3cm]" />
      </div>
      <p className="text-center font-mono text-xs font-semibold">{displayProofId(proof.id)}</p>
      {proof.trimmed === 3 && <p className="text-xs text-muted-foreground">Showing the 3 most recent sprints in the QR; the full record stays in the app.</p>}
      <p className="hidden break-all text-[9px] leading-tight print:block">{url}</p>
      {actions && (
        <div className="no-print grid gap-2">
          <button type="button" className="kb-btn kb-btn-primary text-sm" onClick={async () => { if (await copyText(url)) toast.success("Verification link copied"); else toast.error("Couldn't copy automatically"); }}><Link2 className="size-4" />Copy verification link</button>
          <a className="kb-btn kb-btn-secondary text-sm" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />Open verification page</a>
          <button type="button" className="kb-btn kb-btn-ghost text-sm" onClick={() => downloadPng(wrap.current?.querySelector("svg") ?? null, displayProofId(proof.id))}><Download className="size-4" />Download QR (PNG)</button>
          {local && <p className="flex gap-1.5 rounded-xl bg-warning-soft p-2 text-xs text-warning"><AlertTriangle className="mt-0.5 size-4 shrink-0" />Phones can't open localhost. Use the published Lovable URL for scanning.</p>}
          <details className="text-sm">
            <summary className="flex min-h-11 cursor-pointer items-center gap-1.5 text-muted-foreground"><Settings2 className="size-4" />Advanced</summary>
            <form className="mt-1 space-y-2" onSubmit={(e) => { e.preventDefault(); const v = draft.trim(); try { if (v) new URL(v); setVerifyBaseUrl(v); toast.success("Verification base URL saved"); } catch { toast.error("Enter a full URL starting with https://"); } }}>
              <label htmlFor="verify-base" className="text-xs font-medium">Verification link base URL</label>
              <input id="verify-base" className="kb-input text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://your-app.lovable.app/" />
              <button type="submit" className="kb-btn kb-btn-secondary w-full text-sm">Save base URL</button>
            </form>
          </details>
        </div>
      )}
    </div>
  );
}
