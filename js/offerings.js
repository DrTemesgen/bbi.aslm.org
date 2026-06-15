/* BBI Africa — offerings loader (events / courses / activities).
   Returns admin-managed offerings from Firestore when available, else the
   built-in samples (BBI.events / BBI.trainings). Multilingual via i18n.localize.
   An offering has a `kind`: 'event' | 'course' | 'activity'. Safe on any page. */
(function () {
  function loc(o) { return (window.BBI && BBI.i18n && BBI.i18n.localize) ? BBI.i18n.localize(o) : o; }
  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'item';
  }
  function fallback(kind) {
    if (kind === 'event') {
      return (window.BBI && Array.isArray(BBI.events))
        ? BBI.events.map((e) => Object.assign({ kind: 'event' }, e)) : [];
    }
    if (kind === 'course') {
      return (window.BBI && Array.isArray(BBI.trainings))
        ? BBI.trainings.map((c) => Object.assign({ kind: 'course', id: 'course-' + slug(c.title), reg: true }, c)) : [];
    }
    return [];
  }

  window.BBIOfferings = {
    _cache: null,
    load: async function () {
      if (this._cache) return this._cache;
      const A = window.BBIAuth;
      let list = [];
      if (A && A.ready && A.db) { try { list = await A.listOfferings(); } catch (e) { list = []; } }
      this._cache = list;
      return list;
    },
    // Localized offerings of a kind; falls back to built-in samples when none in Firestore.
    byKind: async function (kind) {
      const list = await this.load();
      const own = list.filter((o) => (o.kind || 'event') === kind);
      return own.length ? own.map(loc) : fallback(kind);
    },
    // Localized single offering by id (searches Firestore, then samples).
    get: async function (id) {
      const list = await this.load();
      const f = list.find((o) => o.id === id);
      if (f) return loc(f);
      for (const k of ['event', 'course', 'activity']) {
        const s = fallback(k).find((o) => o.id === id);
        if (s) return s;
      }
      return null;
    },
    slug: slug
  };
})();
