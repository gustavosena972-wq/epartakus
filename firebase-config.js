/**
 * Epartakus — Firebase config
 *
 * PARA LIGAR A SYNC ENTRE CELULARES (obrigatório 1×):
 * 1. Abra https://console.firebase.google.com (login Google)
 * 2. Criar projeto → nome "epartakus" (só deste time; NÃO use CodeCraft)
 * 3. Build → Firestore Database → Create database → modo teste (ou cole firestore.rules)
 * 4. Project settings → Your apps → Web (</>) → registre "epartakus"
 * 5. Cole as chaves abaixo e mude EPARTAKUS_USE_FIREBASE para true
 * 6. Commit + push → GitHub Pages atualiza em ~1 min
 *
 * Enquanto as chaves forem placeholders, o app usa localStorage (só 1 navegador).
 */
window.EPARTAKUS_FIREBASE = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

/** true = Firestore (vários celulares); false = localStorage */
window.EPARTAKUS_USE_FIREBASE = false;

/**
 * Base pública dos links (WhatsApp / copiar).
 * Em file:// usa o Pages automaticamente. Em Pages/servidor, usa a origem atual.
 * Sobrescreva se o domínio for outro.
 */
window.EPARTAKUS_PUBLIC_BASE =
  window.EPARTAKUS_PUBLIC_BASE ||
  "https://gustavosena972-wq.github.io/epartakus";

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
