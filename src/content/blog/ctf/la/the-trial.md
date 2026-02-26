---
title: 'the-trial'
description: 'LA CTF 2026のWriteup'
pubDate: 2026-02-19T22:20:00+09:00
category: 'CTF'
tags: ['LA CTF', 'Writeup', 'Web']
---

# the-trial - LA CTF

## scriptを解析
`kjzhcyprdolnbgusfiawtqmxev`この中から4文字取り出してサーバーに送信する  
予想して`flag`を送信するとフラグが取れる
```html
<script>
        const val = document.getElementById("val");
        const disp = document.getElementById("disp");
        const forminp = document.getElementById("forminp");
        const submit = document.getElementById("submit");
        const lucky = document.getElementById("lucky");
        const msg = document.getElementById("msg");
        const cm = "kjzhcyprdolnbgusfiawtqmxev";
        function update() {
            let s = "";
            let n = val.value;
            for (let i = 0; i < 4; i ++) {
                s += cm[n % cm.length];
                n = Math.floor(n / cm.length);
            }
            if (disp.textContent !== s) {
                disp.textContent = s;
            }
        }
        setInterval(update, 10);
        submit.addEventListener("click", async () => {
            const req = await fetch("/getflag", {
                method: "POST",
                body: `word=${encodeURIComponent(disp.textContent)}`,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
            msg.textContent = await req.text();
        });
        lucky.addEventListener("click", () => {
            location.replace("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        });
        function bounce(ele) {
            const t = [0, 0];
            const v = [1, 1];
            setInterval(() => {
                t[0] += v[0];
                t[1] += v[1];
                ele.style.translate = `${t[0]}pt ${t[1]}pt`;
                const pos = ele.getBoundingClientRect();
                if (pos.right >= window.innerWidth) {
                    v[0] = -1;
                } else if (pos.left <= 0) {
                    v[0] = 1;
                }
                if (pos.bottom >= window.innerHeight) {
                    v[1] = -1;
                } else if (pos.top <= 0) {
                    v[1] = 1;
                }
            }, 20);
        }
        bounce(submit);
        bounce(lucky);
    </script>
```

## Exploit
```py
import requests
from urllib.parse import *
import re
URL = "https://challenge.lac.tf/"

s = requests.Session()

endpoint = "/getflag"
data = {
  "word":"flag"
}
r = s.post(urljoin(URL, endpoint), data=data)
flag = re.search(r"lactf\{[^}]+\}", r.text).group(0)
print(flag)
```
```bash
$ python3 exploit.py
lactf{***}
```
