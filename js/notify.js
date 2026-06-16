/* BBI Africa — email delivery helpers (no server SDK on the client).
   - BBIMail.send(): POSTs JSON to the server mail relay (BBI_MAIL_ENDPOINT).
   - BBINotify.send(): admin alerts via EmailJS when configured, otherwise
     falls back to BBIMail.send(). Both are best-effort and never throw. */
(function () {
  // ---- Server mail relay (BBI_MAIL_ENDPOINT, e.g. mail.php on cPanel) ----
  // Resolves to true on a { ok:true } response, false otherwise (no endpoint,
  // network/CORS error, non-JSON, or { ok:false }). Never throws.
  window.BBIMail = {
    send: function (opts) {
      var endpoint = window.BBI_MAIL_ENDPOINT;
      if (!endpoint || String(endpoint).startsWith('PASTE_')) {
        return Promise.resolve(false);
      }
      var o = opts || {};
      var payload = {
        subject: o.subject || '',
        message: o.message || ''
      };
      if (o.replyTo)  payload.replyTo  = o.replyTo;
      if (o.name)     payload.name     = o.name;
      if (o.formType) payload.formType = o.formType;
      if (o.hp != null) payload.hp = o.hp; // optional honeypot passthrough
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) { return !!(data && data.ok); })
        .catch(function (e) { console.warn('Mail send failed:', e && e.message || e); return false; });
    }
  };

  // ---- Admin alerts via EmailJS (optional). No-op until EMAILJS_CONFIG set. ----
  const cfg = window.EMAILJS_CONFIG || {};
  const ready = cfg.publicKey &&
    !String(cfg.publicKey).startsWith('PASTE_') &&
    typeof emailjs !== 'undefined';

  if (ready) {
    try { emailjs.init({ publicKey: cfg.publicKey }); } catch (e) { /* older SDK */ try { emailjs.init(cfg.publicKey); } catch (e2) {} }
  }

  window.BBINotify = {
    ready: ready,
    // Best-effort; resolves to true/false and never throws.
    // Pass an object of template params (subject, name, email, message, …).
    send: function (params) {
      if (!ready) {
        // No EmailJS — fall back to the server mail relay.
        var p = params || {};
        return window.BBIMail.send({
          subject: p.subject,
          message: p.message,
          replyTo: p.reply_to,
          name: p.name,
          formType: p.type
        });
      }
      var merged = Object.assign({
        to_email: cfg.adminEmail || '',
        from_name: 'BBI Africa',
        link: 'https://drtemesgen.github.io/bbi.aslm.org/admin.html'
      }, params || {});
      return emailjs.send(cfg.serviceId, cfg.templateId, merged)
        .then(function () { return true; })
        .catch(function (e) { console.warn('Email notification failed:', e && e.text || e); return false; });
    }
  };
})();
