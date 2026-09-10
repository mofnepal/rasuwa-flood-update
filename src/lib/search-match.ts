/**
 * Portal search, shared by the server and the static edition.
 *
 * The index holds published records only. Matching is a case-insensitive
 * substring test over each entry's terms, with a cap per group so one long
 * register cannot crowd everything else out of the results.
 */

export type SearchGroup =
  | 'contributions'
  | 'foreign'
  | 'initiatives'
  | 'sector'
  | 'contact'
  | 'section';

export interface SearchHit {
  group: SearchGroup;
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchEntry extends SearchHit {
  /** Lower-cased text the query is matched against. */
  terms: string;
}

const GROUP_LIMITS: Record<SearchGroup, number> = {
  contributions: 6,
  foreign: 4,
  initiatives: 5,
  sector: 20,
  contact: 4,
  section: 6,
};

export function matchSearchIndex(
  index: readonly SearchEntry[],
  rawQuery: string,
  limit = 12,
): SearchHit[] {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return [];

  const used = new Map<SearchGroup, number>();
  const hits: SearchHit[] = [];
  for (const entry of index) {
    if (!entry.terms.includes(query)) continue;
    const count = used.get(entry.group) ?? 0;
    if (count >= GROUP_LIMITS[entry.group]) continue;
    used.set(entry.group, count + 1);
    hits.push({
      group: entry.group,
      title: entry.title,
      subtitle: entry.subtitle,
      href: entry.href,
    });
    if (hits.length >= limit) break;
  }
  return hits;
}
