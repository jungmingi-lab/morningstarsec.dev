# MorningStarSec Portfolio

Professional cybersecurity portfolio for `morningstarsec.dev`, built with React, TypeScript, Vite, Tailwind CSS, GitHub Pages, and GitHub Actions.

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
│   ├── og-image.png
│   └── resume-minki-jung.pdf
├── scripts/
│   ├── create-resume-pdf.mjs
│   └── create-spa-fallback.mjs
├── src/
│   ├── assets/cyber-hero.png
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
- `Misc`

Each category can contain multiple Markdown files. Use Markdown headings such as
`## Overview` and `## Technical Notes` inside each post to split detailed
content into sections.

The writeup page is available at:

```text
https://morningstarsec.dev/writeups
```

## Resume

The download button points to:

```text
public/resume-minki-jung.pdf
```

A starter PDF is generated. Replace it with the final resume before using it for applications.

To regenerate the starter PDF:

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
   git commit -m "Prepare MorningStarSec production deployment"
   git push -u origin main
   ```

3. In GitHub, open the repository.

4. Go to `Settings` -> `Pages`.

5. Under `Build and deployment`, set `Source` to `GitHub Actions`.

6. Under `Custom domain`, enter:

   ```text
   morningstarsec.dev
   ```

7. Save the custom domain.

8. Push to `main` or run the `Deploy to GitHub Pages` workflow manually from the `Actions` tab.

The workflow builds `dist/`, uploads it as a Pages artifact, and deploys it. Vite copies `public/CNAME` into `dist/CNAME`, and the build also copies `dist/index.html` to `dist/404.html` so clean SPA routes such as `/writeups` work on GitHub Pages.

## Cloudflare DNS Setup

Use Cloudflare as DNS for `morningstarsec.dev`, with GitHub Pages as the hosting origin.

### 1. Connect Cloudflare DNS

1. Add `morningstarsec.dev` to Cloudflare.
2. At the domain registrar, replace the current nameservers with the two Cloudflare nameservers shown in the Cloudflare dashboard.
3. Wait until Cloudflare marks the zone as active.
4. In Cloudflare, open `DNS` -> `Records`.

### 2. Add DNS Records

Remove conflicting existing `A`, `AAAA`, or `CNAME` records for `@`, then add:

| Type | Name | Content |
| --- | --- | --- |
| `CNAME` | `@` | `jungmingi-lab.github.io` |

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
2. Confirm the custom domain is `morningstarsec.dev`.
3. Wait for the DNS check and certificate provisioning to complete. DNS propagation can take a few minutes and may take up to 24 hours.
4. Enable `Enforce HTTPS`.
5. In Cloudflare, keep the records as `DNS only` for the simplest setup.

Optional Cloudflare proxy mode after GitHub HTTPS is working:

1. In Cloudflare, set `SSL/TLS` mode to `Full (strict)`.
2. Change the `CNAME` records from `DNS only` to `Proxied`.
3. Re-test both `https://morningstarsec.dev` and `https://www.morningstarsec.dev`.

If GitHub Pages reports DNS or certificate problems, switch the records back to `DNS only` until GitHub Pages is healthy.

### 4. Verify

Run:

```bash
dig morningstarsec.dev +noall +answer -t CNAME
dig www.morningstarsec.dev +noall +answer -t CNAME
curl -I https://morningstarsec.dev
curl -I https://morningstarsec.dev/writeups
```

Expected:

- Apex `CNAME` resolves through `jungmingi-lab.github.io`.
- Optional `www` resolves through `jungmingi-lab.github.io`.
- `https://morningstarsec.dev` returns a successful HTTPS response.
- `/writeups` loads the React writeup page.

## Final Verification Checklist

- Repository URL: `https://github.com/jungmingi-lab/morningstarsec.dev`
- GitHub Pages URL: `https://jungmingi-lab.github.io/morningstarsec.dev/`
- Custom domain URL: `https://morningstarsec.dev`
- DNS record: `CNAME @ jungmingi-lab.github.io`, `DNS only`
- Build command: `npm run build`
- Deployment workflow: `.github/workflows/deploy.yml`
- Manual actions: configure GitHub Pages source as `GitHub Actions`, set custom domain, then enable `Enforce HTTPS`

## Reference Docs

- GitHub Pages custom domain DNS records: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pages with GitHub Actions: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Cloudflare DNS record management: https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/
- Cloudflare SSL/TLS modes: https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/
