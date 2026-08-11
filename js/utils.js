// === UTILITIES ===
var Utils = {
  pageLoadTime: Date.now(),
  countUp: function(el, target, opts) {
    opts = opts || {};
    var dur = opts.duration || 1200;
    var decimals = opts.decimals || 0;
    var start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString();
    }
    requestAnimationFrame(tick);
  },

  observeReveal: function(selector, threshold) {
    threshold = threshold || 0.3;
    var els = document.querySelectorAll(selector);
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: threshold });
    els.forEach(function(el) { io.observe(el); });
    return io;
  },

  initStarfield: function(canvas, container) {
    var ctx = canvas.getContext('2d');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stars = [];
    var shootingStars = [];
    var running = false;
    var scrollY = 0;

    function resize() {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      var count = Math.floor((canvas.width * canvas.height) / 2200);
      stars = [];
      for (var i = 0; i < count; i++) {
        // depth 1-3: deeper stars move slower with scroll (parallax)
        var depth = 1 + Math.random() * 2;
        stars.push({
          x: Math.random()*canvas.width,
          y: Math.random()*canvas.height,
          r: (0.3 + Math.random()*0.9) / depth * 1.5,
          base: Math.random()*0.35 + 0.15 + (3-depth)*0.1,
          speed: Math.random()*0.02 + 0.005,
          phase: Math.random()*Math.PI*2,
          depth: depth
        });
      }
    }

    // Track scroll position from the active tab panel
    function updateScroll() {
      var activePanel = document.querySelector('.tab-panel.active');
      scrollY = activePanel ? activePanel.scrollTop : 0;
    }
    document.addEventListener('scroll', updateScroll, true);

    // Spawn shooting stars periodically
    function spawnShootingStar() {
      if (shootingStars.length > 5) return;
      var startX = Math.random() * canvas.width * 0.7;
      var startY = Math.random() * canvas.height * 0.4;
      shootingStars.push({
        x: startX, y: startY,
        vx: 3 + Math.random() * 4,
        vy: 1.5 + Math.random() * 2.5,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.01,
        len: 30 + Math.random() * 50,
        brightness: 0.6 + Math.random() * 0.4
      });
    }

    var t = 0;
    function draw() {
      if (!running) return;
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn shooting stars randomly (~every 3-5 seconds)
      if (!reduceMotion && Math.random() < 0.012) spawnShootingStar();

      // Draw stars with parallax offset
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var parallaxOffset = (scrollY * 0.15) / s.depth;
        var drawY = (s.y - parallaxOffset) % canvas.height;
        if (drawY < 0) drawY += canvas.height;

        var twinkle = reduceMotion ? s.base : s.base + Math.sin(t * s.speed + s.phase) * 0.2;
        ctx.globalAlpha = Math.max(0, Math.min(1, twinkle));
        ctx.fillStyle = '#F2F4F7';
        ctx.beginPath();
        ctx.arc(s.x, drawY, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw shooting stars
      if (!reduceMotion) {
        for (var j = shootingStars.length - 1; j >= 0; j--) {
          var ss = shootingStars[j];
          ss.x += ss.vx;
          ss.y += ss.vy;
          ss.life -= ss.decay;
          if (ss.life <= 0) { shootingStars.splice(j, 1); continue; }

          var tailX = ss.x - (ss.vx / Math.sqrt(ss.vx*ss.vx + ss.vy*ss.vy)) * ss.len * ss.life;
          var tailY = ss.y - (ss.vy / Math.sqrt(ss.vx*ss.vx + ss.vy*ss.vy)) * ss.len * ss.life;

          var grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(1, 'rgba(255,255,255,' + (ss.life * ss.brightness) + ')');

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(ss.x, ss.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = 1;
          ctx.stroke();

          // Bright head
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, 1.5 * ss.life, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,' + (ss.life * 0.9) + ')';
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    function start() {
      if (running) return;
      running = true;
      draw();
    }
    function stop() {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) stop(); else if (!canvas.dataset.pausedByTab) start();
    });
    window.addEventListener('tab-switch', function(e) {
      if (e.detail && e.detail.tab === 'games') { canvas.dataset.pausedByTab = '1'; stop(); }
      else { canvas.dataset.pausedByTab = ''; if (!document.hidden) start(); }
    });
    window.addEventListener('resize', resize);
    resize(); start();
  },

  startClock: function(el) {
    function tick() {
      var d = new Date();
      el.textContent = 'UTC ' + String(d.getUTCHours()).padStart(2,'0') + ':' + String(d.getUTCMinutes()).padStart(2,'0') + ':' + String(d.getUTCSeconds()).padStart(2,'0');
    }
    tick(); setInterval(tick, 1000);
  },

  // Create a "Next" button that navigates to the next tab
  createNextButton: function(label, targetTab) {
    var btn = document.createElement('button');
    btn.className = 'next-tab-btn';
    btn.innerHTML = label + ' <span class="arrow">→</span>';
    btn.addEventListener('click', function() {
      var tabBtn = document.querySelector('[data-tab="' + targetTab + '"]');
      if (tabBtn) tabBtn.click();
    });
    return btn;
  },

  // === EASTER EGG SYSTEM ===
  easterEggs: {
    found: {},
    secrets: {
      earth: { reflection: 'You looked at what was always there.', fragment: 'THE INVISIBLE' },
      moon: { reflection: 'You noticed the detail others scroll past.', fragment: 'LAYER' },
      telstar: { reflection: 'You questioned who controls it.', fragment: 'IS' },
      solar: { reflection: 'You stayed through the uncomfortable truth.', fragment: 'NOW' },
      debris: { reflection: 'You defended what matters.', fragment: 'VISIBLE' }
    },
    secretOrder: ['earth', 'moon', 'telstar', 'solar', 'debris'],
    reveal: function(id) {
      if (this.found[id]) return false;
      this.found[id] = true;
      var idx = this.secretOrder.indexOf(id);
      if (idx >= 0) {
        var lock = document.querySelector('.secret-lock[data-idx="' + idx + '"]');
        if (lock) {
          lock.classList.add('unlocked');
          lock.querySelector('.lock-icon').textContent = '🔓';
          lock.dataset.secret = this.secrets[id].reflection + '\n\nFragment: ' + this.secrets[id].fragment;
          // Dramatic reveal animation
          lock.classList.add('glow');
          this.animateReveal(lock);
          setTimeout(function() { lock.classList.remove('glow'); }, 3000);
          // Show secret text for 10 seconds then hide
          lock.classList.add('show-secret');
          setTimeout(function() { lock.classList.remove('show-secret'); }, 10000);
        }
      }
      if (this.getCount() === this.getTotal()) {
        var locksEl = document.getElementById('secret-locks');
        if (locksEl) locksEl.classList.add('all-found');
      }
      return true;
    },
    animateReveal: function(lock) {
      // Burst of particles from around the screen flying to the lock
      for (var i = 0; i < 20; i++) {
        var particle = document.createElement('div');
        particle.className = 'secret-particle';
        particle.style.left = (Math.random() * 80 + 10) + 'vw';
        particle.style.top = (Math.random() * 80 + 10) + 'vh';
        particle.style.width = (3 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        document.body.appendChild(particle);
        var rect = lock.getBoundingClientRect();
        particle.style.setProperty('--target-x', rect.left + 14 + 'px');
        particle.style.setProperty('--target-y', rect.top + 14 + 'px');
        particle.style.animationDelay = (i * 0.05) + 's';
        particle.classList.add('fly');
        setTimeout(function(p) { return function() { p.remove(); }; }(particle), 1500);
      }
      // Screen edge glow
      var glow = document.createElement('div');
      glow.className = 'secret-screen-glow';
      document.body.appendChild(glow);
      setTimeout(function() { glow.remove(); }, 2500);
      // Lock bounce
      lock.style.transform = 'scale(2)';
      setTimeout(function() { lock.style.transform = 'scale(1)'; lock.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'; }, 800);
    },
    getCount: function() { return Object.keys(this.found).length; },
    getTotal: function() { return Object.keys(this.secrets).length; },
    getAssembledMessage: function() {
      var self = this;
      return this.secretOrder.map(function(id) {
        return self.found[id] ? self.secrets[id].fragment : '???';
      }).join(' ');
    }
  }
};
