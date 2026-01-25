'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignInButton, useAuth, UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const pathname = usePathname()
  const { isSignedIn, isLoaded } = useAuth()

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/pantry', label: 'Pantry' },
    { href: '/meal-planner', label: 'Planner' },
    { href: '/grocery-lists', label: 'Lists' },
    { href: '/household', label: 'Family' },
  ]

  return (
    <nav className="bg-[var(--warm-white)] border-b border-[var(--warm-gray-200)] sticky top-0 z-50 shadow-warm-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[var(--warm-green)] rounded-lg flex items-center justify-center shadow-warm-sm">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <span className="font-bold text-xl text-[var(--text-primary)] hidden sm:block">
                GroceryApp
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-[var(--warm-green)] text-white shadow-warm-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--warm-gray-50)] hover:text-[var(--text-primary)]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            {isLoaded &&
              (isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-[var(--warm-green)] text-white rounded-lg hover:bg-[var(--warm-green-dark)] transition-warm text-sm font-medium shadow-warm-sm">
                    Sign In
                  </button>
                </SignInButton>
              ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
