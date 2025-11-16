import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '../Select'

describe('Select Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  it('renders select field with options', () => {
    render(<Select options={options} id="test" />)
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Select label="Choose Option" id="test" options={options} />)
    expect(screen.getByLabelText('Choose Option')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(<Select options={options} id="test" />)
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
  })

  it('displays error message when error prop is provided', () => {
    render(<Select label="Test" id="test" options={options} error="Selection required" />)
    expect(screen.getByText('Selection required')).toBeInTheDocument()
  })

  it('applies error styles when error prop is provided', () => {
    render(<Select label="Test" id="test" options={options} error="Error message" />)
    const select = screen.getByLabelText('Test')
    expect(select).toHaveAttribute('aria-invalid', 'true')
  })

  it('handles selection changes', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(<Select label="Category" id="category" options={options} onChange={handleChange} />)
    
    const select = screen.getByLabelText('Category')
    await user.selectOptions(select, 'option2')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('respects disabled prop', () => {
    render(<Select label="Test" id="test" options={options} disabled />)
    const select = screen.getByLabelText('Test')
    expect(select).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Select label="Test" id="test" options={options} className="custom-class" />)
    const select = screen.getByLabelText('Test')
    expect(select).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Select label="Test" id="test" options={options} ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('supports required attribute', () => {
    render(<Select label="Test" id="test" options={options} required />)
    const select = screen.getByLabelText('Test')
    expect(select).toBeRequired()
  })

  it('renders placeholder option when provided', () => {
    render(<Select label="Test" id="test" options={options} placeholder="Select an option" />)
    expect(screen.getByText('Select an option')).toBeInTheDocument()
  })

  it('placeholder option is disabled', () => {
    render(<Select label="Test" id="test" options={options} placeholder="Select an option" />)
    const placeholderOption = screen.getByText('Select an option')
    expect(placeholderOption).toHaveAttribute('disabled')
  })

  it('handles value prop for controlled component', () => {
    render(<Select label="Test" id="test" options={options} value="option2" onChange={() => {}} />)
    const select = screen.getByLabelText('Test') as HTMLSelectElement
    expect(select.value).toBe('option2')
  })

  it('handles empty string value', () => {
    render(<Select label="Test" id="test" options={options} value="" onChange={() => {}} />)
    const select = screen.getByLabelText('Test') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('links error message with aria-describedby', () => {
    render(<Select label="Category" id="category" options={options} error="Invalid selection" />)
    const select = screen.getByLabelText('Category')
    const errorId = select.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(screen.getByText('Invalid selection')).toHaveAttribute('id', errorId!)
  })

  it('does not show error message when error prop is undefined', () => {
    render(<Select label="Test" id="test" options={options} />)
    const select = screen.getByLabelText('Test')
    expect(select).toHaveAttribute('aria-invalid', 'false')
  })

  it('generates unique id when not provided', () => {
    const { container } = render(
      <>
        <Select label="Test 1" options={options} />
        <Select label="Test 2" options={options} />
      </>
    )
    const selects = container.querySelectorAll('select')
    expect(selects[0].id).toBeTruthy()
    expect(selects[1].id).toBeTruthy()
    expect(selects[0].id).not.toBe(selects[1].id)
  })

  it('uses provided id instead of generating one', () => {
    render(<Select label="Test" id="custom-id" options={options} />)
    const select = screen.getByLabelText('Test')
    expect(select).toHaveAttribute('id', 'custom-id')
  })

  it('renders all options with correct values', () => {
    const { container } = render(<Select label="Test" id="test" options={options} />)
    const optionElements = container.querySelectorAll('option:not([disabled])')
    
    expect(optionElements).toHaveLength(3)
    expect(optionElements[0]).toHaveValue('option1')
    expect(optionElements[1]).toHaveValue('option2')
    expect(optionElements[2]).toHaveValue('option3')
  })

  it('selects correct option based on value prop', () => {
    render(<Select label="Test" id="test" options={options} value="option3" onChange={() => {}} />)
    const select = screen.getByLabelText('Test') as HTMLSelectElement
    expect(select.selectedOptions[0]).toHaveValue('option3')
  })
})
