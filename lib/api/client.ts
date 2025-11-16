/**
 * API Client for backend communication
 * Handles authentication, request/response formatting, and error handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ApiError {
  message: string
  status: number
  details?: unknown
}

export class ApiClientError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.details = details
  }
}

interface RequestOptions extends RequestInit {
  token?: string
}

/**
 * Base fetch wrapper with authentication and error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  }

  // Add authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    // Handle non-2xx responses
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      let errorDetails

      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.detail || errorMessage
        errorDetails = errorData
      } catch {
        // Response body is not JSON or empty
      }

      throw new ApiClientError(errorMessage, response.status, errorDetails)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T
    }

    // Parse JSON response
    return await response.json()
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }

    // Network or other errors
    throw new ApiClientError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      0
    )
  }
}

/**
 * GET request
 */
export async function get<T>(
  endpoint: string,
  token?: string,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'GET',
    token,
  })
}

/**
 * POST request
 */
export async function post<T>(
  endpoint: string,
  data?: unknown,
  token?: string,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    token,
  })
}

/**
 * PUT request
 */
export async function put<T>(
  endpoint: string,
  data?: unknown,
  token?: string,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    token,
  })
}

/**
 * PATCH request
 */
export async function patch<T>(
  endpoint: string,
  data?: unknown,
  token?: string,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    token,
  })
}

/**
 * DELETE request
 */
export async function del<T>(
  endpoint: string,
  token?: string,
  options?: RequestOptions
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'DELETE',
    token,
  })
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<{ status: string }> {
  return get('/health')
}

/**
 * User sync response
 */
export interface UserSyncResponse {
  id: number
  clerk_user_id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

/**
 * Sync user from Clerk to backend database
 */
export async function syncUser(data: {
  clerk_user_id: string
  email: string
  name?: string
}): Promise<UserSyncResponse> {
  return post('/api/users/sync', data)
}

