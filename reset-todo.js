/*
 * reset-todo.js — Limpia TODOS los datos de la temporada en Firestore.
 *
 * Borra:
 *   • spins        — todos los giros registrados
 *   • storeStats   — contadores de cada tienda
 *   • usedTickets  — tickets ya canjeados
 *
 * Reinicia (NO borra):
 *   • config/global — pone winnersTotal y winProbX a los valores por defecto
 *
 * USO:
 *   node reset-todo.js
 *   node reset-todo.js --dry-run   (solo muestra qué borraría, sin tocar nada)
 */

const admin = require('firebase-admin');
const serviceAccount = require('./gana-con-maseca-firebase-adminsdk-fbsvc-6b40cc3088.json');

const DRY_RUN = process.argv.includes('--dry-run');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const COLLECTIONS_TO_DELETE = ['spins', 'storeStats', 'usedTickets'];

const DEFAULT_CONFIG = {
  winnersTotal: 2,
  winProbX: 25,
};

async function deleteCollection(colName) {
  let deleted = 0;
  let snapshot;

  do {
    snapshot = await db.collection(colName).limit(400).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    if (!DRY_RUN) {
      await batch.commit();
    }
    deleted += snapshot.size;
    process.stdout.write(`  ${colName}: ${deleted} documentos ${DRY_RUN ? '(dry-run)' : 'eliminados'}\r`);
  } while (snapshot.size === 400);

  console.log(`  ${colName}: ${deleted} documentos ${DRY_RUN ? '[dry-run, no se tocaron]' : 'eliminados ✓'}`);
  return deleted;
}

async function resetConfig() {
  if (!DRY_RUN) {
    await db.collection('config').doc('global').set(DEFAULT_CONFIG);
  }
  console.log(`  config/global reiniciada a ${JSON.stringify(DEFAULT_CONFIG)} ${DRY_RUN ? '[dry-run]' : '✓'}`);
}

async function main() {
  console.log('');
  console.log(DRY_RUN ? '=== MODO DRY-RUN (solo lectura) ===' : '=== RESET COMPLETO DE GANA CON MASECA ===');
  console.log('');

  for (const col of COLLECTIONS_TO_DELETE) {
    await deleteCollection(col);
  }

  await resetConfig();

  console.log('');
  console.log(DRY_RUN
    ? 'Dry-run completado. Ejecuta sin --dry-run para aplicar los cambios.'
    : '✅ Reset completo. La plataforma está lista para una nueva temporada.');
  console.log('');
  console.log('⚠️  Recuerda también abrir el panel de admin en la app y presionar');
  console.log('   "Reiniciar todo" para limpiar el localStorage de ese dispositivo.');

  process.exit(0);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
