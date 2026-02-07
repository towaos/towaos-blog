---
title: 'ItIsMyBirthday - picoCTF'
description: 'It Is My BirthdayのWriteupです。'
pubDate: 2026-01-01
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web', 'MD5']
---

# ItIsMyBirthday - picoCTF

## 初期調査

PHPファイルでもUpload可能。  
しかし、MIMEが`application/pdf`以外だとerrorになる。

PHPファイルをUploadして、RCEを狙ってみたけどUploadしたファイルにアクセスできないし出力してる部分が見当たらなかったため別の方法を考える。

問題文の通りにBirthdayAttack関連の攻撃を調べ実行してみる。

## 衝突攻撃 ( Collision Attack )

この問題はBirthdayAttackそのものではなく、MD5の脆弱性を利用したCollisionAttackである。

特に今回使用するツールは、任意の内容を持つ2つのファイルに対して同一のMD5ハッシュを持たせることが可能である。

## ツール

[Hashclash.Github](https://github.com/cr-marcstevens/hashclash.git)

## Exploit

```bash
$ git clone https://github.com/cr-marcstevens/hashclash.git

$ cd hashclash

# autoreconfでconfigureファイルを作成
$ autoreconf -i

# configureを実行してMakefileを作成
$ ./configure

$ make
```

```bash
$ ls ./bin
md5_birthdaysearch    md5_diffpathconnect  md5_diffpathhelper  md5_textcoll          sha1_diffpathbackward  sha1_diffpathforward  sha1_nearcollisionattack
md5_diffpathbackward  md5_diffpathforward  md5_fastcoll        sha1_attackgenerator  sha1_diffpathconnect   sha1_diffpathhelper

$ ./bin/md5_fastcoll -o a.pdf b.pdf

$ md5sum a.pdf b.pdf
00158601ee54f5649107c755486da286  a.pdf
00158601ee54f5649107c755486da286  b.pdf

# それぞれのPDFをUploadするとFlagが表示される
```

```php
<?php

if (isset($_POST["submit"])) {
    $type1 = $_FILES["file1"]["type"];
    $type2 = $_FILES["file2"]["type"];
    $size1 = $_FILES["file1"]["size"];
    $size2 = $_FILES["file2"]["size"];
    $SIZE_LIMIT = 18 * 1024;

    if (($size1 < $SIZE_LIMIT) && ($size2 < $SIZE_LIMIT)) {
        if (($type1 == "application/pdf") && ($type2 == "application/pdf")) {
            $contents1 = file_get_contents($_FILES["file1"]["tmp_name"]);
            $contents2 = file_get_contents($_FILES["file2"]["tmp_name"]);

            // 内容が違う、かつハッシュ値は同じ場合 index.phpを表示
            if ($contents1 != $contents2) {
                if (md5_file($_FILES["file1"]["tmp_name"]) == md5_file($_FILES["file2"]["tmp_name"])) {
                    highlight_file("index.php");
                    die();
                } else {
                    echo "MD5 hashes do not match!";
                    die();
                }
            } else {
                echo "Files are not different!";
                die();
            }
        } else {
            echo "Not a PDF!";
            die();
        }
    } else {
        echo "File too large!";
        die();
    }
}

// FLAG: picoCTF{***}

?>
```