/* 有限会社ヘルシーライフ研究所 — site script (3R-B) */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };

  /* ---------- nav: mark current page ---------- */
  var here = location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '/') ;
  $$('.nav a, .foot-nav a, .sibs a').forEach(function (a) {
    var p = a.pathname.replace(/index\.html$/, '').replace(/\/+$/, '/');
    if (p === here) a.setAttribute('aria-current', 'page');
  });
  var section = document.body.getAttribute('data-section');
  if (section) $$('.nav [data-section="' + section + '"]').forEach(function (el) { el.classList.add('on'); });

  /* ---------- mobile menu ---------- */
  var menuBtn = $('#menuBtn'), nav = $('#nav');
  if (menuBtn && nav) {
    var closeNav = function () { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
    menuBtn.addEventListener('click', function () {
      menuBtn.setAttribute('aria-expanded', String(nav.classList.toggle('open')));
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { closeNav(); menuBtn.focus(); }
    });
    matchMedia('(min-width: 901px)').addEventListener('change', function (m) { if (m.matches) closeNav(); });
  }

  /* ---------- typed eyebrow ---------- */
  var typed = $('#typed');
  if (!reduce && typed) {
    var full = typed.textContent, i = 0; typed.textContent = '';
    setTimeout(function tick() { typed.textContent = full.slice(0, ++i); if (i < full.length) setTimeout(tick, 42 + Math.random() * 40); }, 350);
  }

  /* ---------- hero crosshair readout ---------- */
  var hf = $('#heroFrame'), ro = $('#readout');
  if (hf && ro) {
    hf.addEventListener('pointermove', function (e) {
      var r = hf.getBoundingClientRect();
      var x = clamp((e.clientX - r.left) / r.width), y = clamp((e.clientY - r.top) / r.height);
      hf.style.setProperty('--mx', (x * 100) + '%'); hf.style.setProperty('--my', (y * 100) + '%');
      ro.textContent = 'X ' + x.toFixed(3) + ' · Y ' + y.toFixed(3);
    });
  }

  /* ---------- protocol flow (home) ---------- */
  var flow = $('#flow'), steps = flow ? $$('.step', flow) : [];
  function proto() {
    if (!flow) return;
    var p = 1;
    if (!reduce) { var r = flow.getBoundingClientRect(), H = innerHeight; p = clamp((H * 0.95 - r.top) / (r.height * 0.6 + H * 0.35)); }
    var p1 = clamp(p * 2), p2 = clamp(p * 2 - 1);
    flow.style.setProperty('--p1', p1.toFixed(3)); flow.style.setProperty('--p2', p2.toFixed(3));
    steps[0].classList.toggle('on', p > 0.02);
    steps[1].classList.toggle('on', p1 >= 1);
    steps[2].classList.toggle('on', p2 >= 1);
  }

  /* ---------- service flow steps light up ---------- */
  var sflow = $$('.sflow li');
  function sflowSpy() {
    var line = innerHeight * 0.62;
    sflow.forEach(function (li) { li.classList.toggle('on', li.getBoundingClientRect().top < line); });
  }

  /* ---------- header, page scale ---------- */
  var hd = $('#hd'), scale = $('#scale'), sLbl = scale ? $('span', scale) : null;
  function onScroll() {
    var y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (hd) hd.classList.toggle('scrolled', y > 8);
    if (scale) {
      var f = max > 0 ? y / max : 0;
      scale.style.setProperty('--sp', (f * 100).toFixed(2) + '%');
      sLbl.textContent = String(Math.round(f * 100)).padStart(3, '0') + ' %';
    }
    proto(); sflowSpy();
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- reveal on scroll (only items below the fold) ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var below = steps.filter(function (el) { return el.getBoundingClientRect().top > innerHeight; });
    below.forEach(function (el) { el.classList.add('pre'); });
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { var el = en.target; setTimeout(function () { el.classList.remove('pre'); }, steps.indexOf(el) * 260); io2.unobserve(el); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    below.forEach(function (el) { io2.observe(el); });

    var items = $$('.rv').filter(function (el) { return el.getBoundingClientRect().top > innerHeight; });
    items.forEach(function (el) { el.classList.add('pre'); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var sib = Array.prototype.filter.call(en.target.parentElement.children, function (c) { return c.classList.contains('rv'); });
        en.target.style.transitionDelay = (Math.min(5, Math.max(0, sib.indexOf(en.target))) * 80) + 'ms';
        en.target.classList.remove('pre'); io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero slider (home) ---------- */
  (function () {
    var hs = $('#hs'); if (!hs) return;
    var DUR = 6000, FADE = 1200;
    var frame = $('#heroFrame'), track = $('#hsTrack');
    var slides = $$('.hs-slide', hs), dots = $$('.hs-dot');
    var btn = $('#hsPlay'), tag = $('#hsTag'), scan = $('#hsScan');
    var names = ['Research', 'Products', 'Food'];
    var cur = 0, t = 0, last = performance.now(), playing = !reduce, hover = false, focus = false, inView = true, wasTimer;
    function setPlay(p) {
      playing = p;
      btn.dataset.state = p ? 'playing' : 'paused';
      btn.setAttribute('aria-label', p ? '自動切り替えを一時停止' : '自動切り替えを再開');
      track.setAttribute('aria-live', p ? 'off' : 'polite');
    }
    function go(i) {
      i = (i + slides.length) % slides.length;
      if (i === cur) return;
      clearTimeout(wasTimer);
      slides.forEach(function (s) { s.classList.remove('was'); });
      slides[cur].classList.remove('is-on'); slides[cur].classList.add('was');
      slides[i].classList.add('is-on');
      var prev = slides[cur]; wasTimer = setTimeout(function () { prev.classList.remove('was'); }, FADE + 60);
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); d.style.setProperty('--p', 0); });
      tag.textContent = 'Sample 0' + (i + 1) + ' / 03 · ' + names[i];
      if (!reduce) { scan.classList.remove('go'); void scan.offsetWidth; scan.classList.add('go'); }
      cur = i; t = 0;
    }
    function tick() {
      var now = performance.now(), dt = Math.min(now - last, 100); last = now;
      if (playing && !hover && !focus && inView && !document.hidden) {
        t += dt;
        dots[cur].style.setProperty('--p', Math.min(t / DUR, 1).toFixed(4));
        if (t >= DUR) go(cur + 1);
      }
    }
    btn.addEventListener('click', function () { setPlay(!playing); });
    dots.forEach(function (d, k) {
      d.addEventListener('click', function () { go(k); });
      d.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var n = (k + (e.key === 'ArrowRight' ? 1 : -1) + dots.length) % dots.length;
          go(n); dots[n].focus();
        }
      });
    });
    frame.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    frame.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hover = false; });
    frame.addEventListener('focusin', function () { focus = true; });
    frame.addEventListener('focusout', function (e) { if (!frame.contains(e.relatedTarget)) focus = false; });
    var sx = null, sy = null;
    hs.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
    hs.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
    });
    hs.addEventListener('pointercancel', function () { sx = null; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (en) { inView = en.isIntersecting; }); }, { threshold: 0.25 }).observe(frame);
    }
    setPlay(playing);
    setInterval(tick, 50);
  })();

  /* ---------- contact form: validate → confirm → send ---------- */
  (function () {
    var form = $('#contactForm'); if (!form) return;
    var stepsInd = $$('.steps-ind li');
    var setStep = function (n) { stepsInd.forEach(function (li, k) { if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); }); };

    var q = new URLSearchParams(location.search);
    if (q.get('type') === 'recruit') { var r = $('#t-recruit'); if (r) r.checked = true; }

    function fieldOf(el) { return el.closest('.field, .agree'); }
    function check(name) {
      var els = form.elements[name]; if (!els) return true;
      var list = els.length !== undefined && !els.tagName ? Array.prototype.slice.call(els) : [els];
      var first = list[0], wrap = fieldOf(first), ok = true;
      if (first.type === 'radio' || first.type === 'checkbox') ok = list.some(function (x) { return x.checked; });
      else {
        var v = first.value.trim();
        ok = v !== '';
        if (ok && first.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        if (ok && first.type === 'tel') ok = /^[0-9０-９+\-‐ー()（） ]{9,}$/.test(v);
      }
      if (wrap) wrap.classList.toggle('invalid', !ok);
      list.forEach(function (x) { x.setAttribute('aria-invalid', String(!ok)); });
      return ok;
    }
    var required = ['kind', 'fullname', 'tel', 'email', 'topic', 'agree'];
    required.forEach(function (n) {
      var els = form.elements[n]; if (!els) return;
      var list = els.length !== undefined && !els.tagName ? Array.prototype.slice.call(els) : [els];
      list.forEach(function (x) { x.addEventListener(x.type === 'radio' || x.type === 'checkbox' ? 'change' : 'blur', function () { if (fieldOf(x).classList.contains('invalid') || x.type !== 'radio') check(n); }); });
    });

    var out = $('#confirmBody');
    function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function summary() {
      var rows = [
        ['お問い合わせ種類', $$('input[name=kind]:checked', form).map(function (x) { return x.value; }).join('')],
        ['お名前', form.elements.fullname.value],
        ['会社名', form.elements.company.value],
        ['部署・役職', form.elements.position.value],
        ['電話番号', form.elements.tel.value],
        ['メールアドレス', form.elements.email.value],
        ['お問合せ種別', $$('input[name=topic]:checked', form).map(function (x) { return x.value; }).join('\n')],
        ['お問い合わせ内容詳細', form.elements.message.value]
      ];
      out.innerHTML = rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + (esc(r[1].trim()) || '<span style="color:var(--muted)">（未入力）</span>') + '</td></tr>'; }).join('');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.classList.contains('confirming')) {
        var bad = required.filter(function (n) { return !check(n); });
        if (bad.length) {
          var el = form.elements[bad[0]]; el = el.length !== undefined && !el.tagName ? el[0] : el;
          fieldOf(el).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
          setTimeout(function () { el.focus({ preventScroll: true }); }, reduce ? 0 : 350);
          return;
        }
        summary();
        form.classList.add('confirming'); setStep(1);
        form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        $('#confirmTitle').focus({ preventScroll: true });
        return;
      }
      /* send: set data-endpoint on the form to a mail/CRM endpoint (e.g. a PHP mailer or WordPress REST endpoint). */
      var endpoint = form.getAttribute('data-endpoint');
      var btn = $('#sendBtn'); btn.disabled = true;
      var finish = function () { location.href = 'thanks.html'; };
      if (!endpoint) { finish(); return; }
      fetch(endpoint, { method: 'POST', body: new FormData(form) })
        .then(function (res) { if (!res.ok) throw new Error(res.status); finish(); })
        .catch(function () { btn.disabled = false; alert('送信に失敗しました。時間をおいて再度お試しいただくか、お電話でお問い合わせください。'); });
    });
    $('#backBtn').addEventListener('click', function () {
      form.classList.remove('confirming'); setStep(0);
      form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  })();
})();
