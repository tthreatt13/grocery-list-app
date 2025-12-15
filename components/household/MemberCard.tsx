'use client'

import { HouseholdMember, MemberRole } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDistanceToNow } from '@/lib/utils'
import Image from 'next/image'

interface MemberCardProps {
  member: HouseholdMember
  isCurrentUserAdmin?: boolean
  isCurrentUser?: boolean
  onEdit?: (_member: HouseholdMember) => void
  onRemove?: (_member: HouseholdMember) => void
}

const getRoleBadgeClass = (role: MemberRole): string => {
  switch (role) {
    case MemberRole.ADMIN:
      return 'bg-purple-100 text-purple-800'
    case MemberRole.MEMBER:
      return 'bg-blue-100 text-blue-800'
    case MemberRole.VIEWER:
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function MemberCard({
  member,
  isCurrentUserAdmin = false,
  isCurrentUser = false,
  onEdit,
  onRemove,
}: MemberCardProps) {
  const showEditButton = isCurrentUserAdmin && !isCurrentUser
  const showRemoveButton = isCurrentUserAdmin || isCurrentUser

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {member.avatarUrl ? (
              <div className="relative w-16 h-16">
                <Image
                  src={member.avatarUrl}
                  alt={member.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                {getInitials(member.name)}
              </div>
            )}
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {member.name}
              </h3>
              {isCurrentUser && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">You</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{member.email}</p>
            {member.lastActive && (
              <p className="text-xs text-gray-500 mt-1">
                Active: {formatDistanceToNow(member.lastActive)}
              </p>
            )}
          </div>

          {/* Role Badge */}
          <div className="flex-shrink-0">
            <Badge className={getRoleBadgeClass(member.role)}>
              {member.role}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        {(showEditButton || showRemoveButton) && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            {showEditButton && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(member)}
                className="flex-1 text-sm"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Role
              </Button>
            )}
            {showRemoveButton && onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(member)}
                className="flex-1 text-sm text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {isCurrentUser ? 'Leave' : 'Remove'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
