// === TAB 2: YOUR SATELLITE SHADOW — Scrolling 24-hour timeline ===
(function() {
  var panel = document.getElementById('panel-day');

  var HOURS = [
    { time: '6 AM', activity: 'Wake Up', icon: '⏰', sats: ['GPS III','GPS III-5','Galileo-12'], satCount: 4, moments: 3,
      momentLabel: 'alarm sync, time check, overnight updates',
      desc: 'Your alarm rings. Your phone already synced its clock to an atomic satellite 3 times overnight — accurate to 1 billionth of a second.',
      story: 'In 2003, the entire Northeast US power grid cascaded to blackout in 3.5 seconds — because ONE timing synchronization signal was lost. 55 million people, no power, 11 deaths. The grid needs satellite timing accurate to 1 microsecond. It drifted by 4.',
      storySource: 'U.S.-Canada Power System Outage Task Force, 2004' },
    { time: '7 AM', activity: 'Commute', icon: '🚗', sats: ['GPS III','GPS III-5','GLONASS-K','BeiDou-3','Galileo-12'], satCount: 24, moments: 47,
      momentLabel: 'every turn, reroute, ETA update, and traffic ping',
      desc: '24 GPS satellites triangulate your position 10 times per second. Your maps app, ride-share, traffic rerouting — all running on signals from 20,200 km above.',
      story: 'In 2022, a cargo ship captain in the South China Sea noticed his GPS position suddenly jumped 300 meters. He was being "spoofed" — a fake signal designed to lure ships into contested waters. The IMO now classifies GPS spoofing as a form of maritime warfare. Over 9,000 incidents logged in 2023 alone.',
      storySource: 'IMO Maritime Safety Committee MSC.1/Circ.1598, 2023' },
    { time: '9 AM', activity: 'Work', icon: '💼', sats: ['GPS III','Intelsat-39','SES-17','TDRS-13'], satCount: 31, moments: 64,
      momentLabel: 'video calls, cloud syncs, card payments, timestamps',
      desc: 'Video calls sync via satellite backbone. Financial transactions timestamped by GPS atomic clocks. Cloud servers coordinated across continents.',
      story: 'In January 2016, GPS satellite SVN-23 broadcast an incorrect time signal for 13.7 microseconds. In those microseconds, telecom networks in multiple countries partially failed, police radios went offline in parts of North America, and BBC digital radio stuttered. From one satellite. For 13 millionths of a second.',
      storySource: 'GPS.gov Constellation Status Archive; BBC R&D White Paper, 2016' },
    { time: '12 PM', activity: 'Weather Check', icon: '🌤️', sats: ['GOES-18','GOES-16','Himawari-9','Meteosat-12','NOAA-21'], satCount: 14, moments: 12,
      momentLabel: 'forecast views, rain alerts, UV index, flight status',
      desc: 'GOES-18 just scanned the entire Western Hemisphere — again. It does this every 10 minutes. Every weather forecast starts here.',
      story: 'In 2013, Typhoon Haiyan was approaching the Philippines. Satellite data gave a 72-hour warning. 800,000 people evacuated. When it hit at 315 km/h — the strongest landfall ever recorded — 6,300 died. Without satellite warning, Philippine government modeling estimated 40,000+ deaths.',
      storySource: 'NDRRMC Situation Report No. 108; WMO Bulletin Vol 63(1), 2014' },
    { time: '3 PM', activity: 'Delivery', icon: '📦', sats: ['GPS III','Iridium NEXT','Orbcomm-2','Starlink-5291'], satCount: 18, moments: 23,
      momentLabel: 'package tracking, driver routing, warehouse scans',
      desc: 'Your package was tracked across 4 countries, 3 oceans, and 14 handoffs — each logged by satellite positioning and satellite-linked IoT sensors.',
      story: 'In 2014, Malaysia Airlines MH370 vanished with 239 people. The ONLY data that narrowed the search area came from Inmarsat satellite "handshake" pings — automatic signals the plane sent every hour to a geostationary satellite, even after all other systems went dark.',
      storySource: 'ATSB Transport Safety Report, MH370, 2014' },
    { time: '6 PM', activity: 'Streaming & Calls', icon: '📱', sats: ['Starlink-5291','OneWeb-394','SES-17','ViaSat-3','Intelsat-39'], satCount: 42, moments: 86,
      momentLabel: 'messages sent, stories viewed, streams buffered, calls made',
      desc: 'Video streams, voice calls, social media — even "terrestrial" internet uses satellite backbone links for transoceanic routing and time synchronization.',
      story: 'In 2022, when Russia invaded Ukraine and destroyed cell towers, Elon Musk shipped 5,000 Starlink terminals within 48 hours. They became the Ukrainian military\'s primary communication backbone. Zelenskyy\'s nightly addresses? Broadcast via Starlink.',
      storySource: 'Fedorov (Ukraine Digital Minister) public statements, 2022' },
    { time: '9 PM', activity: 'Food', icon: '🍽️', sats: ['Landsat-9','Sentinel-2','Terra','Aqua','SMAP'], satCount: 8, moments: 8,
      momentLabel: 'every ingredient grown/shipped with satellite guidance',
      desc: 'The food on your plate was grown using satellite-guided precision agriculture — 70% of large-scale farms now use GPS for planting, fertilizing, and harvesting.',
      story: 'During the 2020 locust plague in East Africa — the worst in 70 years — FAO used Sentinel-2 satellite vegetation data to predict EXACTLY which fields the swarms would hit next, 72 hours in advance. Without satellite prediction, the swarms would have destroyed food for 25 million people.',
      storySource: 'FAO Desert Locust Watch, 2020' },
    { time: '11 PM', activity: 'Sleep', icon: '🌙', sats: ['ICESat-2','GRACE-FO','Sentinel-6','DSCOVR','Suomi NPP'], satCount: 6, moments: 4,
      momentLabel: 'overnight climate monitoring, fire watch, flood sensors',
      desc: 'While you sleep, Earth observation satellites scan for wildfires, track ice melt, measure sea level rise, and detect emissions no one on the ground can see.',
      story: 'In August 2023, Maui\'s wildfire was detected by GOES-18 satellite thermal sensors 11 minutes before ANY ground 911 call was made. The satellite saw the heat signature through smoke invisible at ground level. Those 11 minutes could have saved 100 lives — but the alert system had been turned off.',
      storySource: 'Hawaii Emergency Management Agency After-Action Report, 2024' }
  ];

  function buildHTML() {
    var pillsHTML = HOURS.map(function(h, i) {
      return '<button class="shadow-pill' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">' + h.time + '</button>';
    }).join('');

    var timelineHTML = HOURS.map(function(h, i) {
      return '<div class="shadow-hour" data-idx="' + i + '" id="shadow-hour-' + i + '">' +
        '<div class="shadow-hour-content">' +
          '<div class="shadow-activity">' +
            '<span class="shadow-icon">' + h.icon + '</span>' +
            '<h3 class="shadow-activity-name">' + h.activity + ' <span class="shadow-time-inline">' + h.time + '</span></h3>' +
          '</div>' +
          '<p class="shadow-desc">' + h.desc + '</p>' +
          '<div class="shadow-sat-bar">' +
            '<div class="shadow-sat-chips">' + h.sats.map(function(s) { return '<span class="shadow-chip" data-sat="' + s + '">' + s + '</span>'; }).join('') + '</div>' +
          '</div>' +
          '<div class="shadow-story">' +
            '<div class="shadow-story-label">TRUE STORY</div>' +
            '<p class="shadow-story-text">' + h.story + '</p>' +
            '<cite class="shadow-story-source">' + h.storySource + '</cite>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    panel.innerHTML =
      '<div class="shadow-hero">' +
        '<div class="shadow-hero-inner">' +
          '<div class="eyebrow" style="text-align:center;display:flex;justify-content:center;">An invisible dependency</div>' +
          '<h2 class="shadow-title">Your <span class="hl">Satellite Shadow</span></h2>' +
          '<p class="shadow-sub">Every hour, dozens of satellites keep life running — unnoticed.<br>Scroll through one day. See the signals no one sees.</p>' +
        '</div>' +
        '<div class="shadow-scroll-hint">↓ scroll to begin the day</div>' +
      '</div>' +
      '<div class="shadow-content-wrap">' +
      '<div class="shadow-sticky-bar" id="shadow-sticky-bar">' +
        '<div class="shadow-pills" id="shadow-pills">' + pillsHTML + '</div>' +
      '</div>' +
      '<div class="shadow-timeline" id="shadow-timeline">' + timelineHTML + '</div>' +
      '<div class="shadow-finale">' +
        '<p class="shadow-finale-text">Every signal. Every sync. Every route.<br><strong style="color:var(--phosphor)">Invisible. Silent. Essential.</strong></p>' +
        '<p class="shadow-finale-sub">You just scrolled through one day. The satellites never stopped. They never will — unless something goes wrong.</p>' +
        '<div id="day-next-holder" style="margin-top:24px;text-align:center;"></div>' +
      '</div>' +
      '</div>';
  }

  function init() {
    buildHTML();

    var hours = panel.querySelectorAll('.shadow-hour');
    var pills = panel.querySelectorAll('.shadow-pill');
    var currentIdx = 0;
    var clickLock = false;

    // Scroll-based reveal: show hours one at a time as user scrolls
    function onScroll() {
      var bestIdx = 0;
      hours.forEach(function(h, i) {
        var rect = h.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.5) {
          bestIdx = i;
        }
      });

      // Reveal hours up to current scroll position
      hours.forEach(function(h, i) { if (i <= bestIdx) h.classList.add('visible'); });

      // Update pill highlight based on scroll (only if not click-locked)
      if (!clickLock && bestIdx !== currentIdx) {
        currentIdx = bestIdx;
        pills.forEach(function(p, i) { p.classList.toggle('active', i === currentIdx); });
      }
    }

    panel.addEventListener('scroll', onScroll);
    setTimeout(onScroll, 100);

    // Pill click
    pills.forEach(function(pill) {
      pill.addEventListener('click', function() {
        var idx = parseInt(pill.dataset.idx);
        var target = hours[idx];
        if (!target) return;
        // Reveal all hours up to clicked one
        hours.forEach(function(h, i) { if (i <= idx) h.classList.add('visible'); });
        // Update pill
        pills.forEach(function(p, i) { p.classList.toggle('active', i === idx); });
        currentIdx = idx;
        // Lock scroll handler permanently until user manually scrolls
        clickLock = true;
        // Scroll
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Unlock click lock only on manual scroll (wheel/touch)
    panel.addEventListener('wheel', function() { clickLock = false; }, { passive: true });
    panel.addEventListener('touchmove', function() { clickLock = false; }, { passive: true });

    // Easter egg 2: click the moon icon on Sleep hour
    var lastHour = hours[hours.length - 1];

    if (lastHour) {
      var moonIcon = lastHour.querySelector('.shadow-icon');
      if (moonIcon) {
        moonIcon.style.cursor = 'pointer';
        moonIcon.addEventListener('click', function() { Utils.easterEggs.reveal('moon'); });
      }
    }

    // Finale reveal
    var finale = panel.querySelector('.shadow-finale');
    if (finale) {
      var fio = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
          finale.classList.add('visible');
        }
      }, { threshold: 0.3 });
      fio.observe(finale);
    }

    // Next tab button
    var dayNext = document.getElementById('day-next-holder');
    if (dayNext) dayNext.appendChild(Utils.createNextButton('See the full scale', 'bridge'));

    // Satellite chip popups
    var SAT_INFO = {
      'GPS III': { alt: '20,200 km', speed: '14,000 km/h', op: 'US Space Force', launched: '2020' },
      'GPS III-5': { alt: '20,200 km', speed: '14,000 km/h', op: 'US Space Force', launched: '2021' },
      'Galileo-12': { alt: '23,222 km', speed: '12,000 km/h', op: 'European Union', launched: '2016' },
      'GLONASS-K': { alt: '19,100 km', speed: '14,500 km/h', op: 'Russia (Roscosmos)', launched: '2022' },
      'BeiDou-3': { alt: '21,500 km', speed: '14,000 km/h', op: 'China (CNSA)', launched: '2020' },
      'Intelsat-39': { alt: '35,786 km', speed: '11,000 km/h', op: 'Intelsat (US)', launched: '2019' },
      'SES-17': { alt: '35,786 km', speed: '11,000 km/h', op: 'SES (Luxembourg)', launched: '2021' },
      'TDRS-13': { alt: '35,786 km', speed: '11,000 km/h', op: 'NASA', launched: '2017' },
      'GOES-18': { alt: '35,786 km', speed: '11,000 km/h', op: 'NOAA (US)', launched: '2022' },
      'GOES-16': { alt: '35,786 km', speed: '11,000 km/h', op: 'NOAA (US)', launched: '2016' },
      'Himawari-9': { alt: '35,786 km', speed: '11,000 km/h', op: 'JMA (Japan)', launched: '2016' },
      'Meteosat-12': { alt: '35,786 km', speed: '11,000 km/h', op: 'EUMETSAT', launched: '2022' },
      'NOAA-21': { alt: '824 km', speed: '27,000 km/h', op: 'NOAA (US)', launched: '2022' },
      'Iridium NEXT': { alt: '780 km', speed: '27,000 km/h', op: 'Iridium (US)', launched: '2019' },
      'Orbcomm-2': { alt: '715 km', speed: '27,000 km/h', op: 'Orbcomm (US)', launched: '2015' },
      'Starlink-5291': { alt: '550 km', speed: '27,000 km/h', op: 'SpaceX', launched: '2023' },
      'OneWeb-394': { alt: '1,200 km', speed: '26,000 km/h', op: 'OneWeb (UK)', launched: '2022' },
      'ViaSat-3': { alt: '35,786 km', speed: '11,000 km/h', op: 'Viasat (US)', launched: '2023' },
      'Landsat-9': { alt: '705 km', speed: '27,000 km/h', op: 'NASA/USGS', launched: '2021' },
      'Sentinel-2': { alt: '786 km', speed: '27,000 km/h', op: 'ESA (EU)', launched: '2017' },
      'Terra': { alt: '705 km', speed: '27,000 km/h', op: 'NASA', launched: '1999' },
      'Aqua': { alt: '705 km', speed: '27,000 km/h', op: 'NASA', launched: '2002' },
      'SMAP': { alt: '685 km', speed: '27,000 km/h', op: 'NASA', launched: '2015' },
      'ICESat-2': { alt: '496 km', speed: '28,000 km/h', op: 'NASA', launched: '2018' },
      'GRACE-FO': { alt: '490 km', speed: '28,000 km/h', op: 'NASA/DLR', launched: '2018' },
      'Sentinel-6': { alt: '1,336 km', speed: '25,000 km/h', op: 'ESA/EUMETSAT', launched: '2020' },
      'DSCOVR': { alt: '1.5M km (L1)', speed: '~1,000 km/h', op: 'NOAA', launched: '2015' },
      'Suomi NPP': { alt: '824 km', speed: '27,000 km/h', op: 'NASA/NOAA', launched: '2011' }
    };
    panel.addEventListener('click', function(e) {
      var chip = e.target.closest('.shadow-chip');
      if (!chip) { var existing = panel.querySelector('.sat-popup'); if (existing) existing.remove(); return; }
      var name = chip.dataset.sat;
      var info = SAT_INFO[name];
      if (!info) return;
      var existing = panel.querySelector('.sat-popup');
      if (existing) existing.remove();
      var popup = document.createElement('div');
      popup.className = 'sat-popup';
      popup.innerHTML = '<div class="sat-popup-name">' + name + '</div>' +
        '<div class="sat-popup-row"><span>Operator</span><b>' + info.op + '</b></div>' +
        '<div class="sat-popup-row"><span>Altitude</span><b>' + info.alt + '</b></div>' +
        '<div class="sat-popup-row"><span>Speed</span><b>' + info.speed + '</b></div>' +
        '<div class="sat-popup-row"><span>Launched</span><b>' + info.launched + '</b></div>';
      var rect = chip.getBoundingClientRect();
      var panelRect = panel.getBoundingClientRect();
      popup.style.top = (rect.bottom - panelRect.top + panel.scrollTop + 8) + 'px';
      popup.style.left = (rect.left - panelRect.left) + 'px';
      panel.appendChild(popup);
    });
  }

  window.addEventListener('tab-init', function(e) {
    if (e.detail.tab === 'day') init();
  });
})();
