
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
-- has_role is needed by RLS; keep executable but ensure search_path is set (already is)
