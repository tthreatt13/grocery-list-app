'use client'

import { Meal, MealType } from '@/lib/types'
import MealCard from './MealCard'
import { formatDate, cn } from '@/lib/utils'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

interface WeeklyCalendarProps {
  startDate: Date
  meals: Meal[]
  onMealClick: (meal: Meal) => void
  onEmptySlotClick: (date: Date, mealType: MealType) => void
  onMealEdit: (meal: Meal) => void
  onMealDelete: (mealId: string) => void
}

export interface WeeklyCalendarRef {
  scrollToToday: () => void
}

const WeeklyCalendar = forwardRef<WeeklyCalendarRef, WeeklyCalendarProps>(({
  startDate,
  meals,
  onMealClick,
  onEmptySlotClick,
  onMealEdit,
  onMealDelete,
}, ref) => {
  const todayColumnRef = useRef<HTMLTableCellElement>(null)

  useImperativeHandle(ref, () => ({
    scrollToToday: () => {
      if (todayColumnRef.current) {
        todayColumnRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }), [])
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

  // Helper to get meals for a specific day and meal type
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
    return formatDate(date, 'EEE')
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="w-32 p-2 bg-gray-50 border border-gray-200"></th>
            {weekDays.map((day) => (
              <th
                key={day.toISOString()}
                ref={isToday(day) ? todayColumnRef : null}
                className={cn(
                  'p-3 text-center border border-gray-200',
                  isToday(day) ? 'bg-blue-50' : 'bg-gray-50'
                )}
                role="columnheader"
              >
                <div className="font-semibold text-gray-900">{getDayLabel(day)}</div>
                <div
                  className={cn(
                    'text-sm',
                    isToday(day) ? 'text-blue-600 font-semibold' : 'text-gray-600'
                  )}
                >
                  {formatDate(day, 'MMM d')}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mealTypes.map((mealType) => (
            <tr key={mealType}>
              <td className="p-3 font-medium text-gray-700 bg-gray-50 border border-gray-200 text-center">
                {mealType}
              </td>
              {weekDays.map((day) => {
                const meal = getMealForSlot(day, mealType)
                return (
                  <td
                    key={`${day.toISOString()}-${mealType}`}
                    className={cn(
                      'p-2 border border-gray-200 align-top',
                      isToday(day) ? 'bg-blue-50/30' : 'bg-white'
                    )}
                  >
                    {meal ? (
                      <div onClick={() => onMealClick(meal)}>
                        <MealCard
                          meal={meal}
                          onEdit={onMealEdit}
                          onDelete={onMealDelete}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => onEmptySlotClick(day, mealType)}
                        className="w-full h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        aria-label={`Add meal for ${mealType} on ${formatDate(day)}`}
                      >
                        <div className="text-center">
                          <svg
                            className="w-8 h-8 mx-auto text-gray-400 group-hover:text-blue-500 transition-colors"
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
                          <span className="text-xs text-gray-500 group-hover:text-blue-600 mt-1 block">
                            Add Meal
                          </span>
                        </div>
                      </button>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Drag and drop placeholder indicator */}
      <div className="mt-4 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
        <svg
          className="w-5 h-5 inline mr-2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
        Drag &amp; drop functionality coming soon!
      </div>
    </div>
  )
})

WeeklyCalendar.displayName = 'WeeklyCalendar'

export default WeeklyCalendar

