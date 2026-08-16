-- =====================================================================
-- Cursorbike — doplnění po první migraci
-- 1) storage bucket "produkty" (chyběl → nahrávání fotek padalo)
-- 2) tabulka zpravy (kontaktní formulář nikam neukládal)
-- 3) indexy na cizí klíče
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) BUCKET NA FOTKY PRODUKTŮ
-- Původní migrace vytvořila jen RLS policy, ale samotný bucket ne.
-- Nahrávání fotky v administraci proto končilo chybou "Bucket not found".
-- Bucket děláme veřejný — fotky produktů na e-shopu nejsou tajné a veřejná
-- URL se dá cachovat na CDN (na rozdíl od podepsané URL s expirací).
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'produkty',
  'produkty',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Veřejné čtení fotek (aby fungovaly i pro nepřihlášené návštěvníky).
DROP POLICY IF EXISTS "Fotky produktu jsou verejne" ON storage.objects;
CREATE POLICY "Fotky produktu jsou verejne" ON storage.objects
  FOR SELECT USING (bucket_id = 'produkty');

-- ---------------------------------------------------------------------
-- 2) ZPRÁVY Z KONTAKTNÍHO FORMULÁŘE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zpravy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jmeno text NOT NULL,
  email text NOT NULL,
  telefon text,
  zprava text NOT NULL,
  stav text NOT NULL DEFAULT 'nova',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.zpravy TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zpravy TO authenticated;
GRANT ALL ON public.zpravy TO service_role;

ALTER TABLE public.zpravy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kdokoli muze poslat zpravu" ON public.zpravy;
CREATE POLICY "Kdokoli muze poslat zpravu" ON public.zpravy
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin spravuje zpravy" ON public.zpravy;
CREATE POLICY "Admin spravuje zpravy" ON public.zpravy
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS zpravy_updated_at ON public.zpravy;
CREATE TRIGGER zpravy_updated_at BEFORE UPDATE ON public.zpravy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 3) INDEXY
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS produkty_kategorie_id_idx ON public.produkty (kategorie_id);
CREATE INDEX IF NOT EXISTS produkty_aktivni_idx ON public.produkty (aktivni);
CREATE INDEX IF NOT EXISTS objednavka_polozky_objednavka_id_idx ON public.objednavka_polozky (objednavka_id);
CREATE INDEX IF NOT EXISTS objednavky_created_at_idx ON public.objednavky (created_at DESC);
CREATE INDEX IF NOT EXISTS servis_poptavky_created_at_idx ON public.servis_poptavky (created_at DESC);
CREATE INDEX IF NOT EXISTS zpravy_created_at_idx ON public.zpravy (created_at DESC);
