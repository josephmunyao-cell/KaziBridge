DROP POLICY "Anyone can read proofs" ON public.proofs;
REVOKE SELECT ON public.proofs FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.get_proof(_id text)
RETURNS TABLE (snapshot jsonb, hash text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT p.snapshot, p.hash FROM public.proofs p WHERE p.id = _id LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.get_proof(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_proof(text) TO anon, authenticated;