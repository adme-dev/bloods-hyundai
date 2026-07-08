const SENSITIVE = ['passwordHash', 'resetToken', 'resetTokenExpiry', 'verificationToken'] as const;

/**
 * Strip sensitive auth columns from a customer row before it leaves the server.
 * Passes null/undefined through unchanged.
 */
export function pickSafeCustomer<T extends Record<string, any>>(c: T | null | undefined) {
  if (!c) return c;
  const { passwordHash, resetToken, resetTokenExpiry, verificationToken, ...safe } = c;
  return safe;
}

/**
 * Redact sensitive keys from a jsonb activity value (old_value / new_value).
 * Historical activity rows may contain a full customer snapshot; this ensures
 * secrets are never serialized to a client. Non-objects pass through unchanged.
 */
export function redactActivityValue(v: unknown): unknown {
  if (!v || typeof v !== 'object') return v;
  const clone: Record<string, any> = { ...(v as Record<string, any>) };
  for (const k of SENSITIVE) {
    if (k in clone) delete clone[k];
  }
  return clone;
}
