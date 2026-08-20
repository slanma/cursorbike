-- =====================================================================
-- Cursorbike — etapa 2: import feedů od dodavatelů
--
-- Klíčové rozhodnutí: cena od dodavatele se NIKDY nepropíše na web sama.
-- Ukládá se stranou do `cena_feed` a obchodník ji převezme kliknutím.
-- Sklad a čárové kódy se přebírají rovnou — na těch není co rozhodovat.
-- =====================================================================

ALTER TABLE public.produkty
  -- Poslední cena od dodavatele. Zákazník ji nevidí, slouží k porovnání.
  ADD COLUMN IF NOT EXISTS cena_feed integer,
  -- Od koho produkt přišel a pod jakým kódem — podle toho se při dalším
  -- importu pozná, že jde o tentýž produkt, a nevznikne duplikát.
  ADD COLUMN IF NOT EXISTS dodavatel text,
  ADD COLUMN IF NOT EXISTS dodavatel_kod text,
  ADD COLUMN IF NOT EXISTS barva text,
  -- Podrobnosti k jednotlivým velikostem: [{velikost, ean, cena, skladem}]
  ADD COLUMN IF NOT EXISTS varianty jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS importovano_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS produkty_dodavatel_kod_idx
  ON public.produkty (dodavatel, dodavatel_kod)
  WHERE dodavatel IS NOT NULL AND dodavatel_kod IS NOT NULL;

-- Přiřazení kategorií z feedu na naše kategorie si pamatujeme, ať se
-- neodklikává při každém importu znovu.
INSERT INTO public.nastaveni (klic, hodnota)
VALUES ('import-mapovani', '{}'::jsonb)
ON CONFLICT (klic) DO NOTHING;
