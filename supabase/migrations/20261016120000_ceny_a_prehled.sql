-- =====================================================================
-- Cursorbike — ceny pravidlem a měsíční přehled
--
-- cena_rucne: obchodník cenu u kola napsal sám. Takovou cenu pravidlo
-- ani měsíční přehled nikdy nepřepíšou.
--
-- Pravidla cen a datum posledního přehledu se ukládají do tabulky
-- nastaveni (klíče cenova-pravidla a mesicni-prehled), proto tu nejsou.
-- =====================================================================

ALTER TABLE public.produkty
  ADD COLUMN IF NOT EXISTS cena_rucne boolean NOT NULL DEFAULT false;

-- Ochrana cen, které už na webu jsou: pravidlo nesmí přepsat nic, co
-- obchodník nastavil dřív. Za ruční cenu proto bereme:
--  - kola převzatá ze starého webu (dodavatel cursorbike) — to jsou vaše ceny,
--  - kola bez ceny od dodavatele (zadaná ručně),
--  - kola, kde se cena na webu liší od ceny dodavatele (někdo ji upravil).
UPDATE public.produkty
SET cena_rucne = true
WHERE dodavatel = 'cursorbike'
   OR dodavatel IS NULL
   OR cena_feed IS NULL
   OR cena <> cena_feed;

-- Odkazy na feedy dodavatelů často obsahují heslo (Author: …&heslo=…).
-- Nastavení bylo dosud čitelné pro kohokoli; profily dodavatelů teď uvidí
-- jen správci. Ostatní nastavení (údaje o obchodě, platba) zůstává veřejné,
-- protože ho web potřebuje zobrazit zákazníkům.
DROP POLICY IF EXISTS "Nastaveni je verejne ke cteni" ON public.nastaveni;
CREATE POLICY "Nastaveni je verejne ke cteni" ON public.nastaveni
  FOR SELECT USING (klic <> 'feed-profily');
