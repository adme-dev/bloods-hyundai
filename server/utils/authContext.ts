import type { JWTPayload } from './jwt';

export interface ContextUser extends JWTPayload {
  /** Alias of userId. The JWT payload has no `id`; many handlers historically read `user.id`. */
  id: string;
}

export function toContextUser(payload: JWTPayload): ContextUser {
  return { ...payload, id: payload.userId };
}
