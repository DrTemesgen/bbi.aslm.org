/* BBI Africa — professional directory loader.
   Returns admin-managed profiles from Firestore when available, else the
   built-in samples from BBI.directory. Safe to call on any page. */
(function () {
  window.BBIDir = {
    _cache: null,
    defaults: function () {
      return (window.BBI && Array.isArray(BBI.directory)) ? BBI.directory.slice() : [];
    },
    load: async function () {
      if (this._cache) return this._cache;
      const A = window.BBIAuth;
      if (!A || !A.ready || !A.db) { this._cache = this.defaults(); return this._cache; }
      try {
        const list = await A.listDirectory();
        this._cache = (list && list.length) ? list : this.defaults();
      } catch (e) {
        this._cache = this.defaults();
      }
      return this._cache;
    },
    get: async function (id) {
      const list = await this.load();
      return list.find((p) => p.id === id) || null;
    }
  };
})();
