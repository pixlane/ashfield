// ── Auth & session yönetimi ──────────────────────────────────────────
let currentUser = null;      // supabase auth user
let currentProfile = null;   // public.profiles satırı (email, full_name, role)
let isPremium = false;       // is_premium_user() RPC sonucu

async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  await handleSession(session);
  sb.auth.onAuthStateChange(async (_event, session) => {
    await handleSession(session);
    renderAuthUI();
    route();
  });
  renderAuthUI();
}

async function handleSession(session) {
  currentUser = session?.user || null;
  currentProfile = null;
  isPremium = false;
  if (!currentUser) return;

  const { data: profile, error: profErr } = await sb
    .from('profiles').select('*').eq('id', currentUser.id).single();
  if (!profErr) currentProfile = profile;

  const { data: premiumData, error: premErr } = await sb.rpc('is_premium_user');
  if (!premErr) isPremium = !!premiumData;
}

function isAdmin() {
  return currentProfile?.role === 'admin';
}

async function signUp(email, password, fullName) {
  return sb.auth.signUp({
    email, password,
    options: { data: { full_name: fullName } }
  });
}

async function signIn(email, password) {
  return sb.auth.signInWithPassword({ email, password });
}

async function signOut() {
  await sb.auth.signOut();
  go('home');
}

// ── Navbar'ı auth durumuna göre güncelle ────────────────────────────
function renderAuthUI() {
  const el = document.getElementById('navAuth');
  if (!el) return;
  if (!currentUser) {
    el.innerHTML = `<a href="#giris" data-p="giris">Üye Girişi</a>`;
  } else {
    const premiumPill = isPremium ? `<span class="premium-pill">Premium Üye</span>` : '';
    el.innerHTML = `
      ${premiumPill}
      <a href="#hesabim" data-p="hesabim">Hesabım</a>
      <a href="#" onclick="signOut(); return false;">Çıkış</a>`;
  }
  const adminLink = document.getElementById('navAdmin');
  if (adminLink) adminLink.style.display = isAdmin() ? '' : 'none';
}
