import { render, screen } from '@testing-library/react'
import MobileNav from '../MobileNav'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}))

describe('MobileNav', () => {
  it('renders all navigation items', () => {
    render(<MobileNav />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Lists')).toBeInTheDocument()
    expect(screen.getByText('Pantry')).toBeInTheDocument()
    expect(screen.getByText('Planner')).toBeInTheDocument()
    expect(screen.getByText('Family')).toBeInTheDocument()
  })

  it('renders navigation icons', () => {
    const { container } = render(<MobileNav />)
    const svgIcons = container.querySelectorAll('svg')
    expect(svgIcons.length).toBe(5)
  })

  it('is fixed at the bottom of the screen', () => {
    const { container } = render(<MobileNav />)
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0')
  })

  it('highlights active navigation item', () => {
    const { usePathname } = require('next/navigation')
    usePathname.mockReturnValue('/grocery-lists')
    
    render(<MobileNav />)
    const listsLink = screen.getByText('Lists').closest('a')
    expect(listsLink).toHaveClass('text-green-600')
  })

  it('is hidden on desktop (md breakpoint)', () => {
    const { container } = render(<MobileNav />)
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('md:hidden')
  })
})

