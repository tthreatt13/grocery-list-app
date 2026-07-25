'use client'

import { useEffect, useRef, useState } from 'react'
import { ChatMessage, GrocerySuggestion } from '@/lib/types'
import { getAIGroceryReview } from '@/lib/api/grocery'
import GrocerySuggestionCard from './GrocerySuggestionCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface AIGroceryReviewAssistantProps {
  listId: number
  getToken: () => Promise<string | null>
  onSuggestionsApplied: () => Promise<void>
  onApplySuggestion: (suggestion: GrocerySuggestion) => Promise<void>
}

export default function AIGroceryReviewAssistant({
  listId,
  getToken,
  onSuggestionsApplied,
  onApplySuggestion,
}: AIGroceryReviewAssistantProps) {
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>(
    []
  )
  const [gapAnalysis, setGapAnalysis] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<GrocerySuggestion[]>([])
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<
    Set<number>
  >(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userMessage, setUserMessage] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const prevConversationLengthRef = useRef(0)

  useEffect(() => {
    const prevLength = prevConversationLengthRef.current
    const currentLength = conversationHistory.length
    if (currentLength > prevLength && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
    prevConversationLengthRef.current = currentLength
  }, [conversationHistory])

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return

    const message = userMessage.trim()
    setUserMessage('')
    setError(null)

    const updatedHistory: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: message },
    ]
    setConversationHistory(updatedHistory)
    setIsLoading(true)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication required. Please sign in again.')
      }

      const response = await getAIGroceryReview(
        listId,
        {
          user_message: message,
          conversation_history: conversationHistory,
        },
        token
      )

      setConversationHistory(response.conversation_history)
      setGapAnalysis(response.gap_analysis)
      setSuggestions(response.suggestions)
      setSelectedSuggestionIds(new Set())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to review grocery list. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSuggestion = (index: number, selected: boolean) => {
    const next = new Set(selectedSuggestionIds)
    if (selected) {
      next.add(index)
    } else {
      next.delete(index)
    }
    setSelectedSuggestionIds(next)
  }

  const handleApplySingle = async (
    suggestion: GrocerySuggestion,
    index: number
  ) => {
    try {
      setIsApplying(true)
      setError(null)
      await onApplySuggestion(suggestion)
      setSuggestions((prev) => prev.filter((_, i) => i !== index))
      await onSuggestionsApplied()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to apply suggestion.'
      )
    } finally {
      setIsApplying(false)
    }
  }

  const handleApplySelected = async () => {
    const selected = suggestions.filter((_, index) =>
      selectedSuggestionIds.has(index)
    )
    if (selected.length === 0) {
      setError('Please select at least one suggestion to apply')
      return
    }

    try {
      setIsApplying(true)
      setError(null)
      for (const suggestion of selected) {
        await onApplySuggestion(suggestion)
      }
      setSuggestions([])
      setSelectedSuggestionIds(new Set())
      await onSuggestionsApplied()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to apply suggestions.'
      )
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--warm-gray-200)] shadow-warm-sm p-4 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        Dietary List Review
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Get gap analysis and suggestions to better meet your dietary needs.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div
        ref={chatContainerRef}
        className="max-h-64 overflow-y-auto mb-4 space-y-3"
      >
        {conversationHistory.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`text-sm rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-[var(--warm-blue-light)] text-[var(--text-primary)] ml-8'
                : 'bg-gray-50 text-gray-800 mr-8'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {gapAnalysis && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
          <h3 className="font-medium text-emerald-900 mb-1">Gap Analysis</h3>
          <p className="text-sm text-emerald-800 whitespace-pre-wrap">
            {gapAnalysis}
          </p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Suggestions</h3>
            {selectedSuggestionIds.size > 0 && (
              <Button
                size="sm"
                onClick={handleApplySelected}
                disabled={isApplying}
              >
                Apply Selected ({selectedSuggestionIds.size})
              </Button>
            )}
          </div>
          {suggestions.map((suggestion, index) => (
            <GrocerySuggestionCard
              key={`${suggestion.action}-${suggestion.name}-${index}`}
              suggestion={suggestion}
              index={index}
              isSelected={selectedSuggestionIds.has(index)}
              onSelect={(selected) => handleSelectSuggestion(index, selected)}
              onApply={handleApplySingle}
            />
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="flex gap-2"
      >
        <Input
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Review my list for protein and vegetables..."
          disabled={isLoading || isApplying}
          aria-label="Ask for grocery list review"
        />
        <Button
          type="submit"
          disabled={isLoading || isApplying || !userMessage.trim()}
          aria-label="Send message"
        >
          {isLoading ? 'Reviewing...' : 'Review'}
        </Button>
      </form>
    </div>
  )
}
