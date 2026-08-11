// === TAB 5: GAMES — Trivia + Space Guardian (Fixed) ===
(function() {
  var panel = document.getElementById('panel-games');
  var LEADERBOARD_KEY = 'invisible-layer-lb';
  var LEADERBOARD_KEY_ENDLESS = 'invisible-layer-lb-endless';

  var activeGame = 'guardian';

  // Guardian state
  var gCanvas, gCtx, gState = 'idle', gScore = 0, gTimeLeft = 60;
  var gSats = [], gDebris = [], gShields = [], gParticles = [];
  var gAnimFrame, gLastTime, gSpawnTimer = 0, gAlias = '';
  var gMouseX = 0, gMouseY = 0;
  var gDebrisKills = 0;
  var gDifficulty = 'commander';
  var gMode = '30sec'; // '30sec' or 'endless'
  var gSurvivalTime = 0;
  var SERVICES = ['GPS','WEATHER','COMMS','NET','TIME'];

  var DIFFICULTY = {
    cadet: {
      label: 'CADET', desc: 'Training mode',
      spawnStart: 1.2, spawnEnd: 0.5,
      speedMin: 65, speedMax: 95,
      debrisMin: 8, debrisMax: 13,
      shieldRadius: 45,
      aimSpread: 0.6,
      killPoints: 5, satBonus: 30
    },
    commander: {
      label: 'COMMANDER', desc: 'Recommended',
      spawnStart: 0.9, spawnEnd: 0.3,
      speedMin: 90, speedMax: 135,
      debrisMin: 7, debrisMax: 11,
      shieldRadius: 36,
      aimSpread: 0.4,
      killPoints: 10, satBonus: 50
    },
    legend: {
      label: 'LEGEND', desc: 'For the brave',
      spawnStart: 0.65, spawnEnd: 0.18,
      speedMin: 95, speedMax: 165,
      debrisMin: 6, debrisMax: 10,
      shieldRadius: 28,
      aimSpread: 0.25,
      killPoints: 15, satBonus: 75
    }
  };

  function getLeaderboard(mode) { try { var key = mode === 'endless' ? LEADERBOARD_KEY_ENDLESS : LEADERBOARD_KEY; return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; } }
  function saveToLeaderboard(alias, score, satsAlive, mode, survivalTime) {
    var key = mode === 'endless' ? LEADERBOARD_KEY_ENDLESS : LEADERBOARD_KEY;
    var b = getLeaderboard(mode);
    var entry = { alias: alias, score: score, satsAlive: satsAlive, date: new Date().toISOString().slice(0,10) };
    if (mode === 'endless') entry.survived = survivalTime;
    b.push(entry);
    b.sort(function(a,b) { return b.score - a.score; });
    localStorage.setItem(key, JSON.stringify(b.slice(0,20)));
  }
  function renderLeaderboard(mode) {
    var b = getLeaderboard(mode || gMode);
    if (!b.length) return '<div style="color:var(--steel);font-size:11px;text-align:center;padding:12px;">No scores yet — be the first!</div>';
    var today = new Date().toISOString().slice(0,10);
    return b.slice(0,8).map(function(e,i) {
      var medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':''+(i+1);
      var extra = e.survived ? ' <span style="opacity:0.6;">(' + e.survived + 's)</span>' : '';
      return '<div class="lb-row '+(e.date===today?'recent':'')+'"><span class="lb-rank">'+medal+'</span><span class="lb-alias">'+e.alias+extra+'</span><span class="lb-sats">'+e.satsAlive+'/5</span><span class="lb-score">'+e.score+'</span></div>';
    }).join('');
  }

  function buildHTML() {
    panel.innerHTML =
      '<div class="games-fullpage">' +
        '<div class="game-container">' +
          '<div id="guardian-panel" class="game-panel active" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"></div>' +
        '</div>' +
      '</div>';
  }

  function initPicker() {
    panel.querySelectorAll('.game-pick-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (btn.dataset.game === activeGame) return;

        // Leaving the guardian game mid-play: stop its loop and reset to
        // the start screen instead of letting it keep rendering/ticking
        // offscreen forever behind the trivia panel.
        if (activeGame === 'guardian' && gState === 'playing') {
          if (gAnimFrame) cancelAnimationFrame(gAnimFrame);
          gState = 'idle';
          document.body.classList.remove('game-active');
          var hud = document.getElementById('g-hud');
          if (hud) hud.classList.add('hidden');
          var startScreen = document.getElementById('g-start');
          if (startScreen) startScreen.classList.remove('hidden');
        }

        panel.querySelectorAll('.game-pick-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeGame = btn.dataset.game;
        panel.querySelectorAll('.game-panel').forEach(function(p) { p.classList.remove('active'); });
        document.getElementById(activeGame + '-panel').classList.add('active');

        if (activeGame === 'observer') renderObserverPanel();
      });
    });
  }

  // === TRIVIA (No decimals, subtle wrong feedback) ===
  function renderObserverPanel() {
    var op = document.getElementById('observer-panel');
    if (!op) return;
    var eggs = Utils.easterEggs;
    var found = eggs.getCount(), total = eggs.getTotal();
    var secrets = eggs.secrets;
    var HINTS = {
      earth: { tab: 'THE LAYER', hint: 'The planet at the center of the radar is more than just a decoration...', method: 'You clicked Earth in the radar.' },
      moon: { tab: 'YOUR DAY', hint: 'The last hour has an icon that hides a secret about our nearest neighbor...', method: 'You clicked the 🌙 icon on the Sleep hour.' },
      telstar: { tab: 'POWERED BY', hint: 'What happens if you click the same gallery dot... a few too many times?', method: 'You clicked the same gallery dot 5 times.' },
      solar: { tab: 'WITHOUT', hint: 'Sometimes patience reveals what haste cannot. Sit still for half a minute...', method: 'You stayed on the tab for 30 seconds without scrolling.' },
      debris: { tab: 'PLAY', hint: 'Protect what matters. If Earth survives, you\'ll earn more than just points...', method: 'You saved Earth. The shield operator did their job.' }
    };

    var html = '<div class="observer-log-full">';
    html += '<div class="observer-header">';
    html += '<div class="observer-icon">🔭</div>';
    html += '<h3 class="observer-title">OBSERVER LOG</h3>';
    html += '<div class="observer-score">' + found + ' / ' + total + ' secrets discovered</div>';
    if (found === total) html += '<div class="observer-badge">🏅 ORBITAL OBSERVER — You see what others miss.</div>';
    html += '</div>';

    html += '<div class="observer-entries">';
    Object.keys(secrets).forEach(function(id) {
      if (eggs.found[id]) {
        html += '<div class="observer-entry found">';
        html += '<div class="observer-entry-tab">' + HINTS[id].tab + '</div>';
        html += '<div class="observer-entry-secret">' + secrets[id].text + '</div>';
        html += '<div class="observer-entry-method">💡 How: ' + HINTS[id].method + '</div>';
        html += '</div>';
      } else {
        html += '<div class="observer-entry locked">';
        html += '<div class="observer-entry-tab">' + HINTS[id].tab + '</div>';
        html += '<div class="observer-entry-hint">' + HINTS[id].hint + '</div>';
        html += '</div>';
      }
    });
    html += '</div>';

    if (found < total) html += '<p class="observer-footer">Explore each tab carefully. The invisible layer rewards those who look closer.</p>';
    html += '<div class="observer-conclusion">' +
      '<p>You\'ve seen 18,560 satellites. You\'ve traced their shadow through your day. You\'ve watched them fail. You\'ve defended them.</p>' +
      '<p><strong style="color:var(--phosphor)">The invisible layer is real — and now you see it.</strong></p>' +
      '<p style="margin-top:12px;font-size:10px;opacity:0.6;">Built for Analyticon Viz Con 2026 · Theme: How the World Lives, Thrives, and Connects</p>' +
    '</div>';
    html += '</div>';
    op.innerHTML = html;
  }

  // === SPACE GUARDIAN (Full-size canvas, auto-shield follows cursor) ===

  // === SPACE GUARDIAN — EXODUS DEFENSE ===
  var gCanvas, gCtx, gState = 'idle';
  var gSats = [], gDebris = [], gParticles = [], gShieldBubble = null;
  var gAnimFrame, gLastTime, gSpawnTimer = 0;
  var gMouseX = 0, gMouseY = 0;
  var gDebrisKills = 0, gTimeLeft = 30, gSurvivalTime = 0;
  var gEarthShield = 3, gEarthImmune = 0;
  var gDifficulty = 'commander', gMode = '30sec', gAlias = '';
  var gShieldBubbleTimer = 0;
  var SERVICES = ['GPS','WEATHER','COMMS','NET','TIME'];
  var SAT_IMPACT = {
    'GPS': '📍 GPS LOST — Navigation, ride-sharing, delivery tracking go dark',
    'WEATHER': '🌪️ WEATHER LOST — No storm warnings, flights grounded worldwide',
    'COMMS': '📡 COMMS LOST — Phone calls, TV, emergency signals cut off',
    'NET': '🌐 NET LOST — Internet for remote areas gone, millions disconnected',
    'TIME': '⏱️ TIME LOST — Financial markets freeze, power grids desync'
  };
  var gImpactMsg = '', gImpactTimer = 0;
  var gSlowdown = 0; // frames of slow-motion remaining

  var DIFFICULTY = {
    cadet: { label: 'CADET', spawnStart:1.2, spawnEnd:0.5, speedMin:65, speedMax:95, debrisMin:8, debrisMax:13, shieldRadius:45, aimSpread:0.6, killPoints:5, satBonus:30 },
    commander: { label: 'COMMANDER', spawnStart:0.9, spawnEnd:0.3, speedMin:90, speedMax:135, debrisMin:7, debrisMax:11, shieldRadius:36, aimSpread:0.4, killPoints:10, satBonus:50 },
    legend: { label: 'LEGEND', spawnStart:0.65, spawnEnd:0.18, speedMin:95, speedMax:165, debrisMin:6, debrisMax:10, shieldRadius:28, aimSpread:0.25, killPoints:15, satBonus:75 }
  };

  // Sizing helpers — everything scales off the smaller canvas dimension so nothing leaks off-screen
  function gBase() { return Math.min(gCanvas.width, gCanvas.height); }
  function gOrbitR() { return gBase() * 0.28; }
  function gEarthR() { return Math.max(28, Math.min(48, gBase() * 0.09)); }

  // Cap internal resolution — CSS stretches the canvas, mouse coords already rescale.
  // Rendering at full 2500px+ width is the main perf cost on large screens.
  function sizeCanvas() {
    var wrap = document.getElementById('g-wrap');
    if (!wrap) return;
    var rect = wrap.getBoundingClientRect();
    var w = Math.round(rect.width) || 800, h = Math.round(rect.height) || 600;
    var MAX_W = 1280;
    if (w > MAX_W) { h = Math.round(h * (MAX_W / w)); w = MAX_W; }
    gCanvas.width = w; gCanvas.height = h;
  }

  // === STORY VIDEO INTRO (replaces canvas slides) ===
  var storyActive = false;

  function startStorySlides() {
    storyActive = true;
    var lines = document.querySelectorAll('.story-line');
    var beginBtn = document.getElementById('story-next');
    lines.forEach(function(l, i) {
      setTimeout(function() { l.classList.add("visible"); }, i * 1200);
    });
    // Show BEGIN MISSION after all lines
    setTimeout(function() {
      if (beginBtn) beginBtn.classList.add('visible');
    }, lines.length * 1200 + 400);
  }
  function endStory() {
    storyActive = false;
    document.getElementById('g-story').classList.add('hidden');
    document.getElementById('g-start').classList.remove('hidden');
  }

  function initGuardian() {
    var gp = document.getElementById('guardian-panel');
    gp.innerHTML =
      '<div class="guardian-fullwrap">' +
        '<div class="guardian-hud hidden" id="g-hud"><div class="guardian-hud-item"><div class="label">KILLS</div><div class="value" id="gh-score">0</div></div><div class="guardian-hud-item"><div class="label">TIME</div><div class="value" id="gh-time">30</div></div><div class="guardian-hud-item"><div class="label">SATS</div><div class="value" id="gh-sats">5</div></div><div class="guardian-hud-item"><div class="label">EARTH 🛡️</div><div class="value" id="gh-earth">3</div></div></div>' +
        '<div class="guardian-canvas-wrap" id="g-wrap">' +
          
          '<canvas id="guardian-canvas" aria-label="Space Guardian game"></canvas>' +
          '<div class="guardian-overlay" id="g-story">' +
            '<div class="story-cinematic">' +
              '<div class="story-line story-kicker-line">YEAR 2347</div>' +
              '<div class="story-line story-dramatic">Our sun is dying.</div>' +
              '<div class="story-line story-body-line">Humanity builds planetary engines. Earth itself becomes the ship.</div>' +
              '<div class="story-line story-body-line">The satellites that connect 8 billion lives — GPS, weather, communications — are its nervous system.</div>' +
              '<div class="story-line story-body-line">The journey crosses uncharted space. Asteroids. Rogue debris. Unknown objects.</div>' +
              '<div class="story-line story-dramatic"><span class="story-highlight">You are humanity\'s last shield operator.</span></div>' +
              '<button class="game-btn story-begin-btn" id="story-next">🛡️ BEGIN MISSION</button>' +
            '</div>' +
            '<button class="game-btn story-skip-btn" id="g-story-skip">SKIP ≫</button>' +
          '</div>' +
          '<div class="guardian-overlay hidden" id="g-start">' +
            '<h3>🛰️ EXODUS DEFENSE</h3>' +
            '<label style="font-family:JetBrains Mono,monospace;font-size:9px;letter-spacing:0.1em;color:var(--steel);display:block;margin-top:10px;">YOUR ALIAS</label>' +
            '<input type="text" class="alias-input" id="g-alias" placeholder="enter alias" maxlength="16" />' +
            '<div style="margin-top:14px;font-family:JetBrains Mono,monospace;font-size:9px;letter-spacing:0.1em;color:var(--steel);">MODE</div>' +
            '<div class="mode-picker"><button class="mode-btn active" data-mode="30sec">30 SEC</button><button class="mode-btn" data-mode="endless">ENDLESS</button></div>' +
            '<div id="diff-section"><div style="margin-top:12px;font-family:JetBrains Mono,monospace;font-size:9px;letter-spacing:0.1em;color:var(--steel);">DIFFICULTY</div>' +
              '<div class="difficulty-picker"><button class="diff-btn" data-diff="cadet"><span class="diff-name">CADET</span><span class="diff-desc">Training</span></button><button class="diff-btn active" data-diff="commander"><span class="diff-name">COMMANDER</span><span class="diff-desc">Recommended</span></button><button class="diff-btn" data-diff="legend"><span class="diff-name">LEGEND</span><span class="diff-desc">For the brave</span></button></div></div>' +
            '<button class="game-btn" id="g-start-btn" style="margin-top:14px;">START MISSION</button>' +
            '<button class="game-btn" id="g-tutorial-btn" style="margin-top:8px;border-color:var(--steel);color:var(--steel);">HOW TO PLAY</button>' +
            '<div style="font-family:JetBrains Mono,monospace;font-size:9px;color:var(--steel);margin-top:10px;opacity:0.6;">SPACE = pause</div>' +
          '</div>' +
          '<div class="guardian-overlay hidden" id="g-tutorial">' +
            '<div style="max-width:380px;text-align:left;font-family:JetBrains Mono,monospace;font-size:11px;line-height:2;color:var(--steel);">' +
              '<h3 style="text-align:center;margin-bottom:16px;color:var(--white);">How to Play</h3>' +
              '<div>🖱️ <span style="color:var(--white)">Move cursor</span> — your shield follows, destroying debris on contact</div>' +
              '<div>🛡️ <span style="color:var(--white)">Earth has shields</span> — absorbs hits. At 0: next hit = game over</div>' +
              '<div>🛰️ <span style="color:var(--white)">Satellites orbit</span> — debris can destroy them (in endless: they start with 1 shield)</div>' +
              '<div>💎 <span style="color:var(--sky)">Shield bubbles</span> (endless) — collect to restore satellite shields</div>' +
              '<div>⏱️ <span style="color:var(--white)">30 SEC mode</span> — survive the timer. Earth shield = bonus points</div>' +
              '<div>♾️ <span style="color:var(--white)">ENDLESS mode</span> — no timer. Difficulty ramps. How long can you last?</div>' +
              '<div style="margin-top:12px;text-align:center;"><button class="game-btn" id="g-tutorial-close">GOT IT</button></div>' +
            '</div>' +
          '</div>' +
          '<div class="guardian-overlay hidden" id="g-end"><h3 id="g-end-title">DONE</h3><div style="font-family:JetBrains Mono,monospace;font-size:36px;font-weight:800;color:var(--phosphor);margin:8px 0;" id="g-end-score">0</div><div style="font-family:JetBrains Mono,monospace;font-size:10px;color:var(--steel);letter-spacing:0.1em;margin-bottom:4px;" id="g-end-diff"></div><div id="g-end-breakdown" style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--steel);margin:12px 0;line-height:2;"></div><div id="g-end-sats" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:12px;"></div><p id="g-end-statement" style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--steel);text-align:center;max-width:360px;line-height:1.7;font-style:italic;margin-bottom:16px;"></p><div class="game-leaderboard" id="guardian-leaderboard"><div class="lb-title">🏆 LEADERBOARD</div><div class="lb-tabs"><button class="lb-tab active" data-lb="30sec">30 SEC</button><button class="lb-tab" data-lb="endless">ENDLESS</button></div><div class="lb-header"><span class="lb-rank">#</span><span class="lb-alias">ALIAS</span><span class="lb-sats">SATS</span><span class="lb-score">SCORE</span></div><div id="lb-entries"></div></div><button class="game-btn" id="g-restart-btn" style="margin-top:16px;">PLAY AGAIN</button></div>' +
        '</div>' +
      '</div>';

    gCanvas = document.getElementById('guardian-canvas');
    gCtx = gCanvas.getContext('2d');
    // Size canvas to fill container (capped resolution)
    setTimeout(function() { sizeCanvas(); seedGameStars(); }, 100);

    var stored = localStorage.getItem('il-alias') || '';
    document.getElementById('g-alias').value = stored;

    // Story navigation
    document.getElementById('g-story-skip').addEventListener('click', endStory);
    document.getElementById('story-next').addEventListener('click', endStory);

    // Tutorial
    document.getElementById('g-tutorial-btn').addEventListener('click', function() {
      document.getElementById('g-start').classList.add('hidden');
      document.getElementById('g-tutorial').classList.remove('hidden');
    });
    document.getElementById('g-tutorial-close').addEventListener('click', function() {
      document.getElementById('g-tutorial').classList.add('hidden');
      document.getElementById('g-start').classList.remove('hidden');
    });

    // Start the manga story slides
    startStorySlides();

    // Difficulty picker
    document.querySelectorAll('.diff-btn').forEach(function(btn) { btn.addEventListener('click', function() { document.querySelectorAll('.diff-btn').forEach(function(b){b.classList.remove('active');}); btn.classList.add('active'); gDifficulty = btn.dataset.diff; }); });
    // Mode picker
    document.querySelectorAll('.mode-btn').forEach(function(btn) { btn.addEventListener('click', function() { document.querySelectorAll('.mode-btn').forEach(function(b){b.classList.remove('active');}); btn.classList.add('active'); gMode = btn.dataset.mode; var ds = document.getElementById('diff-section'); if(ds) ds.style.display = gMode==='endless'?'none':'block'; }); });

    document.getElementById('g-start-btn').addEventListener('click', function() { document.getElementById('g-wrap').scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(startGuardian, 300); });
    document.getElementById('g-restart-btn').addEventListener('click', function() { document.getElementById('g-end').classList.add('hidden'); document.getElementById('g-start').classList.remove('hidden'); });

    gCanvas.addEventListener('mousemove', function(e) { var r=gCanvas.getBoundingClientRect(); gMouseX=(e.clientX-r.left)/r.width*gCanvas.width; gMouseY=(e.clientY-r.top)/r.height*gCanvas.height; });
    gCanvas.addEventListener('touchmove', function(e) { e.preventDefault(); var r=gCanvas.getBoundingClientRect(); var t=e.touches[0]; gMouseX=(t.clientX-r.left)/r.width*gCanvas.width; gMouseY=(t.clientY-r.top)/r.height*gCanvas.height; }, {passive:false});

    document.addEventListener('keydown', function(e) {
      if (activeGame !== 'guardian') return;
      if (e.key===' '||e.code==='Space') { e.preventDefault(); if(gState==='playing'){gState='paused';renderPauseOverlay();}else if(gState==='paused'){gState='playing';hidePauseOverlay();gLastTime=performance.now();guardianLoop(performance.now());} }
    });
  }

  function renderPauseOverlay() {
    var w=document.getElementById('g-wrap'); var ex=document.getElementById('g-pause');
    if(ex){ex.classList.remove('hidden');return;}
    var o=document.createElement('div'); o.id='g-pause'; o.className='guardian-overlay';
    o.innerHTML='<h3>⏸️ PAUSED</h3><p>Press SPACE to resume</p>' +
      '<div style="display:flex;gap:10px;">' +
        '<button class="game-btn" id="g-resume-btn">RESUME</button>' +
        '<button class="game-btn" id="g-quit-btn" style="border-color:var(--alert);color:var(--alert);">QUIT</button>' +
      '</div>';
    w.appendChild(o);
    document.getElementById('g-resume-btn').addEventListener('click', function() {
      gState='playing'; hidePauseOverlay(); gLastTime=performance.now(); guardianLoop(performance.now());
    });
    document.getElementById('g-quit-btn').addEventListener('click', quitGuardian);
  }
  function quitGuardian() {
    gState='idle';
    document.body.classList.remove('game-active');
    var hud = document.getElementById('g-hud');
    if (hud) hud.classList.add('hidden');
    if (gAnimFrame) cancelAnimationFrame(gAnimFrame);
    gDebris=[]; gParticles=[]; gSats=[]; gShieldBubble=null;
    if (gCtx) gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
    hidePauseOverlay();
    document.getElementById('g-end').classList.add('hidden');
    document.getElementById('g-start').classList.remove('hidden');
  }
  function hidePauseOverlay() { var el=document.getElementById('g-pause'); if(el) el.classList.add('hidden'); }

  function startGuardian() {
    var aliasInput = document.getElementById('g-alias');
    gAlias = (aliasInput && aliasInput.value.trim()) || 'player';
    localStorage.setItem('il-alias', gAlias);
    document.getElementById('g-start').classList.add('hidden');
    document.getElementById('g-end').classList.add('hidden');

    // Show loading overlay while Earth image loads
    var wrap = document.getElementById('g-wrap');
    var loadingEl = document.createElement('div');
    loadingEl.id = 'g-loading';
    loadingEl.className = 'guardian-overlay';
    loadingEl.innerHTML = '<div style="font-family:JetBrains Mono,monospace;font-size:12px;color:var(--phosphor);letter-spacing:0.1em;">INITIALIZING...</div>';
    wrap.appendChild(loadingEl);

    function beginGame() {
      var le = document.getElementById('g-loading');
      if (le) le.remove();

      // Lock page scrolling during gameplay
      document.body.classList.add('game-active');

      // Show HUD
      var hud = document.getElementById('g-hud');
      if (hud) hud.classList.remove('hidden');

      // Resize canvas to fill container (capped resolution) and spread stars across it immediately
      sizeCanvas();
      seedGameStars();

      gDebrisKills = 0; gTimeLeft = 30; gSurvivalTime = 0; gSpawnTimer = 0;
      gEarthShield = gMode === 'endless' ? 3 : 0; gEarthImmune = 0; gShieldBubble = null; gShieldBubbleTimer = 0;
      gSats = []; gDebris = []; gParticles = [];
      gState = 'playing';

      var cx = gCanvas.width/2, cy = gCanvas.height/2, r = gOrbitR();
      gMouseX = cx; gMouseY = cy;

      SERVICES.forEach(function(svc, i) {
        var a = (i / SERVICES.length) * Math.PI * 2 - Math.PI / 2;
        gSats.push({ x: cx+Math.cos(a)*r, y: cy+Math.sin(a)*r, angle: a, radius: 14, service: svc, alive: true, speed: 0.22+Math.random()*0.12, shield: gMode === 'endless' ? 1 : 0, immune: 0 });
      });

      var timeLabel = document.querySelector('.guardian-hud-item:nth-child(2) .label');
      if (timeLabel) timeLabel.textContent = gMode === 'endless' ? 'SURVIVED' : 'TIME';

      gLastTime = performance.now();
      if (gAnimFrame) cancelAnimationFrame(gAnimFrame);
      guardianLoop(performance.now());
    }

    // Wait for Earth image or timeout after 2 seconds
    if (earthImgLoaded) {
      setTimeout(beginGame, 300); // brief flash of loading for feel
    } else {
      var timeout = setTimeout(function() { beginGame(); }, 2000);
      earthImg.onload = function() { earthImgLoaded = true; clearTimeout(timeout); beginGame(); };
    }
  }

  function guardianLoop(now) {
    if (gState !== 'playing') return;
    var dt = Math.min(0.05, (now - gLastTime) / 1000); gLastTime = now;

    // Slowdown effect on satellite death
    if (gSlowdown > 0) { gSlowdown--; dt *= 0.25; }

    if (gMode === 'endless') {
      gSurvivalTime += dt;
    } else {
      gTimeLeft -= dt;
      if (gTimeLeft <= 0) { endGuardian(false); return; }
    }

    updateGuardian(dt);
    renderGuardian();
    updateGuardianHUD();
    gAnimFrame = requestAnimationFrame(guardianLoop);
  }

  function updateGuardian(dt) {
    var diff = gMode === 'endless' ? DIFFICULTY.commander : DIFFICULTY[gDifficulty];
    var cx = gCanvas.width/2, cy = gCanvas.height/2, r = gOrbitR();
    var shieldRadius = gMode === 'endless' ? 28 : diff.shieldRadius;

    // Decrease immunity timers
    if (gEarthImmune > 0) gEarthImmune -= dt;
    gSats.forEach(function(s) { if (s.immune > 0) s.immune -= dt; });

    // Move satellites
    gSats.forEach(function(s) { if (!s.alive) return; s.angle += s.speed * dt; s.x = cx + Math.cos(s.angle) * r; s.y = cy + Math.sin(s.angle) * r; });

    // Spawn debris
    gSpawnTimer += dt;
    var elapsed = gMode === 'endless' ? gSurvivalTime : (30 - gTimeLeft);
    var rampDur = gMode === 'endless' ? 90 : 30;
    var rate = (gMode === 'endless' ? 1.2 : diff.spawnStart) - (elapsed / rampDur) * ((gMode === 'endless' ? 1.2 : diff.spawnStart) - (gMode === 'endless' ? 0.15 : diff.spawnEnd));
    rate = Math.max(gMode === 'endless' ? 0.15 : diff.spawnEnd, rate);
    if (gSpawnTimer > rate) { gSpawnTimer = 0; spawnDebris(); }

    // Move debris
    gDebris.forEach(function(d) { d.x += d.vx*dt; d.y += d.vy*dt; d.rot += d.rs*dt; });

    // Debris vs player shield (cursor) - works everywhere on screen
    gDebris.forEach(function(d) {
      if (d.dead) return;
      if (Math.hypot(d.x - gMouseX, d.y - gMouseY) < shieldRadius + d.r) {
        d.dead = true; gDebrisKills++; spawnParts(d.x, d.y, 6, '#5EFFB3');
        if (gMode === 'endless' && gDebrisKills % 30 === 0) { earnEarthShield(); }
      }
    });

    // Debris vs satellites
    gDebris.forEach(function(d) {
      if (d.dead) return;
      gSats.forEach(function(s) {
        if (!s.alive || s.immune > 0) return;
        if (Math.hypot(d.x - s.x, d.y - s.y) < s.radius + d.r) {
          d.dead = true;
          if (s.shield > 0) { s.shield--; s.immune = 1; spawnParts(s.x, s.y, 5, '#FFD37A'); }
          else { s.alive = false; s.immune = 0; spawnParts(s.x, s.y, 10, '#FF5A36'); gImpactMsg = SAT_IMPACT[s.service] || ''; gImpactTimer = 180; gSlowdown = 42; }
        }
      });
    });

    // Debris vs Earth (larger Earth)
    gDebris.forEach(function(d) {
      if (d.dead) return;
      if (gEarthImmune > 0) return;
      if (Math.hypot(d.x - cx, d.y - cy) < gEarthR() + d.r) {
        d.dead = true;
        if (gEarthShield > 0) { gEarthShield--; gEarthImmune = 1; spawnParts(cx, cy, 8, '#FFD37A'); }
        else { endGuardian(true); return; }
      }
    });

    // Shield bubble (Endless only) - spawns every 30 seconds
    if (gMode === 'endless') {
      gShieldBubbleTimer += dt;
      if (gShieldBubbleTimer >= 30 && !gShieldBubble) {
        gShieldBubbleTimer = 0;
        gShieldBubble = { x: 50 + Math.random() * (gCanvas.width - 100), y: 50 + Math.random() * (gCanvas.height - 100), life: 8 };
        // Also earn Earth shield every 30s in endless
        earnEarthShield();
      }
      if (gShieldBubble) {
        gShieldBubble.life -= dt;
        if (gShieldBubble.life <= 0) { gShieldBubble = null; }
        else if (Math.hypot(gMouseX - gShieldBubble.x, gMouseY - gShieldBubble.y) < 30) {
          collectShieldBubble();
          gShieldBubble = null;
        }
      }
    }

    // Cleanup
    gDebris = gDebris.filter(function(d) { return !d.dead && d.x > -60 && d.x < gCanvas.width+60 && d.y > -60 && d.y < gCanvas.height+60; });
    gParticles.forEach(function(p) { p.x += p.vx*dt; p.y += p.vy*dt; p.a -= 2.5*dt; });
    gParticles = gParticles.filter(function(p) { return p.a > 0; });
  }

  function earnEarthShield() { gEarthShield++; spawnParts(gCanvas.width/2, gCanvas.height/2, 6, '#5EFFB3'); }

  function collectShieldBubble() {
    // Find satellite with lowest shield (0) and give it a shield
    var target = null;
    gSats.forEach(function(s) { if (s.alive && s.shield === 0) { if (!target) target = s; } });
    if (target) { target.shield = 1; spawnParts(target.x, target.y, 5, '#00B4D8'); }
    else { gEarthShield++; spawnParts(gCanvas.width/2, gCanvas.height/2, 6, '#5EFFB3'); }
  }

  function spawnDebris() {
    var diff = gMode === 'endless' ? DIFFICULTY.commander : DIFFICULTY[gDifficulty];
    var speedMin = gMode === 'endless' ? 65 + Math.min(1, gSurvivalTime/90) * 45 : diff.speedMin;
    var speedMax = gMode === 'endless' ? 95 + Math.min(1, gSurvivalTime/90) * 85 : diff.speedMax;
    var aimSpread = gMode === 'endless' ? 0.6 - Math.min(1, gSurvivalTime/90) * 0.45 : diff.aimSpread;
    var cw = gCanvas.width, ch = gCanvas.height, side = Math.floor(Math.random()*4), x, y;
    switch(side) { case 0:x=Math.random()*cw;y=-20;break; case 1:x=cw+20;y=Math.random()*ch;break; case 2:x=Math.random()*cw;y=ch+20;break; default:x=-20;y=Math.random()*ch; }
    // Target satellites or Earth
    var targets = gSats.filter(function(s){return s.alive;});
    var cx = gCanvas.width/2, cy = gCanvas.height/2;
    var tx, ty;
    if (targets.length > 0 && Math.random() > 0.3) { var t = targets[Math.floor(Math.random()*targets.length)]; tx = t.x; ty = t.y; }
    else { tx = cx; ty = cy; } // 30% chance to target Earth directly
    var a = Math.atan2(ty-y, tx-x) + (Math.random()-0.5) * aimSpread * 2;
    var spd = speedMin + Math.random() * (speedMax - speedMin);
    var dr = 6 + Math.random() * 5;
    var pts = 6 + Math.floor(Math.random()*4);
    var jitters = [];
    for (var ji = 0; ji < pts; ji++) jitters.push(0.6 + Math.random()*0.4);
    gDebris.push({ x:x, y:y, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd, r:dr, rot:0, rs:(Math.random()-0.5)*5, dead:false, pts:pts, jitters:jitters });
  }

  function spawnParts(x, y, count, color) {
    for (var i=0; i<count; i++) { var a=(i/count)*Math.PI*2+Math.random()*0.3; gParticles.push({x:x,y:y,vx:Math.cos(a)*(50+Math.random()*40),vy:Math.sin(a)*(50+Math.random()*40),a:1,color:color||'#fff'}); }
  }

  // Load Earth image from embedded base64 data
  var gameStars = [];
  function seedGameStars() {
    gameStars = [];
    var w = (gCanvas && gCanvas.width) || 600, h = (gCanvas && gCanvas.height) || 600;
    for (var gs = 0; gs < 60; gs++) {
      gameStars.push({ x: Math.random() * w, y: Math.random() * h, speed: 0.5 + Math.random() * 2, size: Math.random() * 1.5 + 0.3 });
    }
  }
  seedGameStars();

  var earthImgLoaded = false;
  var earthImg = new Image();
  earthImg.onload = function() { earthImgLoaded = true; };
  if (typeof EARTH_IMG_DATA !== 'undefined') { earthImg.src = EARTH_IMG_DATA; }

  // === PERF: cache gradients instead of rebuilding them every frame ===
  // Satellite radius is always 14, so the wing/body/dish gradients are
  // identical on every satellite, every frame — build them once and reuse.
  // (Canvas gradients are defined in local coordinates and correctly follow
  // whatever translate/rotate is active when they're used, so this is safe.)
  var gradCache = { wingL: null, wingR: null, body: null, dish: null, debris: {} };
  function getSatGradients(R) {
    if (gradCache.wingL) return gradCache;
    var wingLen = R*1.05, wingH = R*1.0, gap = R*0.35, bw = R*0.9, bh = R*1.1;
    var xL = -gap - wingLen, xR = gap;
    gradCache.wingL = gCtx.createLinearGradient(xL, -wingH/2, xL, wingH/2);
    gradCache.wingL.addColorStop(0, '#3A5FA8'); gradCache.wingL.addColorStop(0.5, '#2A4D8F'); gradCache.wingL.addColorStop(1, '#1D3766');
    gradCache.wingR = gCtx.createLinearGradient(xR, -wingH/2, xR, wingH/2);
    gradCache.wingR.addColorStop(0, '#3A5FA8'); gradCache.wingR.addColorStop(0.5, '#2A4D8F'); gradCache.wingR.addColorStop(1, '#1D3766');
    gradCache.body = gCtx.createLinearGradient(-bw/2, -bh/2, bw/2, bh/2);
    gradCache.body.addColorStop(0, '#FFE28A'); gradCache.body.addColorStop(0.35, '#E6B34A'); gradCache.body.addColorStop(0.65, '#B8860B'); gradCache.body.addColorStop(1, '#8A6508');
    gradCache.dish = gCtx.createRadialGradient(-R*0.1, -bh/2 - R*0.6, 0, 0, -bh/2 - R*0.55, R*0.45);
    gradCache.dish.addColorStop(0, '#ffffff'); gradCache.dish.addColorStop(1, '#b9c2cc');
    return gradCache;
  }
  function getDebrisGradient(r) {
    var key = Math.round(r);
    if (gradCache.debris[key]) return gradCache.debris[key];
    var dg = gCtx.createRadialGradient(-r*0.2, -r*0.2, 0, 0, 0, r);
    dg.addColorStop(0, '#8B4513'); dg.addColorStop(0.6, '#5C2E0A'); dg.addColorStop(1, '#2C1406');
    gradCache.debris[key] = dg;
    return dg;
  }

  function renderGuardian() {
    var diff = gMode === 'endless' ? DIFFICULTY.commander : DIFFICULTY[gDifficulty];
    var shieldRadius = gMode === 'endless' ? 28 : diff.shieldRadius;
    var cx = gCanvas.width/2, cy = gCanvas.height/2, w = gCanvas.width, h = gCanvas.height;
    gCtx.clearRect(0, 0, w, h);

    // Streaking stars background
    gCtx.globalAlpha = 0.5;
    gameStars.forEach(function(s) {
      s.x -= s.speed;
      if (s.x < 0) { s.x = w; s.y = Math.random() * h; }
      gCtx.fillStyle = '#fff';
      gCtx.fillRect(s.x, s.y % h, s.speed * 1.5, s.size);
    });
    gCtx.globalAlpha = 1;

    // Orbit ring
    gCtx.beginPath(); gCtx.arc(cx, cy, gOrbitR(), 0, Math.PI*2);
    gCtx.strokeStyle = 'rgba(94,255,179,0.06)'; gCtx.lineWidth = 1;
    gCtx.setLineDash([5,6]); gCtx.stroke(); gCtx.setLineDash([]);

    // === EARTH (from embedded image) ===
    var earthR = gEarthR();
    if (earthImgLoaded && earthImg.naturalWidth > 0) {
      // Clip to a circle and draw image maintaining aspect ratio (cover)
      gCtx.save();
      gCtx.beginPath(); gCtx.arc(cx, cy, earthR, 0, Math.PI*2); gCtx.clip();
      // Cover: scale to fill the circle area, crop overflow
      var imgW = earthImg.naturalWidth, imgH = earthImg.naturalHeight;
      var scale = Math.max((earthR*2)/imgW, (earthR*2)/imgH);
      var dw = imgW * scale, dh = imgH * scale;
      gCtx.drawImage(earthImg, cx - dw/2, cy - dh/2, dw, dh);
      gCtx.restore();
    } else {
      // Fallback gradient
      var eg = gCtx.createRadialGradient(cx - earthR*0.2, cy - earthR*0.2, 0, cx, cy, earthR);
      eg.addColorStop(0, '#2196F3'); eg.addColorStop(0.5, '#1565A8'); eg.addColorStop(1, '#0D2137');
      gCtx.beginPath(); gCtx.arc(cx, cy, earthR, 0, Math.PI*2);
      gCtx.fillStyle = eg; gCtx.fill();
    }

    // Shield ring (endless mode only)
    if (gEarthShield > 0 && gMode === 'endless') {
      gCtx.beginPath(); gCtx.arc(cx, cy, earthR + 5, 0, Math.PI*2);
      var sa = gEarthImmune > 0 ? 0.3 + Math.sin(performance.now()*0.02)*0.3 : 0.25;
      gCtx.strokeStyle = 'rgba(94,255,179,' + sa + ')'; gCtx.lineWidth = 2.5; gCtx.stroke();
      gCtx.font = 'bold 12px "JetBrains Mono"'; gCtx.fillStyle = 'rgba(94,255,179,0.9)'; gCtx.textAlign = 'center';
      gCtx.fillText('🛡️ ' + gEarthShield, cx, cy + earthR + 18);
    }
    // Immunity flash
    if (gEarthImmune > 0 && Math.sin(performance.now()*0.015) > 0) {
      gCtx.beginPath(); gCtx.arc(cx, cy, earthR + 10, 0, Math.PI*2);
      gCtx.strokeStyle = 'rgba(255,211,122,0.4)'; gCtx.lineWidth = 3; gCtx.stroke();
    }

    // === SATELLITES (realistic: gold foil body, blue solar wings, white dish) ===
    gSats.forEach(function(s) {
      if (!s.alive) { gCtx.beginPath(); gCtx.arc(s.x, s.y, 4, 0, Math.PI*2); gCtx.fillStyle='rgba(255,90,54,0.12)'; gCtx.fill(); return; }
      if (s.immune > 0 && Math.sin(performance.now()*0.015) > 0) return;
      var R = s.radius;
      gCtx.save(); gCtx.translate(s.x, s.y); gCtx.rotate(s.angle + Math.PI/2);
      var sg = getSatGradients(R);

      // --- Solar panel wings (2 segments each side, blue grid, square-ish) ---
      var wingLen = R*1.05, wingH = R*1.0, gap = R*0.35;
      [-1, 1].forEach(function(dir) {
        var x0 = dir === -1 ? -gap - wingLen : gap;
        // Strut connecting wing to body
        gCtx.strokeStyle = '#9aa3ad'; gCtx.lineWidth = Math.max(1, R*0.08);
        gCtx.beginPath(); gCtx.moveTo(dir*R*0.4, 0); gCtx.lineTo(dir*gap, 0); gCtx.stroke();
        // Panel base
        gCtx.fillStyle = dir === -1 ? sg.wingL : sg.wingR;
        gCtx.fillRect(x0, -wingH/2, wingLen, wingH);
        // Panel segment divider + cell grid
        gCtx.strokeStyle = 'rgba(180,200,255,0.35)'; gCtx.lineWidth = 0.8;
        gCtx.beginPath(); gCtx.moveTo(x0 + wingLen/2, -wingH/2); gCtx.lineTo(x0 + wingLen/2, wingH/2); gCtx.stroke();
        gCtx.strokeStyle = 'rgba(140,170,230,0.2)'; gCtx.lineWidth = 0.5;
        gCtx.beginPath(); gCtx.moveTo(x0, 0); gCtx.lineTo(x0 + wingLen, 0); gCtx.stroke();
        // Panel outline + specular shine
        gCtx.strokeStyle = 'rgba(220,230,255,0.4)'; gCtx.lineWidth = 0.8;
        gCtx.strokeRect(x0, -wingH/2, wingLen, wingH);
        gCtx.fillStyle = 'rgba(255,255,255,0.08)';
        gCtx.fillRect(x0, -wingH/2, wingLen, wingH*0.3);
      });

      // --- Gold foil body ---
      var bw = R*0.9, bh = R*1.1;
      gCtx.fillStyle = sg.body;
      gCtx.fillRect(-bw/2, -bh/2, bw, bh);
      // Foil crinkle highlights
      gCtx.strokeStyle = 'rgba(255,240,180,0.5)'; gCtx.lineWidth = 0.6;
      gCtx.beginPath(); gCtx.moveTo(-bw*0.3, -bh*0.4); gCtx.lineTo(bw*0.1, -bh*0.1); gCtx.stroke();
      gCtx.beginPath(); gCtx.moveTo(bw*0.25, bh*0.05); gCtx.lineTo(-bw*0.1, bh*0.35); gCtx.stroke();
      gCtx.strokeStyle = 'rgba(90,60,10,0.4)';
      gCtx.beginPath(); gCtx.moveTo(-bw*0.2, bh*0.15); gCtx.lineTo(bw*0.3, bh*0.3); gCtx.stroke();
      // Body outline
      gCtx.strokeStyle = 'rgba(255,255,255,0.25)'; gCtx.lineWidth = 0.8;
      gCtx.strokeRect(-bw/2, -bh/2, bw, bh);

      // --- White dish antenna on top ---
      gCtx.strokeStyle = '#cfd6dd'; gCtx.lineWidth = Math.max(1, R*0.09);
      gCtx.beginPath(); gCtx.moveTo(0, -bh/2); gCtx.lineTo(0, -bh/2 - R*0.35); gCtx.stroke();
      gCtx.beginPath();
      gCtx.ellipse(0, -bh/2 - R*0.55, R*0.42, R*0.26, 0, 0, Math.PI*2);
      gCtx.fillStyle = sg.dish; gCtx.fill();
      gCtx.strokeStyle = 'rgba(120,130,140,0.6)'; gCtx.lineWidth = 0.6; gCtx.stroke();

      gCtx.restore();

      // Shield tint + ring
      var satColor = s.shield > 0 ? '#00B4D8' : '#5EFFB3';
      if (s.shield > 0) { gCtx.beginPath(); gCtx.arc(s.x, s.y, R+8, 0, Math.PI*2); gCtx.strokeStyle='rgba(0,180,216,0.5)'; gCtx.lineWidth=1.5; gCtx.stroke(); }
      // Subtle status glow
      gCtx.shadowColor = satColor; gCtx.shadowBlur = 6;
      gCtx.beginPath(); gCtx.arc(s.x, s.y, 2, 0, Math.PI*2); gCtx.fillStyle = satColor; gCtx.fill();
      gCtx.shadowBlur = 0;
      // Label
      gCtx.font = '9px "JetBrains Mono"'; gCtx.fillStyle = 'rgba(94,255,179,0.5)'; gCtx.textAlign = 'center';
      gCtx.fillText(s.service, s.x, s.y + R + 20);
    });

    // === DEBRIS (asteroids with fiery trails) ===
    gDebris.forEach(function(d) {
      gCtx.save(); gCtx.translate(d.x, d.y);
      // Fiery entry trail
      var trailLen = d.r * 2.5;
      var trailAngle = Math.atan2(d.vy || 0, d.vx || 0);
      gCtx.rotate(trailAngle + Math.PI);
      var tg = gCtx.createLinearGradient(0, 0, trailLen, 0);
      tg.addColorStop(0, 'rgba(255,160,50,0.6)');
      tg.addColorStop(0.4, 'rgba(255,80,30,0.3)');
      tg.addColorStop(1, 'rgba(255,50,20,0)');
      gCtx.fillStyle = tg;
      gCtx.beginPath();
      gCtx.moveTo(0, -d.r*0.3);
      gCtx.lineTo(trailLen, 0);
      gCtx.lineTo(0, d.r*0.3);
      gCtx.closePath(); gCtx.fill();
      gCtx.setTransform(1,0,0,1,0,0);
      gCtx.translate(d.x, d.y); gCtx.rotate(d.rot);
      // Rocky body — irregular polygon
      gCtx.beginPath();
      var pts = d.pts || 8;
      for (var i = 0; i < pts; i++) {
        var angle = (i / pts) * Math.PI * 2;
        var jitter = d.jitters ? d.jitters[i] : (0.7 + Math.sin(i*3.7)*0.3);
        var radius = d.r * jitter;
        if (i === 0) gCtx.moveTo(Math.cos(angle)*radius, Math.sin(angle)*radius);
        else gCtx.lineTo(Math.cos(angle)*radius, Math.sin(angle)*radius);
      }
      gCtx.closePath();
      // Gradient fill - dark rocky
      var dg = gCtx.createRadialGradient(-d.r*0.2, -d.r*0.2, 0, 0, 0, d.r);
      dg.addColorStop(0, '#8B5E3C'); dg.addColorStop(0.5, '#5C3A1E'); dg.addColorStop(1, '#2A1A0E');
      gCtx.fillStyle = dg; gCtx.fill();
      gCtx.strokeStyle = 'rgba(180,120,80,0.5)'; gCtx.lineWidth = 0.8; gCtx.stroke();
      // Crater details
      gCtx.beginPath(); gCtx.arc(d.r*0.25, -d.r*0.15, d.r*0.2, 0, Math.PI*2);
      gCtx.fillStyle = 'rgba(0,0,0,0.25)'; gCtx.fill();
      gCtx.beginPath(); gCtx.arc(-d.r*0.2, d.r*0.2, d.r*0.15, 0, Math.PI*2);
      gCtx.fillStyle = 'rgba(0,0,0,0.2)'; gCtx.fill();
      gCtx.restore();
    });

    // === PLAYER SHIELD (cursor) — works everywhere ===
    if (gState === 'playing') {
      gCtx.beginPath(); gCtx.arc(gMouseX, gMouseY, shieldRadius, 0, Math.PI*2);
      gCtx.strokeStyle = 'rgba(94,255,179,0.45)'; gCtx.lineWidth = 2.5; gCtx.stroke();
      gCtx.fillStyle = 'rgba(94,255,179,0.03)'; gCtx.fill();
      var pulse = 0.5 + 0.5*Math.sin(performance.now()*0.005);
      gCtx.beginPath(); gCtx.arc(gMouseX, gMouseY, shieldRadius*0.6+pulse*shieldRadius*0.2, 0, Math.PI*2);
      gCtx.strokeStyle = 'rgba(94,255,179,'+(0.2+pulse*0.2)+')'; gCtx.lineWidth = 1.5; gCtx.stroke();
    }

    // === SHIELD BUBBLE (Endless) ===
    if (gShieldBubble) {
      var bpulse = 0.5 + 0.5*Math.sin(performance.now()*0.004);
      gCtx.beginPath(); gCtx.arc(gShieldBubble.x, gShieldBubble.y, 18+bpulse*5, 0, Math.PI*2);
      gCtx.fillStyle = 'rgba(0,180,216,0.15)'; gCtx.fill();
      gCtx.strokeStyle = 'rgba(0,180,216,0.7)'; gCtx.lineWidth = 2; gCtx.stroke();
      gCtx.font = '14px sans-serif'; gCtx.fillStyle = '#00B4D8'; gCtx.textAlign = 'center';
      gCtx.fillText('🛡️', gShieldBubble.x, gShieldBubble.y + 5);
    }

    // === PARTICLES ===
    gParticles.forEach(function(p) { gCtx.globalAlpha=p.a; gCtx.beginPath(); gCtx.arc(p.x,p.y,2.5,0,Math.PI*2); gCtx.fillStyle=p.color||'#fff'; gCtx.fill(); gCtx.globalAlpha=1; });

    // === IMPACT MESSAGE (satellite destroyed) ===
    if (gImpactTimer > 0) {
      gImpactTimer--;
      var alpha = Math.min(1, gImpactTimer / 30);
      gCtx.save();
      gCtx.globalAlpha = alpha;
      gCtx.font = 'bold 11px JetBrains Mono, monospace';
      gCtx.fillStyle = '#FF5A36';
      gCtx.textAlign = 'right';
      gCtx.fillText(gImpactMsg, w - 12, 20);
      gCtx.restore();
    }
  }

  function updateGuardianHUD() {
    var diff = gMode === 'endless' ? DIFFICULTY.commander : DIFFICULTY[gDifficulty];
    var se = document.getElementById('gh-score'), te = document.getElementById('gh-time');
    var sa = document.getElementById('gh-sats'), ea = document.getElementById('gh-earth');
    if (se) se.textContent = gDebrisKills;
    if (te) {
      if (gMode === 'endless') { te.textContent = Math.floor(gSurvivalTime) + 's'; te.classList.remove('alert'); }
      else { var t = Math.max(0, Math.floor(gTimeLeft)); te.textContent = t; te.classList.toggle('alert', t<10); }
    }
    if (sa) { var alive = gSats.filter(function(s){return s.alive;}).length; sa.textContent = alive; sa.classList.toggle('alert', alive<=2); }
    if (ea) { ea.textContent = gEarthShield; ea.classList.toggle('alert', gEarthShield <= 1); ea.parentElement.style.display = gMode === 'endless' ? '' : 'none'; }
  }

  function endGuardian(earthDestroyed) {
    gState = 'over'; if (gAnimFrame) cancelAnimationFrame(gAnimFrame);
    document.body.classList.remove('game-active');
    var hud = document.getElementById('g-hud');
    if (hud) hud.classList.add('hidden');
    var diff = gMode === 'endless' ? DIFFICULTY.commander : DIFFICULTY[gDifficulty];
    var alive = gSats.filter(function(s){return s.alive;}).length;
    var killPoints = gMode === 'endless' ? 10 : diff.killPoints;
    var satBonusPts = gMode === 'endless' ? 50 : diff.satBonus;
    var debrisPoints = gDebrisKills * killPoints;
    var satBonus = alive * satBonusPts;
    var earthBonus = earthDestroyed ? 0 : 100;
    var shieldBonus = gEarthShield * 20;
    var survivalBonus = gMode === 'endless' ? Math.floor(gSurvivalTime) : 0;
    var final = debrisPoints + satBonus + earthBonus + shieldBonus + survivalBonus;

    saveToLeaderboard(gAlias, final, alive, gMode, Math.floor(gSurvivalTime));

    document.getElementById('g-end-title').textContent = earthDestroyed ? '💥 EARTH DESTROYED' : alive === 5 ? '🎉 PERFECT DEFENSE' : 'MISSION COMPLETE';
    document.getElementById('g-end-score').textContent = final;
    document.getElementById('g-end-diff').textContent = (gMode === 'endless' ? 'ENDLESS' : DIFFICULTY[gDifficulty].label) + (gMode === 'endless' ? ' · Survived ' + Math.floor(gSurvivalTime) + 's' : ' · 30 SEC');

    var bk = document.getElementById('g-end-breakdown');
    var html = '<div>Debris destroyed: ' + gDebrisKills + ' × ' + killPoints + ' = <span style="color:var(--white)">+' + debrisPoints + '</span></div>';
    html += '<div>Satellites saved: ' + alive + ' × ' + satBonusPts + ' = <span style="color:var(--white)">+' + satBonus + '</span></div>';
    if (!earthDestroyed) html += '<div>Earth survived: <span style="color:var(--white)">+' + earthBonus + '</span></div>';
    html += '<div>Shields remaining: ' + gEarthShield + ' × 20 = <span style="color:var(--white)">+' + shieldBonus + '</span></div>';
    if (gMode === 'endless') html += '<div>Survived: ' + Math.floor(gSurvivalTime) + 's = <span style="color:var(--white)">+' + survivalBonus + '</span></div>';
    bk.innerHTML = html;

    var satsEl = document.getElementById('g-end-sats');
    satsEl.innerHTML = gSats.map(function(s) {
      if (s.alive) return '<span style="font-family:JetBrains Mono,monospace;font-size:10px;padding:4px 10px;border:1px solid rgba(94,255,179,0.4);color:var(--phosphor);border-radius:2px;">✓ ' + s.service + '</span>';
      return '<span style="font-family:JetBrains Mono,monospace;font-size:10px;padding:4px 10px;border:1px solid rgba(255,90,54,0.3);color:var(--alert);border-radius:2px;opacity:0.7;">✗ ' + s.service + '</span>';
    }).join('');

    document.getElementById('g-end').classList.remove('hidden');

    // Ending statement based on outcome
    var stmt = document.getElementById('g-end-statement');
    if (stmt) {
      if (earthDestroyed) stmt.textContent = 'Without its shield, Earth fell. 8 billion lives — GPS, weather, internet, time itself — gone in an instant. This is why the invisible layer matters.';
      else if (alive === 5) stmt.textContent = 'Perfect defense. Every satellite survived. 8 billion people will never know how close they came — but you do. You are the invisible layer.';
      else if (alive >= 3) stmt.textContent = 'Earth endures, but the network is fractured. ' + (5-alive) + ' satellite' + (alive<4?'s':'') + ' lost means millions without navigation, weather warnings, or communication. The invisible layer grows thinner.';
      else stmt.textContent = 'Earth survived — barely. With only ' + alive + ' satellite' + (alive>1?'s':'') + ' remaining, humanity limps forward: no GPS, limited comms, fractured forecasts. Rebuilding will take decades.';
    }

    document.getElementById('lb-entries').innerHTML = renderLeaderboard(gMode);
    panel.querySelectorAll('.lb-tab').forEach(function(btn) { btn.classList.toggle('active', btn.dataset.lb === gMode); });
    var lb = document.getElementById('guardian-leaderboard');
    if (lb) lb.style.display = 'block';

    // Easter egg 5: score 1000+ points
    if (final >= 1000) Utils.easterEggs.reveal('debris');
  }

  function init() {
    buildHTML();
    initPicker();
    initGuardian();
    panel.querySelectorAll('.lb-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        panel.querySelectorAll('.lb-tab').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('lb-entries').innerHTML = renderLeaderboard(btn.dataset.lb);
      });
    });
  }

  window.addEventListener('tab-init', function(e) {
    if (e.detail.tab === 'games') init();
  });
})();
