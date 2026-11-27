import { Copy } from "lucide-react";
import { toast } from "sonner";
import { displayProofId } from "@/lib/proof";
import { copyText } from "@/components/kb/common";

export function ProofIdChip({ id, onDark }: { id: string; onDark?: boolean }) {
  const shown = displayProofId(id);
  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-full border pl-3 text-sm ${onDark ? "border-primary-foreground/40 bg-primary-foreground/15" : "border-border bg-muted"}`}>
      <span className="sr-only">Proof ID </span>
      <code className="min-w-0 break-all font-mono font-semibold tracking-wide">{shown}</code>
      <button type="button" className="no-print flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-foreground/10" aria-label="Copy Proof ID"
        onClick={async () => { if (await copyText(shown)) toast.success("Proof ID copied"); else toast.error(`Couldn't copy. Proof ID: ${shown}`); }}>
        <Copy className="size-4" />
      </button>
    </span>
  );
}
