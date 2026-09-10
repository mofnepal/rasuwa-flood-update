'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/Icon';
import { formatNumber, type Locale } from '@/lib/format';

export interface MeasureCategory {
  code: string;
  name_ne: string;
  name_en: string;
  agency_ne: string;
  agency_en: string;
  count: number;
}

export interface MeasureItem {
  id: string;
  no: number;
  category_code: string;
  category_ne: string;
  category_en: string;
  agency_ne: string;
  agency_en: string;
  title_ne: string;
  title_en: string;
  who_ne: string;
  benefit_ne: string;
  deadline_ne: string | null;
  cabinet_text_ne: string | null;
}

const CATEGORY_ICONS: Record<string, 'customs' | 'tax' | 'loan' | 'insurance' | 'measure'> = {
  क: 'customs',
  ख: 'tax',
  ग: 'loan',
  घ: 'insurance',
  ङ: 'measure',
};

/**
 * The category cards, the 18-measure grid and the detail drawer.
 * Deep links: `?cat=<code>` pre-filters, `?m=<no>` opens a measure.
 */
export function MeasureBrowser({
  categories,
  measures,
  originalUrl,
}: {
  categories: MeasureCategory[];
  measures: MeasureItem[];
  originalUrl: string | null;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('initiatives');
  const ts = useTranslations('site');
  const tt = useTranslations('table');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [agency, setAgency] = useState('');
  const [open, setOpen] = useState<number | null>(null);

  // Deep links are read in the browser, so they work on the static edition too.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const linkedCategory = search.get('cat');
    const linkedMeasure = Number(search.get('m'));
    if (linkedCategory) setCategory(linkedCategory);
    if (linkedMeasure) setOpen(linkedMeasure);
  }, []);

  const agencies = useMemo(
    () =>
      [...new Set(measures.map((m) => (locale === 'ne' ? m.agency_ne : m.agency_en)))].filter(
        Boolean,
      ),
    [measures, locale],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return measures.filter((measure) => {
      if (category && measure.category_code !== category) return false;
      if (agency && (locale === 'ne' ? measure.agency_ne : measure.agency_en) !== agency)
        return false;
      if (!needle) return true;
      return `${measure.title_ne}${measure.title_en}${measure.who_ne}${measure.benefit_ne}${measure.agency_ne}`
        .toLowerCase()
        .includes(needle);
    });
  }, [measures, category, agency, query, locale]);

  const current = open != null ? measures.find((m) => m.no === open) : undefined;

  useEffect(() => {
    if (!current) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('noscroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('noscroll');
    };
  }, [current]);

  return (
    <>
      <div className="cats">
        {categories.map((entry) => (
          <button
            key={entry.code}
            type="button"
            className={`cat${category === entry.code ? ' on' : ''}`}
            aria-pressed={category === entry.code}
            onClick={() => setCategory(category === entry.code ? '' : entry.code)}
          >
            <em>{entry.code}</em>
            <Icon name={CATEGORY_ICONS[entry.code] ?? 'measure'} className="ico" />
            <b>{locale === 'ne' ? entry.name_ne : entry.name_en}</b>
            <span>{locale === 'ne' ? entry.agency_ne : entry.agency_en}</span>
            <strong>
              {formatNumber(entry.count, locale)} {t('measures')}
            </strong>
          </button>
        ))}
      </div>

      <div className="filters" style={{ marginTop: 16 }}>
        <Icon name="search" />
        <input
          type="search"
          value={query}
          placeholder={t('searchMeasures')}
          aria-label={t('searchMeasures')}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          value={agency}
          aria-label={t('filterAgency')}
          onChange={(event) => setAgency(event.target.value)}
        >
          <option value="">{t('filterAgency')}</option>
          {agencies.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {(category || agency || query) && (
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => {
              setCategory('');
              setAgency('');
              setQuery('');
            }}
          >
            <Icon name="close" /> {tt('clear')}
          </button>
        )}
      </div>

      <div className="meas">
        {filtered.map((measure) => (
          <div
            key={measure.id}
            className="m"
            role="button"
            tabIndex={0}
            onClick={() => setOpen(measure.no)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setOpen(measure.no);
              }
            }}
          >
            <em>{formatNumber(measure.no, locale)}</em>
            <span className={`k ${measure.category_code}`}>{measure.category_code}</span>
            <b>{locale === 'ne' ? measure.title_ne : measure.title_en}</b>
            <i>{locale === 'ne' ? measure.agency_ne : measure.agency_en}</i>
          </div>
        ))}
      </div>

      {current ? (
        <div
          className="drawer open"
          role="dialog"
          aria-modal="true"
          aria-label={locale === 'ne' ? current.title_ne : current.title_en}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(null);
          }}
        >
          <div className="panel">
            <button
              type="button"
              className="x"
              aria-label={t('close')}
              onClick={() => setOpen(null)}
            >
              <Icon name="close" />
            </button>
            <span className="chip n">
              {t('measure')} {formatNumber(current.no, locale)} /{' '}
              {formatNumber(measures.length, locale)} · {current.category_code}.{' '}
              {locale === 'ne' ? current.category_ne : current.category_en}
            </span>
            <h3>{locale === 'ne' ? current.title_ne : current.title_en}</h3>
            <div className="kv">
              <b>{t('who')}</b>
              <span>{current.who_ne}</span>
              <b>{t('benefit')}</b>
              <span>{current.benefit_ne}</span>
              {current.deadline_ne ? (
                <>
                  <b>{t('deadline')}</b>
                  <span>{current.deadline_ne}</span>
                </>
              ) : null}
              <b>{t('implementedBy')}</b>
              <span>{current.agency_ne}</span>
            </div>
            {locale === 'en' ? <div className="note">{t('englishNote')}</div> : null}
            {current.cabinet_text_ne ? (
              <div className="full">
                <b>{t('cabinetWording')}</b>
                <br />
                {current.cabinet_text_ne}
              </div>
            ) : null}
            {originalUrl ? (
              <p style={{ marginTop: 14 }}>
                <a
                  className="btn ghost sm"
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="download" /> {ts('originalDocument')}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
