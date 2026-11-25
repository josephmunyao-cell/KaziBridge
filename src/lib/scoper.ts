export interface ScopeResult { template: string; milestones: string[]; days: number; suggested: number; min: number; max: number; rate: number; rationale: string }

interface Tpl { key: string; label: string; keywords: string[]; milestones: string[]; baseDays: number; rate: number }
export const TEMPLATES: Tpl[] = [
  { key: "flyers", label: "design", keywords: ["flyer", "poster", "promo", "canva", "design", "menu", "brochure"], milestones: ["Kick-off brief & collect assets", "Draft concepts for feedback", "Revise & finalise designs", "Deliver print + digital files"], baseDays: 3, rate: 1500 },
  { key: "inventory", label: "inventory & records", keywords: ["inventory", "stock", "spreadsheet", "sheet", "excel"], milestones: ["Agree sheet structure", "Record stock (part 1)", "Record stock (part 2) + flags", "Add formulas & train staff"], baseDays: 5, rate: 1400 },
  { key: "website", label: "web build", keywords: ["website", "web", "page", "site", "html", "online"], milestones: ["Gather content & branding", "Wireframe & sign-off", "Build & mobile test", "Publish & handover"], baseDays: 6, rate: 1700 },
  { key: "data", label: "data entry", keywords: ["data", "records", "digitise", "digitize", "clean", "beneficiary", "dataset"], milestones: ["Briefing & template setup", "Enter first half of records", "Enter remaining records", "Clean, de-duplicate & summarise"], baseDays: 5, rate: 1400 },
  { key: "social", label: "content", keywords: ["social", "post", "content", "facebook", "instagram", "tiktok", "video"], milestones: ["Content calendar & tone", "Create first batch", "Create second batch + captions", "Schedule & handover"], baseDays: 4, rate: 1450 },
  { key: "survey", label: "field survey", keywords: ["survey", "enumerat", "interview", "household", "kobo", "feedback"], milestones: ["Training on consent & tools", "Collect first half of responses", "Collect remaining responses", "Quality check & debrief"], baseDays: 5, rate: 1600 },
  { key: "translation", label: "translation", keywords: ["translat", "somali", "kiswahili", "leaflet", "language"], milestones: ["Build key-term glossary", "First language translation", "Second language translation", "Review & finalise"], baseDays: 4, rate: 1350 },
  { key: "setup", label: "customer setup", keywords: ["whatsapp", "catalog", "catalogue", "auto-repl", "customer", "m-pesa", "setup"], milestones: ["Collect product photos & prices", "Build catalogue", "Configure auto-replies & test"], baseDays: 3, rate: 1250 },
];
const GENERIC: Tpl = { key: "generic", label: "general task", keywords: [], milestones: ["Kick-off & scope agreement", "First deliverable for review", "Revisions & final delivery", "Handover & supervisor sign-off"], baseDays: 4, rate: 1300 };

const r100 = (n: number) => Math.round(n / 100) * 100;

export function scopeSprint(text: string, preferredDays?: number): ScopeResult {
  const t = text.toLowerCase();
  let best = GENERIC; let bestHits = 0;
  for (const tpl of TEMPLATES) {
    const hits = tpl.keywords.filter((k) => t.includes(k)).length;
    if (hits > bestHits) { best = tpl; bestHits = hits; }
  }
  const raw = preferredDays && preferredDays !== best.baseDays ? Math.round((preferredDays + best.baseDays) / 2) : best.baseDays;
  const days = Math.min(7, Math.max(3, raw));
  const base = best.rate * days;
  const suggested = r100(base * 1.1);
  return {
    template: best.key, milestones: [...best.milestones], days, suggested, min: r100(base * 0.95), max: r100(base * 1.3), rate: best.rate,
    rationale: `Based on ~KES ${best.rate.toLocaleString()}/day for ${best.label} tasks in Northern Kenya × ${days} days, plus a 10% fairness uplift for inclusion.`,
  };
}
