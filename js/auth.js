/* BBI Africa — auth & data layer (Firebase compat SDK)
   Email/password sign-in + registration with admin approval, plus
   Firestore reads/writes for applications and admin user management.
   Requires firebase-app/auth/firestore compat SDKs + js/firebase-config.js. */
(function () {
  const ready = window.BBI_FIREBASE_READY && typeof firebase !== 'undefined';
  const ADMIN_EMAILS = (window.BBI_ADMIN_EMAILS || []).map((e) => String(e).toLowerCase());
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
        // Admin by email allow-list (no Firestore setup needed); falls back
        // to an optional admins/{uid} doc if present.
        api._admin = ADMIN_EMAILS.includes(String(u.email || '').toLowerCase());
        try {
          const pd = await api.db.collection('users').doc(u.uid).get();
          api.profile = pd.exists ? pd.data() : null;
        } catch (e) {}
        if (!api._admin) {
          try {
            const ad = await api.db.collection('admins').doc(u.uid).get();
            api._admin = ad.exists;
          } catch (e) {}
        }
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

  // Edit an applicant's profile fields.
  api.updateUser = async function (uid, data) {
    if (!ready || !api._admin) throw new Error('not-admin');
    await api.db.collection('users').doc(uid).update(
      Object.assign({}, data, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
    );
  };

  // Create a new account WITHOUT signing the admin out. Uses a secondary
  // Firebase app, then emails the new user a link to set their password.
  api.adminCreateUser = async function (profile) {
    if (!ready || !api._admin) throw new Error('not-admin');
    const email = String(profile.email || '').trim();
    if (!email) throw new Error('email-required');
    let secApp;
    try { secApp = firebase.app('secondary'); }
    catch (e) { secApp = firebase.initializeApp(window.FIREBASE_CONFIG, 'secondary'); }
    const secAuth = secApp.auth();
    // random temp password (the user resets it via email)
    const tmp = 'Bbi!' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
    const cred = await secAuth.createUserWithEmailAndPassword(email, tmp);
    const newUid = cred.user.uid;
    // Write the profile with the PRIMARY (admin) connection.
    await api.db.collection('users').doc(newUid).set({
      email: email,
      name: profile.name || '',
      country: profile.country || '',
      org: profile.org || '',
      role: 'applicant',
      approved: profile.approved !== false,
      createdByAdmin: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    try { await secAuth.sendPasswordResetEmail(email); } catch (e) {}
    try { await secAuth.signOut(); } catch (e) {}
    return newUid;
  };

  // Delete an applicant: removes their profile + applications.
  // Note: the Firebase Auth login itself can only be removed from the
  // Firebase console (or with the Admin SDK) — this revokes their access here.
  api.deleteUser = async function (uid) {
    if (!ready || !api._admin) throw new Error('not-admin');
    const snap = await api.db.collection('applications').where('uid', '==', uid).get();
    const batch = api.db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(api.db.collection('users').doc(uid));
    await batch.commit();
  };

  api.deleteApplication = async function (id) {
    if (!ready || !api._admin) throw new Error('not-admin');
    await api.db.collection('applications').doc(id).delete();
  };

  // ---- Self profile editing (any signed-in user; safe fields only) ----
  api.updateMyProfile = async function (data) {
    if (!ready || !api.user) throw new Error('not-signed-in');
    const safe = {
      name: data.name || '', country: data.country || '', org: data.org || '',
      linkedin: data.linkedin || '', photo: data.photo || '', bio: data.bio || ''
    };
    await api.db.collection('users').doc(api.user.uid).set(
      Object.assign({}, safe, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() }),
      { merge: true }
    );
    api.profile = Object.assign({}, api.profile, safe);
  };

  // ---- Certification categories (admin-managed) ----
  api.listCategories = async function () {
    if (!ready) return [];
    const snap = await api.db.collection('categories').orderBy('order').get();
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
  };
  api.saveCategory = async function (cat) {
    if (!ready || !api._admin) throw new Error('not-admin');
    await api.db.collection('categories').doc(cat.key).set(cat, { merge: true });
  };
  api.deleteCategory = async function (key) {
    if (!ready || !api._admin) throw new Error('not-admin');
    await api.db.collection('categories').doc(key).delete();
  };
  api.seedCategories = async function (defaults) {
    if (!ready || !api._admin) throw new Error('not-admin');
    const batch = api.db.batch();
    (defaults || []).forEach((c, i) => {
      batch.set(api.db.collection('categories').doc(c.key), Object.assign({ order: i }, c));
    });
    await batch.commit();
  };

  // ---- Professional directory (admin-managed) ----
  api.listDirectory = async function () {
    if (!ready) return [];
    const snap = await api.db.collection('directory').get();
    const arr = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    arr.sort((a, b) => ((a.order == null ? 999 : a.order) - (b.order == null ? 999 : b.order)) || String(a.name || '').localeCompare(String(b.name || '')));
    return arr;
  };
  api.saveProfile = async function (prof) {
    if (!ready || !api._admin) throw new Error('not-admin');
    const ref = prof.id ? api.db.collection('directory').doc(prof.id) : api.db.collection('directory').doc();
    const data = Object.assign({}, prof, { id: ref.id });
    await ref.set(data, { merge: true });
    return ref.id;
  };
  api.deleteProfile = async function (id) {
    if (!ready || !api._admin) throw new Error('not-admin');
    await api.db.collection('directory').doc(id).delete();
  };
  api.seedDirectory = async function (defaults) {
    if (!ready || !api._admin) throw new Error('not-admin');
    const batch = api.db.batch();
    (defaults || []).forEach((p, i) => {
      batch.set(api.db.collection('directory').doc(p.id), Object.assign({ order: i }, p));
    });
    await batch.commit();
  };

  // ---- Editable site content (settings/{id}); public read, admin write ----
  api.getSetting = async function (id) {
    if (!ready) return null;
    // Returns the doc data, or null if it simply doesn't exist yet.
    // A real fetch failure THROWS so callers can tell "empty" from "couldn't load".
    const d = await api.db.collection('settings').doc(id).get();
    return d.exists ? d.data() : null;
  };
  api.saveSetting = async function (id, data) {
    if (!ready || !api._admin) throw new Error('not-admin');
    // merge:true — only the supplied keys are written; never wipes other keys.
    await api.db.collection('settings').doc(id).set(data, { merge: true });
  };

  window.BBIAuth = api;
})();
