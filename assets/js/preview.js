/*
 * Photo version preview (test site only).
 *   ?v=v12                    every photo from review/img/v12/
 *   ?v=v13&hero-product=v10   one photo from another version
 *   ?v=picks                  each photo as picked on the review page (review/reviews.json)
 * Without ?v= (or a photo override) nothing changes. Only this browser view is affected.
 */
(function () {
  'use strict';
  var VERS = ['v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8-nomark', 'v8-mark', 'v9', 'v10', 'v11', 'v12', 'v13'];
  var q = new URLSearchParams(location.search);
  var base = (document.currentScript && document.currentScript.src || '').replace(/assets\/js\/preview\.js.*$/, '');
  if (!base) return;

  var all = q.get('v'), over = {}, keep = [];
  q.forEach(function (val, key) {
    if (key === 'v') { if (val === 'picks' || VERS.indexOf(val) > -1) keep.push([key, val]); }
    else if (/^[a-z0-9-]+$/.test(key) && VERS.indexOf(val) > -1) { over[key] = val; keep.push([key, val]); }
  });
  if (!keep.length) return;
  var qs = keep.map(function (p) { return encodeURIComponent(p[0]) + '=' + encodeURIComponent(p[1]); }).join('&');

  function apply(picks) {
    var shown = {};
    document.querySelectorAll('img').forEach(function (img) {
      var m = (img.getAttribute('src') || '').match(/assets\/img\/([a-z0-9-]+)\.jpg$/);
      if (!m || m[1] === 'ogp') return;
      var f = m[1];
      var ver = over[f] || (all === 'picks' ? picks[f] : all);
      if (!ver || VERS.indexOf(ver) < 0) return;   // e.g. pick "redo": keep the current photo
      img.src = base + 'review/img/' + ver + '/' + f + '.jpg';
      shown[ver] = (shown[ver] || 0) + 1;
    });
    badge(shown);
  }

  // keep the preview while clicking through the site
  document.querySelectorAll('a[href]').forEach(function (a) {
    var h = a.getAttribute('href');
    if (!h || /^(#|mailto:|tel:|javascript:)/.test(h)) return;
    var u; try { u = new URL(h, location.href); } catch (e) { return; }
    if (u.origin !== location.origin || u.pathname.indexOf(new URL(base).pathname) !== 0) return;
    if (/\/(review|ci-guide)\//.test(u.pathname)) return;
    keep.forEach(function (p) { u.searchParams.set(p[0], p[1]); });
    a.setAttribute('href', u.pathname + u.search + u.hash);
  });

  function badge(shown) {
    var label = all === 'picks' ? '使う版（レビュー）' : (all || '現在のサイト');
    var extra = Object.keys(over).map(function (k) { return k + '=' + over[k]; }).join(', ');
    var el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;background:#163d3f;color:#fff;font:500 12px/1.5 system-ui,sans-serif;padding:8px 12px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.25);max-width:calc(100vw - 24px)';
    var exit = location.pathname + location.hash;
    el.innerHTML = '写真プレビュー：<b></b><span></span> <a style="color:#bfe6dc;margin-left:8px" href="' + exit + '">通常表示に戻る</a>';
    el.querySelector('b').textContent = label;
    el.querySelector('span').textContent = extra ? '（' + extra + '）' : '';
    document.body.appendChild(el);
  }

  if (all === 'picks') {
    fetch(base + 'review/reviews.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      var picks = {}; var rv = j.reviews || {};
      Object.keys(rv).forEach(function (k) { picks[k] = rv[k].pick; });
      apply(picks);
    }).catch(function () { apply({}); });
  } else apply({});
})();
