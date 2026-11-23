---
title: "HTML만 넣었는데 자바스크립트가 위험해진다면? — The DOMino Effect 논문 리뷰"
date: "2026-11-22"
category: "논문/컨퍼런스"
tags: [USENIX, Web, DOMClobbering, 논문리뷰]
difficulty: "Research"
readTime: "10 min read"
summary: "DOM Clobbering의 원리와 중요성부터 TheThing과 Hulk의 차이, Hulk의 동작 예시, 평가 결과와 후속 실습 계획까지 정리했다."
---

> 논문: Zhengyu Liu 외, The DOMino Effect: Detecting and Exploiting DOM Clobbering Gadgets via Concolic Execution with Symbolic DOM, USENIX Security 2025  
> [학회 발표 페이지](https://www.usenix.org/conference/usenixsecurity25/presentation/liu-zhengyu) · [논문 원문](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

## 왜 이 논문을 골랐나

웹 보안을 배울 때는 보통 공격자가 `<script>`를 넣거나 기존 코드에 스크립트를 주입하는 상황부터 떠올린다. 하지만 블로그나 마크다운 편집기처럼 사용자가 작성한 HTML을 일부 표시하는 서비스도 많다. 이런 서비스가 스크립트 태그를 제거해도, 남아 있는 HTML이 페이지의 기존 자바스크립트 동작에 영향을 줄 수 있다면 어떨까?

나는 이전부터 “HTML만 넣어도 사이트의 기존 자바스크립트를 속일 수 있다”는 점이 궁금했다. 이 논문은 그 현상을 설명하는 데서 끝나지 않고, 실제로 어떤 HTML이 기존 코드를 위험한 동작으로 이끄는지 자동으로 찾아 검증한다. 문제의 원리와 탐지 방법을 함께 배울 수 있어 이 논문을 골랐다.

이 문제가 중요한 이유는 HTML을 허용하는 기능이 생각보다 흔하기 때문이다. 논문에서는 마크다운 편집기 등에 삽입된 스크립트 없는 HTML이 기존 라이브러리와 결합해 저장형 XSS로 이어진 사례를 제시한다. 물론 아무 HTML이나 넣는다고 공격이 되는 것은 아니다. 해당 페이지가 공격자가 조작할 수 있는 HTML을 받아들이고, 이름이 겹치는 자바스크립트 코드가 있으며, 그 값이 위험한 동작까지 도달해야 한다. [논문 원문, 서론과 2.1절](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

## DOM Clobbering이란 무엇인가

브라우저는 HTML을 요소들의 트리로 해석한다. 이를 DOM(Document Object Model)이라고 한다. 자바스크립트는 `document`와 `window`를 통해 이 요소와 페이지의 값을 읽는다. 그런데 브라우저에서는 일부 HTML 요소의 `id`나 `name`이 `window.이름` 또는 `document.이름`으로도 노출될 수 있다. 페이지 코드가 그 이름을 다른 값으로 예상하고 사용하면, 공격자가 넣은 요소와 이름이 충돌한다. 이것이 DOM Clobbering이다.

아래는 원리를 보여 주기 위한 작은 예시다. 논문 속 실제 취약 코드나 내가 발견한 취약점은 아니다.

```html
<!-- 페이지가 허용한 HTML 삽입 영역에 들어온 요소 -->
<a id="scriptUrl" href="https://example.invalid/demo.js"></a>
```

```js
// 페이지에 원래 있던 자바스크립트라고 가정
const source = window.scriptUrl || "/assets/app.js";
const script = document.createElement("script");
script.src = source;
document.head.appendChild(script);
```

페이지가 `window.scriptUrl`에 별도 값을 정의하지 않았고 브라우저의 이름 조회 규칙이 적용된다면, 이 코드는 문자열 대신 위 `<a>` 요소를 읽을 수 있다. `<a>` 요소가 `script.src`에 들어가면서 주소 문자열로 변환되면, 원래 의도한 `/assets/app.js` 대신 HTML의 `href`가 사용된다. 공격자가 직접 `<script>`를 작성하지 않았어도 기존 자바스크립트가 그 값을 사용한 것이다. 실제 공격 가능 여부는 HTML 허용 범위, 브라우저 동작, CSP 같은 방어 설정에 따라 달라진다.

여기서 공격에 이용되는 기존 자바스크립트 코드 조각을 가젯(gadget)이라고 한다. 위 예시에서는 `window.scriptUrl`을 읽어 스크립트 주소로 넘기는 흐름이 가젯에 해당한다. 값이 도착하면 위험해지는 함수나 위치는 싱크(sink)라고 부른다. [논문 원문, 1장](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

## TheThing과 Hulk는 어떤 관계인가

TheThing과 Hulk는 모두 DOM Clobbering 가젯을 찾는 연구 도구다. TheThing은 이전 연구의 도구이고, Hulk는 이 논문 저자들이 그 한계를 해결하려고 제안한 새 도구다. Hulk가 TheThing의 이름만 바꾼 버전이라는 뜻은 아니다.

TheThing은 자바스크립트 코드를 정적으로 분석해 수상한 경로를 찾고, 미리 준비한 HTML 템플릿으로 확인한다. 문제는 실제 코드가 요구하는 조건이 템플릿보다 복잡할 수 있다는 것이다. 예를 들어 HTML 요소 하나로 이름을 겹치게 만드는 데 성공해도, 뒤의 코드가 여러 요소를 순회한다면 그 입력은 중간에서 막힌다. 실행 중 만들어진 값이나 객체의 다른 이름을 따라가는 동적 특징도 정적 분석만으로는 놓칠 수 있다.

Hulk는 페이지를 실행하며 값의 흐름을 추적하고, 그 흐름이 요구하는 HTML 구조를 조건으로 표현해 새 입력을 만든다. 따라서 핵심 차이는 단순히 “더 많은 HTML을 시도한다”가 아니라 “코드가 요구하는 태그, 속성, 요소의 관계를 풀어서 HTML을 만든다”는 데 있다. [논문 원문, 서론과 2.1절](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

## Hulk는 어떻게 움직이나: 논문의 사례로 보기

논문은 Google API 클라이언트 라이브러리의 사례를 제시한다. 기존 코드가 `document.scripts`를 읽고, 얻은 요소들을 순회해 `src`가 특정 주소로 시작하는지 검사한 뒤, 통과한 요소의 텍스트를 `new Function`에 전달하는 흐름이다. 아래는 이해를 돕기 위해 줄인 의사 코드다. 실제 라이브러리 코드 전체를 옮긴 것은 아니다.

```js
const items = document.scripts || [];
for (const item of items) {
  if (item.src && item.src.startsWith(expectedUrl)) {
    const text = item.textContent;
    // 실제 사례에서는 이 값이 코드 실행 함수로 이어진다.
    useAsCode(text);
  }
}
```

여기서 `document.scripts`라는 이름만 겹치게 해서는 부족하다. `items`가 여러 요소를 순회할 수 있어야 하고, 각 요소의 `src`가 검사에 맞아야 하며, 읽히는 `textContent`도 원하는 값이어야 한다. TheThing의 미리 준비된 예시처럼 `<img name="scripts">` 하나를 넣으면 이름 충돌은 일으킬 수 있어도, 이 코드가 기대하는 목록 형태를 만족하지 못해 뒤 단계로 이어지지 않는다.

Hulk는 이런 조건을 다음 순서로 다룬다.

1. 페이지를 실행하면서 HTML에서 시작한 값이 위험한 함수까지 전달되는 경로를 기록한다. 이를 동적 오염 분석이라고 한다.
2. 기록한 경로에서 “여러 요소가 필요하다”, “`src`가 정해진 주소와 맞아야 한다”, “텍스트가 읽혀야 한다” 같은 조건을 모은다. 이때 HTML을 단순한 글자가 아닌 태그·속성·요소 간 관계를 가진 트리로 나타낸 것이 Symbolic DOM이다.
3. 조건을 만족하는 HTML을 생성하고 실제 페이지에 다시 넣어 위험한 동작까지 도달하는지 확인한다. 실제 실행 결과를 바탕으로 다른 입력의 조건을 풀어 가는 과정이 논문 제목의 concolic execution이다.

논문에서는 같은 `name="scripts"`를 가진 `<iframe>` 요소 두 개와 필요한 `src` 및 텍스트를 조합해 이 조건을 만족하는 HTML을 생성했다. 이 사례는 “이름 하나를 덮어쓰면 끝”이 아니라, 그 뒤에 이어지는 코드의 검사까지 통과해야 한다는 점을 보여 준다. [논문 원문, 2.1절과 3.1절](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

## 평가 결과를 어떻게 읽어야 하나

저자들은 Tranco 상위 5,000개 웹사이트에서 검증된 가젯 497개를 발견했다. 또한 HTML 삽입 지점과 결합해 저장형 XSS로 이어진 종단 간 공격 사례 12개를 보고했고, 관련 결과에 CVE 19개가 부여됐다고 적었다. 497개가 모두 즉시 공격 가능한 웹사이트라는 뜻은 아니다. 가젯과 공격자가 HTML을 넣을 수 있는 지점이 실제로 연결돼야 한다. [논문 원문, 요약과 평가](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

상위 500개 사이트에서 두 도구가 검증한 가젯을 합쳐 비교했을 때 TheThing은 6개, Hulk는 33개를 확인했다. 반면 연구진이 따로 모은 기존 가젯 12개에서는 TheThing이 4개, Hulk가 5개를 찾았다. Hulk가 더 많이 찾았지만 이 자료의 7개는 놓쳤다. 그래서 이 결과는 “Hulk가 모든 사례를 찾는다”보다 “새로운 사례를 찾는 능력을 높였지만 동적 실행에서 보지 못한 경로는 여전히 놓칠 수 있다”로 읽었다. [논문 원문, 표 4와 한계 분석](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

## 한계와 내가 이어서 해보고 싶은 것

Hulk도 실행 중 관찰하지 못한 경로는 분석할 수 없다. 복잡한 문자열 조건은 풀이가 어려울 수 있고, 간접적인 DOM 접근이나 WebAssembly를 거치는 흐름도 논문에서 한계로 언급한다. 따라서 도구의 “검증된 가젯”은 의미 있는 증거지만, 탐지되지 않았다고 안전하다는 보장은 아니다. [논문 원문, 6장](https://www.usenix.org/system/files/usenixsecurity25-liu-zhengyu.pdf)

내가 이 논문에서 배운 것은 HTML을 무해한 표시 정보로만 보면 안 된다는 점이다. HTML 요소의 이름과 속성은 기존 코드의 입력이 될 수 있다. 특히 가젯을 찾는 일과 실제로 작동하는 HTML을 만드는 일은 서로 다른 문제이며, Hulk는 둘을 연결하려 했다.

다음에는 작은 로컬 페이지를 만들어 `id`나 `name`이 `window`와 `document`의 이름 조회에 어떤 영향을 주는지 직접 확인하고 싶다. 그다음에는 HTML을 정제한 경우, 코드에서 값을 명시적으로 검사한 경우, CSP를 적용한 경우를 비교해 실제로 어느 단계에서 흐름이 끊기는지 기록할 계획이다. 가능하다면 [TheThing](https://github.com/SoheilKhodayari/TheThing)과 [Hulk](https://github.com/jackfromeast/TheHulk)의 공개 구현을 살펴보고 같은 작은 예시에서 두 방식이 어떤 입력을 제안하는지도 비교해 보고 싶다. 이런 실습 결과는 논문의 주장과 내가 직접 확인한 사실을 구분해 별도의 글로 남기겠다.
