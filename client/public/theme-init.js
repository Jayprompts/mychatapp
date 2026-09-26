// Runs before the app paints, so dark-mode users never see a white flash.
// (A file, not an inline <script>, because the server's CSP only allows scripts from 'self'.)
(function () {
  try {
    var pref = localStorage.getItem('grove.theme') || 'system';
    var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
