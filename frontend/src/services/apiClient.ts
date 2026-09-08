// Thin fetch wrapper for API Gateway calls.
// In later phases every request gets the Cognito ID token attached here.

const API_URL = import.meta.env.VITE_API_URL ?? ''

interface RequestOptions extends RequestInit {
  auth?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new Error(
      'The API is not configured yet (VITE_API_URL is empty in frontend/.env). ' +
        'Deploy the QuizArena-Api stack, then paste its ApiUrl output into .env.',
    )
  }

  const { auth = true, headers, ...rest } = options

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  if (auth) {
    const token = sessionStorage.getItem('idToken')
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers: finalHeaders })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { code: body.code ?? String(res.status), message: body.message ?? res.statusText }
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
