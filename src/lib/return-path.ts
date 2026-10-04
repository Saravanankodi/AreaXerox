/**
 * `?next=` is the hand-off between an access gate and the auth pages: the gate
 * records where the visitor was headed, the auth pages read it back and send
 * them there once a session exists.
 */

/**
 * Only a same-origin absolute path may be used as a post-login destination.
 * Rejects protocol-relative (`//evil.com`) and backslash (`/\evil.com`) forms,
 * which browsers resolve as a different origin.
 */
export function sanitizeReturnPath(
  value: string | null,
): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/\\")) return null;

  return value;
}

/**
 * Appends `?next=<path>` to an auth URL so the destination survives the round
 * trip. Appends nothing when there is no destination to preserve.
 */
export function withNext(
  path: string,
  next?: string | null,
): string {
  if (!next) return path;

  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}next=${encodeURIComponent(next)}`;
}