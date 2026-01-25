'use client'

import { Meal } from '@/lib/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  formatDate,
  getMealDisplayName,
  parseRecipeInstructions,
} from '@/lib/utils'

interface MealDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  meal: Meal | null
  onEdit: (_meal: Meal) => void
  onDelete: (_mealId: string) => Promise<void>
}

export default function MealDetailsModal({
  isOpen,
  onClose,
  meal,
  onEdit,
  onDelete,
}: MealDetailsModalProps) {
  // #region agent log
  console.warn('[DEBUG] MealDetailsModal - Component rendered', {
    isOpen,
    hasMeal: !!meal,
    mealId: meal?.id,
  })
  // #endregion
  if (!meal) return null

  const handleDelete = async () => {
    try {
      await onDelete(meal.id)
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error deleting meal:', error)
    } finally {
      // Always close the modal after delete attempt
      onClose()
    }
  }

  const handleEdit = () => {
    onEdit(meal)
    onClose()
  }

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'Breakfast':
        return 'bg-amber-100 text-amber-800'
      case 'Lunch':
        return 'bg-blue-100 text-blue-800'
      case 'Dinner':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Meal Details">
      <div className="space-y-4">
        {/* Meal Image Placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
          <svg
            className="w-20 h-20 text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>

        {/* Meal Info */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {getMealDisplayName(meal)}
          </h3>
          <div className="flex items-center space-x-2 mb-3">
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${getMealTypeColor(
                meal.mealType
              )}`}
            >
              {meal.mealType}
            </span>
            <span className="text-sm text-gray-600">
              {formatDate(new Date(meal.date))}
            </span>
          </div>
        </div>

        {/* Recipe Instructions */}
        {meal.notes && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Recipe Instructions
            </h4>
            {(() => {
              // #region agent log
              console.warn(
                '[DEBUG] MealDetailsModal - meal.notes exists:',
                !!meal.notes,
                'length:',
                meal.notes?.length
              )
              console.warn(
                '[DEBUG] MealDetailsModal - meal.notes content (first 200 chars):',
                meal.notes?.substring(0, 200)
              )
              // #endregion
              const parsed = parseRecipeInstructions(meal.notes)
              // #region agent log
              const logData = {
                location: 'MealDetailsModal.tsx:105',
                message: 'Parsed recipe instructions',
                data: {
                  parsed: parsed
                    ? {
                        isStructured: parsed.isStructured,
                        stepsCount: parsed.steps?.length,
                        cookTime: parsed.cookTime,
                        firstStep: parsed.steps?.[0],
                      }
                    : null,
                  notesLength: meal.notes?.length,
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'A',
              }
              console.warn('[DEBUG]', logData)
              fetch(
                'http://127.0.0.1:7242/ingest/0962a481-6cbe-4459-8fab-c413be1a5fe6',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(logData),
                }
              ).catch(() => {})
              // #endregion
              if (parsed && parsed.isStructured) {
                return (
                  <div className="space-y-3">
                    {parsed.cookTime && (
                      <div className="text-sm font-medium text-gray-800 bg-orange-50 px-3 py-2 rounded-md border border-orange-200">
                        Cook Time: {parsed.cookTime}
                      </div>
                    )}
                    <div>
                      {parsed.steps.map((step, index) => {
                        // #region agent log
                        const isLast = index === parsed.steps.length - 1
                        const stepLogData = {
                          location: 'MealDetailsModal.tsx:115',
                          message: 'Rendering step',
                          data: {
                            stepNumber: step.number,
                            index,
                            isLast,
                            instructionLength: step.instruction?.length,
                            stepInstruction: step.instruction?.substring(0, 50),
                          },
                          timestamp: Date.now(),
                          sessionId: 'debug-session',
                          runId: 'run2',
                          hypothesisId: 'E',
                        }
                        console.warn('[DEBUG]', stepLogData)
                        fetch(
                          'http://127.0.0.1:7242/ingest/0962a481-6cbe-4459-8fab-c413be1a5fe6',
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(stepLogData),
                          }
                        ).catch(() => {})
                        // #endregion
                        return (
                          <div
                            key={step.number}
                            className="text-sm text-gray-600 flex items-start"
                            style={
                              !isLast
                                ? {
                                    paddingBottom: '1rem',
                                    marginBottom: '1rem',
                                    borderBottom: '2px solid #d1d5db',
                                    borderBottomWidth: '2px',
                                    borderBottomStyle: 'solid',
                                    borderBottomColor: '#d1d5db',
                                  }
                                : {}
                            }
                          >
                            <span
                              className="mr-2 min-w-[3rem]"
                              style={{
                                fontWeight: 700,
                                color: '#111827',
                                fontFamily: 'inherit',
                              }}
                            >
                              Step {step.number}:
                            </span>
                            <span className="flex-1">{step.instruction}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              } else if (parsed && !parsed.isStructured) {
                // #region agent log
                fetch(
                  'http://127.0.0.1:7242/ingest/0962a481-6cbe-4459-8fab-c413be1a5fe6',
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      location: 'MealDetailsModal.tsx:133',
                      message: 'Rendering legacy plain text',
                      data: {
                        parsedExists: !!parsed,
                        isStructured: parsed?.isStructured,
                      },
                      timestamp: Date.now(),
                      sessionId: 'debug-session',
                      runId: 'run1',
                      hypothesisId: 'A',
                    }),
                  }
                ).catch(() => {})
                // #endregion
                // Legacy plain text format
                return (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {meal.notes}
                  </p>
                )
              } else {
                // #region agent log
                fetch(
                  'http://127.0.0.1:7242/ingest/0962a481-6cbe-4459-8fab-c413be1a5fe6',
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      location: 'MealDetailsModal.tsx:141',
                      message: 'Rendering fallback',
                      data: { parsedExists: !!parsed },
                      timestamp: Date.now(),
                      sessionId: 'debug-session',
                      runId: 'run1',
                      hypothesisId: 'A',
                    }),
                  }
                ).catch(() => {})
                // #endregion
                // Fallback if parsing fails
                return (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {meal.notes}
                  </p>
                )
              }
            })()}
          </div>
        )}

        {/* Ingredients */}
        {meal.ingredients && meal.ingredients.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Ingredients ({meal.ingredients.length})
            </h4>
            <ul className="space-y-1">
              {meal.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Created By */}
        {meal.createdBy && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Created by {meal.createdBy}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button variant="primary" className="flex-1" onClick={handleEdit}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            onClick={handleDelete}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
