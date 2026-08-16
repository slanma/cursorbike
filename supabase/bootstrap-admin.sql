-- =====================================================================
-- JEDNORÁZOVÝ SKRIPT — přidělení role admin prvnímu uživateli
--
-- ⚠️ TOHLE NENÍ MIGRACE a nepatří do supabase/migrations/.
-- Spouští se ručně v SQL Editoru, jednou, po registraci prvního účtu.
--
-- PROČ TO JE POTŘEBA:
-- Tabulka `user_roles` má jedinou RLS policy — „Users can view own roles" (SELECT).
-- Žádná policy nedovoluje INSERT z aplikace. Nově zaregistrovaný uživatel tedy
-- nemá roli `admin` a `/admin` ho nepustí dál. Zároveň neexistuje způsob, jak si
-- roli přidělit z webu — je to slepá ulička, ze které vede ven jen SQL Editor
-- (běží pod rolí postgres, která RLS obchází).
--
-- Tohle je bezpečnostně správně navržené: kdyby si roli mohl vložit kdokoli
-- přihlášený, byla by administrace otevřená každému, kdo se zaregistruje.
-- =====================================================================

-- POSTUP:
-- 1) Na webu otevřít /auth a zaregistrovat účet, který má být správcem.
-- 2) Níže vyplnit stejný e-mail.
-- 3) Spustit celý skript v SQL Editoru nového projektu.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'DOPLNIT@email.cz'   -- ⬅️ e-mail registrovaného účtu
ON CONFLICT (user_id, role) DO NOTHING;

-- KONTROLA — musí vrátit jeden řádek s rolí admin:
SELECT u.email, r.role, r.created_at
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id
ORDER BY r.created_at;

-- Pokud kontrola nevrátí nic, účet se zatím nezaregistroval nebo je jiný e-mail.
-- Seznam existujících účtů:
--   SELECT id, email, created_at, email_confirmed_at FROM auth.users ORDER BY created_at;

-- Další správce už lze přidávat z webu přes /admin/spravci
-- (to běží přes service role, takže RLS neřeší).
