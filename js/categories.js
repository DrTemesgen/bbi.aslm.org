/* BBI Africa — certification categories loader.
   Returns admin-managed categories from Firestore when available, else the
   built-in defaults from BBI.certTypes. Safe to call on any page. */
(function () {
  window.BBICats = {
    _cache: null,
    defaults: function () {
      return (window.BBI && Array.isArray(BBI.certTypes)) ? BBI.certTypes.slice() : [];
    },
    load: async function () {
      if (this._cache) return this._cache;
      const A = window.BBIAuth;
      if (!A || !A.ready || !A.db) { this._cache = this.defaults(); return this._cache; }
      try {
        // Get all (no orderBy — that would drop docs missing the field),
        // then sort client-side so admin-added categories always appear.
        const snap = await A.db.collection('categories').get();
        const arr = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
        arr.sort((a, b) => ((a.order == null ? 999 : a.order) - (b.order == null ? 999 : b.order))
          || String(a.name || '').localeCompare(String(b.name || '')));
        this._cache = arr.length ? arr : this.defaults();
      } catch (e) {
        this._cache = this.defaults();
      }
      return this._cache;
    },
    // Synchronous lookup against whatever is loaded (or defaults).
    get: function (key) {
      const list = this._cache || this.defaults();
      let cat = list.find((c) => c.key === key)
        || (window.BBI && BBI.helpers ? BBI.helpers.certType(key) : { key: key, abbr: key, name: key, color: '#13654d' });
      // Localize to the active language: record i18n → in-code translated default → base.
      if (window.BBI && BBI.i18n && BBI.i18n.localizeWith) {
        const real = (window.BBI && Array.isArray(BBI.certTypes)) ? BBI.certTypes.find((c) => c.key === key) : null;
        cat = BBI.i18n.localizeWith(cat, real, ['name', 'desc', 'eligibility']);
      }
      return cat;
    }
  };
})();
