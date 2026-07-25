---
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
---

# Grocery AI Coordinated Refresh - Plan

## Goal Capsule

**Objective:** Ship a coordinated refresh of the grocery list app — full stack maintenance (dependencies, deploy health, security), a configurable Claude model upgrade defaulting to latest Sonnet, and AI-powered dietary gap analysis with actionable suggestions on grocery lists.

**Product authority:** Requirements captured via ce-brainstorm dialogue (2026-07-25).

**Open blockers:** None identified at requirements stage. "Latest Sonnet" resolves to Anthropic's current recommended Sonnet at implementation time via the configurable model setting.

---

## Product Contract

### Problem

The app has not been actively maintained since early 2025. Dependencies, deployment configuration, and the hardcoded Claude model may be stale. The meal planner already has AI chat, but grocery lists have no equivalent — users cannot get feedback on whether a list meets their dietary needs before shopping.

### Primary Actor

Household manager (busy parent) preparing grocery lists for their household.

### Desired Outcome

A working, deployable app with all tests passing, running on current supported dependencies with a configurable Claude model, plus a grocery list AI assistant that reviews lists for dietary gaps and offers suggestions the user can apply individually or in batch.

### Key Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| K1 | Treat app refresh, model upgrade, and grocery AI chat as **equal-priority workstreams** in one coordinated release | User wants all three done together, not sequenced by priority |
| K2 | App refresh scope = **dependencies + deploy health + security/maintenance** | Full stack refresh, not any single dimension |
| K3 | Grocery AI delivers **gap analysis + actionable suggestions** (add/remove/swap) | Core value is knowing what's missing and fixing the list, not compliance checking or free-form Q&A alone |
| K4 | Suggestions support **one-click apply per item** and **batch apply for selected items** | Reduces friction between review and list update |
| K5 | Dietary baseline = **stored household preferences + meal context on items + ad-hoc goals in chat** | Preferences are default context; meal tags and chat refine the review |
| K6 | Claude model is **configurable (env-driven)**, defaulting to **latest Sonnet** | Easy to swap models without code changes; Sonnet balances quality and cost for this workload |
| K7 | Review output is **qualitative by default**; numeric nutritional detail **only when requested in chat** | Avoids turning the feature into a nutrition tracker while allowing depth on demand |
| K8 | Recommended approach: **adapt the existing meal planner AI chat pattern** for grocery lists | Reuses proven UX and test patterns; avoids over-engineering a shared AI platform upfront |

### Requirements

#### App refresh

- Upgrade frontend and backend dependencies to current supported versions.
- Verify local development and production deployment paths work cleanly.
- Address security and maintenance items (patch known CVEs, validate env/config, refresh CI behavior as needed).
- All existing tests must pass after the refresh.

#### Model upgrade

- Replace the hardcoded Claude model identifier with a configurable setting (environment variable or equivalent).
- Default the setting to the latest recommended Sonnet at implementation time.
- Apply the configurable model to all existing AI surfaces (meal planner at minimum; grocery list AI from launch).

#### Grocery list AI dietary review

- Add an AI review experience on the grocery list detail view.
- On user request, the AI analyzes the current list against:
  - Household dietary preferences (diet types, restrictions, etc. from saved settings).
  - Meal context associated with list items (e.g., meal type tags) when present.
  - Ad-hoc goals stated in the chat (e.g., "more protein this week").
- The AI returns structured gap analysis (qualitative: food groups, balance, missing categories) and actionable suggestions (specific adds, removals, or swaps).
- Each suggestion can be applied to the list with one action.
- Multiple suggestions can be selected and applied in a single batch operation.
- Users can ask follow-up questions in chat; responses stay qualitative unless the user explicitly requests numeric detail.

### In Scope

- Full stack dependency, deploy, and security refresh.
- Configurable Claude model with latest Sonnet default.
- Grocery list AI gap analysis and actionable suggestions with one-click and batch apply.
- Reuse of household preferences and existing grocery/meal data as review context.

### Out of Scope

- Preference-compliance checking as the primary review mode (conflicts may surface incidentally but are not the focus).
- Standalone open Q&A chat without structured gap analysis and suggestions.
- Always-on calorie, macro, or micronutrient tracking or a nutrition dashboard.
- Proactive auto-review when opening a list (deferred; may revisit after manual chat ships).

### Success Criteria

- App deploys cleanly to production.
- All frontend and backend tests pass.
- Configurable model setting works and defaults to latest Sonnet.
- User can open a grocery list, request an AI dietary review, receive gap analysis and suggestions, and apply them individually or in batch.
- Existing meal planner AI continues to work on the upgraded stack and configurable model.

### Outstanding Questions

- None blocking requirements. Implementation planning should resolve: exact Sonnet model string at ship time, and whether any dependency major-version bumps (e.g., Clerk 6→7, React 18→19) require migration steps beyond version bumps.

### Non-Goals

- Building a generalized AI platform or abstracting all chat UIs before shipping grocery list review.
- Nutritional analysis as a default, always-on numeric experience.
- Expanding AI to non-grocery, non-meal domains in this release.
