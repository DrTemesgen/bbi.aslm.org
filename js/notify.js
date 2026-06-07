/* BBI Africa — admin email alerts via EmailJS (optional, no server).
   Stays a no-op until EMAILJS_CONFIG is filled in. Requires the EmailJS
   browser SDK loaded first. */
(function () {
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
    send: function (subject, message, replyTo, fromName) {
      if (!ready) return Promise.resolve(false);
      return emailjs.send(cfg.serviceId, cfg.templateId, {
        subject: subject,
        message: message,
        to_email: cfg.adminEmail || '',
        reply_to: replyTo || '',
        from_name: fromName || 'BBI Africa'
      }).then(function () { return true; })
        .catch(function (e) { console.warn('Email notification failed:', e && e.text || e); return false; });
    }
  };
})();
