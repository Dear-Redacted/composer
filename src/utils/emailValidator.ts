/**
 * Email validation regex pattern (hoisted for performance)
 * Matches formats like: text@text.com, user+tag@domain.co.uk
 * Rejects: @, test, test@, invalid@, etc.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}
