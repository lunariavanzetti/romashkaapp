// Example: SQL injection prevention helpers
export function escapeSQL(str: string) {
  return str.replace(/'/g, "''");
}

export function safeQuery(query: string, params: unknown[]) {
  // Use parameterized queries with Supabase/Postgres
  // This is a placeholder for actual query logic
  return { query, params };
} 