/* Pure proof helpers: snapshot, canonical JSON, SHA-256, Proof ID, link encoding, verification. */
import type { Endorsement, Profile, Sprint } from "@/data/seed";

export type ProofSprint = {
  id: string; t: string; o: string; ot: "B" | "N"; d: number; kes: number; c: string; sk?: string[];
  e?: { by: string; org: string; r: number; q?: string; dt: string; role: "supervisor" | "mentor" };
};
export type ProofSnapshot = { v: 1; n: string; loc: string; iat: string; sp: ProofSprint[]; m?: { by: string; org: string; note: string; dt: string } };
export type HashAlgo = "sha256";
export interface ProofRecord { id: string; snapshot: ProofSnapshot; hash: string; hashAlgo: HashAlgo; issuedAt: string; profileId: string; supersededBy?: string }
export interface IssuedProof { id: string; hash: string; snapshot: ProofSnapshot; trimmed: 0 | 1 | 2 | 3 }

export interface ProofSource {
  sprints: Sprint[]; applications: Record<string, string>; endorsements: Record<string, Endorsement>; completedOn: Record<string, string>;
}

const LOCS = ["Garissa", "Dadaab", "Kakuma", "Nairobi"];
export const locationOf = (p: Pick<Profile, "location" | "areas">) =>
  LOCS.find((l) => p.location.includes(l)) ?? LOCS.find((l) => p.areas.includes(l)) ?? p.location;
const trim = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Full snapshot of completed work. No phone numbers, emails or contact details. */
export function buildProofSnapshot(profile: Profile, src: ProofSource): ProofSnapshot | null {
  const done = src.sprints.filter((s) => src.applications[s.id] === "completed");
  if (!done.length) return null;
  const sp: ProofSprint[] = done.map((s): ProofSprint => {
    const e = src.endorsements[s.id];
    return {
      id: s.id, t: s.title, o: s.org, ot: s.orgType === "NGO" ? "N" : "B", d: s.days, kes: s.payKES,
      c: src.completedOn[s.id] ?? "", sk: [...s.skillsRequired],
      ...(e ? { e: { by: e.by, org: e.org ?? s.org, r: e.rating, q: trim(e.note), dt: e.date, role: "supervisor" as const } } : {}),
    };
  }).sort((a, b) => (a.c < b.c ? 1 : a.c > b.c ? -1 : a.id.localeCompare(b.id)));
  const dates = sp.flatMap((x) => [x.c, x.e?.dt ?? ""]).filter(Boolean).sort();
  return { v: 1, n: profile.name, loc: locationOf(profile), iat: dates.at(-1) ?? "2026-01-01", sp };
}

/** Sorted keys, no whitespace, undefined dropped. */
export function canonicalize(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map((x) => (x === undefined ? "null" : canonicalize(x))).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonicalize(o[k])}`).join(",")}}`;
}

/* Synchronous SHA-256 (works on every browser, including non-secure origins without crypto.subtle). */
const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const len = bytes.length; const total = Math.ceil((len + 9) / 64) * 64;
  const buf = new Uint8Array(total); buf.set(bytes); buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, Math.floor((len * 8) / 2 ** 32)); dv.setUint32(total - 4, (len * 8) >>> 0);
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const W = new Uint32Array(64);
  const r = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = W[i - 15]!, b = W[i - 2]!;
      W[i] = (W[i - 16]! + (r(a, 7) ^ r(a, 18) ^ (a >>> 3)) + W[i - 7]! + (r(b, 17) ^ r(b, 19) ^ (b >>> 10))) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = [H[0]!, H[1]!, H[2]!, H[3]!, H[4]!, H[5]!, H[6]!, H[7]!];
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i]! + W[i]!) >>> 0;
      const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0]! + a) >>> 0; H[1] = (H[1]! + b) >>> 0; H[2] = (H[2]! + c) >>> 0; H[3] = (H[3]! + d) >>> 0;
    H[4] = (H[4]! + e) >>> 0; H[5] = (H[5]! + f) >>> 0; H[6] = (H[6]! + g) >>> 0; H[7] = (H[7]! + h) >>> 0;
  }
  return Array.from(H, (x) => x.toString(16).padStart(8, "0")).join("");
}
export const hashSnapshot = (s: ProofSnapshot) => sha256Hex(canonicalize(s));

const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
/** First 40 bits of the hash as 8 Crockford Base32 chars. */
export function proofIdFromHash(hash: string, iat: string): string {
  let n = BigInt(`0x${hash.slice(0, 10)}`); let out = "";
  for (let i = 0; i < 8; i++) { out = B32[Number(n & 31n)] + out; n >>= 5n; }
  return `KB-PRF-${iat.slice(2, 4)}${iat.slice(5, 7)}-${out}`;
}
/** Printed form with a check group: KB-PRF-2611-7K3M-9QXD */
export const displayProofId = (id: string) => id.replace(/^(KB-PRF-\d{4}-)(\w{4})(\w{4})$/, "$1$2-$3");

/** Accepts dashed/undashed, lowercase, O/I/L typos. Returns the canonical undashed form or null. */
export function normalizeProofId(input: string): string | null {
  const s = input.toUpperCase().replace(/\s+/g, "");
  const m = s.match(/KB-?PRF-?(\d{4})-?([0-9A-Z]{4})-?([0-9A-Z]{4})(?![0-9A-Z])/);
  if (!m) return null;
  const body = (m[2]! + m[3]!).replace(/O/g, "0").replace(/[IL]/g, "1");
  if (![...body].every((ch) => B32.includes(ch))) return null;
  return `KB-PRF-${m[1]}-${body}`;
}

/* base64url of UTF-8 JSON */
function toB64url(str: string) {
  const bytes = new TextEncoder().encode(str); let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string) {
  const b = s.replace(/-/g, "+").replace(/_/g, "/"); const pad = b + "===".slice((b.length + 3) % 4);
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(pad), (c) => c.charCodeAt(0)));
}
export const encodePayload = (s: ProofSnapshot, h: string) => toB64url(JSON.stringify({ s, h, a: "sha256" }));
export function decodePayload(d: string): { s: ProofSnapshot; h: string; a: string } | null {
  try {
    const o = JSON.parse(fromB64url(d)) as { s?: unknown; h?: unknown; a?: unknown };
    const s = o?.s as ProofSnapshot | undefined;
    if (!s || typeof s !== "object" || s.v !== 1 || typeof s.n !== "string" || !Array.isArray(s.sp) || typeof o.h !== "string") return null;
    return { s, h: o.h, a: typeof o.a === "string" ? o.a : "sha256" };
  } catch { return null; }
}

/** Budget for the #d= payload so the whole URL stays under ~1,200 chars and the QR stays scannable. */
export const PAYLOAD_BUDGET = 950;
/** Shrinks the snapshot for the QR: drop quotes, then skills, then keep the 3 most recent sprints. */
export function compactSnapshot(full: ProofSnapshot): { snapshot: ProofSnapshot; trimmed: 0 | 1 | 2 | 3 } {
  const fits = (s: ProofSnapshot) => encodePayload(s, "0".repeat(64)).length <= PAYLOAD_BUDGET;
  if (fits(full)) return { snapshot: full, trimmed: 0 };
  const noQ: ProofSnapshot = { ...full, sp: full.sp.map((x) => { if (!x.e) return x; const { q: _q, ...e } = x.e; return { ...x, e }; }) };
  if (fits(noQ)) return { snapshot: noQ, trimmed: 1 };
  const noSk: ProofSnapshot = { ...noQ, sp: noQ.sp.map(({ sk: _sk, ...x }) => x) };
  if (fits(noSk)) return { snapshot: noSk, trimmed: 2 };
  return { snapshot: { ...noSk, sp: noSk.sp.slice(0, 3) }, trimmed: full.sp.length > 3 ? 3 : 2 };
}

/** The proof the app issues: ID and hash cover exactly the snapshot carried in the QR link. */
export function issueFromSnapshot(full: ProofSnapshot): IssuedProof {
  const { snapshot, trimmed } = compactSnapshot(full);
  const hash = hashSnapshot(snapshot);
  return { id: proofIdFromHash(hash, snapshot.iat), hash, snapshot, trimmed };
}
export function issueProof(profile: Profile, src: ProofSource): IssuedProof | null {
  const full = buildProofSnapshot(profile, src);
  return full ? issueFromSnapshot(full) : null;
}

/** Insert the record (idempotent) and mark older records for the same profile as superseded. */
export function upsertRecord(records: Record<string, ProofRecord>, p: IssuedProof, profileId: string): Record<string, ProofRecord> {
  const cur = records[p.id];
  const stale = Object.values(records).filter((r) => r.profileId === profileId && r.id !== p.id && r.supersededBy !== p.id);
  if (cur && !cur.supersededBy && !stale.length) return records;
  const next = { ...records };
  stale.forEach((r) => { next[r.id] = { ...r, supersededBy: p.id }; });
  next[p.id] = cur ? (({ supersededBy: _s, ...rest }) => rest)(cur) : { id: p.id, snapshot: p.snapshot, hash: p.hash, hashAlgo: "sha256", issuedAt: new Date().toISOString().slice(0, 10), profileId };
  return next;
}

const PRIVATE_HOST = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?)/;
export function isPrivateBase(base: string) {
  try { return PRIVATE_HOST.test(new URL(base).hostname); } catch { return false; }
}
export function defaultBaseUrl() {
  try { return typeof window === "undefined" ? "" : window.location.origin + window.location.pathname; } catch { return ""; }
}
export function buildVerifyUrl(base: string, p: Pick<IssuedProof, "id" | "snapshot" | "hash">) {
  const b = (base || defaultBaseUrl()).split(/[?#]/)[0]!;
  return `${b}?proof=${encodeURIComponent(p.id)}#d=${encodePayload(p.snapshot, p.hash)}`;
}

/** Short link for the QR: the proof itself is looked up online, so the code stays simple and easy to scan. */
export function buildShortVerifyUrl(base: string, id: string) {
  const b = (base || defaultBaseUrl()).split(/[?#]/)[0]!;
  return `${b}?proof=${encodeURIComponent(id)}`;
}

/** Parses a pasted Proof ID or full verification URL. */
export function parseVerifyInput(input: string): { proof: string; d: string | null } | null {
  const raw = input.trim(); if (!raw) return null;
  const qm = raw.match(/[?&]proof=([^&#\s]+)/i);
  const dm = raw.match(/#(?:.*&)?d=([A-Za-z0-9_-]+)/);
  const id = normalizeProofId(qm ? decodeURIComponent(qm[1]!) : raw);
  if (!id) return null;
  return { proof: id, d: dm ? dm[1]! : null };
}

export type VerifyStatus = "verified" | "integrity" | "superseded" | "failed" | "invalid" | "notfound";
export interface VerifyResult { status: VerifyStatus; id: string | null; rawId: string; snapshot?: ProofSnapshot; hash?: string; supersededBy?: string; reason?: string }

export function verifyProof(rawId: string, d: string | null, registry: Record<string, ProofRecord>): VerifyResult {
  const id = normalizeProofId(rawId);
  if (!id) return { status: "invalid", id: null, rawId, reason: "The Proof ID in this link is not in the KaziBridge format." };
  const rec = registry[id];
  if (d) {
    const p = decodePayload(d);
    if (!p) return { status: "invalid", id, rawId, reason: "The proof data in this link could not be read." };
    const recomputed = hashSnapshot(p.s);
    if (recomputed !== p.h) return { status: "failed", id, rawId, snapshot: p.s, hash: p.h, reason: "The fingerprint does not match the proof data." };
    if (proofIdFromHash(recomputed, p.s.iat) !== id) return { status: "failed", id, rawId, snapshot: p.s, hash: p.h, reason: "The Proof ID does not match the proof data." };
    if (rec?.supersededBy) return { status: "superseded", id, rawId, snapshot: p.s, hash: p.h, supersededBy: rec.supersededBy };
    return { status: rec ? "verified" : "integrity", id, rawId, snapshot: p.s, hash: p.h };
  }
  if (!rec) return { status: "notfound", id, rawId };
  if (rec.supersededBy) return { status: "superseded", id, rawId, snapshot: rec.snapshot, hash: rec.hash, supersededBy: rec.supersededBy };
  return { status: "verified", id, rawId, snapshot: rec.snapshot, hash: rec.hash };
}
