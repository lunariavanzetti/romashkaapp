// Example: API Security helpers
export function rateLimit(windowMs: number, max: number) {
  const calls: Record<string, { count: number; last: number }> = {};
  return (ip: string) => {
    const now = Date.now();
    if (!calls[ip] || now - calls[ip].last > windowMs) {
      calls[ip] = { count: 1, last: now };
      return true;
    }
    if (calls[ip].count < max) {
      calls[ip].count++;
      return true;
    }
    return false;
  };
}

export function sanitizeInput(input: string) {
  return input.replace(/[<>"'`;(){}]/g, '');
}

export function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
} 