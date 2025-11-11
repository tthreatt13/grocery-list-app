'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { ItemCategory } from '@/lib/types'

interface AddItemFormProps {
  onAdd: (item: {
    name: string
    quantity: number
    unit: string
    category: ItemCategory
    notes: string
  }) => void
  onCancel?: () => void
}

export default function AddItemForm({ onAdd, onCancel }: AddItemFormProps) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('')
  const [category, setCategory] = useState(ItemCategory.OTHER)
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return

    onAdd({
      name: name.trim(),
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim(),
      category,
      notes: notes.trim(),
    })

    // Reset form
    setName('')
    setQuantity('1')
    setUnit('')
    setCategory(ItemCategory.OTHER)
    setNotes('')
  }

  const categoryOptions = Object.values(ItemCategory).map(cat => ({
    value: cat,
    label: cat,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Item Name"
        placeholder="e.g., Bananas, Milk, Chicken"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Quantity"
          type="number"
          placeholder="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"
          step="0.1"
        />

        <Input
          label="Unit"
          placeholder="lbs, pcs, gallons"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
      </div>

      <Select
        label="Category"
        options={categoryOptions}
        value={category}
        onChange={(e) => setCategory(e.target.value as ItemCategory)}
      />

      <Input
        label="Notes (optional)"
        placeholder="e.g., Organic, Brand preference"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex space-x-3 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!name.trim()}>
          Add Item
        </Button>
      </div>
    </form>
  )
}

