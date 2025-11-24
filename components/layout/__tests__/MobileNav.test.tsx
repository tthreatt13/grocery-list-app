import { render, screen } from '@testing-library/react'
import MobileNav from '../MobileNav'
import { usePathname } from 'next/navigation'

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
    ;(usePathname as jest.Mock).mockReturnValue('/grocery-lists')

    render(<MobileNav />)
    const listsLink = screen.getByText('Lists').closest('a')
    expect(listsLink).toHaveClass('text-green-600')
  })

  it('is hidden on desktop (md breakpoint)', () => {
    const { container } = render(<MobileNav />)
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('md:hidden')
  })

  it('highlights Lists navigation when on a specific list detail page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/grocery-lists/123')

    render(<MobileNav />)
    const listsLink = screen.getByText('Lists').closest('a')
    expect(listsLink).toHaveClass('text-green-600')
  })

  it('highlights Lists navigation when on the lists page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/grocery-lists')

    render(<MobileNav />)
    const listsLink = screen.getByText('Lists').closest('a')
    expect(listsLink).toHaveClass('text-green-600')
  })

  it('highlights Pantry navigation when on pantry page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/pantry')

    render(<MobileNav />)
    const pantryLink = screen.getByText('Pantry').closest('a')
    expect(pantryLink).toHaveClass('text-green-600')
  })

  it('highlights Home navigation only when on exact home page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')

    render(<MobileNav />)
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveClass('text-green-600')
  })

  it('does not highlight Home when on other pages', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/grocery-lists')

    render(<MobileNav />)
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).not.toHaveClass('text-green-600')
    expect(homeLink).toHaveClass('text-gray-500')
  })
})
