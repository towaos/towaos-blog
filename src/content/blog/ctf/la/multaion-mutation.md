---
title: 'mutation mutation'
description: 'LA CTF 2026のWriteupです。'
pubDate: 2026-02-19T22:22:00+09:00
category: 'CTF'
tags: ['LA CTF', 'Writeup', 'Web']
---

# mutation mutation - LA CTF

## inspect
高速で動いているので一旦動きを止めると色々なflagが表示されるが多分その中の1つが正解
```js
for (let i = 1; i < 10000; i++) clearInterval(i);
```
```js
const walker = document.createTreeWalker(
  document,
  NodeFilter.SHOW_COMMENT,
  null
);

const comments = [];
let n;
while (n = walker.nextNode()) {
  comments.push(n.nodeValue);
}

comments;
```
