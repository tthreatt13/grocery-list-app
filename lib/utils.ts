import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge
 * Useful for conditional class application and avoiding style conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to a human-readable string
 */
export function formatDate(date: Date, format?: string): string {
  if (format === 'EEEE, MMMM d') {
    // Full weekday name, full month name, day
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }
  
  if (format === 'EEE') {
    // Short weekday name (Mon, Tue, Wed)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
    }).format(date)
  }

  if (format === 'MMM d') {
    // Short month name and day (Nov 10)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }
  
  // Default format
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * Formats a date to a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDate(date)
}

/**
 * Checks if a date is within the next N days
 */
export function isWithinDays(date: Date, days: number): boolean {
  const now = new Date()
  const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffInDays >= 0 && diffInDays <= days
}

/**
 * Checks if a date has passed
 */
export function isPastDate(date: Date): boolean {
  return date.getTime() < new Date().getTime()
}

/**
 * Formats a quantity with its unit
 */
export function formatQuantity(quantity: number, unit?: string): string {
  if (!unit) return quantity.toString()
  return `${quantity} ${unit}`
}

/**
 * Generates a random ID (simple implementation for prototype)
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

