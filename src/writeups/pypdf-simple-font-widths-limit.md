---
title: "pypdf: simple font /Widths 배열 제한 누락으로 인한 메모리 고갈"
date: "2026-09-14"
category: "Security"
tags: [Security, pypdf, Python, PDF, DoS, Responsible Disclosure]
difficulty: "Research"
readTime: "8 min read"
summary: "pypdf가 simple font의 /Widths 배열을 제한 없이 순회하던 문제를 확인하고, 압축된 PDF에서의 메모리·처리 시간 영향을 측정한 뒤 6.18.1 패치까지 확인한 기록입니다."
---

## 요약

`pypdf`는 PDF 폰트의 문자 폭 정보를 읽어 텍스트 추출과 폰트 처리를 수행합니다. 기존 코드에는 CID 폰트의 `/W` 데이터에 대한 항목 수 제한이 있었지만, simple font의 `/Widths` 배열을 처리하는 형제 경로에는 같은 제한이 적용되지 않았습니다.

공격자가 `/Widths`에 매우 많은 항목을 넣은 PDF를 만들면, 페이지의 폰트 리소스를 로딩하거나 `extract_text()`를 수행하는 과정에서 불필요하게 큰 폭 매핑 사전이 만들어질 수 있었습니다. 이 문제는 공개 GHSA로 등록되었고 pypdf `6.18.1`에서 수정되었습니다.

| 항목 | 내용 |
| --- | --- |
| 영향 구성요소 | `Font._collect_tt_t1_character_widths()`의 simple font `/Widths` 처리 |
| 공개 식별자 | [GHSA-g9cg-prrw-2r8q](https://github.com/py-pdf/pypdf/security/advisories/GHSA-g9cg-prrw-2r8q) |
| 심각도 | Medium |
| 분류 | CWE-400: Uncontrolled Resource Consumption |
| 영향 버전 | pypdf `< 6.18.1` |
| 수정 버전 | pypdf `6.18.1` 이상 |
| CVE | 이 글 작성 시점인 2026-09-14 기준 미배정 |
| 수정 PR | [py-pdf/pypdf #4072](https://github.com/py-pdf/pypdf/pull/4072) |

## 영향 범위

문제가 발생하는 대표적인 처리 경로는 다음과 같습니다.

```text
조작된 PDF
  -> PdfReader
  -> 페이지 폰트 리소스 로딩
  -> simple font의 /Widths 배열 순회
  -> 문자별 폭 매핑 사전 생성
  -> extract_text()
```

PDF는 `/Widths` 배열의 원소 수와 각 값을 제어할 수 있습니다. 문제 버전은 배열 전체를 순회하면서 문자 코드별 폭을 사전에 추가했기 때문에, 배열이 정상적인 simple font 범위를 크게 벗어나도 입력을 중단하지 않았습니다.

이 문제는 코드 실행이나 정보 노출이 아니라 가용성 저하에 해당합니다. 특히 서버가 업로드된 PDF를 자동으로 미리보기·검색 색인·문서 변환하는 경우, 하나의 작은 압축 파일이 파싱 중 더 큰 메모리 할당과 CPU 사용을 유발할 수 있습니다.

## 기술적 원인

문제가 된 함수는 `pypdf/_font.py`의 `Font._collect_tt_t1_character_widths()`입니다. 함수는 PDF의 `/Widths` 배열을 가져온 뒤 배열의 모든 원소를 순회하여 다음 정보를 구성합니다.

- 현재 원소의 위치
- `/FirstChar`를 기준으로 계산한 문자 코드
- 해당 문자 코드의 폭 값

기존 코드에는 CID 폰트의 `/W` 범위와 목록을 보호하는 항목 수 제한이 있었지만, simple font의 `/Widths` 순회 전에 별도의 상한을 확인하지 않았습니다. 따라서 “배열 원소 수 → 문자별 사전 원소 수”가 그대로 이어졌습니다.

PDF specification상 simple font의 문자 코드는 단일 바이트 범위로 다뤄지므로, 이 경로에서 허용할 수 있는 `/Widths` 항목 수는 최대 256개로 제한하는 것이 자연스럽습니다. 256개를 넘는 배열을 정상적인 simple font 입력으로 받아들일 이유가 적고, 이 경계는 패치 회귀 테스트에도 사용되었습니다.

중요한 점은 `/LastChar` 값만 확인하는 것으로는 충분하지 않다는 것입니다. 배열 자체를 순회하는 코드가 별도로 제한되지 않으면, 공격자가 `/LastChar`와 실제 배열 크기를 불일치시키는 방식으로 무제한 입력을 계속 전달할 수 있습니다.

## 재현 및 영향 측정

다음 측정은 Windows, CPython 3.11.9, pypdf 6.18.0 환경에서 수행했습니다. 메모리는 `tracemalloc` 기준 Python 할당 피크이고, 처리 시간은 페이지의 `extract_text()` 구간을 측정한 값입니다. 실제 수치는 실행 환경에 따라 달라질 수 있습니다.

| 테스트 조건 | 배열 항목 수 | PDF 크기 | 처리 시간 | Python 할당 피크 | 결과 |
| --- | ---: | ---: | ---: | ---: | --- |
| 직접 배열 | 200,000 | 400,588 bytes | 약 8.87초 | 약 38.1 MB | 처리 완료 |
| 압축 object stream | 200,000 | 1,109 bytes | 약 11.12초 | 약 38.5 MB | 처리 완료 |
| 압축 object stream | 500,000 | 1,692 bytes | 약 28.90초 | 약 88.3 MB | 처리 완료 |
| 50개 폰트 별칭을 통한 반복 처리 | 폰트당 20,000 | 1,290 bytes | 약 5.91초 | 약 97.7 MB | 처리 완료 |
| 로컬 제한 적용 후 압축 object stream | 200,000 | 1,109 bytes | 약 0.96초 | 약 1.4 MB | `LimitReachedError` |

이 결과로 확인한 사항은 다음과 같습니다.

- 공개 API인 `PdfReader(...).pages[0].extract_text()`에서 도달할 수 있었습니다.
- `strict=False`와 `strict=True` 모두 oversized `/Widths` 배열을 거부하지 않았습니다.
- 압축 object stream에서는 매우 작은 파일 크기와 파싱 중 메모리 사용량 사이에 큰 차이가 발생했습니다.
- 여러 폰트 리소스가 같은 폭 정보를 반복적으로 처리하게 되면 누적 비용이 더 커질 수 있었습니다.
- 항목 수를 사전에 제한하면 폭 매핑 사전이 커지는 것을 막고 조기에 처리를 종료할 수 있었습니다.

공개 글에는 재현용 PDF, 생성기, 실행 명령, 파일 해시를 포함하지 않습니다. 이는 문제의 영향을 설명하는 데 필요한 측정값은 남기면서, 그대로 악용할 수 있는 입력 자료의 배포는 피하기 위한 선택입니다.

## 수정 내용

pypdf `6.18.1`에서는 simple font의 `/Widths` 배열을 문자별 폭 사전에 반영하기 전에 256개 항목 제한을 확인하도록 수정되었습니다.

패치의 핵심 동작은 다음과 같습니다.

1. `/Widths` 배열의 원소 수를 확인합니다.
2. 허용 범위를 넘으면 폭 사전을 채우기 전에 `LimitReachedError`로 중단합니다.
3. 256개 이하의 정상 범위 입력은 기존처럼 처리합니다.
4. CID 폰트에 이미 적용된 폭 항목 제한과 simple font의 제한을 분리해 각 PDF 자료형에 맞게 적용합니다.

이 검사는 사전 원소를 하나씩 추가한 뒤 정리하는 방식이 아니라, 저장 작업 전에 수행됩니다. 따라서 제한 초과 입력이 부분적으로 내부 상태를 변경하지 않는지도 회귀 테스트로 확인하는 것이 중요합니다.

## 검증 포인트

회귀 테스트는 다음 경계를 확인합니다.

- `/Widths` 256개: 정상 처리
- `/Widths` 257개: `LimitReachedError` 발생
- 예외 발생 시 `current_widths`가 부분적으로 채워지지 않음
- 압축 object stream을 통한 공개 API 경로에서도 동일한 제한 적용

운영 환경에서 pypdf를 사용하는 경우에는 다음 보완책을 함께 고려할 수 있습니다.

- pypdf를 `6.18.1` 이상으로 업데이트
- 신뢰하지 않은 PDF 처리를 별도 프로세스나 컨테이너로 격리
- PDF 한 건당 CPU·메모리·실행 시간 제한 설정
- 동시에 처리하는 문서 수와 작업 큐의 최대 길이 제한
- 파싱 예외를 정상적인 업로드 실패로 처리하고 서비스 전체 프로세스가 종료되지 않도록 구성

이 설정들은 라이브러리 패치와 함께 사용해야 하며, 패치되지 않은 파서의 무제한 입력을 정당화하지는 않습니다.

## 공개 타임라인

| 시점 | 내용 |
| --- | --- |
| 2026-09-10 | CID 폰트 폭 처리에 이미 제한이 적용된 것을 기준으로 simple font 형제 경로를 검토 |
| 2026-09-10 | `/Widths` 배열의 무제한 순회와 공개 텍스트 추출 경로를 확인하고 비공개 제보 절차로 전달 |
| 2026-09-11 | GHSA가 공개되고 pypdf `6.18.1` 패치 버전이 반영됨 |
| 2026-09-14 | 사이트에 기술 분석 및 패치 확인 내용을 공개 |

## 참고 자료

- [GHSA-g9cg-prrw-2r8q: Possible large memory usage when parsing font data](https://github.com/py-pdf/pypdf/security/advisories/GHSA-g9cg-prrw-2r8q)
- [pypdf pull request #4072](https://github.com/py-pdf/pypdf/pull/4072)
- [pypdf 6.18.1 release](https://github.com/py-pdf/pypdf/releases/tag/6.18.1)

## 공개 범위에 대한 메모

이 글은 공개된 권고문과 패치 결과를 바탕으로 원인·영향·완화책을 설명하는 기술 기록입니다. 재현용 악성 PDF와 자동화된 공격 코드는 포함하지 않았으며, 세부 검증이 필요한 경우 위 GHSA와 수정 PR을 기준으로 확인할 수 있습니다.
