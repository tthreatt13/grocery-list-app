import { render, screen, fireEvent } from '@testing-library/react'
import EditMemberForm from '../EditMemberForm'
import { MemberRole } from '@/lib/types'

describe('EditMemberForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the form with member name', () => {
    render(
      <EditMemberForm
        memberName="John Doe"
        currentRole={MemberRole.MEMBER}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/Editing role for:/)).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('displays the current role as selected', () => {
    render(
      <EditMemberForm
        memberName="John Doe"
        currentRole={MemberRole.MEMBER}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe(MemberRole.MEMBER)
  })

  it('allows changing the role', () => {
    render(
      <EditMemberForm
        memberName="John Doe"
        currentRole={MemberRole.MEMBER}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: MemberRole.ADMIN } })

    expect((select as HTMLSelectElement).value).toBe(MemberRole.ADMIN)
  })

  it('displays role description for Admin', () => {
    render(
      <EditMemberForm
        memberName="John Doe"
        currentRole={MemberRole.ADMIN}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/Admins can manage members/)).toBeInTheDocument()
  })

  it('displays role description for Member', () => {
    render(
      <EditMemberForm
        memberName="John Doe"
        currentRole={MemberRole.MEMBER}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/Members can create and edit/)).toBeInTheDocument()
  })

  it('displays role description for Viewer', () => {
    render(
      <EditMemberForm
        memberName="John Doe"
        currentRole={MemberRole.VIEWER}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/Viewers can only view/)).toBeInTheDocument()
  })

  it('calls onSubmit with selected role when form is submitted', () => {
    render(
      <EditMemberForm
        memberName="John Doe"
        currentRole={MemberRole.MEMBER}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: MemberRole.ADMIN } })

    const submitButton = screen.getByText('Update Role')
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith(MemberRole.ADMIN)
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <EditMemberForm
        memberName="John Doe"
        currentRole={MemberRole.MEMBER}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('prevents default form submission', () => {
    render(
      <EditMemberForm
        memberName="John Doe"
        currentRole={MemberRole.MEMBER}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const form = screen.getByRole('combobox').closest('form')
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    form?.dispatchEvent(submitEvent)

    expect(submitEvent.defaultPrevented).toBe(true)
  })

  it('has all three role options available', () => {
    render(
      <EditMemberForm
        memberName="John Doe"
        currentRole={MemberRole.MEMBER}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const select = screen.getByRole('combobox')
    const options = select.querySelectorAll('option')

    expect(options).toHaveLength(3)
    expect(options[0]).toHaveValue(MemberRole.ADMIN)
    expect(options[1]).toHaveValue(MemberRole.MEMBER)
    expect(options[2]).toHaveValue(MemberRole.VIEWER)
  })
})

