// === TAB 6: REFLECT — Observer Log + Conclusion ===
(function() {
  var panel = document.getElementById('panel-reflect');

  function buildHTML() {
    var eggs = Utils.easterEggs;
    var found = eggs.getCount(), total = eggs.getTotal();

    var fragmentsHTML = eggs.secretOrder.map(function(id, i) {
      var isFound = eggs.found[id];
      return '<span class="reflect-fragment ' + (isFound ? 'revealed' : 'hidden') + '">' + 
        (isFound ? eggs.secrets[id].fragment : '???') + '</span>';
    }).join(' ');

    var entriesHTML = eggs.secretOrder.map(function(id, i) {
      var isFound = eggs.found[id];
      if (isFound) {
        return '<div class="reflect-entry found"><span class="reflect-entry-num">' + (i+1) + '</span><span class="reflect-entry-text">' + eggs.secrets[id].reflection + '</span></div>';
      }
      return '<div class="reflect-entry locked"><span class="reflect-entry-num">' + (i+1) + '</span><span class="reflect-entry-text">Not yet discovered</span></div>';
    }).join('');

    panel.innerHTML =
      '<div class="reflect-hero">' +
        '<h2 class="reflect-title">Next time you check your phone, <span class="hl">look up.</span></h2>' +
        '<p class="reflect-body">You spent <strong style="color:var(--phosphor);" id="reflect-time">0s</strong> here. In that time, <strong style="color:var(--sky);font-size:1.2em;" id="reflect-sats">0</strong> satellites passed silently overhead. You didn\'t notice a single one — but every one of them was working for you.</p>' +
        '<p class="reflect-body" style="margin-top:16px;opacity:0.7;">The next 24 hours will look different. Every signal, every sync, every route — you\'ll know what\'s above you now.</p>' +
      '</div>' +
      '<div class="reflect-journey" style="max-width:560px;margin:40px auto;padding:24px;background:var(--panel);border:1px solid rgba(139,150,165,0.1);border-radius:4px;">' +
        '<div style="font-family:JetBrains Mono,monospace;font-size:10px;letter-spacing:0.15em;color:var(--steel);margin-bottom:16px;">YOUR JOURNEY</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;font-family:JetBrains Mono,monospace;font-size:11px;">' +
          '<div style="display:flex;gap:12px;align-items:baseline;"><span style="color:var(--phosphor);min-width:100px;">THE LAYER</span><span style="color:var(--steel);">18,560 satellites orbit overhead right now</span></div>' +
          '<div style="display:flex;gap:12px;align-items:baseline;"><span style="color:var(--phosphor);min-width:100px;">YOUR DAY</span><span style="color:var(--steel);">Every hour, dozens of satellites served you — unnoticed</span></div>' +
          '<div style="display:flex;gap:12px;align-items:baseline;"><span style="color:var(--phosphor);min-width:100px;">THE SCALE</span><span style="color:var(--steel);">$6.5 trillion per day depends on orbit</span></div>' +
          '<div style="display:flex;gap:12px;align-items:baseline;"><span style="color:var(--phosphor);min-width:100px;">WITHOUT</span><span style="color:var(--steel);">6 systems fail in 24 hours. $1B lost.</span></div>' +
          '<div style="display:flex;gap:12px;align-items:baseline;"><span style="color:var(--phosphor);min-width:100px;">PLAY</span><span style="color:var(--steel);">You defended what most people never see</span></div>' +
          '<div style="display:flex;gap:12px;align-items:baseline;"><span style="color:var(--phosphor);min-width:100px;">REFLECT</span><span style="color:var(--steel);">Now you know what\'s above you</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="reflect-statement" style="max-width:520px;margin:32px auto;text-align:center;padding:0 24px;">' +
        '<p style="font-size:12px;color:var(--steel);line-height:1.8;font-style:italic;">This is a data story told through six interactive chapters. Rather than a single dashboard, it transforms satellite infrastructure data into a narrative — from awareness through personal impact to consequence. Every number is sourced. Every interaction is data-driven.</p>' +
      '</div>' +
      '<div class="reflect-assembled">' +
        '<div class="reflect-assembled-label">' + found + '/' + total + ' FRAGMENTS FOUND</div>' +
        '<div class="reflect-assembled-phrase">' + fragmentsHTML + '</div>' +
        (found === total ? '<div class="reflect-complete">🏅 You assembled the message. The invisible layer is now visible to you.</div>' : '<div class="reflect-incomplete">Find all 5 secrets to reveal the complete message.</div>') +
      '</div>' +
      '<div class="reflect-entries">' + entriesHTML + '</div>' +
      '<div class="reflect-credits">' +
        '<p>Built by <strong>akanar</strong> for <strong>Analyticon Viz Con 2026</strong></p>' +
        '<p>Theme: How the World Lives, Thrives, and Connects</p>' +
      '</div>';
  }

  var reflectInterval = null;

  function startReflectCounter() {
    if (reflectInterval) return;
    reflectInterval = setInterval(function() {
      var timeEl = document.getElementById('reflect-time');
      var satsEl = document.getElementById('reflect-sats');
      if (timeEl) {
        var totalSeconds = Math.round((Date.now() - Utils.pageLoadTime) / 1000);
        var mins = Math.floor(totalSeconds / 60);
        var secs = totalSeconds % 60;
        timeEl.textContent = mins > 0 ? mins + 'm ' + secs + 's' : secs + 's';
      }
      if (satsEl) {
        satsEl.textContent = (Utils.overheadCount || 0) + ' satellites';
      }
    }, 1000);
  }

  function stopReflectCounter() {
    if (reflectInterval) { clearInterval(reflectInterval); reflectInterval = null; }
  }

  window.addEventListener('tab-init', function(e) {
    if (e.detail.tab === 'reflect') { buildHTML(); startReflectCounter(); }
  });
  // Re-render every time we switch to this tab (secrets may have changed)
  window.addEventListener('tab-switch', function(e) {
    if (e.detail && e.detail.tab === 'reflect') { buildHTML(); startReflectCounter(); }
    else { stopReflectCounter(); }
  });
})();
