/**
 * Tests for meals API client
 */

import { getAIMealSuggestions } from '../meals'
import * as client from '../client'

// Mock the client module
jest.mock('../client', () => ({
  post: jest.fn(),
}))

const mockPost = client.post as jest.MockedFunction<typeof client.post>

describe('Meals API', () => {
  const mockToken = 'test-token'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAIMealSuggestions', () => {
    it('should call post with correct endpoint, data, and token', async () => {
      const mockRequest = {
        household_id: 1,
        week_start_date: '2024-01-01',
        user_message: 'I want vegetarian meals',
        conversation_history: [],
      }

      const mockResponse = {
        suggestions: [
          {
            meal_name: 'Vegetarian Stir Fry',
            meal_type: 'dinner',
            day_of_week: 0,
            ingredients: ['tofu', 'vegetables', 'rice'],
            uses_pantry_items: ['soy sauce'],
            notes: 'Quick and healthy',
          },
        ],
        conversation_history: [
          {
            role: 'user',
            content: 'I want vegetarian meals',
          },
          {
            role: 'assistant',
            content: 'Here are some vegetarian meal suggestions...',
          },
        ],
      }

      mockPost.mockResolvedValue(mockResponse)

      const result = await getAIMealSuggestions(mockRequest, mockToken)

      expect(mockPost).toHaveBeenCalledWith(
        '/api/meals/ai-suggest',
        mockRequest,
        mockToken
      )
      expect(result).toEqual(mockResponse)
      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0].meal_name).toBe('Vegetarian Stir Fry')
    })

    it('should handle requests with conversation history', async () => {
      const mockRequest = {
        household_id: 1,
        week_start_date: '2024-01-01',
        user_message: 'Make it spicier',
        conversation_history: [
          {
            role: 'user',
            content: 'I want vegetarian meals',
          },
          {
            role: 'assistant',
            content: 'Here are some suggestions...',
          },
        ],
      }

      const mockResponse = {
        suggestions: [
          {
            meal_name: 'Spicy Vegetarian Curry',
            meal_type: 'dinner',
            day_of_week: 1,
            ingredients: ['tofu', 'curry paste', 'coconut milk'],
            uses_pantry_items: ['curry powder'],
            notes: 'Spicy and flavorful',
          },
        ],
        conversation_history: [
          {
            role: 'user',
            content: 'I want vegetarian meals',
          },
          {
            role: 'assistant',
            content: 'Here are some suggestions...',
          },
          {
            role: 'user',
            content: 'Make it spicier',
          },
          {
            role: 'assistant',
            content: 'Here are spicier options...',
          },
        ],
      }

      mockPost.mockResolvedValue(mockResponse)

      const result = await getAIMealSuggestions(mockRequest, mockToken)

      expect(mockPost).toHaveBeenCalledWith(
        '/api/meals/ai-suggest',
        mockRequest,
        mockToken
      )
      expect(result.conversation_history).toHaveLength(4)
      expect(result.suggestions[0].meal_name).toBe('Spicy Vegetarian Curry')
    })

    it('should handle API errors', async () => {
      const mockRequest = {
        household_id: 1,
        week_start_date: '2024-01-01',
        user_message: 'I want vegetarian meals',
        conversation_history: [],
      }

      const error = new Error('API Error: 500 Internal Server Error')
      mockPost.mockRejectedValue(error)

      await expect(
        getAIMealSuggestions(mockRequest, mockToken)
      ).rejects.toThrow('API Error: 500 Internal Server Error')
    })

    it('should handle empty suggestions response', async () => {
      const mockRequest = {
        household_id: 1,
        week_start_date: '2024-01-01',
        user_message: 'I want vegetarian meals',
        conversation_history: [],
      }

      const mockResponse = {
        suggestions: [],
        conversation_history: [
          {
            role: 'user',
            content: 'I want vegetarian meals',
          },
          {
            role: 'assistant',
            content: 'I could not generate suggestions at this time.',
          },
        ],
      }

      mockPost.mockResolvedValue(mockResponse)

      const result = await getAIMealSuggestions(mockRequest, mockToken)

      expect(result.suggestions).toHaveLength(0)
      expect(result.conversation_history).toHaveLength(2)
    })
  })
})
