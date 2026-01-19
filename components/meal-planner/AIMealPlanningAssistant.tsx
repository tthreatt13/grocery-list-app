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

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatEndRef.current?.scrollIntoView) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to get meal suggestions. Please try again.'
      )
      // Remove the user message on error
      setConversationHistory(conversationHistory)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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

  const handleApplyMeals = async () => {
    const selectedMeals = suggestions.filter((_, index) =>
      selectedMealIds.has(index)
    )

    if (selectedMeals.length === 0) {
      setError('Please select at least one meal to apply')
      return
    }

    try {
      await onMealsApplied(selectedMeals)
      // Clear selections after successful apply
      setSelectedMealIds(new Set())
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to apply meals. Please try again.'
      )
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
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            AI Meal Planning Assistant
          </h3>
          <p className="text-sm text-gray-600">
            Get personalized meal suggestions for your week
          </p>
        </div>
        {conversationHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearConversation}
            aria-label="Clear conversation"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="h-64 overflow-y-auto px-4 py-3 space-y-3">
        {conversationHistory.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-2">
              👋 Start a conversation to get meal suggestions!
            </p>
            <p className="text-sm">
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
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <p className="text-sm text-gray-600">Loading suggestions...</p>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Meal Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Meal Suggestions ({suggestions.length})
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <MealSuggestionCard
                key={index}
                suggestion={suggestion}
                weekStartDate={weekStartDate}
                isSelected={selectedMealIds.has(index)}
                onSelect={(selected) => handleSelectMeal(index, selected)}
                onEdit={handleEditSuggestion}
              />
            ))}
          </div>

          {hasSelectedMeals && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleApplyMeals}
                className="w-full"
              >
                Apply {selectedMealIds.size} Selected Meal
                {selectedMealIds.size !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask for meal suggestions..."
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={!userMessage.trim() || isLoading}
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
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
        </div>
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
