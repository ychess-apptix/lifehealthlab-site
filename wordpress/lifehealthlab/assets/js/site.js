/* 有限会社ヘルシーライフ研究所 — theme script (3R-B), adapted for WordPress block markup */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var norm = function (p) { return (p || '/').replace(/index\.html$/, '').replace(/\/*$/, '/'); };

  /* ---------- decorative text is hidden from screen readers ---------- */
  $$('.sec-idx, .en-big, .sec-count, .who-meta, .co-meta, .margin, .code404, .idx-row .ar, .proto-hd > p:last-child').forEach(function (el) { el.setAttribute('aria-hidden', 'true'); });

  /* ---------- nav: mark current page / section ---------- */
  var here = norm(location.pathname);
  $$('.nav a, .foot-nav a, .sibs a').forEach(function (a) {
    if (a.host === location.host && norm(a.pathname) === here) a.setAttribute('aria-current', 'page');
  });
  $$('.nav .lk').forEach(function (a) {
    var p = norm(a.pathname);
    if (p !== '/' && here.indexOf(p) === 0) a.classList.add('on');
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = $('.hd .menu-btn'), nav = $('.hd .nav');
  if (menuBtn && nav) {
    nav.id = nav.id || 'nav';
    menuBtn.setAttribute('aria-controls', nav.id);
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
  var eyebrow = $('.eyebrow');
  if (eyebrow) {
    var typed = $('#typed', eyebrow) || eyebrow.lastElementChild;
    var caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
    eyebrow.appendChild(caret);
    if (!reduce && typed) {
      eyebrow.setAttribute('aria-label', typed.textContent);
      typed.setAttribute('aria-hidden', 'true');
      var full = typed.textContent, i = 0; typed.textContent = '';
      setTimeout(function tick() { typed.textContent = full.slice(0, ++i); if (i < full.length) setTimeout(tick, 42 + Math.random() * 40); }, 350);
    }
  }

  /* ---------- hero crosshair readout ---------- */
  var hf = $('.hero-frame'), ro = $('.hero-frame .readout');
  if (hf && ro) {
    hf.addEventListener('pointermove', function (e) {
      var r = hf.getBoundingClientRect();
      var x = clamp((e.clientX - r.left) / r.width), y = clamp((e.clientY - r.top) / r.height);
      hf.style.setProperty('--mx', (x * 100) + '%'); hf.style.setProperty('--my', (y * 100) + '%');
      ro.textContent = 'X ' + x.toFixed(3) + ' · Y ' + y.toFixed(3);
    });
  }

  /* ---------- protocol flow (home) ---------- */
  var flow = $('.flow'), steps = flow ? $$('.step', flow) : [];
  function proto() {
    if (!flow || steps.length < 3) return;
    var p = 1;
    if (!reduce) { var r = flow.getBoundingClientRect(), H = innerHeight; p = clamp((H * 0.95 - r.top) / (r.height * 0.6 + H * 0.35)); }
    var p1 = clamp(p * 2), p2 = clamp(p * 2 - 1);
    flow.style.setProperty('--p1', p1.toFixed(3)); flow.style.setProperty('--p2', p2.toFixed(3));
    steps[0].classList.toggle('on', p > 0.02);
    steps[1].classList.toggle('on', p1 >= 1);
    steps[2].classList.toggle('on', p2 >= 1);
  }

  /* ---------- service flow steps light up ---------- */
  var sflow = $$('.sflow > li');
  function sflowSpy() {
    var line = innerHeight * 0.62;
    sflow.forEach(function (li) { li.classList.toggle('on', li.getBoundingClientRect().top < line); });
  }

  /* ---------- header, page scale ---------- */
  var hd = $('.hd');
  var scale = document.createElement('div');
  scale.className = 'scale'; scale.setAttribute('aria-hidden', 'true'); scale.innerHTML = '<i></i><span>000</span>';
  document.body.appendChild(scale);
  var sLbl = $('span', scale);
  function onScroll() {
    var y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (hd) hd.classList.toggle('scrolled', y > 8);
    var f = max > 0 ? y / max : 0;
    scale.style.setProperty('--sp', (f * 100).toFixed(2) + '%');
    sLbl.textContent = String(Math.round(f * 100)).padStart(3, '0') + ' %';
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

  /* ---------- hero slider (home): slides are editable image blocks; controls are built here ---------- */
  (function () {
    var hs = $('.hs'); if (!hs) return;
    var DUR = 5000, FADE = 1200;
    var frame = hs.closest('.hero-frame') || hs, track = $('.hs-track', hs) || hs;
    var slides = $$('.hs-slide', hs); if (!slides.length) return;
    var labelOf = function (s, k) { var c = $('figcaption', s); return c ? c.textContent.trim() : String(k + 1); };
    var names = ['Research', 'Products', 'Food', 'Sample', 'Sample', 'Sample'];
    var n = slides.length, pad = function (k) { return ('0' + k).slice(-2); };

    hs.setAttribute('role', 'region'); hs.setAttribute('aria-roledescription', 'carousel');
    hs.setAttribute('aria-label', 'メインビジュアル（' + n + '枚の写真が5秒ごとに切り替わります）');
    track.setAttribute('aria-live', 'off');
    slides.forEach(function (s, k) {
      s.setAttribute('role', 'group'); s.setAttribute('aria-roledescription', 'slide');
      s.setAttribute('aria-label', (k + 1) + ' / ' + n + '：' + labelOf(s, k));
      s.classList.toggle('is-on', k === 0);
      var img = $('img', s); if (img && k > 0) img.loading = 'lazy';
    });
    var scan = document.createElement('span'); scan.className = 'hs-scan'; scan.setAttribute('aria-hidden', 'true'); hs.appendChild(scan);

    var ctrl = document.createElement('div'); ctrl.className = 'hs-ctrl';
    ctrl.innerHTML = '<button class="hs-btn" type="button" data-state="playing" aria-label="自動切り替えを一時停止">' +
      '<svg class="i-pause" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.2" height="12" fill="currentColor"/><rect x="9.8" y="2" width="3.2" height="12" fill="currentColor"/></svg>' +
      '<svg class="i-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.2v11.6L13.6 8z" fill="currentColor"/></svg></button>' +
      '<div class="hs-dots" role="group" aria-label="表示する写真を選ぶ" style="grid-template-columns:repeat(' + n + ',minmax(0,1fr))">' +
      slides.map(function (s, k) {
        var l = labelOf(s, k);
        return '<button class="hs-dot" type="button" aria-current="' + (k === 0) + '" aria-label="' + (k + 1) + '枚目：' + l + '"><b>' + pad(k + 1) + '</b><span>' + l + '</span><i aria-hidden="true"></i></button>';
      }).join('') + '</div>';
    frame.appendChild(ctrl);

    var dots = $$('.hs-dot', ctrl), btn = $('.hs-btn', ctrl), tag = $('#hsTag') || $('.hero-frame > .tag');
    var setTag = function (i) { if (tag) tag.textContent = 'Sample ' + pad(i + 1) + ' / ' + pad(n) + ' · ' + (names[i] || labelOf(slides[i], i)); };
    setTag(0);
    var cur = 0, t = 0, last = performance.now(), playing = !reduce, hover = false, focus = false, inView = true, wasTimer;
    function setPlay(p) {
      playing = p;
      btn.dataset.state = p ? 'playing' : 'paused';
      btn.setAttribute('aria-label', p ? '自動切り替えを一時停止' : '自動切り替えを再開');
      track.setAttribute('aria-live', p ? 'off' : 'polite');
    }
    function go(i) {
      i = (i + n) % n;
      if (i === cur) return;
      clearTimeout(wasTimer);
      slides.forEach(function (s) { s.classList.remove('was'); });
      slides[cur].classList.remove('is-on'); slides[cur].classList.add('was');
      slides[i].classList.add('is-on');
      var prev = slides[cur]; wasTimer = setTimeout(function () { prev.classList.remove('was'); }, FADE + 60);
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); d.style.setProperty('--p', 0); });
      setTag(i);
      if (!reduce) { scan.classList.remove('go'); void scan.offsetWidth; scan.classList.add('go'); }
      cur = i; t = 0;
    }
    function tick() {
      var now = performance.now(), dt = Math.min(now - last, 100); last = now;
      if (playing && !hover && !focus && inView && !document.hidden && n > 1) {
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
          var m = (k + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
          go(m); dots[m].focus();
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

  /* ---------- contact form (Contact Form 7): validate → confirm → send ---------- */
  (function () {
    var form = $('.wpcf7 form.form'); if (!form) return;
    var stepsInd = $$('.steps-ind li');
    var setStep = function (n) { stepsInd.forEach(function (li, k) { li.classList.toggle('is-current', k === n); if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); }); };
    setStep(0);
    var scrollOpt = { behavior: reduce ? 'auto' : 'smooth', block: 'start' };

    var q = new URLSearchParams(location.search);
    if (q.get('type') === 'recruit') {
      $$('input[name="kind"]', form).forEach(function (x) { if (x.value === '求人応募') x.checked = true; });
    }

    var els = function (name) { return $$('[name="' + name + '"]', form); };
    function fieldOf(el) { return el.closest('.field, .agree'); }
    function check(name) {
      var list = els(name); if (!list.length) return true;
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
    var required = ['kind', 'fullname', 'tel', 'email', 'topic[]', 'agree'];
    required.forEach(function (n) {
      els(n).forEach(function (x) {
        x.addEventListener(x.type === 'radio' || x.type === 'checkbox' ? 'change' : 'blur', function () {
          var w = fieldOf(x); if ((w && w.classList.contains('invalid')) || x.type !== 'radio') check(n);
        });
      });
    });

    var out = $('#confirmBody', form);
    function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function val(name) { var e = els(name)[0]; return e ? e.value : ''; }
    function checked(name, sep) { return els(name).filter(function (x) { return x.checked; }).map(function (x) { return x.value; }).join(sep); }
    function summary() {
      var rows = [
        ['お問い合わせ種類', checked('kind', '')],
        ['お名前', val('fullname')],
        ['会社名', val('company')],
        ['部署・役職', val('position')],
        ['電話番号', val('tel')],
        ['メールアドレス', val('email')],
        ['お問合せ種別', checked('topic[]', '\n')],
        ['お問い合わせ内容詳細', val('message')]
      ];
      out.innerHTML = rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + (esc(r[1].trim()) || '<span style="color:var(--muted)">（未入力）</span>') + '</td></tr>'; }).join('');
    }
    function backToInput() {
      form.classList.remove('confirming'); setStep(0);
      form.scrollIntoView(scrollOpt);
    }

    /* Runs before Contact Form 7's own submit handler (capture phase on document). */
    document.addEventListener('submit', function (e) {
      if (e.target !== form || form.classList.contains('confirming')) return; /* confirming → let CF7 send */
      e.preventDefault(); e.stopImmediatePropagation();
      var bad = required.filter(function (n) { return !check(n); });
      if (bad.length) {
        var el = els(bad[0])[0];
        fieldOf(el).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        setTimeout(function () { el.focus({ preventScroll: true }); }, reduce ? 0 : 350);
        return;
      }
      summary();
      form.classList.add('confirming'); setStep(1);
      form.scrollIntoView(scrollOpt);
      var ct = $('#confirmTitle', form); if (ct) ct.focus({ preventScroll: true });
    }, true);

    var back = $('#backBtn', form); if (back) back.addEventListener('click', backToInput);
    form.closest('.wpcf7').addEventListener('wpcf7mailsent', function () { location.href = (window.LHL && LHL.thanks) || '/contact/thanks/'; });
    form.closest('.wpcf7').addEventListener('wpcf7invalid', backToInput);
    form.closest('.wpcf7').addEventListener('wpcf7mailfailed', function () {
      alert('送信に失敗しました。時間をおいて再度お試しいただくか、お電話でお問い合わせください。');
    });
  })();
})();
