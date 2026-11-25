import { Component, useEffect, useState, type ReactNode } from "react";
import { Star, X } from "lucide-react";

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className={`kb-card max-h-[90dvh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-2xl sm:p-6 ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="min-w-0 break-words text-lg">{title}</h3>
          <button className="kb-btn kb-btn-ghost -mr-2 -mt-2 px-2" onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export class TabBoundary extends Component<{ children: ReactNode; name: string }, { err: boolean }> {
  override state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  override componentDidCatch(e: unknown) { console.error(e); }
  override render() {
    if (this.state.err) return (
      <div className="kb-card p-8 text-center">
        <h3>The {this.props.name} section hit a snag</h3>
        <p className="mt-2 text-muted-foreground">Your data is safe. Try again.</p>
        <button className="kb-btn kb-btn-primary mt-4" onClick={() => this.setState({ err: false })}>Retry</button>
      </div>
    );
    return this.props.children;
  }
}

export function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(target);
  useEffect(() => {
    let reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* */ }
    if (reduce) { setV(target); return; }
    let raf = 0; const start = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - start) / ms); setV(target * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    setV(0); raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function MatchRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2; const c = 2 * Math.PI * r;
  const tone = score >= 75 ? "text-verified" : score >= 50 ? "text-primary" : "text-warning";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Match score ${score} percent`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="6" className="fill-none stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="6" strokeLinecap="round" className={`fill-none stroke-current ${tone}`} strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset 400ms" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-sm font-bold">{score}%</span>
    </div>
  );
}

export function Stars({ value, onChange, size = 16 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" role={onChange ? "radiogroup" : "img"} aria-label={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star style={{ width: size, height: size }} className={n <= value ? "fill-warning text-warning" : "text-border"} />;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="flex size-11 items-center justify-center rounded-lg hover:bg-muted" onClick={() => onChange(n)}>{icon}</button>
        ) : <span key={n}>{icon}</span>;
      })}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}>
      <div className={`h-full rounded-full ${value >= 100 ? "bg-verified" : "bg-primary"}`} style={{ width: `${Math.min(100, value)}%`, transition: "width 200ms" }} />
    </div>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch { /* fallback */ }
  try {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); document.body.removeChild(ta); return ok;
  } catch { return false; }
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0"><h2 className="break-words">{title}</h2>{sub && <p className="mt-1 text-muted-foreground">{sub}</p>}</div>
      {right}
    </div>
  );
}
