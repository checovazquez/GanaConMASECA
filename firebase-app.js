/* =========================================================================
   firebase-app.js — Autenticación y Firestore para Gana con MASECA
   Depende de: firebase-config.js (debe cargarse primero)
   ========================================================================= */

const db   = firebase.firestore();
const auth = firebase.auth();

/* ── Lista de tiendas ──────────────────────────────────────────────────── */
/*
 * Email por tienda: tienda[ID]@maseca.com para IDs numéricos únicos.
 * Para tiendas con ID=0, se usa un slug del nombre.
 * El admin debe crear estos usuarios exactos en Firebase Auth.
 */
const STORES = [
  // ── Chedraui / Cheselecto ──────────────────────────────────────────────
  { label: '232 | CHESELECTO POLANCO',                email: 'tienda232@maseca.com' },
  { label: '234 | CHEDRAUI AJUSCO',                   email: 'tienda234@maseca.com' },
  { label: '237 | CHEDRAUI TENAYUCA',                 email: 'tienda237@maseca.com' },
  { label: '249 | CHESELECTO GDL ACUEDUCTO',          email: 'tienda249@maseca.com' },
  { label: '262 | SELECTO PLAZA MEXICO',              email: 'tienda262@maseca.com' },

  // ── Sin cadena (tiendas propias) ────────────────────────────────────────
  { label: '94 | SANTO DOMINGO',                      email: 'tienda94@maseca.com' },
  { label: '97 | CUMBRES',                            email: 'tienda97@maseca.com' },
  { label: '105 | EL MOLINETE',                       email: 'tienda105@maseca.com' },
  { label: '107 | LAS MARGARITAS',                    email: 'tienda107@maseca.com' },
  { label: '108 | SANTA CATARINA',                    email: 'tienda108@maseca.com' },

  // ── HEB Mi Tienda ───────────────────────────────────────────────────────
  { label: '2920 | MI TIENDA HEB ZUAZUA',             email: 'tienda2920@maseca.com' },
  { label: '2921 | MI TIENDA GARCIA',                 email: 'tienda2921@maseca.com' },
  { label: '9104 | MT BUENAVISTA',                    email: 'tienda9104@maseca.com' },
  { label: '2990 | MI TIENDA HEB CIUDADELA',          email: 'tienda2990@maseca.com' },
  { label: '2925 | MI TIENDA PLAZA DEL BOSQUE',       email: 'tienda2925@maseca.com' },
  { label: '2932 | MI TIENDA METROPLEX',              email: 'tienda2932@maseca.com' },
  { label: '2917 | MT ELOY CAVAZOS',                  email: 'tienda2917@maseca.com' },
  { label: '2994 | HEB MI TIENDA HUINALA',            email: 'tienda2994@maseca.com' },
  { label: '2966 | MI TIENDA HEB SAN ROQUE',          email: 'tienda2966@maseca.com' },
  { label: '2956 | MI TIENDA AZTLAN',                 email: 'tienda2956@maseca.com' },

  // ── Soriana (Monterrey) ─────────────────────────────────────────────────
  { label: '27 | SORIANA STA. MARIA',                 email: 'tienda27@maseca.com' },
  { label: '92 | SORIANA SOLIDARIDAD',                email: 'tienda92@maseca.com' },
  { label: '53 | SORIANA LAS TORRES',                 email: 'tienda53@maseca.com' },
  { label: '360 | SORIANA AZTLÁN',                    email: 'tienda360@maseca.com' },
  { label: '132 | SORIANA TOPO CHICO',                email: 'tienda132@maseca.com' },
  { label: '7 | SORIANA CONTRY',                      email: 'tienda7@maseca.com' },
  { label: '88 | SORIANA LAS QUINTAS',                email: 'tienda88@maseca.com' },
  { label: '24 | SORIANA CUMBRES',                    email: 'tienda24@maseca.com' },
  { label: '203 | SORIANA SAN ROQUE',                 email: 'tienda203@maseca.com' },
  { label: '66 | SORIANA ESTANZUELA',                 email: 'tienda66@maseca.com' },

  // ── Soriana / Mega Soriana / MDO (CDMX y Edo. Méx.) ────────────────────
  { label: '227 | SORIANA ERMITA',                    email: 'tienda227@maseca.com' },
  { label: '300 | SORIANA MIRAMONTES',                email: 'tienda300@maseca.com' },
  { label: '400 | SORIANA TULTEPEC',                  email: 'tienda400@maseca.com' },
  { label: '422 | MDO SORIANA VILLA NICOLAS ROMERO',  email: 'tienda422@maseca.com' },
  { label: '426 | MDO SORIANA PEÑON',                 email: 'tienda426@maseca.com' },
  { label: '447 | MDO SORIANA TLÁHUAC',               email: 'tienda447@maseca.com' },
  { label: '633 | SORIANA EXPRES PLAZA CUAUTITLAN',   email: 'tienda633@maseca.com' },
  { label: '857 | MEGA SORIANA MIXCOAC',              email: 'tienda857@maseca.com' },
  { label: '885 | MDO SORIANA CUAUTITLAN',            email: 'tienda885@maseca.com' },
  { label: '896 | MDO SORIANA CUAUTEPEC',             email: 'tienda896@maseca.com' },
  { label: '898 | MEGA SORIANA VILLA DE LA HACIENDA', email: 'tienda898@maseca.com' },
  { label: '902 | MDO SORIANA XOCHIMILCO',            email: 'tienda902@maseca.com' },
  { label: '930 | MEGA SORIANA IZCALLI',              email: 'tienda930@maseca.com' },
  { label: '946 | MDO SORIANA IZTAPALAPA',            email: 'tienda946@maseca.com' },
  { label: '998 | MEGA SORIANA LA VILLA',             email: 'tienda998@maseca.com' },

  // ── Otras cadenas (Mty) ─────────────────────────────────────────────────
  { label: '2944 | MARGARITAS',                       email: 'tienda2944@maseca.com' },
  { label: '2923 | CABEZADA',                         email: 'tienda2923@maseca.com' },
  { label: '9113 | ANZURES',                          email: 'tienda9113@maseca.com' },
  { label: '0 | SANTA MARIA',                         email: 'santa-maria@maseca.com' },

  // ── Merco ───────────────────────────────────────────────────────────────
  { label: '574 | MERCO SOLIDARIDAD',                 email: 'tienda574@maseca.com' },
  { label: '1301 | MERCO PLAZA SENDERO',              email: 'tienda1301@maseca.com' },
  { label: '0 | MERCO LINDA VISTA',                   email: 'merco-linda-vista@maseca.com' },
  { label: '0 | MERCO GARCIA',                        email: 'merco-garcia@maseca.com' },
  { label: '0 | MERCO BUENAVISTA',                    email: 'merco-buenavista@maseca.com' },

  // ── Bodega Aurrera (Monterrey / Edo. Méx.) ──────────────────────────────
  { label: '3623 | BA LOS FRESNOS',                   email: 'tienda3623@maseca.com' },
  { label: '3625 | BA DIAZ BERLANGA',                 email: 'tienda3625@maseca.com' },
  { label: '3443 | BA CLOUTHIER',                     email: 'tienda3443@maseca.com' },
  { label: '5712 | BA SOLIDARIDAD',                   email: 'tienda5712@maseca.com' },
  { label: '3298 | BA ESCOBEDO MTY',                  email: 'tienda3298@maseca.com' },
  { label: '2097 | BA PUEBLO NUEVO',                  email: 'tienda2097@maseca.com' },
  { label: '3362 | BA TOPOCHICO',                     email: 'tienda3362@maseca.com' },
  { label: '3801 | BA STO. DOMINGO NVO. LEON',        email: 'tienda3801@maseca.com' },

  // ── Bodega Aurrera (CDMX / Edo. Méx.) ───────────────────────────────────
  { label: '3765 | BA ECATEPEC',                      email: 'tienda3765@maseca.com' },
  { label: '3756 | BA TLALNEPANTLA',                  email: 'tienda3756@maseca.com' },
  { label: '3892 | BA AV CENTRAL',                    email: 'tienda3892@maseca.com' },
  { label: '3141 | BA SAN PABLO TULTITLAN',           email: 'tienda3141@maseca.com' },
  { label: '3679 | BA NICOLAS ROMERO',                email: 'tienda3679@maseca.com' },
  { label: '3294 | BA NICOLAS BRAVO',                 email: 'tienda3294@maseca.com' },
  { label: '3784 | BA 1 DE MAYO',                     email: 'tienda3784@maseca.com' },
  { label: '3891 | BA LOS REYES',                     email: 'tienda3891@maseca.com' },
  { label: '3874 | BA CANTIL',                        email: 'tienda3874@maseca.com' },
  { label: '3763 | BA MARIANO ESCOBEDO',              email: 'tienda3763@maseca.com' },
  { label: '3759 | BA SAN RAFAEL',                    email: 'tienda3759@maseca.com' },
  { label: '3845 | SC UNIVERSIDAD',                   email: 'tienda3845@maseca.com' },
  { label: '3755 | BA TACUBAYA',                      email: 'tienda3755@maseca.com' },
  { label: '3751 | BA INSURGENTES SUR',               email: 'tienda3751@maseca.com' },
  { label: '3769 | BA INSURGENTES NORTE',             email: 'tienda3769@maseca.com' },
  { label: '3897 | BA LA VIRGEN',                     email: 'tienda3897@maseca.com' },
  { label: '3764 | BA IZTAPALAPA',                    email: 'tienda3764@maseca.com' },
  { label: '2344 | SC TOREO',                         email: 'tienda2344@maseca.com' },
  { label: '3665 | BA CANUTILLO',                     email: 'tienda3665@maseca.com' },
  { label: '5798 | BA SANTA MARGARITA',               email: 'tienda5798@maseca.com' },
  { label: '3143 | BA LOS AGAVES',                    email: 'tienda3143@maseca.com' },
  { label: '3789 | BA REVOLUCION',                    email: 'tienda3789@maseca.com' },

  // ── Bodega Aurrera (Guadalajara) ─────────────────────────────────────────
  { label: '3781 | BA INDEPENDENCIA',                 email: 'tienda3781@maseca.com' },
  { label: '3780 | BA ATEMAJAC',                      email: 'tienda3780@maseca.com' },
  { label: '3557 | BA CHULAVISTA',                    email: 'tienda3557@maseca.com' },
  { label: '1555 | BA SOLIDARIDAD GUAD',              email: 'tienda1555@maseca.com' },
  { label: '3866 | BA ARBOLEDAS',                     email: 'tienda3866@maseca.com' },
  { label: '2028 | BA CONCEPCION DEL VALLE',          email: 'tienda2028@maseca.com' },
  { label: '2135 | BA CLINICA UNION DEL CUAT',        email: 'tienda2135@maseca.com' },

  // ── Sin cadena / independientes (Mty) ───────────────────────────────────
  { label: '91 | SOLIDARIDAD',                        email: 'tienda91@maseca.com' },
  { label: '0 | VILLAS',                              email: 'villas@maseca.com' },
  { label: '0 | SOLIDARIDAD',                         email: 'solidaridad@maseca.com' },
  { label: '0 | PEDRERAS',                            email: 'pedreras@maseca.com' },
  { label: '0 | VALLE DEL ROBLE',                     email: 'valle-del-roble@maseca.com' },
  { label: '0 | VALLE DEL ROBLE OLMOS',               email: 'valle-del-roble-olmos@maseca.com' },
  { label: '0 | LINCOLN',                             email: 'lincoln@maseca.com' },
];

/* ── Refs DOM ──────────────────────────────────────────────────────────── */
const loginOverlay    = document.getElementById('loginOverlay');
const loginEmail      = document.getElementById('loginEmail');
const loginPassword   = document.getElementById('loginPassword');
const loginBtn        = document.getElementById('loginBtn');
const loginMsg        = document.getElementById('loginMsg');
const userBar         = document.getElementById('userBar');
const userBarName     = document.getElementById('userBarName');
const logoutBtn       = document.getElementById('logoutBtn');
const historyPanel    = document.getElementById('historyPanel');
const historyList     = document.getElementById('historyList');
const historyBtn      = document.getElementById('historyBtn');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');

// Formulario alternativo de admin
const toggleAdminLogin  = document.getElementById('toggleAdminLogin');
const toggleStoreLogin  = document.getElementById('toggleStoreLogin');
const adminLoginForm    = document.getElementById('adminLoginForm');
const storeLoginSection = document.querySelector('.login-form');
const adminPwdInput     = document.getElementById('adminPwd');
const adminLoginBtn     = document.getElementById('adminLoginBtn');
const adminMsg          = document.getElementById('adminMsg');

toggleAdminLogin && toggleAdminLogin.addEventListener('click', () => {
  storeLoginSection.style.display = 'none';
  adminLoginForm.style.display    = 'flex';
  adminPwdInput && adminPwdInput.focus();
});
toggleStoreLogin && toggleStoreLogin.addEventListener('click', () => {
  adminLoginForm.style.display    = 'none';
  storeLoginSection.style.display = 'flex';
});

function _doAdminLogin() {
  const pwd = (adminPwdInput?.value || '').trim();
  if (!pwd) { if (adminMsg) adminMsg.textContent = 'Ingresa tu contraseña.'; return; }
  adminLoginBtn.disabled    = true;
  adminLoginBtn.textContent = 'Entrando…';
  if (adminMsg) adminMsg.textContent = '';
  auth.signInWithEmailAndPassword(ADMIN_EMAIL, pwd).catch(e => {
    adminLoginBtn.disabled    = false;
    adminLoginBtn.textContent = 'Entrar como admin';
    if (adminMsg) adminMsg.textContent = _authErr(e.code);
  });
}
adminLoginBtn && adminLoginBtn.addEventListener('click', _doAdminLogin);
adminPwdInput && adminPwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') _doAdminLogin(); });

/* ── Combobox de tiendas ───────────────────────────────────────────────── */
const storeSearch    = document.getElementById('storeSearch');
const storeDropdown  = document.getElementById('storeDropdown');
let   _selectedStore = null;
let   _hlIndex       = -1;   // índice resaltado con teclado

function _renderDropdown(q = '') {
  const query   = q.toLowerCase().trim();
  const matches = query
    ? STORES.filter(s => s.label.toLowerCase().includes(query))
    : STORES;

  storeDropdown.innerHTML = '';
  _hlIndex = -1;

  if (!matches.length) {
    storeDropdown.classList.remove('open');
    storeSearch.setAttribute('aria-expanded', 'false');
    return;
  }

  matches.forEach(store => {
    const li = document.createElement('li');
    li.textContent   = store.label;
    li.dataset.email = store.email;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', store === _selectedStore ? 'true' : 'false');
    if (store === _selectedStore) li.classList.add('combo-active');

    // mousedown en vez de click para no perder el focus del input
    li.addEventListener('mousedown', e => {
      e.preventDefault();
      _selectStore(store);
    });
    storeDropdown.appendChild(li);
  });

  storeDropdown.classList.add('open');
  storeSearch.setAttribute('aria-expanded', 'true');
}

function _selectStore(store) {
  _selectedStore     = store;
  storeSearch.value  = store.label;
  loginEmail.value   = store.email;
  storeDropdown.classList.remove('open');
  storeSearch.setAttribute('aria-expanded', 'false');
  storeSearch.classList.remove('combo-empty');
}

function _closeDropdown() {
  storeDropdown.classList.remove('open');
  storeSearch.setAttribute('aria-expanded', 'false');
  // Si el usuario no eligió nada y hay texto incompleto, borrarlo
  if (!_selectedStore || storeSearch.value !== _selectedStore.label) {
    storeSearch.value = _selectedStore ? _selectedStore.label : '';
    if (!_selectedStore) loginEmail.value = '';
  }
}

storeSearch && storeSearch.addEventListener('focus', () => {
  _renderDropdown(storeSearch.value);
});

storeSearch && storeSearch.addEventListener('input', () => {
  _selectedStore = null;
  loginEmail.value = '';
  _renderDropdown(storeSearch.value);
});

storeSearch && storeSearch.addEventListener('blur', () => {
  setTimeout(_closeDropdown, 160);
});

storeSearch && storeSearch.addEventListener('keydown', e => {
  const items = storeDropdown.querySelectorAll('li');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _hlIndex = Math.min(_hlIndex + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _hlIndex = Math.max(_hlIndex - 1, 0);
  } else if (e.key === 'Enter') {
    if (_hlIndex >= 0 && items[_hlIndex]) {
      e.preventDefault();
      const email = items[_hlIndex].dataset.email;
      const store = STORES.find(s => s.email === email);
      if (store) _selectStore(store);
    }
    return;
  } else if (e.key === 'Escape') {
    _closeDropdown();
    return;
  } else {
    return;
  }

  items.forEach((li, i) => li.classList.toggle('combo-hl', i === _hlIndex));
  items[_hlIndex]?.scrollIntoView({ block: 'nearest' });
});

/* ── Estado ────────────────────────────────────────────────────────────── */
let _currentUser = null;

/* ── Auth state ────────────────────────────────────────────────────────── */
auth.onAuthStateChanged(async user => {
  if (user) {
    _currentUser = user;
    window.FB_CURRENT_USER = user;
    try {
      await _initForUser(user);
    } catch (e) {
      console.error('Error al inicializar usuario:', e);
    }
    _showApp(user);
  } else {
    _currentUser = null;
    window.FB_CURRENT_USER = null;
    _showLogin();
  }
});

async function _initForUser(user) {
  // Cargar configuración global (escrita por el admin)
  try {
    const cfgDoc = await db.collection('config').doc('global').get();
    if (cfgDoc.exists) {
      window.FB_CONFIG = cfgDoc.data();
    }
  } catch (e) {
    console.warn('Sin config en Firestore, usando valores locales:', e.message);
  }

  // Cargar estadísticas de la tienda (spins y ganadores previos)
  try {
    const statsDoc = await db.collection('storeStats').doc(user.uid).get();
    if (statsDoc.exists) {
      const s = statsDoc.data();
      window.FB_STORE_SPINS   = s.spinsCount   || 0;
      window.FB_STORE_WINNERS = s.winnersGiven  || 0;
    } else {
      window.FB_STORE_SPINS   = 0;
      window.FB_STORE_WINNERS = 0;
    }
  } catch (e) {
    console.warn('Sin stats en Firestore, iniciando en 0:', e.message);
    window.FB_STORE_SPINS   = 0;
    window.FB_STORE_WINNERS = 0;
  }
}

function _showApp(user) {
  if (loginOverlay) loginOverlay.style.display = 'none';
  if (userBar)      userBar.style.display = 'flex';

  // Mostrar nombre de la tienda (parte antes del @)
  if (userBarName) {
    userBarName.textContent = user.email.split('@')[0].replace(/tienda/i, 'Tienda ');
  }

  // El botón ⚙️ solo lo ve el administrador
  const btnConfig = document.getElementById('btnConfig');
  if (btnConfig) btnConfig.style.display = (user.email === ADMIN_EMAIL) ? '' : 'none';

  // Disparar arranque del app (definido al final de script.js)
  if (typeof window.bootApp === 'function') window.bootApp();
}

function _showLogin() {
  if (loginOverlay) loginOverlay.style.display = 'flex';
  if (userBar)      userBar.style.display = 'none';
}

/* ── Login ─────────────────────────────────────────────────────────────── */
function _doLogin() {
  const email = (loginEmail?.value || '').trim();
  const pwd   = (loginPassword?.value || '').trim();

  if (!email) {
    _loginMsg('Selecciona tu tienda.');
    storeSearch && storeSearch.focus();
    return;
  }
  if (!pwd) {
    _loginMsg('Ingresa tu contraseña.');
    loginPassword && loginPassword.focus();
    return;
  }

  loginBtn.disabled    = true;
  loginBtn.textContent = 'Entrando…';
  _loginMsg('');

  auth.signInWithEmailAndPassword(email, pwd).catch(e => {
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Entrar';
    _loginMsg(_authErr(e.code));
  });
}

loginBtn      && loginBtn.addEventListener('click', _doLogin);
loginPassword && loginPassword.addEventListener('keydown', e => {
  if (e.key === 'Enter') _doLogin();
});

function _loginMsg(msg) { if (loginMsg) loginMsg.textContent = msg; }

function _authErr(code) {
  const map = {
    'auth/user-not-found':     'Usuario no encontrado.',
    'auth/wrong-password':     'Contraseña incorrecta.',
    'auth/invalid-email':      'Formato de email inválido.',
    'auth/too-many-requests':  'Demasiados intentos. Espera un momento.',
    'auth/invalid-credential': 'Usuario o contraseña incorrectos.',
    'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
  };
  return map[code] || `Error al iniciar sesión. (${code})`;
}

/* ── Logout ─────────────────────────────────────────────────────────────── */
logoutBtn && logoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => window.location.reload());
});

/* ── Guardar giro en Firestore ──────────────────────────────────────────── */
window.fbSaveSpin = async function (result) {
  if (!_currentUser) return;

  const isWinner = result === 'GANADOR';
  const now      = new Date();

  const batch = db.batch();

  // Registro del giro
  const spinRef = db.collection('spins').doc();
  batch.set(spinRef, {
    storeId:      _currentUser.uid,
    storeEmail:   _currentUser.email,
    timestamp:    firebase.firestore.FieldValue.serverTimestamp(),
    result,
    isWinner,
    date:         now.toISOString().slice(0, 10),          // YYYY-MM-DD
    hour:         now.getHours()
  });

  // Actualizar contadores de la tienda
  const statsRef = db.collection('storeStats').doc(_currentUser.uid);
  batch.set(statsRef, {
    storeEmail:   _currentUser.email,
    spinsCount:   firebase.firestore.FieldValue.increment(1),
    winnersGiven: firebase.firestore.FieldValue.increment(isWinner ? 1 : 0),
    lastSpin:     firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  try {
    await batch.commit();
  } catch (e) {
    console.error('Error guardando giro en Firestore:', e);
  }
};

/* ── Guardar config en Firestore (solo admin) ───────────────────────────── */
window.fbSaveConfig = async function (cfg) {
  if (!_currentUser || _currentUser.email !== ADMIN_EMAIL) return;
  try {
    await db.collection('config').doc('global').set(cfg, { merge: true });
  } catch (e) {
    console.error('Error guardando config:', e);
  }
};

/* ── Panel de historial de la tienda ────────────────────────────────────── */
historyBtn && historyBtn.addEventListener('click', async () => {
  if (!historyPanel || !_currentUser) return;
  historyPanel.classList.add('show');
  if (historyList) historyList.innerHTML = '<li class="hist-loading">Cargando…</li>';

  try {
    const snap = await db.collection('spins')
      .where('storeId', '==', _currentUser.uid)
      .limit(100)
      .get();

    if (!historyList) return;
    historyList.innerHTML = '';

    if (snap.empty) {
      historyList.innerHTML = '<li class="hist-empty">Sin participaciones registradas aún.</li>';
      return;
    }

    // Ordenar por timestamp descendente en el cliente (evita índice compuesto en Firestore)
    const docs = snap.docs.slice().sort((a, b) => {
      const ta = a.data().timestamp ? a.data().timestamp.toMillis() : 0;
      const tb = b.data().timestamp ? b.data().timestamp.toMillis() : 0;
      return tb - ta;
    });

    docs.forEach(doc => {
      const d  = doc.data();
      const ts = d.timestamp ? d.timestamp.toDate() : null;
      const fecha = ts ? ts.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }) : '—';
      const hora  = ts ? ts.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }) : '—';

      const li = document.createElement('li');
      li.className = d.isWinner ? 'hist-win' : 'hist-lose';
      li.innerHTML = `
        <span class="hist-date">${fecha}</span>
        <span class="hist-time">${hora}</span>
        <strong class="hist-result">${d.result}</strong>
      `;
      historyList.appendChild(li);
    });
  } catch (e) {
    console.error('Error cargando historial:', e);
    if (historyList) historyList.innerHTML = '<li class="hist-error">Error al cargar historial.</li>';
  }
});

closeHistoryBtn && closeHistoryBtn.addEventListener('click', () => {
  historyPanel && historyPanel.classList.remove('show');
});

/* ── Helpers exportados ─────────────────────────────────────────────────── */
window.fbIsAdmin      = () => _currentUser?.email === ADMIN_EMAIL;
window.fbCurrentUser  = () => _currentUser;

/*
 * REFERENCIA — Emails para crear en Firebase Auth (Console → Authentication → Users)
 * Total: 98 tiendas + 1 admin = 99 cuentas
 *
 * -- Chedraui / Cheselecto --
 * tienda232@maseca.com     → 232 | CHESELECTO POLANCO
 * tienda234@maseca.com     → 234 | CHEDRAUI AJUSCO
 * tienda237@maseca.com     → 237 | CHEDRAUI TENAYUCA
 * tienda249@maseca.com     → 249 | CHESELECTO GDL ACUEDUCTO
 * tienda262@maseca.com     → 262 | SELECTO PLAZA MEXICO
 *
 * -- Sin cadena --
 * tienda94@maseca.com      → 94 | SANTO DOMINGO
 * tienda97@maseca.com      → 97 | CUMBRES
 * tienda105@maseca.com     → 105 | EL MOLINETE
 * tienda107@maseca.com     → 107 | LAS MARGARITAS
 * tienda108@maseca.com     → 108 | SANTA CATARINA
 *
 * -- HEB Mi Tienda --
 * tienda2920@maseca.com    → 2920 | MI TIENDA HEB ZUAZUA
 * tienda2921@maseca.com    → 2921 | MI TIENDA GARCIA
 * tienda9104@maseca.com    → 9104 | MT BUENAVISTA
 * tienda2990@maseca.com    → 2990 | MI TIENDA HEB CIUDADELA
 * tienda2925@maseca.com    → 2925 | MI TIENDA PLAZA DEL BOSQUE
 * tienda2932@maseca.com    → 2932 | MI TIENDA METROPLEX
 * tienda2917@maseca.com    → 2917 | MT ELOY CAVAZOS
 * tienda2994@maseca.com    → 2994 | HEB MI TIENDA HUINALA
 * tienda2966@maseca.com    → 2966 | MI TIENDA HEB SAN ROQUE
 * tienda2956@maseca.com    → 2956 | MI TIENDA AZTLAN
 *
 * -- Soriana Monterrey --
 * tienda27@maseca.com      → 27 | SORIANA STA. MARIA
 * tienda92@maseca.com      → 92 | SORIANA SOLIDARIDAD
 * tienda53@maseca.com      → 53 | SORIANA LAS TORRES
 * tienda360@maseca.com     → 360 | SORIANA AZTLÁN
 * tienda132@maseca.com     → 132 | SORIANA TOPO CHICO
 * tienda7@maseca.com       → 7 | SORIANA CONTRY
 * tienda88@maseca.com      → 88 | SORIANA LAS QUINTAS
 * tienda24@maseca.com      → 24 | SORIANA CUMBRES
 * tienda203@maseca.com     → 203 | SORIANA SAN ROQUE
 * tienda66@maseca.com      → 66 | SORIANA ESTANZUELA
 *
 * -- Soriana / Mega / MDO (CDMX y Edo. Méx.) --
 * tienda227@maseca.com     → 227 | SORIANA ERMITA
 * tienda300@maseca.com     → 300 | SORIANA MIRAMONTES
 * tienda400@maseca.com     → 400 | SORIANA TULTEPEC
 * tienda422@maseca.com     → 422 | MDO SORIANA VILLA NICOLAS ROMERO
 * tienda426@maseca.com     → 426 | MDO SORIANA PEÑON
 * tienda447@maseca.com     → 447 | MDO SORIANA TLÁHUAC
 * tienda633@maseca.com     → 633 | SORIANA EXPRES PLAZA CUAUTITLAN
 * tienda857@maseca.com     → 857 | MEGA SORIANA MIXCOAC
 * tienda885@maseca.com     → 885 | MDO SORIANA CUAUTITLAN
 * tienda896@maseca.com     → 896 | MDO SORIANA CUAUTEPEC
 * tienda898@maseca.com     → 898 | MEGA SORIANA VILLA DE LA HACIENDA
 * tienda902@maseca.com     → 902 | MDO SORIANA XOCHIMILCO
 * tienda930@maseca.com     → 930 | MEGA SORIANA IZCALLI
 * tienda946@maseca.com     → 946 | MDO SORIANA IZTAPALAPA
 * tienda998@maseca.com     → 998 | MEGA SORIANA LA VILLA
 *
 * -- Otras (Mty) --
 * tienda2944@maseca.com    → 2944 | MARGARITAS
 * tienda2923@maseca.com    → 2923 | CABEZADA
 * tienda9113@maseca.com    → 9113 | ANZURES
 * santa-maria@maseca.com   → 0 | SANTA MARIA
 *
 * -- Merco --
 * tienda574@maseca.com     → 574 | MERCO SOLIDARIDAD
 * tienda1301@maseca.com    → 1301 | MERCO PLAZA SENDERO
 * merco-linda-vista@maseca.com → 0 | MERCO LINDA VISTA
 * merco-garcia@maseca.com  → 0 | MERCO GARCIA
 * merco-buenavista@maseca.com → 0 | MERCO BUENAVISTA
 *
 * -- Bodega Aurrera Monterrey --
 * tienda3623@maseca.com    → 3623 | BA LOS FRESNOS
 * tienda3625@maseca.com    → 3625 | BA DIAZ BERLANGA
 * tienda3443@maseca.com    → 3443 | BA CLOUTHIER
 * tienda5712@maseca.com    → 5712 | BA SOLIDARIDAD
 * tienda3298@maseca.com    → 3298 | BA ESCOBEDO MTY
 * tienda2097@maseca.com    → 2097 | BA PUEBLO NUEVO
 * tienda3362@maseca.com    → 3362 | BA TOPOCHICO
 * tienda3801@maseca.com    → 3801 | BA STO. DOMINGO NVO. LEON
 *
 * -- Bodega Aurrera CDMX / Edo. Méx. --
 * tienda3765@maseca.com    → 3765 | BA ECATEPEC
 * tienda3756@maseca.com    → 3756 | BA TLALNEPANTLA
 * tienda3892@maseca.com    → 3892 | BA AV CENTRAL
 * tienda3141@maseca.com    → 3141 | BA SAN PABLO TULTITLAN
 * tienda3679@maseca.com    → 3679 | BA NICOLAS ROMERO
 * tienda3294@maseca.com    → 3294 | BA NICOLAS BRAVO
 * tienda3784@maseca.com    → 3784 | BA 1 DE MAYO
 * tienda3891@maseca.com    → 3891 | BA LOS REYES
 * tienda3874@maseca.com    → 3874 | BA CANTIL
 * tienda3763@maseca.com    → 3763 | BA MARIANO ESCOBEDO
 * tienda3759@maseca.com    → 3759 | BA SAN RAFAEL
 * tienda3845@maseca.com    → 3845 | SC UNIVERSIDAD
 * tienda3755@maseca.com    → 3755 | BA TACUBAYA
 * tienda3751@maseca.com    → 3751 | BA INSURGENTES SUR
 * tienda3769@maseca.com    → 3769 | BA INSURGENTES NORTE
 * tienda3897@maseca.com    → 3897 | BA LA VIRGEN
 * tienda3764@maseca.com    → 3764 | BA IZTAPALAPA
 * tienda2344@maseca.com    → 2344 | SC TOREO
 * tienda3665@maseca.com    → 3665 | BA CANUTILLO
 * tienda5798@maseca.com    → 5798 | BA SANTA MARGARITA
 * tienda3143@maseca.com    → 3143 | BA LOS AGAVES
 * tienda3789@maseca.com    → 3789 | BA REVOLUCION
 *
 * -- Bodega Aurrera Guadalajara --
 * tienda3781@maseca.com    → 3781 | BA INDEPENDENCIA
 * tienda3780@maseca.com    → 3780 | BA ATEMAJAC
 * tienda3557@maseca.com    → 3557 | BA CHULAVISTA
 * tienda1555@maseca.com    → 1555 | BA SOLIDARIDAD GUAD
 * tienda3866@maseca.com    → 3866 | BA ARBOLEDAS
 * tienda2028@maseca.com    → 2028 | BA CONCEPCION DEL VALLE
 * tienda2135@maseca.com    → 2135 | BA CLINICA UNION DEL CUAT
 *
 * -- Independientes / sin ID --
 * tienda91@maseca.com      → 91 | SOLIDARIDAD
 * villas@maseca.com        → 0 | VILLAS
 * solidaridad@maseca.com   → 0 | SOLIDARIDAD
 * pedreras@maseca.com      → 0 | PEDRERAS
 * valle-del-roble@maseca.com       → 0 | VALLE DEL ROBLE
 * valle-del-roble-olmos@maseca.com → 0 | VALLE DEL ROBLE OLMOS
 * lincoln@maseca.com       → 0 | LINCOLN
 */
