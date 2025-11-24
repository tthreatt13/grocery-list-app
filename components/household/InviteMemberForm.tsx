'use client'

import { useState, FormEvent } from 'react'
import { MemberRole } from '@/lib/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface InviteMemberFormProps {
  onSubmit: (data: { email: string; role: MemberRole }) => void
  onCancel: () => void
}

export default function InviteMemberForm({
  onSubmit,
  onCancel,
}: InviteMemberFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>(MemberRole.MEMBER)
  const [error, setError] = useState('')

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    onSubmit({ email, role })
    setEmail('')
    setRole(MemberRole.MEMBER)
  }

  const isFormValid = email.trim() !== '' && validateEmail(email)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="email"
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setError('')
        }}
        placeholder="member@example.com"
        error={error}
        required
      />

      <Select
        id="role"
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value as MemberRole)}
        options={[
          { value: MemberRole.ADMIN, label: 'Admin' },
          { value: MemberRole.MEMBER, label: 'Member' },
          { value: MemberRole.VIEWER, label: 'Viewer' },
        ]}
      />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid}>
          Send Invite
        </Button>
      </div>
    </form>
  )
}
