---
title: "HTML만 넣었는데 자바스크립트가 위험해진다면? — The DOMino Effect 논문 리뷰"
date: "2026-11-22"
category: "논문/컨퍼런스"
tags: [USENIX, Web, DOMClobbering, 논문리뷰]
difficulty: "Research"
readTime: "7 min read"
summary: "USENIX Security 2025 논문 The DOMino Effect의 문제의식, Hulk의 접근 방식, 평가 결과와 한계, 후속 실습 계획을 정리했다."
---

> **논문:** Zhengyu Liu 외, *The DOMino Effect: Detecting and Exploiting DOM Clobbering Gadgets via Concolic Execution with Symbolic DOM*, USENIX Security 2025  
> [학회 발표 페이지](https://www.usenix.org/conference/usenixsecurity25/presentation/liu-zhengyu) · [논문 원문](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

## 읽기 전: 무엇이 문제일까?

웹 보안을 공부하면서 HTML에 `<script>`를 넣을 수 없다면 자바스크립트 실행도 막을 수 있지 않을까 생각하기 쉽다. 그런데 이 논문이 다루는 **DOM clobbering**은 그보다 까다롭다. 공격자가 삽입한 HTML 요소의 `id`나 `name`이 페이지의 자바스크립트에서 사용하는 이름과 겹치면, 기존 코드가 공격자가 넣은 요소를 예상치 못한 값으로 읽을 수 있다.

논문을 읽기 전 내 질문은 세 가지였다. 이런 이름 충돌이 실제로 위험한 동작까지 이어지는가? 기존 도구는 왜 이를 충분히 찾지 못했는가? 그리고 위험한 코드를 찾은 것과 실제 공격이 가능한 것은 어떻게 구분해야 하는가?

## 기존 방식은 무엇을 놓쳤나

DOM clobbering 자체는 새로 발견된 문제가 아니다. 중요한 것은 HTML 요소에서 시작한 값이 기존 자바스크립트 코드를 거쳐 스크립트 실행 같은 위험한 지점까지 도달하는 **경로**다. 논문은 이때 공격에 이용되는 기존 코드 조각을 *가젯(gadget)*이라고 부른다.

기존 연구의 도구인 **TheThing**은 가젯을 찾고 미리 준비한 HTML 공격 예시로 검증했다. 하지만 웹페이지의 코드는 다양하다. 어떤 경로는 특정 태그와 속성이 있어야 작동하고, 어떤 경로는 실행 중에 만들어지는 코드에 영향을 받는다. 정해진 예시만 시험하면 이런 조건을 만족하는 HTML을 찾아내기 어렵다. 저자들은 **가젯을 발견하는 일과, 그 가젯을 실제로 작동시키는 HTML을 만드는 일을 함께 해결**하려 했다. [논문 원문, 서론](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

## Hulk는 어떻게 접근했나

저자들이 만든 도구 **Hulk**는 크게 세 단계로 움직인다.

첫째, 웹페이지를 실행하면서 HTML 때문에 바뀔 수 있는 값이 어디서 시작해 위험한 함수까지 흘러가는지 추적한다. 이를 *동적 오염 분석*이라고 한다. 실제 실행 흐름을 보기 때문에 정적 분석만으로 파악하기 어려운 경로도 살필 수 있다.

둘째, 발견한 경로가 요구하는 조건을 바탕으로 HTML을 생성한다. 여기서 핵심이 **Symbolic DOM**이다. 공격 HTML을 단순한 문자열로 보지 않고, 태그·속성·요소 간 관계가 있는 구조로 표현한다. 예를 들어 코드가 특정 이름의 요소와 그 속성을 요구한다면, 그 조건을 만족하는 HTML 구조를 찾는 방식이다. 논문 제목의 *concolic execution*은 실제 실행에서 얻은 경로를 바탕으로 다른 입력이 만족해야 할 조건을 푸는 접근을 가리킨다.

셋째, 생성한 HTML을 페이지에 다시 넣어 위험한 지점까지 값이 실제로 도달하는지 확인한다. **경로 발견 → 조건에 맞는 HTML 생성 → 재실행으로 검증**이라는 흐름이다. [저자들의 시스템 설명과 아티팩트](https://www.usenix.org/sites/default/files/sec25_full_artifact_proceedings.pdf)

## 결과는 인상적이지만, 숫자를 구분해 봐야 한다

저자들은 Tranco 상위 **5,000개 웹사이트**를 분석해 **497개의 검증된 가젯**을 발견했다. 별도로 HTML 삽입 지점까지 결합한 **12개의 종단 간 공격 사례**를 제시했고, 연구 결과와 관련해 **19개의 CVE**가 부여됐다고 보고했다. 497개가 곧 497개 사이트에서 공격자가 즉시 XSS를 실행할 수 있다는 뜻은 아니다. 가젯이 있어도 공격자가 해당 페이지에 필요한 HTML을 넣을 수 있어야 공격으로 이어진다. [논문 원문, 평가](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

비교 실험에서도 Hulk의 장점과 한계가 함께 보인다. 상위 500개 사이트에서 두 도구가 찾아낸 가젯을 합쳐 비교했을 때, TheThing은 6개, Hulk는 33개를 확인했다. 반면 연구진이 따로 모은 **기존 가젯 12개**에서는 TheThing이 4개, Hulk가 5개를 찾았다. Hulk도 이 자료의 7개를 놓친 것이다. 따라서 이 결과는 “모든 DOM clobbering을 찾는다”가 아니라, **새로운 가젯을 찾는 능력은 크게 개선했지만 실행 경로에 따라 여전히 놓치는 사례가 있다**고 읽는 편이 정확하다. [저자들의 결과 비교표](https://www.cs.jhu.edu/~susuyu/assets/domino/DOMinoPoster-Security25.pdf)

## 논문이 남긴 한계

논문이 직접 밝힌 기술적 한계도 있다. 간접적인 DOM 접근을 통한 값의 흐름이나 WebAssembly를 거치는 흐름은 추적하지 못한다. 문자열 조건이 복잡하면 제한 시간 안에 해를 구하지 못할 수도 있다. 내 생각에는 이런 한계가 동적 분석의 특징을 잘 보여준다. 실제 실행을 관찰하면 구체적인 증거를 얻을 수 있지만, 관찰하지 못한 실행 경로까지 모두 보장할 수는 없다. [논문 원문, Discussion and Limitation](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

## 내가 배운 점과 앞으로 할 일

이 논문에서 가장 흥미로웠던 부분은 **위험한 코드를 찾는 것에서 멈추지 않고, 그 코드가 요구하는 HTML의 조건을 풀어 실제로 검증했다는 점**이다. 취약점 분석에서 “수상해 보이는 경로”와 “재현되는 공격” 사이에는 생각보다 큰 간격이 있다. Hulk는 그 간격을 자동으로 좁히려는 시도라고 이해했다.

이후에는 세 가지를 해보고 싶다.

1. **작은 실습 페이지 만들기:** `id`와 `name`이 있는 HTML 요소가 자바스크립트의 이름 조회에 어떤 영향을 주는지 로컬 환경에서 재현한다.
2. **방어 방법 비교하기:** HTML을 표시해야 하는 상황에서 속성 제거, 입력 정제, 자바스크립트의 명시적인 값 확인이 각각 어떤 장단점이 있는지 살펴본다.
3. **비슷한 연구로 넓혀 읽기:** 2025년 IEEE S&P 논문 [*Follow My Flow*](https://ieeexplore.ieee.org/abstract/document/11023488)를 읽고, DOM clobbering과 클라이언트 측 prototype pollution에서 가젯을 찾는 방식이 어떻게 다른지 비교한다.

실습 결과가 나오면 입력 HTML, 실제로 바뀐 값, 방어 후 결과를 기록해 별도의 글로 정리할 생각이다. 그때 이 논문의 결과를 요약하는 데서 한 걸음 더 나아가, **내가 직접 확인한 범위와 아직 확인하지 못한 범위**를 분명히 적고 싶다.
