# Builds the static site from _src/ into the repository root.
#   _src/partials/layout.html  … shared <head>, header, footer
#   _src/partials/*.html       … snippets, inserted with {{> name}}
#   _src/pages/**.html         … page bodies. First block is a meta comment:
#       <!--meta
#       title: ページ名
#       desc: description
#       section: company|service|recruit|contact|privacy|home
#       -->
# Tokens: {{root}} = relative path to the site root ("" or "../").
# Usage:  powershell -ExecutionPolicy Bypass -File build.ps1
$ErrorActionPreference = 'Stop'
$here  = Split-Path -Parent $MyInvocation.MyCommand.Path
$src   = Join-Path $here '_src'
$pages = Join-Path $src 'pages'
$utf8  = New-Object System.Text.UTF8Encoding($false)
$site  = '有限会社ヘルシーライフ研究所'

$layout = [IO.File]::ReadAllText((Join-Path $src 'partials\layout.html'), $utf8)
$partials = @{}
Get-ChildItem (Join-Path $src 'partials') -Filter *.html | Where-Object { $_.Name -ne 'layout.html' } | ForEach-Object {
  $partials[$_.BaseName] = [IO.File]::ReadAllText($_.FullName, $utf8)
}

$count = 0
Get-ChildItem $pages -Recurse -Filter *.html | ForEach-Object {
  $rel   = $_.FullName.Substring($pages.Length + 1).Replace('\', '/')
  $depth = ($rel.Split('/').Count - 1)
  $root  = ('../' * $depth)
  $raw   = [IO.File]::ReadAllText($_.FullName, $utf8)

  $meta = @{ title = ''; desc = ''; section = '' }
  $m = [regex]::Match($raw, '(?s)^\s*<!--meta(.*?)-->')
  if ($m.Success) {
    foreach ($line in $m.Groups[1].Value -split "`r?`n") {
      if ($line -match '^\s*(\w+)\s*:\s*(.*)$') { $meta[$Matches[1]] = $Matches[2].Trim() }
    }
    $raw = $raw.Substring($m.Length).TrimStart()
  }
  foreach ($k in $partials.Keys) { $raw = $raw.Replace("{{> $k}}", $partials[$k]) }

  $full = if ($meta.title -and $rel -ne 'index.html') { "$($meta.title)｜$site" } else { "$site｜「健康」を研究し、「暮らし」に届ける。" }
  $path = $rel -replace '(^|/)index\.html$', '$1'
  $html = $layout.Replace('{{content}}', $raw.TrimEnd())
  $html = $html.Replace('{{fulltitle}}', $full).Replace('{{desc}}', $meta.desc).Replace('{{section}}', $meta.section)
  $html = $html.Replace('{{path}}', $path).Replace('{{ogtype}}', $(if ($rel -eq 'index.html') { 'website' } else { 'article' }))
  $html = $html.Replace('{{root}}', $root)
  if ($html -match '\{\{') { throw "Unresolved token in $rel" }

  $out = Join-Path $here $rel
  New-Item -ItemType Directory -Force (Split-Path -Parent $out) | Out-Null
  [IO.File]::WriteAllText($out, $html, $utf8)
  $count++
  Write-Host "built $rel"
}
Write-Host "$count pages"
