// === TAB 3: THE SCALE — Cascade + Live Ticker + Vulnerability ===
(function() {
  var panel = document.getElementById('panel-bridge');

  // === DATA (all sourced — citations in each object) ===

  // Economic: daily satellite-dependent economic activity by sector
  // Economic data — satellite-dependent activity by sector
  // All figures represent economic activity that depends on satellite infrastructure
  var SECTORS = [
    { name: 'Financial Markets', val: '$6.5T', label: 'in daily trades timed by GPS clocks', icon: '💰', color: '#ffcc00', source: 'RTI International, 2019/2025; NYSE/DTCC volume data' },
    { name: 'Transport & Logistics', val: '$4.2T', label: 'in goods tracked by satellite daily', icon: '🚛', color: '#00e5ff', source: 'European GNSS Agency Market Report, 2022' },
    { name: 'Defense & Security', val: '$2.1T', label: 'in daily defense ops via satellite comms', icon: '🛡️', color: '#ff4d4d', source: 'DoD Space Budget Reports, 2023' },
    { name: 'Telecommunications', val: '£1.42B', label: 'lost per day of GNSS outage (UK alone)', icon: '📡', color: '#b366ff', source: 'London Economics / UK Space Agency, 2023' },
    { name: 'Agriculture', val: '$660B', label: '/year in GPS-guided farming worldwide', icon: '🌾', color: '#00ff88', source: 'USDA ERS, 2022; EUSPA Market Report' },
    { name: 'Weather Forecasting', val: '$125B', label: '/year in forecast benefits (US households)', icon: '🌪️', color: '#ff8c1a', source: 'NOAA NESDIS, 2026' }
  ];
  // Ticker: based on $6.5T financial markets alone = ~$75M/sec flowing through GPS-timed systems
  var PER_SECOND = 75000000;

  // Ownership: UCS Satellite Database Jan 2024
  // Ownership: SatFleetLive (March 2026) · Wikipedia Starlink (June 2026) + UCS Satellite Database estimates
  var OWNERS = [
    { name: 'SpaceX', count: 10917, pct: 54, color: '#00e5ff' },
    { name: 'China', count: 1000, pct: 5.4, color: '#ff8c1a' },
    { name: 'UK (OneWeb)', count: 700, pct: 3.8, color: '#ffcc00' },
    { name: 'US (Gov)', count: 600, pct: 3.2, color: '#4da6ff' },
    { name: 'Russia', count: 220, pct: 1.2, color: '#ff4d4d' },
    { name: 'Others', count: 5124, pct: 27.4, color: '#9BA5B4' }
  ];

  // Timeline: active satellite count by year (UCS + CelesTrak)
  // Timeline: total active satellites by year (Orbital Radar, SatFleetLive, UCS)
  var TIMELINE = [
    { year: 1957, count: 1 }, { year: 1970, count: 100 },
    { year: 1990, count: 400 }, { year: 2000, count: 800 },
    { year: 2010, count: 1100 }, { year: 2016, count: 1400 },
    { year: 2019, count: 2200 }, { year: 2020, count: 3300 },
    { year: 2022, count: 5500 }, { year: 2023, count: 8000 },
    { year: 2024, count: 10400 }, { year: 2026, count: 18560 }
  ];

  // Vulnerability: critical infrastructure GNSS dependency without backup
  var VULNERABILITY = [
    { system: 'Cell network timing', noPlan: 95, source: 'DHS CISA, 2021' },
    { system: 'Precision agriculture', noPlan: 100, source: 'USDA ERS, 2022' },
    { system: 'Financial transaction timing', noPlan: 92, source: 'PNT Advisory Board, 2023' },
    { system: 'Power grid synchronization', noPlan: 88, source: 'NERC, 2023' }
  ];

  function buildHTML() {
    panel.innerHTML =
      // === SECTION 1: THE MONEY (full viewport, live ticker) ===
      '<div class="scale-section scale-money" id="scale-money">' +
        '<div class="scale-money-inner">' +
          '<div class="eyebrow" style="text-align:center;display:flex;justify-content:center;">Right now</div>' +
          '<div class="scale-live-ticker">' +
            '<div class="scale-live-prefix">Since you opened this tab:</div>' +
            '<div class="scale-live-num" id="scale-live-counter">$0</div>' +
            '<div class="scale-live-suffix">in transactions timed by satellites</div>' +
          '</div>' +
          '<div class="scale-hint">↓ see what depends on orbit</div>' +
        '</div>' +
      '</div>' +

      // === SECTION 2: 24-HOUR DEMAND CYCLE (was 2.5) ===
      '<div class="scale-section scale-demand" id="scale-demand">' +
        '<div class="eyebrow" style="text-align:center;display:flex;justify-content:center;">The rhythm</div>' +
        '<h3 class="scale-heading">When do satellites work hardest?</h3>' +
        '<p class="scale-sub">This 24-hour clock shows relative demand for each satellite type. Outer edge = peak demand. The further a color extends from center, the more that system is being used at that hour.</p>' +
        '<div class="demand-clock" id="demand-clock"></div>' +
        '<div style="text-align:center;font-family:JetBrains Mono,monospace;font-size:9px;color:var(--steel);margin-top:6px;">📍 GPS peaks at 7-9AM + 5-7PM (commutes) · 📡 Comms peaks 6-10PM (streaming) · 🌤️ Weather stays steady</div>' +
        '<div class="demand-legend">' +
          '<span class="demand-leg-item"><span style="background:#ffcc00" class="demand-leg-dot"></span>GPS/Nav</span>' +
          '<span class="demand-leg-item"><span style="background:#00e5ff" class="demand-leg-dot"></span>Comms</span>' +
          '<span class="demand-leg-item"><span style="background:#00ff7f" class="demand-leg-dot"></span>Weather</span>' +
        '</div>' +
      '</div>' +

      // === SECTION 3: THE GROWTH (timeline) ===
      '<div class="scale-connector">All of this was built in a single lifetime.</div>' +
      '<div class="scale-section scale-growth" id="scale-growth">' +
        '<div class="eyebrow" style="text-align:center;display:flex;justify-content:center;">The explosion</div>' +
        '<h3 class="scale-heading">1 satellite in 1957. 18,560 today.</h3>' +
        '<p class="scale-sub">Most of this happened in the last 5 years.</p>' +
        '<div class="growth-chart" id="growth-chart"></div>' +
        '<div class="growth-source">Source: UCS Satellite Database · CelesTrak · SatFleetLive (March 2026) · Wikipedia Starlink (June 2026)</div>' +
      '</div>' +

      // === SECTION 4: THE OWNERS ===
      '<div class="scale-connector">And most of it belongs to one company.</div>' +
      '<div class="scale-section scale-owners" id="scale-owners">' +
        '<div class="eyebrow" style="text-align:center;display:flex;justify-content:center;">The power</div>' +
        '<h3 class="scale-heading">Who owns the sky?</h3>' +
        '<p class="scale-sub">One company owns more than half of everything in orbit.</p>' +
        '<div class="owner-treemap" id="owner-chart">' +
          '<div class="owner-block" data-owner="SpaceX" style="flex:54;background:rgba(0,229,255,0.15);border-color:#00e5ff;">' +
            '<div class="owner-block-name">SpaceX</div>' +
            '<div class="owner-block-count">10,917</div>' +
            '<div class="owner-block-pct">54%</div>' +
          '</div>' +
          '<div class="owner-col" style="flex:46;">' +
            '<div class="owner-block" data-owner="Others" style="flex:27;background:rgba(139,150,165,0.08);border-color:#9BA5B4;">' +
              '<div class="owner-block-name">Others</div>' +
              '<div class="owner-block-count">5,124</div>' +
              '<div class="owner-block-pct">27%</div>' +
            '</div>' +
            '<div class="owner-row-small">' +
              '<div class="owner-block small" data-owner="China" style="flex:5.4;background:rgba(255,140,26,0.1);border-color:#ff8c1a;">' +
                '<div class="owner-block-name">China</div><div class="owner-block-pct">5.4%</div>' +
              '</div>' +
              '<div class="owner-block small" data-owner="OneWeb" style="flex:3.8;background:rgba(255,204,0,0.1);border-color:#ffcc00;">' +
                '<div class="owner-block-name">OneWeb</div><div class="owner-block-pct">3.8%</div>' +
              '</div>' +
              '<div class="owner-block small" data-owner="US Gov" style="flex:3.2;background:rgba(77,166,255,0.1);border-color:#4da6ff;">' +
                '<div class="owner-block-name">US Gov</div><div class="owner-block-pct">3.2%</div>' +
              '</div>' +
              '<div class="owner-block small" data-owner="Russia" style="flex:1.2;background:rgba(255,77,77,0.1);border-color:#ff4d4d;">' +
                '<div class="owner-block-name">Russia</div><div class="owner-block-pct">1.2%</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="owner-info-card hidden" id="owner-info-card"></div>' +
        '<div class="owner-callout">' +
          '<div class="owner-callout-num">54%</div>' +
          '<div class="owner-callout-text">SpaceX went from 0 to 10,917 satellites in 7 years. The fastest infrastructure build-out in human history.</div>' +
        '</div>' +
        '<div class="interact-hint">TAP A BLOCK TO EXPLORE ↗</div>' +
      '</div>' +

      // === SECTION 5: THE VULNERABILITY ===
      // === SECTION 5.5: WORLD MAP ===
      '<div class="scale-section scale-map" id="scale-map">' +
        '<div class="world-map" id="world-map"></div>' +
      '</div>' +

      '<div class="scale-closing" style="text-align:center;padding:40px 24px 80px;">' +
        '<p style="font-size:14px;color:var(--steel);line-height:1.8;">All of this — trillions in value, 18,560 machines, 80+ nations — running 24/7.<br><strong style="color:var(--phosphor)">But what happens when it stops?</strong></p>' +
        '<div id="bridge-next-holder" style="margin-top:24px;"></div>' +
      '</div>' +
      '<nav class="scale-nav" id="scale-nav">' +
        '<div class="scale-nav-dot active" data-section="scale-money" data-label="Live Ticker"></div>' +
        '<div class="scale-nav-dot" data-section="scale-demand" data-label="24h Demand"></div>' +
        '<div class="scale-nav-dot" data-section="scale-growth" data-label="Growth"></div>' +
        '<div class="scale-nav-dot" data-section="scale-owners" data-label="Ownership"></div>' +
        '<div class="scale-nav-dot" data-section="scale-map" data-label="Geography"></div>' +
      '</nav>';
  }

  function drawWorldMap() {
    var container = document.getElementById('world-map');
    if (!container) return;
    // Simplified world map: country positions (x%, y%) on a mercator-ish projection
    // Bubble size = sqrt(satellite count) scaled
    var countries = [
      { name: 'USA', x: 12, y: 42, sats: 11616, color: '#4da6ff' },
      { name: 'China', x: 76, y: 42, sats: 1000, color: '#ff8c1a' },
      { name: 'UK', x: 44, y: 30, sats: 700, color: '#ffcc00' },
      { name: 'Russia', x: 64, y: 24, sats: 220, color: '#ff4d4d' },
      { name: 'Japan', x: 88, y: 34, sats: 110, color: '#ff69b4' },
      { name: 'India', x: 70, y: 52, sats: 90, color: '#00e68a' },
      { name: 'EU', x: 48, y: 34, sats: 100, color: '#b366ff' },
      { name: 'Canada', x: 20, y: 18, sats: 60, color: '#00e5ff' },
      { name: 'S.Korea', x: 82, y: 44, sats: 40, color: '#ff6b9d' },
      { name: 'Brazil', x: 24, y: 65, sats: 15, color: '#34d399' },
      { name: 'Australia', x: 88, y: 72, sats: 15, color: '#fbbf24' },
      { name: 'UAE', x: 58, y: 48, sats: 20, color: '#c77dff' }
    ];
    var w = 1000, h = 560;
    var maxSats = 11616; var minR = 6;
    var svg = '<svg viewBox="0 0 '+w+' '+h+'" style="width:100%;height:60vh;display:block;margin:0 auto;">';
    // Simple continent outlines (very simplified paths)
    svg += '<rect x="0" y="0" width="'+w+'" height="'+h+'" fill="rgba(11,14,20,0.5)" rx="4"/>';
    // Grid lines
    for (var gx = 0; gx <= w; gx += w/6) svg += '<line x1="'+gx+'" y1="0" x2="'+gx+'" y2="'+h+'" stroke="rgba(139,150,165,0.06)" stroke-width="0.5"/>';
    for (var gy = 0; gy <= h; gy += h/4) svg += '<line x1="0" y1="'+gy+'" x2="'+w+'" y2="'+gy+'" stroke="rgba(139,150,165,0.06)" stroke-width="0.5"/>';
    // Equator
    svg += '<line x1="0" y1="'+h/2+'" x2="'+w+'" y2="'+h/2+'" stroke="rgba(139,150,165,0.1)" stroke-width="0.5" stroke-dasharray="4,4"/>';
    svg += '<text x="'+w*0.02+'" y="'+(h/2+12)+'" fill="rgba(139,150,165,0.25)" font-size="9" font-family="JetBrains Mono">EQUATOR</text>';
    // Title overlay inside the SVG
    svg += '<text x="'+(w/2)+'" y="30" fill="#9BA5B4" font-size="11" font-family="JetBrains Mono" text-anchor="middle" letter-spacing="0.3em">● THE GEOGRAPHY</text>';
    svg += '<text x="'+(w/2)+'" y="58" fill="#F2F4F7" font-size="22" font-family="JetBrains Mono" font-weight="700" text-anchor="middle">Where are they?</text>';
    svg += '<text x="'+(w/2)+'" y="80" fill="#9BA5B4" font-size="11" font-family="Inter, sans-serif" text-anchor="middle">Satellite ownership concentrated in a handful of nations.</text>';
    // Region labels (faint background text)
    svg += '<text x="'+(w*0.14)+'" y="'+(h*0.12)+'" fill="rgba(139,150,165,0.3)" font-size="14" font-family="JetBrains Mono" text-anchor="middle" letter-spacing="0.2em">AMERICAS</text>';
    svg += '<text x="'+(w*0.76)+'" y="'+(h*0.12)+'" fill="rgba(139,150,165,0.3)" font-size="14" font-family="JetBrains Mono" text-anchor="middle" letter-spacing="0.2em">ASIA</text>';
    // Country detail data
    var COUNTRY_DETAILS = {
      'USA': { flag: '🇺🇸', operator: 'SpaceX (10,917 sats)', breakdown: '68% comms, 15% military, 10% Earth obs, 7% science', fact: 'Launched more satellites in 2024 than all other nations combined.', theme: 'Your GPS, your weather app, your Netflix — most of it routes through American satellites.' },
      'China': { flag: '🇨🇳', operator: 'CASC / PLA', breakdown: '40% comms, 30% surveillance, 20% navigation, 10% science', fact: 'Tripled satellite count since 2020. Building an independent space internet.', theme: 'BeiDou navigation guides 400M+ devices daily — entirely independent from US GPS.' },
      'UK': { flag: '🇬🇧', operator: 'OneWeb (700 sats)', breakdown: '95% broadband comms, 5% other', fact: 'Rescued from bankruptcy in 2020. Now connecting schools in rural Alaska and ships in the Arctic.', theme: 'Every remote village getting internet for the first time — that\'s OneWeb bridging the digital divide.' },
      'Russia': { flag: '🇷🇺', operator: 'Roscosmos', breakdown: '35% navigation, 30% military, 20% comms, 15% science', fact: 'GLONASS ensures positioning works even if GPS is jammed. Critical for Arctic shipping routes.', theme: 'Without GLONASS as a GPS backup, a single jamming attack could blind global navigation.' },
      'Japan': { flag: '🇯🇵', operator: 'JAXA', breakdown: '45% Earth obs, 30% comms, 25% navigation', fact: 'Quasi-Zenith system provides centimeter GPS accuracy in Tokyo\'s urban canyons.', theme: 'Autonomous cars in dense cities need Japan\'s precision — regular GPS isn\'t accurate enough.' },
      'India': { flag: '🇮🇳', operator: 'ISRO', breakdown: '35% comms, 30% navigation, 25% Earth obs, 10% science', fact: 'NavIC provides free positioning for 1.4 billion people. Mars mission cost less than a Hollywood film.', theme: 'Fishermen in the Indian Ocean use NavIC to find fish and avoid storms — saving thousands of lives yearly.' },
      'EU': { flag: '🇪🇺', operator: 'ESA / Eutelsat', breakdown: '40% navigation, 35% Earth obs, 25% comms', fact: 'Galileo is the world\'s most accurate civilian navigation — free and open to all.', theme: 'Europe\'s Copernicus satellites monitor every farm, forest, and coastline — powering climate policy with data.' },
      'Canada': { flag: '🇨🇦', operator: 'CSA / Telesat', breakdown: '50% comms, 30% Earth obs, 20% science', fact: 'RADARSAT sees through clouds and darkness — essential for monitoring the Arctic 24/7.', theme: 'Canada\'s vast wilderness is only governable because satellites watch what humans can\'t reach.' },
      'S.Korea': { flag: '🇰🇷', operator: 'KARI', breakdown: '50% comms, 30% Earth obs, 20% science', fact: 'Launched its first domestic rocket (Nuri) in 2022. Space program younger than most smartphones.', theme: 'A nation of 52M investing in space independence — because depending on others is a vulnerability.' },
      'Brazil': { flag: '🇧🇷', operator: 'AEB / INPE', breakdown: '60% comms, 40% Earth obs', fact: 'Satellites are the primary tool for monitoring Amazon deforestation in real-time.', theme: 'Without satellite eyes, illegal deforestation would be invisible until it\'s too late.' },
      'Australia': { flag: '🇦🇺', operator: 'ASA', breakdown: '50% comms, 30% Earth obs, 20% defense', fact: 'Vast distances make satellite comms essential — some farms are 1000km from the nearest city.', theme: 'The Outback only has connectivity because of satellites. No cables reach that far.' },
      'UAE': { flag: '🇦🇪', operator: 'MBRSC', breakdown: '40% Earth obs, 35% comms, 25% science', fact: 'Hope Mars Mission (2021) — the Arab world\'s first interplanetary mission.', theme: 'A young space program proving that any nation can contribute to humanity\'s orbital infrastructure.' }
    };
    // Bubbles (clickable)
    countries.forEach(function(c, idx) {
      var cx = (c.x / 100) * w;
      var cy = (c.y / 100) * h;
      var r = Math.max(12, Math.sqrt(c.sats / maxSats) * 70);
      svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+c.color+'" fill-opacity="0.3" stroke="'+c.color+'" stroke-width="2" class="map-bubble" data-country="'+c.name+'" style="cursor:pointer;"/>';
      svg += '<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="'+c.color+'" style="pointer-events:none;"/>';
      var labelY = cy + r + 16;
      if (labelY > h - 14) labelY = cy - r - 8;
      svg += '<text x="'+cx+'" y="'+labelY+'" fill="'+c.color+'" font-size="13" font-family="JetBrains Mono" text-anchor="middle" opacity="0.9" style="pointer-events:none;">'+c.name+'</text>';
      svg += '<text x="'+cx+'" y="'+(labelY+14)+'" fill="#9BA5B4" font-size="10" font-family="JetBrains Mono" text-anchor="middle" opacity="0.7" style="pointer-events:none;">'+c.sats.toLocaleString()+' sats</text>';
    });
    svg += '</svg>';
    // Add a tooltip card container
    container.innerHTML = svg + '<div class="map-info-card hidden" id="map-info-card"></div><div class="interact-hint" id="map-hint">TAP A COUNTRY TO EXPLORE ↗</div>';

    // Click handlers for bubbles
    container.querySelectorAll('.map-bubble').forEach(function(bubble) {
      bubble.addEventListener('click', function(e) {
        var name = bubble.getAttribute('data-country');
        var info = COUNTRY_DETAILS[name];
        var card = document.getElementById('map-info-card');
        if (!info || !card) return;
        var mapHint = document.getElementById('map-hint');
        if (mapHint) mapHint.style.display = 'none';
        // Toggle off if same country clicked
        if (card.dataset.active === name && !card.classList.contains('hidden')) {
          card.classList.add('hidden');
          card.dataset.active = '';
          return;
        }
        card.dataset.active = name;
        card.innerHTML =
          '<div class="mic-header"><span class="mic-flag">' + info.flag + '</span><span class="mic-name">' + name + '</span><span class="mic-close">✕</span></div>' +
          '<div class="mic-row"><span class="mic-label">OPERATOR</span><span class="mic-val">' + info.operator + '</span></div>' +
          '<div class="mic-row"><span class="mic-label">BREAKDOWN</span><span class="mic-val">' + info.breakdown + '</span></div>' +
          '<div class="mic-fact">' + info.fact + '</div>' +
          '<div class="mic-theme">→ ' + info.theme + '</div>';
        // Position near the bubble
        var svgRect = container.querySelector('svg').getBoundingClientRect();
        var bubbleRect = bubble.getBoundingClientRect();
        var cardLeft = bubbleRect.left - svgRect.left + bubbleRect.width / 2;
        var cardTop = bubbleRect.top - svgRect.top - 10;
        card.style.left = Math.min(cardLeft, svgRect.width - 300) + 'px';
        card.style.top = cardTop + 'px';
        card.style.transform = 'translateX(-50%) translateY(-100%)';
        card.classList.remove('hidden');
        // Close button
        card.querySelector('.mic-close').addEventListener('click', function() { card.classList.add('hidden'); });
      });
    });
  }

  function drawDemandClock() {
    var container = document.getElementById('demand-clock');
    if (!container) return;
    var GPS =     [10,8,5,5,5,15,45,90,95,80,60,50,55,60,70,85,95,90,70,45,30,20,15,12];
    var COMMS =   [20,15,10,8,8,12,25,40,55,70,80,85,90,88,85,80,85,90,95,90,75,50,35,25];
    var WEATHER = [30,30,30,30,30,35,40,50,45,40,35,40,50,55,50,45,50,55,60,50,40,35,30,30];
    var size = Math.min(400, window.innerHeight * 0.45), cx = size/2, cy = size/2, r = size * 0.375;
    var svg = '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" style="display:block;margin:0 auto;">';
    svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="rgba(139,150,165,0.2)" stroke-width="1.5"/>';
    svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r*0.5)+'" fill="none" stroke="rgba(139,150,165,0.12)" stroke-width="1"/>';
    for (var h = 0; h < 24; h += 6) {
      var a = (h/24)*Math.PI*2 - Math.PI/2;
      var lx = cx + Math.cos(a)*(r+18), ly = cy + Math.sin(a)*(r+18);
      svg += '<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" fill="#F2F4F7" font-size="13" font-weight="700" font-family="JetBrains Mono" text-anchor="middle" dominant-baseline="middle">'+String(h).padStart(2,'0')+'h</text>';
    }
    function drawRadial(data, color, opacity) {
      var pts = [];
      for (var i = 0; i <= 24; i++) {
        var idx = i % 24;
        var angle = (idx/24)*Math.PI*2 - Math.PI/2;
        var dist = r * 0.15 + (data[idx]/100) * r * 0.75;
        pts.push((cx + Math.cos(angle)*dist).toFixed(1) + ',' + (cy + Math.sin(angle)*dist).toFixed(1));
      }
      svg += '<polygon points="'+pts.join(' ')+'" fill="'+color+'" fill-opacity="'+opacity+'" stroke="'+color+'" stroke-width="1.5" stroke-opacity="0.6"/>';
    }
    drawRadial(WEATHER, '#00ff7f', 0.06);
    drawRadial(COMMS, '#00e5ff', 0.08);
    drawRadial(GPS, '#ffcc00', 0.1);
    svg += '</svg>';
    container.innerHTML = svg;
  }

  function drawGrowthChart() {
    var container = document.getElementById('growth-chart');
    if (!container) return;
    var max = 18560;

    var YEAR_DETAILS = {
      1957: { launched: '1', event: 'Sputnik 1 — humanity\'s first satellite', theme: 'The space age begins. One beeping sphere changed geopolitics forever.' },
      1970: { launched: '~99', event: 'Cold War space race drives rapid deployment', theme: 'Military necessity — not civilian benefit — pushed satellites into orbit first.' },
      1990: { launched: '~300', event: 'End of Cold War, commercialization begins', theme: 'Satellites shift from weapons of war to tools of commerce. GPS goes civilian.' },
      2000: { launched: '~400', event: 'GPS opened to civilians (2000), Iridium constellation', theme: 'The invisible layer goes public. Every phone becomes a GPS receiver.' },
      2010: { launched: '~300', event: 'CubeSat revolution begins, costs plummet', theme: 'University students can now launch satellites. Space democratizes.' },
      2016: { launched: '~300', event: 'SpaceX reusable rockets proven, OneWeb funded', theme: 'Reusability changes the math. Launching gets 10× cheaper overnight.' },
      2019: { launched: '~800', event: 'First Starlink batch (60 sats in one launch)', theme: 'The mega-constellation era begins. One launch = more sats than many nations own.' },
      2020: { launched: '~1,100', event: 'Starlink scales rapidly, COVID drives internet demand', theme: 'Pandemic proves satellite internet isn\'t optional — it\'s infrastructure.' },
      2022: { launched: '~2,200', event: 'Ukraine war demonstrates tactical satellite value', theme: 'Starlink becomes a weapon of war. Space is now a theater of conflict.' },
      2023: { launched: '~2,500', event: 'Record year for launches globally', theme: 'More objects launched in one year than the previous 60 combined.' },
      2024: { launched: '~2,400', event: 'SpaceX passes 6,000 Starlink sats, Kuiper begins', theme: 'Amazon enters orbit. Two tech giants now competing for the sky.' },
      2026: { launched: '~8,000+', event: 'Projected: 18,560 active satellites', theme: 'The invisible layer is thicker than ever — and growing exponentially.' }
    };

    container.innerHTML = '<div class="growth-bars">' +
      TIMELINE.map(function(d) {
        var h = Math.max(1, (d.count / max) * 100);
        return '<div class="growth-bar-wrap" data-year="' + d.year + '" style="cursor:pointer;">' +
          '<div class="growth-val">' + d.count.toLocaleString() + '</div>' +
          '<div class="growth-bar" data-height="' + h + '%" style="height:0%"></div>' +
          '<div class="growth-year">' + d.year + '</div>' +
        '</div>';
      }).join('') +
    '</div><div class="growth-info-card hidden" id="growth-info-card"></div>' +
    '<div class="interact-hint" id="growth-hint">TAP A BAR TO EXPLORE ↗</div>';

    // Click handlers
    var card = document.getElementById('growth-info-card');
    container.querySelectorAll('.growth-bar-wrap').forEach(function(wrap) {
      wrap.addEventListener('click', function() {
        var year = wrap.getAttribute('data-year');
        var info = YEAR_DETAILS[year];
        if (!info || !card) return;
        // Hide hint on first click
        var hint = document.getElementById('growth-hint');
        if (hint) hint.style.display = 'none';
        if (card.dataset.active === year && !card.classList.contains('hidden')) {
          card.classList.add('hidden'); card.dataset.active = ''; return;
        }
        card.dataset.active = year;
        card.innerHTML =
          '<div class="mic-header"><span class="mic-flag">📅</span><span class="mic-name">' + year + '</span><span class="mic-close">✕</span></div>' +
          '<div class="mic-row"><span class="mic-label">LAUNCHED THAT YEAR</span><span class="mic-val">' + info.launched + ' satellites</span></div>' +
          '<div class="mic-fact">' + info.event + '</div>' +
          '<div class="mic-theme">→ ' + info.theme + '</div>';
        card.classList.remove('hidden');
        card.querySelector('.mic-close').addEventListener('click', function() { card.classList.add('hidden'); });
      });
    });
  }

  function setupOwnerClicks() {
    var OWNER_DETAILS = {
      'SpaceX': { icon: '🚀', count: '10,917', pct: '54%', founded: '2002 (first sat 2018)', ceo: 'Elon Musk', constellation: 'Starlink — low-Earth broadband internet', fact: 'Went from 0 to 10,917 satellites in just 7 years. Launches ~50 sats every 3 days.', theme: 'One private company controls more orbital infrastructure than all governments combined. Your in-flight WiFi, rural broadband, and Ukrainian military comms all run on Starlink.' },
      'China': { icon: '🇨🇳', count: '1,000', pct: '5.4%', founded: 'CASC (est. 1999)', ceo: 'State-owned', constellation: 'BeiDou nav + Guowang broadband (planned 13,000)', fact: 'Building a Starlink competitor with 13,000 planned satellites. Already tripled orbital presence since 2020.', theme: 'An entirely parallel space infrastructure — independent from Western systems. If geopolitics fracture further, 1.4B people still have navigation and comms.' },
      'OneWeb': { icon: '🇬🇧', count: '700', pct: '3.8%', founded: '2012 (UK-India owned)', ceo: 'Bharti/UK Gov joint venture', constellation: 'LEO broadband for enterprise, maritime, aviation', fact: 'Went bankrupt in 2020, rescued by UK government + Indian telecom. Now serves 50+ countries.', theme: 'Proof that space infrastructure is so critical that governments will bail it out rather than let it fail. Connecting the unconnected.' },
      'US Gov': { icon: '🇺🇸', count: '600', pct: '3.2%', founded: 'NASA (1958), NRO, DoD', ceo: 'Multiple agencies', constellation: 'GPS (31 sats), GOES weather, military ISR', fact: 'GPS alone generates $1.4 trillion/year for the US economy. The most valuable 31 machines ever built.', theme: 'The original invisible layer. GPS was military-only until 2000, when Clinton opened it to civilians. Now 4.2 billion devices depend on it daily.' },
      'Russia': { icon: '🇷🇺', count: '220', pct: '1.2%', founded: 'Roscosmos (1992)', ceo: 'State corporation', constellation: 'GLONASS navigation (24 sats) + military', fact: 'Fleet is aging — average satellite age 8+ years. But GLONASS remains critical as the only full GPS alternative.', theme: 'Without Russia\'s GLONASS as backup, a single GPS failure would leave 4 billion people without positioning. Redundancy matters.' },
      'Others': { icon: '🌐', count: '5,124', pct: '27%', founded: 'Various (80+ nations)', ceo: 'Government + private mix', constellation: 'Hundreds of operators: Amazon Kuiper, Telesat, Planet Labs, etc.', fact: 'Amazon\'s Project Kuiper aims to add 3,236 more satellites by 2029. The sky is getting crowded fast.', theme: 'The long tail of space — universities, startups, small nations. Democratization of orbit means more innovation but also more debris risk.' }
    };
    var blocks = panel.querySelectorAll('.owner-block[data-owner]');
    var card = document.getElementById('owner-info-card');
    blocks.forEach(function(block) {
      block.style.cursor = 'pointer';
      block.addEventListener('click', function(e) {
        e.stopPropagation();
        var name = block.getAttribute('data-owner');
        var info = OWNER_DETAILS[name];
        if (!info || !card) return;
        if (card.dataset.active === name && !card.classList.contains('hidden')) {
          card.classList.add('hidden');
          card.dataset.active = '';
          return;
        }
        card.dataset.active = name;
        card.innerHTML =
          '<div class="mic-header"><span class="mic-flag">' + info.icon + '</span><span class="mic-name">' + name + '</span><span class="mic-close">✕</span></div>' +
          '<div class="mic-row"><span class="mic-label">SATELLITES</span><span class="mic-val">' + info.count + ' (' + info.pct + ' of all orbital assets)</span></div>' +
          '<div class="mic-row"><span class="mic-label">CONSTELLATION</span><span class="mic-val">' + info.constellation + '</span></div>' +
          '<div class="mic-row"><span class="mic-label">FOUNDED</span><span class="mic-val">' + info.founded + '</span></div>' +
          '<div class="mic-fact">' + info.fact + '</div>' +
          '<div class="mic-theme">→ ' + info.theme + '</div>';
        // Position relative to the clicked block
        var rect = block.getBoundingClientRect();
        var parentRect = card.parentElement.getBoundingClientRect();
        card.style.position = 'absolute';
        card.style.left = (rect.left - parentRect.left + rect.width / 2) + 'px';
        card.style.top = (rect.top - parentRect.top - 8) + 'px';
        card.style.transform = 'translateX(-50%) translateY(-100%)';
        card.classList.remove('hidden');
        card.querySelector('.mic-close').addEventListener('click', function() { card.classList.add('hidden'); });
      });
    });
  }

  function init() {
    buildHTML();
    drawGrowthChart();
    drawDemandClock();
    drawWorldMap();
    setupOwnerClicks();

    // Live ticker: counts up money since tab opened
    var startTime = Date.now();
    var counterEl = document.getElementById('scale-live-counter');
    var tickerInterval = setInterval(function() {
      var elapsed = (Date.now() - startTime) / 1000;
      var dollars = Math.round(elapsed * PER_SECOND);
      if (counterEl) {
        if (dollars >= 1e9) counterEl.textContent = '$' + (dollars / 1e9).toFixed(1) + 'B';
        else if (dollars >= 1e6) counterEl.textContent = '$' + (dollars / 1e6).toFixed(0) + 'M';
        else counterEl.textContent = '$' + dollars.toLocaleString();
      }
    }, 100);

    // Ticker runs continuously — uses elapsed time so it's always correct even after switching tabs

    // Scroll-triggered animations
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.15 });

    panel.querySelectorAll('.sector-card, .scale-section').forEach(function(el) { observer.observe(el); });

    // Animate growth bars
    var growthObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          var bars = panel.querySelectorAll('.growth-bar');
          bars.forEach(function(b, i) {
            setTimeout(function() { b.style.height = b.dataset.height; }, i * 80);
          });
          growthObs.disconnect();
        }
      });
    }, { threshold: 0.2 });
    var gc = document.getElementById('growth-chart');
    if (gc) growthObs.observe(gc);

    // Animate owner bars
    var ownerObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          panel.querySelectorAll('.owner-fill').forEach(function(f, i) {
            setTimeout(function() { f.style.width = f.dataset.width; }, i * 100);
          });
          ownerObs.disconnect();
        }
      });
    }, { threshold: 0.2 });
    var oc = document.getElementById('owner-chart');
    if (oc) ownerObs.observe(oc);

    // Easter egg 3: click SpaceX's bar (first owner row)
    var spacexBlock = panel.querySelector('.owner-block[data-owner="SpaceX"]');
    if (spacexBlock) {
      spacexBlock.addEventListener('click', function() { Utils.easterEggs.reveal('telstar'); });
    }

    // Animate vulnerability bars
    var vulnObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          panel.querySelectorAll('.vuln-bar-fill').forEach(function(f, i) {
            setTimeout(function() { f.style.width = f.dataset.width; }, i * 120);
          });
          vulnObs.disconnect();
        }
      });
    }, { threshold: 0.2 });
    var vg = document.getElementById('vuln-grid');
    if (vg) vulnObs.observe(vg);

    // Next button
    var nextHolder = document.getElementById('bridge-next-holder');
    if (nextHolder) nextHolder.appendChild(Utils.createNextButton('Watch it all go dark', 'without'));

    // Section nav dots
    var navDots = panel.querySelectorAll('.scale-nav-dot');
    var sections = ['scale-money','scale-demand','scale-growth','scale-owners','scale-map'];
    var sectionObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
          navDots.forEach(function(d) { d.classList.toggle('active', d.dataset.section === e.target.id); });
        }
      });
    }, { threshold: 0.5 });
    sections.forEach(function(id) { var el = document.getElementById(id); if (el) sectionObs.observe(el); });
    navDots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        var target = document.getElementById(dot.dataset.section);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    // Make the ::after labels clickable by extending the dot's hit area
    var navEl = panel.querySelector('.scale-nav');
    if (navEl) {
      navDots.forEach(function(dot) {
        dot.style.padding = '6px 80px 6px 6px';
        dot.style.margin = '-6px -80px -6px -6px';
        dot.style.clipPath = 'none';
      });
    }
  }

  window.addEventListener('tab-init', function(e) {
    if (e.detail.tab === 'bridge') init();
  });
})();
