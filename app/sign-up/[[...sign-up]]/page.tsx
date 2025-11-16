import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Get Started</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create an account to start planning your meals
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-xl',
            },
          }}
          redirectUrl="/grocery-lists"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  )
}

