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

// ── Catálogo de tiendas v2 (sincronizado con firebase-app.js) ─────────────
const STORES = [
  // ── Chedraui ────────────────────────────────────────────────────────────
  { label: '232 | CHEDRAUI | CHESELECTO POLANCO',                    email: 'tienda232@maseca.com',                          password: '948862' },
  { label: '234 | CHEDRAUI | CHEDRAUI AJUSCO',                       email: 'tienda234@maseca.com',                          password: '223355' },
  { label: '237 | CHEDRAUI | CHEDRAUI TENAYUCA',                     email: 'tienda237@maseca.com',                          password: '850045' },
  { label: '262 | CHEDRAUI | SELECTO PLAZA MEXICO',                  email: 'tienda262@maseca.com',                          password: '945564' },
  { label: '249 | CHEDRAUI | CHESELECTO GDL ACUEDUCTO',              email: 'tienda249@maseca.com',                          password: '227093' },
  // ── HEB ─────────────────────────────────────────────────────────────────
  { label: '2920 | HEB | MI TIENDA HEB ZUAZUA',                      email: 'tienda2920@maseca.com',                         password: '410960' },
  { label: '2921 | HEB | MI TIENDA GARCIA',                          email: 'tienda2921@maseca.com',                         password: '337159' },
  { label: '9104 | HEB | MT BUENAVISTA',                             email: 'tienda9104@maseca.com',                         password: '810336' },
  { label: '2990 | HEB | MI TIENDA HEB CIUDADELA',                   email: 'tienda2990@maseca.com',                         password: '450675' },
  { label: '2925 | HEB | MI TIENDA PLAZA DEL BOSQUE',                email: 'tienda2925@maseca.com',                         password: '905709' },
  { label: '2932 | HEB | MI TIENDA METROPLEX',                       email: 'tienda2932@maseca.com',                         password: '684653' },
  { label: '2917 | HEB | MT ELOY CAVAZOS',                           email: 'tienda2917@maseca.com',                         password: '130754' },
  { label: '2994 | HEB | HEB MI TIENDA HUINALA',                     email: 'tienda2994@maseca.com',                         password: '197137' },
  { label: '2966 | HEB | MI TIENDA HEB SAN ROQUE',                   email: 'tienda2966@maseca.com',                         password: '354261' },
  { label: '2956 | HEB | MI TIENDA AZTLAN',                          email: 'tienda2956@maseca.com',                         password: '577819' },
  // ── Merco ────────────────────────────────────────────────────────────────
  { label: '0 | Merco | MERCO SOLIDARIDAD',                          email: 'mercomercosolidaridad@maseca.com',               password: '859886' },
  { label: '0 | Merco | MERCO PLAZA SENDERO',                        email: 'mercomercoplazasendero@maseca.com',              password: '238309' },
  { label: '0 | Merco | MERCO LINDA VISTA',                          email: 'mercomercolindavista@maseca.com',                password: '572307' },
  { label: '0 | Merco | MERCO GARCIA',                               email: 'mercomercogarcia@maseca.com',                    password: '379908' },
  { label: '0 | Merco | MERCO BUENAVISTA',                           email: 'mercomercobuenavista@maseca.com',                password: '143889' },
  // ── Mi Tienda ────────────────────────────────────────────────────────────
  { label: '0 | Mi Tienda | MARGARITAS',                             email: 'mitiendamargaritas@maseca.com',                  password: '858469' },
  { label: '0 | Mi Tienda | CABEZADA',                               email: 'mitiendacabezada@maseca.com',                    password: '311897' },
  { label: '0 | Mi Tienda | ANZURES',                                email: 'mitiendaanzures@maseca.com',                     password: '138983' },
  { label: '0 | Mi Tienda | SANTA MARIA',                            email: 'mitiendasantamaria@maseca.com',                  password: '761216' },
  // ── Smart ────────────────────────────────────────────────────────────────
  { label: '94 | Smart | SANTO DOMINGO',                             email: 'tienda94@maseca.com',                           password: '372283' },
  { label: '97 | Smart | CUMBRES',                                   email: 'tienda97@maseca.com',                           password: '852233' },
  { label: '105 | Smart | EL MOLINETE',                              email: 'tienda105@maseca.com',                          password: '308179' },
  { label: '107 | Smart | LAS MARGARITAS',                           email: 'tienda107@maseca.com',                          password: '750430' },
  { label: '108 | Smart | SANTA CATARINA',                           email: 'tienda108@maseca.com',                          password: '908234' },
  { label: '91 | Smart | SOLIDARIDAD',                               email: 'tienda91@maseca.com',                           password: '959222' },
  // ── Soriana ──────────────────────────────────────────────────────────────
  { label: '27 | SORIANA | SORIANA SUC STA. MARIA',                  email: 'tienda27@maseca.com',                           password: '224193' },
  { label: '92 | SORIANA | SORIANA SOLIDARIDAD',                     email: 'tienda92@maseca.com',                           password: '738977' },
  { label: '53 | SORIANA | SORIANA LAS TORRES',                      email: 'tienda53@maseca.com',                           password: '150293' },
  { label: '360 | SORIANA | MDO SORIANA AZTLAN SUC',                 email: 'tienda360@maseca.com',                          password: '164823' },
  { label: '132 | SORIANA | SORIANA TOPO CHICO',                     email: 'tienda132@maseca.com',                          password: '727881' },
  { label: '7 | SORIANA | SORIANA SUC CONTRY 7',                     email: 'tienda7@maseca.com',                            password: '216307' },
  { label: '88 | SORIANA | SORIANA LAS QUINTAS',                     email: 'tienda88@maseca.com',                           password: '792291' },
  { label: '24 | SORIANA | SORIANA SUC CUMBRES',                     email: 'tienda24@maseca.com',                           password: '914752' },
  { label: '203 | SORIANA | SORIANA SUCURSAL SAN ROQUE',             email: 'tienda203@maseca.com',                          password: '992912' },
  { label: '66 | SORIANA | SORIANA ESTANZUELA',                      email: 'tienda66@maseca.com',                           password: '667370' },
  { label: '896 | SORIANA | MDO SOR CUAUTEPEC',                      email: 'tienda896@maseca.com',                          password: '586637' },
  { label: '426 | SORIANA | MDO. SORIANA SUC. PEÑON',                email: 'tienda426@maseca.com',                          password: '896157' },
  { label: '0 | SORIANA | MDO SORIANA VILLA NICOLAS ROMERO',         email: 'sorianavillanicolasromero@maseca.com',           password: '619384' },
  { label: '902 | SORIANA | MDO SOR XOCHIMILCO',                     email: 'tienda902@maseca.com',                          password: '782213' },
  { label: '227 | SORIANA | SORIANA SUC ERMITA',                     email: 'tienda227@maseca.com',                          password: '532907' },
  { label: '300 | SORIANA | SORIANA SUC. MIRAMONTES',                email: 'tienda300@maseca.com',                          password: '495100' },
  { label: '0 | SORIANA | SORIANA EXPRES PLAZA CUAUTITLAN',          email: 'sorianaexpresplazacuautitlan@maseca.com',        password: '885371' },
  { label: '447 | SORIANA | MDO SORIANA TLAHUAC SUC',                email: 'tienda447@maseca.com',                          password: '546678' },
  { label: '946 | SORIANA | MOD SOR IZTAPALAPA',                     email: 'tienda946@maseca.com',                          password: '852692' },
  { label: '885 | SORIANA | MDO SOR CUAUTITLAN',                     email: 'tienda885@maseca.com',                          password: '941025' },
  { label: '930 | SORIANA | MEGA SORIANA SUC IZCALLI',               email: 'tienda930@maseca.com',                          password: '859880' },
  { label: '857 | SORIANA | MEGA SORIANA SUC MIXCOAC',               email: 'tienda857@maseca.com',                          password: '603501' },
  { label: '898 | SORIANA | MEGA SORIANA V DE LA HACIENDA',          email: 'tienda898@maseca.com',                          password: '999704' },
  { label: '400 | SORIANA | SORIANA G SUC TULTEPEC',                 email: 'tienda400@maseca.com',                          password: '472164' },
  { label: '998 | SORIANA | MEGA SORIANA SUC LA VILLA',              email: 'tienda998@maseca.com',                          password: '648950' },
  // ── SUMERCA ──────────────────────────────────────────────────────────────
  { label: '0 | SUMERCA | VILLAS',                                   email: 'sumercavillas@maseca.com',                      password: '278117' },
  { label: '0 | SUMERCA | SOLIDARIDAD',                              email: 'sumercasolidaridad@maseca.com',                  password: '348743' },
  { label: '0 | SUMERCA | PEDRERAS',                                 email: 'sumercapedreras@maseca.com',                    password: '894129' },
  { label: '0 | SUMERCA | VALLE DEL ROBLE',                          email: 'sumercavalledelroble@maseca.com',                password: '369986' },
  { label: '0 | SUMERCA | VALLE DEL ROBLE OLMOS',                    email: 'sumercavalledelrobleolmos@maseca.com',           password: '821104' },
  { label: '0 | SUMERCA | LINCOLN',                                  email: 'sumercalincoln@maseca.com',                     password: '754364' },
  // ── Walmart ──────────────────────────────────────────────────────────────
  { label: '3623 | Walmart | BA LOS FRESNOS',                        email: 'tienda3623@maseca.com',                         password: '996419' },
  { label: '3625 | Walmart | SORIANA HIPER DIEGO DIAZ',              email: 'tienda3625@maseca.com',                         password: '493159' },
  { label: '3443 | Walmart | BA CLOUTHIER',                          email: 'tienda3443@maseca.com',                         password: '910078' },
  { label: '5712 | Walmart | BA SOLIDARIDAD',                        email: 'tienda5712@maseca.com',                         password: '377869' },
  { label: '3298 | Walmart | BA ESCOBEDO MTY',                       email: 'tienda3298@maseca.com',                         password: '312022' },
  { label: '2097 | Walmart | BA PUEBLO NUEVO',                       email: 'tienda2097@maseca.com',                         password: '601985' },
  { label: '3362 | Walmart | BA TOPOCHICO',                          email: 'tienda3362@maseca.com',                         password: '516903' },
  { label: '3801 | Walmart | BA STO. DOMINGO NVO. LEON',             email: 'tienda3801@maseca.com',                         password: '438277' },
  { label: '3765 | Walmart | BA ECATEPEC',                           email: 'tienda3765@maseca.com',                         password: '576511' },
  { label: '3756 | Walmart | BA TLALNEPANTLA',                       email: 'tienda3756@maseca.com',                         password: '756837' },
  { label: '3892 | Walmart | BA PLAZA ARAGON',                       email: 'tienda3892@maseca.com',                         password: '911041' },
  { label: '3141 | Walmart | BA SAN PABLO TULTITLAN',                email: 'tienda3141@maseca.com',                         password: '298580' },
  { label: '3679 | Walmart | SORIANA SUC ATIZAPAN',                  email: 'tienda3679@maseca.com',                         password: '641768' },
  { label: '3294 | Walmart | SORIANA SUC IXTAPALUCA',                email: 'tienda3294@maseca.com',                         password: '918755' },
  { label: '3784 | Walmart | BA RIO HONDO',                          email: 'tienda3784@maseca.com',                         password: '961861' },
  { label: '3891 | Walmart | MDO SORIANA LA VIGA RECREO',            email: 'tienda3891@maseca.com',                         password: '664169' },
  { label: '3874 | Walmart | SORIANA G SUC PLAZA CANTIL',            email: 'tienda3874@maseca.com',                         password: '969673' },
  { label: '3763 | Walmart | BA MARIANO ESCOBEDO',                   email: 'tienda3763@maseca.com',                         password: '510813' },
  { label: '3759 | Walmart | BA SAN RAFAEL',                         email: 'tienda3759@maseca.com',                         password: '885990' },
  { label: '3845 | Walmart | SC UNIVERSIDAD',                        email: 'tienda3845@maseca.com',                         password: '877039' },
  { label: '3755 | Walmart | SORIANA SUC TACUBAYA',                  email: 'tienda3755@maseca.com',                         password: '929858' },
  { label: '3751 | Walmart | MEGA SORIANA SUC PILARES',              email: 'tienda3751@maseca.com',                         password: '473278' },
  { label: '3769 | Walmart | BA INSURGENTES NORTE',                  email: 'tienda3769@maseca.com',                         password: '854302' },
  { label: '3897 | Walmart | MEGA SORIANA SUC LA VIGA',              email: 'tienda3897@maseca.com',                         password: '697670' },
  { label: '3764 | Walmart | SORIANA G SUC IZTAPALAPA',              email: 'tienda3764@maseca.com',                         password: '219818' },
  { label: '2344 | Walmart | MEGA SORIANA SUC NAUCALPAN',            email: 'tienda2344@maseca.com',                         password: '437750' },
  { label: '3665 | Walmart | BA CANUTILLO',                          email: 'tienda3665@maseca.com',                         password: '780774' },
  { label: '5798 | Walmart | MDO. SORIANA SUC. AVIACION',            email: 'tienda5798@maseca.com',                         password: '946319' },
  { label: '3789 | Walmart | BA REVOLUCION',                         email: 'tienda3789@maseca.com',                         password: '701424' },
  { label: '3781 | Walmart | BA INDEPENDENCIA',                      email: 'tienda3781@maseca.com',                         password: '319567' },
  { label: '3780 | Walmart | SORIANA SUC. AMERICAS',                 email: 'tienda3780@maseca.com',                         password: '145660' },
  { label: '3557 | Walmart | BA CHULAVISTA',                         email: 'tienda3557@maseca.com',                         password: '484683' },
  { label: '1555 | Walmart | BA SOLIDARIDAD GUAD',                   email: 'tienda1555@maseca.com',                         password: '475905' },
  { label: '3866 | Walmart | BA ARBOLEDAS',                          email: 'tienda3866@maseca.com',                         password: '443120' },
  { label: '2028 | Walmart | MDO. SORIANA SUC. SANTA FE',            email: 'tienda2028@maseca.com',                         password: '159839' },
  { label: '2135 | Walmart | BA CLINICA UNION DEL CUAT',             email: 'tienda2135@maseca.com',                         password: '811523' },
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
  console.log(gray(`  ${'ST'.padEnd(5)}  ${'TIENDA'.padEnd(46)}  ${'CORREO'.padEnd(44)}  ${'PWD'.padEnd(6)}  GIROS`));
  console.log(gray(`  ${'─'.repeat(5)}  ${'─'.repeat(46)}  ${'─'.repeat(44)}  ${'─'.repeat(6)}  ${'─'.repeat(5)}`));
  const sorted = [...tiendas].sort((a, b) => a.email.localeCompare(b.email));
  sorted.forEach(u => {
    const store     = STORES.find(s => s.email === u.email);
    const label     = (store ? store.label : u.email).padEnd(46).slice(0, 46);
    const emailCol  = u.email.padEnd(44).slice(0, 44);
    const pwdCol    = store?.password ? cyan(store.password) : gray('—     ');
    const estado    = u.disabled ? red('[OFF]') : green('[ON] ');
    const giros     = stats[u.uid] ? cyan(`✓ ${stats[u.uid].spinsCount || 0}`) : gray('—');
    console.log(`  ${estado}  ${label}  ${gray(emailCol)}  ${pwdCol}  ${giros}`);
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
