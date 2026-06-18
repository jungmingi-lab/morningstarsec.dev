---
title: "Pwn Lab: Stack Boundary Notes"
date: "2026-02-05"
category: "Pwn"
tags: [Pwn, Linux, GDB, Memory]
difficulty: "Medium"
readTime: "5 min read"
summary: "A compact binary-exploitation study note focused on stack layout observation, crash triage, and mitigation awareness."
---

## Overview

The challenge binary accepts controlled input and fails when the stack frame is corrupted. The important skill is not memorizing an offset, but proving the memory model.

## Analysis Flow

1. Run the binary with a debugger and capture the crash point.
2. Identify input length, saved return address behavior, and register state.
3. Check mitigations such as stack canaries, PIE, NX, and RELRO.
4. Build the final explanation around evidence from the debugger.

## Takeaways

- Crashes are data. Preserve the initial state before changing the exploit plan.
- Mitigation checks belong early in the writeup.
- Keep CTF exploit notes scoped to the isolated challenge environment.
