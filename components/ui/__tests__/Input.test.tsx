import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'

describe('Input Component', () => {
  it('renders input field', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Input label="Test Label" id="test" />)
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(<Input placeholder="Test placeholder" />)
    const input = screen.getByPlaceholderText('Test placeholder')
    expect(input).toBeInTheDocument()
  })

  it('displays error message when error prop is provided', () => {
    render(<Input label="Test" id="test" error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('applies error styles when error prop is provided', () => {
    render(<Input label="Test" id="test" error="Error message" />)
    const input = screen.getByLabelText('Test')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('handles text input changes', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(<Input label="Name" id="name" onChange={handleChange} />)

    const input = screen.getByLabelText('Name')
    await user.type(input, 'test')

    expect(handleChange).toHaveBeenCalled()
  })

  it('handles number input changes', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(<Input label="Age" id="age" type="number" onChange={handleChange} />)

    const input = screen.getByLabelText('Age')
    await user.type(input, '25')

    expect(handleChange).toHaveBeenCalled()
  })

  it('respects disabled prop', () => {
    render(<Input label="Test" id="test" disabled />)
    const input = screen.getByLabelText('Test')
    expect(input).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Input label="Test" id="test" className="custom-class" />)
    const input = screen.getByLabelText('Test')
    expect(input).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Input label="Test" id="test" ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('supports required attribute', () => {
    render(<Input label="Test" id="test" required />)
    const input = screen.getByLabelText('Test')
    expect(input).toBeRequired()
  })

  it('supports min and max for number inputs', () => {
    render(<Input label="Quantity" id="qty" type="number" min="1" max="100" />)
    const input = screen.getByLabelText('Quantity') as HTMLInputElement
    expect(input.min).toBe('1')
    expect(input.max).toBe('100')
  })

  it('supports step attribute for number inputs', () => {
    render(<Input label="Price" id="price" type="number" step="0.01" />)
    const input = screen.getByLabelText('Price') as HTMLInputElement
    expect(input.step).toBe('0.01')
  })

  it('handles value prop for controlled component', () => {
    render(
      <Input
        label="Test"
        id="test"
        value="controlled value"
        onChange={() => {}}
      />
    )
    const input = screen.getByLabelText('Test') as HTMLInputElement
    expect(input.value).toBe('controlled value')
  })

  it('handles empty string value', () => {
    render(<Input label="Test" id="test" value="" onChange={() => {}} />)
    const input = screen.getByLabelText('Test') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('links error message with aria-describedby', () => {
    render(<Input label="Email" id="email" error="Invalid email" />)
    const input = screen.getByLabelText('Email')
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(screen.getByText('Invalid email')).toHaveAttribute('id', errorId!)
  })

  it('does not show error message when error prop is undefined', () => {
    render(<Input label="Test" id="test" />)
    const input = screen.getByLabelText('Test')
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('generates unique id when not provided', () => {
    const { container } = render(
      <>
        <Input label="Test 1" />
        <Input label="Test 2" />
      </>
    )
    const inputs = container.querySelectorAll('input')
    expect(inputs[0].id).toBeTruthy()
    expect(inputs[1].id).toBeTruthy()
    expect(inputs[0].id).not.toBe(inputs[1].id)
  })

  it('uses provided id instead of generating one', () => {
    render(<Input label="Test" id="custom-id" />)
    const input = screen.getByLabelText('Test')
    expect(input).toHaveAttribute('id', 'custom-id')
  })

  it('supports date input type', () => {
    render(<Input label="Date" id="date" type="date" />)
    const input = screen.getByLabelText('Date')
    expect(input).toHaveAttribute('type', 'date')
  })

  it('handles blur event', () => {
    const handleBlur = jest.fn()
    render(<Input label="Test" id="test" onBlur={handleBlur} />)
    const input = screen.getByLabelText('Test')

    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('handles focus event', () => {
    const handleFocus = jest.fn()
    render(<Input label="Test" id="test" onFocus={handleFocus} />)
    const input = screen.getByLabelText('Test')

    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
  })
})
