'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import MemberCard from '@/components/household/MemberCard'
import InviteMemberForm from '@/components/household/InviteMemberForm'
import SharedListsView from '@/components/household/SharedListsView'
import { mockHouseholdMembers, mockGroceryLists } from '@/lib/mockData'
import { HouseholdMember, MemberRole } from '@/lib/types'

export default function HouseholdPage() {
  const [members, setMembers] = useState<HouseholdMember[]>(mockHouseholdMembers)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  // Filter only shared lists
  const sharedLists = mockGroceryLists.filter((list) => list.sharedWith.length > 0)

  // Handle inviting new member
  const handleInviteMember = (data: { email: string; role: MemberRole }) => {
    const newMember: HouseholdMember = {
      id: `u${Date.now()}`,
      name: data.email.split('@')[0], // Extract name from email (placeholder)
      email: data.email,
      role: data.role,
      joinedAt: new Date(),
    }
    setMembers([...members, newMember])
    setIsInviteModalOpen(false)

    // Show success message (in real app, this would be a toast notification)
    alert(`Invitation sent to ${data.email}!`)
  }

  // Count members by role
  const adminCount = members.filter((m) => m.role === MemberRole.ADMIN).length
  const memberCount = members.filter((m) => m.role === MemberRole.MEMBER).length
  const viewerCount = members.filter((m) => m.role === MemberRole.VIEWER).length

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Household Management</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manage your household members and view shared grocery lists
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">{members.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <p className="text-sm font-medium text-gray-600 mb-1">Members</p>
              <p className="text-3xl font-bold text-gray-900">{memberCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <p className="text-sm font-medium text-gray-600 mb-1">Viewers</p>
              <p className="text-3xl font-bold text-gray-900">{viewerCount}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Household Members Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Household Members</h2>
            <p className="text-gray-600 text-sm mt-1">
              Manage who has access to your household&apos;s grocery lists
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsInviteModalOpen(true)} className="w-full sm:w-auto">
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
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* Shared Lists Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Shared Grocery Lists</h2>
          <p className="text-gray-600 text-sm mt-1">
            View all grocery lists that are shared with household members
          </p>
        </div>

        <SharedListsView lists={sharedLists} />
      </div>

      {/* Invite Member Modal */}
      <Modal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Household Member"
      >
        <InviteMemberForm
          onSubmit={handleInviteMember}
          onCancel={() => setIsInviteModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

