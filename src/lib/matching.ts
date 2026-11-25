import type { Profile, Sprint } from "@/data/seed";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9/ ]/g, " ");
const words = (s: string) => norm(s).split(/[\s/]+/).filter((w) => w.length > 3);

export function skillMatches(have: string[], req: string): boolean {
  const r = norm(req);
  return have.some((h) => {
    const n = norm(h);
    if (n.includes(r) || r.includes(n)) return true;
    const rw = words(req);
    return words(h).some((w) => rw.includes(w));
  });
}

export interface MatchResult { score: number; reasons: string[]; matched: string[] }

export function matchSprint(p: Profile, s: Sprint, endorsedCount: number): MatchResult {
  const have = [...p.skills, ...p.languages];
  const matched = s.skillsRequired.filter((r) => skillMatches(have, r));
  const skill = s.skillsRequired.length ? matched.length / s.skillsRequired.length : 0.5;
  const local = p.areas.some((a) => s.location.toLowerCase().includes(a.toLowerCase()));
  let loc = 0.3;
  if (s.mode === "Remote") loc = 1;
  else if (local) loc = 1;
  else if (s.mode === "Hybrid") loc = 0.6;
  const dur = s.days >= 3 && s.days <= 7 ? 1 : 0.5;
  const exp = Math.min(1, endorsedCount / 2);
  const score = Math.round((skill * 0.6 + loc * 0.2 + dur * 0.1 + exp * 0.1) * 100);
  const reasons: string[] = [];
  if (matched.length) reasons.push(`You have ${matched.slice(0, 3).join(" + ")}${matched.length === s.skillsRequired.length ? " — all required" : ` (${matched.length} of ${s.skillsRequired.length} required)`}`);
  else reasons.push("New skill area — a chance to grow with mentor support");
  if (s.mode === "Remote") reasons.push("Remote sprint: works from anywhere");
  else if (local) reasons.push(`Based near ${s.location}: ${s.mode.toLowerCase()} OK`);
  else reasons.push(`${s.mode} in ${s.location} — outside your usual area`);
  reasons.push(`Fits your 3–7 day availability (${s.days} days)`);
  if (endorsedCount > 0) reasons.push(`${endorsedCount} verified endorsement${endorsedCount > 1 ? "s" : ""} boost your profile`);
  return { score, reasons: reasons.slice(0, 3), matched };
}
