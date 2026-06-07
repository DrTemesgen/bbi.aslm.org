/* BBI Africa — auth & data layer (Firebase compat SDK)
   Email/password sign-in + registration with admin approval, plus
   Firestore reads/writes for applications and admin user management.
   Requires firebase-app/auth/firestore compat SDKs + js/firebase-config.js. */
(function () {
  const ready = window.BBI_FIREBASE_READY && typeof firebase !== 'undefined';
  const api = { ready, user: null, profile: null, _admin: false, _authCbs: [] };

  if (ready) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    api.auth = firebase.auth();
    api.db = firebase.firestore();
    api.auth.onAuthStateChanged(async (u) => {
      api.user = u || null;
      api._admin = false;
      api.profile = null;
      if (u) {
        try {
          const pd = await api.db.collection('users').doc(u.uid).get();
          api.profile = pd.exists ? pd.data() : null;
        } catch (e) {}
        try {
          const ad = await api.db.collection('admins').doc(u.uid).get();
          api._admin = ad.exists;
        } catch (e) {}
      }
      api._authCbs.forEach((cb) => { try { cb(api.user, api._admin, api.profile); } catch (e) {} });
    });
  }

  api.onAuth = function (cb) {
    api._authCbs.push(cb);
    try { cb(api.user, api._admin, api.profile); } catch (e) {}
  };
  api.isAdmin = function () { return api._admin; };
  api.isApproved = function () { return api._admin || !!(api.profile && api.profile.approved); };

  // ---- Auth: email/password ----
  api.register = async function (email, password, profile) {
    if (!ready) throw new Error('not-configured');
    const cred = await api.auth.createUserWithEmailAndPassword(email, password);
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const data = Object.assign({ email: email, approved: false, role: 'applicant', createdAt: now }, profile || {});
    await api.db.collection('users').doc(cred.user.uid).set(data);
    api.profile = data;
    try { await cred.user.sendEmailVerification(); } catch (e) {}
    return cred.user;
  };
  api.signIn = function (email, password) {
    if (!ready) return Promise.reject(new Error('not-configured'));
    return api.auth.signInWithEmailAndPassword(email, password);
  };
  api.resetPassword = function (email) {
    if (!ready) return Promise.reject(new Error('not-configured'));
    return api.auth.sendPasswordResetEmail(email);
  };
  api.resendVerification = function () {
    return api.user ? api.user.sendEmailVerification() : Promise.reject(new Error('not-signed-in'));
  };
  api.signOut = function () { return ready ? api.auth.signOut() : Promise.resolve(); };

  // ---- Firestore: applications ----
  api.submitApplication = async function (data) {
    if (!ready) throw new Error('not-configured');
    if (!api.user) throw new Error('not-signed-in');
    if (!api.isApproved()) throw new Error('not-approved');
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const payload = Object.assign({}, data, {
      uid: api.user.uid,
      email: api.user.email || '',
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    });
    const ref = await api.db.collection('applications').add(payload);
    return ref.id;
  };

  api.myApplications = async function () {
    if (!ready || !api.user) return [];
    const snap = await api.db.collection('applications').where('uid', '==', api.user.uid).get();
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  };

  // ---- Admin: applications ----
  api.allApplications = async function () {
    if (!ready || !api._admin) throw new Error('not-admin');
    const snap = await api.db.collection('applications').orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
  };
  api.setStatus = async function (id, status) {
    if (!ready || !api._admin) throw new Error('not-admin');
    await api.db.collection('applications').doc(id).update({
      status, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  };

  // ---- Admin: user registrations / approval ----
  api.allUsers = async function () {
    if (!ready || !api._admin) throw new Error('not-admin');
    const snap = await api.db.collection('users').orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()));
  };
  api.setApproved = async function (uid, approved) {
    if (!ready || !api._admin) throw new Error('not-admin');
    await api.db.collection('users').doc(uid).update({
      approved: !!approved,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  };

  window.BBIAuth = api;
})();
