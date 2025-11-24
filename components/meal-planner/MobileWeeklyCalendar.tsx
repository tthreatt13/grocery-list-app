'use client'

import { Meal, MealType } from '@/lib/types'
import { formatDate, cn } from '@/lib/utils'
import { useRef, forwardRef, useImperativeHandle } from 'react'

interface MobileWeeklyCalendarProps {
  startDate: Date
  meals: Meal[]
  onEmptySlotClick: (date: Date, mealType: MealType) => void
  onMealClick: (meal: Meal) => void
}

export interface MobileWeeklyCalendarRef {
  scrollToToday: () => void
}

const MobileWeeklyCalendar = forwardRef<
  MobileWeeklyCalendarRef,
  MobileWeeklyCalendarProps
>(({ startDate, meals, onEmptySlotClick, onMealClick }, ref) => {
  const todayCardRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(
    ref,
    () => ({
      scrollToToday: () => {
        if (todayCardRef.current) {
          todayCardRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      },
    }),
    []
  )
  // Generate 7 days starting from startDate
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    return date
  })

  const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]

  // Helper to check if a date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Helper to get meals for a specific day
  const getMealsForDay = (date: Date): Meal[] => {
    return meals.filter(
      (meal) => new Date(meal.date).toDateString() === date.toDateString()
    )
  }

  // Helper to get meal for a specific slot
  const getMealForSlot = (date: Date, mealType: MealType): Meal | undefined => {
    return meals.find(
      (meal) =>
        meal.mealType === mealType &&
        new Date(meal.date).toDateString() === date.toDateString()
    )
  }

  // Helper to format the day label
  const getDayLabel = (date: Date) => {
    if (isToday(date)) {
      return 'Today'
    }
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[date.getDay()]
  }

  const getMealTypeColor = (mealType: MealType) => {
    switch (mealType) {
      case MealType.BREAKFAST:
        return 'bg-amber-50 border-amber-200'
      case MealType.LUNCH:
        return 'bg-blue-50 border-blue-200'
      case MealType.DINNER:
        return 'bg-emerald-50 border-emerald-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getMealTypeBadgeColor = (mealType: MealType) => {
    switch (mealType) {
      case MealType.BREAKFAST:
        return 'bg-amber-100 text-amber-800'
      case MealType.LUNCH:
        return 'bg-blue-100 text-blue-800'
      case MealType.DINNER:
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-3">
      {weekDays.map((day) => {
        const dayMeals = getMealsForDay(day)
        const today = isToday(day)

        return (
          <div
            key={day.toISOString()}
            ref={today ? todayCardRef : null}
            className={cn(
              'bg-white rounded-xl border-2 overflow-hidden',
              today ? 'border-blue-500 shadow-md' : 'border-gray-200'
            )}
          >
            {/* Day Header */}
            <div
              className={cn(
                'px-4 py-3 flex items-center justify-between',
                today ? 'bg-blue-500' : 'bg-gray-50'
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      today ? 'text-white' : 'text-gray-600'
                    )}
                  >
                    {getDayLabel(day)}
                  </div>
                  <div
                    className={cn(
                      'text-xs',
                      today ? 'text-blue-100' : 'text-gray-500'
                    )}
                  >
                    {formatDate(day, 'MMM d')}
                  </div>
                </div>
              </div>
              {today && (
                <span className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded">
                  Today
                </span>
              )}
            </div>

            {/* Meals for the day */}
            <div className="p-3 space-y-2">
              {mealTypes.map((mealType) => {
                const meal = getMealForSlot(day, mealType)

                return (
                  <div key={`${day.toISOString()}-${mealType}`}>
                    {meal ? (
                      <button
                        onClick={() => onMealClick(meal)}
                        className={cn(
                          'w-full text-left p-4 rounded-lg border-2 transition-all active:scale-98',
                          getMealTypeColor(mealType)
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-base flex-1">
                            {meal.name}
                          </h4>
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ml-2',
                              getMealTypeBadgeColor(mealType)
                            )}
                          >
                            {mealType}
                          </span>
                        </div>
                        {meal.notes && (
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {meal.notes}
                          </p>
                        )}
                        {meal.ingredients && meal.ingredients.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            {meal.ingredients.length} ingredient
                            {meal.ingredients.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => onEmptySlotClick(day, mealType)}
                        className="w-full p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-98 flex items-center justify-center"
                      >
                        <svg
                          className="w-5 h-5 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <span className="text-sm text-gray-600 font-medium">
                          Add {mealType.toLowerCase()}
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}

              {/* Show empty state if no meals planned for the day */}
              {dayMeals.length === 0 && (
                <div className="text-center py-2 text-xs text-gray-400">
                  No meals planned
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})

MobileWeeklyCalendar.displayName = 'MobileWeeklyCalendar'

export default MobileWeeklyCalendar
