import { useEffect, useState } from "react";
import { parseVerifyInput } from "./proof";

const NAV = "kb-proof-nav";
export interface ProofRoute { proof: string; d: string | null }

function read(): ProofRoute | null {
  try {
    const q = new URLSearchParams(window.location.search).get("proof");
    if (!q) return null;
    const h = window.location.hash.replace(/^#/, "");
    const d = new URLSearchParams(h).get("d");
    return { proof: q, d };
  } catch { return null; }
}

/** Reads ?proof=…#d=… on start and on hashchange / popstate / in-app navigation. */
export function useProofRoute(): ProofRoute | null {
  const [r, setR] = useState<ProofRoute | null>(null);
  useEffect(() => {
    const upd = () => setR(read());
    upd();
    window.addEventListener("hashchange", upd); window.addEventListener("popstate", upd); window.addEventListener(NAV, upd);
    return () => { window.removeEventListener("hashchange", upd); window.removeEventListener("popstate", upd); window.removeEventListener(NAV, upd); };
  }, []);
  return r;
}

/** Opens the verification view for a pasted ID or URL. Returns false when nothing usable was found. */
export function openVerification(input: string): boolean {
  const p = parseVerifyInput(input);
  if (!p) return false;
  try {
    window.history.pushState(null, "", `${window.location.pathname}?proof=${encodeURIComponent(p.proof)}${p.d ? `#d=${p.d}` : ""}`);
    window.dispatchEvent(new Event(NAV));
    window.scrollTo({ top: 0 });
  } catch { return false; }
  return true;
}

export function closeVerification() {
  try {
    window.history.replaceState(null, "", window.location.pathname);
    window.dispatchEvent(new Event(NAV));
    window.scrollTo({ top: 0 });
  } catch { /* ignore */ }
}
