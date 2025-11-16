# Household Member Edit Feature Implementation

## Overview
This document describes the implementation of the household member edit functionality, which allows household admins to edit member roles and enables all users to manage their own membership.

## Problem
Users were unable to edit household members once they were created. The backend API supported this functionality, but the frontend UI did not expose any way to trigger it.

## Solution
Implemented a complete edit and remove member workflow in the frontend with proper permissions and UI components.

## Changes Made

### 1. New Component: EditMemberForm
**File**: `components/household/EditMemberForm.tsx`

A new form component that allows admins to change a member's role with:
- Visual display of the member being edited
- Dropdown select for role (Admin, Member, Viewer)
- Helpful descriptions for each role
- Submit and Cancel actions

### 2. Updated Component: MemberCard
**File**: `components/household/MemberCard.tsx`

Enhanced the member card component with:
- **New Props**:
  - `isCurrentUserAdmin`: Boolean to check if current user is an admin
  - `isCurrentUser`: Boolean to check if the card represents the current user
  - `onEdit`: Callback for editing a member
  - `onRemove`: Callback for removing a member

- **New Features**:
  - "You" badge to identify the current user
  - Edit Role button (visible to admins for other members)
  - Remove button (visible to admins for other members)
  - Leave button (visible to current user for their own card)
  - Conditional rendering based on permissions

### 3. Updated Page: Household Management
**File**: `app/household/page.tsx`

Added comprehensive member management functionality:

#### New State Variables
- `isEditModalOpen`: Controls edit modal visibility
- `editingMember`: Stores the member being edited
- `currentUserMembership`: Tracks current user's membership status and role

#### New Handlers
- **`handleEditMember(member)`**: Opens the edit modal with selected member
- **`handleUpdateMemberRole(newRole)`**: Updates member role via API
- **`handleRemoveMember(member)`**: Removes member or allows user to leave household

#### Permission Checking
- Determines if current user is an admin
- Passes appropriate permissions to child components
- Prevents users from editing themselves

#### Modal Integration
- Edit Member modal with EditMemberForm component
- Proper modal state management

### 4. Updated Tests
**File**: `components/household/__tests__/MemberCard.test.tsx`

Added comprehensive tests for new functionality:
- Tests for edit and remove button visibility
- Tests for permission-based rendering
- Tests for callback invocation
- Tests for "You" badge display
- Tests for distinguishing between "Leave" and "Remove" buttons

**File**: `components/household/__tests__/EditMemberForm.test.tsx` (New)

Created comprehensive test suite:
- Form rendering with member information
- Role selection and changes
- Role description display
- Form submission with correct data
- Cancel functionality
- Form validation

## Permissions Model

### Admin Users Can:
- Edit roles of other members (not themselves)
- Remove other members
- Leave the household themselves

### Regular Members Can:
- Leave the household (remove themselves)
- View other members (no edit/remove)

### Viewers Can:
- Leave the household (remove themselves)
- View other members (no edit/remove)

## User Experience Flow

### Editing a Member (Admin Only)
1. Admin navigates to Household page
2. Each member card shows "Edit Role" button (except admin's own card)
3. Admin clicks "Edit Role"
4. Modal opens with EditMemberForm
5. Admin selects new role from dropdown
6. Admin clicks "Update Role"
7. API call updates the role
8. UI updates to reflect new role
9. Success message displayed

### Removing a Member (Admin)
1. Admin clicks "Remove" on member card
2. Confirmation dialog appears
3. Admin confirms
4. API call removes member
5. Member card disappears from UI
6. Success message displayed

### Leaving a Household (Any Member)
1. User clicks "Leave" on their own card
2. Confirmation dialog appears
3. User confirms
4. API call removes user from household
5. User is redirected to first available household or empty state
6. Success message displayed

## API Integration

### Endpoints Used
- `PUT /api/households/{household_id}/members/{user_id}` - Update member role
- `DELETE /api/households/{household_id}/members/{user_id}` - Remove member

### API Client Functions
- `updateMemberRole(householdId, userId, data, token)` - Already existed
- `removeMember(householdId, userId, token)` - Already existed

## Backend Compatibility
The backend already supported all necessary endpoints with proper permissions checking:
- Admin-only access for updating member roles
- Admin or self-removal permissions for removing members
- Comprehensive test coverage in `backend/tests/routes/test_households.py`

## Visual Design
- Edit button with pencil icon
- Remove/Leave button with trash icon in red
- Buttons appear in a horizontal row below member info
- Border separator between info and actions
- Responsive layout for mobile and desktop

## Error Handling
- Authentication checks before all operations
- API error messages displayed to user
- Confirmation dialogs for destructive actions
- Graceful handling of failed operations
- State rollback on errors

## Testing Strategy
- Unit tests for EditMemberForm component
- Unit tests for enhanced MemberCard component
- Permission-based rendering tests
- Callback invocation tests
- User interaction simulation tests

## Future Enhancements
Potential improvements for future iterations:
1. Toast notifications instead of alert() dialogs
2. Optimistic UI updates with rollback on error
3. Batch member management (edit multiple at once)
4. Member activity tracking
5. Email notifications for role changes
6. Audit log for member changes

