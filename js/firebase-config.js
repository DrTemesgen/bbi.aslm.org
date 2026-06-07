/* BBI Africa — Firebase configuration
   ----------------------------------------------------------------
   Paste your Firebase WEB app config below (Project settings → General →
   Your apps → SDK setup and configuration → Config). These values are
   PUBLIC client keys and are safe to commit.

   Then in the Firebase console:
     1. Authentication → Sign-in method → enable "Phone".
     2. Authentication → Settings → Authorized domains → add
        "drtemesgen.github.io" (and "bbi.aslm.org" once DNS is set).
     3. Firestore Database → create database (production mode) and paste
        the rules from firestore.rules.
     4. Add yourself as an admin: create collection "admins", document id =
        your user UID (shown on the Account page after you log in once).

   Until real values are filled in, the app shows a friendly
   "sign-in is being set up" notice instead of breaking.
   ---------------------------------------------------------------- */
window.FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

// Default region/country code applied to phone numbers entered without "+".
window.BBI_DEFAULT_DIAL_CODE = "+251"; // Ethiopia; change as needed

window.BBI_FIREBASE_READY =
  !!window.FIREBASE_CONFIG &&
  !String(window.FIREBASE_CONFIG.apiKey).startsWith("PASTE_");
