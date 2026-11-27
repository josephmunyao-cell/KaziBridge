import { supabase } from "@/integrations/supabase/client";
import type { IssuedProof, ProofSnapshot } from "./proof";

const published = new Set<string>();

/** Saves the proof online so the QR can carry only a short link. Same ID = same content, so duplicates are ignored. */
export async function publishProof(p: Pick<IssuedProof, "id" | "snapshot" | "hash">) {
  if (published.has(p.id)) return;
  published.add(p.id);
  const { error } = await supabase.from("proofs").upsert({ id: p.id, snapshot: p.snapshot as never, hash: p.hash }, { onConflict: "id", ignoreDuplicates: true });
  if (error) published.delete(p.id);
}

export async function fetchProof(id: string): Promise<{ snapshot: ProofSnapshot; hash: string } | null> {
  const { data, error } = await supabase.from("proofs").select("snapshot, hash").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return { snapshot: data.snapshot as unknown as ProofSnapshot, hash: data.hash };
}
