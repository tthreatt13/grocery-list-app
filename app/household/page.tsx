'use client'

import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import MemberCard from '@/components/household/MemberCard'
import InviteMemberForm from '@/components/household/InviteMemberForm'
import EditMemberForm from '@/components/household/EditMemberForm'
import SharedListsView from '@/components/household/SharedListsView'
import { HouseholdMember, MemberRole } from '@/lib/types'
import {
  getHouseholds,
  getHousehold,
  getSharedLists,
  inviteMember,
  updateMemberRole,
  removeMember,
  createHousehold,
  HouseholdResponse,
  MemberResponse,
  SharedListsResponse,
} from '@/lib/api/household'
import { syncUser } from '@/lib/api/client'

// Helper to convert API response to HouseholdMember type
function convertMemberResponse(member: MemberResponse): HouseholdMember {
  // Convert lowercase API role to capitalized MemberRole enum
  const roleMap: Record<string, MemberRole> = {
    admin: MemberRole.ADMIN,
    member: MemberRole.MEMBER,
    viewer: MemberRole.VIEWER,
  }

  return {
    id: member.user_id.toString(),
    name: member.user_name || 'User',
    email: member.user_email || '',
    role: roleMap[member.role] || MemberRole.VIEWER,
    joinedAt: new Date(member.joined_at),
  }
}

export default function HouseholdPage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [households, setHouseholds] = useState<HouseholdResponse[]>([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(
    null
  )
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [sharedListsData, setSharedListsData] =
    useState<SharedListsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(
    null
  )
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false)
  const [userSynced, setUserSynced] = useState(false)
  const [currentUserMembership, setCurrentUserMembership] =
    useState<MemberResponse | null>(null)

  // Sync user to backend on mount
  useEffect(() => {
    async function syncUserToBackend() {
      if (!user) return

      try {
        const email = user.primaryEmailAddress?.emailAddress
        const name =
          user.fullName ||
          `${user.firstName || ''} ${user.lastName || ''}`.trim()

        if (!email) {
          console.error('No email found for user')
          setError('Your account does not have an email address')
          return
        }

        await syncUser({
          clerk_user_id: user.id,
          email: email,
          name: name || undefined,
        })

        setUserSynced(true)
      } catch (err) {
        console.error('Error syncing user:', err)
        // Don't set error here, just log it - we'll try to continue anyway
      }
    }

    syncUserToBackend()
  }, [user])

  // Fetch households after user is synced
  useEffect(() => {
    async function fetchHouseholds() {
      if (!userSynced) return

      try {
        setIsLoading(true)
        setError(null)
        const token = await getToken()
        if (!token) {
          setError('Authentication required')
          return
        }

        const householdsData = await getHouseholds(token)
        setHouseholds(householdsData)

        if (householdsData.length > 0) {
          setSelectedHouseholdId(householdsData[0].id)
        }
      } catch (err) {
        console.error('Error fetching households:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load households'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchHouseholds()
  }, [getToken, userSynced])

  // Fetch household details when household is selected
  useEffect(() => {
    async function fetchHouseholdDetails() {
      if (!selectedHouseholdId || !user) return

      try {
        setError(null)
        const token = await getToken()
        if (!token) {
          setError('Authentication required')
          return
        }

        // Fetch household with members
        const householdData = await getHousehold(selectedHouseholdId, token)
        const convertedMembers = householdData.members.map(
          convertMemberResponse
        )
        setMembers(convertedMembers)

        // Find current user's membership to check if they're an admin
        const userEmail = user.primaryEmailAddress?.emailAddress
        const currentMembership = householdData.members.find(
          (m) => m.user_email === userEmail
        )
        setCurrentUserMembership(currentMembership || null)

        // Fetch shared lists
        const sharedLists = await getSharedLists(selectedHouseholdId, token)
        setSharedListsData(sharedLists)
      } catch (err) {
        console.error('Error fetching household details:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load household details'
        )
      }
    }

    fetchHouseholdDetails()
  }, [selectedHouseholdId, getToken, user])

  // Filter only shared lists
  const sharedLists = sharedListsData?.lists || []

  // Handle inviting new member
  const handleInviteMember = async (data: {
    email: string
    role: MemberRole
  }) => {
    if (!selectedHouseholdId) return

    try {
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const memberResponse = await inviteMember(
        selectedHouseholdId,
        {
          email: data.email,
          role: data.role.toLowerCase() as 'admin' | 'member' | 'viewer',
        },
        token
      )

      const newMember = convertMemberResponse(memberResponse)
      setMembers([...members, newMember])
      setIsInviteModalOpen(false)

      // Show success message
      alert(`Invitation sent to ${data.email}!`)
    } catch (err) {
      console.error('Error inviting member:', err)
      setError(err instanceof Error ? err.message : 'Failed to invite member')
    }
  }

  // Handle creating a new household
  const handleCreateHousehold = async () => {
    const householdName = prompt('Enter household name:')
    if (!householdName) return

    try {
      setIsCreatingHousehold(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const newHousehold = await createHousehold({ name: householdName }, token)
      setHouseholds([...households, newHousehold])
      setSelectedHouseholdId(newHousehold.id)
    } catch (err) {
      console.error('Error creating household:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to create household'
      )
    } finally {
      setIsCreatingHousehold(false)
    }
  }

  // Handle editing a member
  const handleEditMember = (member: HouseholdMember) => {
    setEditingMember(member)
    setIsEditModalOpen(true)
  }

  // Handle updating member role
  const handleUpdateMemberRole = async (newRole: MemberRole) => {
    if (!selectedHouseholdId || !editingMember) return

    try {
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Convert role to lowercase for API
      const apiRole = newRole.toLowerCase() as 'admin' | 'member' | 'viewer'

      const updatedMemberResponse = await updateMemberRole(
        selectedHouseholdId,
        parseInt(editingMember.id),
        { role: apiRole },
        token
      )

      // Update local state
      const updatedMember = convertMemberResponse(updatedMemberResponse)
      setMembers(
        members.map((m) => (m.id === updatedMember.id ? updatedMember : m))
      )

      setIsEditModalOpen(false)
      setEditingMember(null)

      // Show success message
      alert(`${editingMember.name}'s role has been updated to ${newRole}`)
    } catch (err) {
      console.error('Error updating member role:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to update member role'
      )
    }
  }

  // Handle removing a member
  const handleRemoveMember = async (member: HouseholdMember) => {
    if (!selectedHouseholdId) return

    const isCurrentUser =
      user?.primaryEmailAddress?.emailAddress === member.email
    const confirmMessage = isCurrentUser
      ? 'Are you sure you want to leave this household?'
      : `Are you sure you want to remove ${member.name} from this household?`

    if (!confirm(confirmMessage)) return

    try {
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      await removeMember(selectedHouseholdId, parseInt(member.id), token)

      // Update local state
      setMembers(members.filter((m) => m.id !== member.id))

      // Show success message
      if (isCurrentUser) {
        alert('You have left the household')
        // Refresh households list
        const householdsData = await getHouseholds(token)
        setHouseholds(householdsData)
        if (householdsData.length > 0) {
          setSelectedHouseholdId(householdsData[0].id)
        } else {
          setSelectedHouseholdId(null)
        }
      } else {
        alert(`${member.name} has been removed from the household`)
      }
    } catch (err) {
      console.error('Error removing member:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  // Count members by role
  const adminCount = members.filter((m) => m.role === MemberRole.ADMIN).length
  const memberCount = members.filter((m) => m.role === MemberRole.MEMBER).length
  const viewerCount = members.filter((m) => m.role === MemberRole.VIEWER).length

  // Check if current user is admin
  const isCurrentUserAdmin = currentUserMembership?.role === 'admin'
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading household...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* No household message */}
      {households.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Household Found
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first household to start managing grocery lists
          </p>
          <Button
            onClick={handleCreateHousehold}
            disabled={isCreatingHousehold}
          >
            {isCreatingHousehold ? 'Creating...' : 'Create Household'}
          </Button>
        </div>
      )}

      {/* Header */}
      {households.length > 0 && (
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Household Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your household members and view shared grocery lists
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {households.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Members
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {members.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Admins</p>
                <p className="text-3xl font-bold text-gray-900">{adminCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Members
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {memberCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Viewers
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {viewerCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Household Members Section */}
      {households.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Household Members
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Manage who has access to your household&apos;s grocery lists
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsInviteModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Invite Member
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrentUserAdmin={isCurrentUserAdmin}
                isCurrentUser={member.email === currentUserEmail}
                onEdit={handleEditMember}
                onRemove={handleRemoveMember}
              />
            ))}
          </div>
        </div>
      )}

      {/* Shared Lists Section */}
      {households.length > 0 && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Shared Grocery Lists
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              View all grocery lists that are shared with household members
            </p>
          </div>

          <SharedListsView lists={sharedLists} />
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Household Member"
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        <InviteMemberForm
          onSubmit={handleInviteMember}
          onCancel={() => setIsInviteModalOpen(false)}
        />
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingMember(null)
        }}
        title="Edit Member Role"
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        {editingMember && (
          <EditMemberForm
            memberName={editingMember.name}
            currentRole={editingMember.role}
            onSubmit={handleUpdateMemberRole}
            onCancel={() => {
              setIsEditModalOpen(false)
              setEditingMember(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
