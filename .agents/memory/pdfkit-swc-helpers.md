---
name: PDFKit swc helpers dep
description: pdfkit requires @swc/helpers as an explicit dependency via fontkit
---

## Problem
`pdfkit` depends on `fontkit` which uses `@swc/helpers` for CJS interop. Without it the server crashes at startup:
`Error: Cannot find module '@swc/helpers/cjs/_define_property.cjs'`

## Fix
Add `@swc/helpers` as a direct dependency of `api-server`:
```
pnpm --filter @workspace/api-server add @swc/helpers
```

**Why:** fontkit is compiled with `@swc/core` but doesn't declare `@swc/helpers` as its own peer/dep, so pnpm's strict isolation means it won't be found unless explicitly added to the consuming package.
