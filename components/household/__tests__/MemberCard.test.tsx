import { render, screen, fireEvent } from '@testing-library/react'
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
    expect(roleBadge).toHaveClass('bg-warm-peach-light')
  })

  it('renders member role with correct styling for Member', () => {
    const regularMember = { ...mockMember, role: MemberRole.MEMBER }
    render(<MemberCard member={regularMember} />)
    const roleBadge = screen.getByText('Member')
    expect(roleBadge).toHaveClass('bg-warm-blue-light')
  })

  it('renders member role with correct styling for Viewer', () => {
    const viewerMember = { ...mockMember, role: MemberRole.VIEWER }
    render(<MemberCard member={viewerMember} />)
    const roleBadge = screen.getByText('Viewer')
    expect(roleBadge).toHaveClass('bg-warm-gray-100')
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
    const memberWithAvatar = {
      ...mockMember,
      avatarUrl: 'https://example.com/avatar.jpg',
    }
    const { container } = render(<MemberCard member={memberWithAvatar} />)
    const img = container.querySelector('img')
    // Next.js transforms the src, so we check if it contains the URL
    expect(img).toBeInTheDocument()
    expect(img?.src).toContain('avatar.jpg')
  })

  it('shows "You" badge when member is current user', () => {
    render(<MemberCard member={mockMember} isCurrentUser={true} />)
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('shows edit button when current user is admin and not viewing own card', () => {
    render(
      <MemberCard
        member={mockMember}
        isCurrentUserAdmin={true}
        isCurrentUser={false}
        onEdit={() => {}}
      />
    )
    expect(screen.getByText('Edit Role')).toBeInTheDocument()
  })

  it('does not show edit button for current user own card', () => {
    render(
      <MemberCard
        member={mockMember}
        isCurrentUserAdmin={true}
        isCurrentUser={true}
        onEdit={() => {}}
      />
    )
    expect(screen.queryByText('Edit Role')).not.toBeInTheDocument()
  })

  it('shows "Leave" button when viewing own card', () => {
    render(
      <MemberCard
        member={mockMember}
        isCurrentUser={true}
        onRemove={() => {}}
      />
    )
    expect(screen.getByText('Leave')).toBeInTheDocument()
  })

  it('shows "Remove" button when admin viewing other members', () => {
    render(
      <MemberCard
        member={mockMember}
        isCurrentUserAdmin={true}
        isCurrentUser={false}
        onRemove={() => {}}
      />
    )
    expect(screen.getByText('Remove')).toBeInTheDocument()
  })

  it('calls onEdit callback when edit button is clicked', () => {
    const onEditMock = jest.fn()
    render(
      <MemberCard
        member={mockMember}
        isCurrentUserAdmin={true}
        isCurrentUser={false}
        onEdit={onEditMock}
      />
    )

    const editButton = screen.getByText('Edit Role')
    fireEvent.click(editButton)

    expect(onEditMock).toHaveBeenCalledWith(mockMember)
  })

  it('calls onRemove callback when remove button is clicked', () => {
    const onRemoveMock = jest.fn()
    render(
      <MemberCard
        member={mockMember}
        isCurrentUserAdmin={true}
        isCurrentUser={false}
        onRemove={onRemoveMock}
      />
    )

    const removeButton = screen.getByText('Remove')
    fireEvent.click(removeButton)

    expect(onRemoveMock).toHaveBeenCalledWith(mockMember)
  })

  it('does not show action buttons when not admin and not current user', () => {
    render(
      <MemberCard
        member={mockMember}
        isCurrentUserAdmin={false}
        isCurrentUser={false}
      />
    )

    expect(screen.queryByText('Edit Role')).not.toBeInTheDocument()
    expect(screen.queryByText('Remove')).not.toBeInTheDocument()
    expect(screen.queryByText('Leave')).not.toBeInTheDocument()
  })
})
