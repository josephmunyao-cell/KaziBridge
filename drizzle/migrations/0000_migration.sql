CREATE TABLE public.proofs (
  id text PRIMARY KEY,
  snapshot jsonb NOT NULL,
  hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.proofs TO anon, authenticated;
GRANT ALL ON public.proofs TO service_role;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read proofs" ON public.proofs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can publish a proof" ON public.proofs FOR INSERT TO anon, authenticated
  WITH CHECK (id ~ '^KB-PRF-[0-9]{4}-[A-Z0-9]{8}$' AND length(hash) = 64 AND pg_column_size(snapshot) < 20000);