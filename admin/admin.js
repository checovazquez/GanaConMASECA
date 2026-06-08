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

/* ── Auth ─────────────────────────────────────────────────────────────── */
auth.onAuthStateChanged(user => {
  if (user && user.email === ADMIN_EMAIL) {
    adminUser = user;
    if (aAdminEmail) aAdminEmail.textContent = user.email;
    adminLogin.style.display = 'none';
    adminApp.style.display   = 'block';
    loadDashboard();
    // Invalidar tamaño del mapa después de que sea visible
    setTimeout(() => { if (_map) _map.invalidateSize(); }, 300);
  } else if (user) {
    // Usuario autenticado pero no es admin
    auth.signOut();
    showMsg('Esta página es solo para administradores.');
  } else {
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
    return {
      id:          doc.id,
      storeEmail:  d.storeEmail  || '—',
      result:      d.result      || '—',
      isWinner:    d.isWinner    || false,
      date:        d.date        || '',
      hour:        typeof d.hour === 'number' ? d.hour : (ts ? ts.getHours() : 0),
      ts,
      timestamp:   d.timestamp   || null,   // para el popup del mapa
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
    if (!byStore[s.storeEmail]) byStore[s.storeEmail] = { spins: 0, winners: 0 };
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
    const pct       = Math.round((data.spins / maxSpins) * 100);
    const storeName = email.split('@')[0];
    return `
      <div class="a-rank-row">
        <span class="a-rank-pos">#${i + 1}</span>
        <span class="a-rank-name" title="${email}">${storeName}</span>
        <div class="a-rank-bar-wrap">
          <div class="a-rank-bar" style="width:${pct}%"></div>
        </div>
        <span class="a-rank-spins">${data.spins} giros</span>
        <span class="a-rank-wins">${data.winners} 🏆</span>
      </div>`;
  }).join('');
}

function renderTable(filter = {}) {
  if (!logsBody) return;

  const storeFilter  = (filter.store  || filterStore?.value  || '').toLowerCase();
  const resultFilter = (filter.result || filterResult?.value || '');

  const filtered = allSpins.filter(s => {
    if (storeFilter  && !s.storeEmail.toLowerCase().includes(storeFilter)) return false;
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
    const store = s.storeEmail.split('@')[0];
    return `<tr class="${cls}">
      <td title="${s.storeEmail}">${store}</td>
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
  btnRefresh.textContent = 'Actualizar';
  btnRefresh.disabled    = false;
});

/* ── Exportar CSV ─────────────────────────────────────────────────────── */
btnExportAll && btnExportAll.addEventListener('click', () => {
  const storeFilter  = filterStore?.value.toLowerCase()  || '';
  const resultFilter = filterResult?.value || '';

  const rows = allSpins.filter(s => {
    if (storeFilter  && !s.storeEmail.toLowerCase().includes(storeFilter)) return false;
    if (resultFilter && s.result !== resultFilter) return false;
    return true;
  });

  const header = ['tienda', 'fecha_local', 'hora', 'resultado', 'ganador'];
  const lines  = rows.map(s => {
    const fecha = s.ts ? s.ts.toLocaleDateString('es-MX') : '';
    const hora  = s.ts ? s.ts.toLocaleTimeString('es-MX') : '';
    return [s.storeEmail, fecha, hora, s.result, s.isWinner ? 'SI' : 'NO']
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
const mapFilterStore    = document.getElementById('mapFilterStore');
const mapStoreDropdown  = document.getElementById('mapStoreDropdown');
const mapComboClear     = document.getElementById('mapComboClear');
const mapFilterDate     = document.getElementById('mapFilterDate');
const mapFilterResult   = document.getElementById('mapFilterResult');
const btnMapRefresh     = document.getElementById('btnMapRefresh');
const mapStatTotal      = document.getElementById('mapStatTotal');
const mapStatNoGeo      = document.getElementById('mapStatNoGeo');

let _map           = null;
let _mapMarkers    = [];
let _mapStores     = [];   // lista de emails únicos con su etiqueta
let _mapSelected   = null; // { email, label } o null = "Todas"
let _mapHlIndex    = -1;

/* — Combo de tiendas del mapa — */
function _mapUpdateClear() {
  if (mapComboClear) mapComboClear.style.display = mapFilterStore.value ? 'block' : 'none';
}

function _mapBuildStoreList() {
  // Extraer emails únicos de allSpins y construir lista ordenada
  const emails = [...new Set(allSpins.map(s => s.storeEmail).filter(s => s && s !== '—'))].sort();
  _mapStores = emails.map(e => ({ email: e, label: e }));
}

function _mapRenderDropdown(q) {
  if (!mapStoreDropdown) return;
  const query   = (q || '').toLowerCase().trim();
  const all     = { email: '', label: 'Todas las tiendas' };
  const matches = query
    ? _mapStores.filter(s => s.label.toLowerCase().includes(query))
    : [all, ..._mapStores];

  mapStoreDropdown.innerHTML = '';
  _mapHlIndex = -1;

  if (!matches.length) {
    mapStoreDropdown.classList.remove('open');
    mapFilterStore.setAttribute('aria-expanded', 'false');
    return;
  }

  matches.forEach(store => {
    const li = document.createElement('li');
    li.textContent = store.label;
    li.setAttribute('role', 'option');
    if (_mapSelected && _mapSelected.email === store.email) li.classList.add('combo-active');
    li.addEventListener('mousedown', e => {
      e.preventDefault();
      _mapSelectStore(store);
    });
    mapStoreDropdown.appendChild(li);
  });

  mapStoreDropdown.classList.add('open');
  mapFilterStore.setAttribute('aria-expanded', 'true');
}

function _mapSelectStore(store) {
  _mapSelected = store.email === '' ? null : store;
  mapFilterStore.value = store.email === '' ? '' : store.label;
  mapStoreDropdown.classList.remove('open');
  mapFilterStore.setAttribute('aria-expanded', 'false');
  _mapUpdateClear();
  renderMap();
}

function _mapCloseDropdown() {
  mapStoreDropdown.classList.remove('open');
  mapFilterStore.setAttribute('aria-expanded', 'false');
  // Restaurar texto si el usuario escribió a medias sin seleccionar
  if (_mapSelected) {
    mapFilterStore.value = _mapSelected.label;
  } else if (!mapFilterStore.value) {
    mapFilterStore.value = '';
  }
}

mapFilterStore && mapFilterStore.addEventListener('focus', () => {
  _mapRenderDropdown(mapFilterStore.value);
});
mapFilterStore && mapFilterStore.addEventListener('input', () => {
  _mapSelected = null;
  _mapUpdateClear();
  _mapRenderDropdown(mapFilterStore.value);
});
mapFilterStore && mapFilterStore.addEventListener('blur', () => {
  setTimeout(_mapCloseDropdown, 160);
});
mapFilterStore && mapFilterStore.addEventListener('keydown', e => {
  const items = mapStoreDropdown.querySelectorAll('li');
  if (!items.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _mapHlIndex = Math.min(_mapHlIndex + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _mapHlIndex = Math.max(_mapHlIndex - 1, 0);
  } else if (e.key === 'Enter') {
    if (_mapHlIndex >= 0 && items[_mapHlIndex]) {
      e.preventDefault();
      const label = items[_mapHlIndex].textContent;
      const store = label === 'Todas las tiendas'
        ? { email: '', label: 'Todas las tiendas' }
        : _mapStores.find(s => s.label === label);
      if (store) _mapSelectStore(store);
    }
    return;
  } else if (e.key === 'Escape') {
    _mapCloseDropdown(); return;
  } else { return; }
  items.forEach((li, i) => li.classList.toggle('combo-hl', i === _mapHlIndex));
  items[_mapHlIndex]?.scrollIntoView({ block: 'nearest' });
});
mapComboClear && mapComboClear.addEventListener('mousedown', e => {
  e.preventDefault();
  _mapSelected = null;
  mapFilterStore.value = '';
  _mapUpdateClear();
  mapFilterStore.focus();
  _mapRenderDropdown('');
  renderMap();
});

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

  const emailQ  = _mapSelected ? _mapSelected.email : '';
  const dateQ   = mapFilterDate?.value  || '';
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
        <small>${s.storeEmail}</small><br>
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
  _mapBuildStoreList();
  _populateDateFilter();
  renderMap();
}

btnMapRefresh   && btnMapRefresh.addEventListener('click', renderMap);
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
