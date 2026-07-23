# 정민기 포트폴리오

대전대학교 AISW학부 정민기의 정보보안·AI 공식 포트폴리오입니다. React, TypeScript, Vite, Tailwind CSS, GitHub Pages, GitHub Actions로 구성되어 있습니다.

## Stack

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS 4
- GitHub Pages
- GitHub Actions

## Project Structure

```text
.
├── .github/workflows/deploy.yml
├── CNAME
├── public/
│   ├── CNAME
│   ├── favicon.svg
│   ├── og-image-seo.png
│   ├── robots.txt
│   ├── sitemap.xml
│   └── resume-minki-jung.pdf
├── scripts/
│   ├── check-seo.mjs
│   ├── create-resume-pdf.mjs
│   └── generate-seo-pages.mjs
├── src/
│   ├── assets/cyber-hero-optimized.jpg
│   ├── data/portfolio.json
│   ├── data/portfolio.ts
│   ├── lib/writeups.ts
│   ├── writeups/*.md
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

## Local Development

```bash
npm install
npm run dev
npm run build
npm run test:seo
```

Preview the production build:

```bash
npm run preview
```

## CTF Writeups

Writeups live in `src/writeups/*.md` and are imported at build time.

Each post supports frontmatter:

```md
---
title: "Web Lab: Session Signal Review"
date: "2026-02-14"
category: "Web"
tags: [Web, Auth, Cookies]
difficulty: "Easy"
readTime: "4 min read"
summary: "Short summary shown in the writeup list."
---

## Overview

Markdown content here.
```

Supported categories:

- `Web`
- `Pwn`
- `Reversing`
- `Forensics`
- `Development`
- `Dreamhack`
- `Misc`

Each category can contain multiple Markdown files. Use Markdown headings such as
`## Overview` and `## Technical Notes` inside each post to split detailed
content into sections.

The writeup page is available at:

```text
https://luxferre.cc/writeups/
```

## Resume

The download button points to:

```text
public/resume-minki-jung.pdf
```

저장소에 공개된 프로필 정보를 바탕으로 간단한 프로필 PDF를 생성합니다. 지원서 등에 사용하기 전에는 내용을 직접 검토하세요.

To regenerate the profile PDF:

```bash
npm run resume
```

## GitHub Pages Deployment

1. Create or open this GitHub repository:

   ```text
   https://github.com/jungmingi-lab/morningstarsec.dev
   ```

2. Push this project to the `main` branch:

   ```bash
   git init
   git branch -M main
   git remote remove origin || true
   git remote add origin https://github.com/jungmingi-lab/morningstarsec.dev.git
   git add .
   git commit -m "Prepare luxferre production deployment"
   git push -u origin main
   ```

3. In GitHub, open the repository.

4. Go to `Settings` -> `Pages`.

5. Under `Build and deployment`, set `Source` to `GitHub Actions`.

6. Under `Custom domain`, enter:

   ```text
   luxferre.cc
   ```

7. Save the custom domain.

8. Push to `main` or run the `Deploy to GitHub Pages` workflow manually from the `Actions` tab.

The workflow builds `dist/`, uploads it as a Pages artifact, and deploys it. Vite copies `public/CNAME` into `dist/CNAME`. The post-build generator creates real static files for `/writeups/` and every writeup route, plus `sitemap.xml`, `robots.txt`, and a dedicated noindex `404.html`.

## Cloudflare DNS Setup

Use Cloudflare as DNS for `luxferre.cc`, with GitHub Pages as the hosting origin.

### 1. Connect Cloudflare DNS

1. Add `luxferre.cc` to Cloudflare.
2. At the domain registrar, replace the current nameservers with the two Cloudflare nameservers shown in the Cloudflare dashboard.
3. Wait until Cloudflare marks the zone as active.
4. In Cloudflare, open `DNS` -> `Records`.

### 2. Add DNS Records

Remove conflicting existing `A`, `AAAA`, or `CNAME` records for `@`, then add:

| Type | Name | Content |
| --- | --- | --- |
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |

Recommended initial Cloudflare settings:

- `Proxy status`: `DNS only` while GitHub validates the domain and issues HTTPS.
- `TTL`: `Auto`.

Optional `www` record:

| Type | Name | Content |
| --- | --- | --- |
| `CNAME` | `www` | `jungmingi-lab.github.io` |

Keep any `www` record pointed directly at `jungmingi-lab.github.io`, not at the repository path.

### 3. Enable HTTPS

1. In GitHub, open `Settings` -> `Pages`.
2. Confirm the custom domain is `luxferre.cc`.
3. Wait for the DNS check and certificate provisioning to complete. DNS propagation can take a few minutes and may take up to 24 hours.
4. Enable `Enforce HTTPS`.
5. In Cloudflare, keep the records as `DNS only` for the simplest setup.

Optional Cloudflare proxy mode after GitHub HTTPS is working:

1. In Cloudflare, set `SSL/TLS` mode to `Full (strict)`.
2. Change the `CNAME` records from `DNS only` to `Proxied`.
3. Re-test both `https://luxferre.cc` and `https://www.luxferre.cc`.

If GitHub Pages reports DNS or certificate problems, switch the records back to `DNS only` until GitHub Pages is healthy.

### 4. Verify

Run:

```bash
dig luxferre.cc +noall +answer -t A
dig www.luxferre.cc +noall +answer -t CNAME
curl -I https://luxferre.cc
curl -I https://luxferre.cc/writeups
```

Expected:

- Apex `A` records resolve to the GitHub Pages addresses.
- Optional `www` resolves through `jungmingi-lab.github.io`.
- `https://luxferre.cc` returns a successful HTTPS response.
- `/writeups` loads the React writeup page.

## Final Verification Checklist

- Repository URL: `https://github.com/jungmingi-lab/morningstarsec.dev`
- GitHub Pages URL: `https://jungmingi-lab.github.io/morningstarsec.dev/`
- Custom domain URL: `https://luxferre.cc`
- DNS records: GitHub Pages apex `A` records and `CNAME www jungmingi-lab.github.io`, all `DNS only`
- Build command: `npm run build`
- Deployment workflow: `.github/workflows/deploy.yml`
- Manual actions: configure GitHub Pages source as `GitHub Actions`, set custom domain, then enable `Enforce HTTPS`

## Reference Docs

- GitHub Pages custom domain DNS records: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pages with GitHub Actions: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Cloudflare DNS record management: https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/
- Cloudflare SSL/TLS modes: https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/
