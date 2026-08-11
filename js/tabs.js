// === TAB NAVIGATION ===
(function() {
  var btns = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');
  var progressFill = document.getElementById('progress-fill');
  var activeTab = 'hero';
  var initialized = {};

  function switchTab(tabId) {
    if (tabId === activeTab) return;
    activeTab = tabId;

    btns.forEach(function(btn) {
      var isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });

    // Hide all panels
    panels.forEach(function(panel) {
      panel.classList.remove('active');
      panel.style.display = 'none';
    });

    // Reset progress bar
    if (progressFill) progressFill.style.height = '0%';

    // Show new panel and scroll IT to top
    var newPanel = document.getElementById('panel-' + tabId);
    if (newPanel) {
      newPanel.style.display = 'block';
      newPanel.classList.add('active');
      newPanel.scrollTop = 0;
    }

    // Init if first visit
    if (!initialized[tabId]) {
      initialized[tabId] = true;
      window.dispatchEvent(new CustomEvent('tab-init', { detail: { tab: tabId } }));
    }
    window.dispatchEvent(new CustomEvent('tab-switch', { detail: { tab: tabId } }));

    // Ensure scroll top after init builds content
    setTimeout(function() {
      if (newPanel) newPanel.scrollTop = 0;
    }, 50);
  }

  btns.forEach(function(btn) {
    btn.addEventListener('click', function() { switchTab(btn.dataset.tab); });
  });

  // Scroll progress (track active panel's scroll)
  function updateProgress() {
    var active = document.querySelector('.tab-panel.active');
    if (!active || !progressFill) return;
    var pct = active.scrollHeight - active.clientHeight > 0
      ? (active.scrollTop / (active.scrollHeight - active.clientHeight)) * 100 : 0;
    progressFill.style.height = pct + '%';
  }

  // Listen on main since panels are inside it
  document.querySelector('main').addEventListener('scroll', updateProgress, true);

  // Init first tab after boot
  window.addEventListener('boot-complete', function() {
    initialized['hero'] = true;
    var heroPanel = document.getElementById('panel-hero');
    if (heroPanel) {
      heroPanel.style.display = 'block';
      heroPanel.classList.add('active');
    }
    window.dispatchEvent(new CustomEvent('tab-init', { detail: { tab: 'hero' } }));
  });
})();
