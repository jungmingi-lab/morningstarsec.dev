---
title: "Misc Lab: AI Prompt Safety Notes"
date: "2026-01-08"
category: "Misc"
tags: [Misc, AI Security, Prompt Injection]
difficulty: "Practice"
readTime: "5 min read"
summary: "A CTF-style AI security note about separating user input, system instructions, and tool output when analyzing prompt injection challenges."
---

## Overview

This lab models an assistant that summarizes untrusted text. The challenge is to identify where untrusted instructions can influence privileged behavior.

## Review Points

1. Identify which text is user-controlled.
2. Identify which actions have external side effects.
3. Check whether retrieved content is treated as data or instructions.
4. Write mitigations that reduce capability, not only wording risk.

## Takeaways

- Treat retrieved documents as untrusted input.
- Tool access should be scoped to the minimum required action.
- Prompt-injection writeups should describe the control boundary clearly.
