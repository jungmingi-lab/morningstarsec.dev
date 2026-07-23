---
title: "Dreamhack: V12 Revenge Write-up"
date: "2026-06-25"
category: "Dreamhack"
tags: [Dreamhack, pwnable, docker]
difficulty: "platinum 4"
readTime: "10 min read"
summary: "Dreamhack V12 Revenge 문제의 패치된 V8 배열 shift 동작을 분석하고 익스플로잇 트리거까지 정리한 pwnable 풀이입니다."
---
## 0. 개념설명

### ELF 바이너리란
ELF(Executable and Linkable Format)는 Linux 계열 운영체제에서 사용하는 실행 파일 형식이다. Windows의 .exe파일과 비슷한 역할을 하며, 프로그램을 실행하는 데 필요한 코드, 데이터, 섹션, 심볼 정보 등을 포함한다.

pwnable 문제에서 제공되는 실행 파일은 대부분 ELF 바이너리이며, flie, checksec, gdb, objdump 같은 도구를 이용해 파일 구조와 보호 기법을 확인할 수 있다.

file ./d8

예를 들어 다음과 같은 출력이 나오면 해당 파일은 64비트 Linux 실행 파일이라는 뜻이다.

ELF 64-bit LSB executable, x86-64

이번 문제에서 사용하는 d8 역시 V8 JavaScript 엔진을 빌드해서 생성된 ELF 바이너리다. 따라서 JavaScript 코드를 실행하는 도구이면서 동시에, Linux 환경에서 동작하는 실행 파일로 볼 수 있다.

## 1. 들어가며

이번에 풀어본 문제는 Dreamhack의 V12 Revenge다. 분류는 pwnable이고, 일반적인 ELF 바이너리 문제가 아니라 패치된 V8 JavaScript 엔진을 대상으로 하는 문제다.

문제 설명은 짧다.

I think V8 is too slow.
I want to shift to V12!! ( * without internal functions... * )

문제 파일에는 패치된 d8, runner.py, flag_reader가 포함되어 있었다. runner.py는 사용자가 보낸 JavaScript payload를 /tmp/<uuid>에 저장한 뒤, 패치된 d8로 실행한다.

subprocess.run(["./x64.release/d8", f"{filename}"])

제약 조건은 다음과 같았다.

- payload는 2000바이트 이하
- read, readbuffer, load, os.system, Realm 등 d8 내부 기능 제거
- v8_enable_sandbox = true
- setuid helper인 flag_reader가 존재

즉, 단순히 read("flag") 같은 방식으로 플래그를 읽는 것은 막혀 있고, V8 exploit을 통해 코드 실행까지 도달해야 하는 문제였다.

## 취약점 분석

핵심 패치는 src/builtins/array-shift.tq에 있었다. 

- if (array.length == 0){
-   return Undefined;
- }
+ // if (array.length == 0){
+ //   return Undefined;
+ // }

 const newLength = array.length - 1;

 const result = witness.LoadElementOrUndefined(0);
 witness.ChangeLength(newLength);
+ if (newLength < 0)
+    return result;

원래 JavaScript에서 빈 배열에 shift()를 호출하면 그냥 undefined가 반환된다.

[].shift(); // undefined

하지만 문제에서는 array.length == 0 체크가 주석 처리되어 있었다. 그 결과 길이가 0인 배열에서도 아래 코드가 실행되고, newLength가 -1이 된다.

const newLength = array.length - 1;

더 큰 문제는 newLength < 0 검사가 witness.ChangeLength(newLength) 이후에 실행된다는 점이다.

즉, 배열의 length가 이미 -1로 오염된 뒤에 return하게 된다. 검사를 하긴 했는데 이미 사고가 난 뒤다. 

## 3. Trigger

    
