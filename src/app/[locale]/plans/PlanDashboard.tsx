'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/Icon';
import { Chip } from '@/components/ui';
import { bsDate, formatNumber, kathmanduDay, type Locale } from '@/lib/format';
import {
  actionsByDeadline,
  agencyName,
  deadlineBucket,
  deadlineDate,
  deadlineLabel,
  themeName,
  type ActionPlanData,
  type PlanAction,
} from '@/lib/action-plan';

/**
 * The roadmap and the action list of one plan, with the filters that join them:
 * choosing a deadline column, a theme or a body narrows the list beneath.
 * Deep link: `?a=<no>` opens that action.
 */
export function PlanDashboard({ plan, issuedAt }: { plan: ActionPlanData; issuedAt: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('plans');
  const [theme, setTheme] = useState('');
  const [agency, setAgency] = useState('');
  const [deadline, setDeadline] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const [view, setView] = useState<'cards' | 'table'>('cards');

  // Read in the browser, so it works on the static edition too.
  useEffect(() => {
    const linked = Number(new URLSearchParams(window.location.search).get('a'));
    if (linked) {
      setOpen(linked);
      document.getElementById(`action-${linked}`)?.scrollIntoView({ block: 'start' });
    }
  }, []);

  const columns = useMemo(() => actionsByDeadline(plan), [plan]);

  // The axis runs from the day the plan was issued to its last dated deadline.
  // "Immediately" and "promptly" sit at the start; undated actions stand apart.
  const { timeline, undated, span } = useMemo(() => {
    const startMs = kathmanduDay(new Date(issuedAt)).getTime();
    const dated = columns.filter((entry) => entry.bucket.kind === 'month_end');
    const endMs = dated.length
      ? Math.max(...dated.map((entry) => deadlineDate(entry.actions[0]!.deadline)!.getTime()))
      : startMs + 86_400_000;
    const at = (ms: number) =>
      Math.min(100, Math.max(0, ((ms - startMs) / (endMs - startMs)) * 100));
    const timeline = columns
      .filter((entry) => entry.bucket.kind !== 'none')
      .map((entry) => ({
        ...entry,
        left:
          entry.bucket.kind === 'month_end'
            ? at(deadlineDate(entry.actions[0]!.deadline)!.getTime())
            : 0,
      }));
    return {
      timeline,
      undated: columns.find((entry) => entry.bucket.kind === 'none') ?? null,
      span: { startMs, endMs, at },
    };
  }, [columns, issuedAt]);

  // Today's mark is placed in the browser, on Nepal's calendar day.
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => {
    const now = kathmanduDay(new Date()).getTime();
    setToday(now >= span.startMs && now <= span.endMs ? span.at(now) : null);
  }, [span]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return plan.actions.filter((action) => {
      if (theme && action.theme !== theme) return false;
      if (agency && !action.agencies.includes(agency)) return false;
      if (deadline && deadlineBucket(action.deadline).key !== deadline) return false;
      if (!needle) return true;
      const haystack = [
        action.no,
        action.title_ne,
        action.title_en,
        action.detail_ne,
        action.detail_en,
        ...action.agencies.map((code) => agencyName(plan, code, locale)),
        themeName(plan, action.theme, locale),
        ...(action.sub_items ?? []).flatMap((item) => [item.text_ne, item.text_en]),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [plan, theme, agency, deadline, query, locale]);

  const filtering = Boolean(theme || agency || deadline || query);
  const clear = () => {
    setTheme('');
    setAgency('');
    setDeadline('');
    setQuery('');
  };

  const dueLine = (action: PlanAction) => {
    const date = deadlineDate(action.deadline);
    const label = deadlineLabel(action.deadline, locale);
    return date ? `${label} · ${bsDate(date, null, locale)}` : label;
  };

  return (
    <>
      {/* ── roadmap: a time axis from the day the plan was issued to its last deadline ── */}
      <div className={`roadmap${undated ? ' has-undated' : ''}`}>
        <div className="axis" role="list">
          <div className="line" aria-hidden="true" />
          <div className="issued" style={{ left: 0 }}>
            <i />
            <span>
              {t('issued')} · {bsDate(issuedAt, null, locale)}
            </span>
          </div>
          {today != null ? (
            <div className="today" style={{ left: `${today}%` }} aria-hidden="true">
              <span>{t('today')}</span>
            </div>
          ) : null}
          {timeline.map(({ bucket, actions, left }, index) => {
            const sample = actions[0]!.deadline;
            const date = bucket.kind === 'month_end' ? deadlineDate(sample) : null;
            const on = deadline === bucket.key;
            return (
              <div
                key={bucket.key}
                role="listitem"
                className={`col${on ? ' on' : ''}${bucket.kind !== 'month_end' ? ' now' : ''}${index % 2 ? ' below' : ''}`}
                style={{ left: `${left}%` }}
              >
                <button
                  type="button"
                  className="head"
                  aria-pressed={on}
                  onClick={() => setDeadline(on ? '' : bucket.key)}
                  title={t('roadmapPick')}
                >
                  <em>{formatNumber(actions.length, locale)}</em>
                  <b>{deadlineLabel(sample, locale)}</b>
                  <span>
                    {date ? bsDate(date, null, locale, { separator: '\n' }) : t('fromIssue')}
                  </span>
                </button>
                <div className="nums">
                  {actions.map((action) => (
                    <a
                      key={action.no}
                      href={`#action-${action.no}`}
                      className={`num${open === action.no ? ' on' : ''}`}
                      title={locale === 'ne' ? action.title_ne : action.title_en}
                      onClick={() => setOpen(action.no)}
                    >
                      {formatNumber(action.no, locale)}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {undated ? (
          <div className={`col undated${deadline === undated.bucket.key ? ' on' : ''}`}>
            <button
              type="button"
              className="head"
              aria-pressed={deadline === undated.bucket.key}
              onClick={() => setDeadline(deadline === undated.bucket.key ? '' : undated.bucket.key)}
              title={t('roadmapPick')}
            >
              <em>{formatNumber(undated.actions.length, locale)}</em>
              <b>{deadlineLabel(undated.actions[0]!.deadline, locale)}</b>
              <span>{t('undatedSub')}</span>
            </button>
            <div className="nums">
              {undated.actions.map((action) => (
                <a
                  key={action.no}
                  href={`#action-${action.no}`}
                  className={`num${open === action.no ? ' on' : ''}`}
                  title={locale === 'ne' ? action.title_ne : action.title_en}
                  onClick={() => setOpen(action.no)}
                >
                  {formatNumber(action.no, locale)}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── filters ─────────────────────────────────────────────────────── */}
      <div className="filters planfilters">
        <label className="srch">
          <Icon name="search" />
          <input
            type="search"
            value={query}
            placeholder={t('search')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
          aria-label={t('allThemes')}
        >
          <option value="">{t('allThemes')}</option>
          {plan.themes.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {locale === 'ne' ? entry.name_ne : entry.name_en}
            </option>
          ))}
        </select>
        <select
          value={agency}
          onChange={(event) => setAgency(event.target.value)}
          aria-label={t('allAgencies')}
        >
          <option value="">{t('allAgencies')}</option>
          {plan.agencies.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {locale === 'ne' ? entry.name_ne : entry.name_en}
            </option>
          ))}
        </select>
        <select
          value={deadline}
          onChange={(event) => setDeadline(event.target.value)}
          aria-label={t('allDeadlines')}
        >
          <option value="">{t('allDeadlines')}</option>
          {columns.map(({ bucket, actions }) => (
            <option key={bucket.key} value={bucket.key}>
              {deadlineLabel(actions[0]!.deadline, locale)}
            </option>
          ))}
        </select>
        <span className="count">
          {t('showing', {
            shown: formatNumber(filtered.length, locale),
            total: formatNumber(plan.actions.length, locale),
          })}
        </span>
        <div className="tabs view" role="group" aria-label={t('view')}>
          <button
            type="button"
            className={view === 'cards' ? 'on' : ''}
            onClick={() => setView('cards')}
          >
            {t('viewCards')}
          </button>
          <button
            type="button"
            className={view === 'table' ? 'on' : ''}
            onClick={() => setView('table')}
          >
            {t('viewTable')}
          </button>
        </div>
        {filtering ? (
          <button type="button" className="btn ghost sm" onClick={clear}>
            <Icon name="close" /> {t('clear')}
          </button>
        ) : null}
      </div>

      {/* ── the actions ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="empty">{t('noMatch')}</div>
      ) : view === 'table' ? (
        <div className="tscroll">
          <table className="tbl plan-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('actions')}</th>
                <th>{t('responsible')}</th>
                <th>{t('deadline')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((action) => (
                <tr key={action.no} id={`row-${action.no}`}>
                  <td className="amt">{formatNumber(action.no, locale)}</td>
                  <td>
                    <b>{locale === 'ne' ? action.title_ne : action.title_en}</b>
                    <br />
                    <small>{themeName(plan, action.theme, locale)}</small>
                  </td>
                  <td>
                    {action.agencies
                      .map((code) => agencyName(plan, code, locale, true))
                      .join(' · ')}
                  </td>
                  <td>{dueLine(action)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ol className="plan-actions">
          {filtered.map((action) => {
            const expanded = open === action.no;
            return (
              <li key={action.no} id={`action-${action.no}`} className={expanded ? 'open' : ''}>
                <span className="no" aria-hidden="true">
                  {formatNumber(action.no, locale)}
                </span>
                <div className="body">
                  <button
                    type="button"
                    className="ttl"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : action.no)}
                  >
                    {locale === 'ne' ? action.title_ne : action.title_en}
                  </button>
                  <div className="meta">
                    <Chip tone="navy">{themeName(plan, action.theme, locale)}</Chip>
                    {action.agencies.map((code) => (
                      <Chip key={code}>{agencyName(plan, code, locale, true)}</Chip>
                    ))}
                    <Chip tone={action.deadline.kind === 'immediate' ? 'red' : undefined}>
                      <Icon name="calendar" /> {dueLine(action)}
                    </Chip>
                  </div>
                  {expanded ? (
                    <div className="detail">
                      <p>{locale === 'ne' ? action.detail_ne : action.detail_en}</p>
                      {action.sub_items?.length ? (
                        <ol className="sub">
                          {action.sub_items.map((item) => (
                            <li key={item.label}>
                              <b>({item.label})</b> {locale === 'ne' ? item.text_ne : item.text_en}
                              {item.deadline ? (
                                <i> — {deadlineLabel(item.deadline, locale)}</i>
                              ) : null}
                            </li>
                          ))}
                        </ol>
                      ) : null}
                      {action.deadline.note_ne || action.deadline.note_en ? (
                        <p className="dl">
                          <Icon name="clock" />{' '}
                          {locale === 'ne' ? action.deadline.note_ne : action.deadline.note_en}
                        </p>
                      ) : null}
                      <p className="who">
                        <b>{t('responsible')}:</b>{' '}
                        {action.agencies.map((code) => agencyName(plan, code, locale)).join(' · ')}
                      </p>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
