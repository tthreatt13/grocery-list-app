/**
 * Tests for dashboard API client
 */

import { getDashboardInsights } from '../dashboard'
import * as client from '../client'

// Mock the client module
jest.mock('../client', () => ({
  get: jest.fn(),
}))

const mockGet = client.get as jest.MockedFunction<typeof client.get>

describe('Dashboard API', () => {
  const mockToken = 'test-token'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getDashboardInsights', () => {
    it('should call get with correct endpoint and token', async () => {
      const mockResponse = {
        urgent_items: [],
        suggestions: [],
        stats: {
          total_lists: 0,
          total_items: 0,
          completed_items: 0,
          low_stock_count: 0,
          expiring_soon_count: 0,
          meals_this_week: 0,
          planned_days: 0,
        },
      }

      mockGet.mockResolvedValue(mockResponse)

      const result = await getDashboardInsights(mockToken)

      expect(mockGet).toHaveBeenCalledWith('/api/dashboard/insights', mockToken)
      expect(result).toEqual(mockResponse)
    })

    it('should return dashboard insights with urgent items', async () => {
      const mockResponse = {
        urgent_items: [
          {
            id: 1,
            name: 'Milk',
            type: 'expiring_soon' as const,
            household_id: 1,
            category: 'Dairy',
            expiration_date: '2024-12-30T00:00:00Z',
            days_until_expiration: 3,
          },
        ],
        suggestions: [
          {
            id: 'restock_low_stock',
            type: 'restock' as const,
            title: 'Restock Low Stock Items',
            description: 'You have 1 item(s) running low.',
            action_label: 'View Items',
            priority: 2,
          },
        ],
        stats: {
          total_lists: 2,
          total_items: 10,
          completed_items: 5,
          low_stock_count: 1,
          expiring_soon_count: 1,
          meals_this_week: 7,
          planned_days: 5,
        },
      }

      mockGet.mockResolvedValue(mockResponse)

      const result = await getDashboardInsights(mockToken)

      expect(result.urgent_items).toHaveLength(1)
      expect(result.urgent_items[0].name).toBe('Milk')
      expect(result.suggestions).toHaveLength(1)
      expect(result.stats.total_lists).toBe(2)
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      mockGet.mockRejectedValue(error)

      await expect(getDashboardInsights(mockToken)).rejects.toThrow('API Error')
    })
  })
})
