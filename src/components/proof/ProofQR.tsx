import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { buildShortVerifyUrl, buildVerifyUrl, defaultBaseUrl, isPrivateBase, type IssuedProof } from "@/lib/proof";
import { useKB } from "@/lib/store";

export function useVerifyUrl(p: Pick<IssuedProof, "id" | "snapshot" | "hash"> | null) {
  const { state } = useKB();
  return p ? buildVerifyUrl(state.verifyBaseUrl || defaultBaseUrl(), p) : "";
}

export function useShortVerifyUrl(id: string | null) {
  const { state } = useKB();
  return id ? buildShortVerifyUrl(state.verifyBaseUrl || defaultBaseUrl(), id) : "";
}

export function downloadQrPng(svg: SVGSVGElement | null, name: string) {
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

/** Clean QR block: only the heading and the code. */
export function ProofQR({ proof }: { proof: IssuedProof }) {
  const url = useShortVerifyUrl(proof.id);
  return (
    <div data-proof-qr className="proof-qr mx-auto h-fit w-fit max-w-full self-start rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-4">
      <p className="mb-3 text-center font-heading text-sm font-semibold text-[#0F172A]">Scan to verify</p>
      <QRCodeSVG value={url} size={176} level="M" marginSize={4} fgColor="#0F172A" bgColor="#FFFFFF" role="img" aria-label="QR code to verify this proof-of-work" className="block size-36 max-w-full md:size-40 2xl:size-44 print:size-[3.5cm]" />
    </div>
  );
}

export function ShareSettings() {
  const { state, setVerifyBaseUrl } = useKB();
  const base = state.verifyBaseUrl || defaultBaseUrl();
  const [draft, setDraft] = useState(base);
  return (
    <details className="no-print group text-sm">
      <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 text-muted-foreground"><ChevronDown className="size-4 transition-transform group-open:rotate-180" />Share settings</summary>
      <div className="mt-1 max-w-md space-y-2">
        {isPrivateBase(base) && <p className="flex gap-1.5 rounded-xl bg-warning-soft p-2 text-xs text-warning"><AlertTriangle className="mt-0.5 size-4 shrink-0" />Phones can't open localhost. Use the published Lovable URL for scanning.</p>}
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); const v = draft.trim(); try { if (v) new URL(v); setVerifyBaseUrl(v); toast.success("Verification base URL saved"); } catch { toast.error("Enter a full URL starting with https://"); } }}>
          <label htmlFor="verify-base" className="text-xs font-medium">Verification link base URL</label>
          <input id="verify-base" className="kb-input text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://your-app.lovable.app/" />
          <button type="submit" className="kb-btn kb-btn-secondary text-sm">Save base URL</button>
        </form>
      </div>
    </details>
  );
}
