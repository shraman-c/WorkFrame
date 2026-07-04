/**
 * Generates a structured Login ID for users in the system.
 *
 * Format: [CompanyInitials][First2FirstName][First2LastName][Year][Serial 4-digit zero-padded]
 *
 * Examples:
 *   "Odoo India", "Jo", "Do", 2022, 1 → "OIJODO20220001"
 *   "Acme Corp", "Jane", "Smith", 2024, 42 → "ACJASM20240042"
 */

/**
 * Derives company initials from a company name.
 *
 * Rules:
 * - If the name has multiple words: first letter of each word (max 2 letters).
 * - If the name is a single word: first two letters.
 * - Always uppercase.
 *
 * Examples:
 *   "Odoo India" → "OI"
 *   "Acme Corp" → "AC"
 *   "Google" → "GO"
 *   "A" → "A"
 */
export function deriveCompanyInitials(companyName: string): string {
  const words = companyName.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "";

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  // Take first letter of the first two words
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

/**
 * Generates the name portion of the Login ID: first 2 chars of firstName + first 2 chars of lastName.
 * Always uppercase.
 */
function namePortion(firstName: string, lastName: string): string {
  const first = firstName.trim().substring(0, 2).toUpperCase();
  const last = lastName.trim().substring(0, 2).toUpperCase();
  return first + last;
}

/**
 * Builds a Login ID string from its component parts.
 *
 * This is a pure, testable function — no DB access, no side effects.
 *
 * @param companyInitials - 1-2 letter company initials (e.g. "OI")
 * @param firstName       - User's first name
 * @param lastName        - User's last name
 * @param year            - Year of joining (e.g. 2022)
 * @param serial          - Sequential number for this company/year, 1-based
 * @returns The generated Login ID (e.g. "OIJODO20220001")
 */
export function buildLoginId(
  companyInitials: string,
  firstName: string,
  lastName: string,
  year: number,
  serial: number,
): string {
  const initials = companyInitials.toUpperCase();
  const name = namePortion(firstName, lastName);
  const yearStr = String(year);
  const serialStr = String(serial).padStart(4, "0");

  return `${initials}${name}${yearStr}${serialStr}`;
}

/**
 * Parses a full name into first and last name.
 * Handles "First Last", "First Middle Last", etc.
 * Returns [firstName, lastName] — lastName is the last word.
 */
export function parseFullName(fullName: string): [string, string] {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ["", ""];
  if (parts.length === 1) return [parts[0], parts[0]];
  return [parts[0], parts[parts.length - 1]];
}
