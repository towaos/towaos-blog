---
title: 'Docker Commands'
description: '私がよく使うDockerコマンドです。'
pubDate: 2025-12-22
category: 'Docker'
tags: ['Docker', 'Command']
---

# Docker Commands

## よく使うやつ
| command | purpose | option |
| --- | --- | --- |
| docker ps | 使用してるコンテナ一覧を表示 | -a(全て) |
| docker images | ビルドしたimage一覧を表示 |  |
| docker exec | コンテナ内部にアクセス | -i(キー入力有効), -t(仮想端末) |
| docker rm | 停止したコンテナを削除 |  |
| docker rmi | 使用しないイメージを削除 |  |
| **docker system** | | |
| docker system df |  | ディスク使用状況の確認 |
| docker system prune | 不要なコンテナ・ネットワーク・イメージを削除 | -a(全て) |
| **docker compose** | | |
| docker compose up | コンテナを起動 | -d(バックグラウンドで起動), --build(ビルド後に起動) |

- docker exec -it container-name /bin/bash <- bashは内部で使われているshellを選択