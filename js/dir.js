/* BBI Africa — professional directory loader.
   Returns admin-managed profiles from Firestore when available, else the
   built-in samples from BBI.directory. Localises role/bio/hero/specialties to
   the active language (record i18n map → in-code translated default → base),
   so Firestore-seeded English samples still render translated. Safe anywhere. */
(function () {
  function localize(p) {
    if (!p || !(window.BBI && BBI.i18n && BBI.i18n.localizeWith)) return p;
    const real = (window.BBI && Array.isArray(BBI.directory)) ? BBI.directory.find((x) => x.id === p.id) : null;
    return BBI.i18n.localizeWith(p, real, ['role', 'bio', 'hero', 'specialties']);
  }
  window.BBIDir = {
    _cache: null,
    defaults: function () {
      return (window.BBI && Array.isArray(BBI.directory)) ? BBI.directory.slice() : [];
    },
    load: async function () {
      if (this._cache) return this._cache;
      const A = window.BBIAuth;
      let list;
      if (!A || !A.ready || !A.db) {
        list = this.defaults();
      } else {
        try { const r = await A.listDirectory(); list = (r && r.length) ? r : this.defaults(); }
        catch (e) { list = this.defaults(); }
      }
      this._cache = list.map(localize);
      return this._cache;
    },
    get: async function (id) {
      const list = await this.load();
      return list.find((p) => p.id === id) || null;
    }
  };
})();
