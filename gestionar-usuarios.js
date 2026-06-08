#!/usr/bin/env node
/*
 * gestionar-usuarios.js — Panel de administración de usuarios (ABM)
 *
 * USO:
 *   node gestionar-usuarios.js
 *
 * Requiere: npm install firebase-admin (ya instalado)
 */

const admin   = require('firebase-admin');
const readline = require('readline');

// ── Inicializar Firebase Admin ────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert(
    require('./gana-con-maseca-firebase-adminsdk-fbsvc-6b40cc3088.json')
  ),
});

const db   = admin.firestore();
const auth = admin.auth();

// ── Catálogo de tiendas (sincronizado con firebase-app.js) ────────────────
const STORES = [
  { label: '232 | CHESELECTO POLANCO',                email: 'tienda232@maseca.com' },
  { label: '234 | CHEDRAUI AJUSCO',                   email: 'tienda234@maseca.com' },
  { label: '237 | CHEDRAUI TENAYUCA',                 email: 'tienda237@maseca.com' },
  { label: '249 | CHESELECTO GDL ACUEDUCTO',          email: 'tienda249@maseca.com' },
  { label: '262 | SELECTO PLAZA MEXICO',              email: 'tienda262@maseca.com' },
  { label: '94 | SANTO DOMINGO',                      email: 'tienda94@maseca.com' },
  { label: '97 | CUMBRES',                            email: 'tienda97@maseca.com' },
  { label: '105 | EL MOLINETE',                       email: 'tienda105@maseca.com' },
  { label: '107 | LAS MARGARITAS',                    email: 'tienda107@maseca.com' },
  { label: '108 | SANTA CATARINA',                    email: 'tienda108@maseca.com' },
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
  { label: '2944 | MARGARITAS',                       email: 'tienda2944@maseca.com' },
  { label: '2923 | CABEZADA',                         email: 'tienda2923@maseca.com' },
  { label: '9113 | ANZURES',                          email: 'tienda9113@maseca.com' },
  { label: '0 | SANTA MARIA',                         email: 'santa-maria@maseca.com' },
  { label: '574 | MERCO SOLIDARIDAD',                 email: 'tienda574@maseca.com' },
  { label: '1301 | MERCO PLAZA SENDERO',              email: 'tienda1301@maseca.com' },
  { label: '0 | MERCO LINDA VISTA',                   email: 'merco-linda-vista@maseca.com' },
  { label: '0 | MERCO GARCIA',                        email: 'merco-garcia@maseca.com' },
  { label: '0 | MERCO BUENAVISTA',                    email: 'merco-buenavista@maseca.com' },
  { label: '3623 | BA LOS FRESNOS',                   email: 'tienda3623@maseca.com' },
  { label: '3625 | BA DIAZ BERLANGA',                 email: 'tienda3625@maseca.com' },
  { label: '3443 | BA CLOUTHIER',                     email: 'tienda3443@maseca.com' },
  { label: '5712 | BA SOLIDARIDAD',                   email: 'tienda5712@maseca.com' },
  { label: '3298 | BA ESCOBEDO MTY',                  email: 'tienda3298@maseca.com' },
  { label: '2097 | BA PUEBLO NUEVO',                  email: 'tienda2097@maseca.com' },
  { label: '3362 | BA TOPOCHICO',                     email: 'tienda3362@maseca.com' },
  { label: '3801 | BA STO. DOMINGO NVO. LEON',        email: 'tienda3801@maseca.com' },
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
  { label: '3781 | BA INDEPENDENCIA',                 email: 'tienda3781@maseca.com' },
  { label: '3780 | BA ATEMAJAC',                      email: 'tienda3780@maseca.com' },
  { label: '3557 | BA CHULAVISTA',                    email: 'tienda3557@maseca.com' },
  { label: '1555 | BA SOLIDARIDAD GUAD',              email: 'tienda1555@maseca.com' },
  { label: '3866 | BA ARBOLEDAS',                     email: 'tienda3866@maseca.com' },
  { label: '2028 | BA CONCEPCION DEL VALLE',          email: 'tienda2028@maseca.com' },
  { label: '2135 | BA CLINICA UNION DEL CUAT',        email: 'tienda2135@maseca.com' },
  { label: '91 | SOLIDARIDAD',                        email: 'tienda91@maseca.com' },
  { label: '0 | VILLAS',                              email: 'villas@maseca.com' },
  { label: '0 | SOLIDARIDAD',                         email: 'solidaridad@maseca.com' },
  { label: '0 | PEDRERAS',                            email: 'pedreras@maseca.com' },
  { label: '0 | VALLE DEL ROBLE',                     email: 'valle-del-roble@maseca.com' },
  { label: '0 | VALLE DEL ROBLE OLMOS',               email: 'valle-del-roble-olmos@maseca.com' },
  { label: '0 | LINCOLN',                             email: 'lincoln@maseca.com' },
];

// ── Helpers de terminal ───────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

const C = {
  reset: '\x1b[0m',  bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan:  '\x1b[36m', gray: '\x1b[90m', blue: '\x1b[34m',
};
const bold   = s => `${C.bold}${s}${C.reset}`;
const green  = s => `${C.green}${s}${C.reset}`;
const red    = s => `${C.red}${s}${C.reset}`;
const yellow = s => `${C.yellow}${s}${C.reset}`;
const cyan   = s => `${C.cyan}${s}${C.reset}`;
const gray   = s => `${C.gray}${s}${C.reset}`;

function hr(char = '─', n = 54) { return gray(char.repeat(n)); }
function cls() { process.stdout.write('\x1bc'); }

function genPassword(len = 6) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
}

// ── Operaciones Firebase ──────────────────────────────────────────────────

async function listAllUsers() {
  const users = [];
  let pageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    users.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  return users;
}

async function getUserStats() {
  const snap = await db.collection('storeStats').get();
  const map  = {};
  snap.forEach(doc => { map[doc.id] = doc.data(); });
  return map;
}

// ── MENÚ PRINCIPAL ────────────────────────────────────────────────────────

async function mainMenu() {
  while (true) {
    cls();
    console.log('');
    console.log(bold('  ╔══════════════════════════════════════════╗'));
    console.log(bold('  ║    Gana con MASECA — Gestión Usuarios    ║'));
    console.log(bold('  ╚══════════════════════════════════════════╝'));
    console.log('');
    console.log(`  ${cyan('1')}  Listar todos los usuarios`);
    console.log(`  ${cyan('2')}  Buscar usuario por email`);
    console.log(`  ${cyan('3')}  Crear nuevo usuario`);
    console.log(`  ${cyan('4')}  Cambiar contraseña`);
    console.log(`  ${cyan('5')}  Habilitar / deshabilitar usuario`);
    console.log(`  ${cyan('6')}  Eliminar usuario`);
    console.log(`  ${cyan('7')}  Crear todos los usuarios del catálogo`);
    console.log(`  ${cyan('8')}  Ver actividad de una tienda`);
    console.log('');
    console.log(`  ${gray('0')}  Salir`);
    console.log('');

    const op = (await ask('  Opción: ')).trim();

    switch (op) {
      case '1': await menuListar();          break;
      case '2': await menuBuscar();          break;
      case '3': await menuCrear();           break;
      case '4': await menuCambiarPassword(); break;
      case '5': await menuToggle();          break;
      case '6': await menuEliminar();        break;
      case '7': await menuCrearTodos();      break;
      case '8': await menuActividad();       break;
      case '0': rl.close(); process.exit(0);
      default:  console.log(red('\n  Opción inválida.\n')); await ask('  Enter para continuar…');
    }
  }
}

// ── 1. LISTAR ─────────────────────────────────────────────────────────────

async function menuListar() {
  cls();
  console.log('\n  Cargando usuarios…\n');

  const [users, stats] = await Promise.all([listAllUsers(), getUserStats()]);
  const storeEmails = new Set(STORES.map(s => s.email));

  // Separar admin de tiendas
  const admins  = users.filter(u => !storeEmails.has(u.email));
  const tiendas = users.filter(u =>  storeEmails.has(u.email));

  console.log(hr('═'));
  console.log(bold(`  USUARIOS — Total: ${users.length}  (tiendas: ${tiendas.length}, admin: ${admins.length})`));
  console.log(hr('═'));

  // Admins
  if (admins.length) {
    console.log(`\n  ${bold('Administradores')}`);
    admins.forEach(u => {
      const estado = u.disabled ? red('[DESHABILITADO]') : green('[activo]');
      console.log(`  ${estado}  ${u.email}`);
    });
  }

  // Tiendas
  console.log(`\n  ${bold('Tiendas')}  ${gray('(✓ = tiene actividad en Firestore)')}`);
  const sorted = [...tiendas].sort((a, b) => a.email.localeCompare(b.email));
  sorted.forEach(u => {
    const store   = STORES.find(s => s.email === u.email);
    const label   = store ? store.label : u.email;
    const estado  = u.disabled ? red('[OFF]') : green('[ON] ');
    const actividad = stats[u.uid] ? cyan(` ✓ ${stats[u.uid].spinsCount || 0} giros`) : '';
    console.log(`  ${estado}  ${label}${actividad}`);
  });

  // Emails del catálogo sin cuenta en Auth
  const authEmails = new Set(users.map(u => u.email));
  const sinCuenta  = STORES.filter(s => !authEmails.has(s.email));
  if (sinCuenta.length) {
    console.log(`\n  ${yellow('Sin cuenta en Firebase Auth:')} ${sinCuenta.length}`);
    sinCuenta.forEach(s => console.log(`  ${yellow('✗')}  ${s.label}  ${gray(s.email)}`));
  }

  console.log('\n' + hr('═'));
  await ask('\n  Enter para volver…');
}

// ── 2. BUSCAR ─────────────────────────────────────────────────────────────

async function menuBuscar() {
  cls();
  console.log('\n' + bold('  Buscar usuario') + '\n');
  const q = (await ask('  Email o nombre de tienda: ')).trim().toLowerCase();
  if (!q) return;

  const users = await listAllUsers();
  const found = users.filter(u =>
    u.email.toLowerCase().includes(q) ||
    (STORES.find(s => s.email === u.email)?.label.toLowerCase().includes(q))
  );

  if (!found.length) {
    console.log(red('\n  No se encontró ningún usuario.\n'));
    await ask('  Enter para volver…'); return;
  }

  for (const u of found) {
    const store = STORES.find(s => s.email === u.email);
    console.log('\n' + hr());
    console.log(`  ${bold('Email:')}    ${u.email}`);
    if (store) console.log(`  ${bold('Tienda:')}   ${store.label}`);
    console.log(`  ${bold('UID:')}      ${gray(u.uid)}`);
    console.log(`  ${bold('Estado:')}   ${u.disabled ? red('Deshabilitado') : green('Activo')}`);
    console.log(`  ${bold('Creado:')}   ${u.metadata.creationTime || '—'}`);
    console.log(`  ${bold('Último login:')} ${u.metadata.lastSignInTime || '—'}`);

    // Estadísticas de Firestore
    try {
      const doc = await db.collection('storeStats').doc(u.uid).get();
      if (doc.exists) {
        const s = doc.data();
        console.log(`  ${bold('Giros:')}    ${s.spinsCount || 0}   Ganadores: ${s.winnersGiven || 0}`);
        if (s.lastSpin) console.log(`  ${bold('Último giro:')} ${s.lastSpin.toDate().toLocaleString('es-MX')}`);
      } else {
        console.log(`  ${gray('Sin actividad registrada en Firestore.')}`);
      }
    } catch (_) {}
  }

  console.log('\n' + hr());
  await ask('\n  Enter para volver…');
}

// ── 3. CREAR ──────────────────────────────────────────────────────────────

async function menuCrear() {
  cls();
  console.log('\n' + bold('  Crear usuario') + '\n');

  const email = (await ask('  Email: ')).trim().toLowerCase();
  if (!email || !email.includes('@')) { console.log(red('  Email inválido.')); await ask('  Enter…'); return; }

  const sugerida = genPassword();
  const pwdInput = (await ask(`  Contraseña (Enter = generar: ${cyan(sugerida)}): `)).trim();
  const password = pwdInput || sugerida;

  if (password.length < 6) { console.log(red('  Mínimo 6 caracteres.')); await ask('  Enter…'); return; }

  console.log('');
  try {
    const user = await auth.createUser({ email, password, emailVerified: false });
    console.log(green(`  ✅ Usuario creado: ${user.email}`));
    console.log(`     UID:        ${gray(user.uid)}`);
    console.log(`     Contraseña: ${bold(password)}`);

    const store = STORES.find(s => s.email === email);
    if (store) console.log(`     Tienda:     ${store.label}`);
    else        console.log(yellow('     ⚠ Este email no está en el catálogo de tiendas de la app.'));
  } catch (e) {
    console.log(red(`  ❌ Error: ${e.message}`));
  }

  await ask('\n  Enter para volver…');
}

// ── 4. CAMBIAR CONTRASEÑA ────────────────────────────────────────────────

async function menuCambiarPassword() {
  cls();
  console.log('\n' + bold('  Cambiar contraseña') + '\n');

  const email = (await ask('  Email del usuario: ')).trim().toLowerCase();
  if (!email) return;

  let user;
  try { user = await auth.getUserByEmail(email); }
  catch (e) { console.log(red(`  ❌ Usuario no encontrado: ${email}`)); await ask('  Enter…'); return; }

  const store    = STORES.find(s => s.email === email);
  const sugerida = genPassword();
  console.log(`\n  Tienda: ${store ? store.label : gray('(no en catálogo)')}`);
  const pwdInput = (await ask(`  Nueva contraseña (Enter = generar: ${cyan(sugerida)}): `)).trim();
  const password = pwdInput || sugerida;

  if (password.length < 6) { console.log(red('  Mínimo 6 caracteres.')); await ask('  Enter…'); return; }

  try {
    await auth.updateUser(user.uid, { password });
    console.log(green(`\n  ✅ Contraseña actualizada.`));
    console.log(`     Email:      ${email}`);
    console.log(`     Contraseña: ${bold(password)}`);
  } catch (e) {
    console.log(red(`  ❌ Error: ${e.message}`));
  }

  await ask('\n  Enter para volver…');
}

// ── 5. HABILITAR / DESHABILITAR ───────────────────────────────────────────

async function menuToggle() {
  cls();
  console.log('\n' + bold('  Habilitar / Deshabilitar usuario') + '\n');

  const email = (await ask('  Email del usuario: ')).trim().toLowerCase();
  if (!email) return;

  let user;
  try { user = await auth.getUserByEmail(email); }
  catch (e) { console.log(red(`  ❌ Usuario no encontrado.`)); await ask('  Enter…'); return; }

  const estadoActual = user.disabled ? red('Deshabilitado') : green('Activo');
  const accion       = user.disabled ? 'habilitar' : 'deshabilitar';
  console.log(`\n  Estado actual: ${estadoActual}`);
  const conf = (await ask(`  ¿${accion}? (s/N): `)).trim().toLowerCase();
  if (conf !== 's') { console.log(gray('  Cancelado.')); await ask('  Enter…'); return; }

  try {
    await auth.updateUser(user.uid, { disabled: !user.disabled });
    console.log(green(`\n  ✅ Usuario ${user.disabled ? 'habilitado' : 'deshabilitado'}: ${email}`));
  } catch (e) {
    console.log(red(`  ❌ Error: ${e.message}`));
  }

  await ask('\n  Enter para volver…');
}

// ── 6. ELIMINAR ───────────────────────────────────────────────────────────

async function menuEliminar() {
  cls();
  console.log('\n' + bold('  Eliminar usuario') + '\n');

  const email = (await ask('  Email del usuario: ')).trim().toLowerCase();
  if (!email) return;

  let user;
  try { user = await auth.getUserByEmail(email); }
  catch (e) { console.log(red(`  ❌ Usuario no encontrado.`)); await ask('  Enter…'); return; }

  const store = STORES.find(s => s.email === email);
  console.log(`\n  Email:  ${email}`);
  if (store) console.log(`  Tienda: ${store.label}`);
  console.log(red('\n  ⚠ Esto también borrará sus stats de Firestore.'));

  const conf = (await ask(`  Escribe el email completo para confirmar: `)).trim().toLowerCase();
  if (conf !== email) { console.log(gray('  Cancelado (el email no coincidió).')); await ask('  Enter…'); return; }

  try {
    // Borrar stats de Firestore
    await db.collection('storeStats').doc(user.uid).delete().catch(() => {});
    // Borrar usuario de Auth
    await auth.deleteUser(user.uid);
    console.log(green(`\n  ✅ Usuario eliminado: ${email}`));
  } catch (e) {
    console.log(red(`  ❌ Error: ${e.message}`));
  }

  await ask('\n  Enter para volver…');
}

// ── 7. CREAR TODOS DEL CATÁLOGO ────────────────────────────────────────────

async function menuCrearTodos() {
  cls();
  console.log('\n' + bold('  Crear todos los usuarios del catálogo') + '\n');
  console.log('  Esto crea los usuarios que NO existen aún en Firebase Auth.');
  console.log('  Los que ya existen se omiten (no se modifica su contraseña).\n');

  // Leer contraseñas del crear-usuarios.js
  const PASSWORDS = {
    'tienda232@maseca.com': '466368', 'tienda234@maseca.com': '999383',
    'tienda237@maseca.com': '667795', 'tienda249@maseca.com': '987150',
    'tienda262@maseca.com': '669338', 'tienda94@maseca.com':  '812719',
    'tienda97@maseca.com':  '871143', 'tienda105@maseca.com': '172027',
    'tienda107@maseca.com': '795417', 'tienda108@maseca.com': '853041',
    'tienda2920@maseca.com': '966774','tienda2921@maseca.com': '998178',
    'tienda9104@maseca.com': '575068','tienda2990@maseca.com': '302708',
    'tienda2925@maseca.com': '165044','tienda2932@maseca.com': '513408',
    'tienda2917@maseca.com': '933637','tienda2994@maseca.com': '642309',
    'tienda2966@maseca.com': '347828','tienda2956@maseca.com': '908558',
    'tienda27@maseca.com':   '395635','tienda92@maseca.com':   '236199',
    'tienda53@maseca.com':   '122917','tienda360@maseca.com':  '471048',
    'tienda132@maseca.com':  '900698','tienda7@maseca.com':    '161168',
    'tienda88@maseca.com':   '875986','tienda24@maseca.com':   '952966',
    'tienda203@maseca.com':  '696482','tienda66@maseca.com':   '411589',
    'tienda227@maseca.com':  '875886','tienda300@maseca.com':  '474931',
    'tienda400@maseca.com':  '162711','tienda422@maseca.com':  '509574',
    'tienda426@maseca.com':  '688870','tienda447@maseca.com':  '255841',
    'tienda633@maseca.com':  '342131','tienda857@maseca.com':  '395507',
    'tienda885@maseca.com':  '806832','tienda896@maseca.com':  '152686',
    'tienda898@maseca.com':  '178031','tienda902@maseca.com':  '621747',
    'tienda930@maseca.com':  '190452','tienda946@maseca.com':  '373583',
    'tienda998@maseca.com':  '148618','tienda2944@maseca.com': '958616',
    'tienda2923@maseca.com': '629679','tienda9113@maseca.com': '833036',
    'santa-maria@maseca.com':'381866','tienda574@maseca.com':  '853538',
    'tienda1301@maseca.com': '835716','merco-linda-vista@maseca.com': '798462',
    'merco-garcia@maseca.com':'836497','merco-buenavista@maseca.com':  '904798',
    'tienda3623@maseca.com': '728126','tienda3625@maseca.com': '431175',
    'tienda3443@maseca.com': '157555','tienda5712@maseca.com': '891291',
    'tienda3298@maseca.com': '835411','tienda2097@maseca.com': '523632',
    'tienda3362@maseca.com': '790303','tienda3801@maseca.com': '435124',
    'tienda3765@maseca.com': '824368','tienda3756@maseca.com': '762864',
    'tienda3892@maseca.com': '243970','tienda3141@maseca.com': '938014',
    'tienda3679@maseca.com': '191694','tienda3294@maseca.com': '498471',
    'tienda3784@maseca.com': '528331','tienda3891@maseca.com': '699045',
    'tienda3874@maseca.com': '793898','tienda3763@maseca.com': '427881',
    'tienda3759@maseca.com': '762296','tienda3845@maseca.com': '710525',
    'tienda3755@maseca.com': '500809','tienda3751@maseca.com': '326466',
    'tienda3769@maseca.com': '875004','tienda3897@maseca.com': '722417',
    'tienda3764@maseca.com': '899630','tienda2344@maseca.com': '682707',
    'tienda3665@maseca.com': '352692','tienda5798@maseca.com': '115526',
    'tienda3143@maseca.com': '969353','tienda3789@maseca.com': '527020',
    'tienda3781@maseca.com': '188097','tienda3780@maseca.com': '493548',
    'tienda3557@maseca.com': '547945','tienda1555@maseca.com': '360660',
    'tienda3866@maseca.com': '315817','tienda2028@maseca.com': '586933',
    'tienda2135@maseca.com': '284765','tienda91@maseca.com':   '944527',
    'villas@maseca.com':     '536937','solidaridad@maseca.com':'685162',
    'pedreras@maseca.com':   '860033','valle-del-roble@maseca.com': '293460',
    'valle-del-roble-olmos@maseca.com': '360724','lincoln@maseca.com': '929158',
  };

  const conf = (await ask('  ¿Continuar? (s/N): ')).trim().toLowerCase();
  if (conf !== 's') { console.log(gray('  Cancelado.')); await ask('  Enter…'); return; }

  console.log('');
  let ok = 0, skip = 0, fail = 0;

  for (const store of STORES) {
    const { email } = store;
    const password  = PASSWORDS[email] || genPassword();
    try {
      await auth.createUser({ email, password, emailVerified: false });
      console.log(`  ${green('✅')} ${store.label}`);
      ok++;
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        console.log(`  ${gray('⏭')}  ${store.label} (ya existe)`);
        skip++;
      } else {
        console.log(`  ${red('❌')} ${store.label} — ${e.message}`);
        fail++;
      }
    }
  }

  console.log('\n' + hr('─'));
  console.log(`  ${green('Creados:')} ${ok}   ${gray('Ya existían:')} ${skip}   ${red('Errores:')} ${fail}`);
  console.log(hr('─'));

  await ask('\n  Enter para volver…');
}

// ── 8. ACTIVIDAD DE UNA TIENDA ────────────────────────────────────────────

async function menuActividad() {
  cls();
  console.log('\n' + bold('  Actividad de una tienda') + '\n');

  const q = (await ask('  Email o nombre de tienda: ')).trim().toLowerCase();
  if (!q) return;

  const store = STORES.find(s =>
    s.email.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)
  );
  const email = store?.email || q;

  let user;
  try { user = await auth.getUserByEmail(email); }
  catch (e) { console.log(red(`  ❌ Usuario no encontrado: ${email}`)); await ask('  Enter…'); return; }

  console.log(`\n  ${bold(store?.label || email)}`);
  console.log(`  ${gray(user.uid)}`);
  console.log(`  Estado: ${user.disabled ? red('Deshabilitado') : green('Activo')}`);

  // Stats
  const statsDoc = await db.collection('storeStats').doc(user.uid).get();
  if (statsDoc.exists) {
    const s = statsDoc.data();
    const ultimo = s.lastSpin ? s.lastSpin.toDate().toLocaleString('es-MX') : '—';
    console.log(`\n  ${bold('Estadísticas Firestore:')}`);
    console.log(`  Giros totales:  ${cyan(String(s.spinsCount || 0))}`);
    console.log(`  Ganadores:      ${cyan(String(s.winnersGiven || 0))}`);
    console.log(`  Último giro:    ${ultimo}`);
  } else {
    console.log(`\n  ${gray('Sin actividad registrada.')}`);
  }

  // Últimos giros
  const spinsSnap = await db.collection('spins')
    .where('storeId', '==', user.uid)
    .limit(10)
    .get();

  if (!spinsSnap.empty) {
    const docs = spinsSnap.docs.sort((a, b) => {
      const ta = a.data().timestamp?.toMillis() || 0;
      const tb = b.data().timestamp?.toMillis() || 0;
      return tb - ta;
    });
    console.log(`\n  ${bold('Últimos 10 giros:')}`);
    docs.forEach(doc => {
      const d  = doc.data();
      const ts = d.timestamp ? d.timestamp.toDate().toLocaleString('es-MX') : '—';
      const res = d.isWinner ? green('GANADOR') : gray('NO GANADOR');
      console.log(`  ${ts}  →  ${res}`);
    });
  }

  await ask('\n  Enter para volver…');
}

// ── Arranque ──────────────────────────────────────────────────────────────
mainMenu().catch(e => {
  console.error(red('\nError fatal: ') + e.message);
  process.exit(1);
});
