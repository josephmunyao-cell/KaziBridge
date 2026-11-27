import { describe, expect, it } from "vitest";
import { AMINA, HISTORY_SPRINTS, SEED_COMPLETED_ON, bundleFor } from "@/data/seed";
import {
  buildVerifyUrl, decodePayload, displayProofId, encodePayload, issueProof, normalizeProofId, parseVerifyInput, sha256Hex, upsertRecord, verifyProof,
} from "@/lib/proof";

const b = bundleFor(AMINA);
const src = { sprints: HISTORY_SPRINTS, applications: b.applications, endorsements: b.endorsements, completedOn: SEED_COMPLETED_ON };

describe("proof verification", () => {
  it("sha256 matches the standard test vector", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("gives the same Proof ID for the same content", () => {
    const a = issueProof(AMINA, src)!; const c = issueProof(AMINA, { ...src })!;
    expect(a.id).toBe(c.id);
    expect(a.id).toMatch(/^KB-PRF-2611-[0-9A-HJKMNP-TV-Z]{8}$/);
  });
  it("issues a new ID when a sprint is endorsed", () => {
    const a = issueProof(AMINA, src)!;
    const c = issueProof(AMINA, { ...src, endorsements: { ...src.endorsements, h3: { by: "Bashir Aden", note: "Great", rating: 4, date: "2026-11-22" } } })!;
    expect(c.id).not.toBe(a.id);
    const reg = upsertRecord(upsertRecord({}, a, "amina"), c, "amina");
    expect(verifyProof(a.id, null, reg).status).toBe("superseded");
  });
  it("detects tampering: changing KES 4200 to 9200 fails", () => {
    const p = issueProof(AMINA, src)!;
    const bad = { ...p.snapshot, sp: p.snapshot.sp.map((x) => (x.kes === 4200 ? { ...x, kes: 9200 } : x)) };
    expect(verifyProof(p.id, encodePayload(bad, p.hash), {}).status).toBe("failed");
  });
  it("detects an edited Proof ID", () => {
    const p = issueProof(AMINA, src)!;
    const other = p.id.slice(0, -1) + (p.id.endsWith("0") ? "1" : "0");
    expect(verifyProof(other, encodePayload(p.snapshot, p.hash), {}).status).toBe("failed");
  });
  it("round-trips through the URL and passes integrity on a fresh device", () => {
    const p = issueProof(AMINA, src)!;
    const url = buildVerifyUrl("https://example.app/", p);
    expect(url.length).toBeLessThan(1200);
    const parsed = parseVerifyInput(url)!;
    expect(parsed.proof).toBe(p.id);
    expect(decodePayload(parsed.d!)!.s).toEqual(JSON.parse(JSON.stringify(p.snapshot)));
    expect(verifyProof(parsed.proof, parsed.d, {}).status).toBe("integrity");
    expect(verifyProof(parsed.proof, parsed.d, upsertRecord({}, p, "amina")).status).toBe("verified");
  });
  it("accepts dashed and undashed IDs", () => {
    const p = issueProof(AMINA, src)!;
    expect(normalizeProofId(displayProofId(p.id))).toBe(p.id);
    expect(normalizeProofId(p.id.toLowerCase())).toBe(p.id);
  });
  it("handles malformed input without throwing", () => {
    expect(parseVerifyInput("hello")).toBeNull();
    expect(verifyProof("garbage", null, {}).status).toBe("invalid");
    expect(verifyProof("KB-PRF-2611-AAAAAAAA", "%%%notbase64", {}).status).toBe("invalid");
    expect(verifyProof("KB-PRF-2611-AAAAAAAA", null, {}).status).toBe("notfound");
  });
  it("never includes the phone number", () => {
    expect(JSON.stringify(issueProof(AMINA, src)!.snapshot)).not.toContain(AMINA.phone);
  });
});
