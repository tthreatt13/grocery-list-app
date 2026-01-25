import { render, screen } from '@testing-library/react'
import Navbar from '../Navbar'

// Mock next/navigation
const mockUsePathname = jest.fn(() => '/')
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

// Mock Clerk - use closure to allow modifying return value
let mockUseAuthReturn = { isSignedIn: false, isLoaded: true }
jest.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in-button">{children}</div>
  ),
  useAuth: () => mockUseAuthReturn,
  UserButton: () => <div data-testid="user-button">TT</div>,
}))

describe('Navbar', () => {
  beforeEach(() => {
    mockUseAuthReturn = { isSignedIn: false, isLoaded: true }
    mockUsePathname.mockReturnValue('/')
  })

  it('renders the logo', () => {
    render(<Navbar />)
    expect(screen.getByText('GroceryApp')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    render(<Navbar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Lists')).toBeInTheDocument()
    expect(screen.getByText('Pantry')).toBeInTheDocument()
    expect(screen.getByText('Planner')).toBeInTheDocument()
    expect(screen.getByText('Family')).toBeInTheDocument()
  })

  it('renders user avatar with initials when signed in', () => {
    mockUseAuthReturn = { isSignedIn: true, isLoaded: true }
    render(<Navbar />)
    expect(screen.getByText('TT')).toBeInTheDocument()
  })

  it('renders sign in button when not signed in', () => {
    mockUseAuthReturn = { isSignedIn: false, isLoaded: true }
    render(<Navbar />)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('highlights active link based on pathname', () => {
    mockUsePathname.mockReturnValue('/grocery-lists')

    render(<Navbar />)
    const listsLink = screen.getByText('Lists').closest('a')
    expect(listsLink).toHaveClass('bg-[var(--warm-green-dark)]', 'text-white')
  })

  it('applies correct styling to navbar container', () => {
    const { container } = render(<Navbar />)
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass(
      'bg-[var(--warm-white)]',
      'border-b',
      'border-[var(--warm-gray-200)]',
      'sticky',
      'top-0'
    )
  })
})
