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
- `Misc`

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

1. Create a GitHub repository under `doahattu`, for example:

   ```text
   https://github.com/doahattu/morningstarsec.dev
   ```

2. Push this project to the `main` branch:

   ```bash
   git init
   git branch -M main
   git remote add origin https://github.com/doahattu/morningstarsec.dev.git
   git add .
   git commit -m "Initial MorningStarSec portfolio"
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

The workflow builds `dist/`, uploads it as a Pages artifact, and deploys it. The build also copies `dist/index.html` to `dist/404.html` so clean SPA routes such as `/writeups` work on GitHub Pages.

## Cloudflare DNS Setup

Use Cloudflare as DNS for `morningstarsec.dev`, with GitHub Pages as the hosting origin.

### 1. Connect Cloudflare DNS

1. Add `morningstarsec.dev` to Cloudflare.
2. At the domain registrar, replace the current nameservers with the two Cloudflare nameservers shown in the Cloudflare dashboard.
3. Wait until Cloudflare marks the zone as active.
4. In Cloudflare, open `DNS` -> `Records`.

### 2. Add DNS Records

Remove conflicting existing `A`, `AAAA`, or `CNAME` records for `@` and `www`, then add:

| Type | Name | Content |
| --- | --- | --- |
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `AAAA` | `@` | `2606:50c0:8000::153` |
| `AAAA` | `@` | `2606:50c0:8001::153` |
| `AAAA` | `@` | `2606:50c0:8002::153` |
| `AAAA` | `@` | `2606:50c0:8003::153` |
| `CNAME` | `www` | `doahattu.github.io` |

Recommended initial Cloudflare settings:

- `Proxy status`: `DNS only` for all GitHub Pages records while GitHub validates the domain and issues HTTPS.
- `TTL`: `Auto`.

Keep `www` pointed directly at `doahattu.github.io`, not at the repository path.

### 3. Enable HTTPS

1. In GitHub, open `Settings` -> `Pages`.
2. Confirm the custom domain is `morningstarsec.dev`.
3. Wait for the DNS check and certificate provisioning to complete. DNS propagation can take up to 24 hours.
4. Enable `Enforce HTTPS`.
5. In Cloudflare, keep the DNS records as `DNS only` for the simplest setup.

Optional Cloudflare proxy mode after GitHub HTTPS is working:

1. In Cloudflare, set `SSL/TLS` mode to `Full (strict)`.
2. Change the `A`, `AAAA`, and `CNAME` records from `DNS only` to `Proxied`.
3. Re-test both `https://morningstarsec.dev` and `https://www.morningstarsec.dev`.

If GitHub Pages reports DNS or certificate problems, switch the records back to `DNS only` until GitHub Pages is healthy.

### 4. Verify

Run:

```bash
dig morningstarsec.dev +noall +answer -t A
dig morningstarsec.dev +noall +answer -t AAAA
dig www.morningstarsec.dev +nostats +nocomments +nocmd
curl -I https://morningstarsec.dev
curl -I https://morningstarsec.dev/writeups
```

Expected:

- Apex `A` records resolve to GitHub Pages IPv4 addresses.
- Apex `AAAA` records resolve to GitHub Pages IPv6 addresses.
- `www` resolves through `doahattu.github.io`.
- `https://morningstarsec.dev` returns a successful HTTPS response.
- `/writeups` loads the React writeup page.

## Reference Docs

- GitHub Pages custom domain DNS records: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pages with GitHub Actions: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Cloudflare DNS record management: https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/
- Cloudflare SSL/TLS modes: https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/
