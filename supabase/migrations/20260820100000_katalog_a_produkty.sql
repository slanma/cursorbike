-- =====================================================================
-- Cursorbike — etapa 1: katalog a produkty z databáze
--
-- Proč: seznam značek a podkategorií byl napevno v souboru
-- src/lib/produkty.ts. Kategorie založené v /admin/kategorie se proto
-- na web vůbec nedostaly a obchodník neměl jak katalog měnit.
--
-- Co migrace dělá:
--   1) tabulka `znacky` (Author, Crussis, …) + napojení kategorií
--   2) rozšíření `produkty` o velikosti rámu, sklad, galerii a EAN
--   3) `velikost` u položky objednávky
--   4) tabulka `nastaveni` (klíč/hodnota) — zatím jen přepínač ukázkových kol
--   5) naplnění značek a kategorií podle dosavadního napevno psaného katalogu
--
-- Migrace je psaná tak, aby šla spustit i opakovaně (IF NOT EXISTS,
-- ON CONFLICT DO NOTHING) — druhé spuštění nic nerozbije ani nezduplikuje.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ZNAČKY
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.znacky (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sekce text NOT NULL DEFAULT 'kola',
  slug text NOT NULL,
  nazev text NOT NULL,
  popis text NOT NULL DEFAULT '',
  poradi integer NOT NULL DEFAULT 0,
  aktivni boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sekce, slug)
);

GRANT SELECT ON public.znacky TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.znacky TO authenticated;
GRANT ALL ON public.znacky TO service_role;

ALTER TABLE public.znacky ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Znacky jsou verejne" ON public.znacky;
CREATE POLICY "Znacky jsou verejne" ON public.znacky FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin spravuje znacky" ON public.znacky;
CREATE POLICY "Admin spravuje znacky" ON public.znacky FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS znacky_updated_at ON public.znacky;
CREATE TRIGGER znacky_updated_at BEFORE UPDATE ON public.znacky
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 2) KATEGORIE — napojení na značku
-- Sloupec `znacka` (text) zůstává kvůli zpětné kompatibilitě, ale nově
-- je zdrojem pravdy `znacka_id`.
-- ---------------------------------------------------------------------
ALTER TABLE public.kategorie
  ADD COLUMN IF NOT EXISTS znacka_id uuid REFERENCES public.znacky(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS popis text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS kategorie_znacka_id_idx ON public.kategorie (znacka_id);

-- ---------------------------------------------------------------------
-- 3) PRODUKTY — velikost rámu, sklad, galerie, EAN
--
-- `velikosti` prázdné pole = kolo se prodává bez volby velikosti
-- (doplňky, dětská kola). Když je pole vyplněné, zákazník musí velikost
-- vybrat, jinak se tlačítko do košíku nepovolí.
--
-- `skladem` = počet kusů na prodejně. Když je 0 a `na_objednavku` je
-- true, kolo se dá pořád objednat s delší dodací lhůtou; když je 0
-- a `na_objednavku` je false, je vyprodané.
-- ---------------------------------------------------------------------
ALTER TABLE public.produkty
  ADD COLUMN IF NOT EXISTS velikosti text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skladem integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS na_objednavku boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS obrazky jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ean text;

CREATE INDEX IF NOT EXISTS produkty_ean_idx ON public.produkty (ean) WHERE ean IS NOT NULL;

-- ---------------------------------------------------------------------
-- 4) POLOŽKA OBJEDNÁVKY — velikost rámu
-- ---------------------------------------------------------------------
ALTER TABLE public.objednavka_polozky
  ADD COLUMN IF NOT EXISTS velikost text;

-- ---------------------------------------------------------------------
-- 5) NASTAVENÍ OBCHODU
-- Jednoduchá tabulka klíč → JSON. Čtení je veřejné, protože se z ní
-- berou údaje, které se stejně zobrazují zákazníkovi (později cena
-- dopravy, číslo účtu pro QR platbu). Zapisovat smí jen admin.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nastaveni (
  klic text PRIMARY KEY,
  hodnota jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nastaveni TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nastaveni TO authenticated;
GRANT ALL ON public.nastaveni TO service_role;

ALTER TABLE public.nastaveni ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nastaveni je verejne ke cteni" ON public.nastaveni;
CREATE POLICY "Nastaveni je verejne ke cteni" ON public.nastaveni FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin spravuje nastaveni" ON public.nastaveni;
CREATE POLICY "Admin spravuje nastaveni" ON public.nastaveni FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS nastaveni_updated_at ON public.nastaveni;
CREATE TRIGGER nastaveni_updated_at BEFORE UPDATE ON public.nastaveni
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.nastaveni (klic, hodnota)
VALUES ('eshop', '{"zobrazovat_ukazkove": true}'::jsonb)
ON CONFLICT (klic) DO NOTHING;

-- ---------------------------------------------------------------------
-- 6) NAPLNĚNÍ ZNAČEK
-- Odpovídá tomu, co bylo dosud napevno v src/lib/produkty.ts, takže se
-- po nasazení na webu nic neztratí.
-- ---------------------------------------------------------------------
INSERT INTO public.znacky (sekce, slug, nazev, popis, poradi) VALUES
  ('kola', 'author', 'Author', 'Pánská, dámská i dětská jízdní kola značky Author.', 1),
  ('kola', 'liberty', 'Liberty', 'Městská kola Liberty.', 2),
  ('elektrokola', 'author', 'Author', 'Horská, trekingová i dámská elektrokola Author.', 1),
  ('elektrokola', 'crussis', 'Crussis', 'Česká elektrokola Crussis pro terén i město.', 2),
  ('elektrokola', 'emerix', 'eMERIX', 'Elektrokola Profil Bicycles s motory Yamaha a Bafang.', 3),
  ('elektrokola', 'liberty', 'Liberty', 'Pohodlná městská elektrokola Liberty.', 4),
  ('elektrokola', 'lectron', 'Lectron', 'Trekingová a horská elektrokola Lectron.', 5)
ON CONFLICT (sekce, slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- 7) NAPLNĚNÍ KATEGORIÍ
-- Slug musí být unikátní přes celou tabulku, proto obsahuje i sekci
-- a značku — jinak by se srazila „horská" u Crussis a u Lectronu.
-- ---------------------------------------------------------------------
INSERT INTO public.kategorie (slug, nazev, sekce, znacka, znacka_id, poradi)
SELECT v.slug, v.nazev, v.sekce, v.znacka, z.id, v.poradi
FROM (VALUES
  -- KOLA / Author
  ('kola-author-panska-horska-29',        'Pánská | Horská 29"',                        'kola', 'author', 1),
  ('kola-author-damska-horska-275',       'Dámská | Horská 27,5"',                      'kola', 'author', 2),
  ('kola-author-damska-horska-29',        'Dámská | Horská 29"',                        'kola', 'author', 3),
  ('kola-author-detska-26',               'Dětská | 26 palců',                          'kola', 'author', 4),
  ('kola-author-detska-275',              'Dětská | 27,5 palců',                        'kola', 'author', 5),
  ('kola-author-detska-29',               'Dětská | 29 palců',                          'kola', 'author', 6),
  -- KOLA / Liberty
  ('kola-liberty-city-26',                'City 26"',                                   'kola', 'liberty', 1),
  -- ELEKTROKOLA / Author
  ('elektrokola-author-horska-emtb-29',   'Horská elektrokola (E-MTB) | 29 palců',      'elektrokola', 'author', 1),
  ('elektrokola-author-trekingova-ecross-29', 'Trekingová elektrokola (E-Cross) | 29 palců', 'elektrokola', 'author', 2),
  ('elektrokola-author-trekingova-ecross-29-damske', 'Trekingová (E-Cross) | 29 palců dámské', 'elektrokola', 'author', 3),
  ('elektrokola-author-damska-275',       'Dámská elektrokola | 27,5 palců',            'elektrokola', 'author', 4),
  ('elektrokola-author-e-city-damske',    'E-city | Dámské',                            'elektrokola', 'author', 5),
  -- ELEKTROKOLA / Crussis
  ('elektrokola-crussis-horska',          'Horská elektrokola',                         'elektrokola', 'crussis', 1),
  ('elektrokola-crussis-celoodpruzena',   'Celoodpružená elektrokola',                  'elektrokola', 'crussis', 2),
  ('elektrokola-crussis-trekova',         'Treková elektrokola',                        'elektrokola', 'crussis', 3),
  ('elektrokola-crussis-krosova',         'Krosová elektrokola',                        'elektrokola', 'crussis', 4),
  ('elektrokola-crussis-mestska',         'Městská elektrokola',                        'elektrokola', 'crussis', 5),
  -- ELEKTROKOLA / eMERIX
  ('elektrokola-emerix-yamaha',           'Profil Bicycles | Yamaha',                   'elektrokola', 'emerix', 1),
  ('elektrokola-emerix-bafang',           'Profil Bicycles | Bafang',                   'elektrokola', 'emerix', 2),
  -- ELEKTROKOLA / Liberty
  ('elektrokola-liberty-e-city-28',       'e-City 28"',                                 'elektrokola', 'liberty', 1),
  ('elektrokola-liberty-e-city-26',       'e-City 26"',                                 'elektrokola', 'liberty', 2),
  -- ELEKTROKOLA / Lectron
  ('elektrokola-lectron-trekingova',      'Trekingová elektrokola',                     'elektrokola', 'lectron', 1),
  ('elektrokola-lectron-horska',          'Horská elektrokola',                         'elektrokola', 'lectron', 2)
) AS v(slug, nazev, sekce, znacka, poradi)
JOIN public.znacky z ON z.sekce = v.sekce AND z.slug = v.znacka
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- 8) DOPÁROVÁNÍ STARŠÍCH KATEGORIÍ
-- Kategorie, které si obchodník založil dřív v administraci, mají jen
-- textovou značku. Založíme k nim chybějící značky a propojíme je.
-- ---------------------------------------------------------------------
INSERT INTO public.znacky (sekce, slug, nazev, poradi)
SELECT DISTINCT k.sekce, k.znacka, initcap(replace(k.znacka, '-', ' ')), 99
FROM public.kategorie k
WHERE k.znacka IS NOT NULL AND k.znacka <> '' AND k.znacka_id IS NULL
ON CONFLICT (sekce, slug) DO NOTHING;

UPDATE public.kategorie k
SET znacka_id = z.id
FROM public.znacky z
WHERE k.znacka_id IS NULL AND z.sekce = k.sekce AND z.slug = k.znacka;
