---
title: 'Docker Commands'
description: 'よく使うDockerコマンド。'
pubDate: 2025-12-22
category: 'Docker'
tags: ['Docker']
---

# Docker Commands

## よく使うやつ
```bash
# docker imageの作成(単体) <image-name>:<tags-if-needed>
docker build -t app-name:tag-name .
# cashなしで作成
docker build -t app-name:tag-name . --no-cash
---

# docker containerの作成(単体)
docker run app-name
# port指定 <host-port>:<container-port>
docker run -p 3000:3000 app-name
# backgroundで起動
docker run -d app-name
# 停止
docker stop app-name
---

# docker containerの作成(複数)
docker compose up
# 再buildして起動
docker compose up --build
# cashなしで起動
docker compose up --no-cash
# backgroundで起動
docker compose up -d
# 停止
docker compose down
---

# containerの一覧
docker ps
# 全て表示
docker ps -a
---

# imageの一覧
docker images
---

# 停止したcontainerの削除 container-id or container-name 
docker rm container-id
---

# 使用していないimageの削除 image-id or image-name
docker rmi image-id
---

# container内部にアクセス /bin/bash <- 内部で使われているshellを選択
docker exec -it container-name /bin/bash
---

# dockerのシステムリソース
# ディスク使用状況
docker system df
# 不要なcontainer, network, imageの削除
# 全て削除
docker system prune -a
# デフォルトでvolumeは削除されないので指定
docker system prune -a --volumes
# 削除確認プロンプトが必要ない場合 -afで可
docker system prune -a -f
```