export interface AuthSession {
  isAuthenticated: boolean;
  role: 'field_salesperson' | 'authorised_manager';
  email?: string;
  name?: string;
  lastLogin?: number;
}

// Authorised emails and default security passcodes
export const AUTHORISED_EMAILS = [
  'nayanchildoffice@gmail.com',
  'admin@salestrack.com',
  'manager@salestrack.com',
];

export const AUTHORISED_PASSCODES = [
  '8899',       // Quick 4-digit manager PIN
  'admin2026',  // Standard admin passkey
  'salesmgr',   // Manager keyword
];

/**
 * Validates whether entered passcode or email matches authorized personnel
 */
export function verifyAuthorisedCredential(input: string): {
  success: boolean;
  role: 'authorised_manager' | 'field_salesperson';
  email?: string;
  name?: string;
} {
  const clean = input.trim().toLowerCase();

  // Check against passcodes
  if (AUTHORISED_PASSCODES.includes(clean)) {
    return {
      success: true,
      role: 'authorised_manager',
      email: 'nayanchildoffice@gmail.com',
      name: 'Authorised Operations Manager',
    };
  }

  // Check against authorized emails
  if (AUTHORISED_EMAILS.includes(clean)) {
    return {
      success: true,
      role: 'authorised_manager',
      email: clean,
      name: 'Authorised Manager',
    };
  }

  return {
    success: false,
    role: 'field_salesperson',
  };
}

/**
 * Checks if current session has permission to view logs and performance metrics
 */
export function canAccessAuthorisedFeatures(session: AuthSession | null): boolean {
  if (!session) return false;
  return session.isAuthenticated && session.role === 'authorised_manager';
}
