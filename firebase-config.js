/*
 * firebase-config.js — Configuración de Firebase
 *
 * INSTRUCCIONES:
 * 1. Ve a https://console.firebase.google.com → tu proyecto
 * 2. ⚙️ Configuración del proyecto → Tus apps → Web
 * 3. Copia los valores del objeto firebaseConfig y pégalos abajo
 * 4. Guarda el archivo y sube los cambios
 */



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCi8WSec3aq72KVvYK7YLZZgRFiI0bNS74",
  authDomain: "gana-con-maseca.firebaseapp.com",
  projectId: "gana-con-maseca",
  storageBucket: "gana-con-maseca.firebasestorage.app",
  messagingSenderId: "1024758623568",
  appId: "1:1024758623568:web:20e9df6e276ddaf589d055"
};

/*
 * Email del administrador principal.
 * Debe coincidir exactamente con el usuario creado en Firebase Auth.
 * El admin tiene acceso a admin/index.html y al panel de configuración.
 */
const ADMIN_EMAIL = "sergiovazquezdezamacona@gmail.com";

firebase.initializeApp(firebaseConfig);
