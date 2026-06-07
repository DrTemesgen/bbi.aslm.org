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

window.BBI_FIREBASE_READY =
  !!window.FIREBASE_CONFIG &&
  !String(window.FIREBASE_CONFIG.apiKey).startsWith("PASTE_");
