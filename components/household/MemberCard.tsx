'use client'

import { HouseholdMember, MemberRole } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDistanceToNow } from '@/lib/utils'

interface MemberCardProps {
  member: HouseholdMember
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

export default function MemberCard({ member }: MemberCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
              {getInitials(member.name)}
            </div>
          )}
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {member.name}
          </h3>
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
    </Card>
  )
}

