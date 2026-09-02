/* DROIT — progressive enhancement only. Every page works with this file blocked. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Header: solid once you scroll off the hero ---- */
  var header = document.querySelector('.site-header');
  if (header && !header.dataset.bound) {
    header.dataset.bound = '1';
    var onScroll = function () {
      header.classList.toggle('is-solid', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile nav ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav && !toggle.dataset.bound) {
    toggle.dataset.bound = '1';
    var setNav = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setNav(false);
    });
  }

  /* ---- Reveal on scroll + chart/counter triggers ---- */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduced) {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-in');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-count]'), function (el) {
      el.textContent = el.getAttribute('data-count');
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          Array.prototype.forEach.call(entry.target.querySelectorAll('[data-count]'), countUp);
          if (entry.target.hasAttribute('data-count')) countUp(entry.target);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    Array.prototype.forEach.call(revealables, function (el) {
      io.observe(el);
    });
  }

  /* Count a number up to its final value, preserving prefix/suffix. */
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var target = el.getAttribute('data-count') || el.textContent;
    var match = target.match(/^([^0-9]*)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/);
    if (!match) {
      el.textContent = target;
      return;
    }
    var prefix = match[1];
    var raw = match[2].replace(/,/g, '');
    var suffix = match[3];
    var end = parseFloat(raw);
    var decimals = (raw.split('.')[1] || '').length;
    var grouped = match[2].indexOf(',') > -1;
    var start = performance.now();
    var dur = 1100;
    var fmt = function (n) {
      var s = n.toFixed(decimals);
      if (grouped) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals });
      return prefix + s + suffix;
    };
    var tick = function (now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(end * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
  }

  /* ---- Store finder: live search + state filter ---- */
  var finder = document.querySelector('[data-finder]');
  if (finder) {
    var input = finder.querySelector('[data-finder-input]');
    var clear = finder.querySelector('[data-finder-clear]');
    var filters = finder.querySelectorAll('[data-state]');
    var grid = document.querySelector('[data-store-grid]');
    var cards = grid ? grid.querySelectorAll('[data-store]') : [];
    var count = finder.querySelector('[data-finder-count]');
    var empty = document.querySelector('[data-finder-empty]');
    var state = 'all';

    var apply = function () {
      var q = (input.value || '').trim().toLowerCase();
      var shown = 0;
      Array.prototype.forEach.call(cards, function (card) {
        var matchState = state === 'all' || card.getAttribute('data-state') === state;
        var matchText = !q || card.getAttribute('data-search').indexOf(q) > -1;
        var show = matchState && matchText;
        card.classList.toggle('is-hidden', !show);
        if (show) shown++;
      });
      if (count) {
        count.innerHTML =
          shown === cards.length
            ? '<b>' + cards.length + '</b> stores open, all with 24/7 access'
            : '<b>' + shown + '</b> of ' + cards.length + ' stores match';
      }
      if (empty) empty.classList.toggle('is-on', shown === 0);
      if (clear) clear.classList.toggle('is-on', q.length > 0);
    };

    input.addEventListener('input', apply);
    if (clear) {
      clear.addEventListener('click', function () {
        input.value = '';
        input.focus();
        apply();
      });
    }
    Array.prototype.forEach.call(filters, function (btn) {
      btn.addEventListener('click', function () {
        state = btn.getAttribute('data-state');
        Array.prototype.forEach.call(filters, function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        apply();
      });
    });
    apply();
  }
})();
