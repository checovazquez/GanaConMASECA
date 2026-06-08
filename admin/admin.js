/* =========================================================================
   admin.js — Dashboard administrativo de Gana con MASECA
   Depende de: ../firebase-config.js (ADMIN_EMAIL, firebase inicializado)
   ========================================================================= */

const db   = firebase.firestore();
const auth = firebase.auth();

/* ── DOM refs ─────────────────────────────────────────────────────────── */
const adminLogin   = document.getElementById('adminLogin');
const adminApp     = document.getElementById('adminApp');
const aEmail       = document.getElementById('aEmail');
const aPassword    = document.getElementById('aPassword');
const aMsg         = document.getElementById('aMsg');
const aLoginBtn    = document.getElementById('aLoginBtn');
const aLogoutBtn   = document.getElementById('aLogoutBtn');
const aAdminEmail  = document.getElementById('aAdminEmail');

const kpiTotalSpins   = document.getElementById('kpiTotalSpins');
const kpiTotalWinners = document.getElementById('kpiTotalWinners');
const kpiActiveStores = document.getElementById('kpiActiveStores');
const kpiTodaySpins   = document.getElementById('kpiTodaySpins');

const chartHours  = document.getElementById('chartHours');
const rankingList = document.getElementById('rankingList');
const logsBody    = document.getElementById('logsBody');
const logsEmpty   = document.getElementById('logsEmpty');
const filterStore  = document.getElementById('filterStore');
const filterResult = document.getElementById('filterResult');
const btnExportAll = document.getElementById('btnExportAll');
const btnRefresh   = document.getElementById('btnRefresh');

const adminCfgForm      = document.getElementById('adminCfgForm');
const aCfgWinnersTotal  = document.getElementById('aCfgWinnersTotal');
const aCfgWinProbX      = document.getElementById('aCfgWinProbX');
const aCfgMsg           = document.getElementById('aCfgMsg');

/* ── Estado ───────────────────────────────────────────────────────────── */
let allSpins  = [];
let adminUser = null;

/* ── Auto-refresh (cada 5 min) ────────────────────────────────────────── */
const REFRESH_INTERVAL = 5 * 60;   // segundos
let _refreshTimer    = null;
let _countdownSecs   = REFRESH_INTERVAL;
let _lastRefreshTime = null;

const refreshStatus = document.getElementById('refreshStatus');

function _startAutoRefresh() {
  _stopAutoRefresh();
  _countdownSecs = REFRESH_INTERVAL;
  _tickCountdown();
  _refreshTimer = setInterval(() => {
    _countdownSecs--;
    if (_countdownSecs <= 0) {
      _countdownSecs = REFRESH_INTERVAL;
      loadDashboard();
    }
    _tickCountdown();
  }, 1000);
}

function _stopAutoRefresh() {
  if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
}

function _tickCountdown() {
  if (!refreshStatus) return;
  const mm  = String(Math.floor(_countdownSecs / 60)).padStart(2, '0');
  const ss  = String(_countdownSecs % 60).padStart(2, '0');
  const ts  = _lastRefreshTime
    ? _lastRefreshTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';
  refreshStatus.innerHTML =
    `Última actualización: <strong>${ts}</strong> &nbsp;|&nbsp; próxima en <span class="a-refresh-countdown">${mm}:${ss}</span>`;
}

/* ── Auth ─────────────────────────────────────────────────────────────── */
auth.onAuthStateChanged(user => {
  if (user && user.email === ADMIN_EMAIL) {
    adminUser = user;
    if (aAdminEmail) aAdminEmail.textContent = user.email;
    adminLogin.style.display = 'none';
    adminApp.style.display   = 'block';
    loadDashboard();
    _startAutoRefresh();
    setTimeout(() => { if (_map) _map.invalidateSize(); }, 300);
  } else if (user) {
    // Usuario autenticado pero no es admin
    auth.signOut();
    showMsg('Esta página es solo para administradores.');
  } else {
    _stopAutoRefresh();
    adminLogin.style.display = 'flex';
    adminApp.style.display   = 'none';
  }
});

/* ── Login ────────────────────────────────────────────────────────────── */
function doAdminLogin() {
  const email = (aEmail?.value || '').trim();
  const pwd   = (aPassword?.value || '').trim();
  if (!email || !pwd) { showMsg('Ingresa usuario y contraseña.'); return; }

  aLoginBtn.disabled    = true;
  aLoginBtn.textContent = 'Verificando…';
  showMsg('');

  auth.signInWithEmailAndPassword(email, pwd)
    .then(cred => {
      if (cred.user.email !== ADMIN_EMAIL) {  // ADMIN_EMAIL = sergiovazquezdezamacona@gmail.com
        auth.signOut();
        showMsg('No tienes acceso al panel de administrador.');
        aLoginBtn.disabled    = false;
        aLoginBtn.textContent = 'Entrar';
      }
    })
    .catch(e => {
      aLoginBtn.disabled    = false;
      aLoginBtn.textContent = 'Entrar';
      showMsg(authErr(e.code));
    });
}

aLoginBtn && aLoginBtn.addEventListener('click', doAdminLogin);
aPassword && aPassword.addEventListener('keydown', e => { if (e.key === 'Enter') doAdminLogin(); });

function showMsg(msg) { if (aMsg) aMsg.textContent = msg; }

function authErr(code) {
  const m = {
    'auth/user-not-found':     'Usuario no encontrado.',
    'auth/wrong-password':     'Contraseña incorrecta.',
    'auth/invalid-credential': 'Credenciales incorrectas.',
    'auth/too-many-requests':  'Demasiados intentos. Espera un momento.',
  };
  return m[code] || `Error (${code})`;
}

aLogoutBtn && aLogoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => window.location.reload());
});

/* ── Carga principal ──────────────────────────────────────────────────── */
async function loadDashboard() {
  try {
    await Promise.all([loadSpins(), loadConfig()]);
    _lastRefreshTime = new Date();
    renderAll();
  } catch(e) {
    console.error('Error cargando dashboard:', e);
  }
}

const SPINS_LIMIT = 2000;

async function loadSpins() {
  const snap = await db.collection('spins')
    .orderBy('timestamp', 'desc')
    .limit(SPINS_LIMIT)
    .get();

  allSpins = snap.docs.map(doc => {
    const d  = doc.data();
    const ts = d.timestamp ? d.timestamp.toDate() : null;
    const email = d.storeEmail || '—';
    return {
      id:          doc.id,
      storeEmail:  email,
      storeName:   storeName(email),          // nombre completo para mostrar
      result:      d.result      || '—',
      isWinner:    d.isWinner    || false,
      date:        d.date        || '',
      hour:        typeof d.hour === 'number' ? d.hour : (ts ? ts.getHours() : 0),
      ts,
      timestamp:   d.timestamp   || null,
      lat:         d.lat         ?? null,
      lon:         d.lon         ?? null,
      geoAccuracy: d.geoAccuracy ?? null
    };
  });
}

async function loadConfig() {
  const doc = await db.collection('config').doc('global').get();
  if (doc.exists) {
    const d = doc.data();
    if (aCfgWinnersTotal) aCfgWinnersTotal.value = d.winnersTotal ?? 10;
    if (aCfgWinProbX)     aCfgWinProbX.value     = d.winProbX    ?? 10;
  }
}

/* ── Render ───────────────────────────────────────────────────────────── */
function renderAll() {
  renderKPIs();
  renderHourChart();
  renderRanking();
  renderProgress();
  renderTable();
  _initMapSection();
}

function renderKPIs() {
  const today = new Date().toISOString().slice(0, 10);

  const total    = allSpins.length;
  const winners  = allSpins.filter(s => s.isWinner).length;
  const stores   = new Set(allSpins.map(s => s.storeEmail)).size;
  const todayCnt = allSpins.filter(s => s.date === today).length;

  if (kpiTotalSpins)   kpiTotalSpins.textContent   = total.toLocaleString('es-MX');
  if (kpiTotalWinners) kpiTotalWinners.textContent  = winners.toLocaleString('es-MX');
  if (kpiActiveStores) kpiActiveStores.textContent  = stores.toLocaleString('es-MX');
  if (kpiTodaySpins)   kpiTodaySpins.textContent    = todayCnt.toLocaleString('es-MX');
}

function renderHourChart() {
  if (!chartHours) return;

  // Contar giros por hora (0–23)
  const counts = Array(24).fill(0);
  allSpins.forEach(s => { counts[s.hour]++; });
  const max = Math.max(...counts, 1);

  chartHours.innerHTML = counts.map((cnt, h) => {
    const pct    = Math.round((cnt / max) * 100);
    const label  = `${String(h).padStart(2, '0')}h`;
    const isBusy = cnt === max && cnt > 0;
    return `
      <div class="a-bar-col">
        <span class="a-bar-val">${cnt > 0 ? cnt : ''}</span>
        <div class="a-bar${isBusy ? ' a-bar-peak' : ''}" style="height:${Math.max(pct, cnt > 0 ? 4 : 0)}%"></div>
        <span class="a-bar-label">${label}</span>
      </div>`;
  }).join('');
}

function renderRanking() {
  if (!rankingList) return;

  // Agrupar por tienda
  const byStore = {};
  allSpins.forEach(s => {
    if (!byStore[s.storeEmail]) byStore[s.storeEmail] = { name: s.storeName, spins: 0, winners: 0 };
    byStore[s.storeEmail].spins++;
    if (s.isWinner) byStore[s.storeEmail].winners++;
  });

  const sorted = Object.entries(byStore)
    .sort((a, b) => b[1].spins - a[1].spins)
    .slice(0, 20);  // top 20

  if (sorted.length === 0) {
    rankingList.innerHTML = '<p class="a-empty">Sin datos.</p>';
    return;
  }

  const maxSpins = sorted[0][1].spins;

  rankingList.innerHTML = sorted.map(([email, data], i) => {
    const pct = Math.round((data.spins / maxSpins) * 100);
    return `
      <div class="a-rank-row">
        <span class="a-rank-pos">#${i + 1}</span>
        <span class="a-rank-name" title="${email}">${data.name}</span>
        <div class="a-rank-bar-wrap">
          <div class="a-rank-bar" style="width:${pct}%"></div>
        </div>
        <span class="a-rank-spins">${data.spins} giros</span>
        <span class="a-rank-wins">${data.winners} 🏆</span>
      </div>`;
  }).join('');
}

/* ── Progreso por tienda ──────────────────────────────────────────────── */
const progressBody        = document.getElementById('progressBody');
const progressEmpty       = document.getElementById('progressEmpty');
const filterStoreProgress = document.getElementById('filterStoreProgress');

filterStoreProgress && filterStoreProgress.addEventListener('input', renderProgress);

function renderProgress() {
  if (!progressBody) return;

  const today = new Date().toISOString().slice(0, 10);
  const q     = (filterStoreProgress?.value || '').toLowerCase().trim();

  // Agrupar por tienda
  const byStore = {};
  allSpins.forEach(s => {
    if (!byStore[s.storeEmail]) {
      byStore[s.storeEmail] = { name: s.storeName, today: 0, total: 0, won: 0, lost: 0 };
    }
    byStore[s.storeEmail].total++;
    if (s.date === today) byStore[s.storeEmail].today++;
    if (s.isWinner) byStore[s.storeEmail].won++;
    else            byStore[s.storeEmail].lost++;
  });

  let rows = Object.values(byStore)
    .sort((a, b) => b.total - a.total);

  if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q));

  if (rows.length === 0) {
    progressBody.innerHTML = '';
    if (progressEmpty) progressEmpty.style.display = 'block';
    return;
  }
  if (progressEmpty) progressEmpty.style.display = 'none';

  progressBody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.name}</td>
      <td class="a-td-num">${r.today}</td>
      <td class="a-td-num">${r.total}</td>
      <td class="a-td-win">${r.won}</td>
      <td class="a-td-lose">${r.lost}</td>
    </tr>`).join('');
}

function renderTable(filter = {}) {
  if (!logsBody) return;

  const storeFilter  = (filter.store  || filterStore?.value  || '').toLowerCase();
  const resultFilter = (filter.result || filterResult?.value || '');

  const filtered = allSpins.filter(s => {
    if (storeFilter  && !s.storeName.toLowerCase().includes(storeFilter)) return false;
    if (resultFilter && s.result !== resultFilter) return false;
    return true;
  });

  if (filtered.length === 0) {
    logsBody.innerHTML = '';
    if (logsEmpty) logsEmpty.style.display = 'block';
    return;
  }
  if (logsEmpty) logsEmpty.style.display = 'none';

  logsBody.innerHTML = filtered.map(s => {
    const fecha = s.ts ? s.ts.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }) : '—';
    const hora  = s.ts ? s.ts.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }) : '—';
    const cls   = s.isWinner ? 'a-row-win' : '';
    return `<tr class="${cls}">
      <td title="${s.storeEmail}">${s.storeName}</td>
      <td>${fecha}</td>
      <td>${hora}</td>
      <td class="${s.isWinner ? 'a-winner' : 'a-loser'}">${s.result}</td>
    </tr>`;
  }).join('');
}

/* ── Filtros ──────────────────────────────────────────────────────────── */
filterStore  && filterStore.addEventListener('input',  () => renderTable());
filterResult && filterResult.addEventListener('change', () => renderTable());

btnRefresh && btnRefresh.addEventListener('click', async () => {
  btnRefresh.textContent = 'Cargando…';
  btnRefresh.disabled    = true;
  await loadDashboard();
  _startAutoRefresh();   // reinicia el countdown desde 5:00
  btnRefresh.textContent = 'Actualizar';
  btnRefresh.disabled    = false;
});

/* ── Exportar CSV ─────────────────────────────────────────────────────── */
btnExportAll && btnExportAll.addEventListener('click', () => {
  const storeFilter  = filterStore?.value.toLowerCase()  || '';
  const resultFilter = filterResult?.value || '';

  const rows = allSpins.filter(s => {
    if (storeFilter  && !s.storeName.toLowerCase().includes(storeFilter)) return false;
    if (resultFilter && s.result !== resultFilter) return false;
    return true;
  });

  const header = ['tienda', 'correo', 'fecha_local', 'hora', 'resultado', 'ganador'];
  const lines  = rows.map(s => {
    const fecha = s.ts ? s.ts.toLocaleDateString('es-MX') : '';
    const hora  = s.ts ? s.ts.toLocaleTimeString('es-MX') : '';
    return [s.storeName, s.storeEmail, fecha, hora, s.result, s.isWinner ? 'SI' : 'NO']
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });

  const csv  = [header.join(','), ...lines].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `maseca_logs_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ── Mapa de ubicaciones (Leaflet) ────────────────────────────────────── */
const mapFilterStore  = document.getElementById('mapFilterStore');
const mapFilterDate   = document.getElementById('mapFilterDate');
const mapFilterResult = document.getElementById('mapFilterResult');
const btnMapRefresh   = document.getElementById('btnMapRefresh');
const mapStatTotal    = document.getElementById('mapStatTotal');
const mapStatNoGeo    = document.getElementById('mapStatNoGeo');

let _map        = null;
let _mapMarkers = [];

function _populateStoreFilter() {
  if (!mapFilterStore) return;
  // Pares únicos email→nombre, ordenados por nombre
  const pairs = [...new Map(
    allSpins
      .filter(s => s.storeEmail && s.storeEmail !== '—')
      .map(s => [s.storeEmail, s.storeName])
  ).entries()].sort((a, b) => a[1].localeCompare(b[1]));

  while (mapFilterStore.options.length > 1) mapFilterStore.remove(1);
  pairs.forEach(([email, name]) => {
    const opt = document.createElement('option');
    opt.value = email; opt.textContent = name;
    mapFilterStore.appendChild(opt);
  });
}

/* — Mapa Leaflet — */
function _initMap() {
  if (_map) return;
  _map = L.map('spinMap', { center: [23.6, -102.5], zoom: 5 });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(_map);
}

function _populateDateFilter() {
  if (!mapFilterDate) return;
  const dates = [...new Set(allSpins.map(s => s.date).filter(Boolean))].sort().reverse();
  while (mapFilterDate.options.length > 1) mapFilterDate.remove(1);
  dates.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d;
    mapFilterDate.appendChild(opt);
  });
}

function _iconFor(isWinner) {
  const color = isWinner ? '#22c55e' : '#ef4444';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
          fill="${color}" stroke="rgba(0,0,0,.4)" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity=".85"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [24,36], iconAnchor: [12,36], popupAnchor: [0,-36] });
}

function renderMap() {
  _initMap();
  _mapMarkers.forEach(m => m.remove());
  _mapMarkers = [];

  const emailQ  = mapFilterStore?.value  || '';
  const dateQ   = mapFilterDate?.value   || '';
  const resultQ = mapFilterResult?.value || '';

  const withGeo    = allSpins.filter(s => s.lat != null && s.lon != null);
  const withoutGeo = allSpins.length - withGeo.length;

  const filtered = withGeo.filter(s => {
    if (emailQ  && s.storeEmail !== emailQ)  return false;
    if (dateQ   && s.date !== dateQ)          return false;
    if (resultQ && s.result !== resultQ)      return false;
    return true;
  });

  if (mapStatTotal) mapStatTotal.textContent = `${filtered.length} giro${filtered.length !== 1 ? 's' : ''} con coordenadas`;
  if (mapStatNoGeo) {
    mapStatNoGeo.textContent = withoutGeo > 0
      ? `(${withoutGeo} sin ubicación — giros anteriores a esta función)` : '';
  }

  if (filtered.length === 0) return;

  const bounds = [];
  filtered.forEach(s => {
    const marker = L.marker([s.lat, s.lon], { icon: _iconFor(s.isWinner) });
    const ts = s.ts ? s.ts.toLocaleString('es-MX') : (s.date || '');
    marker.bindPopup(`
      <div class="a-map-popup">
        <b>${s.result === 'GANADOR' ? '🏆 GANADOR' : '❌ No ganador'}</b><br>
        <span>${s.storeName}</span><br>
        ${ts}<br>
        <small style="color:#888">±${Math.round(s.geoAccuracy || 0)} m</small>
      </div>`);
    marker.addTo(_map);
    _mapMarkers.push(marker);
    bounds.push([s.lat, s.lon]);
  });

  if (bounds.length > 0) {
    _map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }
}

function _initMapSection() {
  _populateStoreFilter();
  _populateDateFilter();
  renderMap();
}

btnMapRefresh   && btnMapRefresh.addEventListener('click', renderMap);
mapFilterStore  && mapFilterStore.addEventListener('change', renderMap);
mapFilterDate   && mapFilterDate.addEventListener('change',  renderMap);
mapFilterResult && mapFilterResult.addEventListener('change', renderMap);

/* ── Guardar config ───────────────────────────────────────────────────── */
adminCfgForm && adminCfgForm.addEventListener('submit', async e => {
  e.preventDefault();
  const winnersTotal = parseInt(aCfgWinnersTotal?.value || '10', 10);
  const winProbX     = parseInt(aCfgWinProbX?.value     || '10', 10);

  if (isNaN(winnersTotal) || isNaN(winProbX) || winProbX < 1) {
    if (aCfgMsg) aCfgMsg.textContent = 'Valores inválidos.';
    return;
  }

  try {
    await db.collection('config').doc('global').set({ winnersTotal, winProbX }, { merge: true });
    if (aCfgMsg) {
      aCfgMsg.className   = 'a-cfg-msg a-cfg-ok';
      aCfgMsg.textContent = '✓ Configuración guardada';
      setTimeout(() => { aCfgMsg.textContent = ''; }, 3000);
    }
  } catch(err) {
    console.error(err);
    if (aCfgMsg) {
      aCfgMsg.className   = 'a-cfg-msg a-cfg-err';
      aCfgMsg.textContent = 'Error al guardar.';
    }
  }
});
