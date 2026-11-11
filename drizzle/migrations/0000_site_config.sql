CREATE TABLE public.site_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_config TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_config TO authenticated;
GRANT ALL ON public.site_config TO service_role;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads site config" ON public.site_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert site config" ON public.site_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update site config" ON public.site_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.site_config (id, data) VALUES (1, '{}'::jsonb);