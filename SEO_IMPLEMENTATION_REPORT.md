# SEO 구현 보고서

## 1. 감지한 기술 스택

- React 19 + TypeScript 6
- Vite 8 정적 빌드
- Tailwind CSS 4
- Markdown 파일을 `import.meta.glob`으로 읽는 클라이언트 기술 기록 화면
- Node.js 기반 빌드 후 정적 페이지 및 SEO 검증 스크립트

Jekyll, Next.js, Gemfile, `_config.yml`은 사용하지 않습니다. 실제 소스는 저장소 루트의 `index.html`, `src/`, `public/`에 있고 배포 산출물은 `dist/`입니다.

## 2. GitHub Pages 배포 방식

- 저장소: `https://github.com/jungmingi-lab/morningstarsec.dev`
- 기본 브랜치: `main`
- workflow: `.github/workflows/deploy.yml`
- `npm ci` → lint → production build → `dist/` Pages artifact 업로드
- custom domain: 루트 및 `public/CNAME`의 `luxferre.cc`
- Vite base path: `/`

GitHub 사용자 사이트가 아니라 프로젝트 저장소이지만, 유효한 custom domain을 사용하므로 배포 자산과 내부 링크는 루트 기준입니다.

## 3. canonical site URL과 판단 근거

확정 URL은 `https://luxferre.cc/`입니다.

판단 근거:

1. 저장소 루트와 `public/CNAME`이 모두 `luxferre.cc`를 지정합니다.
2. README와 GitHub Pages workflow가 같은 custom domain 배포를 설명합니다.
3. 작업 시점에 `https://luxferre.cc/`가 HTTPS 200으로 응답했습니다.
4. `https://jungmingi-lab.github.io/morningstarsec.dev/`는 custom domain으로 301 리디렉션했습니다.

## 4. 작업 전 주요 SEO 문제

- `<html lang="en">`으로 설정되어 있었습니다.
- canonical, robots meta, author, JSON-LD, sitemap, robots.txt가 없었습니다.
- 초기 HTML의 `#root`가 비어 있어 JavaScript 실행 전 `정민기`와 소속 본문이 없었습니다.
- 홈과 모든 SPA 경로가 같은 메타데이터를 공유했습니다.
- `/writeups`가 실제 HTTP 404로 응답하면서 홈 HTML을 SPA fallback으로 표시했습니다.
- 기존 404는 홈 문서를 그대로 복사해 없는 URL을 홈처럼 렌더링했습니다.
- OG 이미지 URL이 상대 경로였고, 사용 파일은 텍스트 없는 1672×941 히어로 이미지였습니다.
- Twitter title, description, image가 없었습니다.
- 공개 PDF 생성 스크립트에 오래된 GitHub 계정 URL과 교체 안내 placeholder가 남아 있었습니다.
- 한 Markdown 문서의 frontmatter가 손상되어 있었고, CRLF 입력에서 클라이언트 파서가 frontmatter를 읽지 못했습니다.

## 5. 수정한 파일과 생성한 파일

### 핵심 구현

- `index.html`: 한국어 언어 설정, 홈 메타데이터, canonical, 소셜 메타, JSON-LD, 초기 HTML 프로필 본문
- `src/App.tsx`: 한국어 공식 프로필 콘텐츠, 의미론적 섹션, 수상 근거, 내부 링크, 동적 route SEO, 접근성 개선
- `src/data/portfolio.json`: 공개 프로필, 분야, 프로젝트, 수상, 외부 링크의 단일 데이터 원천
- `src/data/portfolio.ts`: JSON 데이터의 typed application export
- `src/lib/writeups.ts`: CRLF frontmatter 파싱 수정
- `scripts/generate-seo-pages.mjs`: 실제 정적 route, sitemap, robots, 404 생성
- `scripts/check-seo.mjs`: 빌드 산출물 SEO 자동 검사
- `package.json`: production build와 `test:seo` 연결
- `tsconfig.app.json`: JSON 모듈 지원

### 콘텐츠 및 자산

- `public/og-image-seo.png`: 1200×630 타이포그래피 기반 OG 이미지
- `src/assets/cyber-hero-optimized.jpg`: 페이지 히어로 최적화 버전
- `scripts/create-resume-pdf.mjs`, `public/resume-minki-jung.pdf`: 현재 GitHub URL과 공개 프로필 내용으로 갱신
- `src/writeups/development-bareungrip-features.md`: frontmatter 및 명백한 오탈자 수정
- `src/writeups/V12 Revenge Write-up.md`: 실제 글 내용을 요약한 description 추가

### 문서

- `SEO_POST_DEPLOY.md`
- `SEO_IMPLEMENTATION_REPORT.md`

기존 `CNAME`, Pages workflow, GitHub Pages 권한 및 배포 구조는 보존했습니다.

## 6. 메타데이터와 JSON-LD

색인 대상 페이지마다 다음을 생성합니다.

- 고유 title과 description
- 절대 canonical
- `index,follow` robots 지시문
- Open Graph 및 Twitter Card
- 1200×630 절대 OG 이미지 URL과 이미지 크기/대체 설명
- 한국어 locale과 사이트 이름

홈 JSON-LD는 `@graph`에서 `WebSite`, `ProfilePage`, `Person`을 일관된 `@id`로 연결합니다. `Person.sameAs`에는 GitHub 공식 프로필만 포함하고, 수상 기사는 `subjectOf`, 수상명은 `award`로 구분했습니다. 기술 기록 목록은 `CollectionPage`, 상세 글은 실제 콘텐츠와 일치하는 `Article`로 출력합니다.

## 7. sitemap, robots, canonical 및 404 처리

production build가 다음 파일을 자동 생성합니다.

- `/index.html`
- `/writeups/index.html`
- 각 Markdown 글의 `/writeups/<encoded-slug>/index.html`
- `/sitemap.xml`
- `/robots.txt`
- `/404.html`

sitemap에는 실제로 생성된 canonical 10개만 포함하고 `lastmod`는 신뢰할 수정 시각이 없어 생략했습니다. robots는 전체 렌더링 자원을 허용하고 절대 sitemap URL을 제공합니다.

404는 `noindex,follow`, 홈 링크, 주요 메뉴를 포함하며 JavaScript로 홈 화면을 덮어쓰지 않습니다. 유효한 기술 기록 경로는 실제 정적 파일로 생성되므로 GitHub Pages에서 200 응답이 가능하고, 존재하지 않는 경로만 404가 됩니다.

## 8. 콘텐츠, 접근성 및 내부 링크

- 홈 H1을 `정민기` 한 사람으로 명확하게 구성했습니다.
- 초반 본문에 `대전대학교 AISW학부`, 정보보안, 취약점 분석, CTF, 인공지능, 소프트웨어 개발을 자연스럽게 포함했습니다.
- 소개, 전문 분야, 프로젝트, 수상 및 활동, 연구 및 기술 기록, 외부 공식 링크, 공개 연락 수단을 의미론적인 HTML로 구성했습니다.
- 2026 대전 동구 정책디자인단 수상은 공개 보도 근거 링크와 함께 표시했습니다.
- 비활성 `Coming soon` 프로필 카드를 제거했습니다.
- 실제 `<a href>`와 설명적인 한국어 anchor text를 사용했습니다.
- 페이지별 H1을 하나로 유지하고 하위 제목을 H2/H3로 구성했습니다.
- 모바일 메뉴의 접근 가능한 이름, 검색 입력 label, 외부 링크의 `noopener noreferrer`, 장식 이미지의 빈 alt, 히어로 width/height를 적용했습니다.

## 9. 성능 개선

- 히어로 이미지를 1,672,684바이트 PNG에서 153,712바이트 JPEG로 줄였습니다(약 90.8% 감소).
- 히어로에 명시적 width/height와 높은 fetch priority를 적용해 layout shift와 첫 화면 로딩을 보완했습니다.
- 핵심 텍스트와 링크를 초기 HTML에 포함해 JavaScript 다운로드 전에도 페이지 주제와 탐색 구조가 존재합니다.
- 프레임워크 전환 없이 기존 React 디자인과 기능을 유지했습니다.

## 10. 실행한 테스트와 결과

- `npm run lint`: 성공, 오류 0
- `npm run build`: 성공, production build 오류 0
- `npm run test:seo`: 성공
  - 색인 대상 10페이지
  - HTML 11개(404 포함)
  - JSON-LD JSON 파싱 성공
  - sitemap XML 구조 및 canonical 일치 확인
  - robots 전체 차단 없음
  - OG 이미지 1200×630 확인
  - 내부 링크 대상 파일 존재 확인
  - placeholder 없음
- 개인정보·비밀값 검사:
  - 현재 작업 트리와 Git 히스토리에서 강한 API key, token, private key 패턴 0건
  - 휴대전화 번호 패턴 0건
  - 이메일은 기존 공개 연락 주소 `minki@luxferre.cc`만 의도적으로 유지
- 외부 근거 링크 확인: GitHub 프로필, 대전대학교 학부 홈페이지, 뉴시스 수상 보도 모두 HTTP 200
- 로컬 production preview:
  - 홈, 기술 기록 목록, 공백 포함 상세 slug, sitemap, robots, OG 이미지 모두 HTTP 200
  - 데스크톱 및 390×844 모바일 렌더링 확인
  - 브라우저 콘솔 오류 및 경고 0
  - 접근성 트리에서 홈과 목록 페이지의 단일 H1, 주요 navigation, searchbox 확인
- Lighthouse CLI는 일회성 실행을 시도했으나 이 환경에서 제한 시간 내 완료되지 않아 점수 보고서를 생성하지 못했습니다. 저장소 의존성에는 추가하지 않았으며, 위의 production build·정적 SEO 검사·Playwright 렌더링·콘솔·모바일 검사를 대체 검증으로 사용했습니다.

## 11. 남은 TODO와 사용자 확인 값

- 현재 공식 소속 명칭이 `대전대학교 AISW학부`인지 확인해야 합니다. 2026-07-13 수상 보도에는 `빅데이터학과`로 표기되어 있습니다.
- 공식 영문 이름 `Minki Jung` 표기를 확인해야 합니다.
- 공개 이메일 `minki@luxferre.cc` 유지 의도를 확인해야 합니다.
- 자동 생성된 프로필 PDF는 지원서 등에 사용하기 전 본인이 내용을 검토해야 합니다.
- 배포 후 실제 GitHub Pages의 `/writeups/`, 상세 경로, 404 응답 상태를 다시 확인해야 합니다.

확인 전까지 구조화 데이터에는 빈 LinkedIn, 임의 프로필 이미지, 학교 개인 프로필, 추정 경력이나 추가 수상을 넣지 않았습니다.

## 12. 배포 후 Search Console 절차

1. `luxferre.cc` 속성을 등록하고 소유권을 인증합니다.
2. 대표 URL의 실제 URL 테스트와 색인 생성을 요청합니다.
3. `https://luxferre.cc/sitemap.xml`을 제출합니다.
4. Pages, 색인 상태, HTTPS, Core Web Vitals를 관찰합니다.
5. Rich Results Test로 홈 JSON-LD를 확인합니다.
6. GitHub와 실제 공식 프로필의 이름, 소속, website URL을 일관되게 정리합니다.

자세한 절차는 `SEO_POST_DEPLOY.md`에 정리했습니다.

## 13. 제한 사항

이번 구현은 크롤링 가능성, 색인 가능성, 엔터티 명확성, 페이지별 검색 미리보기 및 기술 SEO를 개선합니다. 검색 순위, 특정 검색 결과, 리치 결과 또는 Google 지식 패널 노출은 보장되지 않으며 검색엔진의 재크롤링과 재색인 이후에 반영될 수 있습니다.
