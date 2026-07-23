# SEO 배포 후 작업

이 문서는 `https://luxferre.cc/` 배포가 완료된 뒤 사용자가 직접 진행해야 하는 검색엔진 등록 및 프로필 정리 절차입니다.

## 1. 배포 상태 확인

GitHub의 `Actions` 탭에서 **Deploy to GitHub Pages** workflow가 성공했는지 확인합니다. 배포 후 다음 URL이 모두 정상 응답하는지 확인합니다.

- `https://luxferre.cc/`
- `https://luxferre.cc/writeups/`
- `https://luxferre.cc/sitemap.xml`
- `https://luxferre.cc/robots.txt`
- `https://luxferre.cc/og-image-seo.png`

대표 페이지 소스에서 canonical이 `https://luxferre.cc/`를 가리키는지, 기술 기록 페이지가 각자의 고유 canonical을 갖는지도 확인합니다.

## 2. Google Search Console

1. [Google Search Console](https://search.google.com/search-console/)에서 `luxferre.cc` 도메인 속성 또는 `https://luxferre.cc/` URL 접두어 속성을 등록합니다.
2. Google이 안내하는 DNS 레코드 또는 HTML 방식으로 소유권을 인증합니다.
3. URL 검사에서 `https://luxferre.cc/`를 입력합니다.
4. **실제 URL 테스트**를 실행해 크롤링과 렌더링 가능 여부를 확인합니다.
5. 문제가 없으면 대표 URL의 색인 생성을 한 번 요청합니다.
6. **Sitemaps** 메뉴에 `https://luxferre.cc/sitemap.xml`을 제출합니다.
7. `https://luxferre.cc/writeups/`와 중요 기술 기록 URL도 URL 검사로 확인합니다.
8. 이후 **페이지 색인 생성**, **HTTPS**, **Core Web Vitals** 보고서를 주기적으로 확인합니다.

변경 직후 같은 URL의 색인 요청을 반복하지 말고 Google의 재크롤링과 재색인 상태를 관찰합니다.

## 3. 구조화 데이터 확인

1. [Rich Results Test](https://search.google.com/test/rich-results)에서 배포된 `https://luxferre.cc/`를 검사합니다.
2. JSON-LD 구문 오류나 잘못된 URL이 있으면 코드에서 수정한 뒤 다시 배포합니다.
3. Search Console에 구조화 데이터 개선사항 또는 오류 보고서가 표시되면 해당 실제 페이지와 화면 콘텐츠를 함께 확인합니다.
4. `Person.sameAs`에는 본인의 공식 프로필만 유지하고, 수상 보도는 `subjectOf`로 유지합니다.

`ProfilePage`와 `Person` 마크업은 엔터티 이해를 돕지만 별도의 Google 리치 결과나 지식 패널 노출을 보장하지 않습니다.

## 4. 외부 공식 프로필 정리

- GitHub 표시 이름을 실제로 사용하는 이름인 `정민기`와 일관되게 맞춥니다.
- GitHub bio에는 확인된 현재 소속과 주요 분야를 짧게 기재합니다.
- GitHub website에는 `https://luxferre.cc/`를 등록합니다.
- LinkedIn 등 실제 본인 공식 프로필이 있다면 이름, 소속, 포트폴리오 URL을 동일하게 맞춥니다.
- 학교 공식 게시물이나 대회 공식 프로필에서 개인 포트폴리오 링크를 추가할 수 있다면 운영 기관에 요청합니다.
- 수상·활동 페이지에서는 현재처럼 보도 근거를 해당 경력에 직접 연결합니다.

가짜 백링크 구매, 무관한 디렉터리 자동 등록, 동일 글의 대량 복제, 홍보 목적의 위키 문서 생성은 하지 않습니다.

## 5. 사용자 확인 항목

- [ ] 현재 공식 소속 표기가 `대전대학교 AISW학부`가 맞는지 확인
- [ ] 공식 영문 이름 표기가 `Minki Jung`이 맞는지 확인
- [ ] `minki@luxferre.cc`를 계속 공개 연락 수단으로 사용할지 확인
- [ ] 자동 생성된 프로필 PDF 내용을 지원서 등에 사용하기 전에 직접 검토
- [ ] 2026 대전 동구 정책디자인단 수상명과 팀 표기가 실제 증빙과 일치하는지 최종 확인
- [ ] HUSS 장려상, HyperSonic CTF 7위, boro CTF Open Division 세계 6위, 금융보안원 AI 레드티밍 팀전 2위의 상장·점수표·공식 결과 URL 보관

특히 2026-07-13 수상 보도에는 소속이 `빅데이터학과`로 표기되어 있으므로, 사이트 지시서의 `AISW학부` 표기와 현재 학적상 공식 명칭이 일치하는지 확인해야 합니다.

## 6. 기대치

검색 순위, 특정 검색 결과 형태, Google 지식 패널 또는 리치 결과 노출은 보장되지 않습니다. 변경 사항은 검색엔진이 사이트를 다시 크롤링하고 색인한 뒤 반영되며, 반영 시점은 검색엔진이 결정합니다.
