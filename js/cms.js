/* BBI Africa — inline content editor.
   Any element with a data-edit="unique-key" attribute becomes:
     • overridable: its saved content (settings/content) replaces the default
       for ALL visitors;
     • editable in place: an admin gets an "Edit this page" toolbar to change
       the text directly and Save.
   Read is public; only admins can save (settings/{id} rules). */
(function () {
  const DOC = 'content';
  let CONTENT = {};
  let loaded = false;   // true only after content was successfully fetched
  let toolbar = null;

  function editables() { return document.querySelectorAll('[data-edit]'); }

  function applyOverrides() {
    // Resolve admin content for the ACTIVE language; falls back to the
    // translated default (set by the i18n engine) rather than English.
    const ov = (window.BBI && BBI.i18n) ? BBI.i18n.activeOverride(CONTENT) : CONTENT;
    editables().forEach((el) => {
      const k = el.getAttribute('data-edit');
      if (ov[k] != null) el.innerHTML = ov[k];
    });
  }

  async function init() {
    const A = window.BBIAuth;
    if (!A || !A.ready) return;
    if (!document.querySelector('[data-edit]')) return;
    try {
      const d = await A.getSetting(DOC);
      if (d) CONTENT = d;
      loaded = true;            // fetch succeeded (doc may legitimately be empty)
    } catch (e) {
      loaded = false;           // fetch FAILED — saving now would wipe other pages
    }
    applyOverrides();
    A.onAuth((user, admin) => { if (admin) ensureToolbar(); });
  }

  function ensureToolbar() {
    if (toolbar) return;
    toolbar = document.createElement('div');
    toolbar.className = 'cms-bar';
    const curLang = (window.BBI && BBI.i18n) ? BBI.i18n.current().toUpperCase() : 'EN';
    toolbar.innerHTML = `
      <span class="cms-tag">Admin · ${curLang}</span>
      <button class="btn btn-primary" id="cms-edit">✎ Edit this page</button>
      <button class="btn btn-primary hidden" id="cms-save">Save changes</button>
      <button class="btn btn-outline hidden" id="cms-cancel">Cancel</button>
      <span id="cms-status" class="cms-status"></span>`;
    document.body.appendChild(toolbar);

    const $ = (id) => document.getElementById(id);
    let original = {};

    function setEditing(on) {
      editables().forEach((el) => {
        el.contentEditable = on ? 'true' : 'false';
        el.classList.toggle('cms-editing', on);
      });
      $('cms-edit').classList.toggle('hidden', on);
      $('cms-save').classList.toggle('hidden', !on);
      $('cms-cancel').classList.toggle('hidden', !on);
    }

    $('cms-edit').addEventListener('click', () => {
      original = {};
      editables().forEach((el) => { original[el.getAttribute('data-edit')] = el.innerHTML; });
      setEditing(true);
      $('cms-status').textContent = 'Editing — click any text to change it.';
    });
    $('cms-cancel').addEventListener('click', () => {
      editables().forEach((el) => { el.innerHTML = original[el.getAttribute('data-edit')]; });
      setEditing(false);
      $('cms-status').textContent = '';
    });
    $('cms-save').addEventListener('click', async () => {
      if (!loaded) {
        $('cms-status').textContent = 'Content didn’t load — reload the page before saving.';
        return;
      }
      // Save per-language so each language's edits are stored separately and
      // never overwrite another language's content.
      const lang = (window.BBI && BBI.i18n) ? BBI.i18n.current() : 'en';
      CONTENT.__i18n = CONTENT.__i18n || {};
      CONTENT.__i18n[lang] = CONTENT.__i18n[lang] || {};
      editables().forEach((el) => { CONTENT.__i18n[lang][el.getAttribute('data-edit')] = el.innerHTML.trim(); });
      $('cms-status').textContent = 'Saving… (' + lang.toUpperCase() + ')';
      try {
        await window.BBIAuth.saveSetting(DOC, CONTENT);
        setEditing(false);
        $('cms-status').textContent = 'Saved ✓';
        setTimeout(() => { $('cms-status').textContent = ''; }, 2500);
      } catch (e) {
        $('cms-status').textContent = 'Error: ' + (e.message || e);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
