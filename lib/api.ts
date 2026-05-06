// lib/api.ts
//
// Thin wrapper around fetch() for talking to klassrun-api from the
// Next.js server (Route Handlers). Centralises base URL handling and
// JSON parsing so individual routes stay small.
//
// This is server-only — never imported from "use client" components.
// Client components hit our own /api/* Route Handlers, which then call
// this to reach klassrun-api with a JWT pulled from the httpOnly cookie.

const API_BASE = process.env.KLASSRUN_API_URL || 'http://localhost:4000'

export type ApiResponse<T = unknown> = {
  ok: boolean
  status: number
  data: T | null
  error: { message: string; field?: string } | null
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    token?: string
    headers?: Record<string, string>
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token, headers = {} } = opts

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }
  if (token) requestHeaders.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: {
        message:
          err instanceof Error
            ? `Network error: ${err.message}`
            : 'Network error reaching API',
      },
    }
  }

  let payload: unknown = null
  try {
    payload = await res.json()
  } catch {
    /* empty body is fine */
  }

  if (!res.ok) {
    const errPayload = (payload as { error?: { message?: string; field?: string } })?.error
    return {
      ok: false,
      status: res.status,
      data: null,
      error: {
        message: errPayload?.message || `Request failed (${res.status})`,
        field: errPayload?.field,
      },
    }
  }

  return {
    ok: true,
    status: res.status,
    data: payload as T,
    error: null,
  }
}
