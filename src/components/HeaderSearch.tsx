'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { BASE_PATH, STATIC_EXPORT } from '@/lib/constants';
import { matchSearchIndex, type SearchEntry, type SearchHit } from '@/lib/search-match';
import { sitePath } from '@/lib/urls';
import { Icon } from './Icon';

type Hit = SearchHit;

/** The static edition's search index, fetched once per language on first use. */
const indexes = new Map<string, Promise<SearchEntry[]>>();
function loadIndex(locale: string): Promise<SearchEntry[]> {
  let index = indexes.get(locale);
  if (!index) {
    index = fetch(`${BASE_PATH}/open-data/search-${locale}.json`).then((response) => {
      if (!response.ok) throw new Error(`search index ${response.status}`);
      return response.json() as Promise<SearchEntry[]>;
    });
    // A failed fetch is forgotten, so the next keystroke tries again.
    index.catch(() => indexes.delete(locale));
    indexes.set(locale, index);
  }
  return index;
}

/**
 * Site-wide search over published records only. The server edition asks the
 * server; the static edition matches the same index in the browser.
 */
export function HeaderSearch() {
  const t = useTranslations('site');
  const ts = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        let found: Hit[];
        if (STATIC_EXPORT) {
          const index = await loadIndex(locale);
          if (controller.signal.aborted) return;
          found = matchSearchIndex(index, query);
        } else {
          const response = await fetch(
            `${BASE_PATH}/api/search?q=${encodeURIComponent(query)}&locale=${locale}`,
            { signal: controller.signal },
          );
          found = ((await response.json()) as { hits: Hit[] }).hits;
        }
        setHits(found);
        setOpen(true);
      } catch {
        /* aborted or offline — leave the previous results in place */
      }
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, locale]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, []);

  const groupLabel = (group: string) =>
    ({
      contributions: ts('groupContributions'),
      foreign: ts('groupForeign'),
      initiatives: ts('groupInitiatives'),
      sector: ts('groupSector'),
      contact: ts('groupContact'),
      section: ts('groupSection'),
    })[group] ?? group;

  return (
    <div className="gsearch" ref={boxRef}>
      <Icon name="search" />
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => hits.length && setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'Enter') {
            event.preventDefault();
            if (hits[0]) router.push(hits[0].href);
            // The full results page is rendered by the server edition only.
            else if (query.trim() && !STATIC_EXPORT) {
              router.push(`/search?q=${encodeURIComponent(query)}`);
            }
            setOpen(false);
          }
        }}
      />
      <div className="gsr" id={listId} role="listbox" hidden={!open}>
        {hits.length ? (
          hits.map((hit, index) => (
            <a
              key={`${hit.href}-${index}`}
              href={sitePath(locale, hit.href)}
              role="option"
              aria-selected={index === 0}
            >
              <small>{groupLabel(hit.group)}</small>
              <b>{hit.title}</b>
              <span>{hit.subtitle}</span>
            </a>
          ))
        ) : (
          <div className="none">{t('nothingFound')}</div>
        )}
      </div>
    </div>
  );
}
