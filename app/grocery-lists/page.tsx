'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import GroceryListCard from '@/components/grocery/GroceryListCard'
import { mockGroceryLists } from '@/lib/mockData'

export default function GroceryListsPage() {
  const [lists, setLists] = useState(mockGroceryLists)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newListName, setNewListName] = useState('')

  const handleCreateList = () => {
    if (!newListName.trim()) return

    const newList = {
      id: String(lists.length + 1),
      name: newListName,
      items: [],
      createdBy: 'John Parent',
      createdAt: new Date(),
      updatedAt: new Date(),
      sharedWith: [],
      isArchived: false,
    }

    setLists([newList, ...lists])
    setNewListName('')
    setIsModalOpen(false)
  }

  const activeLists = lists.filter(list => !list.isArchived)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Grocery Lists</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your shopping lists and track items
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New List
          </Button>
        </div>

        {/* Lists Grid */}
        {activeLists.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lists yet</h3>
            <p className="text-gray-600 mb-4">Create your first grocery list to get started</p>
            <Button onClick={() => setIsModalOpen(true)}>Create List</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeLists.map((list) => (
              <GroceryListCard key={list.id} list={list} />
            ))}
          </div>
        )}

        {/* Create List Modal */}
        <Modal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setNewListName('')
          }}
          title="Create New List"
        >
          <div className="space-y-4">
            <Input
              label="List Name"
              placeholder="e.g., Weekly Shopping, Party Supplies"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateList()
                }
              }}
              autoFocus
            />
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setNewListName('')
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateList} disabled={!newListName.trim()}>
                Create List
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

