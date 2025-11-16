import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '../Modal'

describe('Modal', () => {
  it('does not render when open is false', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        Modal content
      </Modal>
    )
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('renders when open is true', () => {
    render(
      <Modal open={true} onClose={() => {}}>
        Modal content
      </Modal>
    )
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('renders with title', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Modal Title">
        Content
      </Modal>
    )
    expect(screen.getByText('Modal Title')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const handleClose = jest.fn()
    const user = userEvent.setup()
    render(
      <Modal open={true} onClose={handleClose}>
        Content
      </Modal>
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const handleClose = jest.fn()
    const user = userEvent.setup()
    render(
      <Modal open={true} onClose={handleClose}>
        Content
      </Modal>
    )
    
    const backdrop = screen.getByTestId('modal-backdrop')
    await user.click(backdrop)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', async () => {
    const handleClose = jest.fn()
    const user = userEvent.setup()
    render(
      <Modal open={true} onClose={handleClose}>
        Content
      </Modal>
    )
    
    await user.keyboard('{Escape}')
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on backdrop click when clicking modal content', async () => {
    const handleClose = jest.fn()
    const user = userEvent.setup()
    render(
      <Modal open={true} onClose={handleClose}>
        <div data-testid="modal-content">Content</div>
      </Modal>
    )
    
    const content = screen.getByTestId('modal-content')
    await user.click(content)
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('accepts custom className', () => {
    const { container } = render(
      <Modal open={true} onClose={() => {}} className="custom-class">
        <div data-testid="modal-content">Content</div>
      </Modal>
    )
    const modal = container.querySelector('.custom-class')
    expect(modal).toBeInTheDocument()
  })

  it('does not call onClose when backdrop is clicked and closeOnBackdropClick is false', async () => {
    const handleClose = jest.fn()
    const user = userEvent.setup()
    render(
      <Modal open={true} onClose={handleClose} closeOnBackdropClick={false}>
        Content
      </Modal>
    )
    
    const backdrop = screen.getByTestId('modal-backdrop')
    await user.click(backdrop)
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('does not call onClose when Escape key is pressed and closeOnEscape is false', async () => {
    const handleClose = jest.fn()
    const user = userEvent.setup()
    render(
      <Modal open={true} onClose={handleClose} closeOnEscape={false}>
        Content
      </Modal>
    )
    
    await user.keyboard('{Escape}')
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('still calls onClose when close button is clicked even with closeOnBackdropClick and closeOnEscape false', async () => {
    const handleClose = jest.fn()
    const user = userEvent.setup()
    render(
      <Modal 
        open={true} 
        onClose={handleClose} 
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        Content
      </Modal>
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})

