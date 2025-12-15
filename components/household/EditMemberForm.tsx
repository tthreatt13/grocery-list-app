'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { MemberRole } from '@/lib/types'

interface EditMemberFormProps {
  memberName: string
  currentRole: MemberRole
  onSubmit: (_role: MemberRole) => void
  onCancel: () => void
}

export default function EditMemberForm({
  memberName,
  currentRole,
  onSubmit,
  onCancel,
}: EditMemberFormProps) {
  const [role, setRole] = useState<MemberRole>(currentRole)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(role)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          Editing role for: <strong>{memberName}</strong>
        </p>
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Member Role
        </label>
        <Select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
          required
        >
          <option value={MemberRole.ADMIN}>Admin - Full access</option>
          <option value={MemberRole.MEMBER}>Member - Can edit lists</option>
          <option value={MemberRole.VIEWER}>Viewer - Can only view</option>
        </Select>
        <p className="mt-2 text-sm text-gray-500">
          {role === MemberRole.ADMIN &&
            'Admins can manage members and all household settings.'}
          {role === MemberRole.MEMBER &&
            'Members can create and edit grocery lists.'}
          {role === MemberRole.VIEWER && 'Viewers can only view grocery lists.'}
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          Update Role
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
