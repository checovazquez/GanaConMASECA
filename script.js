/* =========================================================================
   Gana con MASECA – script.js (estable)
   ======================================================================= */

/* ---------- Refs base ---------- */
const wheel = document.getElementById('wheel');
const ctx = wheel.getContext('2d');
const statusEl = document.getElementById('status');
const btnSpin = document.getElementById('btnSpin');
const pillSpins = document.getElementById('pillSpins');
const overlay = document.getElementById('resultOverlay');
const badge = document.getElementById('resultBadge');
const sub = document.getElementById('resultSub');
const btnOk = document.getElementById('btnOk');
const centerText = document.getElementById('centerText');

/* ---------- Admin: PIN & panel ---------- */
const btnConfig = document.getElementById('btnConfig');
const pinOverlay = document.getElementById('pinOverlay');
const pinInput = document.getElementById('pinInput');
const pinMsg = document.getElementById('pinMsg');
const btnPinOk = document.getElementById('btnPinOk');
const btnPinCancel = document.getElementById('btnPinCancel');

const configPanel = document.getElementById('configPanel');
const btnCloseConfig = document.getElementById('btnCloseConfig');
const btnCfgCloseBottom = document.getElementById('btnCfgCloseBottom');
const btnCfgCloseBottom2 = document.getElementById('btnCfgCloseBottom2');

/* Tabs */
const tabSettings = document.getElementById('tabSettings');
const tabLog = document.getElementById('tabLog');
const paneSettings = document.getElementById('paneSettings');
const paneLog = document.getElementById('paneLog');
const tabLogCount = document.getElementById('tabLogCount');

/* Ajustes – formulario */
const configForm = document.getElementById('configForm');
const cfgWinnersTotal = document.getElementById('cfgWinnersTotal');
const cfgWinProbX = document.getElementById('cfgWinProbX');
const statTotal = document.getElementById('statTotal');
const statCurrent = document.getElementById('statCurrent');
const statRemaining = document.getElementById('statRemaining');
const btnCfgSave = document.getElementById('btnCfgSave');
const btnCfgResetAll = document.getElementById('btnCfgResetAll');

/* Admin – cambio de PIN */
const pinForm = document.getElementById('pinForm');
const pinOld = document.getElementById('pinOld');
const pinNew = document.getElementById('pinNew');
const pinNew2 = document.getElementById('pinNew2');
const pinChangeMsg = document.getElementById('pinChangeMsg');
const btnPinResetDefault = document.getElementById('btnPinResetDefault');

/* Registro */
const logList = document.getElementById('logList');
const btnLogRefresh = document.getElementById('btnLogRefresh');
const btnLogExport = document.getElementById('btnLogExport');

/* ---------- Estado ruleta ---------- */
let rotation = 0;
let spinning = false;
const TAU = Math.PI * 2;
const POINTER_ANGLE = -Math.PI / 2;

const PRIZES = Array.from({ length: 8 }, (_, i) =>
  i % 2 === 0 ? { label: "GANADOR", color: "#00843D" }
              : { label: "NO GANADOR", color: "#A8D5BA" }
);

/* ---------- Sonidos ---------- */
let audioCtx;
function clickSound(){
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type='square'; o.frequency.value=800; g.gain.value=0.03;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); setTimeout(()=>o.stop(), 20);
}
function ding(){
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type='sine'; o.frequency.setValueAtTime(880, audioCtx.currentTime);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime+0.3);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime+0.32);
}

/* ---------- Cooldown / giros ---------- */
const COOLDOWN_SECONDS = 5;
let cooldownTimer = null;
let cooldownEndTs = 0;

function startCooldown(){
  cooldownEndTs = Date.now() + COOLDOWN_SECONDS * 1000;
  btnSpin.disabled = true;
  tickCooldown(); cooldownTimer = setInterval(tickCooldown, 200);
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
  const used = Math.min(spins, total); // clamp por si cambian ajustes hacia abajo
  pillSpins && (pillSpins.textContent = `Participaciones: ${used} / ${total}`);
}

function canSpin(){
  if (spinning) return false;
  if (cooldownEndTs && Date.now() < cooldownEndTs) return false;
  if (spins >= totalParticipations()) return false;    // no más giros
  return true;
}



/* ---------- Config & Log ---------- */
const CFG_KEY = 'maseca_cfg_admin_v1';
const DEFAULT_CFG = {
  winnersTotal: 10,  // stock por defecto
  winProbX: 10       // 1 en 10 → 10*10 = 100 participaciones
};
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

function todayKey(){ const d=new Date(); return `y${d.getFullYear()}m${d.getMonth()+1}d${d.getDate()}`; }
function getTotals(){
  const total = LOG.length;
  const dKey = todayKey();
  const todayCount = LOG.filter(x => (x.ts || '').startsWith(dKey)).length;
  const remaining = Math.max(0, CFG.winnersTotal - winnersGiven);
  return { total, todayCount, remaining };
}

function totalParticipations(){
  const stock = Math.max(0, parseInt(CFG.winnersTotal || 0, 10));
  const x = Math.max(1, parseInt(CFG.winProbX || 1, 10));
  return stock * x;
}
function remainingParticipations(){
  const total = totalParticipations();
  return Math.max(0, total - spins);
}


/* ====================== PIN seguro con fallback ===================== */
const PIN_KEY = 'maseca_admin_pin_v2';   // nueva clave con esquema
const DEFAULT_PIN = '2468';

// Devuelve "sha256:<hex>" si hay crypto.subtle; si no, "plain:<pin>"
async function hashWithScheme(pin) {
  if (window.crypto && crypto.subtle) {
    const enc = new TextEncoder().encode(pin);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const hex = [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
    return `sha256:${hex}`;
  }
  return `plain:${pin}`;
}
// Compara input contra hash+esquema
async function comparePin(inputPin, stored) {
  if (!stored) return false;
  const [scheme, value] = stored.split(':');
  if (scheme === 'sha256') {
    if (!(window.crypto && crypto.subtle)) return false;
    const enc = new TextEncoder().encode(inputPin);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const hex = [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
    return hex === value;
  }
  if (scheme === 'plain') return inputPin === value;
  return false;
}
// Asegura que exista un PIN
async function ensurePinV2() {
  let stored = localStorage.getItem(PIN_KEY);
  if (!stored) {
    stored = await hashWithScheme(DEFAULT_PIN);
    localStorage.setItem(PIN_KEY, stored);
  }
  return stored;
}
// Mostrar PIN actual (solo debug en UI principal)
async function showCurrentPin(){
  const stored = await ensurePinV2();
  let displayPin = '(PIN cifrado)';
  if (stored.startsWith('plain:')) displayPin = stored.split(':')[1];
  if (stored.startsWith('sha256:') && stored === `sha256:${''.padStart(64,'0')}`) displayPin = '(vacío)';
  const el = document.getElementById('pinDisplay');
  if (el) el.textContent = `PIN actual: ${stored.startsWith('plain:') ? displayPin : 'PIN cifrado'}`;
}
// Validación del PIN desde el modal
async function validatePin(){
  const entered = pinInput.value.trim();
  if (!entered){ pinMsg.textContent = 'Ingresa tu PIN.'; return; }
  const stored = await ensurePinV2();
  const ok = await comparePin(entered, stored);
  if (ok) { pinMsg.textContent = ''; closePinDialog(); onAdminAuth(); }
  else { pinMsg.textContent = 'PIN incorrecto.'; pinInput.select(); }
}
// Set nuevo PIN
async function setNewPin(newPin) {
  const hashed = await hashWithScheme(newPin);
  localStorage.setItem(PIN_KEY, hashed);
  await showCurrentPin();
}

/* ============================ Canvas =============================== */
function fitCanvasToBox(){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const box = document.querySelector('.wheel-box') || wheel;
  const rect = box.getBoundingClientRect();
  wheel.width  = Math.round(rect.width * dpr);
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
  const n = PRIZES.length;
  const arc = TAU / n;

  ctx.clearRect(0, 0, wheel.width, wheel.height);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotation); ctx.translate(-cx, -cy);

  for (let i=0;i<n;i++){
    const start = i*arc, end = start+arc, prize = PRIZES[i];
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R-10, start, end); ctx.closePath();
    ctx.fillStyle = prize.color; ctx.fill();
    ctx.strokeStyle = '#e3e5df'; ctx.lineWidth = 2; ctx.stroke();

    ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + arc/2);
    ctx.textAlign = 'right'; ctx.textBaseline='middle';
    ctx.fillStyle = (prize.label==="GANADOR") ? "#ffffff" : "#004d24";
    ctx.font = Math.max(12, Math.floor(size * 0.038)) + "px system-ui";
    ctx.fillText(prize.label, R-28, 0);
    ctx.restore();
  }
  ctx.restore();

  const hubR = Math.max(28, size * 0.17);
  ctx.beginPath(); ctx.arc(cx, cy, hubR, 0, TAU);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--maseca-yellow'); ctx.fill();
  ctx.lineWidth = Math.max(2, size * 0.006); ctx.strokeStyle = '#ffffff'; ctx.stroke();
  const innerR = hubR * 0.78;
  ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, TAU);
  ctx.fillStyle = '#ffffff'; ctx.fill();
}

/* ======================== Texto central ============================ */
function setCenterText(text, isWin){
  const displayText = (text === "NO GANADOR") ? "NO\nGANADOR" : text;
  centerText.textContent = displayText;
  centerText.className = 'center-text ' + (isWin ? 'win' : 'lose');
  fitCenterFont();
}
function fitCenterFont(){
  const box = wheel.getBoundingClientRect();
  const size = Math.min(box.width, box.height);
  const hubR = Math.max(28, size * 0.17);
  const usable = hubR * 1.76;
  const byRadius = size * 0.04;
  const byLength = Math.max(14, usable / (centerText.textContent.length * 0.7));
  const px = Math.max(14, Math.min(byRadius, byLength, hubR * 0.55));
  centerText.style.fontSize = px + 'px';
}

/* ========================== Lógica de giro ========================= */
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
function getTotalsForWinCheck(){
  const { remaining } = getTotals();
  return { remaining, X: Math.max(1, parseInt(CFG.winProbX || 1, 10)) };
}
function computeIsWin(){
  const total = totalParticipations();                 // stock * X
  const remSpins = Math.max(0, total - spins);         // giros que faltan (incluido el actual si aún no confirmas)
  const remWinners = Math.max(0, CFG.winnersTotal - winnersGiven);

  if (remWinners <= 0) return false;                   // no queda stock → NO GANADOR
  if (remSpins <= remWinners) return true;             // estamos en la recta final → forzar GANADOR

  // Fuera de la “recta final”, usa la prob 1 en X
  const X = Math.max(1, parseInt(CFG.winProbX || 1, 10));
  return Math.floor(Math.random() * X) === 0;
}

function pickTargetIndexForResult(isWin){
  const indices = PRIZES
    .map((p, i) => ({p, i}))
    .filter(x => (isWin ? x.p.label==="GANADOR" : x.p.label==="NO GANADOR"))
    .map(x => x.i);
  return indices[Math.floor(Math.random() * indices.length)];
}
function spin(){
  if (!canSpin()) return;
  spinning = true;
  statusEl.textContent = 'Girando…';
  btnSpin.disabled = true;
  centerText.style.visibility = 'visible';
  setCenterText('Girando…', false);

  const willWin = computeIsWin();
  const n = PRIZES.length;
  const arc = TAU / n;
  const targetIndex = pickTargetIndexForResult(willWin);

  let targetRotationModulo = POINTER_ANGLE - (targetIndex * arc + arc/2);
  targetRotationModulo = ((targetRotationModulo % TAU) + TAU) % TAU;

  const current = ((rotation % TAU) + TAU) % TAU;
  let delta = TAU * 6 + (targetRotationModulo - current);
  delta = ((delta % TAU) + TAU) % TAU + TAU * 6;

  const duration = 3800;
  const startTime = performance.now();
  const startRotation = rotation;

  function frame(now){
    const t = Math.min(1, (now - startTime)/duration);
    const eased = easeOutCubic(t);
    rotation = startRotation + delta * eased;
    drawWheel();
    if(t < 1){
      if (Math.random() < 0.15) clickSound();
      requestAnimationFrame(frame);
    } else {
      rotation = startRotation + delta;
      rotation = ((rotation % TAU) + TAU) % TAU;
      drawWheel();

      const winner = PRIZES[targetIndex];
      statusEl.textContent = "Resultado: " + winner.label;
      setCenterText(winner.label, winner.label === 'GANADOR');

      badge.textContent = winner.label;
      badge.className = "badge " + (winner.label === "GANADOR" ? "win" : "lose");
      sub.textContent = (winner.label === "GANADOR")
        ? "¡Felicidades! Pasa a canjear tu premio."
        : "Gracias por participar.";
      overlay.classList.add("show");
      centerText.style.visibility = 'hidden';
      if (navigator.vibrate) { navigator.vibrate(100); }
      ding();

      pendingResult = winner.label;
      spinning = false;
    }
  }
  requestAnimationFrame(frame);
}

/* Confirmación del resultado */
let pendingResult = null;
btnOk && btnOk.addEventListener('click', ()=>{
  overlay.classList.remove('show');
  centerText.style.visibility = 'visible';

  if (pendingResult){
    const now = new Date();
    const tsKey = todayKey();
    LOG.push({ ts: `${tsKey}-${now.toISOString()}`, result: pendingResult });
    saveLog(LOG);

    if (pendingResult === 'GANADOR'){
      winnersGiven += 1; saveWinnersGiven();
    }
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
  pinMsg.textContent = '';
  pinInput.value = '';
  pinOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(()=>pinInput.focus(), 50);
}
function closePinDialog(){
  pinOverlay.style.display = 'none';
  document.body.style.overflow = '';
}
btnConfig && btnConfig.addEventListener('click', openPinDialog);
btnPinCancel && btnPinCancel.addEventListener('click', closePinDialog);
btnPinOk && btnPinOk.addEventListener('click', validatePin);

/* ---------- Panel admin ---------- */
function openConfigPanel(){
  configPanel.classList.add('show');
  configPanel.setAttribute('aria-hidden', 'false');
  btnConfig && btnConfig.classList.add('spin');
  setTimeout(()=>btnConfig && btnConfig.classList.remove('spin'), 800);
}
function closeConfigPanel(){
  configPanel.classList.remove('show');
  configPanel.setAttribute('aria-hidden', 'true');
}
btnCloseConfig && btnCloseConfig.addEventListener('click', closeConfigPanel);
btnCfgCloseBottom && btnCfgCloseBottom.addEventListener('click', closeConfigPanel);
btnCfgCloseBottom2 && btnCfgCloseBottom2.addEventListener('click', closeConfigPanel);
window.addEventListener('keydown', (e)=>{
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
  const tabs = [tabSettings, tabLog];
  const panes = [paneSettings, paneLog];
  tabs.forEach(t => t && t.classList.remove('is-active'));
  panes.forEach(p => { if(p){ p.classList.remove('show'); p.hidden = true; } });
  if (which === 'log'){ tabLog && tabLog.classList.add('is-active'); paneLog && (paneLog.classList.add('show'), paneLog.hidden = false); }
  else { tabSettings && tabSettings.classList.add('is-active'); paneSettings && (paneSettings.classList.add('show'), paneSettings.hidden = false); }
}
tabSettings && tabSettings.addEventListener('click', ()=>activateTab('settings'));
tabLog && tabLog.addEventListener('click', ()=>{ updateLogUI(); activateTab('log'); });

/* ---------- Ajustes ---------- */
function fillSettingsForm(){
  if (cfgWinnersTotal) cfgWinnersTotal.value = String(CFG.winnersTotal);
  if (cfgWinProbX) cfgWinProbX.value = String(CFG.winProbX);
}
function readSettingsForm(){
  const winnersTotal = Math.max(0, parseInt((cfgWinnersTotal && cfgWinnersTotal.value) || '0', 10));
  const winProbX = Math.max(1, parseInt((cfgWinProbX && cfgWinProbX.value) || '1', 10));
  return { winnersTotal, winProbX };
}
function updateStatsUI(){
  const { total, todayCount, remaining } = getTotals(); // tus stats de log
  const partLeft = remainingParticipations();

  statTotal && (statTotal.textContent = String(total));
  statCurrent && (statCurrent.textContent = String(todayCount));
  statRemaining && (statRemaining.textContent = String(remaining));

  // Si quieres mostrarlo en otra etiqueta, o en la pill ya lo ves:
  // console.log('Participaciones restantes:', partLeft);
}
configForm && configForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  CFG = { ...CFG, ...readSettingsForm() };
  saveCfg(CFG);

  // clamp de spins si el nuevo total es menor
  const tot = totalParticipations();
  if (spins > tot) { spins = tot; saveSpins(); }

  updatePill();
  updateStatsUI();

  // Habilita/deshabilita el botón según corresponda
  btnSpin.disabled = !canSpin();

  alert('Ajustes guardados.');
});
btnCfgResetAll && btnCfgResetAll.addEventListener('click', ()=>{
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
  for (let i=0; i<items.length; i++){
    const it = items[i];
    const whenIso = (it.ts || '').split('-').slice(1).join('-') || '';
    const date = whenIso ? new Date(whenIso) : null;
    const whenTxt = date ? date.toLocaleString() : '—';
    const li = document.createElement('li');
    li.innerHTML = `<span>${whenTxt}</span>
      <strong ${it.result==='GANADOR'?'style="color:#00843D"':'style="color:#2b5b3a"'}>${it.result}</strong>`;
    logList.appendChild(li);
  }
}
btnLogRefresh && btnLogRefresh.addEventListener('click', updateLogUI);
btnLogExport && btnLogExport.addEventListener('click', ()=>{
  const header = ['fecha_local','resultado'];
  const rows = LOG.map(it => {
    const whenIso = (it.ts || '').split('-').slice(1).join('-') || '';
    const date = whenIso ? new Date(whenIso) : null;
    const whenTxt = date ? date.toLocaleString() : '';
    return [whenTxt, it.result];
  });
  const csv = [header.join(','), ...rows.map(r => r.map(v=>String(v).replace(/"/g,'""')).map(v=>`"${v}"`).join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'registro_ruleta.csv'; a.click();
});

/* ---------- Cambio PIN ---------- */
const PIN_RE = /^\d{4,8}$/;
function pinError(msg){ pinChangeMsg && (pinChangeMsg.classList.remove('ok'), pinChangeMsg.textContent = msg || ''); }
function pinOk(msg){ pinChangeMsg && (pinChangeMsg.classList.add('ok'), pinChangeMsg.textContent = msg || ''); }
pinForm && pinForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  pinError('');
  const oldVal = (pinOld && pinOld.value.trim()) || '';
  const newVal = (pinNew && pinNew.value.trim()) || '';
  const newVal2 = (pinNew2 && pinNew2.value.trim()) || '';

  if (!PIN_RE.test(newVal)) { pinError('El nuevo PIN debe tener 4–8 dígitos.'); return; }
  if (newVal !== newVal2)   { pinError('La confirmación no coincide.'); return; }

  const stored = await ensurePinV2();
  const ok = await comparePin(oldVal, stored);
  if (!ok){ pinError('PIN actual incorrecto.'); return; }

  await setNewPin(newVal);
  pinOk('PIN actualizado correctamente.');
  pinOld && (pinOld.value = ''); pinNew && (pinNew.value = ''); pinNew2 && (pinNew2.value = '');
});
btnPinResetDefault && btnPinResetDefault.addEventListener('click', async ()=>{
  pinError('');
  const oldVal = (pinOld && pinOld.value.trim()) || '';
  const stored = await ensurePinV2();
  const ok = await comparePin(oldVal, stored);
  if (!ok){ pinError('PIN actual incorrecto.'); return; }
  await setNewPin(DEFAULT_PIN);
  pinOk('PIN restablecido a 2468.');
  pinOld && (pinOld.value = ''); pinNew && (pinNew.value = ''); pinNew2 && (pinNew2.value = '');
});

/* ---------- Boot robusto ---------- */
function boot(){
  const wheelBox = document.querySelector('.wheel-box');
  if (wheelBox) ro.observe(wheelBox);

  requestAnimationFrame(() => {
    fitAndDraw();
    setTimeout(fitAndDraw, 0);
    setTimeout(fitAndDraw, 60);
    setTimeout(fitAndDraw, 200);
  });

  // Lee spins actuales y pinta pill calculada
  spins = parseInt(localStorage.getItem(SPINS_KEY) || '0', 10);
  updatePill();

  setCenterText('¡SUERTE!', false);
  updateStatsUI();
  showCurrentPin(); // tu helper de debug
  // Asegura estado del botón
  btnSpin.disabled = !canSpin();
}


/* Eventos básicos */
btnSpin && btnSpin.addEventListener('click', spin, { passive:true });
wheel && wheel.addEventListener('click', ()=>{ if(canSpin()) spin(); }, { passive:true });
window.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape' && configPanel && configPanel.classList.contains('show')) closeConfigPanel();
});

/* Inicia */
boot();
