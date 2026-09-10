/** Values fixed by the ministry — never invent or vary these. */

export const DISASTER_SLUG = 'rasuwa-2083';

/**
 * Where the portal is mounted. `/rasuwa-flood` on the ministry's server; the
 * GitHub Pages workflow sets `/rasuwa-flood-update`, or nothing on a custom domain.
 * next.config.ts reads the same variable, so the two never disagree.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/rasuwa-flood';

/**
 * The static edition: every public page rendered once at build time from the
 * published records, for hosting without a server (GitHub Pages). No admin, no
 * sign-in and no message form — those need the server edition.
 */
export const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';

/** The public address, used for share cards and absolute links. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mof.gov.np/rasuwa-flood';

export const OFFICIAL_LINKS = {
  donate: 'https://donate.gov.np/',
  rescueRequest: 'https://rescue.opmcm.gov.np/',
  rescuedPersons: 'https://ndrrma.gov.np/np/rasuwa',
  commandCentre: 'https://setu.ndrrma.gov.np',
  ministry: 'https://mof.gov.np/',
} as const;

export const FUND_STATUS_SOURCE_NE =
  'प्रधानमन्त्री दैवी प्रकोप उद्धार कोष — दैनिक जम्मा तथा कोष स्थिति (नेपाल राष्ट्र बैंक)';
export const FUND_STATUS_SOURCE_EN =
  'Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status (Nepal Rastra Bank)';

/** Nepal government palette. Nothing outside this list appears in the portal. */
export const PALETTE = {
  crimson: '#C8102E',
  crimsonDark: '#9E0C24',
  navy: '#003893',
  navy2: '#3A62B8',
  navy3: '#9DB3E3',
  navy4: '#E7EDFB',
  surface: '#F4F6FA',
  border: '#DCE1EA',
  ink: '#14213D',
  muted: '#5B6478',
  gold: '#C9A227',
  success: '#1F8A4C',
} as const;

export const SETTING_KEYS = {
  fxUsdNpr: 'fx_rate_usd_npr',
  lastPublicUpdate: 'last_public_update',
  eventDate: 'event_date',
  /** Register serials that belong to foreign assistance, not to the handover list. */
  registerSerialsInForeign: 'register_serials_in_foreign',
} as const;

export const DEFAULT_FX_USD_NPR = 150.88;
