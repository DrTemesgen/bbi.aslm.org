/* BBI Africa — auth & data layer (Firebase compat SDK)
   Provides window.BBIAuth: phone (SMS OTP) sign-in, session, Firestore
   reads/writes for applications, and admin checks.
   Requires firebase-app-compat / firebase-auth-compat / firebase-firestore-compat
   to be loaded first, plus js/firebase-config.js. */
(function () {
  const ready = window.BBI_FIREBASE_READY && typeof firebase !== 'undefined';
  const api = {
    ready,
    user: null,
    _admin: false,
    _authCbs: [],
  };

  if (ready) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    api.auth = firebase.auth();
    api.db = firebase.firestore();
    api.auth.onAuthStateChanged(async (u) => {
      api.user = u || null;
      api._admin = false;
      if (u) {
        try {
          const doc = await api.db.collection('admins').doc(u.uid).get();
          api._admin = doc.exists;
        } catch (e) { /* rules may block non-admins; treat as non-admin */ }
      }
      api._authCbs.forEach((cb) => { try { cb(api.user, api._admin); } catch (e) {} });
    });
  }

  api.onAuth = function (cb) {
    api._authCbs.push(cb);
    // fire immediately with current state
    try { cb(api.user, api._admin); } catch (e) {}
  };

  api.isAdmin = function () { return api._admin; };

  // Normalise a phone number to E.164 using the default dial code if needed.
  api.normalisePhone = function (raw) {
    let s = String(raw || '').replace(/[\s()-]/g, '');
    if (!s) return '';
    if (s.startsWith('00')) s = '+' + s.slice(2);
    if (!s.startsWith('+')) {
      s = s.replace(/^0+/, '');
      s = (window.BBI_DEFAULT_DIAL_CODE || '+') + s;
    }
    return s;
  };

  // Set up an invisible reCAPTCHA verifier bound to a container element id.
  api.initRecaptcha = function (containerId) {
    if (!ready) return null;
    if (api._recaptcha) return api._recaptcha;
    api._recaptcha = new firebase.auth.RecaptchaVerifier(containerId, { size: 'invisible' });
    return api._recaptcha;
  };

  // Step 1: send the SMS code. Returns a confirmationResult.
  api.sendCode = async function (phone, recaptchaContainerId) {
    if (!ready) throw new Error('not-configured');
    const verifier = api.initRecaptcha(recaptchaContainerId);
    const e164 = api.normalisePhone(phone);
    api._confirmation = await api.auth.signInWithPhoneNumber(e164, verifier);
    return e164;
  };

  // Step 2: confirm the code the user typed.
  api.confirmCode = async function (code) {
    if (!api._confirmation) throw new Error('no-pending-code');
    const cred = await api._confirmation.confirm(code);
    return cred.user;
  };

  api.signOut = function () { return ready ? api.auth.signOut() : Promise.resolve(); };

  // ---- Firestore: applications ----
  api.submitApplication = async function (data) {
    if (!ready) throw new Error('not-configured');
    if (!api.user) throw new Error('not-signed-in');
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const payload = Object.assign({}, data, {
      uid: api.user.uid,
      phone: api.user.phoneNumber || '',
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    });
    const ref = await api.db.collection('applications').add(payload);
    return ref.id;
  };

  api.myApplications = async function () {
    if (!ready || !api.user) return [];
    const snap = await api.db.collection('applications')
      .where('uid', '==', api.user.uid).get();
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  };

  // ---- Firestore: admin ----
  api.allApplications = async function () {
    if (!ready || !api._admin) throw new Error('not-admin');
    const snap = await api.db.collection('applications').orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
  };

  api.setStatus = async function (id, status) {
    if (!ready || !api._admin) throw new Error('not-admin');
    await api.db.collection('applications').doc(id).update({
      status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  };

  window.BBIAuth = api;
})();
