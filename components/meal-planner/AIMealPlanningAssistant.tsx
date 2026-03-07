'use client'

import { useState, useRef, useEffect } from 'react'
import { MealSuggestion, ChatMessage } from '@/lib/types'
import { getAIMealSuggestions } from '@/lib/api/meals'
import MealSuggestionCard from './MealSuggestionCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import AddMealModal from './AddMealModal'
import { formatDateForAPI } from '@/lib/api/meals'
import { MealType } from '@/lib/types'

interface AIMealPlanningAssistantProps {
  householdId: number
  weekStartDate: Date
  getToken: () => Promise<string>
  onMealsApplied: (meals: MealSuggestion[]) => void
}

export default function AIMealPlanningAssistant({
  householdId,
  weekStartDate,
  getToken,
  onMealsApplied,
}: AIMealPlanningAssistantProps) {
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>(
    []
  )
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([])
  const [selectedMealIds, setSelectedMealIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userMessage, setUserMessage] = useState('')
  const [editingSuggestion, setEditingSuggestion] =
    useState<MealSuggestion | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isApplyingMeals, setIsApplyingMeals] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const prevConversationLengthRef = useRef<number>(0)

  // Scroll to bottom when new messages are added (only when length increases)
  useEffect(() => {
    const prevLength = prevConversationLengthRef.current
    const currentLength = conversationHistory.length
    const hasNewMessages = currentLength > prevLength

    // Only scroll when new messages are actually added (length increased)
    // Use scrollTop on the container instead of scrollIntoView to avoid scrolling the page
    if (hasNewMessages && chatContainerRef.current) {
      // Scroll the container itself, not the page
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }

    // Update the previous length for next comparison
    prevConversationLengthRef.current = currentLength
  }, [conversationHistory])

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return

    const message = userMessage.trim()
    setUserMessage('')
    setError(null)

    // Add user message to conversation
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: message,
    }
    const updatedHistory = [...conversationHistory, newUserMessage]
    setConversationHistory(updatedHistory)

    setIsLoading(true)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication required. Please sign in again.')
      }

      const weekStartDateStr = formatDateForAPI(weekStartDate)

      const response = await getAIMealSuggestions(
        {
          household_id: householdId,
          week_start_date: weekStartDateStr,
          user_message: message,
          conversation_history: conversationHistory,
        },
        token
      )

      // Add assistant response to conversation
      const assistantMessages = response.conversation_history.filter(
        (msg) => msg.role === 'assistant'
      )
      setConversationHistory([
        ...updatedHistory,
        ...assistantMessages.slice(conversationHistory.length),
      ])

      // Update suggestions
      setSuggestions(response.suggestions)
      setSelectedMealIds(new Set()) // Clear previous selections
      setError(null) // Clear any previous errors
    } catch (err) {
      let errorMessage = 'Failed to get meal suggestions. Please try again.'
      if (err instanceof Error) {
        if (
          err.message.includes('401') ||
          err.message.includes('Unauthorized')
        ) {
          errorMessage = 'Authentication required. Please sign in again.'
        } else if (
          err.message.includes('403') ||
          err.message.includes('Forbidden')
        ) {
          errorMessage = 'You do not have permission to access this feature.'
        } else if (
          err.message.includes('500') ||
          err.message.includes('Internal Server Error')
        ) {
          errorMessage = 'Server error. Please try again later.'
        } else if (
          err.message.includes('Network') ||
          err.message.includes('fetch')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
      // Keep the user message in the conversation so they can see what they asked
      // The error will be displayed below
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleSendMessage()
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSendMessage()
  }

  const handleSelectMeal = (index: number, selected: boolean) => {
    const newSelected = new Set(selectedMealIds)
    if (selected) {
      newSelected.add(index)
    } else {
      newSelected.delete(index)
    }
    setSelectedMealIds(newSelected)
  }

  const handleEditSuggestion = (suggestion: MealSuggestion) => {
    setEditingSuggestion(suggestion)
    setIsEditModalOpen(true)
  }

  const handleSaveEditedSuggestion = async (mealData: {
    name?: string
    notes?: string
    ingredients?: string
    mealCategory?: 'normal' | 'quick_meal' | 'eat_out'
  }) => {
    if (!editingSuggestion) return

    // Update the suggestion in the suggestions array
    const updatedSuggestions = suggestions.map((suggestion) => {
      if (suggestion === editingSuggestion) {
        return {
          ...suggestion,
          meal_name: mealData.name || suggestion.meal_name,
          notes: mealData.notes || suggestion.notes,
          ingredients: mealData.ingredients
            ? mealData.ingredients.split(',').map((i) => i.trim())
            : suggestion.ingredients,
        }
      }
      return suggestion
    })

    setSuggestions(updatedSuggestions)
    setEditingSuggestion(null)
    setIsEditModalOpen(false)
  }

  const handleAddSingleMeal = async (
    suggestion: MealSuggestion,
    index: number
  ) => {
    try {
      setIsApplyingMeals(true)
      setError(null)
      await onMealsApplied([suggestion])
      // Remove the added meal from suggestions using index-based filtering
      setSuggestions(suggestions.filter((_, i) => i !== index))
      // Clear input field after adding meal
      setUserMessage('')
      setError(null) // Clear any errors on success
    } catch (err) {
      let errorMessage = 'Failed to add meal. Please try again.'
      if (err instanceof Error) {
        if (
          err.message.includes('401') ||
          err.message.includes('Unauthorized')
        ) {
          errorMessage = 'Authentication required. Please sign in again.'
        } else if (
          err.message.includes('403') ||
          err.message.includes('Forbidden')
        ) {
          errorMessage = 'You do not have permission to perform this action.'
        } else if (
          err.message.includes('500') ||
          err.message.includes('Internal Server Error')
        ) {
          errorMessage = 'Server error. Please try again later.'
        } else if (
          err.message.includes('Network') ||
          err.message.includes('fetch')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setIsApplyingMeals(false)
    }
  }

  const handleApplyMeals = async () => {
    const selectedMeals = suggestions.filter((_, index) =>
      selectedMealIds.has(index)
    )

    if (selectedMeals.length === 0) {
      setError('Please select at least one meal to apply')
      return
    }

    try {
      setIsApplyingMeals(true)
      setError(null)
      await onMealsApplied(selectedMeals)
      // Clear selections after successful apply
      setSelectedMealIds(new Set())
      setSuggestions([]) // Clear suggestions after applying
      setError(null) // Clear any errors on success
    } catch (err) {
      let errorMessage = 'Failed to apply meals. Please try again.'
      if (err instanceof Error) {
        if (
          err.message.includes('401') ||
          err.message.includes('Unauthorized')
        ) {
          errorMessage = 'Authentication required. Please sign in again.'
        } else if (
          err.message.includes('403') ||
          err.message.includes('Forbidden')
        ) {
          errorMessage = 'You do not have permission to perform this action.'
        } else if (
          err.message.includes('500') ||
          err.message.includes('Internal Server Error')
        ) {
          errorMessage = 'Server error. Please try again later.'
        } else if (
          err.message.includes('Network') ||
          err.message.includes('fetch')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setIsApplyingMeals(false)
    }
  }

  const handleClearConversation = () => {
    setConversationHistory([])
    setSuggestions([])
    setSelectedMealIds(new Set())
    setError(null)
  }

  // Calculate date for meal suggestion
  const getMealDate = (dayOfWeek: number) => {
    const date = new Date(weekStartDate)
    date.setDate(weekStartDate.getDate() + dayOfWeek)
    return date
  }

  // Convert meal type to MealType enum
  const getMealType = (mealType: string): MealType => {
    return (mealType.charAt(0).toUpperCase() + mealType.slice(1)) as MealType
  }

  const hasSelectedMeals = selectedMealIds.size > 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-3 md:px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            AI Meal Planning Assistant
          </h3>
          <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
            Get personalized meal suggestions for your week
          </p>
        </div>
        {conversationHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearConversation}
            aria-label="Clear conversation"
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">Clear</span>
            <span className="sm:hidden">✕</span>
          </Button>
        )}
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="h-48 md:h-64 overflow-y-auto px-3 md:px-4 py-3 space-y-3"
      >
        {conversationHistory.length === 0 && (
          <div className="text-center text-warm-gray-600 py-6 md:py-8">
            <p className="mb-2 text-sm md:text-base text-warm-gray-800">
              👋 Start a conversation to get meal suggestions!
            </p>
            <p className="text-xs md:text-sm px-2 text-warm-gray-600">
              Try: &quot;Suggest some vegetarian meals&quot; or &quot;What can I
              make with my pantry items?&quot;
            </p>
          </div>
        )}

        {conversationHistory.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] md:max-w-[80%] rounded-lg px-3 md:px-4 py-2.5 ${
                message.role === 'user'
                  ? 'bg-[var(--warm-blue)]'
                  : 'bg-warm-gray-50 border border-warm-gray-200'
              }`}
            >
              <p
                className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words ${
                  message.role === 'user' ? 'text-white' : 'text-warm-gray-900'
                }`}
              >
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-warm-gray-50 rounded-lg px-3 md:px-4 py-2.5 border border-warm-gray-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-warm-gray-700"></div>
                <p className="text-sm md:text-base text-warm-gray-900 leading-relaxed">
                  Loading suggestions...
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-3 md:px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-xs md:text-sm text-red-700 break-words">{error}</p>
        </div>
      )}

      {/* Meal Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-gray-200 px-3 md:px-4 py-3">
          <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-3">
            Meal Suggestions ({suggestions.length})
          </h4>
          <div className="space-y-3 max-h-64 md:max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <MealSuggestionCard
                key={index}
                suggestion={suggestion}
                weekStartDate={weekStartDate}
                isSelected={selectedMealIds.has(index)}
                onSelect={(selected) => handleSelectMeal(index, selected)}
                onEdit={handleEditSuggestion}
                onAdd={handleAddSingleMeal}
                index={index}
              />
            ))}
          </div>

          {hasSelectedMeals && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleApplyMeals}
                className="w-full"
                disabled={isApplyingMeals}
              >
                {isApplyingMeals ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Applying...
                  </>
                ) : (
                  <>
                    Apply {selectedMealIds.size} Selected Meal
                    {selectedMealIds.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="px-3 md:px-4 py-3 border-t border-gray-200">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ask for meal suggestions..."
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={(_e) => {
              // Ensure chat container stays visible when input gets focus
              // Use 'nearest' to minimize scrolling - only scroll if input is completely out of view
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollIntoView({
                  block: 'nearest',
                  behavior: 'smooth',
                })
              }
            }}
            disabled={isLoading || isApplyingMeals}
            className="flex-1 text-sm md:text-base"
          />
          <Button
            type="submit"
            variant="primary"
            onClick={handleSendMessage}
            disabled={!userMessage.trim() || isLoading || isApplyingMeals}
            aria-label="Send message"
            className="flex-shrink-0"
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </form>
      </div>

      {/* Edit Meal Modal */}
      {editingSuggestion && (
        <AddMealModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingSuggestion(null)
          }}
          onAdd={handleSaveEditedSuggestion}
          mealType={getMealType(editingSuggestion.meal_type)}
          date={getMealDate(editingSuggestion.day_of_week)}
          meal={{
            id: 'temp',
            name: editingSuggestion.meal_name,
            mealType: getMealType(editingSuggestion.meal_type),
            date: getMealDate(editingSuggestion.day_of_week),
            notes: editingSuggestion.notes,
            ingredients: editingSuggestion.ingredients,
            createdBy: 'AI Assistant',
            mealCategory: 'normal',
          }}
        />
      )}
    </div>
  )
}
