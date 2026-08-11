// === TAB 4: ONE DAY WITHOUT — Before/After Approach ===
(function() {
  var panel = document.getElementById('panel-without');

  var BLACKOUT_FACTS = [
    'GPS satellites correct for Einstein\'s relativity TWICE every day. Without that correction, your position drifts 10km in 24 hours. Right now: infinite drift.',
    'High-frequency traders pay $14M/year for 0.001s better GPS timing. A firm bought a decommissioned military tower for 4.5ms advantage. All of it — worthless now.',
    'Weather satellites photograph the SAME cloud from 3 angles to measure its height to 200 meters. That\'s how they tell "light rain" from "catastrophic hailstorm." Gone.',
    '99% of internet crosses undersea cables but they ALL need satellite timing to sync packets. Without GPS timing, your internet becomes unwatchable digital noise within 4 hours.',
    'There are 330,000 shipping containers at sea RIGHT NOW tracked by satellite. 24 hours offline = 6-8 WEEKS to resynchronize the global supply chain.',
    'John Deere tractors use 2cm-accurate satellite signals. Each seed placed exactly 76mm from its neighbor. Without it, 10% of every field is wasted. 800 million fewer people fed.'
  ];

  var IMPACT_CARDS = [
    '📍 Your maps app: OFFLINE. Every ride-share, delivery, and turn-by-turn — dead.',
    '💰 Your card payment: REJECTED. Banks can\'t timestamp transactions. ATMs frozen.',
    '🌤️ Tomorrow\'s forecast: UNKNOWN. No storm warnings. No flight updates.',
    '🚨 911: "Where are you?" "I don\'t know." Location services — gone.',
    '📱 Your phone: NO SIGNAL. Cell towers lost timing sync. Network collapsed.',
    '🌾 Next harvest: DELAYED. GPS-guided tractors idle. Precision farming — impossible.'
  ];

  // Damage rates now calculated inside startBlackoutTimer using calibrated per-service loss

  var DEATH_LABELS = ['📍 NAVIGATION', '💰 FINANCE', '🌤️ WEATHER', '🚨 EMERGENCY', '📱 CELLULAR', '🌾 AGRICULTURE'];
  var DEATH_LOSS = ['$21M/hour', '$17M/hour', '$14M/hour', '$2.5M/hour', '$6.3M/hour', 'Begins next cycle'];

  function showImpactCard(text) {} // now handled by showDeathCard
  function showDeathCard(idx) {
    var container = document.getElementById('wo-death-cards');
    if (!container) return;
    var card = document.createElement('div');
    card.className = 'wo-death-card';
    card.innerHTML = '<div class="wo-dc-header"><span class="wo-dc-label">' + DEATH_LABELS[idx] + ' — OFFLINE</span><span class="wo-dc-loss">' + DEATH_LOSS[idx] + '</span></div>' +
      '<div class="wo-dc-impact">' + IMPACT_CARDS[idx] + '</div>' +
      '<div class="wo-dc-fact">' + BLACKOUT_FACTS[idx] + '</div>';
    container.insertBefore(card, container.firstChild);
    requestAnimationFrame(function() { card.classList.add('visible'); });
  }

  function buildHTML() {
    var SECTORS = [
      { name: 'Financial Markets', val: '$6.5T', label: 'in daily trades timed by GPS clocks', icon: '💰', color: '#ffcc00' },
      { name: 'Transport & Logistics', val: '$4.2T', label: 'in goods tracked by satellite daily', icon: '🚛', color: '#00e5ff' },
      { name: 'Defense & Security', val: '$2.1T', label: 'in daily defense ops via satellite', icon: '🛡️', color: '#ff4d4d' },
      { name: 'Telecommunications', val: '£1.42B', label: 'lost per day of outage (UK alone)', icon: '📡', color: '#b366ff' },
      { name: 'Agriculture', val: '$660B', label: '/year in GPS-guided farming', icon: '🌾', color: '#00ff88' },
      { name: 'Weather', val: '$125B', label: '/year in forecast benefits', icon: '🌪️', color: '#ff8c1a' }
    ];
    var VULNERABILITY = [
      { system: 'Cell network timing', noPlan: 95 },
      { system: 'Precision agriculture', noPlan: 100 },
      { system: 'Financial timing', noPlan: 92 },
      { system: 'Power grid sync', noPlan: 88 }
    ];

    var sectorCards = SECTORS.map(function(s) {
      return '<div class="wo-dep-card" style="--accent:' + s.color + '"><div class="wo-dep-icon">' + s.icon + '</div><div class="wo-dep-val">' + s.val + '</div><div class="wo-dep-label">' + s.label + '</div><div class="wo-dep-name">' + s.name + '</div></div>';
    }).join('');

    var vulnBars = VULNERABILITY.map(function(v) {
      return '<div class="wo-vuln-row"><span class="wo-vuln-name">' + v.system + '</span><div class="wo-vuln-track"><div class="wo-vuln-fill" style="width:' + v.noPlan + '%"></div></div><span class="wo-vuln-pct">' + v.noPlan + '%</span></div>';
    }).join('');

    panel.innerHTML =
      '<div class="without-hero" id="wo-hero">' +
        '<div class="eyebrow" style="text-align:center;display:flex;justify-content:center;">A thought experiment</div>' +
        '<h2>What if the invisible layer <span class="hl">went dark</span>?</h2>' +
        '<p class="section-sub" style="text-align:center;">Trillions in daily transactions. Billions of lives connected. All dependent on orbit.</p>' +
        '<div class="scroll-hint-arrow" style="margin-top:40px;text-align:center;font-size:12px;color:var(--steel);opacity:0.5;animation:bounce-hint 2s ease-in-out infinite;">↓</div>' +
      '</div>' +

      '<div class="wo-stakes" id="wo-stakes">' +
        '<h3 style="text-align:center;font-family:JetBrains Mono,monospace;font-weight:700;font-size:clamp(1rem,2.5vw,1.3rem);">What\'s at stake</h3>' +
        '<div class="wo-dep-grid">' + sectorCards + '</div>' +
        '<div class="interact-hint">TAP A CARD TO REVEAL MORE ↗</div>' +
      '</div>' +

      '<div class="wo-vuln-section" id="wo-vuln" style="min-height:calc(100vh - 50px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;">' +
        '<h4 style="text-align:center;font-family:JetBrains Mono,monospace;font-size:12px;color:var(--alert);letter-spacing:0.1em;">SYSTEMS WITH NO SATELLITE BACKUP</h4>' +
        '<div class="wo-vuln-bars" style="max-width:500px;width:100%;">' + vulnBars + '</div>' +
        '<div class="interact-hint">TAP A BAR TO EXPLORE ↗</div>' +
        '<p style="text-align:center;margin-top:20px;font-size:13px;color:var(--steel);">Almost nothing has a Plan B.</p>' +
        '<p style="text-align:center;margin-top:32px;font-size:12px;color:var(--white);opacity:0.8;max-width:420px;margin-left:auto;margin-right:auto;line-height:1.6;">Below is a real-time simulation of a total satellite blackout — 24 hours compressed into 60 seconds. Watch as each system fails in sequence.</p>' +
        '<button class="wo-trigger-btn" id="wo-trigger">⚠️ PULL THE PLUG</button>' +
      '</div>' +

      '<div class="wo-blackout-overlay" id="wo-blackout-overlay"></div>' +
      '<div class="without-simulation hidden" id="wo-simulation">' +

      '<div class="without-section">' +
        '<div class="wo-status-grid" id="wo-status-grid">' +
          '<div class="wo-timer"><span class="wo-timer-label">TIME SINCE BLACKOUT</span><span class="wo-timer-val" id="wo-live-timer">+0:00</span></div>' +
          '<div class="wo-svc-icon active" id="wo-nav" data-tooltip="GPS/GNSS fails instantly — no satellite signal means no position fix."><div class="wo-svc-emoji">📍</div><div class="wo-svc-name">NAV</div></div>' +
          '<div class="wo-svc-icon active" id="wo-finance" data-tooltip="~15 min — bank and market clocks drift out of sync past what high-frequency trading can tolerate."><div class="wo-svc-emoji">💰</div><div class="wo-svc-name">FINANCE</div></div>' +
          '<div class="wo-svc-icon active" id="wo-weather" data-tooltip="~2 hrs — the last satellite weather scan expires and forecasts go stale."><div class="wo-svc-emoji">🌤️</div><div class="wo-svc-name">WEATHER</div></div>' +
          '<div class="wo-svc-icon active" id="wo-emer" data-tooltip="~4 hrs — E911 location services fully fail without GPS."><div class="wo-svc-emoji">🚨</div><div class="wo-svc-name">911</div></div>' +
          '<div class="wo-svc-icon active" id="wo-cell" data-tooltip="~12 hrs — cell towers lose GPS timing sync, causing a cascading network failure."><div class="wo-svc-emoji">📱</div><div class="wo-svc-name">CELL</div></div>' +
          '<div class="wo-svc-icon active" id="wo-agri" data-tooltip="~24 hrs — the next GPS-guided planting cycle simply can\'t start."><div class="wo-svc-emoji">🌾</div><div class="wo-svc-name">FARM</div></div>' +
        '</div>' +
        '<div class="wo-legend">' +
          '<span class="wo-legend-item"><span class="wo-legend-dot active"></span>Still working</span>' +
          '<span class="wo-legend-item"><span class="wo-legend-dot warning"></span>About to fail</span>' +
          '<span class="wo-legend-item"><span class="wo-legend-dot dead"></span>Down — for good</span>' +
        '</div>' +
        '<div class="wo-damage-counter">' +
          '<div class="wo-damage-label">ESTIMATED ECONOMIC LOSS</div>' +
          '<div class="wo-damage-num" id="wo-damage-num">$0</div>' +
        '</div>' +
        '<div class="wo-death-cards" id="wo-death-cards"></div>' +
      '</div>' +

      '<div class="final-closing" style="min-height:calc(100vh - 50px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;">' +
        '<button class="wo-reset-btn" id="wo-reset-btn" style="display:block;margin:0 auto 24px;font-family:JetBrains Mono,monospace;font-size:10px;letter-spacing:0.08em;padding:10px 20px;background:transparent;border:1px solid rgba(139,150,165,0.3);color:var(--steel);border-radius:4px;cursor:pointer;">↺ RESET SIMULATION</button>' +
        '<p class="final-answer" style="font-size:16px;color:var(--steel);line-height:1.8;text-align:center;">The invisible layer is one failure away from silence.<br><strong style="color:var(--phosphor)">Can you keep it alive?</strong></p>' +
        '<div id="without-next-holder" style="margin-top:24px;text-align:center;"></div>' +
      '</div>' +
      '</div>'; // close without-simulation
  }

  var STAKE_DETAILS = {
    'Financial Markets': { back: '$6.5T/day in trades rely on GPS atomic clock timing. A 13-microsecond glitch in 2016 disrupted markets in 3 countries. High-frequency traders pay $14M/year for 0.001s better GPS timing.', theme: 'Every tap of your debit card is timestamped by a satellite.' },
    'Transport & Logistics': { back: '330,000 shipping containers at sea tracked by satellite RIGHT NOW. Self-driving trucks use cm-accurate positioning. Airlines save $3B/year in fuel from satellite-optimized routes.', theme: 'That package arriving tomorrow? Tracked by 14 satellite handoffs across 4 continents.' },
    'Defense & Security': { back: 'GPS-guided munitions, drone surveillance, missile early-warning systems. Without satellites, militaries are blind. Ukraine proved this — Starlink became critical war infrastructure.', theme: 'National security now depends on commercial satellites a billionaire can switch off.' },
    'Telecommunications': { back: '£1.42B lost per DAY of UK outage alone. Cell towers need GPS for timing sync. Undersea cables need satellite timing for packet synchronization. 4 hours without = network collapse.', theme: 'Your phone signal depends on satellites even when you\'re not using satellite internet.' },
    'Agriculture': { back: '$660B/year in GPS-guided farming. Each seed placed exactly 76mm from its neighbor. Satellite imagery detects crop disease 2 weeks before human eyes can. Feeds 800M more people than without.', theme: 'The food on your plate tonight was grown with satellite guidance you never see.' },
    'Weather': { back: '$125B/year in forecast economic benefits. GOES-18 scans every 10 minutes. Without satellite data, 7-day forecasts become 3-day. Storm warnings shrink from 72 hours to 12.', theme: 'That rain alert on your phone? It started 35,786 km above you on a weather satellite.' }
  };

  var VULN_DETAILS = {
    'Cell network timing': { pct: '95%', detail: 'Cell towers synchronize via GPS. Without it, calls drop, handoffs fail, and data throughput collapses within 4 hours. Only 5% of towers have backup atomic clocks.', source: 'DHS CISA, 2021' },
    'Precision agriculture': { pct: '100%', detail: 'GPS-guided tractors have NO backup positioning system. If satellites go dark during planting season, fields are planted wrong — 10% yield loss minimum. No do-overs.', source: 'USDA ERS, 2022' },
    'Financial transaction timing': { pct: '92%', detail: 'Stock exchanges need timestamps accurate to microseconds. Without GPS timing, trades can\'t be legally ordered. Markets halt. $6.5T/day frozen.', source: 'PNT Advisory Board, 2023' },
    'Power grid synchronization': { pct: '88%', detail: 'Power grids need precise frequency sync across thousands of km. In 2003, a 4-microsecond timing drift caused the Northeast blackout — 55 million people, 11 deaths.', source: 'NERC, 2023' }
  };

  function setupStakeCardClicks() {
    var cards = panel.querySelectorAll('.wo-dep-card');
    cards.forEach(function(card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function() {
        var name = card.querySelector('.wo-dep-name').textContent;
        var info = STAKE_DETAILS[name];
        if (!info) return;
        // Toggle flip
        if (card.classList.contains('flipped')) {
          card.classList.remove('flipped');
          card.querySelector('.wo-dep-back').remove();
          return;
        }
        card.classList.add('flipped');
        var back = document.createElement('div');
        back.className = 'wo-dep-back';
        back.innerHTML = '<p style="font-size:11px;color:var(--white);line-height:1.6;margin-bottom:8px;">' + info.back + '</p><p style="font-size:10px;color:var(--phosphor);line-height:1.5;">→ ' + info.theme + '</p>';
        card.appendChild(back);
        // Dismiss hint
        var hint = panel.querySelector('.wo-stakes .interact-hint');
        if (hint) hint.style.display = 'none';
      });
    });
  }

  function setupVulnBarClicks() {
    var rows = panel.querySelectorAll('.wo-vuln-row');
    var activeCard = null;
    rows.forEach(function(row) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', function() {
        var name = row.querySelector('.wo-vuln-name').textContent;
        var info = VULN_DETAILS[name];
        if (!info) return;
        // Remove existing card if any
        if (activeCard) { activeCard.remove(); activeCard = null; }
        // Create info card
        var card = document.createElement('div');
        card.className = 'wo-vuln-card';
        card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-size:12px;font-weight:700;color:var(--alert);">' + name + ' — ' + info.pct + ' unprotected</span><span class="wo-vuln-close" style="cursor:pointer;color:var(--steel);font-size:12px;">✕</span></div>' +
          '<p style="font-size:11px;color:var(--white);line-height:1.6;margin-bottom:6px;">' + info.detail + '</p>' +
          '<p style="font-size:9px;color:var(--steel);">Source: ' + info.source + '</p>';
        row.parentElement.insertBefore(card, row.nextSibling);
        activeCard = card;
        card.querySelector('.wo-vuln-close').addEventListener('click', function(e) { e.stopPropagation(); card.remove(); activeCard = null; });
        // Dismiss hint
        var hint = panel.querySelector('.wo-vuln-section .interact-hint');
        if (hint) hint.style.display = 'none';
      });
    });
  }

  function init() {
    buildHTML();
    setupStakeCardClicks();
    setupVulnBarClicks();

    // PULL THE PLUG button triggers the blackout
    var triggerBtn = document.getElementById('wo-trigger');
    var overlay = document.getElementById('wo-blackout-overlay');
    var simulation = document.getElementById('wo-simulation');

    triggerBtn.addEventListener('click', function() {
      // Hide hero, stakes, and vulnerability sections
      var hero = panel.querySelector('#wo-hero');
      var stakes = panel.querySelector('#wo-stakes');
      var vuln = panel.querySelector('#wo-vuln');
      if (hero) hero.style.display = 'none';
      if (stakes) stakes.style.display = 'none';
      if (vuln) vuln.style.display = 'none';
      // Phase 1: Glitch + shake
      overlay.classList.add('glitch');
      panel.classList.add('screen-shake');
      // Phase 2: After glitch, go dark
      setTimeout(function() {
        panel.classList.remove('screen-shake');
        overlay.classList.remove('glitch');
        overlay.classList.add('blackout');
      }, 600);
      // Phase 3: Reveal simulation from darkness
      setTimeout(function() {
        overlay.classList.add('fade-out');
        simulation.classList.remove('hidden');
        startBlackoutTimer();
      }, 2200);
      // Phase 4: Remove overlay completely
      setTimeout(function() {
        overlay.style.display = 'none';
      }, 3200);
    });

    // Guided flow button
    var nextHolder = panel.querySelector('#without-next-holder');
    if (nextHolder) nextHolder.appendChild(Utils.createNextButton('DEFEND THE NETWORK', 'games'));

    // Reset simulation button
    var resetBtn = document.getElementById('wo-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        // Re-run init to rebuild everything from scratch
        init();
        panel.scrollTop = 0;
      });
    }
  }

  var blackoutAnimFrame = null;
  var blackoutPaused = false;
  var blackoutElapsed = 0;
  var blackoutLastTick = 0;
  var blackoutRunning = false;

  function startBlackoutTimer() {
    var timerEl = panel.querySelector('#wo-live-timer');
    var dmgEl = document.getElementById('wo-damage-num');
    var killed = {};
    var totalDamage = 0;
    blackoutElapsed = 0;
    blackoutLastTick = Date.now();
    blackoutPaused = false;
    blackoutRunning = true;

    // Real failure times and calibrated loss rates ($M/hour after death)
    var killSchedule = [
      { id: 'wo-nav', atMin: 0, lossPerHour: 21, impact: 0 },
      { id: 'wo-finance', atMin: 15, lossPerHour: 17, impact: 1 },
      { id: 'wo-weather', atMin: 120, lossPerHour: 14, impact: 2 },
      { id: 'wo-emer', atMin: 240, lossPerHour: 2.5, impact: 3 },
      { id: 'wo-cell', atMin: 720, lossPerHour: 6.3, impact: 4 },
      { id: 'wo-agri', atMin: 1440, lossPerHour: 0, impact: 5 }
    ];

    var paceMap = [
      { realMin: 0, sec: 0 }, { realMin: 15, sec: 10 },
      { realMin: 120, sec: 20 }, { realMin: 240, sec: 30 },
      { realMin: 720, sec: 40 }, { realMin: 1440, sec: 55 }
    ];
    var deathSeconds = [0, 10, 20, 30, 40, 55];

    function secToSimMin(sec) {
      for (var i = 0; i < paceMap.length - 1; i++) {
        if (sec >= paceMap[i].sec && sec <= paceMap[i+1].sec) {
          var t = (sec - paceMap[i].sec) / (paceMap[i+1].sec - paceMap[i].sec);
          return paceMap[i].realMin + t * (paceMap[i+1].realMin - paceMap[i].realMin);
        }
      }
      return 1440;
    }

    function fmt(min) {
      var h = Math.floor(min / 60);
      var m = Math.floor(min % 60);
      if (h === 0 && m === 0) return '+0 hours, 0 minutes';
      if (h === 0) return '+' + m + ' minutes';
      return '+' + h + 'h ' + String(m).padStart(2,'0') + 'm';
    }

    function tick() {
      if (!blackoutRunning) return;
      if (blackoutPaused) { blackoutAnimFrame = requestAnimationFrame(tick); return; }

      var now = Date.now();
      blackoutElapsed += (now - blackoutLastTick) / 1000;
      blackoutLastTick = now;

      var elapsed = blackoutElapsed;
      var simMin = secToSimMin(Math.min(elapsed, 55));

      if (timerEl) timerEl.textContent = fmt(simMin);

      totalDamage = 0;
      killSchedule.forEach(function(svc, i) {
        if (!killed[svc.id]) return;
        var deathSimMin = svc.atMin;
        var hoursSinceDeath = Math.max(0, (simMin - deathSimMin) / 60);
        totalDamage += svc.lossPerHour * hoursSinceDeath;
      });
      if (dmgEl) {
        if (totalDamage >= 1000) dmgEl.textContent = '$' + (totalDamage/1000).toFixed(2) + 'B';
        else if (totalDamage >= 1) dmgEl.textContent = '$' + Math.round(totalDamage) + 'M';
        else dmgEl.textContent = '$0';
      }

      killSchedule.forEach(function(svc, i) {
        if (killed[svc.id]) return;
        var el = panel.querySelector('#' + svc.id);
        if (!el) return;
        var deathAt = deathSeconds[i];
        var warnAt = Math.max(0, deathAt - 3);

        if (elapsed >= warnAt && elapsed < deathAt && !el.classList.contains('warning')) {
          el.classList.remove('active');
          el.classList.add('warning');
        }

        if (elapsed >= deathAt) {
          killed[svc.id] = true;
          el.classList.remove('warning', 'active');
          el.classList.add('dying');
          setTimeout(function() { el.classList.remove('dying'); el.classList.add('dead'); }, 500);
          showDeathCard(i);
        }
      });

      if (elapsed < 60) blackoutAnimFrame = requestAnimationFrame(tick);
      else {
        if (timerEl) timerEl.textContent = '+24 hours';
        blackoutRunning = false;
        // Easter egg 4: watched all 6 die — only if user stayed
        Utils.easterEggs.reveal('solar');
      }
    }
    blackoutAnimFrame = requestAnimationFrame(tick);
  }

  // Pause/resume blackout when switching tabs
  window.addEventListener('tab-switch', function(e) {
    if (!blackoutRunning) return;
    if (e.detail && e.detail.tab === 'without') {
      // Resuming
      blackoutPaused = false;
      blackoutLastTick = Date.now();
    } else {
      // Pausing
      blackoutPaused = true;
    }
  });

  window.addEventListener('tab-init', function(e) {
    if (e.detail.tab === 'without') {
      init();
    }
  });
})();
