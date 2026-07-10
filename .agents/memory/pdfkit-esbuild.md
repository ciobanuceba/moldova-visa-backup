---
name: PDFKit esbuild externalization
description: PDFKit must be externalized from esbuild or font data files won't be found at runtime
---

PDFKit loads `.afm` font files via `readFileSync` with a path relative to its own source location. When bundled by esbuild, this relative path breaks.

**Fix**: Add `"pdfkit"` to the `external` array in `build.mjs` so it loads from `node_modules` at runtime.

**Why**: esbuild inlines the source but doesn't copy the `pdfkit/js/data/*.afm` sibling files, so any font call throws `ENOENT: no such file or directory, open '.../dist/data/Helvetica.afm'`.

**How to apply**: Any package that uses `readFileSync` with a relative path to sibling data files (e.g. proto files, font files) needs to be externalized rather than bundled.
