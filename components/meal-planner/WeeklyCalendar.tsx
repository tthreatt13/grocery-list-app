'use client'

import { Meal, MealType } from '@/lib/types'
import MealCard from './MealCard'
import { formatDate, cn } from '@/lib/utils'
import { useRef, forwardRef, useImperativeHandle } from 'react'

interface WeeklyCalendarProps {
  startDate: Date
  meals: Meal[]
  onMealClick: (_meal: Meal) => void
  onEmptySlotClick: (_date: Date, _mealType: MealType) => void
  onMealEdit: (_meal: Meal) => void
  onMealDelete: (_mealId: string) => void
}

export interface WeeklyCalendarRef {
  scrollToToday: () => void
}

const WeeklyCalendar = forwardRef<WeeklyCalendarRef, WeeklyCalendarProps>(
  (
    {
      startDate,
      meals,
      onMealClick,
      onEmptySlotClick,
      onMealEdit,
      onMealDelete,
    },
    ref
  ) => {
    const todayColumnRef = useRef<HTMLTableCellElement>(null)

    useImperativeHandle(
      ref,
      () => ({
        scrollToToday: () => {
          if (todayColumnRef.current) {
            todayColumnRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center',
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

    // Helper to get meals for a specific day and meal type
    const getMealForSlot = (
      date: Date,
      mealType: MealType
    ): Meal | undefined => {
      // Normalize the input date to midnight (local time)
      const normalizedDate = new Date(date)
      normalizedDate.setHours(0, 0, 0, 0)
      const normalizedTimestamp = normalizedDate.getTime()

      return meals.find((meal) => {
        if (meal.mealType !== mealType) return false

        // Ensure meal.date is a Date object, normalize to midnight
        const mealDate =
          meal.date instanceof Date ? new Date(meal.date) : new Date(meal.date)
        mealDate.setHours(0, 0, 0, 0)

        // Use timestamp comparison for reliable date matching
        return mealDate.getTime() === normalizedTimestamp
      })
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
        <table className="w-full border-separate border-spacing-2 min-w-[800px]">
          <thead>
            <tr>
              <th className="w-32 p-2 bg-warm-gray-50 border border-warm-gray-200"></th>
              {weekDays.map((day) => (
                <th
                  key={day.toISOString()}
                  ref={isToday(day) ? todayColumnRef : null}
                  className={cn(
                    'p-3 text-center border border-warm-gray-200',
                    isToday(day) ? 'bg-warm-blue-light' : 'bg-warm-gray-50'
                  )}
                  role="columnheader"
                >
                  <div className="font-semibold text-text-primary">
                    {getDayLabel(day)}
                  </div>
                  <div
                    className={cn(
                      'text-sm',
                      isToday(day)
                        ? 'text-warm-blue font-semibold'
                        : 'text-text-secondary'
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
                <td className="p-3 font-medium text-text-secondary bg-warm-gray-50 border border-warm-gray-200 text-center">
                  {mealType}
                </td>
                {weekDays.map((day) => {
                  const meal = getMealForSlot(day, mealType)
                  return (
                    <td
                      key={`${day.toISOString()}-${mealType}`}
                      className={cn(
                        'p-3 border border-warm-gray-200 align-top',
                        isToday(day) ? 'bg-warm-blue-light/30' : 'bg-warm-white'
                      )}
                    >
                      {meal ? (
                        <div
                          onClick={(e) => {
                            // Only trigger if click is not on a button inside MealCard
                            const target = e.target as HTMLElement
                            if (
                              !target.closest('button') &&
                              !target.closest('svg') &&
                              !target.closest('path')
                            ) {
                              onMealClick(meal)
                            }
                          }}
                          className="cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onMealClick(meal)
                            }
                          }}
                          aria-label={`Edit ${meal.name || 'meal'} for ${formatDate(day)}`}
                        >
                          <MealCard
                            meal={meal}
                            onEdit={onMealEdit}
                            onDelete={onMealDelete}
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => onEmptySlotClick(day, mealType)}
                          className="w-full h-32 flex items-center justify-center border-2 border-dashed border-warm-gray-300 rounded-lg hover:border-warm-blue hover:bg-warm-blue-light transition-warm group"
                          aria-label={`Add meal for ${mealType} on ${formatDate(day)}`}
                        >
                          <div className="text-center">
                            <svg
                              className="w-8 h-8 mx-auto text-warm-gray-400 group-hover:text-warm-blue transition-warm"
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
                            <span className="text-xs text-text-tertiary group-hover:text-warm-blue mt-1 block">
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
      </div>
    )
  }
)

WeeklyCalendar.displayName = 'WeeklyCalendar'

export default WeeklyCalendar
