'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import GroceryListCard from '@/components/grocery/GroceryListCard'
import {
  getGroceryListsWithItems,
  createGroceryList,
  deleteGroceryList,
  archiveGroceryList,
  unarchiveGroceryList,
} from '@/lib/api/grocery'
import {
  transformGroceryLists,
  transformGroceryList,
} from '@/lib/adapters/groceryAdapters'
import { GroceryList } from '@/lib/types'
import { getHouseholds, HouseholdResponse } from '@/lib/api/household'

export default function GroceryListsPage() {
  const { getToken } = useAuth()
  const [lists, setLists] = useState<GroceryList[]>([])
  const [households, setHouseholds] = useState<HouseholdResponse[]>([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState<GroceryList | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'current' | 'archived'>('current')

  // Fetch households and lists on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)
        const token = await getToken()
        if (!token) {
          setError('Authentication required')
          return
        }

        // Fetch households first
        const householdsData = await getHouseholds(token)
        setHouseholds(householdsData)

        // Set default household if available
        if (householdsData.length > 0 && !selectedHouseholdId) {
          setSelectedHouseholdId(householdsData[0].id)
        }

        // Fetch grocery lists with items
        const listsDataResponse = await getGroceryListsWithItems(token)
        const listsData = transformGroceryLists(listsDataResponse)
        // Sort by createdAt descending (newest first)
        listsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setLists(listsData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [getToken, selectedHouseholdId])

  const handleCreateList = async () => {
    if (!newListName.trim() || !selectedHouseholdId) return

    try {
      setIsCreating(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const newList = await createGroceryList(
        {
          name: newListName,
          household_id: selectedHouseholdId,
        },
        token
      )

      // Add empty items array and transform to match GroceryList type
      const newListWithItems = {
        ...newList,
        items: [],
      }
      const transformedNewList = transformGroceryList(newListWithItems)

      setLists([transformedNewList, ...lists])
      setNewListName('')
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error creating list:', err)
      setError(err instanceof Error ? err.message : 'Failed to create list')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteClick = (listId: string | number) => {
    const list = lists.find((l) => l.id === listId)
    if (list) {
      setListToDelete(list)
      setIsDeleteModalOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!listToDelete) return

    try {
      setIsDeleting(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      await deleteGroceryList(Number(listToDelete.id), token)

      // Remove the deleted list from local state
      setLists(lists.filter((list) => list.id !== listToDelete.id))
      setIsDeleteModalOpen(false)
      setListToDelete(null)
    } catch (err) {
      console.error('Error deleting list:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete list')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setListToDelete(null)
  }

  const handleArchive = async (listId: string | number) => {
    try {
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      await archiveGroceryList(Number(listId), token)

      // Optimistically update local state
      setLists(
        lists.map((list) =>
          list.id === listId ? { ...list, isArchived: true } : list
        )
      )
    } catch (err) {
      console.error('Error archiving list:', err)
      setError(err instanceof Error ? err.message : 'Failed to archive list')
    }
  }

  const handleUnarchive = async (listId: string | number) => {
    try {
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      await unarchiveGroceryList(Number(listId), token)

      // Optimistically update local state
      setLists(
        lists.map((list) =>
          list.id === listId ? { ...list, isArchived: false } : list
        )
      )
    } catch (err) {
      console.error('Error unarchiving list:', err)
      setError(err instanceof Error ? err.message : 'Failed to unarchive list')
    }
  }

  // Filter lists based on archive status
  const currentLists = lists.filter((list) => !list.isArchived)
  const archivedLists = lists.filter((list) => list.isArchived)
  const displayedLists = activeTab === 'current' ? currentLists : archivedLists

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--warm-blue)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">
            Loading your grocery lists...
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && lists.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-[var(--warm-coral-light)] border border-[var(--warm-coral)] rounded-lg p-6 text-center shadow-warm-sm">
            <svg
              className="w-12 h-12 text-[var(--warm-coral)] mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-[var(--warm-coral-dark)] mb-2">
              Error Loading Data
            </h3>
            <p className="text-[var(--warm-coral-dark)] mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error banner (non-blocking) */}
        {error && (
          <div className="mb-4 bg-[var(--warm-coral-light)] border border-[var(--warm-coral)] rounded-lg p-4 shadow-warm-sm">
            <p className="text-sm text-[var(--warm-coral-dark)]">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
              Grocery Lists
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">
              Manage your shopping lists and track items
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto"
            disabled={households.length === 0}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New List
          </Button>
        </div>

        {/* Tabs */}
        {households.length > 0 && lists.length > 0 && (
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('current')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'current'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Current ({currentLists.length})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'archived'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Archived ({archivedLists.length})
              </button>
            </nav>
          </div>
        )}

        {/* No households message */}
        {households.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Household Found
            </h3>
            <p className="text-gray-600 mb-4">
              Create or join a household to start managing grocery lists
            </p>
            <Button onClick={() => (window.location.href = '/household')}>
              Go to Household
            </Button>
          </div>
        ) : displayedLists.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'current'
                ? 'No current lists yet'
                : 'No archived lists yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'current'
                ? 'Create your first grocery list to get started'
                : 'Archive lists from the Current tab to organize your completed shopping lists'}
            </p>
            {activeTab === 'current' && (
              <Button onClick={() => setIsModalOpen(true)}>Create List</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedLists.map((list) => (
              <GroceryListCard
                key={list.id}
                list={list}
                onDelete={handleDeleteClick}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
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
          closeOnBackdropClick={false}
          closeOnEscape={false}
        >
          <div className="space-y-4">
            {households.length > 1 && (
              <Select
                label="Household"
                value={selectedHouseholdId?.toString() || ''}
                onChange={(e) =>
                  setSelectedHouseholdId(parseInt(e.target.value))
                }
              >
                <option value="">Select a household</option>
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.name}
                  </option>
                ))}
              </Select>
            )}
            <Input
              label="List Name"
              placeholder="e.g., Weekly Shopping, Party Supplies"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isCreating) {
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
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateList}
                disabled={
                  !newListName.trim() || !selectedHouseholdId || isCreating
                }
              >
                {isCreating ? 'Creating...' : 'Create List'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={isDeleteModalOpen}
          onClose={() => !isDeleting && handleDeleteCancel()}
          title="Delete Grocery List"
          closeOnBackdropClick={false}
          closeOnEscape={false}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete{' '}
              <strong>{listToDelete?.name}</strong>? This action cannot be
              undone and will permanently remove the list and all its items.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
