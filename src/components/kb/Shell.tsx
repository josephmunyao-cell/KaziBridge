import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Briefcase, ChevronDown, Home, MoreVertical, PlusSquare, RotateCcw, ShieldCheck, User, UserPlus, X } from "lucide-react";
import { useKB, type Tab } from "@/lib/store";
import { AMINA, FAITH, SAMUEL } from "@/data/seed";
import { Modal } from "./common";

export const TABS: { id: Tab; label: string; short: string; icon: typeof Home }[] = [
  { id: "overview", label: "Overview", short: "Home", icon: Home },
  { id: "sprints", label: "Micro-Sprints", short: "Sprints", icon: Briefcase },
  { id: "creator", label: "Post & Endorse", short: "Post", icon: PlusSquare },
  { id: "proof", label: "Proof & Mentor", short: "Proof", icon: ShieldCheck },
];

function Logo() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-lg font-extrabold text-primary-foreground">K</div>
      <div className="min-w-0 leading-tight">
        <div className="font-heading text-lg font-extrabold">Kazi<span className="text-primary">Bridge</span></div>
        <div className="hidden truncate text-xs text-muted-foreground lg:block">Paid sprints · Verified proof</div>
      </div>
    </div>
  );
}

export function LoadSampleButton({ large, compact }: { large?: boolean; compact?: boolean }) {
  const { loadProfile, state } = useKB();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative flex" ref={ref}>
      <button className={`kb-btn kb-btn-primary rounded-r-none ${large ? "px-6 text-base sm:min-h-[52px]" : ""} ${compact ? "px-3 text-sm" : ""}`} onClick={() => loadProfile(AMINA)}>
        <User className="size-4 shrink-0" /> <span>{compact ? "Load Sample" : "Load Sample Profile"}</span>
      </button>
      <button className={`kb-btn kb-btn-primary rounded-l-none border-l border-primary-foreground/30 px-2 ${large ? "sm:min-h-[52px]" : ""}`} aria-label="Load another sample profile" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <ChevronDown className="size-4" />
      </button>
      {open && (
        <div className="kb-card absolute right-0 top-full z-50 mt-2 w-64 p-1.5 text-left" role="menu">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Load another sample</p>
          {[AMINA, SAMUEL, FAITH].map((p) => (
            <button key={p.id} role="menuitem" className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted" onClick={() => { loadProfile(p); setOpen(false); }}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{p.initials}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{p.name}</span><span className="block truncate text-xs text-muted-foreground">{p.location}</span></span>
              {state.currentProfile?.id === p.id && <span className="ml-auto text-xs font-semibold text-verified">Active</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { state, setTab, reset, set } = useKB();
  const [confirm, setConfirm] = useState(false);
  const [menu, setMenu] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, i: number) => {
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length; else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") n = 0; else if (e.key === "End") n = TABS.length - 1; else return;
    e.preventDefault(); setTab(TABS[n]!.id); tabRefs.current[n]?.focus();
  };

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <header className="no-print sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 xl:max-w-[1400px]">
          <button onClick={() => setTab("overview")} className="min-w-0 rounded-lg" aria-label="KaziBridge home"><Logo /></button>
          <nav className="hidden min-w-0 md:block" aria-label="Main">
            <div role="tablist" aria-label="Sections" className="flex items-center gap-1">
              {TABS.map((t, i) => {
                const active = state.activeTab === t.id;
                return (
                  <button key={t.id} ref={(el) => { tabRefs.current[i] = el; }} role="tab" id={`tab-${t.id}`} aria-selected={active} aria-controls="kb-panel" tabIndex={active ? 0 : -1}
                    onKeyDown={(e) => onKey(e, i)} onClick={() => setTab(t.id)}
                    className={`kb-btn px-3 text-sm lg:px-4 ${active ? "bg-primary-soft text-primary" : "kb-btn-ghost"}`}>
                    <t.icon className="size-4" /> <span className="hidden lg:inline">{t.label}</span><span className="lg:hidden">{t.short}</span>
                  </button>
                );
              })}
            </div>
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden md:block"><LoadSampleButton /></div>
            <div className="md:hidden"><LoadSampleButton compact /></div>
            <div className="relative">
              <button className="kb-btn kb-btn-ghost px-2" aria-label="More options" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><MoreVertical className="size-5" /></button>
              {menu && (
                <div className="kb-card absolute right-0 top-full z-50 mt-2 w-48 p-1.5">
                  <button className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-muted" onClick={() => { setMenu(false); setConfirm(true); }}><RotateCcw className="size-4" /> Reset Demo</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {!state.bannerDismissed && (
        <div className="no-print border-b border-border bg-primary-soft">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5 text-sm sm:px-6 lg:px-8 xl:max-w-[1400px]">
            <UserPlus className="size-4 shrink-0 text-primary" />
            <p className="min-w-0 flex-1 break-words"><strong>Judges:</strong> tap <strong>Load Sample Profile</strong> to explore instantly. No login needed.</p>
            <button className="kb-btn kb-btn-ghost size-11 shrink-0 p-0" aria-label="Dismiss hint" onClick={() => set((s) => ({ ...s, bannerDismissed: true }))}><X className="size-4" /></button>
          </div>
        </div>
      )}

      <main id="kb-panel" role="tabpanel" aria-labelledby={`tab-${state.activeTab}`} className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:max-w-[1400px]">
        {children}
      </main>

      <footer className="no-print mb-[calc(4.5rem+env(safe-area-inset-bottom))] border-t border-border bg-card md:mb-0">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1.5 px-4 py-7 text-center sm:px-6 lg:px-8 xl:max-w-[1400px] 2xl:text-base">
          <p className="break-words font-heading text-base font-bold text-primary 2xl:text-lg">Verified Micro-Sprints &amp; Proof of Work</p>
          <p className="break-words text-sm text-muted-foreground 2xl:text-base">© {new Date().getFullYear()} KaziBridge.</p>
        </div>
      </footer>

      <nav aria-label="Main mobile" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-4">
          {TABS.map((t) => {
            const active = state.activeTab === t.id;
            return (
              <button key={t.id} aria-current={active ? "page" : undefined} onClick={() => setTab(t.id)}
                className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
                <span className={`rounded-full px-4 py-1 ${active ? "bg-primary-soft" : ""}`}><t.icon className="size-5" /></span>{t.short}
              </button>
            );
          })}
        </div>
      </nav>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset the demo?">
        <p className="text-muted-foreground">This restores all seed data and clears your local changes (applications, published sprints, endorsements).</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="kb-btn kb-btn-secondary" onClick={() => setConfirm(false)}>Cancel</button>
          <button className="kb-btn kb-btn-primary" onClick={() => { reset(); setConfirm(false); }}><RotateCcw className="size-4" /> Reset Demo</button>
        </div>
      </Modal>
    </div>
  );
}
