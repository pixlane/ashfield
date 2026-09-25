// ── Admin paneli: Supabase insert / update / delete ─────────────────
// Not: Bu panel yalnızca frontend'de role==='admin' kontrolü yapar.
// Gerçek güvenlik Supabase RLS politikalarındadır — bir kullanıcı
// tarayıcıdan "role=admin" yazsa bile insert/update/delete
// sorguları RLS tarafından reddedilir.

async function renderAdmin() {
  const box = document.getElementById('adminBox');
  if (!currentUser) { box.innerHTML = gateBox('Yönetim paneli', 'Bu sayfayı görmek için giriş yapmalısın.'); return; }
  if (!isAdmin()) { box.innerHTML = `<div class="empty">Bu sayfa yalnızca yöneticiler içindir.</div>`; return; }

  box.innerHTML = `
    <div class="aform">
      <h3>Yeni Yazı</h3>
      <div class="row"><input id="aTitle" placeholder="Başlık"><input id="aSlug" placeholder="slug (ör. tahvil-getirisi)"></div>
      <div class="row"><input id="aCategory" placeholder="Kategori"><label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="aPremium" style="width:auto; flex:none;"> Premium</label><label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="aPublished" checked style="width:auto; flex:none;"> Yayınla</label></div>
      <div class="row"><input id="aExcerpt" placeholder="Kısa özet"></div>
      <div class="row"><textarea id="aContent" placeholder="İçerik"></textarea></div>
      <button onclick="addArticle()">Ekle</button>
      <div class="alist" id="adminArticleList"></div>
    </div>

    <div class="aform">
      <h3>Portföy Pozisyonu</h3>
      <div class="row"><input id="pTick" placeholder="Ticker" style="max-width:110px;"><input id="pName" placeholder="Şirket adı"><input id="pShares" placeholder="Hisse adedi" style="max-width:120px;"><input id="pCost" placeholder="Ort. maliyet" style="max-width:120px;"></div>
      <div class="row"><input id="pWeight" placeholder="Ağırlık (%)" style="max-width:120px;"><input id="pDate" placeholder="Giriş tarihi (YYYY-MM-DD)" style="max-width:180px;"><select id="pStatus" style="padding:9px; border:1px solid var(--rule); border-radius:6px;"><option value="public_teaser">Görünür (teaser)</option><option value="premium_only">Sadece premium</option></select></div>
      <div class="row"><input id="pNotes" placeholder="Not"></div>
      <button onclick="addPosition()">Ekle</button>
      <div class="alist" id="adminPosList"></div>
    </div>

    <div class="aform">
      <h3>İzleme Listesi Şirketi</h3>
      <div class="row"><input id="wTick" placeholder="Ticker" style="max-width:110px;"><input id="wName" placeholder="Şirket adı"><input id="wTarget" placeholder="Hedef fiyat" style="max-width:120px;"></div>
      <div class="row"><input id="wThesis" placeholder="Neden izliyorum"></div>
      <button onclick="addWatch()">Ekle</button>
      <div class="alist" id="adminWatchList"></div>
    </div>

    <div class="aform">
      <h3>Şirket Analizi</h3>
      <div class="row"><input id="cTick" placeholder="Ticker" style="max-width:110px;"><input id="cName" placeholder="Şirket adı"><input id="cSlug" placeholder="slug"></div>
      <div class="row"><input id="cSummary" placeholder="Kısa özet (herkese açık)"></div>
      <div class="row"><textarea id="cThesis" placeholder="Yatırım tezi"></textarea></div>
      <div class="row"><textarea id="cBull" placeholder="Bull case"></textarea><textarea id="cBear" placeholder="Bear case"></textarea></div>
      <div class="row"><textarea id="cCatalysts" placeholder="Katalizörler"></textarea><textarea id="cRisks" placeholder="Riskler"></textarea></div>
      <div class="row"><textarea id="cExit" placeholder="Çıkış koşulları"></textarea></div>
      <div class="row"><label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="cPremium" checked style="width:auto; flex:none;"> Premium</label><label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="cPublished" checked style="width:auto; flex:none;"> Yayınla</label></div>
      <button onclick="addAnalysis()">Ekle</button>
      <div class="alist" id="adminAnalysisList"></div>
    </div>`;

  loadAdminLists();
}

async function loadAdminLists() {
  const { data: arts } = await sb.from('articles').select('id,title,is_premium,is_published').order('created_at', { ascending: false });
  document.getElementById('adminArticleList').innerHTML = (arts || []).map(a => `
    <div class="arow"><span>${a.title} ${a.is_premium ? '🔒' : ''} ${!a.is_published ? '(taslak)' : ''}</span><button class="del" onclick="delRow('articles','${a.id}','adminArticleList')">Sil</button></div>`).join('') || '<div class="empty">Kayıt yok.</div>';

  const { data: pos } = await sb.from('portfolio').select('id,ticker,company_name,portfolio_weight,status').order('portfolio_weight', { ascending: false });
  document.getElementById('adminPosList').innerHTML = (pos || []).map(p => `
    <div class="arow"><span>${p.ticker} — %${p.portfolio_weight} — ${p.company_name} (${p.status})</span><button class="del" onclick="delRow('portfolio','${p.id}','adminPosList')">Sil</button></div>`).join('') || '<div class="empty">Kayıt yok.</div>';

  const { data: wl } = await sb.from('watchlist').select('id,ticker,company_name').order('ticker');
  document.getElementById('adminWatchList').innerHTML = (wl || []).map(w => `
    <div class="arow"><span>${w.ticker} — ${w.company_name}</span><button class="del" onclick="delRow('watchlist','${w.id}','adminWatchList')">Sil</button></div>`).join('') || '<div class="empty">Kayıt yok.</div>';

  const { data: an } = await sb.from('company_analyses').select('id,ticker,company_name,is_premium,is_published').order('ticker');
  document.getElementById('adminAnalysisList').innerHTML = (an || []).map(a => `
    <div class="arow"><span>${a.ticker} — ${a.company_name} ${a.is_premium ? '🔒' : ''} ${!a.is_published ? '(taslak)' : ''}</span><button class="del" onclick="delRow('company_analyses','${a.id}','adminAnalysisList')">Sil</button></div>`).join('') || '<div class="empty">Kayıt yok.</div>';
}

async function delRow(table, id, listId) {
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) return toast('Silinemedi: ' + error.message);
  toast('Silindi.');
  loadAdminLists();
}

async function addArticle() {
  const row = {
    title: document.getElementById('aTitle').value.trim(),
    slug: document.getElementById('aSlug').value.trim(),
    excerpt: document.getElementById('aExcerpt').value.trim(),
    content: document.getElementById('aContent').value.trim(),
    category: document.getElementById('aCategory').value.trim(),
    is_premium: document.getElementById('aPremium').checked,
    is_published: document.getElementById('aPublished').checked,
    published_at: new Date().toISOString()
  };
  if (!row.title || !row.slug) return toast('Başlık ve slug zorunlu.');
  const { error } = await sb.from('articles').insert(row);
  if (error) return toast('Eklenemedi: ' + error.message);
  toast('Yazı eklendi.'); loadAdminLists();
}

async function addPosition() {
  const row = {
    ticker: document.getElementById('pTick').value.trim().toUpperCase(),
    company_name: document.getElementById('pName').value.trim(),
    shares: parseFloat(document.getElementById('pShares').value) || null,
    average_cost: parseFloat(document.getElementById('pCost').value) || null,
    portfolio_weight: parseFloat(document.getElementById('pWeight').value) || 0,
    entry_date: document.getElementById('pDate').value.trim() || null,
    status: document.getElementById('pStatus').value,
    notes: document.getElementById('pNotes').value.trim()
  };
  if (!row.ticker) return toast('Ticker zorunlu.');
  const { error } = await sb.from('portfolio').insert(row);
  if (error) return toast('Eklenemedi: ' + error.message);
  toast('Pozisyon eklendi.'); loadAdminLists();
}

async function addWatch() {
  const row = {
    ticker: document.getElementById('wTick').value.trim().toUpperCase(),
    company_name: document.getElementById('wName').value.trim(),
    target_price: parseFloat(document.getElementById('wTarget').value) || null,
    thesis: document.getElementById('wThesis').value.trim()
  };
  if (!row.ticker) return toast('Ticker zorunlu.');
  const { error } = await sb.from('watchlist').insert(row);
  if (error) return toast('Eklenemedi: ' + error.message);
  toast('Şirket eklendi.'); loadAdminLists();
}

async function addAnalysis() {
  const row = {
    ticker: document.getElementById('cTick').value.trim().toUpperCase(),
    company_name: document.getElementById('cName').value.trim(),
    slug: document.getElementById('cSlug').value.trim(),
    summary: document.getElementById('cSummary').value.trim(),
    investment_thesis: document.getElementById('cThesis').value.trim(),
    bull_case: document.getElementById('cBull').value.trim(),
    bear_case: document.getElementById('cBear').value.trim(),
    catalysts: document.getElementById('cCatalysts').value.trim(),
    risks: document.getElementById('cRisks').value.trim(),
    exit_conditions: document.getElementById('cExit').value.trim(),
    is_premium: document.getElementById('cPremium').checked,
    is_published: document.getElementById('cPublished').checked
  };
  if (!row.ticker || !row.slug) return toast('Ticker ve slug zorunlu.');
  const { error } = await sb.from('company_analyses').insert(row);
  if (error) return toast('Eklenemedi: ' + error.message);
  toast('Analiz eklendi.'); loadAdminLists();
}
