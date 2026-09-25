// ── Supabase bağlantısı — TEK KAYNAK ────────────────────────────────
// Bu dosyadaki key, Supabase "publishable" (anon/public) key'dir.
// Frontend'de görünmesi normaldir; GÜVENLİK BURADA DEĞİL, Supabase
// tarafındaki RLS (Row Level Security) politikalarındadır.
// service_role / secret key BU DOSYAYA ASLA EKLENMEYECEK.

const SUPABASE_URL = 'https://vdgnczutriexanwqewap.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-5M4Jza181LXAf1npjfggQ_BFYGnlcc';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});
