// Fix 2026-001: Google Analytics erst nach Einwilligung (Klaro, BSD-3)
var klaroConfig = {
  lang: 'de', mustConsent: false, acceptAll: true, hideDeclineAll: false,
  privacyPolicy: '/datenschutz/',
  services: [{
    name: 'google-analytics', title: 'Google Analytics', purposes: ['analytics'],
    cookies: [/^_ga/, /^_gid/], required: false, default: false,
  }],
};
