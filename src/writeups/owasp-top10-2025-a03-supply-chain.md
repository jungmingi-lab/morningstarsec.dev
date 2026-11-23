---
title: "내 코드가 멀쩡해도 앱이 위험해질 수 있다: OWASP 2025 A03"
date: "2026-11-23"
category: "블로그/기술문서"
tags: [Security, OWASP, Supply Chain, Open Source]
difficulty: "Easy"
readTime: "5 min read"
summary: "라이브러리부터 빌드와 배포까지, 소프트웨어 공급망 위험을 쉬운 예시로 정리한 글"
---

## 내가 만든 코드만 확인하면 충분할까?

앱을 만들 때 모든 기능을 혼자 처음부터 만들지는 않는다. 로그인 기능을 도와주는 라이브러리를 설치하고, 다른 사람이 만든 도구로 앱을 완성한다. 완성된 앱을 서버에 올리는 과정도 자동화할 수 있다.

요리에 비유하면 내가 쓴 코드는 조리법이고, 외부 라이브러리는 사 온 재료다. 조리법이 정확해도 재료가 상했거나 포장 과정에서 음식이 바뀌면 결과물은 안전하지 않다. 소프트웨어도 비슷하다.

OWASP Top 10:2025의 A03은 이런 문제를 ‘소프트웨어 공급망 실패(Software Supply Chain Failures)’라고 부른다. 여기서 공급망은 앱에 들어가는 외부 코드부터 앱을 만들고 배포하는 과정까지를 뜻한다. [OWASP A03:2025](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/)

## 어떤 것이 공급망에 포함될까?

예를 들어 내가 만든 앱에 사진을 편집하는 라이브러리 A를 설치했다고 하자. A가 내부적으로 다른 라이브러리 B를 사용한다면 B도 내 앱에 영향을 줄 수 있다. A는 내가 직접 추가한 도구이고, B는 그 도구를 따라 들어온 도구다. 설치 목록에 B를 직접 적지 않았다고 해서 안전 확인 대상에서 빠지는 것은 아니다.

공급망은 여기서 끝나지 않는다. 코드를 보관하는 저장소, 앱을 자동으로 만드는 빌드 서버, 완성된 파일을 배포하는 계정도 포함된다. 앱이 사용자에게 전달되기까지 지나가는 길 전체를 살펴보는 셈이다. [OWASP 공급망 보안 가이드](https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html)

## 2025년에는 무엇이 달라졌을까?

2021년 OWASP Top 10에는 ‘취약하거나 오래된 구성요소’라는 항목이 있었다. 사용 중인 라이브러리의 버전을 모르거나, 이미 취약하다고 알려진 버전을 계속 쓰는 문제가 중심이었다. [OWASP A06:2021](https://top10.owasp.org/2021/A06_2021-Vulnerable_and_Outdated_Components/)

2025년 A03은 살펴보는 범위를 넓혔다. 알려진 취약점이 있는 라이브러리뿐 아니라, 악성 코드가 섞인 업데이트, 공격받은 빌드 환경, 바뀐 배포 파일도 공급망 문제로 다룬다. 즉 ‘어떤 부품을 썼는가’에 더해 ‘그 부품으로 앱을 만드는 과정은 믿을 수 있는가’까지 묻는다. 2021년 A06과 2025년 A03은 다루는 범위가 달라서 번호만 비교해 위험이 커졌다고 단정할 수는 없다. [OWASP 2025 개정 설명](https://top10.owasp.org/2025/0x00_2025-Introduction/)

## 실제로는 어떻게 문제가 생길까?

다음은 이해를 돕기 위한 가상의 상황이다.

1. 내가 만든 앱이 라이브러리 A를 사용한다.
2. A가 사용하는 라이브러리 B에 악성 코드가 들어간 새 버전이 올라온다.
3. 앱을 자동으로 만드는 과정에서 B의 새 버전을 설치한다.
4. 내 코드에는 손댄 적이 없지만, 사용자가 받는 앱에는 문제가 생긴다.

이런 상황에서 내 코드만 다시 읽어서는 원인을 찾기 어렵다. 어떤 라이브러리가 어떤 버전으로 들어왔는지, 앱이 어디서 어떻게 만들어졌는지도 확인해야 한다. OWASP는 외부 코드뿐 아니라 개발 도구와 빌드·배포 환경의 변경도 관리하라고 안내한다. [OWASP A03:2025](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/)

## 개발할 때 무엇부터 해볼 수 있을까?

먼저 내가 쓰는 라이브러리와 버전을 목록으로 확인한다. 내가 직접 설치한 것뿐 아니라, 그 라이브러리가 다시 설치한 것까지 살펴본다. 쓰지 않는 도구는 제거하고, 업데이트할 때 어떤 항목이 바뀌었는지 확인한다. 이런 구성요소 목록을 체계적으로 적은 문서를 SBOM이라고도 한다. [OWASP A03:2025](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/)

다음으로 알려진 취약점이 있는 버전을 사용 중인지 살펴본다. OWASP Dependency-Check는 프로젝트에 들어간 외부 라이브러리를 찾아 공개된 취약점 정보와 대조하는 도구다. 다만 아직 알려지지 않은 악성 코드를 모두 발견해 주는 도구는 아니다. 검사 결과가 깨끗하다고 해서 모든 위험이 사라졌다고 생각하면 안 된다. [OWASP Dependency-Check 안내](https://devguide.owasp.org/en/05-implementation/02-dependencies/01-dependency-check/)

새 라이브러리를 추가하거나 업데이트할 때도 변경 내용을 확인한다. GitHub의 Dependency review를 사용하면 코드 변경 제안에서 어떤 라이브러리가 추가·삭제·업데이트됐는지 살펴볼 수 있다. 내가 직접 바꾼 라이브러리를 따라 다른 라이브러리까지 바뀌었는지도 확인할 수 있다. [GitHub Dependency review 문서](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review)

마지막으로 앱을 만드는 계정과 배포 계정의 권한을 필요한 만큼만 주고, 설정이 바뀌면 기록을 남긴다. 좋은 라이브러리를 골랐더라도 앱을 만드는 과정이 공격받으면 결과물까지 영향을 받을 수 있기 때문이다. [OWASP 공급망 보안 가이드](https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html)

## 정리

이번 A03을 읽으며 코드의 안전성을 생각할 때 질문을 하나 더 해야 한다고 느꼈다. ‘내 코드에 문제가 있는가?’뿐 아니라 ‘내 앱에 들어온 코드와 앱이 만들어진 과정은 믿을 수 있는가?’도 확인해야 한다.

다음에는 내가 작업하는 프로젝트 하나를 골라 사용 중인 라이브러리 목록을 확인하고, 최근 업데이트에서 무엇이 바뀌었는지 직접 살펴보려고 한다.

## 참고 자료

- [OWASP Top 10:2025 — A03 Software Supply Chain Failures](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/)
- [OWASP Top 10:2025 — Introduction](https://top10.owasp.org/2025/0x00_2025-Introduction/)
- [OWASP Top 10:2021 — A06 Vulnerable and Outdated Components](https://top10.owasp.org/2021/A06_2021-Vulnerable_and_Outdated_Components/)
- [OWASP Cheat Sheet — Software Supply Chain Security](https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html)
- [OWASP Developer Guide — Dependency-Check](https://devguide.owasp.org/en/05-implementation/02-dependencies/01-dependency-check/)
- [GitHub Docs — Dependency review](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review)
