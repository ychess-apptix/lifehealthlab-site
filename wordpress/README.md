# WordPress version (editable)

The static site in this repo, rebuilt as a **WordPress block theme** whose page
content is made of normal core blocks (見出し・段落・画像・リスト・表・詳細・グループ),
so every text and photo is editable in the block editor — the same approach as
jln-group.com. Design and animations stay fixed in the theme.

Live: https://www.lifehealthlab.com/ (WordPress 7.1, theme `lifehealthlab`)

## What is where

| Thing | Edit it in |
| --- | --- |
| Page text, photos, lists, tables, FAQ | 固定ページ → each page (block editor) |
| Header / footer (menu links, address, TEL) | 外観 → エディター → パターン → テンプレートパーツ (Header / Footer) |
| CTA band (採用情報・お問い合わせ), service list nav, privacy policy text | 外観 → エディター → パターン → 同期パターン (edit once → updates every page) |
| 404 page | 外観 → エディター → テンプレート → 404 |
| Page `<meta description>` | each page → 抜粋 (excerpt) |
| Site title / tagline (browser title) | 設定 → 一般 |
| Contact form fields & mail | お問い合わせ → コンタクトフォーム (Contact Form 7) |
| Map address (会社概要) | the 地図（Google マップ） block on that page |

Locked in the theme (not editable in admin, by design): CSS (`assets/css/site.css`),
motion & slider (`assets/js/site.js`), decorative SVGs (`decor/*.html`, shown in the
editor as small "◇ name" placeholders — leave them in place).

### Editing tips

- Styling comes from CSS classes on blocks (ブロック → 高度な設定 → 追加 CSS クラス).
  Don't remove them. To add another card/row, **duplicate** an existing block
  (⋮ → 複製) instead of inserting a new one.
- Hero slider (top page): the three images in the `hs-track` group. Replace an image
  to change a slide; its caption is the label shown on the slider control.
- Photo frame labels ("Fig. 02 / Meeting") are the image captions.

## Files

```
wordpress/
  lifehealthlab/          the theme (zip this folder to install/update)
    theme.json, functions.php, style.css
    templates/  parts/    block templates (header/footer content lives in the DB after import)
    assets/css/site.css   design (adapted from assets/css/style.css)
    assets/css/editor.css editor-only tweaks
    assets/js/site.js     motion, slider, nav, contact-form confirm step
    assets/js/decor-editor.js  editor UI for lhl/decor and lhl/map blocks
    decor/*.html          fixed decorative markup rendered by the lhl/decor block
  tools/convert.js        static pages → block content importer (runs in wp-admin)
  tools/cf7-form.html     Contact Form 7 form template (入力 → 確認 → 送信)
```

## Re-running the import

The importer reads `_src/` and `assets/img/` from the public GitHub repo, converts
each page with WordPress's own block API (so blocks are always valid for the
installed version) and saves through the REST API. It **overwrites** the pages, so
only use it before editors start changing content.

1. Open `wp-admin/post-new.php?post_type=page` (logged in as admin).
2. In the browser console, paste the contents of `tools/convert.js`, then:

```js
await LHLC.media();    // images → Media Library (skips ones already uploaded)
LHLC.useForm(100, '9cb35ae');  // the CF7 form (id, shortcode hash) — see "Contact form" below
await LHLC.synced();   // synced patterns
await LHLC.parts();    // header/footer template parts + 404 template
await LHLC.pages();    // all pages, sets the front page
```

## Contact form

**Version pin:** the server runs PHP 8.2, and Contact Form 7 6.2+ needs PHP 8.3, so the
site uses **CF7 6.1.7** (same as jln-group.com on the same server), uploaded from
wordpress.org's archive. WordPress won't offer 6.2.x until PHP is 8.3. PHP 8.2 security
support ends 2026-12-31 — switch the Coreserver account `group` (v2011) to PHP 8.3 and
then update CF7 normally. (Weekly meeting 2026-11: Chikuma will change PHP to 8.3.)

Inquiries are sent to **info@lifehealthlab.com** (送信先), From `admin@lifehealthlab.com`,
Reply-To the visitor's address.

The form is CF7 form ID 100 (shortcode `[contact-form-7 id="9cb35ae"]`). Its form
template is `tools/cf7-form.html`; field names (kind, fullname, company, position, tel,
email, topic, message, agree) and the wrappers (`.field`, `.agree`, `.confirm-tbl`,
`#confirmBody`, `#backBtn`) are used by the theme script — keep them if you edit it.
Additional setting `acceptance_as_validation: on` is required (keeps the 確認 button enabled).

Contact Form 7 handles sending (recipient: お問い合わせ → コンタクトフォーム → メール → 送信先). The theme script adds the
original 入力 → 確認 step on top and redirects to `/contact/thanks/` when sent.
