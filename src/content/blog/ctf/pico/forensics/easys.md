---
title: 'Forensics Easy'
description: 'picoCTFのWriteupです。'
pubDate: 2026-02-09T22:25:00+09:00
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Forensics']
---

# Forensics Easy
## CanYouSee - picoCTF

### JPEGファイルの調査
```bash
$ exiftool ukn_reality.jpg
ExifTool Version Number         : 13.44
File Name                       : ukn_reality.jpg
Directory                       : .
File Size                       : 2.3 MB
File Modification Date/Time     : 2024:02:16 07:40:21+09:00
File Access Date/Time           : 2026:02:06 10:21:37+09:00
File Inode Change Date/Time     : 2026:02:06 10:21:00+09:00
File Permissions                : -rw-r--r--
File Type                       : JPEG
File Type Extension             : jpg
MIME Type                       : image/jpeg
JFIF Version                    : 1.01
Resolution Unit                 : inches
X Resolution                    : 72
Y Resolution                    : 72
XMP Toolkit                     : Image::ExifTool 11.88
Attribution URL                 : cGljb0NURntNRTc0RDQ3QV9ISUREM05fYTZkZjhkYjh9Cg==
Image Width                     : 4308
Image Height                    : 2875
Encoding Process                : Baseline DCT, Huffman coding
Bits Per Sample                 : 8
Color Components                : 3
Y Cb Cr Sub Sampling            : YCbCr4:2:0 (2 2)
Image Size                      : 4308x2875
Megapixels                      : 12.4

$ echo "cGljb0NURntNRTc0RDQ3QV9ISUREM05fYTZkZjhkYjh9Cg==" | base64 -d
picoCTF{***}
```

## Corrupted file - picoCTF

### 壊れたファイルの調査
```bash
$ file picoCTF\ Challenge\ File
picoCTF Challenge File: data
$ strings picoCTF\ Challenge\ File
JFIF
```
```bash
$ xxd -l 16 picoCTF\ Challenge\ File
00000000: 5c78 ffe0 0010 4a46 4946 0001 0100 0001  \x....JFIF......

$ cp picoCTF\ Challenge\ File fixed.jpg

$ printf '\xff\xd8' | dd of=fixed.jpg bs=1 seek=0 count=2 conv=notrunc
2+0 records in
2+0 records out
2 bytes transferred in 0.000128 secs (15625 bytes/sec)

$ file fixed.jpg
fixed.jpg: JPEG image data, JFIF standard 1.01, aspect ratio, density 1x1, segment length 16, baseline, precision 8, 800x500, components 3
```

## DISKO 1 - picoCTF

### ディスクの調査
```bash
$ file Disko\ 1.dd
Disko 1.dd: DOS/MBR boot sector, code offset 0x58+2, OEM-ID "mkfs.fat", Media descriptor 0xf8, sectors/track 32, heads 8, sectors 102400 (volumes > 32 MB), FAT (32 bit), sectors/FAT 788, serial number 0x241a4420, unlabeled

# パーティションを切らずに直でFSを作ってる
$ fdisk -l Disko\ 1.dd
Disk Disko 1.dd: 50 MiB, 52428800 bytes, 102400 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0x00000000

# ディスクの作りを確認
$ fsstat Disko\ 1.dd
FILE SYSTEM INFORMATION
--------------------------------------------
File System Type: FAT32

OEM Name: mkfs.fat
Volume ID: 0x241a4420
Volume Label (Boot Sector): NO NAME
Volume Label (Root Directory):
File System Type Label: FAT32
Next Free Sector (FS Info): 102399
Free Sector Count (FS Info): 0

Sectors before file system: 0

File System Layout (in sectors)
Total Range: 0 - 102399
* Reserved: 0 - 31
** Boot Sector: 0
** FS Info Sector: 1
** Backup Boot Sector: 6
* FAT 0: 32 - 819
* FAT 1: 820 - 1607
* Data Area: 1608 - 102399
** Cluster Area: 1608 - 102399
*** Root Directory: 1608 - 1608

METADATA INFORMATION
--------------------------------------------
Range: 2 - 1612678
Root Directory: 2

CONTENT INFORMATION
--------------------------------------------
Sector Size: 512
Cluster Size: 512
Total Cluster Range: 2 - 100793

# データの開始位置1608, ブロックサイズ512(sector=cluster=blocks)
# ディスクから読んだ内容をファイルに出力
$ dd if=Disko\ 1.dd bs=512 skip=1608 of=data.bin

$ strings data.bin | grep pico
pico{***}
```

## Flag in Flame - picoCTF

### logファイルの調査
```bash
$ file picoCTF\ logs.txt
picoCTF logs.txt: ASCII text, with very long lines (65536), with no line terminators

$ base64 -d picoctflogs.txt > picoctflogs.png

$ file picoctflogs.png
picoctflogs.png: PNG image data, 896 x 1152, 8-bit/color RGB, non-interlaced
```

### PNGを調査
```bash
$ echo "7069636F4354467B666F72656E736963735F616E616C797369735F69735F616D617A696E675F35646161346132667D" | xxd -r -p
picoCTF{***}
```

## Hidden in plainsight - picoCTF

### jpegファイルの調査
```bash
file challenge.jpg
challenge.jpg: JPEG image data, JFIF standard 1.01, aspect ratio, density 1x1, segment length 16, comment: "c3RlZ2hpZGU6Y0VGNmVuZHZjbVE9", baseline, precision 8, 640x640, components 3
```
```bash
$ echo "c3RlZ2hpZGU6Y0VGNmVuZHZjbVE9" | base64 -d
steghide:cEF6endvcmQ=
$ echo "cEF6endvcmQ=" | base64 -d
pAzzword
```
```bash
$ steghide extract -sf challenge.jpg
Enter passphrase:
wrote extracted data to "flag.txt".
$ cat flag.txt
picoCTF{***}
```

## information - picoCTF

### JPEGファイルの調査
```bash

exiftool Cat\ from\ picoCTF.jpg
ExifTool Version Number         : 13.44
File Name                       : Cat from picoCTF.jpg
Directory                       : .
File Size                       : 878 kB
File Modification Date/Time     : 2026:02:06 10:33:40+09:00
File Access Date/Time           : 2026:02:06 10:34:04+09:00
File Inode Change Date/Time     : 2026:02:06 10:34:02+09:00
File Permissions                : -rw-r--r--
File Type                       : JPEG
File Type Extension             : jpg
MIME Type                       : image/jpeg
JFIF Version                    : 1.02
Resolution Unit                 : None
X Resolution                    : 1
Y Resolution                    : 1
Current IPTC Digest             : 7a78f3d9cfb1ce42ab5a3aa30573d617
Copyright Notice                : PicoCTF
Application Record Version      : 4
XMP Toolkit                     : Image::ExifTool 10.80
License                         : cGljb0NURnt0aGVfbTN0YWRhdGFfMXNfbW9kaWZpZWR9
Rights                          : PicoCTF
Image Width                     : 2560
Image Height                    : 1598
Encoding Process                : Baseline DCT, Huffman coding
Bits Per Sample                 : 8
Color Components                : 3
Y Cb Cr Sub Sampling            : YCbCr4:2:0 (2 2)
Image Size                      : 2560x1598
Megapixels                      : 4.1

$ echo "cGljb0NURnt0aGVfbTN0YWRhdGFfMXNfbW9kaWZpZWR9" | base64 -d
picoCTF{***}
```

## RED - picoCTF

### PNGファイルの調査
```bash
$ zsteg Red\ Challenge\ Image.png
meta Poem           .. text: "Crimson heart, vibrant and bold,\nHearts flutter at your sight.\nEvenings glow softly red,\nCherries burst with sweet life.\nKisses linger with your warmth.\nLove deep as merlot.\nScarlet leaves falling softly,\nBold in every stroke."
chunk:0:IHDR        .. file: Adobe Photoshop Color swatch, version 0, 128 colors; 1st RGB space (0), w 0x80, x 0x806, y 0, z 0; 2nd HSB space (1), w 0x100, x 0, y 0xff01, z 0xff
b1,rgba,lsb,xy      .. text: "cGljb0NURntyM2RfMXNfdGgzX3VsdDFtNHQzX2N1cjNfZjByXzU0ZG4zNTVffQ==cGljb0NURntyM2RfMXNfdGgzX3VsdDFtNHQzX2N1cjNfZjByXzU0ZG4zNTVffQ==cGljb0NURntyM2RfMXNfdGgzX3VsdDFtNHQzX2N1cjNfZjByXzU0ZG4zNTVffQ==cGljb0NURntyM2RfMXNfdGgzX3VsdDFtNHQzX2N1cjNfZjByXzU0ZG4zNTVffQ=="
b1,rgba,msb,xy      .. file: OpenPGP Public Key
b2,g,lsb,xy         .. text: "ET@UETPETUUT@TUUTD@PDUDDDPE"
b2,rgb,lsb,xy       .. file: OpenPGP Secret Key
b2,bgr,msb,xy       .. file: OpenPGP Public Key
b2,rgba,lsb,xy      .. file: OpenPGP Secret Key
b2,rgba,msb,xy      .. text: "CIkiiiII"
b2,abgr,lsb,xy      .. file: OpenPGP Secret Key
b2,abgr,msb,xy      .. text: "iiiaakikk"
b3,rgba,msb,xy      .. text: "#wb#wp#7p"
b3,abgr,msb,xy      .. text: "7r'wb#7p"
b4,b,lsb,xy         .. file: 0421 Alliant compact executable not stripped

$ echo "cGljb0NURntyM2RfMXNfdGgzX3VsdDFtNHQzX2N1cjNfZjByXzU0ZG4zNTVffQ==" | base64 -d
picoCTF{***}
```

## Riddle Registry - picoCTF

### ダウンロードしたPDFを調査
```bash
$ strings challenge.pdf
/Author (cGljb0NURntwdXp6bDNkX20zdGFkYXRhX2YwdW5kIV8wZTJkZTVhMX0\075)

# base64
$ echo "cGljb0NURntwdXp6bDNkX20zdGFkYXRhX2YwdW5kIV8wZTJkZTVhMX0=" | base64 -d
picoCTF{***}
```

## Scan Surprise - picoCTF

### PNGファイルの調査
```bash
$ zbarimg flag.png
QR-Code:picoCTF{***}
scanned 1 barcode symbols from 1 images in 0 seconds
```

## Secret of the Polyglot - picoCTF

### ファイルの調査
> 先頭のマジックバイトはPNGだがPDFの使用でPDFの開始文字が書かれていればPDFとしても使える  
これを利用してPNGファイルにフラグの断片、PDFにもフラグの断面を入れている

```bash
$ file pico.pdf
pico.pdf: PNG image data, 50 x 50, 8-bit/color RGBA, non-interlaced

$ zsteg pico.png
[?] 2448 bytes of extra data after image end (IEND), offset = 0x392
extradata:0         .. file: PDF document, version 1.4, 1 page(s)
    00000000: 25 50 44 46 2d 31 2e 34  0a 25 c7 ec 8f a2 0a 25  |%PDF-1.4.%.....%|
```

## Verify - picoCTF

### SSHでアクセス
```bash
ctf-player@pico-chall$ ls
checksum.txt  decrypt.sh  files
ctf-player@pico-chall$ for i in files/*; do ./decrypt.sh "$i"; done
bad magic number
Error: Failed to decrypt 'files/02kLdPvr'. This flag is fake! Keep looking!
bad magic number
~~~
bad magic number
Error: Failed to decrypt 'files/7x5Qa3WK'. This flag is fake! Keep looking!
picoCTF{***}

ctf-player@pico-chall$ openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -salt -in files/7x5Qa3WK -k picoCTF
bad magic number
ctf-player@pico-chall$ openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -salt -in files/87590c24 -k picoCTF
picoCTF{***}
```
```bash
# decrypt.sh
#!/bin/bash

# Check if the user provided a file name as an argument
if [ $# -eq 0 ]; then
    echo "Expected usage: decrypt.sh <filename>"
    exit 1
fi

# Store the provided filename in a variable
file_name="$1"

# Check if the provided argument is a file and not a folder
if [ ! -f "/home/ctf-player/drop-in/$file_name" ]; then
    echo "Error: '$file_name' is not a valid file. Look inside the 'files' folder with 'ls -R'!"
    exit 1
fi
# If there's an error reading the file, print an error message
if ! openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -salt -in "/home/ctf-player/drop-in/$file_name" -k picoCTF; then
    echo "Error: Failed to decrypt '$file_name'. This flag is fake! Keep looking!"
fi
```