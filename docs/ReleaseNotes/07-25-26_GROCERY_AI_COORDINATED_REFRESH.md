# Release Notes — Grocery AI Coordinated Refresh

**Branch:** `cursor/grocery-ai-coordinated-refresh-da0e`  
**PR:** https://github.com/tthreatt13/grocery-list-app/pull/23  
**Release Date:** July 25, 2026

## Overview

This release refreshes the app’s AI stack and adds dietary review on grocery lists. Users can get qualitative gap analysis on a list (e.g. “light on protein”) and apply add/remove/swap suggestions individually or in batch. The Claude model is now configurable via environment variable, defaulting to latest Sonnet.

---

## Features

### 1. Grocery List AI Dietary Review

**Commit:** `7e070e6` — feat: add grocery list AI review and configurable Claude model

New **Dietary List Review** on the grocery list detail page. The AI reviews the current list against household dietary preferences, meal context on items, and ad-hoc goals you state in chat.

**Capabilities:**

- **Gap analysis** — qualitative feedback on balance and missing food groups (no calorie/macro tracking by default)
- **Actionable suggestions** — add, remove, or swap items
- **One-click apply** — apply a single suggestion to the list
- **Batch apply** — select multiple suggestions and apply at once
- **Follow-up chat** — ask refinements; numeric nutritional detail only when you explicitly request it

**Components added:**

- `components/grocery/AIGroceryReviewAssistant.tsx` — chat UI adapted from the meal planner assistant
- `components/grocery/GrocerySuggestionCard.tsx` — suggestion cards with apply/select

**Backend added:**

- `POST /api/grocery-lists/{list_id}/ai-review` — authenticated AI review endpoint
- `backend/services/grocery_list_ai.py` — context gathering, prompt formatting, response parsing

**Files modified:**

- `app/grocery-lists/[id]/page.tsx` — mounts assistant and wires apply handlers
- `lib/api/grocery.ts` — `getAIGroceryReview()` API client
- `lib/types.ts` — `GrocerySuggestion`, `AIReviewRequest`, `AIReviewResponse`
- `lib/adapters/groceryAdapters.ts` — adds `householdId` to grocery list type

### 2. Configurable Claude Model

**Commit:** `7e070e6`

Replaces the hardcoded `claude-sonnet-4-20250514` model with an environment-driven setting shared by all AI features.

**Changes:**

- New env var: **`ANTHROPIC_MODEL`** (default: `claude-sonnet-5`)
- New shared client: `backend/services/anthropic_client.py`
- Meal planner AI updated to use the configurable model
- Grocery list AI uses the same model setting from launch

**Deploy config:**

- `railway-env-template.txt` — documents `ANTHROPIC_MODEL`
- `README.md` — documents the new variable

### 3. App Maintenance & CI

**Commit:** `7e070e6`

**Changes:**

- Removed debug agent-log blocks from `backend/config.py` (no more writes to `.cursor/debug.log`)
- CI Node.js version bumped **18 → 20** (`.github/workflows/ci.yml`)
- Simplified, cleaner backend config module

---

## Testing

**New test files:**

- `backend/tests/services/test_grocery_list_ai.py`
- `backend/tests/routes/test_grocery_lists_ai_review.py`
- `components/grocery/__tests__/AIGroceryReviewAssistant.test.tsx`

**Updated tests:**

- `backend/tests/services/test_meal_planning_ai.py` — uses shared Anthropic client
- `backend/tests/routes/test_meals_ai_suggest.py` — updated mock paths

**CI status (PR #23):** Frontend Checks ✅ · Backend Checks ✅ · Vercel ✅

---

## Deployment Notes

**Required (unchanged):**

- `ANTHROPIC_API_KEY` — Anthropic API key

**Optional (new):**

- `ANTHROPIC_MODEL=claude-sonnet-5` — omit to use the default

**Railway:** Project → **Variables** → add `ANTHROPIC_MODEL`, redeploy backend.

---

## Out of Scope (Deferred)

- Proactive auto-review when opening a list
- Always-on calorie/macro tracking or nutrition dashboard
- Major dependency bumps (Clerk 7, React 19) — CI Node 20 is groundwork only

---

## Documentation

**Planning artifacts (same branch):**

- `docs/plans/2026-07-25-001-feature-grocery-ai-coordinated-refresh-plan.md` — requirements + implementation plan
