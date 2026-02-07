---
title: 'Fly.io - ServerSetup'
description: 'Fly.ioを使ってみました。'
pubDate: 2025-12-28
category: 'Setup'
tags: ['Fly.io', 'Setup']
---

# Fly.io - ServerSetup

CTF用のWeb問題の検証環境 として Fly.io を使ってみたメモ。

## Flyのセットアップ手順

> ※ macOS前提

1. **アカウント作成**\
[Fly.io](https://fly.io)

2. **クレジットを登録**
  - Machine起動に必須
  - 登録したくない場合は別サービス推奨

3. **flyctlのインストール**
```bash
$ brew install flyctl
```

5. **プロジェクト作成 & 初期化**
```bash
$ mkdir fly-app
$ cd fly-app
$ fly launch
```
- 専用ディレクトリを作成する

6. **デプロイ & デプロイ完了**
```bash
$ fly deploy
```
- `Visit: https://fly-app.fly.dev/`(このURLが公開用URLとして使える)

> アプリをデプロイするならDockerベースで構築する\
> `docker build or run`を行なって`fly deploy`するのがいいと思う

## Fly Commands

| Command | Function |
| --- | --- |
| fly launch | アプリ初期化(Dockerfile & fly.toml生成)|
| fly deploy | ビルド & デプロイ |
| fly apps list | アプリ一覧表示 |
| fly machines list | 起動中のMachine一覧 |
| fly machine stop &lt;name&gt; | Machine停止|
| fly apps destroy &lt;name&gt; | アプリ完全削除 |
| fly logs | リアルタイムログ表示 |