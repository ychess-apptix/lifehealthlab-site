/*
 * lifehealthlab static site → WordPress block content.
 *
 * Run in a wp-admin block-editor tab (post-new.php?post_type=page) of the target site,
 * with the "Healthy Life Laboratory" theme active (it registers lhl/decor).
 * Uses WordPress's own block API (createBlock + serialize), so every block is valid
 * for that WordPress version. Source pages and images are read from the public repo.
 *
 *   await LHLC.media()        upload assets/img/* to the Media Library (skips existing)
 *   await LHLC.synced()       create/update synced patterns (CTA band, service list, privacy text)
 *   await LHLC.parts()        header / footer template parts + 404 template
 *   await LHLC.pages()        create/update all pages, set the front page
 *   LHLC.preview('service/ec.html')  → serialized markup for one page (no saving)
 */
window.LHLC = (function () {
  'use strict';
  var RAW = 'https://raw.githubusercontent.com/ychess-apptix/lifehealthlab-site/main/';
  var THEME = 'lifehealthlab';
  var B = wp.blocks, api = wp.apiFetch;
  var STATE = JSON.parse(localStorage.getItem('LHLC') || '{"media":{},"synced":{}}');
  var save = function () { localStorage.setItem('LHLC', JSON.stringify(STATE)); };
  var warnings = [];
  var warn = function (m) { warnings.push(m); console.warn('[LHLC]', m); };

  var IMAGES = ['company-hero.jpg', 'div-foodservice.jpg', 'div-healthcare.jpg', 'div-media-ec.jpg', 'ec-hero.jpg', 'ec-policy.jpg', 'healthcare-hero.jpg', 'healthcare-policy.jpg', 'hero-food.jpg', 'hero-product.jpg', 'hero-research.jpg', 'logo.png', 'message-desk.jpg', 'message-hero.jpg', 'overview-hero.jpg', 'publishing-hero.jpg', 'publishing-policy.jpg', 'recruit-entry.jpg', 'recruit-hero.jpg', 'recruit-programs.jpg', 'restaurant-hero.jpg', 'restaurant-policy.jpg', 'service-hero.jpg', 'svc-ec.jpg', 'svc-healthcare.jpg', 'svc-publishing.jpg', 'svc-restaurant.jpg', 'top-office.jpg', 'top-recruit.jpg', 'top-who.jpg'];

  /* page source → WordPress page (parents first) */
  var PAGES = [
    { src: 'index.html', slug: 'top', front: true, order: 0 },
    { src: 'company/index.html', slug: 'company', order: 10 },
    { src: 'company/message.html', slug: 'message', parent: 'company', order: 11 },
    { src: 'company/overview.html', slug: 'overview', parent: 'company', order: 12 },
    { src: 'service/index.html', slug: 'service', order: 20 },
    { src: 'service/healthcare.html', slug: 'healthcare', parent: 'service', order: 21 },
    { src: 'service/restaurant.html', slug: 'restaurant', parent: 'service', order: 22 },
    { src: 'service/publishing.html', slug: 'publishing', parent: 'service', order: 23 },
    { src: 'service/ec.html', slug: 'ec', parent: 'service', order: 24 },
    { src: 'recruit/index.html', slug: 'recruit', order: 30 },
    { src: 'contact/index.html', slug: 'contact', order: 40 },
    { src: 'contact/thanks.html', slug: 'thanks', parent: 'contact', order: 41 },
    { src: 'privacy/index.html', slug: 'privacy', order: 50 }
  ];
  var SYNCED = { cta: 'CTA：採用情報・お問い合わせ', sibs: 'サービス一覧ナビ', 'privacy-body': '個人情報保護方針（本文）' };

  var DECOR = [['svg.mol', 'hero-mol'], ['.step-ic.ic-mag', 'step-mag'], ['.step-ic.ic-flask', 'step-flask'], ['.step-ic.ic-spark', 'step-spark'],
    ['li.conn.c1', 'conn-1'], ['li.conn.c2', 'conn-2'], ['svg.venn', 'venn'], ['svg.wave', 'wave'], ['span.avatar', 'avatar'], ['span.seal', 'seal'], ['button.menu-btn', 'menu-btn']];
  var DROP = '.crop, .ruler, .pm, .caret-d, .caret, .vruler, .xh, .readout, .hs-scan, .hs-ctrl, #hsTag, .btn > .arr, .chip > .arr, .more > .arr, .skip, .scale';
  var STYLE = {
    'margin:0': '', 'margin-top:12px': 'mt-12', 'margin-bottom:18px': 'mb-18', 'padding-top:24px': 'pt-24', 'margin-top:80px': 'mt-80', 'margin-top:56px': 'mt-56',
    'justify-content:center': 'jc-center', 'height:clamp(320px,38vw,460px)': 'map-frame', 'font-size:22px;margin:6px 0 24px': 'pp-title',
    'color:var(--ink-2)': 'c-ink2', 'color:var(--ink)': 'c-ink', 'aspect-ratio:4/3': 'ar-43',
    'object-position:50% 50%': '', 'object-position:58% 50%': 'op-58-50', 'object-position:30% 50%': 'op-30-50', 'object-position:50% 20%': 'op-50-20'
  };
  var INLINE = { SPAN: 1, B: 1, STRONG: 1, EM: 1, SMALL: 1, A: 1, BR: 1, I: 1, TIME: 1, CODE: 1, ABBR: 1, SUP: 1, SUB: 1, MARK: 1, IMG: 1, S: 1, U: 1 };
  var GROUP_TAGS = { DIV: 1, SECTION: 1, ARTICLE: 1, ASIDE: 1, NAV: 1, HEADER: 1, FOOTER: 1, MAIN: 1, UL: 1, OL: 1, LI: 1 };

  /* ---------- helpers ---------- */
  function text(url) { return fetch(RAW + url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); }); }
  function meta(raw) {
    var m = raw.match(/^\s*<!--meta([\s\S]*?)-->/), o = { title: '', desc: '' };
    if (m) m[1].split(/\r?\n/).forEach(function (l) { var k = l.match(/^\s*(\w+)\s*:\s*(.*)$/); if (k) o[k[1]] = k[2].trim(); });
    o.body = m ? raw.slice(m[0].length) : raw;
    return o;
  }
  function link(href) {
    if (!href) return href;
    href = href.replace(/\{\{root\}\}/g, '');
    if (/^(https?:|mailto:|tel:|#)/.test(href)) return href;
    var q = '', i = href.search(/[?#]/);
    if (i >= 0) { q = href.slice(i); href = href.slice(0, i); }
    href = href.replace(/^\/+/, '').replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '/');
    return '/' + href + q;
  }
  function imgUrl(src) { var f = (src || '').split('/').pop(); return STATE.media[f] || null; }
  function cls(el) {
    var c = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
    var st = (el.getAttribute('style') || '').replace(/\s+/g, '').replace(/;$/, '');
    if (st) {
      var key = Object.keys(STYLE).find(function (k) { return k.replace(/\s+/g, '') === st; });
      if (key === undefined) warn('unmapped style "' + st + '" on <' + el.tagName.toLowerCase() + ' class="' + c.join(' ') + '">');
      else if (STYLE[key]) c.push(STYLE[key]);
    }
    return c.join(' ');
  }
  function addCls(a, b) { return [a, b].filter(Boolean).join(' '); }
  function inlineHTML(el) { return el.innerHTML.replace(/\s*\n\s*/g, '').trim(); }
  function outerInline(el) { return el.outerHTML.replace(/\s*\n\s*/g, '').trim(); }
  function isInline(n) {
    if (n.nodeType === 3 || n.nodeType === 8) return true;
    if (n.nodeType !== 1) return false;
    if (!INLINE[n.tagName] || n.hasAttribute('data-decor') || n.hasAttribute('data-synced')) return false;
    if (n.classList.contains('more') || n.classList.contains('go')) return false;
    return Array.prototype.every.call(n.childNodes, isInline);
  }
  function inlineOnly(el) { return Array.prototype.every.call(el.childNodes, isInline); }
  function hasText(el) { return el.textContent.trim() !== '' || el.querySelector('img,br'); }

  function P(content, className, anchor) {
    var a = { content: content };
    if (className) a.className = className;
    if (anchor) a.anchor = anchor;
    return B.createBlock('core/paragraph', a);
  }
  function G(tagName, className, anchor, inner) {
    var a = {};
    if (tagName && tagName !== 'div') a.tagName = tagName;
    if (className) a.className = className;
    if (anchor) a.anchor = anchor;
    return B.createBlock('core/group', a, inner);
  }

  /* ---------- DOM preparation ---------- */
  function prepare(html) {
    html = html.replace(/\{\{>\s*avatar\s*\}\}/g, '<span data-decor="avatar"></span>')
      .replace(/\{\{>\s*([\w-]+)\s*\}\}/g, function (m, n) { return '<div data-synced="' + n + '"></div>'; });
    var doc = new DOMParser().parseFromString('<!doctype html><body>' + html + '</body>', 'text/html');
    var root = doc.body;
    root.querySelectorAll('a[href]').forEach(function (a) { a.setAttribute('href', link(a.getAttribute('href'))); a.removeAttribute('tabindex'); });
    root.querySelectorAll('.hero-frame').forEach(function (f) { var d = doc.createElement('span'); d.setAttribute('data-decor', 'hero-overlay'); f.appendChild(d); });
    root.querySelectorAll(DROP).forEach(function (e) { e.remove(); });
    DECOR.forEach(function (d) {
      root.querySelectorAll(d[0]).forEach(function (e) { var s = doc.createElement('span'); s.setAttribute('data-decor', d[1]); e.replaceWith(s); });
    });
    root.querySelectorAll('[aria-current]').forEach(function (e) { if (e.tagName === 'LI') { e.classList.add('is-current'); e.removeAttribute('aria-current'); } });
    root.querySelectorAll('img').forEach(function (img) {
      var m = imgUrl(img.getAttribute('src'));
      if (m) { img.setAttribute('src', m.url); img.setAttribute('data-id', m.id); } else warn('image not in media library: ' + img.getAttribute('src'));
      ['fetchpriority', 'loading', 'decoding'].forEach(function (k) { img.removeAttribute(k); });
    });
    /* hidden/aria attributes that core blocks cannot store are dropped silently; decorative text gets aria-hidden from the theme script */
    return root;
  }

  /* ---------- conversion ---------- */
  function image(img, className, caption, href) {
    var a = { url: img.getAttribute('src'), alt: img.getAttribute('alt') || '', sizeSlug: 'full', linkDestination: 'none' };
    var id = parseInt(img.getAttribute('data-id'), 10); if (id) a.id = id;
    var c = addCls(className, cls(img)); if (c) a.className = c;
    if (caption) a.caption = caption;
    if (href) { a.href = href; a.linkDestination = 'custom'; }
    return B.createBlock('core/image', a);
  }

  function table(el) {
    var body = Array.prototype.map.call(el.querySelectorAll('tr'), function (tr) {
      return { cells: Array.prototype.map.call(tr.children, function (c) {
        c.querySelectorAll('ol,ul').forEach(function (l) {
          var s = Array.prototype.map.call(l.children, function (li) { return '<span class="tli">' + li.innerHTML + '</span>'; }).join('');
          var tmp = c.ownerDocument.createElement('span'); tmp.innerHTML = s; l.replaceWith.apply(l, Array.prototype.slice.call(tmp.childNodes));
        });
        var cell = { content: inlineHTML(c), tag: c.tagName.toLowerCase() };
        if (c.getAttribute('scope')) cell.scope = c.getAttribute('scope');
        return cell;
      }) };
    });
    return B.createBlock('core/table', { className: cls(el), body: body, hasFixedLayout: false });
  }

  function details(el, ctx) {
    var sum = el.querySelector(':scope > summary');
    sum.querySelectorAll('h1,h2,h3,h4,h5,h6,div,p').forEach(function (h) {
      var s = el.ownerDocument.createElement('span');
      s.className = addCls(h.tagName.toLowerCase(), h.getAttribute('class'));
      s.innerHTML = h.innerHTML; h.replaceWith(s);
    });
    var html = inlineHTML(sum); sum.remove();
    var a = { summary: html, showContent: el.hasAttribute('open') };
    var c = cls(el); if (c) a.className = c;
    return B.createBlock('core/details', a, children(el, ctx));
  }

  function list(el) {
    var ordered = el.tagName === 'OL';
    var items = Array.prototype.filter.call(el.children, function (li) { return li.tagName === 'LI'; }).map(function (li) {
      var a = { content: inlineHTML(li) }, c = cls(li); if (c) a.className = c;
      return B.createBlock('core/list-item', a);
    });
    var a = { ordered: ordered }, c = cls(el); if (c) a.className = c; if (el.id) a.anchor = el.id;
    return B.createBlock('core/list', a, items);
  }

  function children(el, ctx) {
    var out = [], run = [];
    function flush() {
      var nodes = run.filter(function (n) { return n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()); });
      run = [];
      if (!nodes.length) return;
      var classed = function (n) { return n.nodeType === 1 && n.tagName !== 'A' && n.getAttribute('class'); };
      if (nodes.every(classed)) {
        /* each labelled span (.lbl, .code404 …) becomes its own paragraph */
        nodes.forEach(function (n) { out.push(P(inlineHTML(n), addCls(cls(n), 't-' + n.tagName.toLowerCase()), n.id)); });
      } else {
        var html = nodes.map(function (n) { return n.nodeType === 1 ? outerInline(n) : n.textContent.trim(); }).join('');
        var onlyLinks = nodes.every(function (n) { return n.nodeType === 1 && n.tagName === 'A'; });
        out.push(P(html, onlyLinks ? 'lnk' : 't-run'));
      }
    }
    Array.prototype.forEach.call(el.childNodes, function (n) {
      if (n.nodeType === 8) return;
      if (n.nodeType === 1 && n.dataset.consumed) return;
      if (isInline(n)) { run.push(n); return; }
      flush();
      out.push.apply(out, conv(n, ctx));
    });
    flush();
    return out;
  }

  function conv(el, ctx) {
    ctx = ctx || {};
    if (el.nodeType === 3) return el.textContent.trim() ? [P(el.textContent.trim())] : [];
    if (el.nodeType !== 1) return [];
    var tag = el.tagName, c = cls(el), id = el.id || undefined;

    if (el.hasAttribute('data-decor')) return [B.createBlock('lhl/decor', { name: el.getAttribute('data-decor') })];
    if (el.hasAttribute('data-synced')) {
      var name = el.getAttribute('data-synced'), ref = STATE.synced[name];
      if (!ref) { warn('synced pattern missing: ' + name + ' — run LHLC.synced() first'); return []; }
      return [B.createBlock('core/block', { ref: ref })];
    }
    if (tag === 'SCRIPT' || tag === 'STYLE') return [];
    if (tag === 'IFRAME') {
      var u = new URL(el.getAttribute('src'), location.href);
      if (/maps\.google\./.test(u.host)) return [B.createBlock('lhl/map', { query: u.searchParams.get('q') || '', zoom: +(u.searchParams.get('z') || 16) })];
      warn('iframe not converted: ' + u.host);
      return [];
    }
    if (tag === 'FORM') {
      if (!STATE.cf7) { warn('contact form missing — run LHLC.cf7() first'); return []; }
      return [B.createBlock('core/shortcode', { text: '[contact-form-7 id="' + STATE.cf7.hash + '" html_class="form" title="お問い合わせ"]' })];
    }
    if (tag === 'TABLE') return [table(el)];
    if (tag === 'DETAILS') return [details(el, ctx)];

    /* photo frames */
    if (el.classList.contains('ph') && el.querySelector('img')) {
      var tagEl = el.parentElement && el.parentElement.querySelector(':scope > .tag');
      var cap = tagEl ? inlineHTML(tagEl) : '';
      if (tagEl) tagEl.dataset.consumed = '1';
      var img = el.querySelector('img');
      return [image(img, addCls('ph', c.replace(/\bph\b/, '').trim()), cap, ctx.card ? '' : ctx.href)];
    }
    if (el.classList.contains('hs-slide')) {
      var lbl = (el.getAttribute('aria-label') || '').split('：').pop();
      return [image(el.querySelector('img'), addCls(c, cls(el.querySelector('img'))), lbl)];
    }
    if (tag === 'IMG') return [image(el, '', '', ctx.href)];

    /* "VIEW" / "CONTACT" labels inside card links become the real link */
    if ((el.classList.contains('more') || el.classList.contains('go')) && ctx.href) {
      return [P('<a href="' + ctx.href + '">' + inlineHTML(el) + '</a>', c)];
    }

    /* links that wrap block content (cards, linked photo frames) */
    if (tag === 'A' && !inlineOnly(el)) {
      var href = el.getAttribute('href');
      return [G('div', c, id, children(el, { href: href, card: !el.classList.contains('spec') }))];
    }

    if (/^H[1-6]$/.test(tag)) {
      if (!inlineOnly(el)) warn('heading with block content: ' + el.outerHTML.slice(0, 80));
      var ha = { content: inlineHTML(el), level: +tag[1] };
      if (c) ha.className = c; if (id) ha.anchor = id;
      return [B.createBlock('core/heading', ha)];
    }

    if ((tag === 'UL' || tag === 'OL') && Array.prototype.every.call(el.children, function (li) { return li.tagName === 'LI' && inlineOnly(li); })) return [list(el)];

    if (tag === 'P' || inlineOnly(el)) {
      if (!hasText(el)) return [];
      if (tag === 'A') return [P(outerInline(el), 'lnk')];
      return [P(inlineHTML(el), addCls(c, tag === 'P' ? '' : 't-' + tag.toLowerCase()), id)];
    }

    var gt = GROUP_TAGS[tag] ? tag.toLowerCase() : 'div';
    return [G(gt, c, id, children(el, ctx))];
  }

  function toBlocks(html) {
    var root = prepare(html);
    return children(root, {});
  }
  function serializeHTML(html) { return B.serialize(toBlocks(html)); }

  /* ---------- REST operations ---------- */
  async function media() {
    for (var i = 0; i < IMAGES.length; i++) {
      var f = IMAGES[i];
      if (STATE.media[f]) continue;
      var slug = f.replace(/\.[^.]+$/, '');
      var found = await api({ path: '/wp/v2/media?per_page=5&search=' + encodeURIComponent(slug) });
      var hit = found.find(function (m) { return (m.source_url || '').split('/').pop().replace(/-\d+(?=\.)/, '') === f || m.slug === slug; });
      if (!hit) {
        var blob = await fetch(RAW + 'assets/img/' + f, { cache: 'no-store' }).then(function (r) { return r.blob(); });
        var fd = new FormData(); fd.append('file', new File([blob], f, { type: blob.type || (f.endsWith('.png') ? 'image/png' : 'image/jpeg') }));
        fd.append('title', slug);
        hit = await api({ path: '/wp/v2/media', method: 'POST', body: fd });
      }
      STATE.media[f] = { id: hit.id, url: hit.source_url }; save();
      console.log('[LHLC] media', f, hit.id);
    }
    return STATE.media;
  }

  async function synced() {
    for (var name in SYNCED) {
      var html = (await text('_src/partials/' + name + '.html'));
      var content = serializeHTML(html);
      var data = { title: SYNCED[name], content: content, status: 'publish' };
      var r = null;
      if (STATE.synced[name]) r = await api({ path: '/wp/v2/blocks/' + STATE.synced[name], method: 'POST', data: data }).catch(function () { return null; });
      if (!r) r = await api({ path: '/wp/v2/blocks', method: 'POST', data: data });
      STATE.synced[name] = r.id; save();
    }
    return STATE.synced;
  }

  /* Use an existing Contact Form 7 form: LHLC.useForm(id, hash) — hash is the id="…" in its shortcode.
     (CF7 6.1's REST "create" only returns an unsaved preview, so create/edit the form in
     お問い合わせ → コンタクトフォーム, pasting tools/cf7-form.html.) */
  function useForm(id, hash) { STATE.cf7 = { id: id, hash: hash }; save(); return STATE.cf7; }

  async function cf7(form, mail) {
    var data = {
      title: 'お問い合わせ', locale: 'ja', form: form,
      mail: mail || {
        subject: '【お問い合わせ】[kind] [fullname] 様（[_site_title]）',
        sender: '[_site_title] <wordpress@[_site_domain]>',
        recipient: '[_site_admin_email]',
        additional_headers: 'Reply-To: [email]',
        body: 'ウェブサイトのお問い合わせフォームから送信がありました。\n\nお問い合わせ種類：[kind]\nお名前：[fullname]\n会社名：[company]\n部署・役職：[position]\n電話番号：[tel]\nメールアドレス：[email]\nお問合せ種別：[topic]\n\nお問い合わせ内容詳細：\n[message]\n\n--\n[_site_title] [_site_url]',
        attachments: '', use_html: false, exclude_blank: false
      },
      additional_settings: 'acceptance_as_validation: on'
    };
    var path = '/contact-form-7/v1/contact-forms' + (STATE.cf7 ? '/' + STATE.cf7.id : '');
    var r = await api({ path: path, method: 'POST', data: data });
    if (!r.id) throw new Error('Contact Form 7 did not save the form (REST create is not supported by this version). Create it in wp-admin and call LHLC.useForm(id, hash).');
    STATE.cf7 = { id: r.id, hash: r.hash }; save();
    return STATE.cf7;
  }

  async function layoutPart(which) {
    var raw = await text('_src/partials/layout.html');
    var doc = new DOMParser().parseFromString(raw, 'text/html');
    var el = doc.querySelector(which === 'header' ? 'header.hd' : 'footer.ft');
    return serializeHTML(el.innerHTML);
  }

  async function parts() {
    var out = {};
    for (var p of ['header', 'footer']) {
      out[p] = await layoutPart(p);
      await api({ path: '/wp/v2/template-parts/' + THEME + '//' + p, method: 'POST', data: { content: out[p] } });
    }
    var nf = meta(await text('_src/pages/404.html'));
    out.notfound = serializeHTML(nf.body);
    var tpl = '<!-- wp:template-part {"slug":"header","tagName":"header","className":"hd"} /-->\n\n' +
      B.serialize([B.createBlock('core/group', { tagName: 'main', anchor: 'main' }, B.parse(out.notfound))]) +
      '\n\n<!-- wp:template-part {"slug":"footer","tagName":"footer","className":"ft"} /-->';
    out.template404 = tpl;
    await api({ path: '/wp/v2/templates/' + THEME + '//404', method: 'POST', data: { content: tpl } });
    return out;
  }

  async function findPage(slug, parent) {
    var r = await api({ path: '/wp/v2/pages?status=publish,draft,private&per_page=20&slug=' + encodeURIComponent(slug) });
    return r.find(function (p) { return (p.parent || 0) === (parent || 0); });
  }

  async function pages(only) {
    var ids = {}, result = [];
    for (var i = 0; i < PAGES.length; i++) {
      var pg = PAGES[i];
      var parent = pg.parent ? (ids[pg.parent] || (await findPage(pg.parent, 0) || {}).id || 0) : 0;
      if (only && only.indexOf(pg.src) < 0) { var ex = await findPage(pg.slug, parent); if (ex) ids[pg.slug] = ex.id; continue; }
      var m = meta(await text('_src/pages/' + pg.src));
      var content = serializeHTML(m.body);
      var data = { title: m.title, slug: pg.slug, parent: parent, status: 'publish', content: content, excerpt: m.desc, menu_order: pg.order, template: '' };
      var cur = await findPage(pg.slug, parent);
      var r = await api({ path: '/wp/v2/pages' + (cur ? '/' + cur.id : ''), method: 'POST', data: data });
      ids[pg.slug] = r.id;
      result.push({ src: pg.src, id: r.id, link: r.link });
      if (pg.front) await api({ path: '/wp/v2/settings', method: 'POST', data: { show_on_front: 'page', page_on_front: r.id } });
    }
    return result;
  }

  /* validation: parse what was produced and check every block is valid */
  function validate(content) {
    var bad = [];
    (function walk(bs) { bs.forEach(function (b) { if (b.isValid === false) bad.push(b.name + ': ' + (b.originalContent || '').slice(0, 120)); walk(b.innerBlocks || []); }); })(B.parse(content));
    return bad;
  }

  async function preview(src) {
    var m = meta(await text('_src/pages/' + src));
    var content = serializeHTML(m.body);
    return { content: content, invalid: validate(content), warnings: warnings.slice() };
  }

  return { media: media, synced: synced, cf7: cf7, useForm: useForm, parts: parts, pages: pages, preview: preview, validate: validate, toBlocks: toBlocks, serializeHTML: serializeHTML, state: STATE, warnings: warnings, link: link };
})();
