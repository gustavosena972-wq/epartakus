/**
 * Epartakus — Firebase config
 *
 * 1. Crie um projeto em https://console.firebase.google.com
 * 2. Ative Firestore Database (modo de teste ou regras do README)
 * 3. Em Configurações do projeto → Seus apps → Web, copie as chaves
 * 4. Cole abaixo e defina USE_FIREBASE = true
 *
 * Enquanto as chaves forem placeholders, o app usa localStorage (demo).
 */
window.EPARTAKUS_FIREBASE = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

/** true = Firestore; false = localStorage (padrão até configurar Firebase) */
window.EPARTAKUS_USE_FIREBASE = false;

/** Detecta se a config ainda é placeholder */
window.epartakusFirebaseReady = function () {
  const c = window.EPARTAKUS_FIREBASE;
  return (
    window.EPARTAKUS_USE_FIREBASE === true &&
    c &&
    c.apiKey &&
    c.apiKey !== "YOUR_API_KEY" &&
    c.projectId &&
    c.projectId !== "YOUR_PROJECT_ID"
  );
};
