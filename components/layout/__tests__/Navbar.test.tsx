import { render, screen } from '@testing-library/react'
import Navbar from '../Navbar'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
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

  it('renders user avatar with initials', () => {
    render(<Navbar />)
    expect(screen.getByText('TT')).toBeInTheDocument()
  })

  it('highlights active link based on pathname', () => {
    const { usePathname } = require('next/navigation')
    usePathname.mockReturnValue('/grocery-lists')
    
    render(<Navbar />)
    const listsLink = screen.getByText('Lists').closest('a')
    expect(listsLink).toHaveClass('bg-green-50', 'text-green-700')
  })

  it('applies correct styling to navbar container', () => {
    const { container } = render(<Navbar />)
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('bg-white', 'border-b', 'border-gray-200', 'sticky', 'top-0')
  })
})

