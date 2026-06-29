CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND tenant_id = public.current_tenant_id()
  )
$function$;

CREATE POLICY "Tenant members insert own invoices"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = (public.current_tenant_id())::text
);

CREATE POLICY "Tenant members update own invoices"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = (public.current_tenant_id())::text
)
WITH CHECK (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = (public.current_tenant_id())::text
);

CREATE POLICY "Tenant members delete own invoices"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = (public.current_tenant_id())::text
);