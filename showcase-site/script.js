/**
 * BLINDSIDE DYNASTY — Interactive Showcase Script
 * A Kind of a Big Dill (KBD) Product
 */

(function () {
  'use strict';

  // 1. Dynamic 6-Theme Accent Switcher HUD
  const themeDots = document.querySelectorAll('.theme-dot');
  const currentSavedTheme = localStorage.getItem('dynasty_accent_color') || 'orange';

  function applyTheme(themeId) {
    if (themeId === 'orange') {
      document.body.removeAttribute('data-theme');
    } else {
      document.body.setAttribute('data-theme', themeId);
    }

    themeDots.forEach(dot => {
      if (dot.getAttribute('data-theme') === themeId) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    localStorage.setItem('dynasty_accent_color', themeId);
  }

  // Initialize saved theme
  applyTheme(currentSavedTheme);

  themeDots.forEach(dot => {
    dot.addEventListener('click', function () {
      const themeId = this.getAttribute('data-theme');
      applyTheme(themeId);
    });
  });

  // 2. Mobile Navigation & Dropdowns
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Dropdowns
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  dropdowns.forEach(function (dropdown) {
    const trigger = dropdown.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      dropdowns.forEach(function (other) {
        if (other !== dropdown) {
          other.classList.remove('is-open');
          const otherTrigger = other.querySelector('.nav-dropdown-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });

  document.addEventListener('click', function () {
    dropdowns.forEach(function (dropdown) {
      dropdown.classList.remove('is-open');
      const trigger = dropdown.querySelector('.nav-dropdown-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      dropdowns.forEach(function (dropdown) {
        dropdown.classList.remove('is-open');
        const trigger = dropdown.querySelector('.nav-dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // 3. Count-Up Animation Engine
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCountUp(el, duration) {
    const raw = el.getAttribute('data-cu-original') || el.textContent;
    const match = raw.match(/-?[\d,]*\.?\d+/);
    if (!match) return;

    const target = parseFloat(match[0].replace(/,/g, ''));
    if (isNaN(target)) return;

    const decimals = (match[0].split('.')[1] || '').length;
    const prefix = raw.slice(0, match.index);
    const suffix = raw.slice(match.index + match[0].length);
    let start = null;

    function tick(ts) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = prefix + value.toFixed(decimals) + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.innerHTML = el.getAttribute('data-cu-html') || raw;
      }
    }
    requestAnimationFrame(tick);
  }

  function primeCountUps(root) {
    const els = root.querySelectorAll('.cu, .cu-mixed');
    els.forEach(function (el) {
      if (el.hasAttribute('data-cu-html')) return;
      el.setAttribute('data-cu-html', el.innerHTML);
      el.setAttribute('data-cu-original', el.textContent);
    });
    return els;
  }

  function runCountUps(els) {
    if (reduceMotion) return;
    els.forEach(function (el, i) {
      setTimeout(function () {
        animateCountUp(el, 1000);
      }, i * 50);
    });
  }

  // 4. Scroll Reveal Animations (IntersectionObserver)
  const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach(function (el) {
    primeCountUps(el);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        runCountUps(primeCountUps(entry.target));
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  // 5. Mobile Download Platform Switcher & 1-Click PWA Install Trigger
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const pwaBtn = document.getElementById('btn-pwa-install');
    if (pwaBtn) {
      pwaBtn.textContent = 'Install App on This Device';
    }
  });

  const pwaInstallBtn = document.getElementById('btn-pwa-install');
  if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          pwaInstallBtn.textContent = 'App Installed Successfully!';
        }
        deferredInstallPrompt = null;
      } else {
        window.open('https://ffdashboard.kindofabigdill.world', '_blank');
      }
    });
  }

  const platformBtns = document.querySelectorAll('.platform-btn');
  const androidGuide = document.getElementById('guide-android');
  const iosGuide = document.getElementById('guide-ios');

  if (platformBtns.length && androidGuide && iosGuide) {
    platformBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const platform = this.getAttribute('data-platform');
        platformBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        if (platform === 'android') {
          androidGuide.style.display = 'flex';
          iosGuide.style.display = 'none';
        } else {
          androidGuide.style.display = 'none';
          iosGuide.style.display = 'flex';
        }
      });
    });
  }

  // 6. Interactive Cross-Reference Metric Switcher
  const crossPills = document.querySelectorAll('.cross-pill');
  const matrixScatterPlot = document.getElementById('matrix-scatter-plot');

  const SCATTER_PRESETS = {
    'age-target': [
      { name: 'Justin Jefferson', x: 25.2, y: 31.4, col: '#22c55e', pos: 'WR' },
      { name: 'CeeDee Lamb', x: 25.8, y: 29.8, col: '#22c55e', pos: 'WR' },
      { name: 'Malik Nabers', x: 21.6, y: 32.8, col: '#38bdf8', pos: 'WR' },
      { name: 'Marvin Harrison Jr', x: 22.1, y: 24.2, col: '#38bdf8', pos: 'WR' },
      { name: 'Davante Adams', x: 31.8, y: 27.5, col: '#eab308', pos: 'WR' },
      { name: 'Stefon Diggs', x: 30.9, y: 21.0, col: '#ef4444', pos: 'WR' }
    ],
    'epa-snap': [
      { name: 'Josh Allen', x: 98.2, y: 0.28, col: '#a855f7', pos: 'QB' },
      { name: 'Lamar Jackson', x: 95.4, y: 0.34, col: '#a855f7', pos: 'QB' },
      { name: 'Breece Hall', x: 74.0, y: 0.12, col: '#22c55e', pos: 'RB' },
      { name: 'Bijan Robinson', x: 78.5, y: 0.16, col: '#22c55e', pos: 'RB' },
      { name: 'Trey McBride', x: 86.0, y: 0.18, col: '#38bdf8', pos: 'TE' },
      { name: 'Brock Bowers', x: 76.5, y: 0.22, col: '#38bdf8', pos: 'TE' }
    ],
    'yards-int': [
      { name: 'Joe Burrow', x: 4450, y: 8, col: '#22c55e', pos: 'QB' },
      { name: 'Patrick Mahomes', x: 4620, y: 11, col: '#22c55e', pos: 'QB' },
      { name: 'Baker Mayfield', x: 4180, y: 12, col: '#eab308', pos: 'QB' },
      { name: 'Will Levis', x: 2350, y: 14, col: '#ef4444', pos: 'QB' }
    ]
  };

  if (crossPills.length && matrixScatterPlot) {
    crossPills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        crossPills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        const metric = this.getAttribute('data-metric');
        renderScatterNodes(metric);
      });
    });

    function renderScatterNodes(key) {
      const data = SCATTER_PRESETS[key] || SCATTER_PRESETS['age-target'];
      const nodesContainer = matrixScatterPlot.querySelector('.scatter-nodes-layer');
      if (!nodesContainer) return;

      nodesContainer.innerHTML = '';
      data.forEach((p, idx) => {
        const left = 15 + (idx * 14) + (Math.random() * 8);
        const top = 18 + (Math.random() * 55);
        const node = document.createElement('div');
        node.className = 'matrix-team-node';
        node.style.left = `${left}%`;
        node.style.top = `${top}%`;
        node.innerHTML = `<span class="node-dot" style="background:${p.col}"></span> ${p.name} (${p.pos})`;
        nodesContainer.appendChild(node);
      });
    }
  }

  // 7. Interactive Audio Simulation for Coach Madden
  const maddenAudioBtn = document.getElementById('madden-voice-btn');
  if (maddenAudioBtn) {
    maddenAudioBtn.addEventListener('click', function () {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = "Boom! Now look at this trade right here! You're giving up a 2027 late first for an elite WR1 in his absolute prime! If you wanna hoist that trophy, you make that deal every single day!";
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 0.85;
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
        
        maddenAudioBtn.textContent = 'Coach Madden Audio Playing...';
        utterance.onend = function () {
          maddenAudioBtn.textContent = 'Play Coach Madden Voice Breakdown';
        };
      } else {
        alert("Coach Madden says: BOOM! You're robbing this guy blind on draft capital!");
      }
    });
  }

  // 8. Email Signups / Waitlist Handler
  const form = document.getElementById('updates-form');
  const emailInput = document.getElementById('updates-email');
  const submitBtn = document.getElementById('updates-submit');
  const status = document.getElementById('updates-status');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Connecting…';
      status.textContent = '';
      status.className = 'updates-status';

      setTimeout(() => {
        status.textContent = "You're on the War Room priority list — we'll notify you when new features drop!";
        status.className = 'updates-status is-ok';
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Join War Room';
      }, 600);
    });
  }

})();
