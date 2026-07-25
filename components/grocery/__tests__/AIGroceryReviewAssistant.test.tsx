import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AIGroceryReviewAssistant from '../AIGroceryReviewAssistant'
import { getAIGroceryReview } from '@/lib/api/grocery'

jest.mock('@/lib/api/grocery', () => ({
  getAIGroceryReview: jest.fn(),
}))

const mockGetAIGroceryReview = getAIGroceryReview as jest.MockedFunction<
  typeof getAIGroceryReview
>

describe('AIGroceryReviewAssistant', () => {
  const mockGetToken = jest.fn().mockResolvedValue('test-token')
  const mockOnSuggestionsApplied = jest.fn().mockResolvedValue(undefined)
  const mockOnApplySuggestion = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockResolvedValue('test-token')
    mockOnSuggestionsApplied.mockResolvedValue(undefined)
    mockOnApplySuggestion.mockResolvedValue(undefined)
  })

  it('renders review assistant', () => {
    render(
      <AIGroceryReviewAssistant
        listId={1}
        getToken={mockGetToken}
        onSuggestionsApplied={mockOnSuggestionsApplied}
        onApplySuggestion={mockOnApplySuggestion}
      />
    )

    expect(screen.getByText('Dietary List Review')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/review my list for protein/i)
    ).toBeInTheDocument()
  })

  it('sends review request and displays gap analysis', async () => {
    mockGetAIGroceryReview.mockResolvedValue({
      gap_analysis: 'Light on protein this week.',
      suggestions: [
        {
          action: 'add',
          name: 'Greek yogurt',
          reason: 'Adds protein',
        },
      ],
      conversation_history: [
        { role: 'user', content: 'Review my list' },
        { role: 'assistant', content: 'Light on protein this week.' },
      ],
    })

    render(
      <AIGroceryReviewAssistant
        listId={1}
        getToken={mockGetToken}
        onSuggestionsApplied={mockOnSuggestionsApplied}
        onApplySuggestion={mockOnApplySuggestion}
      />
    )

    const input = screen.getByPlaceholderText(/review my list for protein/i)
    fireEvent.change(input, { target: { value: 'Review my list' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/send message/i)).not.toBeDisabled()
    })

    fireEvent.click(screen.getByLabelText(/send message/i))

    await waitFor(() => {
      expect(mockGetAIGroceryReview).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ user_message: 'Review my list' }),
        'test-token'
      )
    })

    expect(screen.getByText('Greek yogurt')).toBeInTheDocument()
  })
})
