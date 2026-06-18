---
title: "Forensics Lab: Timeline Recovery"
date: "2026-01-18"
category: "Forensics"
tags: [Forensics, Timeline, Metadata]
difficulty: "Easy"
readTime: "4 min read"
summary: "A digital forensics note for building a timeline from file metadata, archive structure, and visible artifacts."
---

## Overview

The artifact set contains files with inconsistent timestamps and a small amount of embedded metadata. The goal is to produce a defensible event timeline.

## Workflow

1. Hash the original evidence before analysis.
2. Extract archive contents into a working directory.
3. Compare filesystem timestamps with embedded metadata.
4. Build a short timeline that explains uncertainty explicitly.

## Takeaways

- Keep originals read-only and document derived files separately.
- Timezone assumptions should be stated, not hidden.
- A timeline is stronger when each event has a source artifact.
