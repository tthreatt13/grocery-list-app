---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
product_contract_source: ce-brainstorm
---

# Grocery AI Coordinated Refresh - Plan

## Goal Capsule

**Objective:** Ship a coordinated refresh of the grocery list app — full stack maintenance (dependencies, deploy health, security), a configurable Claude model upgrade defaulting to latest Sonnet, and AI-powered dietary gap analysis with actionable suggestions on grocery lists.

**Product authority:** Requirements captured via ce-brainstorm dialogue (2026-07-25). This plan enriches the same artifact to implementation-ready.

**Stop conditions:** Do not ship with failing CI checks. Do not add proactive auto-review on list open (deferred). Do not build a generalized AI platform before grocery review ships.

**Execution profile:** Test-first for new behavior (TDD per project standards). Dependency upgrades verified incrementally with full test suite after each major bump.

**Product Contract preservation:** Product Contract unchanged.

---

## Product Contract

### Problem

The app has not been actively maintained since early 2025. Dependencies, deployment configuration, and the hardcoded Claude model may be stale. The meal planner already has AI chat, but grocery lists have no equivalent — users cannot get feedback on whether a list meets their dietary needs before shopping.

### Primary Actor

Household manager (busy parent) preparing grocery lists for their household.

### Desired Outcome

A working, deployable app with all tests passing, running on current supported dependencies with a configurable Claude model, plus a grocery list AI assistant that reviews lists for dietary gaps and offers suggestions the user can apply individually or in batch.

### Key Decisions

| ID  | Decision                                                                                                           | Rationale                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| K1  | Treat app refresh, model upgrade, and grocery AI chat as **equal-priority workstreams** in one coordinated release | User wants all three done together, not sequenced by priority                                            |
| K2  | App refresh scope = **dependencies + deploy health + security/maintenance**                                        | Full stack refresh, not any single dimension                                                             |
| K3  | Grocery AI delivers **gap analysis + actionable suggestions** (add/remove/swap)                                    | Core value is knowing what's missing and fixing the list, not compliance checking or free-form Q&A alone |
| K4  | Suggestions support **one-click apply per item** and **batch apply for selected items**                            | Reduces friction between review and list update                                                          |
| K5  | Dietary baseline = **stored household preferences + meal context on items + ad-hoc goals in chat**                 | Preferences are default context; meal tags and chat refine the review                                    |
| K6  | Claude model is **configurable (env-driven)**, defaulting to **latest Sonnet**                                     | Easy to swap models without code changes; Sonnet balances quality and cost for this workload             |
| K7  | Review output is **qualitative by default**; numeric nutritional detail **only when requested in chat**            | Avoids turning the feature into a nutrition tracker while allowing depth on demand                       |
| K8  | Recommended approach: **adapt the existing meal planner AI chat pattern** for grocery lists                        | Reuses proven UX and test patterns; avoids over-engineering a shared AI platform upfront                 |

### Requirements

#### R1 — App refresh

- Upgrade frontend and backend dependencies to current supported versions.
- Verify local development and production deployment paths work cleanly.
- Address security and maintenance items (patch known CVEs, validate env/config, refresh CI behavior as needed).
- All existing tests must pass after the refresh.

#### R2 — Model upgrade

- Replace the hardcoded Claude model identifier with a configurable setting (environment variable or equivalent).
- Default the setting to the latest recommended Sonnet at implementation time.
- Apply the configurable model to all existing AI surfaces (meal planner at minimum; grocery list AI from launch).

#### R3 — Grocery list AI dietary review

- Add an AI review experience on the grocery list detail view.
- On user request, the AI analyzes the current list against household dietary preferences, meal context on items, and ad-hoc goals stated in chat.
- The AI returns structured gap analysis (qualitative) and actionable suggestions (add/remove/swap).
- Each suggestion can be applied with one action; multiple suggestions can be batch-applied.
- Follow-up chat stays qualitative unless the user explicitly requests numeric detail.

### In Scope

- Full stack dependency, deploy, and security refresh.
- Configurable Claude model with latest Sonnet default.
- Grocery list AI gap analysis and actionable suggestions with one-click and batch apply.
- Reuse of household preferences and existing grocery/meal data as review context.

### Out of Scope

- Preference-compliance checking as the primary review mode.
- Standalone open Q&A chat without structured gap analysis and suggestions.
- Always-on calorie, macro, or micronutrient tracking or a nutrition dashboard.
- Proactive auto-review when opening a list.

### Success Criteria

- App deploys cleanly to production.
- All frontend and backend tests pass.
- Configurable model setting works and defaults to latest Sonnet.
- User can open a grocery list, request an AI dietary review, receive gap analysis and suggestions, and apply them individually or in batch.
- Existing meal planner AI continues to work on the upgraded stack and configurable model.

### Non-Goals

- Building a generalized AI platform or abstracting all chat UIs before shipping grocery list review.
- Nutritional analysis as a default, always-on numeric experience.
- Expanding AI to non-grocery, non-meal domains in this release.

---

## Planning Contract

### Key Technical Decisions

| ID   | Decision                                                                                     | Rationale                                                                                                                             |
| ---- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| KTD1 | Default model = `claude-sonnet-5` via `ANTHROPIC_MODEL` env var                              | Latest Sonnet per Anthropic docs (June 2026); replaces hardcoded `claude-sonnet-4-20250514` in `backend/services/meal_planning_ai.py` |
| KTD2 | Extract minimal `backend/services/anthropic_client.py` for shared API call + JSON extraction | Single place for model config and Sonnet 5 API constraints; meal and grocery services stay separate                                   |
| KTD3 | New endpoint `POST /api/grocery-lists/{list_id}/ai-review`                                   | Mirrors `POST /api/meals/ai-suggest`; grocery-specific prompt and response schema                                                     |
| KTD4 | Frontend: `AIGroceryReviewAssistant` adapted from `AIMealPlanningAssistant`                  | Reuses chat UX, selection, batch apply, and test patterns (K8)                                                                        |
| KTD5 | Upgrade Clerk 6→7 and React 18→19 with codemod + CI Node 20                                  | Clerk Core 3 requires Node 20.9+; app already on Next 16 with ClerkProvider in body                                                   |
| KTD6 | Incremental dependency bumps with test gate after each major version                         | Reduces blast radius; run `npm run test:ci` and `pytest` after Clerk, React, and backend bumps                                        |
| KTD7 | Add `householdId` to frontend `GroceryList` type and adapter                                 | AI review needs household context for auth and preferences; API already returns `household_id`                                        |
| KTD8 | Remove debug `#region agent log` blocks from `backend/config.py` and routes during refresh   | Security/maintenance cleanup; stray file writes to `.cursor/debug.log`                                                                |

### High-Level Technical Design

```
Grocery List Detail Page
  └── AIGroceryReviewAssistant (new)
        ├── POST /api/grocery-lists/{id}/ai-review
        │     └── grocery_list_ai.review_grocery_list()
        │           ├── gather context (list items, preferences, pantry, meals)
        │           └── anthropic_client.call() using settings.anthropic_model
        └── Apply suggestions → existing add/update/delete grocery item APIs

Meal Planner (existing)
  └── meal_planning_ai.call_anthropic_api()
        └── anthropic_client.call() (shared)
```

**Suggestion apply mapping:**

| Action | Frontend handler                                     |
| ------ | ---------------------------------------------------- |
| add    | `addGroceryItem()`                                   |
| remove | `deleteGroceryItem()`                                |
| swap   | remove old + add new (or update if item id provided) |

### Assumptions

- Sonnet 5 does not require `temperature` param (omit non-default sampling params per Anthropic Sonnet 5 migration notes).
- Clerk 7 codemod (`npx @clerk/upgrade`) handles most frontend migration; manual fixes limited to `proxy.ts` and `jest.setup.js`.
- Grocery list CRUD auth gaps on existing routes are out of scope unless ai-review route requires tightening adjacent handlers.

### Sequencing

1. **U1** Configurable model (unblocks both AI surfaces)
2. **U2 + U3** Dependency refresh (parallel frontend/backend, test after each major bump)
3. **U4** Grocery AI backend
4. **U5** Grocery AI frontend
5. **U6** Docs/env cleanup

### Risks & Dependencies

| Risk                                     | Mitigation                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Clerk 7 breaking auth in tests           | Update `jest.setup.js` mocks; run full frontend test suite                     |
| React 19 + Testing Library compatibility | Bump `@testing-library/react` to v15+ if needed                                |
| Sonnet 5 token usage increase            | Keep `max_tokens=4096`; monitor response size                                  |
| JSON parse failures from LLM             | Reuse markdown-stripping parser from meal planner; return 400 with clear error |

### Sources / Research

- Meal AI pattern: `backend/services/meal_planning_ai.py`, `components/meal-planner/AIMealPlanningAssistant.tsx`
- Grocery detail page: `app/grocery-lists/[id]/page.tsx`
- Current model hardcode: `backend/services/meal_planning_ai.py:387`
- Anthropic latest Sonnet: `claude-sonnet-5` ([Models overview](https://platform.claude.com/docs/en/about-claude/models/overview))

---

## Implementation Units

### U1. Configurable Claude model

**Goal:** Replace hardcoded model with env-driven config shared by all AI services.

**Requirements:** R2

**Files:**

- Modify: `backend/config.py`, `backend/services/meal_planning_ai.py`
- Create: `backend/services/anthropic_client.py`
- Modify: `railway-env-template.txt`, `backend/tests/services/test_meal_planning_ai.py`

**Approach:**

- Add `anthropic_model: str = "claude-sonnet-5"` to Settings (env `ANTHROPIC_MODEL`).
- Extract `call_anthropic_api(prompt, api_key, model)` and JSON markdown-stripping helper to `anthropic_client.py`.
- Update `meal_planning_ai.py` to use shared client and `settings.anthropic_model`.
- Remove debug agent-log regions from `config.py`.

**Test scenarios:**

- Default model is `claude-sonnet-5` when env unset.
- Custom `ANTHROPIC_MODEL` passed through to Anthropic client mock.
- Meal planning AI tests still pass with mocked client.

**Verification:** `cd backend && pytest tests/services/test_meal_planning_ai.py tests/routes/test_meals_ai_suggest.py`

**Dependencies:** None

---

### U2. Frontend dependency refresh

**Goal:** Upgrade frontend deps, CI Node version, and fix breaking changes.

**Requirements:** R1

**Files:**

- Modify: `package.json`, `package-lock.json`, `.github/workflows/ci.yml`
- Review/fix: `proxy.ts`, `jest.setup.js`, `app/providers.tsx`

**Approach:**

- Run `npx @clerk/upgrade` for Clerk 6→7.
- Bump React/React-DOM to 19, `@types/react*` to 19, `@testing-library/react` as needed.
- Update CI Node from 18 to 20.
- Fix any lint/test failures from deprecated Clerk APIs (`createRouteMatcher` in `proxy.ts`).
- Run `npm run lint`, `npm run format:check`, `npm run test:ci`, `npm run build`.

**Test scenarios:**

- All existing frontend tests pass.
- Build succeeds.
- ESLint and Prettier checks pass.

**Verification:** `npm run lint && npm run format:check && npm run test:ci && npm run build`

**Dependencies:** None (can parallel with U3)

---

### U3. Backend dependency refresh

**Goal:** Bump backend Python packages and verify tests.

**Requirements:** R1

**Files:**

- Modify: `backend/requirements.txt`

**Approach:**

- Bump `anthropic`, `fastapi`, and other outdated packages within compatible ranges.
- Keep `black==23.11.0` pinned per CI requirement.
- Run flake8 and black check, then full pytest suite.

**Test scenarios:**

- All backend tests pass.
- Flake8 and Black formatting checks pass.

**Verification:** `cd backend && flake8 . --exclude=alembic/versions --select=E9,F63,F7,F82 --count --show-source --statistics && black --check --exclude="/(alembic/versions|venv)/" . && pytest`

**Dependencies:** None (can parallel with U2)

---

### U4. Grocery AI backend service and endpoint

**Goal:** Add AI review endpoint returning gap analysis and structured suggestions.

**Requirements:** R3, K3, K5, K7

**Files:**

- Create: `backend/services/grocery_list_ai.py`
- Modify: `backend/schemas/grocery.py`, `backend/routes/grocery_lists.py`
- Create: `backend/tests/services/test_grocery_list_ai.py`
- Create: `backend/tests/routes/test_grocery_lists_ai_review.py`

**Approach:**

- Create `grocery_list_ai.py` mirroring meal service structure:
  - `gather_grocery_review_context(db, household_id, user_id, list_id)` — list items (with meal_type), preferences, optional pantry/meals.
  - `format_grocery_review_prompt()` — qualitative gap analysis instructions; numeric detail only when user message requests it.
  - `review_grocery_list()` — orchestrate gather → prompt → anthropic_client → parse.
- Add schemas: `GrocerySuggestion` (action: add/remove/swap, item fields), `GapAnalysis`, `AIReviewRequest`, `AIReviewResponse`.
- Add route `POST /{list_id}/ai-review` with `require_household_member` auth.
- Response JSON shape: `{ gap_analysis, suggestions[], conversation_history[] }`.

**Test scenarios:**

- Successful review returns gap_analysis and suggestions array.
- Conversation history appended and truncated to last 5 turns.
- 401 without auth, 403 for non-member, 404 for missing list.
- Invalid LLM JSON returns 400.
- Preferences and meal_type tags appear in prompt context (unit test on prompt formatter).
- Model read from settings.

**Verification:** `cd backend && pytest tests/services/test_grocery_list_ai.py tests/routes/test_grocery_lists_ai_review.py`

**Dependencies:** U1

---

### U5. Grocery AI frontend component and integration

**Goal:** Add chat assistant to grocery list detail with one-click and batch apply.

**Requirements:** R3, K4, K5

**Files:**

- Create: `components/grocery/AIGroceryReviewAssistant.tsx`
- Create: `components/grocery/GrocerySuggestionCard.tsx`
- Modify: `app/grocery-lists/[id]/page.tsx`, `lib/api/grocery.ts`, `lib/types.ts`, `lib/adapters/groceryAdapters.ts`
- Create: `components/grocery/__tests__/AIGroceryReviewAssistant.test.tsx`
- Modify: `app/grocery-lists/[id]/__tests__/page.test.tsx`

**Approach:**

- Add types: `GrocerySuggestion`, `GapAnalysis`, `AIReviewRequest`, `AIReviewResponse`.
- Add `householdId` to `GroceryList` type and adapter.
- Add `getAIGroceryReview()` to `lib/api/grocery.ts`.
- Build `AIGroceryReviewAssistant` from meal assistant pattern: chat input, gap analysis display, suggestion cards with checkbox selection, one-click apply, batch apply.
- Wire apply handlers to existing `addGroceryItem`, `updateGroceryItem`, `deleteGroceryItem` on list detail page.
- Mount assistant on grocery list detail page (collapsible panel or section below list header).

**Test scenarios:**

- Assistant renders on list detail page.
- Send message triggers API call and displays gap analysis + suggestions.
- One-click apply calls correct grocery API for add/remove/swap.
- Batch apply processes selected suggestions.
- Loading and error states display correctly.
- 401/403/500 errors show user-friendly messages.

**Verification:** `npm run test:ci -- --testPathPattern="AIGroceryReview|grocery-lists/\[id\]"`

**Dependencies:** U2, U4

---

### U6. Documentation and deployment config

**Goal:** Document new env vars and update deployment checklists.

**Requirements:** R1, R2

**Files:**

- Modify: `railway-env-template.txt`, `docs/DEPLOYMENT_CHECKLIST.md`, `README.md`

**Approach:**

- Add `ANTHROPIC_MODEL=claude-sonnet-5` to env template.
- Document grocery AI review feature and model config in README and deployment checklist.

**Test scenarios:** N/A (docs only)

**Verification:** Manual review of doc accuracy

**Dependencies:** U1, U4, U5

---

## Verification Contract

### Frontend (from project root)

```bash
npm run lint
npm run format:check
npm run test:ci
npm run build
```

### Backend (from `backend/`)

```bash
flake8 . --exclude=alembic/versions --select=E9,F63,F7,F82 --count --show-source --statistics
black --check --exclude="/(alembic/versions|venv)/" .
pytest
```

### Feature-specific

```bash
cd backend && pytest tests/services/test_grocery_list_ai.py tests/routes/test_grocery_lists_ai_review.py
npm run test:ci -- --testPathPattern="AIGroceryReview"
```

All commands must pass before merge.

---

## Definition of Done

### Global

- [ ] All three workstreams shipped: app refresh, configurable model, grocery AI review
- [ ] CI pipeline green (frontend + backend jobs)
- [ ] `ANTHROPIC_MODEL` documented and defaults to `claude-sonnet-5`
- [ ] Meal planner AI still works on upgraded stack
- [ ] Grocery list AI review: gap analysis + suggestions with one-click and batch apply
- [ ] Debug agent-log regions removed from backend config/routes
- [ ] No abandoned experimental code left in diff

### Per-unit

| Unit | Done when                                                |
| ---- | -------------------------------------------------------- |
| U1   | Model configurable; meal AI tests pass                   |
| U2   | Frontend deps upgraded; lint/format/test/build pass      |
| U3   | Backend deps upgraded; flake8/black/pytest pass          |
| U4   | ai-review endpoint tested; auth enforced                 |
| U5   | Assistant integrated on list detail; frontend tests pass |
| U6   | Docs and env template updated                            |
