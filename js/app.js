/* BBI Africa — shared shell: header, footer, nav, service worker */
(function () {
  const PAGES = [
    { href: 'index.html', label: 'Home' },
    { href: 'dashboard.html', label: 'Dashboard' },
    { href: 'directory.html', label: 'Directory' },
    { href: 'framework.html', label: 'Framework' },
    { href: 'training.html', label: 'Training' },
    { href: 'resources.html', label: 'Resources' },
    { href: 'news.html', label: 'News' },
    { href: 'about.html', label: 'About' }
  ];

  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const LOGO = `<svg class="logo" viewBox="0 0 64 64" role="img" aria-label="BBI logo" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e0a92e"/><stop offset="1" stop-color="#b4861e"/></linearGradient></defs>
    <path d="M32 3l24 9v17c0 16-10.5 27-24 32C18.5 56 8 45 8 29V12z" fill="#0f4f3c" stroke="url(#lg)" stroke-width="2.5"/>
    <path d="M24 20c8 4 8 20 0 24M40 20c-8 4-8 20 0 24" fill="none" stroke="#e0a92e" stroke-width="3" stroke-linecap="round"/>
    <path d="M24 26h16M24 32h16M24 38h16" stroke="#bfe0d3" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;

  function header() {
    const links = PAGES.map(p =>
      `<a href="${p.href}" class="${p.href === current ? 'active' : ''}">${p.label}</a>`
    ).join('');
    return `<header class="appbar"><div class="container">
      <a class="brand" href="index.html">${LOGO}<span><small>Africa CDC · ASLM</small><b>Biosafety &amp; Biosecurity Initiative</b></span></a>
      <button class="menu-btn" aria-label="Toggle menu" aria-expanded="false">&#9776;</button>
      <nav class="nav">${links}</nav>
    </div></header>`;
  }

  function footer() {
    const y = 2026;
    return `<footer class="footer"><div class="container">
      <div class="cols">
        <div>
          <div class="brand" style="margin-bottom:12px">${LOGO}<span><small>Africa CDC · ASLM</small><b>Biosafety &amp; Biosecurity Initiative</b></span></div>
          <p class="partners">A continental programme strengthening biosafety and biosecurity systems across all 55 African Union Member States, in line with IHR (2005), the Biological Weapons Convention and UNSCR 1540.</p>
          <p class="partners">Supported by Canada's Weapons Threat Reduction Program, the World Bank, US CDC, US DTRA, NTI, WHO, WAHO, WOAH and AU Member States.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>${PAGES.map(p => `<li><a href="${p.href}">${p.label}</a></li>`).join('')}</ul>
        </div>
        <div>
          <h4>Partners</h4>
          <ul>
            <li><a href="https://africacdc.org" target="_blank" rel="noopener">Africa CDC</a></li>
            <li><a href="https://aslm.org" target="_blank" rel="noopener">ASLM</a></li>
            <li><a href="https://au.int" target="_blank" rel="noopener">African Union</a></li>
            <li><a href="mailto:info@aslm.org">info@aslm.org</a></li>
          </ul>
        </div>
      </div>
      <div class="copy">© ${y} African Society for Laboratory Medicine (ASLM) &amp; Africa CDC · Biosafety &amp; Biosecurity Initiative. Unofficial reference application built for the BBI programme. Figures are indicative and based on public BBI communications.</div>
    </div></footer>`;
  }

  function mount() {
    const h = document.getElementById('app-header');
    const f = document.getElementById('app-footer');
    if (h) h.innerHTML = header();
    if (f) f.innerHTML = footer();

    const btn = document.querySelector('.menu-btn');
    const nav = document.querySelector('.nav');
    if (btn && nav) {
      btn.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
    }
  }

  // Animated count-up for elements with [data-count]
  function countUp() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.getAttribute('data-count'));
      const suffix = el.getAttribute('data-suffix') || '';
      const dur = 1100; let start = null;
      function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        el.textContent = val.toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    mount();
    countUp();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }

  window.BBI = window.BBI || {};
  window.BBI.LOGO = LOGO;
})();
