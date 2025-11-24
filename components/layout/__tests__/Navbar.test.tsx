import { render, screen } from '@testing-library/react'
import Navbar from '../Navbar'
import { usePathname } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}))

// Mock Clerk
const mockUseAuth = jest.fn(() => ({ isSignedIn: false, isLoaded: true }))
jest.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in-button">{children}</div>
  ),
  useAuth: mockUseAuth,
  UserButton: () => <div data-testid="user-button">TT</div>,
}))

describe('Navbar', () => {
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
    mockUseAuth.mockReturnValue({ isSignedIn: true, isLoaded: true })
    render(<Navbar />)
    expect(screen.getByText('TT')).toBeInTheDocument()
  })

  it('renders sign in button when not signed in', () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false, isLoaded: true })
    render(<Navbar />)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('highlights active link based on pathname', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/grocery-lists')

    render(<Navbar />)
    const listsLink = screen.getByText('Lists').closest('a')
    expect(listsLink).toHaveClass('bg-green-50', 'text-green-700')
  })

  it('applies correct styling to navbar container', () => {
    const { container } = render(<Navbar />)
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass(
      'bg-white',
      'border-b',
      'border-gray-200',
      'sticky',
      'top-0'
    )
  })
})
