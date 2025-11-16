// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'user_test123' }),
  currentUser: () => ({ id: 'user_test123', firstName: 'Test', lastName: 'Testuser' }),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => {
    // Create a simple mock that renders the user's initials
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'user-button' }, 'TT');
  },
  useAuth: () => ({ 
    isSignedIn: true,
    isLoaded: true,
    userId: 'user_test123', 
    signOut: jest.fn() 
  }),
  useUser: () => ({ 
    isSignedIn: true, 
    user: { 
      id: 'user_test123', 
      firstName: 'Test', 
      lastName: 'Testuser',
      emailAddresses: [{ emailAddress: 'test@example.com' }]
    }
  }),
}))

