/*
 * migrar-usuarios-v2.js
 * Borra TODOS los usuarios de tienda y los recrea con el listado nuevo.
 * El admin (sergiovazquezdezamacona@gmail.com) NO se toca.
 *
 * USO:
 *   node migrar-usuarios-v2.js             ← ejecuta la migración
 *   node migrar-usuarios-v2.js --dry-run   ← solo muestra qué haría
 */

const admin = require('firebase-admin');

const DRY_RUN    = process.argv.includes('--dry-run');
const ADMIN_EMAIL = 'sergiovazquezdezamacona@gmail.com';

admin.initializeApp({
  credential: admin.credential.cert(
    require('./gana-con-maseca-firebase-adminsdk-fbsvc-6b40cc3088.json')
  ),
});

const auth = admin.auth();

// ── Catálogo nuevo (del Excel Tiendas_Limpias_v2.xlsx) ───────────────────
const NUEVAS_TIENDAS = [
  { label: '232 | CHEDRAUI | CHESELECTO POLANCO',                    email: 'tienda232@maseca.com',                          password: '948862' },
  { label: '234 | CHEDRAUI | CHEDRAUI AJUSCO',                       email: 'tienda234@maseca.com',                          password: '223355' },
  { label: '237 | CHEDRAUI | CHEDRAUI TENAYUCA',                     email: 'tienda237@maseca.com',                          password: '850045' },
  { label: '262 | CHEDRAUI | SELECTO PLAZA MEXICO',                  email: 'tienda262@maseca.com',                          password: '945564' },
  { label: '249 | CHEDRAUI | CHESELECTO GDL ACUEDUCTO',              email: 'tienda249@maseca.com',                          password: '227093' },
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
  { label: '0 | Merco | MERCO SOLIDARIDAD',                          email: 'mercomercosolidaridad@maseca.com',               password: '859886' },
  { label: '0 | Merco | MERCO PLAZA SENDERO',                        email: 'mercomercoplazasendero@maseca.com',              password: '238309' },
  { label: '0 | Merco | MERCO LINDA VISTA',                          email: 'mercomercolindavista@maseca.com',                password: '572307' },
  { label: '0 | Merco | MERCO GARCIA',                               email: 'mercomercogarcia@maseca.com',                    password: '379908' },
  { label: '0 | Merco | MERCO BUENAVISTA',                           email: 'mercomercobuenavista@maseca.com',                password: '143889' },
  { label: '0 | Mi Tienda | MARGARITAS',                             email: 'mitiendamargaritas@maseca.com',                  password: '858469' },
  { label: '0 | Mi Tienda | CABEZADA',                               email: 'mitiendacabezada@maseca.com',                    password: '311897' },
  { label: '0 | Mi Tienda | ANZURES',                                email: 'mitiendaanzures@maseca.com',                     password: '138983' },
  { label: '0 | Mi Tienda | SANTA MARIA',                            email: 'mitiendasantamaria@maseca.com',                  password: '761216' },
  { label: '94 | Smart | SANTO DOMINGO',                             email: 'tienda94@maseca.com',                           password: '372283' },
  { label: '97 | Smart | CUMBRES',                                   email: 'tienda97@maseca.com',                           password: '852233' },
  { label: '105 | Smart | EL MOLINETE',                              email: 'tienda105@maseca.com',                          password: '308179' },
  { label: '107 | Smart | LAS MARGARITAS',                           email: 'tienda107@maseca.com',                          password: '750430' },
  { label: '108 | Smart | SANTA CATARINA',                           email: 'tienda108@maseca.com',                          password: '908234' },
  { label: '91 | Smart | SOLIDARIDAD',                               email: 'tienda91@maseca.com',                           password: '959222' },
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
  { label: '0 | SUMERCA | VILLAS',                                   email: 'sumercavillas@maseca.com',                      password: '278117' },
  { label: '0 | SUMERCA | SOLIDARIDAD',                              email: 'sumercasolidaridad@maseca.com',                  password: '348743' },
  { label: '0 | SUMERCA | PEDRERAS',                                 email: 'sumercapedreras@maseca.com',                    password: '894129' },
  { label: '0 | SUMERCA | VALLE DEL ROBLE',                          email: 'sumercavalledelroble@maseca.com',                password: '369986' },
  { label: '0 | SUMERCA | VALLE DEL ROBLE OLMOS',                    email: 'sumercavalledelrobleolmos@maseca.com',           password: '821104' },
  { label: '0 | SUMERCA | LINCOLN',                                  email: 'sumercalincoln@maseca.com',                     password: '754364' },
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

// ── Helpers ───────────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log(DRY_RUN
    ? '=== DRY-RUN: Migración v2 (sin cambios reales) ==='
    : '=== Migración v2: Borrar y recrear usuarios de tienda ===');
  console.log('');

  // 1. Obtener usuarios actuales
  console.log('Leyendo usuarios actuales…');
  const allUsers = await listAllUsers();
  const toDelete = allUsers.filter(u => u.email !== ADMIN_EMAIL);

  console.log(`  Total en Firebase Auth: ${allUsers.length}`);
  console.log(`  Admin (conservar):      1  (${ADMIN_EMAIL})`);
  console.log(`  A eliminar:             ${toDelete.length}`);
  console.log(`  A crear (Excel):        ${NUEVAS_TIENDAS.length}`);
  console.log('');

  // 2. Borrar usuarios existentes (excepto admin)
  console.log('── PASO 1: Eliminando usuarios de tienda ──────────────');
  let deleted = 0, deleteFail = 0;
  for (const u of toDelete) {
    if (DRY_RUN) {
      console.log(`  [dry] borrar: ${u.email}`);
      deleted++;
    } else {
      try {
        await auth.deleteUser(u.uid);
        process.stdout.write(`  ✓ ${u.email}\n`);
        deleted++;
      } catch (e) {
        console.log(`  ✗ ${u.email} — ${e.message}`);
        deleteFail++;
      }
    }
  }
  console.log(`\n  Eliminados: ${deleted}   Errores: ${deleteFail}`);

  // 3. Crear usuarios nuevos
  console.log('\n── PASO 2: Creando usuarios nuevos ────────────────────');
  let created = 0, createFail = 0;
  const errores = [];

  for (const t of NUEVAS_TIENDAS) {
    if (DRY_RUN) {
      console.log(`  [dry] crear: ${t.email}  pwd: ${t.password}  (${t.label})`);
      created++;
    } else {
      try {
        await auth.createUser({ email: t.email, password: String(t.password), emailVerified: false });
        process.stdout.write(`  ✓ ${t.label}\n`);
        created++;
      } catch (e) {
        console.log(`  ✗ ${t.label} — ${e.message}`);
        errores.push({ label: t.label, email: t.email, error: e.message });
        createFail++;
      }
    }
  }

  console.log(`\n  Creados: ${created}   Errores: ${createFail}`);
  if (errores.length) {
    console.log('\n  Usuarios con error:');
    errores.forEach(e => console.log(`    • ${e.email}: ${e.error}`));
  }

  console.log('\n' + '─'.repeat(54));
  if (DRY_RUN) {
    console.log('Dry-run completado. Ejecuta sin --dry-run para aplicar.');
  } else {
    console.log(`✅ Migración completada.`);
    console.log(`   ${created} tiendas activas en Firebase Auth.`);
  }
  console.log('');

  process.exit(0);
}

main().catch(e => {
  console.error('Error fatal:', e.message);
  process.exit(1);
});
