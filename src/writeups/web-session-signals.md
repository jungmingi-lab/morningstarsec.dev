---
title: "Web Lab: Session Signal Review"
date: "2026-02-14"
category: "Web"
tags: [Web, Auth, Cookies, XSS]
difficulty: "Easy"
readTime: "4 min read"
summary: "A practice writeup template for reviewing authentication state, cookie flags, and client-side trust boundaries in a CTF web challenge."
---

## Overview

This note documents a CTF-style web challenge where the goal is to reason about how authentication state is carried between requests.

## Approach

1. Map the login, dashboard, and logout routes.
2. Inspect cookies for `HttpOnly`, `Secure`, and `SameSite` flags.
3. Compare client-visible state with server-enforced authorization.
4. Test whether reflected input is encoded before it reaches the DOM.

## Takeaways

- Authentication indicators in the UI are not authorization controls.
- Cookie flags reduce impact when a browser-side bug exists.
- A useful writeup should explain the trust boundary before describing payloads.
