import {
  getTimeOfDay,
  getDayOfWeek,
  isShoppingDay,
  getUserContext,
} from '../contextDetection'

describe('contextDetection', () => {
  describe('getTimeOfDay', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return "morning" for hours 5-11', () => {
      // Test morning hours
      for (let hour = 5; hour <= 11; hour++) {
        jest.setSystemTime(new Date(2024, 0, 1, hour, 30, 0))
        expect(getTimeOfDay()).toBe('morning')
      }
    })

    it('should return "afternoon" for hours 12-16', () => {
      // Test afternoon hours
      for (let hour = 12; hour <= 16; hour++) {
        jest.setSystemTime(new Date(2024, 0, 1, hour, 30, 0))
        expect(getTimeOfDay()).toBe('afternoon')
      }
    })

    it('should return "evening" for hours 17-21', () => {
      // Test evening hours
      for (let hour = 17; hour <= 21; hour++) {
        jest.setSystemTime(new Date(2024, 0, 1, hour, 30, 0))
        expect(getTimeOfDay()).toBe('evening')
      }
    })

    it('should return "night" for hours 22-4', () => {
      // Test night hours (22-23)
      for (let hour = 22; hour <= 23; hour++) {
        jest.setSystemTime(new Date(2024, 0, 1, hour, 30, 0))
        expect(getTimeOfDay()).toBe('night')
      }
      // Test night hours (0-4)
      for (let hour = 0; hour <= 4; hour++) {
        jest.setSystemTime(new Date(2024, 0, 1, hour, 30, 0))
        expect(getTimeOfDay()).toBe('night')
      }
    })

    it('should accept a custom date parameter', () => {
      const morningDate = new Date(2024, 0, 1, 8, 0, 0)
      expect(getTimeOfDay(morningDate)).toBe('morning')

      const eveningDate = new Date(2024, 0, 1, 19, 0, 0)
      expect(getTimeOfDay(eveningDate)).toBe('evening')
    })
  })

  describe('getDayOfWeek', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return correct day names', () => {
      const days = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ]

      days.forEach((day, index) => {
        // Create a date for that day (using a known date)
        // January 7, 2024 is a Sunday
        const baseDate = new Date(2024, 0, 7)
        const targetDate = new Date(
          baseDate.getTime() + index * 24 * 60 * 60 * 1000
        )
        jest.setSystemTime(targetDate)
        expect(getDayOfWeek()).toBe(day)
      })
    })

    it('should accept a custom date parameter', () => {
      const mondayDate = new Date(2024, 0, 8) // January 8, 2024 is a Monday
      expect(getDayOfWeek(mondayDate)).toBe('monday')

      const fridayDate = new Date(2024, 0, 12) // January 12, 2024 is a Friday
      expect(getDayOfWeek(fridayDate)).toBe('friday')
    })
  })

  describe('isShoppingDay', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return true for Saturday by default', () => {
      // January 6, 2024 is a Saturday
      const saturdayDate = new Date(2024, 0, 6)
      jest.setSystemTime(saturdayDate)
      expect(isShoppingDay()).toBe(true)
    })

    it('should return true for Sunday by default', () => {
      // January 7, 2024 is a Sunday
      const sundayDate = new Date(2024, 0, 7)
      jest.setSystemTime(sundayDate)
      expect(isShoppingDay()).toBe(true)
    })

    it('should return false for weekdays by default', () => {
      // Test Monday through Friday
      for (let day = 1; day <= 5; day++) {
        // January 8-12, 2024 are Monday-Friday
        const weekdayDate = new Date(2024, 0, 7 + day)
        jest.setSystemTime(weekdayDate)
        expect(isShoppingDay()).toBe(false)
      }
    })

    it('should accept custom shopping days', () => {
      const mondayDate = new Date(2024, 0, 8) // Monday
      jest.setSystemTime(mondayDate)

      expect(isShoppingDay(['monday', 'friday'])).toBe(true)
      expect(isShoppingDay(['saturday', 'sunday'])).toBe(false)
    })

    it('should accept a custom date parameter', () => {
      const saturdayDate = new Date(2024, 0, 6)
      const mondayDate = new Date(2024, 0, 8)

      expect(isShoppingDay(['saturday', 'sunday'], saturdayDate)).toBe(true)
      expect(isShoppingDay(['saturday', 'sunday'], mondayDate)).toBe(false)
    })
  })

  describe('getUserContext', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return morning planning context for morning on weekdays', () => {
      // Monday morning
      const mondayMorning = new Date(2024, 0, 8, 8, 0, 0)
      jest.setSystemTime(mondayMorning)

      const context = getUserContext()
      expect(context.timeOfDay).toBe('morning')
      expect(context.dayOfWeek).toBe('monday')
      expect(context.isShoppingDay).toBe(false)
      expect(context.viewMode).toBe('morning_planning')
    })

    it('should return shopping context for shopping days', () => {
      // Saturday morning
      const saturdayMorning = new Date(2024, 0, 6, 10, 0, 0)
      jest.setSystemTime(saturdayMorning)

      const context = getUserContext()
      expect(context.timeOfDay).toBe('morning')
      expect(context.dayOfWeek).toBe('saturday')
      expect(context.isShoppingDay).toBe(true)
      expect(context.viewMode).toBe('shopping')
    })

    it('should return routine review context for evening on weekdays', () => {
      // Monday evening
      const mondayEvening = new Date(2024, 0, 8, 19, 0, 0)
      jest.setSystemTime(mondayEvening)

      const context = getUserContext()
      expect(context.timeOfDay).toBe('evening')
      expect(context.dayOfWeek).toBe('monday')
      expect(context.isShoppingDay).toBe(false)
      expect(context.viewMode).toBe('routine_review')
    })

    it('should return shopping context for afternoon on shopping days', () => {
      // Sunday afternoon
      const sundayAfternoon = new Date(2024, 0, 7, 14, 0, 0)
      jest.setSystemTime(sundayAfternoon)

      const context = getUserContext()
      expect(context.timeOfDay).toBe('afternoon')
      expect(context.dayOfWeek).toBe('sunday')
      expect(context.isShoppingDay).toBe(true)
      expect(context.viewMode).toBe('shopping')
    })

    it('should accept custom shopping days', () => {
      // Monday morning with custom shopping days
      const mondayMorning = new Date(2024, 0, 8, 8, 0, 0)
      jest.setSystemTime(mondayMorning)

      const context = getUserContext(['monday', 'friday'])
      expect(context.isShoppingDay).toBe(true)
      expect(context.viewMode).toBe('shopping')
    })

    it('should accept custom date parameter', () => {
      const fridayEvening = new Date(2024, 0, 12, 18, 0, 0)

      const context = getUserContext(['saturday', 'sunday'], fridayEvening)
      expect(context.timeOfDay).toBe('evening')
      expect(context.dayOfWeek).toBe('friday')
      expect(context.isShoppingDay).toBe(false)
      expect(context.viewMode).toBe('routine_review')
    })
  })
})
