# Task List: Front-End UI Prototype for Grocery App

## Feature Overview
Build a working front-end UI prototype (React + Next.js) with mock data to visualize and test the user experience for busy parents. This prototype will include all core screens and interactions before backend integration.

## Target User
Busy parents who need to efficiently plan weekly meals and manage grocery shopping for their family.

## Relevant Files

### Configuration & Setup
- `package.json` - Project dependencies and scripts
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration for Tailwind
- `.gitignore` - Git ignore file for node_modules, .next, etc.

### Layout & Core Structure
- `app/layout.tsx` - Root layout component with navigation
- `app/page.tsx` - Home/dashboard page
- `app/globals.css` - Global styles and Tailwind imports

### Design System Components
- `components/ui/Button.tsx` - Reusable button component
- `components/ui/Input.tsx` - Input field component
- `components/ui/Card.tsx` - Card container component
- `components/ui/Modal.tsx` - Modal/dialog component
- `components/ui/Badge.tsx` - Badge component for categories/tags
- `components/ui/Checkbox.tsx` - Checkbox component
- `components/ui/Select.tsx` - Dropdown select component

### Navigation Components
- `components/layout/Navbar.tsx` - Top navigation bar
- `components/layout/Sidebar.tsx` - Side navigation (optional for desktop)
- `components/layout/MobileNav.tsx` - Mobile bottom navigation

### Grocery List Feature
- `app/grocery-lists/page.tsx` - Grocery lists overview page
- `app/grocery-lists/[id]/page.tsx` - Individual list detail page
- `components/grocery/GroceryListCard.tsx` - List preview card
- `components/grocery/GroceryListItem.tsx` - Individual item component
- `components/grocery/AddItemForm.tsx` - Form to add new items
- `components/grocery/CategoryFilter.tsx` - Filter by category

### Pantry Inventory Feature
- `app/pantry/page.tsx` - Pantry inventory page
- `components/pantry/PantryItemCard.tsx` - Individual pantry item card
- `components/pantry/AddPantryItemForm.tsx` - Form to add pantry items
- `components/pantry/PantryGrid.tsx` - Grid view of pantry items

### Meal Planner Feature
- `app/meal-planner/page.tsx` - Weekly meal planner page
- `components/meal-planner/WeeklyCalendar.tsx` - Calendar view component
- `components/meal-planner/MealCard.tsx` - Individual meal card
- `components/meal-planner/AddMealModal.tsx` - Modal to add meals

### Household/Family Management
- `app/household/page.tsx` - Household management page
- `components/household/MemberCard.tsx` - Family member card
- `components/household/InviteMemberForm.tsx` - Form to invite members
- `components/household/SharedListsView.tsx` - View of shared lists

### Mock Data & Utils
- `lib/mockData.ts` - Mock data for all features
- `lib/types.ts` - TypeScript type definitions
- `lib/utils.ts` - Utility functions (classnames, formatters, etc.)

### Notes
- We're using Next.js 14+ App Router (not Pages Router)
- All components should be functional components using React hooks
- Use Tailwind CSS for all styling (no CSS modules or styled-components)
- Components should be responsive-first (mobile → tablet → desktop)
- Mock data will simulate real backend responses

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for frontend UI development (e.g., `git checkout -b feature/frontend-ui-prototype`)

- [x] 1.0 Set up Next.js project with Tailwind CSS
  - [x] 1.1 Initialize Next.js project with TypeScript using `npx create-next-app@latest grocery-app --typescript --tailwind --app --no-src-dir`
  - [x] 1.2 Review and update `package.json` to ensure all dependencies are correct (added Jest and RTL for TDD)
  - [x] 1.3 Configure `tailwind.config.js` with custom colors for the app theme (primary, secondary, accent colors for busy parents)
  - [x] 1.4 Set up `app/globals.css` with Tailwind directives and any global custom styles
  - [x] 1.5 Create `.gitignore` to exclude `node_modules/`, `.next/`, `.env.local`, etc.
  - [x] 1.6 Test the setup by running `npm run dev` and verify the default page loads at http://localhost:3000
  - [x] 1.7 Commit the initial setup with message "chore: initialize Next.js project with Tailwind CSS"

- [ ] 2.0 Create design system and reusable UI components
  - [x] 2.1 Create `lib/types.ts` with TypeScript interfaces for GroceryList, GroceryItem, PantryItem, Meal, HouseholdMember
  - [x] 2.2 Create `lib/utils.ts` with utility functions (e.g., `cn()` for className merging, date formatters)
  - [x] 2.3 Create `components/ui/Button.tsx` with variants (primary, secondary, outline, ghost) and sizes (sm, md, lg)
  - [x] 2.4 Create `components/ui/Input.tsx` with label, error state, and placeholder support
  - [x] 2.5 Create `components/ui/Card.tsx` as a container component with optional header, body, and footer
  - [x] 2.6 Create `components/ui/Modal.tsx` with open/close state, backdrop, and accessibility (focus trap, ESC to close)
  - [x] 2.7 Create `components/ui/Badge.tsx` for displaying categories, tags, or status indicators
  - [x] 2.8 Create `components/ui/Checkbox.tsx` with checked/unchecked states and onChange handler
  - [x] 2.9 Create `components/ui/Select.tsx` dropdown component with options array prop
  - [x] 2.10 Test all UI components by creating a temporary test page and verify they render correctly
  - [x] 2.11 Commit design system components with message "feat: add reusable UI components"

- [x] 3.0 Build grocery list UI screens
  - [x] 3.1 Create `components/layout/Navbar.tsx` with app logo, navigation links, and user avatar placeholder
  - [x] 3.2 Create `components/layout/MobileNav.tsx` for bottom navigation on mobile (Home, Lists, Pantry, Planner, Family)
  - [x] 3.3 Update `app/layout.tsx` to include Navbar and MobileNav components
  - [x] 3.4 Create `app/page.tsx` as dashboard/home page with quick stats and recent activity
  - [x] 3.5 Create `app/grocery-lists/page.tsx` showing all grocery lists in a grid layout
  - [x] 3.6 Create `components/grocery/GroceryListCard.tsx` to display list preview with title, item count, and last updated date
  - [x] 3.7 Add "Create New List" button on grocery-lists page that opens a modal
  - [x] 3.8 Create `app/grocery-lists/[id]/page.tsx` for individual list detail view
  - [x] 3.9 Create `components/grocery/GroceryListItem.tsx` with checkbox, item name, quantity, and category badge
  - [x] 3.10 Create `components/grocery/AddItemForm.tsx` with fields for item name, quantity, category, and notes
  - [x] 3.11 Create `components/grocery/CategoryFilter.tsx` to filter items by category (Produce, Dairy, Meat, etc.)
  - [x] 3.12 Add ability to check off items (strike-through effect) in the list detail view
  - [x] 3.13 Add "Share List" button placeholder on list detail page
  - [x] 3.14 Commit grocery list UI with message "feat: add grocery list screens and components"

- [ ] 4.0 Build pantry inventory UI screens
  - [ ] 4.1 Create `app/pantry/page.tsx` as main pantry inventory page
  - [ ] 4.2 Create `components/pantry/PantryGrid.tsx` to display items in a responsive grid
  - [ ] 4.3 Create `components/pantry/PantryItemCard.tsx` with item name, quantity, expiration date, and image placeholder
  - [ ] 4.4 Add visual indicators for items that are low stock (badge or color)
  - [ ] 4.5 Add visual indicators for items expiring soon (warning color/icon)
  - [ ] 4.6 Create `components/pantry/AddPantryItemForm.tsx` with fields for name, quantity, category, expiration date
  - [ ] 4.7 Add "Add to Pantry" button that opens modal with AddPantryItemForm
  - [ ] 4.8 Add category filter dropdown for pantry items
  - [ ] 4.9 Add search functionality to filter pantry items by name
  - [ ] 4.10 Commit pantry inventory UI with message "feat: add pantry inventory screens and components"

- [ ] 5.0 Build weekly meal planner UI screens
  - [ ] 5.1 Create `app/meal-planner/page.tsx` as main meal planner page
  - [ ] 5.2 Create `components/meal-planner/WeeklyCalendar.tsx` showing 7 days with breakfast, lunch, dinner slots
  - [ ] 5.3 Create `components/meal-planner/MealCard.tsx` to display meal name, image placeholder, and quick actions
  - [ ] 5.4 Add ability to click on empty meal slot to open AddMealModal
  - [ ] 5.5 Create `components/meal-planner/AddMealModal.tsx` with meal name, meal type, and notes fields
  - [ ] 5.6 Add "Generate Grocery List from Week" button to create list from all planned meals
  - [ ] 5.7 Add navigation arrows to move between weeks (previous/next week)
  - [ ] 5.8 Add drag-and-drop placeholder indicators for future enhancement
  - [ ] 5.9 Commit meal planner UI with message "feat: add weekly meal planner screens and components"

- [ ] 6.0 Build household/family management UI screens
  - [ ] 6.1 Create `app/household/page.tsx` as household management page
  - [ ] 6.2 Create `components/household/MemberCard.tsx` showing member name, avatar, role, and status
  - [ ] 6.3 Display list of current household members with their roles (Admin, Member, Viewer)
  - [ ] 6.4 Create `components/household/InviteMemberForm.tsx` with email input and role selector
  - [ ] 6.5 Add "Invite Member" button that opens modal with InviteMemberForm
  - [ ] 6.6 Create `components/household/SharedListsView.tsx` showing which lists are shared with whom
  - [ ] 6.7 Add ability to see who last edited each shared list (with timestamp)
  - [ ] 6.8 Commit household management UI with message "feat: add household/family management screens"

- [ ] 7.0 Add mock data and interaction flows
  - [ ] 7.1 Create `lib/mockData.ts` with at least 3 sample grocery lists with items
  - [ ] 7.2 Add mock data for 15-20 pantry items with varied expiration dates and quantities
  - [ ] 7.3 Add mock data for a week of meal plans (with some days empty, some filled)
  - [ ] 7.4 Add mock data for 3-4 household members with different roles
  - [ ] 7.5 Import and use mock data in all relevant page components
  - [ ] 7.6 Add React state management (useState) to handle adding/removing items in UI
  - [ ] 7.7 Implement checking off grocery items (toggle checked state)
  - [ ] 7.8 Implement filtering by category on grocery lists and pantry pages
  - [ ] 7.9 Implement search functionality on pantry page
  - [ ] 7.10 Add toast notifications or success messages when actions complete (can use simple alert for now)
  - [ ] 7.11 Test all user flows: creating lists, adding items, checking off items, planning meals, managing household
  - [ ] 7.12 Commit mock data and interactions with message "feat: add mock data and UI interactions"

- [ ] 8.0 Test responsive design and mobile experience
  - [ ] 8.1 Test all pages on mobile viewport (375px width) using browser dev tools
  - [ ] 8.2 Test all pages on tablet viewport (768px width)
  - [ ] 8.3 Test all pages on desktop viewport (1440px width)
  - [ ] 8.4 Verify bottom mobile navigation works correctly and highlights active page
  - [ ] 8.5 Verify all modals are properly centered and scrollable on small screens
  - [ ] 8.6 Verify all forms are usable with proper input sizes on mobile
  - [ ] 8.7 Test that grocery list items are easy to check off on mobile (large touch targets)
  - [ ] 8.8 Verify calendar view in meal planner is scrollable/usable on mobile
  - [ ] 8.9 Fix any layout issues or overlapping elements found during testing
  - [ ] 8.10 Add touch-friendly button sizes (minimum 44x44px) where needed
  - [ ] 8.11 Commit responsive design fixes with message "fix: improve responsive design for mobile and tablet"
  - [ ] 8.12 Create a simple README.md with setup instructions and feature overview
  - [ ] 8.13 Push feature branch to GitHub and create a pull request (or merge to main if working solo)
  - [ ] 8.14 Deploy prototype to Vercel or Netlify for live preview (optional but recommended)

