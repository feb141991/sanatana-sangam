# Nitya Karma Sub-routes — Error Boundaries as Crash Mitigation

**Date:** 2026-06-06
**Session context:** Nitya Karma filter crash on /insights and /plans sub-routes
**Category:** decision

## What we decided

Added Next.js route-level error boundaries at:
- `src/app/(main)/nitya-karma/insights/error.tsx`
- `src/app/(main)/nitya-karma/plans/error.tsx`

Both render branded error UI with two recovery paths: "Try again" (calls Next.js `reset()` to
re-render the segment) and "Go back" (routes to `/nitya-karma`).

## Why

The crash root cause was not identifiable from static analysis alone. Deploying an error boundary
as a mitigation accomplishes two things simultaneously: it prevents a full-screen unhandled crash
from reaching users, and it surfaces the actual runtime error message in the boundary's props —
making the root cause visible in production logs/Sentry rather than showing a blank screen.

This is the standard Next.js pattern for route crashes: add `error.tsx` at the route segment
level before diagnosing the underlying cause.

## Constraints this creates

- Each Nitya Karma sub-route that can crash independently should have its own `error.tsx`. A
  single boundary at the `/nitya-karma` parent level would catch too broadly and prevent the
  working sub-routes from rendering.
- The `reset()` call re-renders the segment from the server. If the crash is data-driven (e.g.,
  malformed query result), `reset()` may loop. The "Go back" fallback exists for this case.
- Error boundaries are client components (`"use client"`) — they cannot access server-only APIs
  directly. Any error recovery logic that needs server data must go through a server action or
  re-navigation.

## What we explicitly rejected

- **Single parent-level error boundary** — too broad; would mask which sub-route is crashing
  and potentially suppress healthy sibling routes.
- **Removing the feature pending root cause** — too disruptive; error boundaries are the
  standard mitigation path before a fix is known.

---
