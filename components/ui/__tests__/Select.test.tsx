import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '../Select'

describe('Select', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  it('renders select correctly', () => {
    render(<Select options={options} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Select label="Choose option" options={options} />)
    expect(screen.getByLabelText('Choose option')).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<Select options={options} />)
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument()
  })

  it('handles onChange events', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    render(<Select options={options} onChange={handleChange} />)
    
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'option2')
    expect(handleChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Select options={options} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('renders with placeholder', () => {
    render(<Select options={options} placeholder="Select an option" />)
    expect(screen.getByRole('option', { name: 'Select an option' })).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    render(<Select options={options} className="custom-class" data-testid="select" />)
    expect(screen.getByTestId('select')).toHaveClass('custom-class')
  })
})

