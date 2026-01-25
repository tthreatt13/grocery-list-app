'use client'

import { HouseholdPreferences } from '@/lib/api/household'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface PreferencesDisplayProps {
  preferences: HouseholdPreferences | null
  onEdit: () => void
}

// Map diet type values to display labels
const DIET_TYPE_LABELS: Record<string, string> = {
  paleo: 'Paleo',
  mediterranean: 'Mediterranean',
  keto: 'Keto',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
  gluten_free: 'Gluten-Free',
  dairy_free: 'Dairy-Free',
  none: 'None',
}

// Map cooking apparatus values to display labels
const COOKING_APPARATUS_LABELS: Record<string, string> = {
  oven: 'Oven',
  stovetop: 'Stovetop',
  grill: 'Grill',
  slow_cooker: 'Slow Cooker',
  instant_pot: 'Instant Pot',
  air_fryer: 'Air Fryer',
  microwave: 'Microwave',
}

export default function PreferencesDisplay({
  preferences,
  onEdit,
}: PreferencesDisplayProps) {
  const hasAnyPreferences =
    preferences &&
    ((preferences.diet_types && preferences.diet_types.length > 0) ||
      (preferences.cooking_apparatus &&
        preferences.cooking_apparatus.length > 0) ||
      (preferences.previous_meals && preferences.previous_meals.length > 0) ||
      preferences.zip_code)

  if (!preferences || !hasAnyPreferences) {
    return (
      <div className="space-y-4">
        <p className="text-text-tertiary text-sm">
          No preferences set yet. Click Edit to add your preferences.
        </p>
        <Button variant="primary" onClick={onEdit}>
          Edit Preferences
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Diet Types */}
      {preferences.diet_types && preferences.diet_types.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Diet Types</h3>
          <div className="flex flex-wrap gap-2">
            {preferences.diet_types.map((diet) => (
              <Badge key={diet} variant="default">
                {DIET_TYPE_LABELS[diet] || diet}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Cooking Apparatus */}
      {preferences.cooking_apparatus &&
        preferences.cooking_apparatus.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Available Cooking Apparatus
            </h3>
            <div className="flex flex-wrap gap-2">
              {preferences.cooking_apparatus.map((apparatus) => (
                <Badge key={apparatus} variant="default">
                  {COOKING_APPARATUS_LABELS[apparatus] || apparatus}
                </Badge>
              ))}
            </div>
          </div>
        )}

      {/* Previous Meals */}
      {preferences.previous_meals && preferences.previous_meals.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            Previous Meals Made This Week
          </h3>
          <div className="flex flex-wrap gap-2">
            {preferences.previous_meals.map((meal, index) => (
              <Badge key={index} variant="default">
                {meal}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Zip Code */}
      {preferences.zip_code && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Zip Code</h3>
          <p className="text-text-primary">{preferences.zip_code}</p>
        </div>
      )}

      {/* Edit Button */}
      <div className="pt-4">
        <Button variant="primary" onClick={onEdit}>
          Edit Preferences
        </Button>
      </div>
    </div>
  )
}
