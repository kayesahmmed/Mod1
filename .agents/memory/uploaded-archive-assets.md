---
name: Uploaded archive asset validation
description: Covers binary integrity checks for uploaded website archives and supplied media sequences.
---

When importing an uploaded website archive, validate representative image signatures and decodability before changing UI code. An archive can contain a valid sequential media set alongside separately corrupted bundled assets.

**Why:** A malformed image header can look like a missing-path or layout regression in the preview, while the animation and page code are working correctly.

**How to apply:** Check the uploaded archive and extracted copies with `file`/`identify`, compare hashes, and keep valid user assets unchanged; do not substitute or redesign a corrupted asset unless the user explicitly asks.