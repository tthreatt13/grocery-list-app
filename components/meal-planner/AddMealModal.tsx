'use client'

import { useState, useEffect } from 'react'
import { MealType } from '@/lib/types'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

interface AddMealModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (mealData: { name: string; notes?: string }) => void
  mealType: MealType
  date: Date
}

export default function AddMealModal({
  isOpen,
  onClose,
  onAdd,
  mealType,
  date,
}: AddMealModalProps) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setNotes('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      return
    }

    onAdd({
      name: name.trim(),
      notes: notes.trim() || undefined,
    })

    // Clear form
    setName('')
    setNotes('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" role="dialog">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Meal</h2>
        <p className="text-sm text-gray-600 mb-6">
          {mealType} for {formatDate(date, 'EEEE, MMMM d')}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Meal Name"
              id="meal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spaghetti Bolognese"
              required
            />

            <div>
              <label
                htmlFor="meal-notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notes (Optional)
              </label>
              <textarea
                id="meal-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or special instructions..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!name.trim()}
            >
              Add Meal
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

