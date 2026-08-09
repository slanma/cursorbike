-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- KATEGORIE
CREATE TABLE public.kategorie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nazev text NOT NULL,
  sekce text NOT NULL DEFAULT 'kola',
  znacka text,
  poradi integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.kategorie TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kategorie TO authenticated;
GRANT ALL ON public.kategorie TO service_role;
ALTER TABLE public.kategorie ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kategorie jsou verejne" ON public.kategorie FOR SELECT USING (true);
CREATE POLICY "Admin spravuje kategorie" ON public.kategorie FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER kategorie_updated_at BEFORE UPDATE ON public.kategorie FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRODUKTY
CREATE TABLE public.produkty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nazev text NOT NULL,
  kategorie_id uuid REFERENCES public.kategorie(id) ON DELETE SET NULL,
  cena integer NOT NULL DEFAULT 0,
  puvodni_cena integer,
  kratky text NOT NULL DEFAULT '',
  popis text NOT NULL DEFAULT '',
  obrazek_url text,
  oblibene boolean NOT NULL DEFAULT false,
  aktivni boolean NOT NULL DEFAULT true,
  pro_koho text[] NOT NULL DEFAULT '{}',
  neni_pro_koho text,
  parametry jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.produkty TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produkty TO authenticated;
GRANT ALL ON public.produkty TO service_role;
ALTER TABLE public.produkty ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aktivni produkty jsou verejne" ON public.produkty FOR SELECT USING (aktivni = true);
CREATE POLICY "Admin spravuje produkty" ON public.produkty FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER produkty_updated_at BEFORE UPDATE ON public.produkty FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- OBJEDNAVKY
CREATE TABLE public.objednavky (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jmeno text NOT NULL,
  email text NOT NULL,
  telefon text,
  poznamka text,
  celkem integer NOT NULL DEFAULT 0,
  stav text NOT NULL DEFAULT 'nova',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.objednavky TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objednavky TO authenticated;
GRANT ALL ON public.objednavky TO service_role;
ALTER TABLE public.objednavky ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kdokoli muze odeslat objednavku" ON public.objednavky FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin spravuje objednavky" ON public.objednavky FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER objednavky_updated_at BEFORE UPDATE ON public.objednavky FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.objednavka_polozky (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objednavka_id uuid NOT NULL REFERENCES public.objednavky(id) ON DELETE CASCADE,
  nazev text NOT NULL,
  slug text,
  cena integer NOT NULL DEFAULT 0,
  pocet integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.objednavka_polozky TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objednavka_polozky TO authenticated;
GRANT ALL ON public.objednavka_polozky TO service_role;
ALTER TABLE public.objednavka_polozky ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kdokoli muze vlozit polozky" ON public.objednavka_polozky FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin spravuje polozky" ON public.objednavka_polozky FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SERVISNI POPTAVKY
CREATE TABLE public.servis_poptavky (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jmeno text NOT NULL,
  email text NOT NULL,
  telefon text,
  typ_sluzby text,
  popis text,
  termin text,
  stav text NOT NULL DEFAULT 'nova',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.servis_poptavky TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servis_poptavky TO authenticated;
GRANT ALL ON public.servis_poptavky TO service_role;
ALTER TABLE public.servis_poptavky ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kdokoli muze poslat poptavku" ON public.servis_poptavky FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin spravuje poptavky" ON public.servis_poptavky FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER servis_poptavky_updated_at BEFORE UPDATE ON public.servis_poptavky FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STORAGE POLICIES
CREATE POLICY "Admin cte fotky produktu" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'produkty' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin nahrava fotky produktu" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'produkty' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin upravuje fotky produktu" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'produkty' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin maze fotky produktu" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'produkty' AND public.has_role(auth.uid(), 'admin'));