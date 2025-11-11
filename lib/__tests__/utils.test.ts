import { cn, formatDate, formatRelativeTime, isWithinDays, isPastDate, formatQuantity, generateId } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
    })

    it('handles conditional classes', () => {
      expect(cn('px-2', false && 'py-1')).toBe('px-2')
    })

    it('merges Tailwind classes without conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-01-15')
      expect(formatDate(date)).toMatch(/Jan 1[45], 2025/)
    })
  })

  describe('formatRelativeTime', () => {
    it('returns "just now" for recent times', () => {
      const date = new Date()
      expect(formatRelativeTime(date)).toBe('just now')
    })

    it('returns minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      expect(formatRelativeTime(date)).toBe('5 minutes ago')
    })

    it('returns hours ago', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      expect(formatRelativeTime(date)).toBe('2 hours ago')
    })
  })

  describe('isWithinDays', () => {
    it('returns true for dates within specified days', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      expect(isWithinDays(tomorrow, 7)).toBe(true)
    })

    it('returns false for dates beyond specified days', () => {
      const nextMonth = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
      expect(isWithinDays(nextMonth, 7)).toBe(false)
    })
  })

  describe('isPastDate', () => {
    it('returns true for past dates', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      expect(isPastDate(yesterday)).toBe(true)
    })

    it('returns false for future dates', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      expect(isPastDate(tomorrow)).toBe(false)
    })
  })

  describe('formatQuantity', () => {
    it('formats quantity with unit', () => {
      expect(formatQuantity(2, 'lbs')).toBe('2 lbs')
    })

    it('formats quantity without unit', () => {
      expect(formatQuantity(5)).toBe('5')
    })
  })

  describe('generateId', () => {
    it('generates a unique ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(id1.length).toBeGreaterThan(0)
    })
  })
})

