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

async function loadSpins() {
  const snap = await db.collection('spins')
    .orderBy('timestamp', 'desc')
    .get();

  allSpins = snap.docs.map(doc => {
    const d  = doc.data();
    const ts = d.timestamp ? d.timestamp.toDate() : null;
    return {
      id:         doc.id,
      storeEmail: d.storeEmail || '—',
      result:     d.result     || '—',
      isWinner:   d.isWinner   || false,
      date:       d.date       || '',
      hour:       typeof d.hour === 'number' ? d.hour : (ts ? ts.getHours() : 0),
      ts
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
    const isBusy = cnt === Math.max(...counts) && cnt > 0;
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
