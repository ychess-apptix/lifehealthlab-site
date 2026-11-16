# 有限会社ヘルシーライフ研究所 — Website (3R-B 人と暮らし)

Static HTML site for lifehealthlab.com, built on the **3R-B「人と暮らし」** design
(Laboratory Notebook: grid paper, rulers, specimen frames, mono annotations;
lab blue ink × chlorophyll green). Content follows
`ヘルシーライフ研究所_ホームページコンテンツ（全ページ原稿）2026-09-22`.

## Pages

| URL | Page |
| --- | --- |
| `/` | トップ |
| `/company/` | 事業部 |
| `/company/message.html` | トップメッセージ（ご挨拶・4つの理念・沿革） |
| `/company/overview.html` | 会社概要（＋アクセス） |
| `/service/` | サービス一覧 |
| `/service/healthcare.html` | ヘルスケアプロダクト事業 |
| `/service/restaurant.html` | フード＆レストラン事業 |
| `/service/publishing.html` | 出版事業 |
| `/service/ec.html` | EC・通信販売事業 |
| `/recruit/` | 採用情報 |
| `/contact/` | お問い合わせ（入力 → 確認 → 完了） |
| `/contact/thanks.html` | 送信完了 |
| `/privacy/` | プライバシーポリシー |
| `/404.html` | Not Found |

## Structure

```
index.html, company/, service/, recruit/, contact/, privacy/, 404.html   ← built pages (deploy these)
assets/css/style.css   assets/js/main.js   assets/img/   favicon.ico
_src/partials/layout.html   shared <head>, header, footer
_src/partials/*.html        snippets (cta, sibs, avatar, privacy-body) used as {{> name}}
_src/pages/**               page bodies
build.ps1                   rebuilds the HTML from _src
```

Edit the files in `_src/`, then rebuild:

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```

All links are relative, so the site works from any folder, on GitHub Pages, or opened locally.

## Before going live

- **Phone number**: replace `【電話番号】` (footer, contact, overview, privacy, recruit).
- **Contact form**: the form validates and shows a confirm step, but does not send mail yet.
  Set `data-endpoint` on `<form id="contactForm">` in `_src/pages/contact/index.html`
  to a mail-sending endpoint (PHP mailer on the server, or a WordPress form/REST endpoint).
  The script POSTs the form as `FormData` and moves to `thanks.html` on success.
- **Photos**: generated images are placeholders for real photography
  (staff portraits for the Expert Voice sections use an icon for now).
