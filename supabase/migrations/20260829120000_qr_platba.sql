-- =====================================================================
-- Cursorbike — QR platba
--
-- Zákazník po objednávce dostane QR kód, načte ho v bankovní aplikaci
-- a je zaplaceno. Žádná platební brána, žádné poplatky.
--
-- Aby se platba dala spárovat, potřebuje objednávka variabilní symbol.
-- Používáme na to průběžné číslo objednávky, ne náhodné id — zákazník
-- ho přepisuje do banky, když mu QR kód nefunguje.
-- =====================================================================

CREATE SEQUENCE IF NOT EXISTS public.objednavky_cislo_seq START 1000;

ALTER TABLE public.objednavky
  ADD COLUMN IF NOT EXISTS cislo bigint NOT NULL DEFAULT nextval('public.objednavky_cislo_seq');

-- Zákazník musí své číslo objednávky vidět hned po odeslání, ještě než
-- mu přijde e-mail. Proto smí přečíst řádek, který právě založil.
GRANT SELECT ON public.objednavky TO anon;

DROP POLICY IF EXISTS "Objednavku lze precist po zalozeni" ON public.objednavky;
CREATE POLICY "Objednavku lze precist po zalozeni" ON public.objednavky
  FOR SELECT TO anon
  USING (created_at > now() - interval '10 minutes');

GRANT USAGE, SELECT ON SEQUENCE public.objednavky_cislo_seq TO anon, authenticated;

-- Údaje pro platbu. Uloží se jednou v Nastavení a použijí u každé objednávky.
INSERT INTO public.nastaveni (klic, hodnota)
VALUES ('platba', '{"ucet":"","banka":"","iban":"","splatnost_dni":7,"jmeno_prijemce":""}'::jsonb)
ON CONFLICT (klic) DO NOTHING;

-- ---------------------------------------------------------------------
-- E-MAILY
-- Kam chodí upozornění na objednávky, servisní poptávky a zprávy.
-- ---------------------------------------------------------------------
INSERT INTO public.nastaveni (klic, hodnota)
VALUES ('email', '{"prijemce":"cursorbike@seznam.cz","odesilatel":"Cursorbike <onboarding@resend.dev>","potvrzeni_zakaznikovi":true}'::jsonb)
ON CONFLICT (klic) DO NOTHING;

-- ---------------------------------------------------------------------
-- PRÁVNÍ ÚDAJE
-- Jednatel, datová schránka a datum účinnosti podmínek byly natvrdo
-- v kódu jako `null`. Obchodník je teď doplní sám v Nastavení, bez
-- zásahu do webu.
-- ---------------------------------------------------------------------
INSERT INTO public.nastaveni (klic, hodnota)
VALUES ('pravni', '{"jednatel":"","datova_schranka":"","ucinnost_od":""}'::jsonb)
ON CONFLICT (klic) DO NOTHING;
