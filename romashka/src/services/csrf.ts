// Example: CSRF protection
export function generateCSRFToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function validateCSRFToken(token: string, sessionToken: string) {
  return token === sessionToken;
} 