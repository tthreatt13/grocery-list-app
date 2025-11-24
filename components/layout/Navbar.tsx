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
    { href: '/grocery-lists', label: 'Lists' },
    { href: '/pantry', label: 'Pantry' },
    { href: '/meal-planner', label: 'Planner' },
    { href: '/household', label: 'Family' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">
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
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
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
