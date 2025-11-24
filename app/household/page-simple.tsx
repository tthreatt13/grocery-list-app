// Note: This is a simplified version for API integration
// The full household management UI has been temporarily simplified to focus on API integration
// TODO: Restore full member management UI from previous version after testing API integration

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  getHouseholds,
  createHousehold,
  getHousehold,
  HouseholdWithMembersResponse,
  HouseholdResponse,
} from '@/lib/api/household'

export default function HouseholdPage() {
  const { getToken } = useAuth()
  const [households, setHouseholds] = useState<HouseholdResponse[]>([])
  const [selectedHousehold, setSelectedHousehold] =
    useState<HouseholdWithMembersResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newHouseholdName, setNewHouseholdName] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const token = await getToken()
        if (!token) return

        const householdsData = await getHouseholds(token)
        setHouseholds(householdsData)

        if (householdsData.length > 0) {
          const details = await getHousehold(householdsData[0].id, token)
          setSelectedHousehold(details)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [getToken])

  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) return
    try {
      const token = await getToken()
      if (!token) return

      const newHousehold = await createHousehold(
        { name: newHouseholdName },
        token
      )
      setHouseholds([...households, newHousehold])
      setNewHouseholdName('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create household'
      )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Household Management</h1>

      {error && (
        <div className="bg-red-50 p-4 rounded mb-4 text-red-700">{error}</div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <p className="text-yellow-800">
          <strong>Note:</strong> The full household management UI is temporarily
          simplified for API integration. Complete member management features
          will be restored after testing.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Households</h2>
          {households.length === 0 ? (
            <p className="text-gray-500 mb-4">
              No households yet. Create one to get started!
            </p>
          ) : (
            <ul className="space-y-2 mb-4">
              {households.map((h) => (
                <li
                  key={h.id}
                  className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={async () => {
                    const token = await getToken()
                    if (token) {
                      const details = await getHousehold(h.id, token)
                      setSelectedHousehold(details)
                    }
                  }}
                >
                  {h.name}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-3">
            <Input
              placeholder="New household name"
              value={newHouseholdName}
              onChange={(e) => setNewHouseholdName(e.target.value)}
            />
            <Button onClick={handleCreateHousehold} className="w-full">
              Create Household
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Members</h2>
          {selectedHousehold ? (
            <>
              <p className="text-gray-600 mb-4">{selectedHousehold.name}</p>
              <ul className="space-y-2">
                {selectedHousehold.members.map((member) => (
                  <li key={member.id} className="p-3 border rounded">
                    <div className="font-medium">
                      {member.user_email || `User ${member.user_id}`}
                    </div>
                    <div className="text-sm text-gray-600">{member.role}</div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-gray-500">Select a household to view members</p>
          )}
        </div>
      </div>
    </div>
  )
}
