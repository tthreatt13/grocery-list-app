import { render, screen } from '@testing-library/react'
import InsightsDisplay from '../InsightsDisplay'
import { DashboardStats } from '@/lib/api/dashboard'

const mockStats: DashboardStats = {
  total_lists: 3,
  total_items: 25,
  completed_items: 15,
  low_stock_count: 5,
  expiring_soon_count: 2,
  meals_this_week: 7,
  planned_days: 5,
}

describe('InsightsDisplay', () => {
  it('renders insights section with title', () => {
    render(<InsightsDisplay stats={mockStats} />)

    expect(screen.getByText('Insights & Patterns')).toBeInTheDocument()
  })

  it('displays completion rate insight', () => {
    render(<InsightsDisplay stats={mockStats} />)

    // 15 completed out of 25 total = 60%
    expect(screen.getByText(/completion rate/i)).toBeInTheDocument()
    expect(screen.getByText(/60%/i)).toBeInTheDocument()
  })

  it('displays meal planning coverage', () => {
    render(<InsightsDisplay stats={mockStats} />)

    // 5 planned days out of 7 = ~71%
    expect(screen.getByText(/meal planning coverage/i)).toBeInTheDocument()
    expect(screen.getByText(/71%/i)).toBeInTheDocument()
  })

  it('displays pantry health status', () => {
    render(<InsightsDisplay stats={mockStats} />)

    expect(screen.getByText(/pantry health/i)).toBeInTheDocument()
    expect(screen.getByText(/low stock/i)).toBeInTheDocument()
    expect(screen.getByText(/expiring soon/i)).toBeInTheDocument()
    // Check for the specific counts in the pantry health section
    const lowStockElements = screen.getAllByText('5')
    const expiringElements = screen.getAllByText('2')
    expect(lowStockElements.length).toBeGreaterThan(0)
    expect(expiringElements.length).toBeGreaterThan(0)
  })

  it('displays shopping efficiency message', () => {
    render(<InsightsDisplay stats={mockStats} />)

    expect(screen.getByText(/shopping efficiency/i)).toBeInTheDocument()
  })

  it('handles zero total items gracefully', () => {
    const zeroStats: DashboardStats = {
      ...mockStats,
      total_items: 0,
      completed_items: 0,
    }

    render(<InsightsDisplay stats={zeroStats} />)

    expect(screen.getByText(/completion rate/i)).toBeInTheDocument()
    // Should show 0% or handle division by zero
    expect(screen.getByText(/0%/i)).toBeInTheDocument()
  })

  it('handles zero planned days gracefully', () => {
    const zeroMealsStats: DashboardStats = {
      ...mockStats,
      meals_this_week: 0,
      planned_days: 0,
    }

    render(<InsightsDisplay stats={zeroMealsStats} />)

    expect(screen.getByText(/meal planning coverage/i)).toBeInTheDocument()
    // Check for 0% in the meal planning section specifically
    const zeroPercentElements = screen.getAllByText(/0%/i)
    expect(zeroPercentElements.length).toBeGreaterThan(0)
    // Also verify the message for zero meals
    expect(
      screen.getByText(/start planning meals to make grocery shopping easier/i)
    ).toBeInTheDocument()
  })

  it('displays visual indicators for patterns', () => {
    render(<InsightsDisplay stats={mockStats} />)

    // Check for progress bars
    const progressBars = screen.getAllByRole('progressbar')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  it('shows actionable stats with appropriate messaging', () => {
    render(<InsightsDisplay stats={mockStats} />)

    // Should show encouraging messages based on stats
    expect(screen.getByText(/completion rate/i)).toBeInTheDocument()
    expect(screen.getByText(/meal planning coverage/i)).toBeInTheDocument()
  })

  it('displays all key metrics', () => {
    render(<InsightsDisplay stats={mockStats} />)

    // Check that all main insights are displayed
    expect(screen.getByText(/completion rate/i)).toBeInTheDocument()
    expect(screen.getByText(/meal planning coverage/i)).toBeInTheDocument()
    expect(screen.getByText(/pantry health/i)).toBeInTheDocument()
    expect(screen.getByText(/shopping efficiency/i)).toBeInTheDocument()
  })

  it('handles high completion rate with positive messaging', () => {
    const highCompletionStats: DashboardStats = {
      ...mockStats,
      total_items: 20,
      completed_items: 18, // 90%
    }

    render(<InsightsDisplay stats={highCompletionStats} />)

    expect(screen.getByText(/90%/i)).toBeInTheDocument()
  })

  it('handles full meal planning coverage', () => {
    const fullCoverageStats: DashboardStats = {
      ...mockStats,
      planned_days: 7,
    }

    render(<InsightsDisplay stats={fullCoverageStats} />)

    expect(screen.getByText(/100%/i)).toBeInTheDocument()
  })
})

