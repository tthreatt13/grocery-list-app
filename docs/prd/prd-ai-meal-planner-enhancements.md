# AI Meal Planner Enhancements: Auto-Scroll Fix, Eating Out Recognition, and Recipe Instructions

### TL;DR

This enhancement package for the AI Meal Planner addresses three distinct issues: preventing auto-scroll from hiding the chat window when the AI assistant opens, improving the AI's ability to recognize "eating out" meal scenarios and correctly assign the meal_category, and updating the MealDetailsModal to display formal recipe instructions with ingredients shown in each step. The result is an improved, user-friendly meal planning experience tailored for active users who need AI-driven flexibility and clarity.

---

## Goals

### Business Goals

- Increase user retention by reducing frustrations caused by UI bugs and missing features by 20% within the next quarter.
- Improve natural language understanding accuracy for "eating out" requests to over 95% recognition in AI prompt processing.
- Enhance perceived value of the product among premium users by offering professional-grade recipe views within the MealDetailsModal.
- Reduce customer support tickets relating to chat window usability and meal tracking confusion by at least 30%.

### User Goals

- Instantly access and interact with the AI assistant without chat window obstruction or scroll issues.
- Seamlessly log "eating out" or restaurant meals using a variety of natural phrases, with the AI categorizing these appropriately.
- View complete, step-by-step recipe instructions with ingredients included per step instead of generic or unlabeled notes.

### Non-Goals

- Development of an entirely new chat system or full redesign of the UI.
- Expansion to non-meal related AI use cases (e.g., fitness, grocery shopping).
- Advanced nutritional analysis or auto-scheduling for eating out scenarios in this release.

---

## User Stories

**Persona 1: Active Meal Planner User**

- As a user, I want the chat window to remain visible and accessible when the AI assistant opens, so I can easily view and interact with responses without UI obstructions.
- As a user, I want to record meals where I eat out using phrases like "Dining at a restaurant" or "Takeout for lunch" and have the app recognize and categorize these correctly.
- As a user, I want to see detailed, clear recipe instructions—including which ingredients are needed for each step—when viewing meal details, so I can follow recipes easily while cooking.

**Persona 2: Power User / Household Manager**

- As a power user, I want all my recipes to display instructions instead of notes in MealDetailsModal, allowing easier management and preparation for multiple family members.
- As a power user, I want the system to handle edge-case phrases like "Grabbing fast food" or "Cafe breakfast" when logging meals.

---

## Acceptance Criteria

### 1. Auto-Scroll Fix

**Chat Window Visibility and Scroll Behavior**

- When the AI assistant is opened from any screen, the chat window must remain fully visible within the user's current viewport—no part of the chat window is cut off or hidden below the fold.
  - _Pass condition:_ Upon opening the AI assistant, 100% of the chat interface (header, input, and last 2 responses) is visible without requiring the user to scroll.
- If the chat assistant is triggered while the user is scrolled mid-page or at the bottom, the chat window should appear anchored at its standard position (bottom or side), and the page must automatically scroll so the chat is entirely in view.
  - _Pass condition:_ After opening, the user can immediately interact with the chat input without scrolling or manually repositioning the view.
- The auto-scroll must **not** override or disrupt user-initiated scrolling if the chat is already visible.
  - _Fail condition:_ If the user is actively scrolling or the chat is already within view, no additional sudden movement is triggered.

**Desktop and Mobile Parity**

- On desktop browsers (Chrome, Firefox, Safari, and Edge, latest two versions), the chat window must remain visible and accessible regardless of window size, zoom, or scroll position.
- On mobile devices (iOS Safari, Chrome Mobile, Android browsers), the chat must anchor above any soft keyboards and remain fully visible when activated, without obstruction by the OS UI.
  - _Test protocol:_ Open/close chat on various scroll positions and device orientations.
- Keyboard navigation and focus should default to the chat input after opening, supporting screen readers and tab-accessibility.
  - _Pass condition:_ Tabbing after opening the assistant places cursor in the chat input field.

---

### 2. Eating Out Recognition

**Phrase Recognition Coverage**

- The AI prompt parsing must accurately recognize and correctly assign the "eating out" meal_category for each of the following phrases (test cases):
  - "Eating out"
  - "Dining at a restaurant"
  - "Takeout for lunch"
  - "Fast food breakfast"
  - "Ordering in pizza"
  - "Cafe breakfast"
  - "Grabbing lunch out"
  - "Dinner at a sushi place"
  - "Getting burgers from a drive-thru"
  - "Had ramen at a noodle shop"
  - "Coffee and pastry from a bakery"
- Each phrase must result in the associated meal entry displaying meal_category: "eating out" (or equivalent field).
  - _Pass condition:_ 100% correct assignment for all above phrases in manual and automated tests.

**Ambiguous and Edge Case Handling**

- For any entry that mixes home-cooked and eating out elements (e.g., "Ate salad at home, got burger from fast food"):
  - The system must either (a) split into two distinct records (one home-cooked, one eating out) **OR** (b) prompt the user for clarification within a single chat interaction.
    - _Test protocol:_ Enter at least three mixed-format entries and verify split/prompt behavior.
- Any unknown, ambiguous, or unsupported phrase must trigger either a prompt for clarification ("Is this a restaurant meal or home-cooked?") or flag for review—never result in silent misclassification.
- Ensure the system recognizes colloquialisms and regional terms for eating out with at least 95% accuracy as measured in an acceptance test set of 50 diverse phrases.
  - _Pass condition:_ No more than 2 misclassifications in the acceptance phrase set.

**Regression and Backwards Compatibility**

- No decrease in accuracy or wrongful re-categorization for typical home-cooked phrases (e.g., "Roasted chicken at home") as a result of these enhancements.

---

### 3. Recipe Instructions

**Instruction Label and Display Format**

- The "Notes" section in the MealDetailsModal is replaced with a clearly labeled "Recipe Instructions" section.
  - _Pass condition:_ No visual or textual references to "Notes" exist within the modal UI.
- Each recipe instruction is displayed in sequence (Step 1, Step 2, etc.), each delineated clearly.
  - _Format example:_
    - Step 1: Whisk flour and eggs together (Ingredients: flour, eggs)
    - Step 2: Fold in spinach (Ingredients: spinach)
    - Step 3: Bake for 20 minutes (Ingredients: none)
  - _Pass condition:_ Every saved recipe displays all steps with embedded ingredient details.

**Ingredient Inclusion per Step**

- For each recipe step, only the ingredients actually used in that step are listed, derived from the structured recipe data.
  - _Test protocol:_ Provide recipes with multi-step processes and verify ingredient mapping to each instruction; steps with no ingredient use explicitly state "Ingredients: none."
- Steps lacking ingredient annotation or missing ingredients for steps must trigger a validation warning in QA.

**Responsive and Cross-Device Layout**

- The modal layout must present instructions and ingredients clearly on desktop, tablet, and mobile—no overflow, truncation, or layout-breaking issues.
  - _Test protocol:_ View multiple recipes on each target device; steps/ingredients remain readable without horizontal scroll.

**Accessibility**

- Step-to-step navigation (keyboard or swipe) must remain smooth and screen reader-accessible, with each instruction and ingredient group announced clearly.

---

## Functional Requirements

- **Auto-Scroll/Chat Accessibility (Priority: High)**
  - Prevent UI auto-scroll from hiding the chat window when opening the AI assistant, both on desktop and mobile.
  - Ensure chat remains within the user's visible viewport at all times.

- **AI "Eating Out" Recognition (Priority: High)**
  - Update AI prompt and parsing logic to recognize various user phrases related to eating out (e.g., "eating out," "takeout," "restaurant," "fast food," "ordering in," "grabbing lunch out").
  - Correctly assign meal_category to "eating out" or appropriate equivalent when such phrases are detected.
  - Handle ambiguous or mixed entries (e.g., part cook-at-home, part takeout) gracefully.

- **MealDetailsModal Recipe Instructions (Priority: Medium)**
  - Replace "Notes" field in the MealDetailsModal with a "Recipe Instructions" section.
  - Display ingredients within each instruction step, reflecting the process rather than a bulleted list.
  - Ensure multi-step instructions are supported with clarity.

---

## User Experience

**Entry Point & First-Time User Experience**

- Users access the AI Meal Planner via the dashboard or main app navigation.
- First-time users receive a tooltip highlighting how to access the AI chat and log both home-cooked and "eating out" meals.
- A brief onboarding modal explains how recipe instructions with stepwise ingredients are now viewable.

**Core Experience**

- **Step 1:** User opens the AI assistant to log a new meal or seek meal planning advice.
  - The chat window remains anchored and visible, with no sudden scroll or displacement.
  - Any attempt to open the assistant is instantaneous, requiring minimal user effort.
- **Step 2:** User enters a meal scenario, potentially using phrases like "Dinner out at a sushi place," "Takeout pizza," or "Home-cooked lasagna."
  - The AI parses input, correctly identifies if the meal is "eating out," and sets the meal_category accordingly.
  - For ambiguous inputs, the app prompts the user for confirmation ("Is this a restaurant meal?").
- **Step 3:** When reviewing meal history, user selects a specific meal to open the MealDetailsModal.
  - "Recipe Instructions" replaces the old "Notes" field.
  - Instructions are shown as a step-by-step sequence, each step listing its required ingredients inline (e.g., "Step 1: Mix flour and eggs").
- **Step 4:** User can easily distinguish between "eating out" meals and home-cooked ones in summaries or reports.

**Advanced Features & Edge Cases**

- If a user combines "eating out" and home-cooked items (e.g., "ate salad at home, got burger from fast food"), the AI splits entries or prompts for clarification.
- System logs and flags any unrecognized or ambiguous meal entries for future AI improvement.
- Accessibility shortcuts ensure keyboard navigation for chat is never blocked or hidden.

**UI/UX Highlights**

- Maintain high color contrast and large tap areas, especially in chat and modal components.
- Responsive layouts for MealDetailsModal with stepwise instructions on mobile and tablet.
- Clear section labels: "Recipe Instructions" replaces all legacy references to "Notes."

---

## Narrative

On a busy weekday, Sam, a frequent user of the AI Meal Planner, needs to quickly track lunch. He's eating out with coworkers but struggles when previous versions of the app either miscategorized "restaurant lunch" or the chat window hid itself off-screen, forcing multiple page refreshes and wasted time.

With these enhancements, Sam opens the AI assistant—now reliably anchored in view—and types "Lunch at a Thai restaurant." Instantly, the AI recognizes the eating out scenario, auto-categorizes the meal correctly, and presents an organized log entry. Later, as Sam plans dinner, he pulls up a home-cooked recipe via the MealDetailsModal, now greeted with clearly labeled, step-based instructions listing precise ingredients for each step.

Tracking his meals, Sam no longer experiences UI frustrations or recipe confusion—he finds meal logging and preparation simpler, saving time and reducing stress, which leads him to engage with the platform daily. The business benefits from increased user satisfaction and reduced support inquiries.

---

## Success Metrics

| Metric                          | Measurement Method                        |
| ------------------------------- | ----------------------------------------- |
| Chat window visibility bug rate | Error logs and user-reported issues       |
| Eating out meal recognition     | Percentage correctly auto-categorized     |
| Recipe instructions engagement  | Modal opens where instructions are viewed |
| User satisfaction (UX survey)   | Quarterly NPS and feature feedback        |
| Reduction in support tickets    | Ticket analytics for chat/UI/meal issues  |
| Regression error rate           | Automated test suite pass percentage      |

### User-Centric Metrics

- Number and frequency of chat interactions without auto-scroll complaints.
- Percentage of eating out meal logs correctly classified per user session.
- Number of recipe views and completion of instruction steps.

### Business Metrics

- Month-over-month retention rate improvement.
- 30% drop in customer support tickets for chat or meal issue categories.
- Uptick in daily active users engaging with AI assistant and recipes.

### Technical Metrics

- <1% regression bug recurrence in auto-scroll, meal parsing, and modal logic.
- Sub-500ms average response time for AI prompt processing.
- 99.9% uptime for Meal Planner interface.

### Tracking Plan

- User opens AI assistant/chat (event)
- Chat window visibility changes (event)
- User logs meal with "eating out" detected (event)
- Meal category auto-classified (event)
- Recipe Instructions modal viewed (event)
- Instruction step navigation (event)
- Error or ambiguous meal logs flagged (event)

---

## Technical Considerations

### Technical Needs

- **Front-End:** Update chat window rendering logic and scrolling behavior; revise MealDetailsModal component to support instruction steps and ingredient parsing; update copy and localization as needed.
- **AI/NLP Layer:** Modify prompt templates and parsing rules to find and correctly label "eating out" scenarios in user input.
- **Back-End:** Ensure meal_category field allows "eating out" and is compatible with existing reporting; update validation.

### Integration Points

- Existing AI meal suggestion and meal logging APIs.
- User profile and meal history storage services.
- Analytics/event tracking framework for engagement and error events.

### Data Storage & Privacy

- All logs of meal entries, chat usage, and recipe views remain subject to existing privacy standards.
- No sensitive or health-related data classification changes in this release.
- Recipe instructions and meal categories should map to existing data model fields; update migrations if required.

### Scalability & Performance

- Prepare for ~10,000 users concurrently logging or viewing meals during peak hours.
- Sub-second latency target for AI classification and chat opening.

### Potential Challenges

- Ensuring AI-assisted "eating out" recognition covers a wide and unpredictable variety of user phrases.
- Backwards compatibility for legacy Notes data without breaking user experience.
- Preventing UI regressions, especially on less common mobile browsers.

---

## Milestones & Sequencing

### Project Estimate

**Medium: 2–4 weeks total development and validation**

### Team Size & Composition

**Small Team:** 2 engineers (frontend/backend blend), 1 product designer (as needed), and product lead for QA/validation.

### Suggested Phases

**Phase 1: Requirements & Design (3 days)**

- Key Deliverables: Product lead, designer; specs, UI mocks for chat and modal updates.
- Dependencies: Access to user bug reports, list of known "eating out" phrases.

**Phase 2: Auto-Scroll/Chat Fix (4 days)**

- Key Deliverables: Engineer; chat window scroll/visibility bug fix deployed.
- Dependencies: None.

**Phase 3: AI Prompt & Meal Category Enhancement (6 days)**

- Key Deliverables: Engineer; update AI prompt, add phrase coverage, and enhance API meal_category recognition.
- Dependencies: New prompt logic, test suite for "eating out" cases.

**Phase 4: MealDetailsModal Instructions Update (4 days)**

- Key Deliverables: Engineer; replace Notes UI, add ingredient-by-step logic, migrate existing recipe data where possible.
- Dependencies: Updated data model if necessary.

**Phase 5: Validation & QA (3 days)**

- Key Deliverables: All; comprehensive testing on desktop, mobile, and tablet, with regression and accessibility validation.
- Dependencies: Finished features from prior phases.

**Phase 6: Launch & Monitor (2 days)**

- Key Deliverables: Product lead; measure KPI metrics, collect early user feedback.
- Dependencies: All above complete.

---
