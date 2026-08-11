// Tab 1: RIGHT NOW — Live Satellite Radar (Enhanced)
(function() {
  const panel = document.getElementById('panel-hero');

  const SAT_DATA = {
    total: 18560,
    categories: [
      { id: 'comms', name: 'Communications', count: 6172, color: 'var(--sky)', examples: ['Starlink-5291', 'OneWeb-0421', 'Iridium 163', 'SES-17', 'Intelsat 40e', 'Viasat-3'] },
      { id: 'nav', name: 'Navigation', count: 137, color: 'var(--gold)', examples: ['GPS IIF-12', 'GLONASS-M 761', 'Galileo 27', 'BeiDou-3 M23', 'NavIC-1G'] },
      { id: 'weather', name: 'Weather & Climate', count: 94, color: 'var(--phosphor)', examples: ['GOES-18', 'Meteosat-12', 'Himawari-9', 'FY-4B', 'JPSS-2'] },
      { id: 'earthobs', name: 'Earth Observation', count: 1205, color: '#A78BFA', examples: ['Landsat 9', 'Sentinel-2B', 'WorldView-4', 'Planet Dove', 'RADARSAT-C'] },
      { id: 'science', name: 'Space Science', count: 192, color: 'var(--alert)', examples: ['Hubble', 'James Webb', 'TESS', 'SWIFT', 'Chandra'] },
      { id: 'other', name: 'Military & Other', count: 2552, color: '#F472B6', examples: ['ISS (Zarya)', 'USA-326', 'Yaogan-39', 'Cosmos 2562', 'NROL-85'] }
    ]
  };

  let blipElements = [];
  let blipData = [];
  let liveCounter = SAT_DATA.total;
  let liveCounterInterval = null;
  let pingInterval = null;
  let overheadInterval = null;
  let overheadCount = 0;

  function generateBlips() {
    const blips = [];
    // Country color mapping
    const COUNTRY_COLORS = {
      'USA': '#4da6ff',      // bright blue
      'EU': '#ffcc00',       // vivid gold
      'Russia': '#ff4d4d',   // bright red
      'China': '#ff8c1a',    // vivid orange
      'Japan': '#ff69b4',    // hot pink
      'India': '#00e68a',    // bright green
      'Intl': '#b366ff',     // vivid purple
      'Private': '#00e5ff'   // vivid cyan
    };
    const CATEGORY_COLORS = {
      'comms': '#00e5ff',
      'nav': '#ffd700',
      'weather': '#00ff7f',
      'earthobs': '#c77dff',
      'science': '#ff6b9d',
      'other': '#e0e0e0'
    };
    // Map satellite names to countries
    var SAT_COUNTRIES = {
      'Starlink-5291':'Private','OneWeb-0421':'Private','Iridium 163':'USA','SES-17':'EU','Intelsat 40e':'USA','Viasat-3':'USA',
      'GPS IIF-12':'USA','GLONASS-M 761':'Russia','Galileo 27':'EU','BeiDou-3 M23':'China','NavIC-1G':'India',
      'GOES-18':'USA','Meteosat-12':'EU','Himawari-9':'Japan','FY-4B':'China','JPSS-2':'USA',
      'Landsat 9':'USA','Sentinel-2B':'EU','WorldView-4':'USA','Planet Dove':'USA','RADARSAT-C':'Intl',
      'Hubble':'USA','James Webb':'Intl','TESS':'USA','SWIFT':'USA','Chandra':'USA',
      'ISS (Zarya)':'Intl','USA-326':'USA','Yaogan-39':'China','Cosmos 2562':'Russia','NROL-85':'USA'
    };
    SAT_DATA.categories.forEach(cat => {
      const count = Math.max(3, Math.min(12, Math.round(cat.count / SAT_DATA.total * 40)));
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = 12 + Math.random() * 34;
        const satName = cat.examples[i % cat.examples.length];
        const country = SAT_COUNTRIES[satName] || 'Intl';
        blips.push({
          name: satName,
          category: cat.id,
          categoryName: cat.name,
          country: country,
          color: COUNTRY_COLORS[country] || '#9BA5B4',
          catColor: CATEGORY_COLORS[cat.id] || '#9BA5B4',
          top: 50 + radius * Math.sin(angle),
          left: 50 + radius * Math.cos(angle),
          altitude: Math.round(200 + Math.random() * 35600),
          velocity: Math.round(3 + Math.random() * 25) * 1000,
          angle: angle
        });
      }
    });
    return blips;
  }

  function buildHTML() {
    panel.innerHTML = `
      <div class="radar-hero">
        <canvas id="starfield" aria-hidden="true"></canvas>

        <!-- Nebula backgrounds -->
        <div class="nebula nebula-1"></div>
        <div class="nebula nebula-2"></div>
        <div class="nebula nebula-3"></div>

        <!-- Dust particles container -->
        <div id="dust-container" aria-hidden="true"></div>

        <!-- Provocative question overlay -->
        <div class="hero-question" id="hero-question">
          <div class="hero-question-text" id="hero-q-text">
            How many things above you right now<br>are <span class="q-highlight">keeping you alive</span>?
          </div>
        </div>

        <div class="hud-corner hud-tl">
          <div id="hud-clock">UTC --:--:--</div>
          <div>ORBITAL TRACKING</div>
        </div>
        <div class="hud-corner hud-tr">
          <div><span class="num" id="radar-num" style="color:var(--phosphor);font-weight:800">0</span> OVERHEAD</div>
          <div>LOW EARTH TO GEO</div>
        </div>

        <div class="radar-stage">
          <div class="scope" id="scope">
            <div class="ring r1"></div>
            <div class="ring r2"></div>
            <div class="ring r3"></div>
            <div class="ring r4"></div>
            <div class="crosshair h"></div>
            <div class="crosshair v"></div>
            <div class="sweep"></div>
            <div class="earth-wrap"><div class="earth"></div></div>
            <div class="earth-label">EARTH</div>
            <div id="signal-layer"></div>
            <div id="blip-layer"></div>
            <div class="lock-panel" id="lock-panel">
              <div class="lock-label">SELECTED SATELLITE</div>
              <div class="lock-name" id="lock-name">—</div>
              <div class="lock-grid">
                <div><span>CATEGORY</span><b id="lock-cat">—</b></div>
                <div><span>ALTITUDE</span><b id="lock-alt">—</b></div>
                <div><span>VELOCITY</span><b id="lock-vel">—</b></div>
                <div><span>STATUS</span><b id="lock-status">ACTIVE</b></div>
                <div><span>LAUNCHED</span><b id="lock-year">—</b></div>
                <div><span>SERVES</span><b id="lock-serves">—</b></div>
              </div>
              <div class="lock-impact" id="lock-impact" style="margin-top:8px;font-size:12px;color:var(--phosphor);line-height:1.5;border-top:1px solid rgba(94,255,179,0.15);padding-top:8px;">—</div>
            </div>
          </div>
        </div>

        <div class="radar-text" id="radar-text">
          <div class="eyebrow" id="radar-eyebrow" style="opacity:0">Live orbital tracking</div>
          <h1 id="radar-title"></h1>
          <div class="radar-counter" style="display:none" id="radar-counter-wrap"></div>
          <p class="radar-sub" style="opacity:0" id="radar-sub-text">Every dot is a satellite you depend on — for weather, navigation, communication, or observation. They're always there. You just never look up.</p>
          <p class="radar-hint" style="opacity:0" id="radar-hint">TAP A SATELLITE TO IDENTIFY</p>
        </div>

        <div class="legend-wrap" id="cat-legend">
          <div class="legend-toggle-wrap" id="legend-toggle"><button class="legend-seg active" data-mode="country">COUNTRY</button><button class="legend-seg" data-mode="category">FUNCTION</button></div>
          <div class="cat-legend" id="legend-country">
            <div class="cat-legend-item"><div class="cat-dot" style="background:#4da6ff"></div>USA</div>
            <div class="cat-legend-item"><div class="cat-dot" style="background:#ffcc00"></div>EU</div>
            <div class="cat-legend-item"><div class="cat-dot" style="background:#ff4d4d"></div>RUSSIA</div>
            <div class="cat-legend-item"><div class="cat-dot" style="background:#ff8c1a"></div>CHINA</div>
            <div class="cat-legend-item"><div class="cat-dot" style="background:#00e5ff"></div>PRIVATE</div>
            <div class="cat-legend-item"><div class="cat-dot" style="background:#b366ff"></div>INT'L</div>
          </div>
          <div class="cat-legend legend-hidden" id="legend-category">
            <div class="cat-legend-item"><div class="cat-dot" style="background:#00e5ff"></div>COMMS</div>
            <div class="cat-legend-item"><div class="cat-dot" style="background:#ffd700"></div>NAV</div>
            <div class="cat-legend-item"><div class="cat-dot" style="background:#00ff7f"></div>WEATHER</div>
            <div class="cat-legend-item"><div class="cat-dot" style="background:#c77dff"></div>EARTH OBS</div>
            <div class="cat-legend-item"><div class="cat-dot" style="background:#ff6b9d"></div>SCIENCE</div>
            <div class="cat-legend-item"><div class="cat-dot" style="background:#e0e0e0"></div>OTHER</div>
          </div>
        </div>
      </div>

      <div id="hero-next-holder" style="text-align:center;margin-top:60px;"></div>
    `;
  }

  // === ENHANCEMENT: Provocative question sequence ===
  function playQuestionSequence(callback) {
    const overlay = document.getElementById('hero-question');
    const text = document.getElementById('hero-q-text');
    
    setTimeout(() => { text.classList.add('visible'); }, 300);
    setTimeout(() => {
      overlay.classList.add('hidden');
      callback();
    }, 3200);
  }

  // === ENHANCEMENT: Typewriter title ===
  function typewriterTitle(callback) {
    const titleEl = document.getElementById('radar-title');
    const parts = [
      { text: 'THE INVISIBLE', accent: false },
      { text: ' LAYER', accent: true }
    ];
    let partIdx = 0;
    let charIdx = 0;
    titleEl.innerHTML = '<span class="typewriter-cursor"></span>';
    titleEl.classList.add('typed');

    // Create spans for each part
    let currentSpan = null;

    function typeChar() {
      if (partIdx >= parts.length) {
        // Done - remove cursor
        setTimeout(() => {
          const c = titleEl.querySelector('.typewriter-cursor');
          if (c) c.remove();
          callback();
        }, 400);
        return;
      }

      var part = parts[partIdx];

      // Create span for this part if needed
      if (charIdx === 0) {
        currentSpan = document.createElement('span');
        if (part.accent) currentSpan.className = 'accent';
        const cursor = titleEl.querySelector('.typewriter-cursor');
        cursor.parentNode.insertBefore(currentSpan, cursor);
      }

      if (charIdx < part.text.length) {
        currentSpan.textContent += part.text[charIdx];
        charIdx++;
        setTimeout(typeChar, 55 + Math.random() * 35);
      } else {
        // Move to next part
        partIdx++;
        charIdx = 0;
        setTimeout(typeChar, 55 + Math.random() * 35);
      }
    }
    typeChar();
  }

  // === ENHANCEMENT: Reveal remaining elements ===
  function revealHeroElements() {
    const els = ['#radar-eyebrow', '#radar-counter-wrap', '#radar-sub-text', '#radar-hint'];
    els.forEach((sel, i) => {
      setTimeout(() => {
        const el = panel.querySelector(sel);
        if (el) { el.style.transition = 'opacity 0.6s ease'; el.style.opacity = '1'; }
      }, i * 200);
    });

    // Start the live counter — delay jitter until countUp animation finishes
    setTimeout(() => {
      const numEl = document.getElementById('radar-num');
      if (numEl) Utils.countUp(numEl, SAT_DATA.total, { duration: 1800 });
      // Wait for countUp to finish before starting the random jitter
      setTimeout(() => startLiveCounter(), 2000);
    }, 300);
  }

  // === ENHANCEMENT: Fly-in blips ===
  function renderBlipsFlyIn() {
    const layer = document.getElementById('blip-layer');
    if (!layer) return;

    blipData = generateBlips();
    blipElements = [];

    blipData.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = `sat-blip flying-in`;
      el.style.top = b.top + '%';
      el.style.left = b.left + '%';
      el.style.animationDelay = (i * 0.09) + 's';
      el.style.background = b.color;
      el.style.boxShadow = '0 0 5px 1px ' + b.color + '80';
      
      // Fly outward from Earth center (50%, 50%) to final position
      const fromX = (50 - b.left) + '%';
      const fromY = (50 - b.top) + '%';
      el.style.setProperty('--from-x', fromX);
      el.style.setProperty('--from-y', fromY);
      
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Satellite: ${b.name}, Country: ${b.country}, Category: ${b.categoryName}`);

      // Hover tooltip
      el.innerHTML = `<span class="blip-tooltip">${b.name}</span>`;

      el.addEventListener('click', () => lockSatellite(b, el));
      el.addEventListener('animationend', () => el.classList.remove('flying-in'), { once: true });
      layer.appendChild(el);
      blipElements.push(el);
    });
  }

  // === ENHANCEMENT: Signal connection lines ===
  function createSignalLines() {
    const signalLayer = document.getElementById('signal-layer');
    if (!signalLayer) return;

    // Pick 5 random blips to have signal lines to earth center
    const candidates = blipData.filter(b => b.category === 'comms' || b.category === 'nav' || b.category === 'weather');
    const selected = candidates.sort(() => Math.random() - 0.5).slice(0, 5);

    selected.forEach((b, i) => {
      const line = document.createElement('div');
      line.className = 'signal-line active';
      
      // Calculate angle and length from blip to center
      const dx = b.left - 50;
      const dy = b.top - 50;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

      const colors = { comms: 'var(--sky)', nav: 'var(--gold)', weather: 'var(--phosphor)' };
      line.style.color = colors[b.category] || 'var(--phosphor)';
      line.style.height = length + '%';
      line.style.top = '50%';
      line.style.left = '50%';
      line.style.transform = `rotate(${angle}deg)`;
      line.style.transformOrigin = 'top center';
      line.style.animationDelay = (i * 0.5) + 's';

      // Add flowing data dot
      const dot = document.createElement('div');
      dot.className = 'signal-dot';
      dot.style.animationDelay = (i * 0.4) + 's';
      line.appendChild(dot);

      signalLayer.appendChild(line);
    });
  }

  // === ENHANCEMENT: Live counter ===
  function startLiveCounter() {
    const numEl = document.getElementById('radar-num');
    if (!numEl) return;

    liveCounterInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        liveCounter += Math.random() < 0.7 ? 1 : -1;
        numEl.textContent = liveCounter.toLocaleString();
        numEl.classList.add('counter-flicker');
        setTimeout(() => numEl.classList.remove('counter-flicker'), 150);
      }
    }, 3000);

    // Satellites overhead counter (~1 every 5.5 seconds based on LEO density)
    // Only start once — never restart
    if (!overheadInterval) {
      overheadInterval = setInterval(function() {
        overheadCount += Math.random() < 0.7 ? 1 : 2;
        Utils.overheadCount = overheadCount;
      }, 5500);
    }
  }

  // === ENHANCEMENT: Dust particles ===
  function createDustParticles() {
    const container = document.getElementById('dust-container');
    if (!container) return;

    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'dust-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.setProperty('--dx', (Math.random() - 0.5) * 100 + 'px');
      p.style.setProperty('--dy', (Math.random() - 0.5) * 100 + 'px');
      p.style.animationDuration = (8 + Math.random() * 12) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.width = (1 + Math.random() * 2) + 'px';
      p.style.height = p.style.width;
      container.appendChild(p);
    }
  }

  // === ENHANCEMENT: Periodic ping on random blip ===
  function startPingEffect() {
    pingInterval = setInterval(() => {
      if (!blipElements.length) return;
      const randomBlip = blipElements[Math.floor(Math.random() * blipElements.length)];
      if (randomBlip && !randomBlip.classList.contains('locked')) {
        randomBlip.classList.add('ping');
        setTimeout(() => randomBlip.classList.remove('ping'), 1000);
      }
    }, 4000);
  }

  // Category-level impact lines
  var CATEGORY_IMPACT = {
    comms: 'Carrying 40% of global internet backbone traffic right now',
    nav: 'Guiding 4.2 billion smartphone GPS fixes per day',
    weather: 'Scanning your hemisphere every 10 minutes for storm warnings',
    earthobs: 'Monitoring crop health, deforestation, and sea level in real-time',
    science: 'Mapping the universe — discovering exoplanets and dark matter',
    other: 'Timing financial transactions and synchronizing power grids'
  };
  var CATEGORY_SERVES = {
    comms: '4.5B people', nav: '4.2B devices', weather: '8B (global)',
    earthobs: '195 nations', science: 'All humanity', other: '3.8B people'
  };
  // Per-satellite specific facts and launch years
  var SAT_FACTS = {
    'Starlink-5291': { year: 2024, fact: 'One of 6,000+ forming history\'s largest constellation' },
    'OneWeb-0421': { year: 2023, fact: 'Beaming broadband to Arctic ships and remote villages' },
    'Iridium 163': { year: 2019, fact: 'Part of a 66-satellite mesh covering every inch of Earth' },
    'SES-17': { year: 2021, fact: 'Single satellite serving in-flight WiFi for 2,000+ aircraft' },
    'Intelsat 40e': { year: 2023, fact: 'Relaying live TV to 200+ countries simultaneously' },
    'Viasat-3': { year: 2024, fact: 'Most powerful comms satellite ever — 1 Tbps capacity' },
    'GPS IIF-12': { year: 2014, fact: 'Accurate to 30cm — enough to land a drone on a dinner plate' },
    'GLONASS-M 761': { year: 2020, fact: 'Russia\'s answer to GPS — ensures no single nation controls positioning' },
    'Galileo 27': { year: 2021, fact: 'Europe\'s independent navigation — centimeter accuracy by 2025' },
    'BeiDou-3 M23': { year: 2020, fact: 'China\'s GPS alternative — 400M users in Asia-Pacific' },
    'NavIC-1G': { year: 2018, fact: 'India\'s regional system — free positioning for 1.4B people' },
    'GOES-18': { year: 2022, fact: 'Photographs 16 million km² in 30 seconds, every 10 min' },
    'Meteosat-12': { year: 2022, fact: 'Europe\'s weather eye — 50 years of continuous coverage' },
    'Himawari-9': { year: 2016, fact: 'Watches typhoons form in real-time for 2B people in Asia-Pacific' },
    'FY-4B': { year: 2021, fact: 'China\'s latest — predicts dust storms 72 hours ahead' },
    'JPSS-2': { year: 2022, fact: '7-day weather forecasts would be 3-day without this satellite' },
    'Landsat 9': { year: 2021, fact: '50 years of Earth imagery — the longest space-based record' },
    'Sentinel-2B': { year: 2017, fact: 'Maps every farm on Earth every 5 days for food security' },
    'WorldView-4': { year: 2016, fact: 'Can read a newspaper headline from orbit (31cm resolution)' },
    'Planet Dove': { year: 2023, fact: 'Part of 200+ tiny satellites imaging all of Earth daily' },
    'RADARSAT-C': { year: 2022, fact: 'Sees through clouds and darkness — critical for Arctic monitoring' },
    'Hubble': { year: 1990, fact: '34 years old, 1.5M+ observations — changed our view of the universe' },
    'James Webb': { year: 2021, fact: 'Seeing light from 13.5 billion years ago — the edge of time' },
    'TESS': { year: 2018, fact: 'Found 400+ exoplanets — potential homes beyond Earth' },
    'SWIFT': { year: 2004, fact: 'Detects gamma-ray bursts — the most violent events in the cosmos' },
    'Chandra': { year: 1999, fact: '25 years old, sees X-rays from black holes and supernovas' },
    'ISS (Zarya)': { year: 1998, fact: '6 humans living 408km above you right now' },
    'USA-326': { year: 2022, fact: 'Classified NRO satellite — capabilities unknown to the public' },
    'Yaogan-39': { year: 2023, fact: 'Part of China\'s intelligence constellation — orbital surveillance' },
    'Cosmos 2562': { year: 2022, fact: 'Russian early warning satellite — watching for missile launches' },
    'NROL-85': { year: 2022, fact: 'First reused rocket for US spy satellite — new era of classified launches' }
  };
  var CATEGORY_YEARS = { comms: 2022, nav: 2018, weather: 2020, earthobs: 2020, science: 2005, other: 2021 };

  function lockSatellite(sat, el) {
    // If clicking the same satellite again, close the panel
    if (el.classList.contains('locked')) {
      el.classList.remove('locked');
      document.getElementById('lock-panel').classList.remove('visible');
      return;
    }
    document.querySelectorAll('.sat-blip.locked').forEach(b => b.classList.remove('locked'));
    el.classList.add('locked');

    var facts = SAT_FACTS[sat.name];
    var year = facts ? facts.year : CATEGORY_YEARS[sat.category] || '—';
    var fact = facts ? facts.fact : CATEGORY_IMPACT[sat.category] || '';
    var serves = CATEGORY_SERVES[sat.category] || '—';

    document.getElementById('lock-name').textContent = sat.name;
    document.getElementById('lock-cat').textContent = sat.country + ' · ' + sat.categoryName;
    document.getElementById('lock-alt').textContent = sat.altitude.toLocaleString() + ' km';
    document.getElementById('lock-vel').textContent = sat.velocity.toLocaleString() + ' km/h';
    document.getElementById('lock-year').textContent = year;
    document.getElementById('lock-serves').textContent = serves;
    document.getElementById('lock-impact').textContent = '→ ' + fact;
    document.getElementById('lock-panel').classList.add('visible');
  }

  // Stats removed — dependency data now lives in Tab 3

  function initTilt() {
    const hero = panel.querySelector('.radar-hero');
    const scope = document.getElementById('scope');
    if (!hero || !scope) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      scope.style.transform = `rotateX(${cy * -5}deg) rotateY(${cx * 5}deg)`;
    });

    hero.addEventListener('mouseleave', () => {
      scope.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }

  // === Main init with full cinematic sequence ===
  function initRadar() {
    buildHTML();

    // Starfield
    const canvas = document.getElementById('starfield');
    const hero = panel.querySelector('.radar-hero');
    if (canvas && hero) Utils.initStarfield(canvas, hero);

    // Clock
    const clockEl = document.getElementById('hud-clock');
    if (clockEl) Utils.startClock(clockEl);

    // Dust particles
    createDustParticles();

    // Tilt
    initTilt();

    // Stats (below fold)


    // Guided flow button
    var nextHolder = document.getElementById('hero-next-holder');
    if (nextHolder) nextHolder.appendChild(Utils.createNextButton('See how they touch your life →', 'day'));

    // === Cinematic sequence ===
    // 1. Show provocative question
    playQuestionSequence(() => {
      // 2. Typewriter title
      typewriterTitle(() => {
        // 3. Reveal other hero elements
        revealHeroElements();
        // 4. Fly in blips
        renderBlipsFlyIn();
        // 5. After blips arrive, add signal lines
        setTimeout(() => {
          createSignalLines();
          startPingEffect();
        }, blipData.length * 80 + 500);
      });
    });
  }

  window.addEventListener('tab-init', (e) => {
    if (e.detail.tab === 'hero') {
      initRadar();
      // Easter egg 1: click the Earth in the radar
      var earthEl = panel.querySelector('.earth-wrap');
      if (earthEl) {
        earthEl.style.cursor = 'pointer';
        earthEl.addEventListener('click', function(e) {
          e.stopPropagation();
          Utils.easterEggs.reveal('earth');
        });
      }

      // Legend toggle: segmented control country ↔ category
      var legendMode = 'country';
      var toggleWrap = document.getElementById('legend-toggle');
      if (toggleWrap) {
        toggleWrap.querySelectorAll('.legend-seg').forEach(function(seg) {
          seg.addEventListener('click', function() {
            legendMode = seg.dataset.mode;
            toggleWrap.querySelectorAll('.legend-seg').forEach(function(s) { s.classList.toggle('active', s.dataset.mode === legendMode); });
            document.getElementById('legend-country').classList.toggle('legend-hidden', legendMode !== 'country');
            document.getElementById('legend-category').classList.toggle('legend-hidden', legendMode !== 'category');
            var blips = document.querySelectorAll('.sat-blip');
            blips.forEach(function(el, i) {
              if (blipData[i]) {
                var c = legendMode === 'country' ? blipData[i].color : blipData[i].catColor;
                el.style.background = c;
                el.style.boxShadow = '0 0 5px 1px ' + c + '80';
              }
            });
          });
        });
      }
    }
  });

  // Pause the two background intervals whenever the user leaves this tab —
  // they were running forever in the background otherwise, competing for
  // the main thread with every other tab (including the game).
  window.addEventListener('tab-switch', (e) => {
    if (e.detail.tab === 'hero') {
      if (!liveCounterInterval) startLiveCounter();
      if (!pingInterval && blipElements.length) startPingEffect();
    } else {
      if (liveCounterInterval) { clearInterval(liveCounterInterval); liveCounterInterval = null; }
      if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }
    }
  });
})();
