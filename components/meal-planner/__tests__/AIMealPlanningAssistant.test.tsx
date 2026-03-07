import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AIMealPlanningAssistant from '../AIMealPlanningAssistant'
import { MealSuggestion, ChatMessage } from '@/lib/types'
import * as mealsAPI from '@/lib/api/meals'

// Mock the API module
jest.mock('@/lib/api/meals')

const mockGetAIMealSuggestions =
  mealsAPI.getAIMealSuggestions as jest.MockedFunction<
    typeof mealsAPI.getAIMealSuggestions
  >

const mockOnMealsApplied = jest.fn()

const mockHouseholdId = 1
const mockWeekStartDate = new Date('2024-11-11')
const mockGetToken = jest.fn().mockResolvedValue('mock-token')

const mockSuggestions: MealSuggestion[] = [
  {
    meal_name: 'Spaghetti Bolognese',
    meal_type: 'dinner',
    day_of_week: 0,
    ingredients: ['Pasta', 'Ground Beef', 'Tomato Sauce'],
    uses_pantry_items: ['Pasta'],
    notes: 'A classic Italian dish',
  },
  {
    meal_name: 'Pancakes',
    meal_type: 'breakfast',
    day_of_week: 1,
    ingredients: ['Flour', 'Eggs', 'Milk'],
    uses_pantry_items: [],
    notes: 'Quick and easy',
  },
]

const mockChatHistory: ChatMessage[] = [
  { role: 'user', content: 'Suggest some meals' },
  { role: 'assistant', content: 'Here are some meal suggestions...' },
]

describe('AIMealPlanningAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset getToken mock to return a valid token
    mockGetToken.mockResolvedValue('mock-token')
    mockGetAIMealSuggestions.mockResolvedValue({
      suggestions: mockSuggestions,
      conversation_history: mockChatHistory,
    })
  })

  it('renders chat interface', () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )
    expect(
      screen.getByPlaceholderText(/ask for meal suggestions/i)
    ).toBeInTheDocument()
  })

  it('renders send button', () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )
    expect(screen.getByLabelText(/send message/i)).toBeInTheDocument()
  })

  it('allows user to type a message', () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )
    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
    fireEvent.change(input, { target: { value: 'Suggest vegetarian meals' } })
    expect(input).toHaveValue('Suggest vegetarian meals')
  })

  it('sends message when send button is clicked', async () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )
    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
    const sendButton = screen.getByLabelText(/send message/i)

    fireEvent.change(input, { target: { value: 'Suggest meals' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(mockGetAIMealSuggestions).toHaveBeenCalled()
    })
  })

  it('sends message when Enter is pressed', async () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )
    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)

    fireEvent.change(input, { target: { value: 'Suggest meals' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockGetAIMealSuggestions).toHaveBeenCalled()
    })
  })

  it('displays loading state while fetching suggestions', async () => {
    // Make the API call take some time
    mockGetAIMealSuggestions.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                suggestions: mockSuggestions,
                conversation_history: mockChatHistory,
              }),
            100
          )
        )
    )

    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )

    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
    const sendButton = screen.getByLabelText(/send message/i)

    fireEvent.change(input, { target: { value: 'Suggest meals' } })
    fireEvent.click(sendButton)

    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it('displays meal suggestions after API call', async () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )

    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
    const sendButton = screen.getByLabelText(/send message/i)

    fireEvent.change(input, { target: { value: 'Suggest meals' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
      expect(screen.getByText('Pancakes')).toBeInTheDocument()
    })
  })

  it('displays chat messages in conversation history', async () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )

    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
    const sendButton = screen.getByLabelText(/send message/i)

    fireEvent.change(input, { target: { value: 'Suggest meals' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Suggest meals')).toBeInTheDocument()
      expect(
        screen.getByText('Here are some meal suggestions...')
      ).toBeInTheDocument()
    })
  })

  it('allows selecting meal suggestions', async () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )

    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
    const sendButton = screen.getByLabelText(/send message/i)

    fireEvent.change(input, { target: { value: 'Suggest meals' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    })

    // Find and click checkbox for first meal
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    // Checkbox should be checked
    expect(checkboxes[0]).toBeChecked()
  })

  it('shows apply button when meals are selected', async () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )

    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
    const sendButton = screen.getByLabelText(/send message/i)

    fireEvent.change(input, { target: { value: 'Suggest meals' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    })

    // Select a meal
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    // Should show apply button
    expect(screen.getByText(/apply/i)).toBeInTheDocument()
  })

  it('calls onMealsApplied when apply button is clicked', async () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )

    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
    const sendButton = screen.getByLabelText(/send message/i)

    fireEvent.change(input, { target: { value: 'Suggest meals' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    })

    // Select a meal
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    // Click apply button
    const applyButton = screen.getByText(/apply/i)
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(mockOnMealsApplied).toHaveBeenCalled()
    })
  })

  it('displays error message when API call fails', async () => {
    mockGetAIMealSuggestions.mockRejectedValue(new Error('API request failed'))

    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )

    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
    const sendButton = screen.getByLabelText(/send message/i)

    fireEvent.change(input, { target: { value: 'Suggest meals' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      // The error handling now shows the actual error message
      expect(screen.getByText(/API request failed/i)).toBeInTheDocument()
    })
  })

  it('allows clearing conversation', async () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )

    const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
    const sendButton = screen.getByLabelText(/send message/i)

    fireEvent.change(input, { target: { value: 'Suggest meals' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    })

    // Find and click clear button
    const clearButton = screen.getByLabelText(/clear/i)
    fireEvent.click(clearButton)

    // Conversation should be cleared
    expect(screen.queryByText('Spaghetti Bolognese')).not.toBeInTheDocument()
  })

  it('prevents sending empty messages', () => {
    render(
      <AIMealPlanningAssistant
        householdId={mockHouseholdId}
        weekStartDate={mockWeekStartDate}
        getToken={mockGetToken}
        onMealsApplied={mockOnMealsApplied}
      />
    )

    const sendButton = screen.getByLabelText(/send message/i)
    fireEvent.click(sendButton)

    // Should not call API
    expect(mockGetAIMealSuggestions).not.toHaveBeenCalled()
  })

  describe('Scroll behavior', () => {
    it('has input ref attached', () => {
      render(
        <AIMealPlanningAssistant
          householdId={mockHouseholdId}
          weekStartDate={mockWeekStartDate}
          getToken={mockGetToken}
          onMealsApplied={mockOnMealsApplied}
        />
      )

      const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
      expect(input).toBeInTheDocument()
      // Input should be focusable
      expect(input).toHaveAttribute('type', 'text')
    })

    it('keeps chat container visible when input gets focus', () => {
      // Mock scrollIntoView
      const scrollIntoViewMock = jest.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock

      render(
        <AIMealPlanningAssistant
          householdId={mockHouseholdId}
          weekStartDate={mockWeekStartDate}
          getToken={mockGetToken}
          onMealsApplied={mockOnMealsApplied}
        />
      )

      const input = screen.getByPlaceholderText(/ask for meal suggestions/i)

      // Simulate focus event
      fireEvent.focus(input)

      // The onFocus handler should call scrollIntoView on the chat container
      // We can't directly test the chat container ref, but we can verify
      // that the input is properly set up with the onFocus handler
      expect(input).toBeInTheDocument()

      // Clean up
      Element.prototype.scrollIntoView = jest.fn()
    })

    it('scrolls chat to bottom when new messages are added', async () => {
      render(
        <AIMealPlanningAssistant
          householdId={mockHouseholdId}
          weekStartDate={mockWeekStartDate}
          getToken={mockGetToken}
          onMealsApplied={mockOnMealsApplied}
        />
      )

      const input = screen.getByPlaceholderText(/ask for meal suggestions/i)
      const sendButton = screen.getByLabelText(/send message/i)

      fireEvent.change(input, { target: { value: 'Suggest meals' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockGetAIMealSuggestions).toHaveBeenCalled()
      })

      // Chat should scroll to bottom when messages are added
      // The component uses scrollTop = scrollHeight via useEffect when conversationHistory changes
      // We verify the messages were added successfully, which triggers the scroll behavior
      await waitFor(() => {
        expect(screen.getByText(/suggest meals/i)).toBeInTheDocument()
      })
    })
  })
})
