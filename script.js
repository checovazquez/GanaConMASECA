/* =========================================================================
   Gana con MASECA – script.js
   ======================================================================= */

/* ---------- Refs base ---------- */
const wheel      = document.getElementById('wheel');
const ctx        = wheel.getContext('2d');
const statusEl   = document.getElementById('status');
const btnSpin    = document.getElementById('btnSpin');
const pillSpins  = document.getElementById('pillSpins');
const overlay    = document.getElementById('resultOverlay');
const badge      = document.getElementById('resultBadge');
const sub        = document.getElementById('resultSub');
const btnOk      = document.getElementById('btnOk');
const centerText = document.getElementById('centerText');

/* ---------- Admin: PIN & panel ---------- */
const btnConfig        = document.getElementById('btnConfig');
const pinOverlay       = document.getElementById('pinOverlay');
const pinInput         = document.getElementById('pinInput');
const pinMsg           = document.getElementById('pinMsg');
const btnPinOk         = document.getElementById('btnPinOk');
const btnPinCancel     = document.getElementById('btnPinCancel');

const configPanel        = document.getElementById('configPanel');
const btnCloseConfig     = document.getElementById('btnCloseConfig');
const btnCfgCloseBottom  = document.getElementById('btnCfgCloseBottom');
const btnCfgCloseBottom2 = document.getElementById('btnCfgCloseBottom2');

/* Tabs */
const tabSettings  = document.getElementById('tabSettings');
const tabLog       = document.getElementById('tabLog');
const paneSettings = document.getElementById('paneSettings');
const paneLog      = document.getElementById('paneLog');
const tabLogCount  = document.getElementById('tabLogCount');

/* Ajustes – formulario */
const configForm      = document.getElementById('configForm');
const cfgWinnersTotal = document.getElementById('cfgWinnersTotal');
const cfgWinProbX     = document.getElementById('cfgWinProbX');
const statTotal       = document.getElementById('statTotal');
const statCurrent     = document.getElementById('statCurrent');
const statRemaining   = document.getElementById('statRemaining');
const btnCfgSave      = document.getElementById('btnCfgSave');
const btnCfgResetAll  = document.getElementById('btnCfgResetAll');

/* Admin – cambio de PIN */
const pinForm            = document.getElementById('pinForm');
const pinOld             = document.getElementById('pinOld');
const pinNew             = document.getElementById('pinNew');
const pinNew2            = document.getElementById('pinNew2');
const pinChangeMsg       = document.getElementById('pinChangeMsg');
const btnPinResetDefault = document.getElementById('btnPinResetDefault');

/* Registro */
const logList       = document.getElementById('logList');
const btnLogRefresh = document.getElementById('btnLogRefresh');
const btnLogExport  = document.getElementById('btnLogExport');

/* ---------- Estado ruleta ---------- */
let rotation = 0;
let spinning = false;
const TAU = Math.PI * 2;
const POINTER_ANGLE = -Math.PI / 2;

const PRIZES = Array.from({ length: 8 }, (_, i) =>
  i % 2 === 0
    ? { label: "GANADOR",    color: "#00843D" }
    : { label: "NO GANADOR", color: "#A8D5BA" }
);

/* ---------- Sonidos ---------- */
let audioCtx;
function clickSound(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'square'; o.frequency.value = 800; g.gain.value = 0.03;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); setTimeout(() => o.stop(), 20);
}
function playWinJingle(){
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const now = ac.currentTime;
    function tone(freq, start, dur, vol = 0.2, type = 'sine'){
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = freq;
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.start(start); o.stop(start + dur);
    }
    tone(523.25, now,        0.4, 0.25, 'triangle');
    tone(659.25, now,        0.4, 0.25, 'triangle');
    tone(783.99, now,        0.4, 0.25, 'triangle');
    tone(1046.5, now + 0.4,  0.6, 0.20, 'sine');
    tone(1318.5, now + 0.4,  0.6, 0.20, 'sine');
    tone(1567.98,now + 0.4,  0.6, 0.20, 'sine');
    tone(2093,   now + 1.0,  0.8, 0.18, 'square');
  } catch(e){ console.error(e); }
}
function playLoseJingle(){
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const now = ac.currentTime;
    function tone(freq, start, dur, vol = 0.25, type = 'sine'){
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = freq;
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.start(start); o.stop(start + dur);
    }
    tone(261.63, now,         0.35, 0.25, 'sawtooth');
    tone(220.00, now + 0.35,  0.35, 0.25, 'sawtooth');
    tone(174.61, now + 0.70,  0.60, 0.25, 'triangle');
  } catch(e){ console.error(e); }
}

/* ---------- Cooldown / giros ---------- */
const COOLDOWN_SECONDS = 3;
let cooldownTimer = null;
let cooldownEndTs = 0;

function startCooldown(){
  cooldownEndTs = Date.now() + COOLDOWN_SECONDS * 1000;
  btnSpin.disabled = true;
  tickCooldown();
  cooldownTimer = setInterval(tickCooldown, 200);
}
function tickCooldown(){
  const msLeft = Math.max(0, cooldownEndTs - Date.now());
  if (msLeft <= 0){
    clearInterval(cooldownTimer); cooldownTimer = null; cooldownEndTs = 0;
    btnSpin.disabled = !canSpin();
    btnSpin.textContent = 'Girar';
    statusEl.textContent = 'Listo para girar.';
    return;
  }
  const sLeft = Math.ceil(msLeft / 1000);
  btnSpin.textContent = `Espera ${sLeft}s…`;
  statusEl.textContent = `Enfriando (${sLeft}s)`;
}

/* ---------- Contador persistente ---------- */
const SPINS_KEY = 'maseca_spins_total';
let spins = parseInt(localStorage.getItem(SPINS_KEY) || '0', 10);
function saveSpins(){ localStorage.setItem(SPINS_KEY, String(spins)); }
function updatePill(){
  const total = totalParticipations();
  pillSpins && (pillSpins.textContent = `Participaciones: ${spins} / ${total}`);
}
function canSpin(){
  if (spinning) return false;
  if (cooldownEndTs && Date.now() < cooldownEndTs) return false;
  if (spins >= totalParticipations()) return false;
  return true;
}

/* ---------- Config & Log ---------- */
const CFG_KEY    = 'maseca_cfg_admin_v1';
const DEFAULT_CFG = { winnersTotal: 10, winProbX: 10 };
function loadCfg(){ try{ return {...DEFAULT_CFG, ...JSON.parse(localStorage.getItem(CFG_KEY)||'{}')}; }catch{ return {...DEFAULT_CFG}; } }
function saveCfg(cfg){ localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); }
let CFG = loadCfg();

const LOG_KEY = 'maseca_log_v1';
function loadLog(){ try{ return JSON.parse(localStorage.getItem(LOG_KEY)||'[]'); }catch{ return []; } }
function saveLog(arr){ localStorage.setItem(LOG_KEY, JSON.stringify(arr)); }
let LOG = loadLog();

const GIVEN_KEY = 'maseca_winners_given_v1';
let winnersGiven = parseInt(localStorage.getItem(GIVEN_KEY) || '0', 10);
function saveWinnersGiven(){ localStorage.setItem(GIVEN_KEY, String(winnersGiven)); }

function todayKey(){
  const d = new Date();
  return `y${d.getFullYear()}m${d.getMonth()+1}d${d.getDate()}`;
}
function getTotals(){
  const total      = LOG.length;
  const dKey       = todayKey();
  const todayCount = LOG.filter(x => (x.ts || '').startsWith(dKey)).length;
  const remaining  = Math.max(0, CFG.winnersTotal - winnersGiven);
  return { total, todayCount, remaining };
}
function totalParticipations(){
  const stock = Math.max(0, parseInt(CFG.winnersTotal || 0, 10));
  const x     = Math.max(1, parseInt(CFG.winProbX    || 1, 10));
  return stock * x;
}
function remainingParticipations(){
  return Math.max(0, totalParticipations() - spins);
}

/* ====================== PIN seguro con fallback =====================
   BUGS CORREGIDOS:
   1. comparePin usaba stored.split(':') que parte mal si el hash contiene ':'
   2. ensurePinV2 no migraba PINs guardados en formato antiguo (texto plano sin prefijo)
   3. validatePin no deshabilitaba el botón mientras esperaba la promesa → doble clic
   4. openPinDialog no reseteaba btnPinOk.disabled → quedaba deshabilitado tras error
   ===================================================================== */
const PIN_KEY     = 'maseca_admin_pin_v2';
const DEFAULT_PIN = '2468';

async function hashWithScheme(pin){
  if (window.crypto && crypto.subtle){
    const enc = new TextEncoder().encode(pin);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
    return `sha256:${hex}`;
  }
  return `plain:${pin}`;
}

async function comparePin(inputPin, stored){
  if (!stored) return false;
  const colonIdx = stored.indexOf(':');          // FIX: no usar split para no partir el hash
  if (colonIdx === -1) return false;
  const scheme = stored.slice(0, colonIdx);
  const value  = stored.slice(colonIdx + 1);
  if (scheme === 'sha256'){
    if (!(window.crypto && crypto.subtle)) return false;
    const enc = new TextEncoder().encode(inputPin);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
    return hex === value;
  }
  if (scheme === 'plain') return inputPin === value;
  return false;
}

async function ensurePinV2(){
  let stored = localStorage.getItem(PIN_KEY);
  // FIX: migrar formato antiguo (texto plano sin prefijo) o ausente
  if (!stored || stored.indexOf(':') === -1){
    stored = await hashWithScheme(DEFAULT_PIN);
    localStorage.setItem(PIN_KEY, stored);
  }
  return stored;
}

async function validatePin(){
  const entered = pinInput.value.trim();
  if (!entered){ pinMsg.textContent = 'Ingresa tu PIN.'; return; }
  pinMsg.textContent  = 'Verificando…';
  btnPinOk.disabled   = true;                    // FIX: evitar doble clic mientras resuelve promesa
  try {
    const stored = await ensurePinV2();
    const ok     = await comparePin(entered, stored);
    if (ok){
      pinMsg.textContent = '';
      closePinDialog();
      onAdminAuth();
    } else {
      pinMsg.textContent = 'PIN incorrecto.';
      pinInput.select();
    }
  } catch(e){
    pinMsg.textContent = 'Error al verificar PIN.';
    console.error(e);
  } finally {
    btnPinOk.disabled = false;                   // FIX: siempre rehabilitar el botón
  }
}

async function setNewPin(newPin){
  const hashed = await hashWithScheme(newPin);
  localStorage.setItem(PIN_KEY, hashed);
}

/* ============================ Canvas =============================== */
function fitCanvasToBox(){
  const dpr  = Math.max(1, window.devicePixelRatio || 1);
  const box  = document.querySelector('.wheel-box') || wheel;
  const rect = box.getBoundingClientRect();
  wheel.width  = Math.round(rect.width  * dpr);
  wheel.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function fitAndDraw(){ fitCanvasToBox(); drawWheel(); fitCenterFont(); }
const ro = new ResizeObserver(() => fitAndDraw());

function drawWheel(){
  const rect = wheel.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height);
  const R = size / 2;
  const cx = R, cy = R;
  const n   = PRIZES.length;
  const arc = TAU / n;

  ctx.clearRect(0, 0, wheel.width, wheel.height);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotation); ctx.translate(-cx, -cy);

  for (let i = 0; i < n; i++){
    const start = i * arc, end = start + arc, prize = PRIZES[i];
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R - 10, start, end); ctx.closePath();
    ctx.fillStyle = prize.color; ctx.fill();
    ctx.strokeStyle = '#e3e5df'; ctx.lineWidth = 2; ctx.stroke();

    ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + arc / 2);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = (prize.label === "GANADOR") ? "#ffffff" : "#004d24";
    ctx.font = Math.max(12, Math.floor(size * 0.038)) + "px system-ui";
    ctx.fillText(prize.label, R - 28, 0);
    ctx.restore();
  }

  ctx.restore(); // fin bloque rotado

  // Hub exterior (amarillo + borde blanco) — siempre encima de los segmentos
  const hubR   = Math.max(28, size * 0.17);
  const yellow = getComputedStyle(document.documentElement).getPropertyValue('--maseca-yellow').trim() || '#FFD200';
  ctx.beginPath(); ctx.arc(cx, cy, hubR, 0, TAU);
  ctx.fillStyle = yellow; ctx.fill();
  ctx.lineWidth = Math.max(2, size * 0.006); ctx.strokeStyle = '#ffffff'; ctx.stroke();

  const innerR = hubR * 0.78;

  if (document.body.classList.contains('mundial-theme')) {
    // 🌍 MUNDIAL: dibujar el balón encima del hub amarillo, dentro del círculo interior
    // El balón lleva su propio fondo blanco, no dibujamos círculo blanco extra
    drawSoccerBall(ctx, cx, cy, innerR, rotation);
  } else {
    // Normal: círculo blanco interior
    ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, TAU);
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }
}

/* 🌍 MUNDIAL: balón de fútbol vectorial en canvas
   Se dibuja en el círculo central del hub.
   El div .center-text tiene background:transparent en tema mundial
   para que este canvas sea visible debajo del texto. */
function drawSoccerBall(ctx, cx, cy, r, angle) {
  ctx.save();

  // Clip al círculo interior del hub
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();

  // Fondo blanco
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
  ctx.fillStyle = '#ffffff'; ctx.fill();

  // Rotar el patrón con el ángulo actual de la ruleta
  ctx.translate(cx, cy);
  ctx.rotate(angle || 0);
  ctx.translate(-cx, -cy);

  // Usamos coordenadas en un espacio normalizado de -1 a 1,
  // luego escalamos a píxeles con el radio r
  function pt(nx, ny) {
    return [cx + nx * r, cy + ny * r];
  }

  function poly(npoints, fill) {
    ctx.beginPath();
    npoints.forEach(([nx, ny], i) => {
      const [px, py] = pt(nx, ny);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = r * 0.06;
    ctx.stroke();
  }

  // Balón de fútbol clásico: 1 hexágono central + 5 pentágonos
  // Coordenadas normalizadas (radio = 1), patrón geodésico simplificado
  const SQ3 = Math.sqrt(3);

  // Hexágono central (inscrito en radio ~0.35)
  const H = 0.32;
  const hex = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    hex.push([H * Math.cos(a), H * Math.sin(a)]);
  }
  poly(hex, '#e4e4e4');

  // 5 pentágonos alrededor, cada uno centrado a radio ~0.68
  // separados 72° entre sí, pero el patrón de balón usa 5 manchas
  // distribuidas en los 5 vértices alternos del hexágono
  const pentagons = [0, 1, 2, 3, 4].map(i => {
    const baseAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const dist = 0.62;
    const pcx  = dist * Math.cos(baseAngle);
    const pcy  = dist * Math.sin(baseAngle);
    const pr   = 0.22; // radio del pentágono
    const pts  = [];
    for (let j = 0; j < 5; j++) {
      const a = baseAngle + (j * 2 * Math.PI) / 5;
      pts.push([pcx + pr * Math.cos(a), pcy + pr * Math.sin(a)]);
    }
    return pts;
  });

  pentagons.forEach(pts => poly(pts, '#e4e4e4'));

  ctx.restore();
}
/* FIN MUNDIAL */

/* ======================== Texto central ============================ */
function setCenterText(text, isWin){
  const displayText = (text === "NO GANADOR") ? "NO\nGANADOR" : text;
  centerText.textContent = displayText;
  centerText.className   = 'center-text ' + (isWin ? 'win' : 'lose');
  fitCenterFont();
}
function fitCenterFont(){
  const box  = wheel.getBoundingClientRect();
  const size = Math.min(box.width, box.height);
  const hubR  = Math.max(28, size * 0.17);
  const usable = hubR * 1.76;
  const byRadius = size * 0.04;
  const byLength = Math.max(14, usable / (centerText.textContent.length * 0.7));
  const px = Math.max(14, Math.min(byRadius, byLength, hubR * 0.55));
  centerText.style.fontSize = px + 'px';
}

/* ========================== Lógica de giro ========================= */
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

/*
 * computeIsWin — distribución aleatoria justa
 *
 * En lugar de forzar ganadores al final (que agrupa los premios),
 * usamos probabilidad condicional: dado que quedan remWinners premios
 * en remSpins giros, la probabilidad de ganar ESTE giro es exactamente
 * remWinners / remSpins.  Esto distribuye los ganadores de forma
 * uniforme a lo largo de todas las participaciones, sin agrupaciones.
 *
 * Si no hay ganadores disponibles → siempre NO GANADOR.
 * Si los giros restantes son exactamente iguales a los ganadores → forzar
 * (garantía matemática: no puede quedar ningún premio sin entregar).
 */
function computeIsWin(){
  const total      = totalParticipations();
  // remSpins incluye el giro ACTUAL (aún no se ha sumado a spins)
  const remSpins   = Math.max(0, total - spins);
  const remWinners = Math.max(0, CFG.winnersTotal - winnersGiven);

  if (remWinners <= 0) return false;           // stock agotado
  if (remSpins   <= 0) return false;           // no deberían llegar aquí
  if (remSpins <= remWinners) return true;     // garantía: ya no puede haber suficientes giros

  // Probabilidad condicional uniforme: remWinners / remSpins
  return Math.random() < (remWinners / remSpins);
}
function pickTargetIndexForResult(isWin){
  const indices = PRIZES
    .map((p, i) => ({p, i}))
    .filter(x => (isWin ? x.p.label === "GANADOR" : x.p.label === "NO GANADOR"))
    .map(x => x.i);
  return indices[Math.floor(Math.random() * indices.length)];
}

/* ---------- Confetti ---------- */
function celebrateWinDeluxe(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    try { confetti({ particleCount: 100, spread: 60, origin: { y: 0.7 } }); } catch(e){}
    return;
  }
  const duration     = 2000;
  const animationEnd = Date.now() + duration;
  try { confetti({ particleCount: 180, spread: 70, origin: { y: 0.6 }, scalar: 0.9 }); } catch(e){}
  const defaults = { startVelocity: 25, ticks: 200, zIndex: 1000 };
  const sideInterval = setInterval(() => {
    try {
      confetti(Object.assign({}, defaults, { particleCount: 10, angle: 60,  spread: 55, origin: { x: 0, y: 0.7 } }));
      confetti(Object.assign({}, defaults, { particleCount: 10, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } }));
    } catch(e){}
    if (Date.now() > animationEnd) clearInterval(sideInterval);
  }, 120);
  (function shower(){
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return;
    const particleCount = Math.round(50 * (timeLeft / duration));
    try { confetti({ particleCount, startVelocity: 30, spread: 85, origin: { x: Math.random(), y: -0.1 } }); } catch(e){}
    requestAnimationFrame(shower);
  })();
}

let X_SHAPE = null;
try { X_SHAPE = confetti.shapeFromText({ text: '✖', scalar: 2 }); } catch(e){}

function loseConfettiX(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    confetti({
      particleCount: 100, spread: 70, startVelocity: 30, origin: { y: 0.65 },
      shapes: X_SHAPE ? [X_SHAPE] : undefined,
      colors: ['#ff1744', '#d50000', '#b71c1c']
    });
  } catch(e){}
}

function spin(){
  if (!canSpin()) return;
  spinning = true;
  statusEl.textContent = 'Girando…';
  btnSpin.disabled = true;
  centerText.style.visibility = 'visible';
  setCenterText('Girando…', false);

  const willWin     = computeIsWin();
  const n           = PRIZES.length;
  const arc         = TAU / n;
  const targetIndex = pickTargetIndexForResult(willWin);

  let targetRotationModulo = POINTER_ANGLE - (targetIndex * arc + arc / 2);
  targetRotationModulo = ((targetRotationModulo % TAU) + TAU) % TAU;

  const current = ((rotation % TAU) + TAU) % TAU;
  let delta = TAU * 6 + (targetRotationModulo - current);
  delta = ((delta % TAU) + TAU) % TAU + TAU * 6;

  const duration      = 3800;
  const startTime     = performance.now();
  const startRotation = rotation;

  function frame(now){
    const t     = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(t);
    rotation = startRotation + delta * eased;
    drawWheel();
    if (t < 1){
      if (Math.random() < 0.15) clickSound();
      requestAnimationFrame(frame);
    } else {
      rotation = startRotation + delta;
      rotation = ((rotation % TAU) + TAU) % TAU;
      drawWheel();

      const winner = PRIZES[targetIndex];
      statusEl.textContent = "Resultado: " + winner.label;
      setCenterText(winner.label, winner.label === 'GANADOR');

      if (winner.label === "GANADOR"){
        badge.innerHTML = '<span class="badge-win">GANADOR</span>';
        badge.className = "badge win";
      } else {
        badge.innerHTML = '<span class="badge-lose"><span class="badge-no">NO</span> GANADOR</span>';
        badge.className = "badge lose";
      }
      sub.textContent = (winner.label === "GANADOR")
        ? "¡Felicidades! Pasa a canjear tu premio."
        : "Gracias por participar.";

      overlay.classList.add("show");
      centerText.style.visibility = 'hidden';
      if (navigator.vibrate) navigator.vibrate(100);
      if (winner.label === "GANADOR"){ celebrateWinDeluxe(); playWinJingle(); }
      else { loseConfettiX(); playLoseJingle(); }

      pendingResult = winner.label;
      spinning = false;
    }
  }
  requestAnimationFrame(frame);
}

/* ---------- Confirmación del resultado ---------- */
let pendingResult = null;
btnOk && btnOk.addEventListener('click', () => {
  overlay.classList.remove('show');
  centerText.style.visibility = 'visible';
  if (pendingResult){
    const now   = new Date();
    const tsKey = todayKey();
    LOG.push({ ts: `${tsKey}-${now.toISOString()}`, result: pendingResult });
    saveLog(LOG);
    if (pendingResult === 'GANADOR'){ winnersGiven += 1; saveWinnersGiven(); }
    pendingResult = null;
    spins += 1; saveSpins(); updatePill();
    updateStatsUI(); updateLogUI();
    if (spins >= totalParticipations()){
      btnSpin.disabled = true;
      statusEl.textContent = 'Se alcanzó el límite de participaciones.';
    }
  }
  startCooldown();
});

/* ---------- PIN modal open/close ---------- */
function openPinDialog(){
  pinMsg.textContent       = '';
  pinInput.value           = '';
  btnPinOk.disabled        = false;    // FIX: resetear botón cada vez que se abre
  pinOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => pinInput.focus(), 50);
}
function closePinDialog(){
  pinOverlay.style.display = 'none';
  document.body.style.overflow = '';
}
// FIX: Enter en el campo también envía el PIN
pinInput && pinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter'){ e.preventDefault(); validatePin(); }
});
btnConfig    && btnConfig.addEventListener('click', openPinDialog);
btnPinCancel && btnPinCancel.addEventListener('click', closePinDialog);
btnPinOk     && btnPinOk.addEventListener('click', validatePin);

/* ---------- Panel admin ---------- */
function openConfigPanel(){
  configPanel.classList.add('show');
  configPanel.setAttribute('aria-hidden', 'false');
  btnConfig && btnConfig.classList.add('spin');
  setTimeout(() => btnConfig && btnConfig.classList.remove('spin'), 800);
}
function closeConfigPanel(){
  configPanel.classList.remove('show');
  configPanel.setAttribute('aria-hidden', 'true');
}
btnCloseConfig   && btnCloseConfig.addEventListener('click', closeConfigPanel);
btnCfgCloseBottom  && btnCfgCloseBottom.addEventListener('click', closeConfigPanel);
btnCfgCloseBottom2 && btnCfgCloseBottom2.addEventListener('click', closeConfigPanel);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && configPanel.classList.contains('show')) closeConfigPanel();
});
function onAdminAuth(){
  fillSettingsForm();
  updateStatsUI();
  updateLogUI();
  openConfigPanel();
}

/* ---------- Tabs ---------- */
function activateTab(which){
  [tabSettings, tabLog].forEach(t => t && t.classList.remove('is-active'));
  [paneSettings, paneLog].forEach(p => { if(p){ p.classList.remove('show'); p.hidden = true; } });
  if (which === 'log'){
    tabLog      && tabLog.classList.add('is-active');
    paneLog     && (paneLog.classList.add('show'), paneLog.hidden = false);
  } else {
    tabSettings && tabSettings.classList.add('is-active');
    paneSettings && (paneSettings.classList.add('show'), paneSettings.hidden = false);
  }
}
tabSettings && tabSettings.addEventListener('click', () => activateTab('settings'));
tabLog      && tabLog.addEventListener('click', () => { updateLogUI(); activateTab('log'); });

/* ---------- Ajustes ---------- */
function fillSettingsForm(){
  if (cfgWinnersTotal) cfgWinnersTotal.value = String(CFG.winnersTotal);
  if (cfgWinProbX)     cfgWinProbX.value     = String(CFG.winProbX);
}
function readSettingsForm(){
  const winnersTotal = Math.max(0, parseInt((cfgWinnersTotal && cfgWinnersTotal.value) || '0', 10));
  const winProbX     = Math.max(1, parseInt((cfgWinProbX     && cfgWinProbX.value)     || '1', 10));
  return { winnersTotal, winProbX };
}
function updateStatsUI(){
  const { total, todayCount, remaining } = getTotals();
  statTotal     && (statTotal.textContent   = String(total));
  statCurrent   && (statCurrent.textContent = String(todayCount));
  statRemaining && (statRemaining.textContent = String(remaining));
}
configForm && configForm.addEventListener('submit', (e) => {
  e.preventDefault();
  CFG = { ...CFG, ...readSettingsForm() };
  saveCfg(CFG);
  const tot = totalParticipations();
  if (spins > tot){ spins = tot; saveSpins(); }
  updatePill();
  updateStatsUI();
  btnSpin.disabled = !canSpin();
  alert('Ajustes guardados.');
});
btnCfgResetAll && btnCfgResetAll.addEventListener('click', () => {
  if (!confirm('¿Reiniciar TODO? (log, contadores y ajustes)')) return;
  CFG = { ...DEFAULT_CFG }; saveCfg(CFG);
  LOG = []; saveLog(LOG);
  winnersGiven = 0; saveWinnersGiven();
  spins = 0; saveSpins();
  fillSettingsForm(); updateStatsUI(); updateLogUI(); updatePill();
  alert('Sistema reiniciado.');
});

/* ---------- Log ---------- */
function updateLogUI(){
  if (!logList) return;
  logList.innerHTML = '';
  const items = [...LOG].reverse();
  tabLogCount && (tabLogCount.textContent = String(LOG.length));
  for (let i = 0; i < items.length; i++){
    const it      = items[i];
    const whenIso = (it.ts || '').split('-').slice(1).join('-') || '';
    const date    = whenIso ? new Date(whenIso) : null;
    const whenTxt = date && !isNaN(date) ? date.toLocaleString() : '—';
    const li = document.createElement('li');
    li.innerHTML = `<span>${whenTxt}</span>
      <strong ${it.result==='GANADOR' ? 'style="color:#00843D"' : 'style="color:#2b5b3a"'}>${it.result}</strong>`;
    logList.appendChild(li);
  }
}
btnLogRefresh && btnLogRefresh.addEventListener('click', updateLogUI);
btnLogExport  && btnLogExport.addEventListener('click', () => {
  const header = ['fecha_local', 'resultado'];
  const rows   = LOG.map(it => {
    const whenIso = (it.ts || '').split('-').slice(1).join('-') || '';
    const date    = whenIso ? new Date(whenIso) : null;
    const whenTxt = date && !isNaN(date) ? date.toLocaleString() : '';
    return [whenTxt, it.result];
  });
  const csv  = [header.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'registro_ruleta.csv';
  a.click();
  URL.revokeObjectURL(a.href); // FIX: liberar memoria del blob
});

/* ---------- Cambio PIN ---------- */
const PIN_RE = /^\d{4,8}$/;
function pinError(msg){ pinChangeMsg && (pinChangeMsg.classList.remove('ok'), pinChangeMsg.textContent = msg || ''); }
function pinOkMsg(msg){ pinChangeMsg && (pinChangeMsg.classList.add('ok'),    pinChangeMsg.textContent = msg || ''); }

pinForm && pinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  pinError('');
  const oldVal  = (pinOld  && pinOld.value.trim())  || '';
  const newVal  = (pinNew  && pinNew.value.trim())  || '';
  const newVal2 = (pinNew2 && pinNew2.value.trim()) || '';

  if (!PIN_RE.test(newVal)) { pinError('El nuevo PIN debe tener 4–8 dígitos.'); return; }
  if (newVal !== newVal2)   { pinError('La confirmación no coincide.'); return; }

  const stored = await ensurePinV2();
  const ok     = await comparePin(oldVal, stored);
  if (!ok){ pinError('PIN actual incorrecto.'); return; }

  await setNewPin(newVal);
  pinOkMsg('PIN actualizado correctamente.');
  pinOld  && (pinOld.value  = '');
  pinNew  && (pinNew.value  = '');
  pinNew2 && (pinNew2.value = '');
});

btnPinResetDefault && btnPinResetDefault.addEventListener('click', async () => {
  pinError('');
  const oldVal = (pinOld && pinOld.value.trim()) || '';
  const stored = await ensurePinV2();
  const ok     = await comparePin(oldVal, stored);
  if (!ok){ pinError('PIN actual incorrecto.'); return; }
  await setNewPin(DEFAULT_PIN);
  pinOkMsg('PIN restablecido a 2468.');
  pinOld  && (pinOld.value  = '');
  pinNew  && (pinNew.value  = '');
  pinNew2 && (pinNew2.value = '');
});

/* ---------- Boot ---------- */
function boot(){
  const wheelBox = document.querySelector('.wheel-box');
  if (wheelBox) ro.observe(wheelBox);
  requestAnimationFrame(() => {
    fitAndDraw();
    setTimeout(fitAndDraw, 0);
    setTimeout(fitAndDraw, 60);
    setTimeout(fitAndDraw, 200);
  });
  spins = parseInt(localStorage.getItem(SPINS_KEY) || '0', 10);
  updatePill();
  setCenterText('¡SUERTE!', false);
  updateStatsUI();
  btnSpin.disabled = !canSpin();
}

/* ---------- Eventos ---------- */
btnSpin && btnSpin.addEventListener('click', spin, { passive: true });
wheel   && wheel.addEventListener('click', () => { if (canSpin()) spin(); }, { passive: true });
const wheelArea = document.querySelector('.wheel-area');
wheelArea && wheelArea.addEventListener('click', (e) => {
  const isControl = e.target.closest('#configPanel, .controls, button, a, input, select, textarea');
  if (isControl) return;
  if (canSpin()) spin();
}, { passive: true });

/* Inicia */
boot();
