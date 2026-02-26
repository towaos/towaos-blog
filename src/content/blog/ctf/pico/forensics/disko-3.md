---
title: 'DISKO 3'
description: 'picoCTFのWriteup'
pubDate: 2026-02-09T22:31:00+09:00
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Forensics']
---

# DISKO 3 - picoCTF

## ディスクの調査
```bash
$ file Disko\ 3.dd
Disko 3.dd: DOS/MBR boot sector, code offset 0x58+2, OEM-ID "mkfs.fat", Media descriptor 0xf8, sectors/track 32, heads 8, sectors 204800 (volumes > 32 MB), FAT (32 bit), sectors/FAT 1576, serial number 0x49838d0b, unlabeled

$ fsstat Disko\ 3.dd
FILE SYSTEM INFORMATION
--------------------------------------------
File System Type: FAT32

OEM Name: mkfs.fat
Volume ID: 0x49838d0b
Volume Label (Boot Sector): NO NAME
Volume Label (Root Directory):
File System Type Label: FAT32
Next Free Sector (FS Info): 36434
Free Sector Count (FS Info): 1375

Sectors before file system: 0

File System Layout (in sectors)
Total Range: 0 - 204799
* Reserved: 0 - 31
** Boot Sector: 0
** FS Info Sector: 1
** Backup Boot Sector: 6
* FAT 0: 32 - 1607
* FAT 1: 1608 - 3183
* Data Area: 3184 - 204799
** Cluster Area: 3184 - 204799
*** Root Directory: 3184 - 3184

$ dd if=Disko\ 3.dd bs=512 skip=3184 of=data.bin
201616+0 records in
201616+0 records out
103227392 bytes (103 MB, 98 MiB) copied, 9.95866 s, 10.4 MB/s

$ binwalk data.bin | grep -iE flag
14595286      0xDEB4D6        Unix path: /lib/partman/update.d/21biosgrub_sync_flag: *******************************************************
14595386      0xDEB53A        Unix path: /lib/partman/update.d/21lvm_sync_flag: *******************************************************
14595481      0xDEB599        Unix path: /lib/partman/update.d/22md_sync_flag: *******************************************************
~~~
17024000      0x103C400       gzip compressed data, has original file name: "flag", from Unix, last modified: 2025-07-17 15:06:44
```
`dd if=data.bin of=flag.gz bs=1 skip=17024000`これだと処理がかなり遅いので`tail`を使って必要な地点までスキップする

```bash
$ tail -c +17024001 data.bin > flag.gz

$ gunzip flag.gz

$ cat flag
Here is your flag
picoCTF{***}
```
