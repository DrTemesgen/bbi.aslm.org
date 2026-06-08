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
        const snap = await A.db.collection('categories').orderBy('order').get();
        this._cache = snap.empty
          ? this.defaults()
          : snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      } catch (e) {
        this._cache = this.defaults();
      }
      return this._cache;
    }
  };
})();
