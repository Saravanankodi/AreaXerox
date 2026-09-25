// /**
//  * Contact / launch-notification submission helper.
//  *
//  * Architecture:
//  *   React/Vite frontend → Google Apps Script Web App → private Google Sheet
//  *
//  * The Apps Script URL is a public endpoint (not a secret). No Google
//  * credentials, sheet IDs, or API keys may ever live in frontend code.
//  */

// export function getGoogleAppsScriptUrl(): string {
//   try {
//     const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
//     return (env?.VITE_GOOGLE_APPS_SCRIPT_URL ?? '').trim();
//   } catch {
//     return '';
//   }
// }

// export const CONTACT_LIMITS = {
//   nameMax: 100,
//   emailMax: 254,
// } as const;

// const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// export interface ContactInput {
//   name: string;
//   email: string;
//   /** Honeypot — must stay empty. Bots that fill it are silently accepted. */
//   website?: string;
// }

// export interface ContactValidation {
//   ok: boolean;
//   name: string;
//   email: string;
//   error: string | null;
// }

// export function validateContact(input: ContactInput): ContactValidation {
//   const name = (input.name ?? '').trim();
//   const email = (input.email ?? '').trim();

//   if (!name || !email) {
//     return { ok: false, name, email, error: 'Please provide both your name and email.' };
//   }
//   if (name.length > CONTACT_LIMITS.nameMax) {
//     return {
//       ok: false,
//       name,
//       email,
//       error: `Name must be ${CONTACT_LIMITS.nameMax} characters or fewer.`,
//     };
//   }
//   if (email.length > CONTACT_LIMITS.emailMax) {
//     return {
//       ok: false,
//       name,
//       email,
//       error: `Email must be ${CONTACT_LIMITS.emailMax} characters or fewer.`,
//     };
//   }
//   if (!EMAIL_PATTERN.test(email)) {
//     return { ok: false, name, email, error: 'Please enter a valid email address.' };
//   }
//   return { ok: true, name, email, error: null };
// }

// export interface ContactSubmitResult {
//   success: boolean;
// }

// function isMissingEndpointError(message: string): boolean {
//   return message.includes('VITE_GOOGLE_APPS_SCRIPT_URL');
// }

// /**
//  * Submit a contact to the Google Apps Script Web App.
//  *
//  * Uses `Content-Type: text/plain;charset=utf-8` so the request stays a
//  * "simple request" and avoids a CORS preflight that Apps Script cannot
//  * answer with custom headers. The Apps Script parses the text body as JSON.
//  *
//  * Never throws endpoint internals to the UI — callers map failures to a
//  * generic message. Throws a dev-oriented error when the endpoint is not
//  * configured so misconfiguration is visible during development.
//  */
// export async function submitContact(input: ContactInput): Promise<ContactSubmitResult> {
//   const validated = validateContact(input);
//   if (!validated.ok) {
//     throw new Error(validated.error ?? 'Invalid input');
//   }

//   const endpoint = getGoogleAppsScriptUrl();
//   if (!endpoint) {
//     throw new Error(
//       'Launch list is not configured yet (missing VITE_GOOGLE_APPS_SCRIPT_URL).',
//     );
//   }

//   let response: Response;
//   try {
//     response = await fetch(endpoint, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'text/plain;charset=utf-8',
//       },
//       body: JSON.stringify({
//         name: validated.name,
//         email: validated.email,
//         website: (input.website ?? '').trim(),
//       }),
//     });
//   } catch (err) {
//     // Network-level failure (DNS, offline, CORS block, etc.)
//     throw new Error(`Unable to reach the launch-list service: ${(err as Error).message}`);
//   }

//   let payload: { success?: boolean; message?: string } | null = null;
//   try {
//     payload = (await response.json()) as { success?: boolean; message?: string };
//   } catch {
//     payload = null;
//   }

//   if (!response.ok || !payload || payload.success !== true) {
//     // Honeypot/bot submissions return success:true server-side, so any
//     // failure here is a genuine error. Keep the message generic for users;
//     // include detail only for debugging via the thrown error chain.
//     throw new Error('Unable to save contact');
//   }

//   return { success: true };
// }

// export function isDev(): boolean {
//   return Boolean(import.meta.env.DEV);
// }

// export function describeConfigError(message: string): { title: string; detail: string | null } {
//   if (isMissingEndpointError(message)) {
//     return {
//       title: 'Something went wrong. Please try again.',
//       detail: isDev() ? message : null,
//     };
//   }
//   return { title: 'Something went wrong. Please try again.', detail: null };
// }






















/**
 * Contact / launch-notification submission helper.
 *
 * Architecture:
 *   React/Vite frontend → Google Apps Script Web App → private Google Sheet
 *
 * The Apps Script URL is a public endpoint (not a secret). No Google
 * credentials, sheet IDs, or API keys may ever live in frontend code.
 */

export function getGoogleAppsScriptUrl(): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return (env?.VITE_GOOGLE_APPS_SCRIPT_URL ?? '').trim();
  } catch {
    return '';
  }
}

export const CONTACT_LIMITS = {
  nameMax: 100,
  emailMax: 254,
  phoneMax: 20,
  descriptionMax: 1000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  description: string;
  /** Honeypot — must stay empty. */
  website?: string;
}

export interface ContactValidation {
  ok: boolean;
  name: string;
  email: string;
  phone: string;
  description: string;
  error: string | null;
}

export function validateContact(input: ContactInput): ContactValidation {
  const name = (input.name ?? '').trim();
  const email = (input.email ?? '').trim();
  const phone = (input.phone ?? '').trim();
  const description = (input.description ?? '').trim();

  if (!name || !email || !phone || !description) {
    return {
      ok: false,
      name,
      email,
      phone,
      description,
      error: 'Please provide your name, email, phone number, and description.',
    };
  }

  if (name.length > CONTACT_LIMITS.nameMax) {
    return {
      ok: false,
      name,
      email,
      phone,
      description,
      error: `Name must be ${CONTACT_LIMITS.nameMax} characters or fewer.`,
    };
  }

  if (email.length > CONTACT_LIMITS.emailMax) {
    return {
      ok: false,
      name,
      email,
      phone,
      description,
      error: `Email must be ${CONTACT_LIMITS.emailMax} characters or fewer.`,
    };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      name,
      email,
      phone,
      description,
      error: 'Please enter a valid email address.',
    };
  }

  if (phone.length > CONTACT_LIMITS.phoneMax) {
    return {
      ok: false,
      name,
      email,
      phone,
      description,
      error: `Phone number must be ${CONTACT_LIMITS.phoneMax} characters or fewer.`,
    };
  }

  if (description.length > CONTACT_LIMITS.descriptionMax) {
    return {
      ok: false,
      name,
      email,
      phone,
      description,
      error: `Description must be ${CONTACT_LIMITS.descriptionMax} characters or fewer.`,
    };
  }

  return {
    ok: true,
    name,
    email,
    phone,
    description,
    error: null,
  };
}

export interface ContactSubmitResult {
  success: boolean;
}

function isMissingEndpointError(message: string): boolean {
  return message.includes('VITE_GOOGLE_APPS_SCRIPT_URL');
}

/**
 * Submit a contact to the Google Apps Script Web App.
 *
 * Uses `Content-Type: text/plain;charset=utf-8` so the request stays a
 * "simple request" and avoids a CORS preflight that Apps Script cannot
 * answer with custom headers. The Apps Script parses the text body as JSON.
 *
 * Never throws endpoint internals to the UI — callers map failures to a
 * generic message. Throws a dev-oriented error when the endpoint is not
 * configured so misconfiguration is visible during development.
 */
export async function submitContact(input: ContactInput): Promise<ContactSubmitResult> {
  const validated = validateContact(input);

  if (!validated.ok) {
    throw new Error(validated.error ?? 'Invalid input');
  }

  const endpoint = getGoogleAppsScriptUrl();

  if (!endpoint) {
    throw new Error(
      'Launch list is not configured yet (missing VITE_GOOGLE_APPS_SCRIPT_URL).',
    );
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        description: validated.description,
        website: (input.website ?? '').trim(),
      }),
    });
  } catch (err) {
    throw new Error(
      `Unable to reach the launch-list service: ${(err as Error).message}`,
    );
  }

  let payload: { success?: boolean; message?: string } | null = null;

  try {
    payload = (await response.json()) as {
      success?: boolean;
      message?: string;
    };
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success !== true) {
    throw new Error('Unable to save contact');
  }

  return { success: true };
}

export function isDev(): boolean {
  return Boolean(import.meta.env.DEV);
}

export function describeConfigError(message: string): { title: string; detail: string | null } {
  if (isMissingEndpointError(message)) {
    return {
      title: 'Something went wrong. Please try again.',
      detail: isDev() ? message : null,
    };
  }
  return { title: 'Something went wrong. Please try again.', detail: null };
}
