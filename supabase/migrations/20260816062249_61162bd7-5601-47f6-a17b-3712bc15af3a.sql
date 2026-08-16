CREATE TABLE public.zpravy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jmeno TEXT NOT NULL,
  email TEXT NOT NULL,
  telefon TEXT,
  zprava TEXT NOT NULL,
  stav TEXT NOT NULL DEFAULT 'nova',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zpravy TO authenticated;
GRANT INSERT ON public.zpravy TO anon;
GRANT ALL ON public.zpravy TO service_role;
ALTER TABLE public.zpravy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kdokoli muze odeslat zpravu" ON public.zpravy FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admini ctou zpravy" ON public.zpravy FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admini upravuji zpravy" ON public.zpravy FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admini mazou zpravy" ON public.zpravy FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));