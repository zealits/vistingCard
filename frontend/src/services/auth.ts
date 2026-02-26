const DASHBOARD_TOKEN_KEY = 'dashboard_token'

export function getAuthToken(): string | null {
  return localStorage.getItem(DASHBOARD_TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(DASHBOARD_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(DASHBOARD_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
