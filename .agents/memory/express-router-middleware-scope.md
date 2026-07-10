---
name: Express sub-router middleware scope
description: router.use(middleware) without a path runs for every request entering that router, not just routes defined in it
---

When a sub-router is mounted on a main router without a path (`mainRouter.use(subRouter)`), ALL requests flow into the sub-router. Any `router.use(fn)` inside the sub-router (also without a path) runs for every one of those requests — including ones that won't match any route in that sub-router.

**Symptom**: Public endpoints return 401/403 from unrelated auth middleware.

**Fix**: Scope the middleware to the path prefix it's meant to guard:
```ts
// ❌ runs for all requests
router.use(requireAdmin);

// ✅ only runs for /admin/* requests
router.use("/admin", requireAdmin);
```

**Why**: The sub-router receives the full unstripped path (since it's mounted without a prefix), so path-based `router.use('/admin', fn)` correctly matches only `/admin/*` paths within it.
