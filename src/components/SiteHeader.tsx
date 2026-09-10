'use client';

import Image from 'next/image';
import { EMBLEM } from '@/lib/emblem';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link, usePathname as useLocalePathname, useRouter } from '@/i18n/routing';
import { NAV } from '@/lib/nav';
import { OFFICIAL_LINKS } from '@/lib/constants';
import { Icon } from './Icon';
import { HeaderSearch } from './HeaderSearch';
import type { AppLocale } from '@/i18n/routing';

export function SiteHeader() {
  const t = useTranslations('site');
  const tn = useTranslations('nav');
  const locale = useLocale() as AppLocale;
  const localePath = useLocalePathname();
  const rawPath = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // The drawer covers the page on a phone, so it closes on Escape and locks the
  // body while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('noscroll');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('noscroll');
    };
  }, [menuOpen]);

  const isCurrent = (href: string) =>
    href === '/' ? localePath === '/' : localePath.startsWith(href);

  const switchTo = (next: AppLocale) => {
    if (next === locale) return;
    // Keep the reader on the same page and query when they change language.
    const query = rawPath.includes('?') ? '' : '';
    router.replace(`${localePath}${query}`, { locale: next });
  };

  const langButtons = (long: boolean) => (
    <div className="lang" role="group" aria-label={t('language')}>
      <button
        type="button"
        className={locale === 'ne' ? 'on' : ''}
        aria-pressed={locale === 'ne'}
        onClick={() => switchTo('ne')}
      >
        {long ? 'नेपाली' : 'ने'}
      </button>
      <button
        type="button"
        className={locale === 'en' ? 'on' : ''}
        aria-pressed={locale === 'en'}
        onClick={() => switchTo('en')}
      >
        {long ? 'English' : 'EN'}
      </button>
    </div>
  );

  const donateButton = (
    <a
      className="btn red"
      href={OFFICIAL_LINKS.donate}
      target="_blank"
      rel="noopener noreferrer"
      // The label is hidden on a phone, leaving only the icon, so the name is set here.
      aria-label={`${t('donate')} — ${t('portal')}`}
    >
      <Icon name="qr" />
      <span>{t('donate')}</span>
    </a>
  );

  return (
    <>
      <a className="skip" href="#main">
        {t('skipToContent')}
      </a>

      <div className="top">
        <div className="wrap">
          <div className="brand">
            <Image src={EMBLEM} alt={t('emblemAlt')} width={56} height={56} priority />
            <div className="g">
              <small>{t('government')}</small>
              <b>{t('ministry')}</b>
              <span>{t('address')}</span>
            </div>
          </div>

          <div className="ptitle">
            <b>{t('portal')}</b>
            <span>{t('portalOther')}</span>
          </div>

          {/* Search has a row of its own; on a phone the language toggle sits beside
              it, so changing language never means opening the menu. */}
          <div className="srow">
            <HeaderSearch />
            {langButtons(false)}
          </div>

          <div className="tools">
            {langButtons(false)}
            {donateButton}
            <button
              type="button"
              className="burger"
              aria-label={t('menu')}
              aria-expanded={menuOpen}
              aria-controls="main-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>
      </div>

      <nav id="main-nav" className={`main${menuOpen ? ' open' : ''}`} aria-label={tn('home')}>
        <div className="wrap">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={isCurrent(item.href) ? 'on' : ''}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <span className="row">
                <Icon name={item.icon} />
                <span>{tn(item.key)}</span>
              </span>
              <small>{tn(`${item.key}Other`)}</small>
            </Link>
          ))}
          <div className="mextra">
            {langButtons(true)}
            {donateButton}
          </div>
        </div>
      </nav>

      <div className="stripe" />
    </>
  );
}
