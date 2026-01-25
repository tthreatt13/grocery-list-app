'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Suggestion } from '@/lib/api/dashboard'
import { createGroceryList } from '@/lib/api/grocery'
import { getHouseholds, HouseholdResponse } from '@/lib/api/household'

interface SmartSuggestionsProps {
  suggestions: Suggestion[]
  getToken: () => Promise<string | null>
  onSuggestionAccepted?: (suggestionId: string) => void
  onSuggestionDismissed?: (suggestionId: string) => void
}

interface CreateListModalProps {
  open: boolean
  onClose: () => void
  onCreate: () => void
  getToken: () => Promise<string | null>
}

function CreateListModal({
  open,
  onClose,
  onCreate,
  getToken,
}: CreateListModalProps) {
  const [households, setHouseholds] = useState<HouseholdResponse[]>([])
  const [listName, setListName] = useState('')
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  React.useEffect(() => {
    if (open) {
      loadHouseholds()
    } else {
      setHouseholds([])
      setListName('')
      setSelectedHouseholdId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadHouseholds = async () => {
    try {
      setIsLoading(true)
      const token = await getToken()
      if (!token) {
        console.error('No authentication token available')
        return
      }

      const fetchedHouseholds = await getHouseholds(token)
      setHouseholds(fetchedHouseholds)

      // Auto-select first household if available
      if (fetchedHouseholds.length > 0) {
        setSelectedHouseholdId(fetchedHouseholds[0].id)
      }
    } catch (error) {
      console.error('Error loading households:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!listName.trim() || !selectedHouseholdId) return

    try {
      setIsCreating(true)
      const token = await getToken()
      if (!token) {
        console.error('No authentication token available')
        return
      }

      await createGroceryList(
        {
          name: listName.trim(),
          household_id: selectedHouseholdId,
        },
        token
      )

      onCreate()
      onClose()
    } catch (error) {
      console.error('Error creating grocery list:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a New Grocery List"
      className="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Create a new grocery list to start planning your shopping.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-[var(--text-secondary)]">
              Loading households...
            </p>
          </div>
        ) : households.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-[var(--text-secondary)]">
              No households found. Create a household first.
            </p>
          </div>
        ) : (
          <>
            <Input
              label="List Name"
              placeholder="e.g., Weekly Shopping, Costco Trip"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              required
              autoFocus
            />

            <div>
              <label
                htmlFor="select-household"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Household
              </label>
              <Select
                id="select-household"
                value={selectedHouseholdId?.toString() || ''}
                onChange={(e) =>
                  setSelectedHouseholdId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                disabled={isCreating}
                aria-label="Select household"
                options={households.map((household) => ({
                  value: household.id.toString(),
                  label: household.name,
                }))}
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={
              !listName.trim() ||
              !selectedHouseholdId ||
              isCreating ||
              isLoading ||
              households.length === 0
            }
          >
            {isCreating ? 'Creating...' : 'Create List'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function SmartSuggestions({
  suggestions,
  getToken,
  onSuggestionAccepted,
  onSuggestionDismissed,
}: SmartSuggestionsProps) {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Sort suggestions by priority (higher priority first)
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => b.priority - a.priority
  )

  const handleAccept = (suggestion: Suggestion) => {
    if (suggestion.type === 'restock') {
      router.push('/pantry')
    } else if (suggestion.type === 'meal_planning') {
      router.push('/meal-planner')
    } else if (suggestion.type === 'routine') {
      setIsCreateModalOpen(true)
    }

    if (onSuggestionAccepted) {
      onSuggestionAccepted(suggestion.id)
    }
  }

  const handleDismiss = (suggestionId: string) => {
    if (onSuggestionDismissed) {
      onSuggestionDismissed(suggestionId)
    }
  }

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false)
  }

  const handleCreateModalSuccess = () => {
    if (onSuggestionAccepted) {
      const routineSuggestion = suggestions.find((s) => s.type === 'routine')
      if (routineSuggestion) {
        onSuggestionAccepted(routineSuggestion.id)
      }
    }
    router.push('/grocery-lists')
  }

  const getSuggestionTypeBadge = (type: Suggestion['type']) => {
    switch (type) {
      case 'restock':
        return <Badge variant="warning">Restock</Badge>
      case 'meal_planning':
        return <Badge variant="primary">Meal Planning</Badge>
      case 'routine':
        return <Badge variant="default">Routine</Badge>
      default:
        return null
    }
  }

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'restock':
        return (
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        )
      case 'meal_planning':
        return (
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )
      case 'routine':
        return (
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        )
      default:
        return null
    }
  }

  if (sortedSuggestions.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">
          Smart Suggestions
        </h2>
        <Card>
          <div className="p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-[var(--warm-gray-400)] mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="text-[var(--text-secondary)] font-medium">
              No suggestions at this time
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              We&apos;ll provide personalized recommendations as you use the
              app!
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
        Smart Suggestions
      </h2>
      <div className="space-y-4">
        {sortedSuggestions.map((suggestion) => (
          <Card
            key={suggestion.id}
            className="hover:shadow-md transition-shadow"
          >
            {/* Mobile: Stack vertically with buttons at bottom */}
            {/* Desktop: Horizontal layout with buttons on right */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Suggestion Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getSuggestionIcon(suggestion.type)}
                </div>

                {/* Suggestion Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {suggestion.title}
                    </h3>
                    {getSuggestionTypeBadge(suggestion.type)}
                  </div>

                  {/* Suggestion Description */}
                  <p className="text-sm text-[var(--text-secondary)]">
                    {suggestion.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {/* Mobile: Side-by-side buttons at bottom */}
              {/* Desktop: Side-by-side on the right */}
              <div className="flex flex-row items-center gap-2 sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--warm-gray-200)]">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAccept(suggestion)}
                  aria-label={`Accept suggestion: ${suggestion.title}`}
                  className="flex-1 sm:flex-none"
                >
                  {suggestion.action_label}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(suggestion.id)}
                  aria-label={`Dismiss suggestion: ${suggestion.title}`}
                  className="flex-1 sm:flex-none"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CreateListModal
        open={isCreateModalOpen}
        onClose={handleCreateModalClose}
        onCreate={handleCreateModalSuccess}
        getToken={getToken}
      />
    </div>
  )
}
