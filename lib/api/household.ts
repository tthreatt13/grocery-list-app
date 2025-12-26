/**
 * Household Management API functions
 */

import { get, post, put, del } from './client'

// API Response Types (matching backend schemas)
export interface MemberResponse {
  id: number
  household_id: number
  user_id: number
  role: 'admin' | 'member' | 'viewer'
  joined_at: string
  user_email?: string
  user_name?: string
}

export interface HouseholdResponse {
  id: number
  name: string
  created_by: number
  created_at: string
}

export interface HouseholdWithMembersResponse extends HouseholdResponse {
  members: MemberResponse[]
}

export interface SharedListItem {
  id: number
  name: string
  created_by: number
  created_at: string
  updated_at: string
  item_count: number
}

export interface SharedListsResponse {
  household_id: number
  household_name: string
  lists: SharedListItem[]
}

export interface HouseholdPreferences {
  household_id: number
  user_id: number
  diet_types?: string[] | null
  cooking_apparatus?: string[] | null
  previous_meals?: string[] | null
  zip_code?: string | null
  created_at: string
  updated_at: string
}

export interface HouseholdPreferencesUpdate {
  diet_types?: string[] | null
  cooking_apparatus?: string[] | null
  previous_meals?: string[] | null
  zip_code?: string | null
}

// Request Types
export interface CreateHouseholdRequest {
  name: string
}

export interface UpdateHouseholdRequest {
  name?: string
}

export interface InviteMemberRequest {
  email: string
  role?: 'admin' | 'member' | 'viewer'
}

export interface UpdateMemberRoleRequest {
  role: 'admin' | 'member' | 'viewer'
}

// API Functions

/**
 * Get all households for the current user
 */
export async function getHouseholds(
  token: string
): Promise<HouseholdResponse[]> {
  return get<HouseholdResponse[]>('/api/households', token)
}

/**
 * Get a specific household with members
 */
export async function getHousehold(
  householdId: number,
  token: string
): Promise<HouseholdWithMembersResponse> {
  return get<HouseholdWithMembersResponse>(
    `/api/households/${householdId}`,
    token
  )
}

/**
 * Create a new household
 */
export async function createHousehold(
  data: CreateHouseholdRequest,
  token: string
): Promise<HouseholdResponse> {
  return post<HouseholdResponse>('/api/households', data, token)
}

/**
 * Update a household
 */
export async function updateHousehold(
  householdId: number,
  data: UpdateHouseholdRequest,
  token: string
): Promise<HouseholdResponse> {
  return put<HouseholdResponse>(`/api/households/${householdId}`, data, token)
}

/**
 * Delete a household (admin only)
 */
export async function deleteHousehold(
  householdId: number,
  token: string
): Promise<void> {
  return del<void>(`/api/households/${householdId}`, token)
}

/**
 * Invite a member to a household by email
 */
export async function inviteMember(
  householdId: number,
  data: InviteMemberRequest,
  token: string
): Promise<MemberResponse> {
  return post<MemberResponse>(
    `/api/households/${householdId}/members`,
    data,
    token
  )
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  householdId: number,
  userId: number,
  data: UpdateMemberRoleRequest,
  token: string
): Promise<MemberResponse> {
  return put<MemberResponse>(
    `/api/households/${householdId}/members/${userId}`,
    data,
    token
  )
}

/**
 * Remove a member from a household
 */
export async function removeMember(
  householdId: number,
  userId: number,
  token: string
): Promise<void> {
  return del<void>(`/api/households/${householdId}/members/${userId}`, token)
}

/**
 * Get all shared grocery lists for a household
 */
export async function getSharedLists(
  householdId: number,
  token: string
): Promise<SharedListsResponse> {
  return get<SharedListsResponse>(
    `/api/households/${householdId}/shared-lists`,
    token
  )
}

/**
 * Get current user's preferences for a household
 */
export async function getHouseholdPreferences(
  householdId: number,
  token: string
): Promise<HouseholdPreferences> {
  return get<HouseholdPreferences>(
    `/api/households/${householdId}/preferences/me`,
    token
  )
}

/**
 * Create or update current user's preferences for a household
 */
export async function updateHouseholdPreferences(
  householdId: number,
  data: HouseholdPreferencesUpdate,
  token: string
): Promise<HouseholdPreferences> {
  return put<HouseholdPreferences>(
    `/api/households/${householdId}/preferences/me`,
    data,
    token
  )
}
