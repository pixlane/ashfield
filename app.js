// ── Genel site mantığı: veri çekme, render, routing ──────────────────

function gateBox(title, msg) {
  return `
    <div class="gatewrap">
      <div class="skel"><div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div></div>
      <div class="gate">
        <div class="gi"><svg class="ico" width="18" height="18" viewBox="0 0 20 20"><path d="M5 9V6.5C5 4 6.8 2 10 2s5 2 5 4.5V9"/><rect x="3.5" y="9" width="13" height="9" rx="2"/></svg></div>
        <h3>${title}</h3>
        <p>${msg}</p>
        ${currentUser
          ? `<a class="btn-primary" href="#uyelik" style="text-decoration:none; display:inline-block;">Premium Üyeliği İncele</a>`
          : `<a class="btn-primary" href="#giris" style="text-decoration:none; display:inline-block;">Giriş Yap / Kayıt Ol</a>`}
      </div>
    </div>`;
}

// ---------- YAZILAR ----------
async function loadArticles() {
  const list = document.getElementById('articleList');
  list.innerHTML = `<div class="empty">Yükleniyor…</div>`;
  const { data, error } = await sb
    .from('articles')
    .select('id, title, slug, excerpt, category, is_premium, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) { list.innerHTML = `<div class="empty">Yazılar yüklenirken bir sorun oluştu.</div>`; return; }
  if (!data || !data.length) { list.innerHTML = `<div class="empty">Henüz yayınlanmış yazı bulunmuyor.</div>`; return; }

  list.innerHTML = data.map(a => `
    <div class="es-row" style="cursor:pointer;" onclick="go('yazi/${a.slug}')">
      <div class="es-no serif">${a.category ? a.category : ''}</div>
      <div>
        <div class="es-title serif">${a.title} ${a.is_premium ? '🔒' : ''}</div>
        <div class="es-excerpt">${a.excerpt || ''}</div>
      </div>
      <div class="es-date">${a.published_at ? new Date(a.published_at).toLocaleDateString('tr-TR') : ''}</div>
    </div>`).join('');
}

async function loadArticleDetail(slug) {
  const el = document.getElementById('articleDetail');
  el.innerHTML = `<div class="empty">Yükleniyor…</div>`;
  const { data, error } = await sb
    .from('articles').select('*').eq('slug', slug).eq('is_published', true).single();

  if (error || !data) { el.innerHTML = `<div class="empty">Yazı bulunamadı.</div>`; return; }

  if (data.is_premium && !isPremium) {
    el.innerHTML = `
      <h1 class="serif" style="font-size:30px; font-weight:500; margin-bottom:14px;">${data.title}</h1>
      <p style="color:var(--ink-dim); margin-bottom:24px;">${data.excerpt || ''}</p>
      ${gateBox('Bu yazı üyelere özeldir', 'Yazının tamamını okumak için premium üye olun.')}`;
    return;
  }
  el.innerHTML = `
    <h1 class="serif" style="font-size:30px; font-weight:500; margin-bottom:14px;">${data.title}</h1>
    <div style="font-size:15px; color:var(--ink-dim); line-height:1.8; white-space:pre-wrap;">${data.content || data.excerpt || ''}</div>`;
}

// ---------- PORTFÖY ----------
async function loadPortfolioTeaser() {
  const el = document.getElementById('homeHoldings');
  const { data, error } = await sb
    .from('portfolio')
    .select('ticker, company_name, portfolio_weight')
    .eq('status', 'public_teaser')
    .order('portfolio_weight', { ascending: false });

  if (error || !data || !data.length) {
    el.innerHTML = `<div class="empty">Henüz portföy pozisyonu bulunmuyor.</div>`;
    document.getElementById('lockedPosNote').textContent = '';
    return;
  }
  el.innerHTML = data.map((p, i) => `
    <div class="hold-row" style="${i === data.length - 1 ? 'border-bottom:none;' : ''}">
      <div class="hold-num">0${i + 1}</div>
      <div><div class="hold-tick">${p.ticker}</div><div class="hold-sub">${p.company_name || ''}</div></div>
      <div class="hold-w"><div class="pct">%${p.portfolio_weight}</div><div class="bar-wrap"><div class="bar-fill" style="width:${p.portfolio_weight}%;"></div></div></div>
    </div>`).join('');
  document.getElementById('lockedPosNote').innerHTML = `🔒 Portföyün tamamı üyelere özel`;
}

async function loadPortfolioFull() {
  const el = document.getElementById('portfoyFull');
  if (!currentUser) { el.innerHTML = gateBox('Portföy arşivi üyelere özeldir', 'Pozisyonların tamamını, maliyetlerimi ve notlarımı görmek için giriş yapın.'); return; }
  if (!isPremium) { el.innerHTML = gateBox('Portföy arşivi premium üyelere özeldir', 'Pozisyonların tamamını, maliyetlerimi ve notlarımı görmek için premium üye olun.'); return; }

  const { data, error } = await sb
    .from('portfolio').select('*').order('portfolio_weight', { ascending: false });
  if (error) { el.innerHTML = `<div class="empty">Portföy yüklenirken bir sorun oluştu.</div>`; return; }
  if (!data || !data.length) { el.innerHTML = `<div class="empty">Henüz portföy pozisyonu bulunmuyor.</div>`; return; }

  el.innerHTML = data.map(p => `
    <div class="hold-row">
      <div class="hold-num">${p.ticker}</div>
      <div><div class="hold-tick">${p.company_name}</div><div class="hold-sub">${p.shares} hisse · maliyet $${p.average_cost} · giriş ${p.entry_date || '—'}</div><div class="hold-sub">${p.notes || ''}</div></div>
      <div class="hold-w"><div class="pct">%${p.portfolio_weight}</div></div>
    </div>`).join('');
}

// ---------- İZLEME LİSTESİ ----------
async function loadWatchlistTeaser() {
  const { count } = await sb.from('watchlist').select('*', { count: 'exact', head: true });
  document.getElementById('wlCountHome').textContent = (count ?? '—') + ' şirket';
}

async function loadWatchlistFull() {
  const el = document.getElementById('izlemeFull');
  if (!currentUser) { el.innerHTML = gateBox('İzleme listesi üyelere özeldir', 'Listedeki şirketleri ve notlarımı görmek için giriş yapın.'); return; }
  if (!isPremium) { el.innerHTML = gateBox('İzleme listesi premium üyelere özeldir', 'Listedeki şirketleri ve notlarımı görmek için premium üye olun.'); return; }

  const { data, error } = await sb.from('watchlist').select('*').order('ticker');
  if (error) { el.innerHTML = `<div class="empty">İzleme listesi yüklenirken bir sorun oluştu.</div>`; return; }
  if (!data || !data.length) { el.innerHTML = `<div class="empty">İzleme listesinde henüz şirket yok.</div>`; return; }

  el.innerHTML = data.map(w => `
    <div class="hold-row">
      <div class="hold-num">${w.ticker}</div>
      <div><div class="hold-tick">${w.company_name}</div><div class="hold-sub">${w.thesis || ''}</div></div>
      <div class="hold-w"><div class="pct">${w.target_price ? '$' + w.target_price : '—'}</div></div>
    </div>`).join('');
}

// ---------- ŞİRKET ANALİZLERİ ----------
async function loadAnalyses() {
  const el = document.getElementById('analysesList');
  const { data, error } = await sb
    .from('company_analyses')
    .select('ticker, company_name, slug, summary, is_premium')
    .eq('is_published', true).order('ticker');

  if (error) { el.innerHTML = `<div class="empty">Analizler yüklenirken bir sorun oluştu.</div>`; return; }
  if (!data || !data.length) { el.innerHTML = `<div class="empty">Henüz yayınlanmış analiz bulunmuyor.</div>`; return; }

  el.innerHTML = data.map(a => `
    <div class="es-row" style="cursor:pointer;" onclick="go('analiz/${a.slug}')">
      <div class="es-no serif">${a.ticker}</div>
      <div><div class="es-title serif">${a.company_name} ${a.is_premium ? '🔒' : ''}</div><div class="es-excerpt">${a.summary || ''}</div></div>
      <div></div>
    </div>`).join('');
}

async function loadAnalysisDetail(slug) {
  const el = document.getElementById('analysisDetail');
  const { data, error } = await sb.from('company_analyses').select('*').eq('slug', slug).eq('is_published', true).single();
  if (error || !data) { el.innerHTML = `<div class="empty">Analiz bulunamadı.</div>`; return; }

  const header = `<h1 class="serif" style="font-size:28px; font-weight:500; margin-bottom:6px;">${data.company_name} <span style="color:var(--ink-faint); font-size:20px;">${data.ticker}</span></h1><p style="color:var(--ink-dim); margin-bottom:24px;">${data.summary || ''}</p>`;

  if (data.is_premium && !isPremium) {
    el.innerHTML = header + gateBox('Detaylı analiz üyelere özeldir', 'Yatırım tezi, bull/bear senaryoları, katalizörler ve riskleri görmek için premium üye olun.');
    return;
  }
  const block = (label, val) => val ? `<div style="margin-bottom:20px;"><div style="font-weight:600; margin-bottom:6px;">${label}</div><div style="color:var(--ink-dim); line-height:1.7; white-space:pre-wrap;">${val}</div></div>` : '';
  el.innerHTML = header
    + block('Yatırım Tezi', data.investment_thesis)
    + block('Bull Case', data.bull_case)
    + block('Bear Case', data.bear_case)
    + block('Katalizörler', data.catalysts)
    + block('Riskler', data.risks)
    + block('Çıkış Koşulları', data.exit_conditions);
}

// ---------- LOGIN / REGISTER ----------
function showAuthMsg(msg, ok) {
  const el = document.getElementById('authMsg');
  el.textContent = msg;
  el.style.color = ok ? '#1E7A54' : '#A5433C';
}
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  const { error } = await signIn(email, pass);
  if (error) return showAuthMsg(error.message, false);
  showAuthMsg('Giriş başarılı.', true);
  go('hesabim');
}
async function doRegister() {
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const name = document.getElementById('regName').value.trim();
  const { error } = await signUp(email, pass, name);
  if (error) return showAuthMsg(error.message, false);
  showAuthMsg('Kayıt başarılı — e-postanı onayladıktan sonra giriş yapabilirsin.', true);
}
function toggleAuthForm(which) {
  document.getElementById('loginForm').style.display = which === 'login' ? 'block' : 'none';
  document.getElementById('regForm').style.display = which === 'register' ? 'block' : 'none';
  document.querySelectorAll('.authtab').forEach(t => t.classList.toggle('on', t.dataset.tab === which));
}

// ---------- HESABIM ----------
function renderAccount() {
  const el = document.getElementById('accountBox');
  if (!currentUser) { el.innerHTML = gateBox('Hesabım', 'Bu sayfayı görmek için giriş yapmalısın.'); return; }
  el.innerHTML = `
    <div class="hold-row"><div class="hold-num">E-posta</div><div>${currentUser.email}</div><div></div></div>
    <div class="hold-row"><div class="hold-num">Ad</div><div>${currentProfile?.full_name || '—'}</div><div></div></div>
    <div class="hold-row"><div class="hold-num">Rol</div><div>${currentProfile?.role || 'user'}</div><div></div></div>
    <div class="hold-row" style="border-bottom:none;"><div class="hold-num">Üyelik</div><div>${isPremium ? 'Premium (aktif)' : 'Premium değil'}</div><div></div></div>
    <div style="margin-top:20px;"><button class="btn-outline" onclick="signOut()">Çıkış Yap</button></div>`;
}

// ---------- ROUTER ----------
function go(p) { location.hash = '#' + p; }

async function route() {
  let hash = (location.hash || '#home').replace('#', '');
  const [base, sub] = hash.split('/');
  const valid = ['home','yazilar','yazi','portfoy','izleme','analizler','analiz','uyelik','iletisim','giris','hesabim','admin'];
  const page = valid.includes(base) ? base : 'home';

  document.querySelectorAll('.page').forEach(el => el.classList.toggle('on', el.dataset.page === page));
  document.querySelectorAll('.navlinks a').forEach(a => a.classList.toggle('on', a.dataset.p === page));
  window.scrollTo(0, 0);

  if (page === 'home') { loadPortfolioTeaser(); loadWatchlistTeaser(); }
  if (page === 'yazilar') loadArticles();
  if (page === 'yazi' && sub) loadArticleDetail(sub);
  if (page === 'portfoy') loadPortfolioFull();
  if (page === 'izleme') loadWatchlistFull();
  if (page === 'analizler') loadAnalyses();
  if (page === 'analiz' && sub) loadAnalysisDetail(sub);
  if (page === 'hesabim') renderAccount();
  if (page === 'admin') { if (typeof renderAdmin === 'function') renderAdmin(); }
}
window.addEventListener('hashchange', route);

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

async function boot() {
  await initAuth();
  await route();
}
