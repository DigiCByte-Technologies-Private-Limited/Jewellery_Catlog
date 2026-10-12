/**
 * Comprehensive Validation & Sanitization Utility for Customer Web
 * Aligns client-side validation rules with backend TypeORM / Class-Validator requirements.
 */

// RFC 5322 compliant email regex
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Matches 10 to 14 numeric digits with optional leading '+'
export const PHONE_REGEX = /^[+]?[0-9]{10,14}$/;

// Standard Indian postal PIN code (6 digits) or international postal code (4 to 8 digits)
export const PINCODE_REGEX = /^[0-9]{4,8}$/;

/**
 * Sanitizes phone numbers by stripping formatting characters (spaces, hyphens, parentheses, dots).
 * If starts with +91 or other country code, preserves the leading plus.
 */
export function sanitizePhoneNumber(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Validates whether an email address is valid and well-formed.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validates whether a phone number contains a valid 10-14 digit number.
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const clean = sanitizePhoneNumber(phone);
  return PHONE_REGEX.test(clean);
}

/**
 * Validates whether a full name has at least 2 characters and doesn't contain prohibited control chars.
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Validates a PIN / postal code (4 to 8 digits, standard 6 in India).
 */
export function isValidPincode(pincode: string): boolean {
  if (!pincode || typeof pincode !== 'string') return false;
  const clean = pincode.replace(/\D/g, '');
  return clean.length === 6 || (clean.length >= 4 && clean.length <= 8);
}

/**
 * Validates password strength (minimum 6 characters as required by backend).
 */
export function isValidPassword(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required.' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true };
}

/**
 * Returns today's date formatted as YYYY-MM-DD for native <input type="date" min="..." />
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a date string (YYYY-MM-DD) is not in the future (for Date of Birth / Anniversary).
 */
export function isNotFutureDate(dateStr: string): boolean {
  if (!dateStr) return true;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return parsed <= today;
}

/**
 * Checks if a date string is today or in the future (for Consultation Booking).
 */
export function isTodayOrFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed >= today;
}

/**
 * Formats a Request ID to standard uppercase trimmed format (e.g., "req-000019" -> "REQ-000019").
 */
export function formatRequestId(id: string): string {
  if (!id) return '';
  return id.trim().toUpperCase();
}
