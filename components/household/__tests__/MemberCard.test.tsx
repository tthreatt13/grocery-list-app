import { render, screen } from '@testing-library/react'
import MemberCard from '../MemberCard'
import { HouseholdMember, MemberRole } from '@/lib/types'

const mockMember: HouseholdMember = {
  id: 'u1',
  name: 'John Parent',
  email: 'john@example.com',
  role: MemberRole.ADMIN,
  joinedAt: new Date('2024-01-01'),
  lastActive: new Date('2024-11-11'),
}

describe('MemberCard', () => {
  it('renders member name', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText('John Parent')).toBeInTheDocument()
  })

  it('renders member email', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('displays member role', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('displays different role correctly', () => {
    const viewerMember = { ...mockMember, role: MemberRole.VIEWER }
    render(<MemberCard member={viewerMember} />)
    expect(screen.getByText('Viewer')).toBeInTheDocument()
  })

  it('renders member role with correct styling for Admin', () => {
    render(<MemberCard member={mockMember} />)
    const roleBadge = screen.getByText('Admin')
    expect(roleBadge).toHaveClass('bg-purple-100')
  })

  it('renders member role with correct styling for Member', () => {
    const regularMember = { ...mockMember, role: MemberRole.MEMBER }
    render(<MemberCard member={regularMember} />)
    const roleBadge = screen.getByText('Member')
    expect(roleBadge).toHaveClass('bg-blue-100')
  })

  it('renders member role with correct styling for Viewer', () => {
    const viewerMember = { ...mockMember, role: MemberRole.VIEWER }
    render(<MemberCard member={viewerMember} />)
    const roleBadge = screen.getByText('Viewer')
    expect(roleBadge).toHaveClass('bg-gray-100')
  })

  it('displays avatar initials when no avatar URL provided', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText('JP')).toBeInTheDocument()
  })

  it('displays last active status when provided', () => {
    render(<MemberCard member={mockMember} />)
    expect(screen.getByText(/Active:/)).toBeInTheDocument()
  })

  it('displays avatar image when avatarUrl is provided', () => {
    const memberWithAvatar = { ...mockMember, avatarUrl: 'https://example.com/avatar.jpg' }
    const { container } = render(<MemberCard member={memberWithAvatar} />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })
})

