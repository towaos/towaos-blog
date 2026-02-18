---
title: 'DISKO 2'
description: 'picoCTFのWriteupです。'
pubDate: 2026-02-09T22:30:00+09:00
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Forensics']
---

# DISKO 2 - picoCTF

## ディスク調査
```bash
$ file Disko\ 2.dd
Disko 2.dd: DOS/MBR boot sector; partition 1 : ID=0x83, start-CHS (0x0,32,33), end-CHS (0x3,80,13), startsector 2048, 51200 sectors; partition 2 : ID=0xb, start-CHS (0x3,80,14), end-CHS (0x7,100,29), startsector 53248, 65536 sectors
```
今回はpartitionが分けられていたのでmmlsを使って構造確認した
```bash
$ mmls Disko\ 2.dd
DOS Partition Table
Offset Sector: 0
Units are in 512-byte sectors

      Slot      Start        End          Length       Description
000:  Meta      0000000000   0000000000   0000000001   Primary Table (#0)
001:  -------   0000000000   0000002047   0000002048   Unallocated
002:  000:000   0000002048   0000053247   0000051200   Linux (0x83)
003:  000:001   0000053248   0000118783   0000065536   Win95 FAT32 (0x0b)
004:  -------   0000118784   0000204799   0000086016   Unallocated

$ fsstat -o 2048 Disko\ 2.dd
FILE SYSTEM INFORMATION
--------------------------------------------
File System Type: Ext4
Volume Name:
Volume ID: 3b09dcab4ad77ca071422897c221519e

Last Written at: 2025-03-30 09:53:11 (JST)
Last Checked at: 2025-03-30 03:13:43 (JST)

Last Mounted at: 2025-03-30 09:50:59 (JST)
Unmounted properly
Last mounted on: /mnt/disko
~~~
BLOCK GROUP INFORMATION
--------------------------------------------
Number of Block Groups: 4
Inodes per group: 1600
Blocks per group: 8192

Group: 0:
  Block Group Flags: [INODE_ZEROED]
  Inode Range: 1 - 1600
  Block Range: 1 - 8192
  Layout:
    Super Block: 1 - 1
    Group Descriptor Table: 2 - 2
    Group Descriptor Growth Blocks: 3 - 201
    Data bitmap: 202 - 202
    Inode bitmap: 206 - 206
    Inode Table: 210 - 609
    Uninit Data Bitmaps: 206 - 217
    Uninit Inode Bitmaps: 210 - 221
    Uninit Inode Table: 1810 - 6609
    Data Blocks: 6634 - 8192
  Free Inodes: 1366 (85%)
  Free Blocks: 0 (0%)
  Total Directories: 3
  Stored Checksum: 0xEA4B

Group: 1:
  Block Group Flags: [INODE_UNINIT, INODE_ZEROED]
  Inode Range: 1601 - 3200
  Block Range: 8193 - 16384
  Layout:
    Super Block: 8193 - 8193
    Group Descriptor Table: 8194 - 8194
    Group Descriptor Growth Blocks: 8195 - 8393
    Data bitmap: 203 - 203
    Inode bitmap: 207 - 207
    Inode Table: 610 - 1009
    Data Blocks: 8394 - 16384
  Free Inodes: 1600 (100%)
  Free Blocks: 0 (0%)
  Total Directories: 0
  Stored Checksum: 0x5774

Group: 2:
  Block Group Flags: [INODE_UNINIT, INODE_ZEROED]
  Inode Range: 3201 - 4800
  Block Range: 16385 - 24576
  Layout:
    Data bitmap: 204 - 204
    Inode bitmap: 208 - 208
    Inode Table: 1010 - 1409
    Data Blocks: 16385 - 24576
  Free Inodes: 1600 (100%)
  Free Blocks: 512 (6%)
  Total Directories: 0
  Stored Checksum: 0x2B34

Group: 3:
  Block Group Flags: [INODE_UNINIT, INODE_ZEROED]
  Inode Range: 4801 - 6400
  Block Range: 24577 - 25599
  Layout:
    Super Block: 24577 - 24577
    Group Descriptor Table: 24578 - 24578
    Group Descriptor Growth Blocks: 24579 - 24777
    Data bitmap: 205 - 205
    Inode bitmap: 209 - 209
    Inode Table: 1410 - 1809
    Data Blocks: 24778 - 25599
  Free Inodes: 1600 (100%)
  Free Blocks: 0 (0%)
  Total Directories: 0
  Stored Checksum: 0x1494
```
もしかしたら削除されたファイルがあるかと思いflsでファイルの痕跡を調査した  
icatで何か書かれているか見たがなかった  
さらに削除ファイルの残骸を探るためにblklsで見たがハズレだった
```bash
$ fls -o 2048 Disko\ 2.dd
d/d 11:	lost+found
d/d 13:	bin
V/V 6401:	$OrphanFiles

$ fls -o 2048 Disko\ 2.dd 6401
-/r * 235:	OrphanFile-235

$ icat -o 2048 Disko\ 2.dd 235

$ istat -o 2048 Disko\ 2.dd 235
inode: 235
Not Allocated
Group: 0
Generation Id: 3136313432
uid / gid: 0 / 0
mode: rrwxr-xr-x
Flags: Extents,
size: 0
num of links: 0

Inode Times:
Accessed:	2025-03-30 09:51:30.928196859 (JST)
File Modified:	2025-03-30 09:51:30.928196859 (JST)
Inode Modified:	2025-03-30 09:51:30.928196859 (JST)
File Created:	2025-03-30 09:51:30.928196859 (JST)
Deleted:	2025-03-30 09:51:30 (JST)

Direct Blocks:

$ blkls -o 2048 Disko\ 2.dd > data.raw

$ strings data.raw | grep -iE "pico|cGl"

$ binwalk data.raw | grep -iE "pico|cGl"
```
FAT32のpartition dumpしたが偽物が溢れていた
```bash
$ dd if=Disko\ 2.dd bs=512 skip=53248 of=fat.bin
151552+0 records in
151552+0 records out
77594624 bytes (78 MB, 74 MiB) copied, 0.11104 s, 699 MB/s

$ strings fat.bin | grep -iE "pico|cGl"
picoCTF{4_P4Rt_1t_i5_5dd15750}se:
Description-id.UTF-8: Tidak ada medpicoCTF{4_P4Rt_1t_i5_1d5055d7}
Description-nl.UTF-8: Uw ethernetpicoCTF{4_P4Rt_1t_i5_5710d55d}d_description-nl.UTF-8: Er is op dit systeem geen ethernetkaart gevonden.
Extended_description-pt.UTF-8: NecessitpicoCTF{4_P4Rt_1t_i5_d50d5751}
r din computer starter, vipicoCTF{4_P4Rt_1t_i5_570d5d15}l
```
問題文をよくみるとlinuxが正解ですと書かれていたのでlinuxのpartition dumpをしたら正解フラグがあった
```bash
$ dd if=Disko\ 2.dd bs=512 skip=2048 count=51200 of=data.bin
51200+0 records in
51200+0 records out
26214400 bytes (26 MB, 25 MiB) copied, 0.0492976 s, 532 MB/s

$ strings data.bin | grep -iE "pico|cGl"
picoCTF{***}
piconv
_ZN13QsciScintilla10apiContextEiRiS0_
:/icons/appicon
piconv
piconv
piconv
# $Id: piconv,v 2.8 2016/08/04 03:15:58 dankogai Exp $
piconv -- iconv(1), reinvented in perl
  piconv [-f from_encoding] [-t to_encoding]
  piconv -l
  piconv -r encoding_alias
  piconv -h
B<piconv> is perl version of B<iconv>, a character encoding converter
a technology demonstrator for Perl 5.8.0, but you can use piconv in the
piconv converts the character encoding of either STDIN or files
Therefore, when both -f and -t are omitted, B<piconv> just acts
```
