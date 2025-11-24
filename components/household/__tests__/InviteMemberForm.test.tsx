import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InviteMemberForm from '../InviteMemberForm'
import { MemberRole } from '@/lib/types'

describe('InviteMemberForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders email input field', () => {
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders role selector with all role options', () => {
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    const select = screen.getByLabelText(/role/i)
    expect(select).toBeInTheDocument()

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent('Admin')
    expect(options[1]).toHaveTextContent('Member')
    expect(options[2]).toHaveTextContent('Viewer')
  })

  it('has Member as default role', () => {
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    const select = screen.getByLabelText(/role/i) as HTMLSelectElement
    expect(select.value).toBe(MemberRole.MEMBER)
  })

  it('renders submit and cancel buttons', () => {
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    expect(screen.getByText(/send invite/i)).toBeInTheDocument()
    expect(screen.getByText(/cancel/i)).toBeInTheDocument()
  })

  it('calls onSubmit with email and role when form is submitted', async () => {
    const user = userEvent.setup()
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    const roleSelect = screen.getByLabelText(/role/i)
    await user.selectOptions(roleSelect, MemberRole.ADMIN)

    const submitButton = screen.getByText(/send invite/i)
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      role: MemberRole.ADMIN,
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const cancelButton = screen.getByText(/cancel/i)
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('disables submit button for invalid email format', async () => {
    const user = userEvent.setup()
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')

    const submitButton = screen.getByText(/send invite/i)

    // Submit button should be disabled for invalid email
    expect(submitButton).toBeDisabled()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('shows error when trying to submit empty email', async () => {
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const submitButton = screen.getByText(/send invite/i)

    // Submit button should be disabled when email is empty
    expect(submitButton).toBeDisabled()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('clears form after successful submission', async () => {
    const user = userEvent.setup()
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    await user.type(emailInput, 'test@example.com')

    const submitButton = screen.getByText(/send invite/i)
    await user.click(submitButton)

    // Wait for form to clear
    await screen.findByDisplayValue('')
    expect(emailInput.value).toBe('')
  })

  it('disables submit button when form is invalid', async () => {
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const submitButton = screen.getByText(/send invite/i)
    expect(submitButton).toBeDisabled()
  })
})
