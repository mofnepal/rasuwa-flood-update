/** The complete open-data files, served under /open-data/ by both editions. */
export const OPEN_DATA_FILES = {
  'index.json': 'This list',
  'summary.json': 'Headline figures by category, with each source’s cut-off',
  'contributions.json': 'Register of contributions handed over to the Hon. Finance Minister',
  'contributions.csv': 'The same register as CSV',
  'channels.json': 'Latest NCHL and Fonepay figures, channel by channel',
  'fund-status.json': 'Prime Minister Disaster Relief Fund — daily deposit and fund status',
  'foreign.json': 'Identified foreign contributors',
  'foreign.csv': 'The same list as CSV',
  'rescue-latest.json': 'Latest NDRRMA and Nepal Police figures',
  'rescue-reports.json': 'Every published daily rescue report',
  'decisions.json': 'Cabinet decisions, ministry notices and relief measures',
  'contacts.json': 'Single-window contacts and the ministry’s details',
  'search-ne.json': 'Search index, Nepali',
  'search-en.json': 'Search index, English',
} as const;

export type OpenDataFile = keyof typeof OPEN_DATA_FILES;
