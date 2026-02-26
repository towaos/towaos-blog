---
title: 'Event-Viewing'
description: 'picoCTFのWriteup'
pubDate: 2026-02-09T22:32:00+09:00
category: 'CTF'
tags: ['picoCTF', 'Writeup', 'Forensics']
---

# Event-Viewing - picoCTF

## evtxファイル調査
```bash
$ evtxdump Windows\ Logs.evtx > logs.json
```
```bash
$ jq 'select(.Event.System.EventID.Value=="1033")' logs.json
{
  "Event": {
    "EventData": {
      "Binary": "7B33443343333833332D444544362D343032322D423541312D4537463337373839433339307D3030303037363533376239373032333966396130373530633431623838363466646163393030303030303030",
      "Data": [
        "Totally_Legit_Software",
        "1.3.3.7",
        "0",
        "0",
        "cGljb0NURntFdjNudF92aTN3djNyXw==",
        "(NULL)"
      ]
    },
    "System": {
      "Channel": "Application",
      "Computer": "DESKTOP-EKVR84B",
      "Correlation": {},
      "EventID": {
        "Qualifiers": "0",
        "Value": "1033"
      },
      "EventRecordID": "2373",
      "Execution": {
        "ProcessID": "0",
        "ThreadID": "0"
      },
      "Keywords": "0x80000000000000",
      "Level": "4",
      "MsiInstaller": "",
      "Opcode": "0",
      "Security": {
        "UserID": "S-1-5-21-3576963320-1344788273-4164204335-1001"
      },
      "Task": "0",
      "TimeCreated": {
        "SystemTime": "2024-07-15T15:55:57.7297984Z"
      },
      "Version": "0"
    }
  }
}
 
$ grep -iE "cmd.exe|powershell|shutdown|stop-computer|exit" logs.json
{"Event":{"EventData":{"HandleId":"0x00000208","NewValue":"C:\\Program Files (x86)\\Totally_Legit_Software\\custom_shutdown.exe","NewValueType":"%%1873","ObjectName":"\\REGISTRY\\MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run","ObjectValueName":"Immediate Shutdown (MXNfYV9wcjN0dHlfdXMzZnVsXw==)","OldValue":"-","OldValueType":"-","OperationType":"%%1904","ProcessId":"0x00001bd0","ProcessName":"C:\\Program Files (x86)\\Totally_Legit_Software\\Totally_Legit_Software.exe","SubjectDomainName":"DESKTOP-EKVR84B","SubjectLogonId":"0x0005a428","SubjectUserName":"user","SubjectUserSid":"S-1-5-21-3576963320-1344788273-4164204335-1001"},"System":{"Channel":"Security","Computer":"DESKTOP-EKVR84B","Correlation":{},"EventID":"4657","EventRecordID":"168656","Execution":{"ProcessID":"4","ThreadID":"1084"},"Keywords":"0x8020000000000000","Level":"0","Opcode":"0","Provider":{"Guid":"54849625-5478-4994-A5BA-3E3B0328C30D","Name":"Microsoft-Windows-Security-Auditing"},"Security":{},"Task":"12801","TimeCreated":{"SystemTime":"2024-07-15T15:56:19.1031964Z"},"Version":"0"}}}

{"Event":{"EventData":{"param1":"C:\\Windows\\system32\\shutdown.exe (DESKTOP-EKVR84B)","param2":"DESKTOP-EKVR84B","param3":"No title for this reason could be found","param4":"0x800000ff","param5":"shutdown","param6":"dDAwbF84MWJhM2ZlOX0=","param7":"DESKTOP-EKVR84B\\user"},"System":{"Channel":"System","Computer":"DESKTOP-EKVR84B","Correlation":{},"EventID":{"Qualifiers":"32768","Value":"1074"},"EventRecordID":"3863","Execution":{"ProcessID":"428","ThreadID":"592"},"Keywords":"0x8080000000000000","Level":"4","Opcode":"0","Provider":{"EventSourceName":"User32","Guid":"{b0aa8734-56f7-41cc-b2f4-de228e98b946}","Name":"User32"},"Security":{"UserID":"S-1-5-21-3576963320-1344788273-4164204335-1001"},"Task":"0","TimeCreated":{"SystemTime":"2024-07-15T17:02:35.208712Z"},"Version":"0"}}}
```

3つの断片を繋げてデコードすると
```bash
echo "cGljb0NURntFdjNudF92aTN3djNyXw==MXNfYV9wcjN0dHlfdXMzZnVsXw==dDAwbF84MWJhM2ZlOX0=" | base64 -d
pico{***}
```

