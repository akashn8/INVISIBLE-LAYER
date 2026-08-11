// === BOOT SEQUENCE ===
(function() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  var bootLines = ['b1','b2'].map(function(id) { return document.getElementById(id); });
  var boot = document.getElementById('boot');
  var tabNav = document.getElementById('tab-nav');

  if (!boot) return;
  if (tabNav) tabNav.style.opacity = '0';

  // Global animated starfield behind all tabs
  var gsf = document.getElementById('global-starfield');
  if (gsf && typeof Utils !== 'undefined') Utils.initStarfield(gsf, document.body);

  bootLines.forEach(function(el, i) {
    setTimeout(function() {
      if (el) {
        el.style.transition = 'opacity 0.35s ease';
        el.style.opacity = '1';
        if (i === 1) el.classList.add('pulse');
      }
    }, 400 * i);
  });

  // After line 2 pulses 3 times (1.8s), swap to SIGNAL ACQUIRED then dismiss
  setTimeout(function() {
    var b2 = document.getElementById('b2');
    if (b2) {
      b2.classList.remove('pulse');
      b2.innerHTML = '&gt; SIGNAL ACQUIRED ✓';
      b2.style.opacity = '1';
    }
  }, 400 + 1800); // line 2 appears at 400ms, pulse 3x = 1.8s

  setTimeout(function() {
    boot.classList.add('hidden');
    if (tabNav) { tabNav.style.transition = 'opacity 0.5s ease'; tabNav.style.opacity = '1'; }
    window.dispatchEvent(new CustomEvent('boot-complete'));

    // Lock hover - no click needed, hover shows content via CSS ::after

    // Preload NASA APOD image for Tab 3 so it's ready when user gets there
    fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.media_type === 'image' && data.url) {
          window._preloadedAPOD = data;
          var preload = new Image();
          preload.src = data.url;
        }
      }).catch(function() {});
  }, 400 + 1800 + 500);
})();
