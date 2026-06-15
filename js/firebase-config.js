/* BBI Africa — Firebase configuration
   ----------------------------------------------------------------
   Paste your Firebase WEB app config below (Project settings → General →
   Your apps → SDK setup and configuration → Config). These values are
   PUBLIC client keys and are safe to commit.

   Then in the Firebase console:
     1. Authentication → Sign-in method → enable "Email/Password".
     2. Authentication → Settings → Authorized domains → add
        "drtemesgen.github.io" (and "bbi.aslm.org" once DNS is set).
     3. Firestore Database → create database (production mode) and paste
        the rules from firestore.rules.
     4. Add yourself as an admin: create collection "admins", document id =
        your user UID (shown on the Account page after you register once).

   Until real values are filled in, the app shows a friendly
   "sign-in is being set up" notice instead of breaking.
   ---------------------------------------------------------------- */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCb0oYM0xZHokmYu0Lysl3MsaOEH6jtSpI",
  authDomain: "af-cdc-bbi.firebaseapp.com",
  projectId: "af-cdc-bbi",
  storageBucket: "af-cdc-bbi.firebasestorage.app",
  messagingSenderId: "482261576405",
  appId: "1:482261576405:web:2f0a174c9b1b48b56f505c",
  measurementId: "G-MSLXQDB2WR"
};

// Email alerts to admins (optional) via EmailJS — sends email straight from
// the app, no server. Get these from https://dashboard.emailjs.com:
//   publicKey  → Account → General → Public Key
//   serviceId  → Email Services (e.g. your Gmail) → Service ID
//   templateId → Email Templates → your template's Template ID
// Create a template that uses {{subject}} and {{message}}, with the "To Email"
// set to your admin address (or {{to_email}}). Leave as PASTE_… to disable.
window.EMAILJS_CONFIG = {
  publicKey: "PASTE_EMAILJS_PUBLIC_KEY",
  serviceId: "PASTE_EMAILJS_SERVICE_ID",
  templateId: "PASTE_EMAILJS_TEMPLATE_ID",
  adminEmail: "info@drtemesgen.com"
};

// Admin accounts — anyone who signs in with one of these emails is an
// administrator (and is auto-approved). No Firestore setup needed.
// Keep this list in sync with the admin emails in firestore.rules.
window.BBI_ADMIN_EMAILS = [
  "info@drtemesgen.com"
];

window.BBI_FIREBASE_READY =
  !!window.FIREBASE_CONFIG &&
  !String(window.FIREBASE_CONFIG.apiKey).startsWith("PASTE_");

// BBI AI assistant backend (cPanel @ ebc.drtemesgen.com). When set, the chat
// widget POSTs the user's message + retrieved BBI snippets here and shows the
// conversational answer it returns. On ANY error (network/CORS/non-JSON) or an
// empty answer, the widget silently falls back to on-device retrieval. See
// backend/README.md for the deployment + key setup.
window.BBI_AI_ENDPOINT = "https://ebc.drtemesgen.com/chat.php";
