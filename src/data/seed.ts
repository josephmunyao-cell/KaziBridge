export type OrgType = "Local Business" | "NGO";
export type Mode = "On-site" | "Remote" | "Hybrid";
export type AppStatus = "applied" | "accepted" | "in_progress" | "completed";

export const CATEGORIES = [
  "Digital Outreach & Flyers",
  "Data & Inventory Organization",
  "Basic Web & Customer Setup",
  "Translation & Community Surveys",
  "Content & Social Media",
] as const;

export interface Milestone { id: string; title: string; dayDue: number }
export interface Sprint {
  id: string; title: string; org: string; orgType: OrgType; category: string;
  location: string; mode: Mode; days: number; payKES: number; skillsRequired: string[];
  description: string; milestones: Milestone[]; status: "open" | "history";
  postedBy: string; isNew?: boolean; userPosted?: boolean; createdAt?: string;
}
export interface Endorsement { by: string; org?: string; note: string; rating: number; date: string }
export interface Profile {
  id: string; name: string; shortName: string; initials: string; slug: string; age: number;
  location: string; areas: string[]; background: string; languages: string[]; skills: string[];
  availability: string; experience: string[]; education: string; phone: string;
}
export interface Mentee {
  id: string; name: string; location: string; currentSprint: string; progress: number;
  status: "Active" | "Completed" | "At risk"; sprintsCompleted: number; avgRating: number;
  lastCheckIn: string; notes: string[];
}
export interface ActionItem { id: string; text: string; done: boolean }

const ms = (p: string, list: [string, number][]): Milestone[] =>
  list.map(([title, dayDue], i) => ({ id: `${p}-m${i + 1}`, title, dayDue }));

export const SEED_SPRINTS: Sprint[] = [
  { id: "s1", title: "Design 5 Ramadan promo flyers for a neighbourhood grocery", org: "Duka la Baraka", orgType: "Local Business", category: "Digital Outreach & Flyers", location: "Garissa", mode: "Hybrid", days: 3, payKES: 4500, skillsRequired: ["Canva design", "Kiswahili", "Social media posting"], description: "Duka la Baraka wants five bright, bilingual flyers (Kiswahili + Somali) promoting its Ramadan iftar bundles and weekly offers. Flyers will be printed A5 and shared as WhatsApp Status images.", milestones: ms("s1", [["Brief call & collect product photos/prices", 1], ["Draft 2 flyer concepts for feedback", 2], ["Finalise all 5 flyers (print + WhatsApp sizes)", 3], ["Hand over Canva files & short usage guide", 3]]), status: "open", postedBy: "Abdi Noor, Owner" },
  { id: "s2", title: "Organise pharmacy stock inventory into a Google Sheet", org: "Hodan Pharmacy Garissa", orgType: "Local Business", category: "Data & Inventory Organization", location: "Garissa", mode: "On-site", days: 5, payKES: 7500, skillsRequired: ["Excel/Google Sheets", "Data entry", "Inventory"], description: "Count and record ~350 product lines into a structured Google Sheet with expiry dates, reorder levels and supplier columns, then train staff on updating it.", milestones: ms("s2", [["Design sheet structure with owner", 1], ["Record shelf stock (aisles A–C)", 3], ["Record store-room stock + expiry flags", 4], ["Add reorder alerts & train 2 staff", 5]]), status: "open", postedBy: "Hodan Ali, Pharmacist" },
  { id: "s3", title: "Set up WhatsApp Business catalogue and auto-replies", org: "Mama Fatuma Tailoring", orgType: "Local Business", category: "Basic Web & Customer Setup", location: "Garissa", mode: "Hybrid", days: 3, payKES: 3800, skillsRequired: ["Basic WhatsApp Business setup", "Customer service", "Kiswahili"], description: "Photograph 25 garments, build a priced WhatsApp Business catalogue, and configure greeting, away and quick-reply messages in Kiswahili and Somali.", milestones: ms("s3", [["Photograph & price 25 items", 1], ["Build catalogue with descriptions", 2], ["Configure greeting, away & quick replies", 3]]), status: "open", postedBy: "Fatuma Hussein, Owner" },
  { id: "s4", title: "Digitise 200 beneficiary records and clean the dataset", org: "Northern Hope Initiative", orgType: "NGO", category: "Data & Inventory Organization", location: "Dadaab", mode: "On-site", days: 6, payKES: 9000, skillsRequired: ["Data entry", "Excel/Google Sheets", "Data cleaning", "Somali"], description: "Transcribe 200 paper intake forms into a secure spreadsheet, remove duplicates, standardise names and phone numbers, and flag incomplete records. Data-protection briefing provided.", milestones: ms("s4", [["Data-protection briefing & template setup", 1], ["Enter records 1–100", 3], ["Enter records 101–200", 5], ["De-duplicate, standardise & flag gaps", 6], ["Submit clean dataset + 1-page summary", 6]]), status: "open", postedBy: "Ibrahim Gedi, Programme Officer" },
  { id: "s5", title: "Build a 1-page website with contact + M-Pesa Till info", org: "Garissa Fresh Dairy", orgType: "Local Business", category: "Basic Web & Customer Setup", location: "Garissa", mode: "Remote", days: 7, payKES: 12000, skillsRequired: ["Basic JS/HTML", "Canva design", "Customer service"], description: "Create a simple mobile-friendly page listing milk products, delivery areas, opening hours, a WhatsApp order button and the M-Pesa Till number. Hosting is free (provided).", milestones: ms("s5", [["Gather content, logo & photos", 1], ["Wireframe & owner sign-off", 2], ["Build page & mobile test", 5], ["Publish, connect WhatsApp button & handover", 7]]), status: "open", postedBy: "Halima Osman, Manager" },
  { id: "s6", title: "Community survey enumeration for a water-access study", org: "Maji Bora Partners", orgType: "NGO", category: "Translation & Community Surveys", location: "Garissa", mode: "On-site", days: 5, payKES: 8500, skillsRequired: ["Somali", "Kiswahili", "Data entry", "Customer service"], description: "Conduct 60 household interviews in Somali/Kiswahili using KoboCollect on a provided phone. Training on consent and survey ethics on day 1.", milestones: ms("s6", [["Training on consent & KoboCollect", 1], ["Complete 30 interviews", 3], ["Complete remaining 30 interviews", 4], ["Data quality check & debrief", 5]]), status: "open", postedBy: "Grace Achieng, Field Lead" },
  { id: "s7", title: "Weekly social content pack (12 posts) for a boda-boda co-op", org: "Tawakal Boda Boda SACCO", orgType: "Local Business", category: "Content & Social Media", location: "Remote", mode: "Remote", days: 4, payKES: 6000, skillsRequired: ["Social media posting", "Canva design", "Copywriting"], description: "Create 12 Facebook/WhatsApp posts covering safety tips, member savings offers and rider spotlights, with captions in Kiswahili and English and a posting schedule.", milestones: ms("s7", [["Content calendar & tone agreement", 1], ["Design posts 1–6", 2], ["Design posts 7–12 + captions", 3], ["Schedule & handover", 4]]), status: "open", postedBy: "Hassan Mohamed, Chair" },
  { id: "s8", title: "Translate health-awareness leaflets: Somali → Kiswahili → English", org: "Afya Pamoja CBO", orgType: "NGO", category: "Translation & Community Surveys", location: "Remote", mode: "Remote", days: 4, payKES: 5500, skillsRequired: ["Somali", "Kiswahili", "English"], description: "Translate four maternal-health leaflets (~2,400 words) into Kiswahili and English, keeping medical terms accurate and language warm and plain.", milestones: ms("s8", [["Glossary of key health terms", 1], ["Kiswahili translations", 2], ["English translations", 3], ["Review with health officer & finalise", 4]]), status: "open", postedBy: "Dr. Naima Abdullahi" },
  { id: "s9", title: "Customer feedback collection & short report", org: "Kibaki Hardware", orgType: "Local Business", category: "Content & Social Media", location: "Nairobi", mode: "Hybrid", days: 5, payKES: 6500, skillsRequired: ["Customer service", "Excel/Google Sheets", "Copywriting"], description: "Set up a Google Form, collect feedback from 80+ walk-in and WhatsApp customers, then summarise findings and three practical recommendations in a 2-page report.", milestones: ms("s9", [["Build Google Form & QR poster", 1], ["Collect 80+ responses", 3], ["Analyse results in Sheets", 4], ["Deliver 2-page report", 5]]), status: "open", postedBy: "Peter Kamau, Owner" },
  { id: "s10", title: "Product price list and QR menu for a café", org: "Kakuma Coffee Corner", orgType: "Local Business", category: "Digital Outreach & Flyers", location: "Kakuma", mode: "Hybrid", days: 3, payKES: 4000, skillsRequired: ["Canva design", "Data entry"], description: "Design a printed price list and a QR-code digital menu (Canva site) for 40 items, with English and Kiswahili names.", milestones: ms("s10", [["Collect items & prices", 1], ["Design menu & price list", 2], ["Publish QR menu & print-ready file", 3]]), status: "open", postedBy: "Deng Majok, Owner" },
];

export const HISTORY_SPRINTS: Sprint[] = [
  { id: "h1", title: "Eid sale flyer series for a textile shop", org: "Barwaqo Textiles", orgType: "Local Business", category: "Digital Outreach & Flyers", location: "Garissa", mode: "Hybrid", days: 3, payKES: 4200, skillsRequired: ["Canva design", "Social media posting"], description: "Four Eid sale flyers and WhatsApp status images.", milestones: ms("h1", [["Brief & photos", 1], ["Draft designs", 2], ["Final flyers delivered", 3]]), status: "history", postedBy: "Sahra Farah" },
  { id: "h2", title: "Clean and organise volunteer attendance records", org: "Northern Hope Initiative", orgType: "NGO", category: "Data & Inventory Organization", location: "Garissa", mode: "On-site", days: 5, payKES: 7000, skillsRequired: ["Excel/Google Sheets", "Data entry"], description: "Consolidated 6 months of attendance sheets into one clean dashboard.", milestones: ms("h2", [["Collect paper sheets", 1], ["Enter data", 3], ["Clean & de-duplicate", 4], ["Summary dashboard", 5]]), status: "history", postedBy: "Ibrahim Gedi" },
  { id: "h3", title: "WhatsApp catalogue for a mobile-phone accessories stall", org: "Bashir Mobile Accessories", orgType: "Local Business", category: "Basic Web & Customer Setup", location: "Garissa", mode: "Hybrid", days: 3, payKES: 3500, skillsRequired: ["Basic WhatsApp Business setup", "Customer service"], description: "Built a 30-item catalogue with quick replies.", milestones: ms("h3", [["Photograph items", 1], ["Build catalogue", 2], ["Set auto-replies", 3]]), status: "history", postedBy: "Bashir Aden" },
];

export const SEED_ENDORSEMENTS: Record<string, Endorsement> = {
  h1: { by: "Sahra Farah", org: "Barwaqo Textiles", note: "Amina delivered all flyers a day early and communicated clearly. Our Eid sales were our best yet.", rating: 5, date: "2026-10-14" },
  h2: { by: "Ibrahim Gedi", org: "Northern Hope Initiative", note: "Careful, accurate and respectful with sensitive records. I'd hire her again without hesitation.", rating: 5, date: "2026-11-03" },
};

const allTrue = (s: Sprint) => Object.fromEntries(s.milestones.map((m) => [m.id, true]));

export interface ProfileBundle {
  profile: Profile;
  applications: Record<string, AppStatus>;
  milestoneProgress: Record<string, Record<string, boolean>>;
  endorsements: Record<string, Endorsement>;
}

export const AMINA: Profile = {
  id: "amina", name: "Amina Hassan Warsame", shortName: "Amina H. W.", initials: "AH", slug: "amina-hassan-w7k2", age: 23,
  location: "Garissa Town", areas: ["Garissa", "Dadaab", "Remote"], background: "Displaced youth, host-community resident",
  languages: ["Somali", "Kiswahili", "English"],
  skills: ["Canva design", "Social media posting", "Excel/Google Sheets", "Data entry", "Customer service", "Basic WhatsApp Business setup"],
  availability: "Full-time · 3–7 day sprints · Garissa + Remote",
  experience: ["Volunteer outreach assistant, NGO (6 months)", "Freelance flyer design (12 informal clients)"],
  education: "KCSE C+, Certificate in Computer Packages", phone: "+254 712 345 678",
};
export const SAMUEL: Profile = {
  id: "samuel", name: "Samuel Lokiru Ekiru", shortName: "Samuel L. E.", initials: "SL", slug: "samuel-lokiru-e4p9", age: 25,
  location: "Kakuma, Turkana West", areas: ["Kakuma", "Remote"], background: "Displaced youth, Kakuma resident",
  languages: ["Turkana", "Kiswahili", "English"], skills: ["Inventory", "Basic JS/HTML", "Data cleaning", "Excel/Google Sheets"],
  availability: "Full-time · 3–7 day sprints · Kakuma + Remote", experience: ["Stock clerk, community shop (1 year)"],
  education: "KCSE B-, Web fundamentals bootcamp", phone: "+254 723 456 789",
};
export const FAITH: Profile = {
  id: "faith", name: "Faith Wanjiru Mwangi", shortName: "Faith W. M.", initials: "FW", slug: "faith-wanjiru-m2x8", age: 22,
  location: "Nairobi (Kayole)", areas: ["Nairobi", "Remote"], background: "Host-community youth",
  languages: ["Kikuyu", "Kiswahili", "English"], skills: ["Video editing on phone", "Copywriting", "Customer care", "Social media posting"],
  availability: "Part-time · 3–5 day sprints · Nairobi + Remote", experience: ["Call-centre agent (8 months)"],
  education: "Diploma in Communication (ongoing)", phone: "+254 734 567 890",
};

export function bundleFor(p: Profile): ProfileBundle {
  if (p.id === "amina") {
    return {
      profile: p,
      applications: { h1: "completed", h2: "completed", h3: "completed" },
      milestoneProgress: { h1: allTrue(HISTORY_SPRINTS[0]!), h2: allTrue(HISTORY_SPRINTS[1]!), h3: allTrue(HISTORY_SPRINTS[2]!) },
      endorsements: { ...SEED_ENDORSEMENTS },
    };
  }
  return { profile: p, applications: {}, milestoneProgress: {}, endorsements: {} };
}

export const SEED_MENTEES: Mentee[] = [
  { id: "me1", name: "Samuel Lokiru", location: "Kakuma", currentSprint: "Inventory sheet – Kakuma Coffee Corner", progress: 40, status: "At risk", sprintsCompleted: 1, avgRating: 4.0, lastCheckIn: "2026-11-20", notes: [] },
  { id: "me2", name: "Faith Wanjiru", location: "Nairobi", currentSprint: "Customer feedback – Kibaki Hardware", progress: 75, status: "Active", sprintsCompleted: 2, avgRating: 4.5, lastCheckIn: "2026-11-23", notes: [] },
  { id: "me3", name: "Abdirahman Yusuf", location: "Dadaab", currentSprint: "Survey enumeration – Maji Bora", progress: 60, status: "Active", sprintsCompleted: 3, avgRating: 4.7, lastCheckIn: "2026-11-22", notes: [] },
  { id: "me4", name: "Nyabol Gatluak", location: "Kakuma", currentSprint: "—", progress: 100, status: "Completed", sprintsCompleted: 4, avgRating: 4.8, lastCheckIn: "2026-11-18", notes: [] },
  { id: "me5", name: "Halima Abdi", location: "Garissa", currentSprint: "Translation – Afya Pamoja", progress: 25, status: "Active", sprintsCompleted: 1, avgRating: 4.3, lastCheckIn: "2026-11-24", notes: [] },
  { id: "me6", name: "Kevin Otieno", location: "Nairobi", currentSprint: "Social pack – Tawakal SACCO", progress: 20, status: "At risk", sprintsCompleted: 0, avgRating: 0, lastCheckIn: "2026-11-17", notes: [] },
];

export const SEED_ACTIONS: ActionItem[] = [
  { id: "a1", text: "Check in with Samuel — Day 3 of 5, milestone 2 overdue", done: false },
  { id: "a2", text: "Confirm M-Pesa payout for Nyabol's completed sprint", done: false },
  { id: "a3", text: "Introduce Kevin to a design mentor before Friday", done: false },
];

export const SEED_WEEKLY = [
  { week: "W1", completed: 3, rating: 4.2 },
  { week: "W2", completed: 5, rating: 4.4 },
  { week: "W3", completed: 4, rating: 4.3 },
  { week: "W4", completed: 7, rating: 4.6 },
  { week: "W5", completed: 6, rating: 4.5 },
  { week: "This wk", completed: 2, rating: 4.6 },
];
export const SEED_PAID_OUT = 186500;
