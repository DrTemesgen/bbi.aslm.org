/* BBI Africa — certification categories loader.
   Returns admin-managed categories from Firestore when available, else the
   built-in defaults from BBI.certTypes. Localises name/desc/eligibility to the
   active language (record i18n map → in-code translated default → base), so
   Firestore-seeded English categories still render translated. Safe anywhere. */
(function () {
  function localizeCat(c) {
    if (!c || !(window.BBI && BBI.i18n && BBI.i18n.localizeWith)) return c;
    const real = (window.BBI && Array.isArray(BBI.certTypes)) ? BBI.certTypes.find((x) => x.key === c.key) : null;
    return BBI.i18n.localizeWith(c, real, ['name', 'desc', 'eligibility']);
  }
  window.BBICats = {
    _cache: null,
    defaults: function () {
      return (window.BBI && Array.isArray(BBI.certTypes)) ? BBI.certTypes.slice() : [];
    },
    load: async function () {
      if (this._cache) return this._cache;
      const A = window.BBIAuth;
      let arr;
      if (!A || !A.ready || !A.db) {
        arr = this.defaults();
      } else {
        try {
          const snap = await A.db.collection('categories').get();
          const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
          list.sort((a, b) => ((a.order == null ? 999 : a.order) - (b.order == null ? 999 : b.order))
            || String(a.name || '').localeCompare(String(b.name || '')));
          arr = list.length ? list : this.defaults();
        } catch (e) {
          arr = this.defaults();
        }
      }
      this._cache = arr.map(localizeCat);
      return this._cache;
    },
    // Synchronous lookup against whatever is loaded (or defaults), localized.
    get: function (key) {
      const list = this._cache || this.defaults().map(localizeCat);
      return list.find((c) => c.key === key)
        || localizeCat(window.BBI && BBI.helpers ? BBI.helpers.certType(key) : { key: key, abbr: key, name: key, color: '#13654d' });
    }
  };
})();
