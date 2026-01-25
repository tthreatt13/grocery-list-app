import { render, screen } from '@testing-library/react'
import { Card } from '../Card'

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders with header', () => {
    render(<Card header="Card Title">Content</Card>)
    expect(screen.getByText('Card Title')).toBeInTheDocument()
  })

  it('renders with footer', () => {
    render(<Card footer="Card Footer">Content</Card>)
    expect(screen.getByText('Card Footer')).toBeInTheDocument()
  })

  it('renders with both header and footer', () => {
    render(
      <Card header="Header" footer="Footer">
        Body content
      </Card>
    )
    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    render(
      <Card className="custom-class" data-testid="card">
        Content
      </Card>
    )
    expect(screen.getByTestId('card')).toHaveClass('custom-class')
  })

  it('applies default styles', () => {
    render(<Card data-testid="card">Content</Card>)
    const card = screen.getByTestId('card')
    expect(card).toHaveClass(
      'bg-[var(--warm-white)]',
      'rounded-lg',
      'shadow-warm-md'
    )
  })
})
