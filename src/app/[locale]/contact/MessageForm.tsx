'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/Icon';
import { submitMessage, type ContactState } from './actions';

export function MessageForm() {
  const t = useTranslations('contact');
  const [state, action, pending] = useActionState<ContactState, FormData>(submitMessage, {
    status: 'idle',
  });

  if (state.status === 'sent') {
    return (
      <div className="note" role="status">
        <Icon name="check" /> {t('sent')}
      </div>
    );
  }

  return (
    <form className="form" action={action}>
      <input name="name" required placeholder={t('yourName')} aria-label={t('yourName')} />
      <input
        name="contact"
        required
        placeholder={t('emailOrPhone')}
        aria-label={t('emailOrPhone')}
      />
      <select name="subject" required aria-label={t('subject')} defaultValue="">
        <option value="" disabled>
          {t('subject')}
        </option>
        <option value="donation">{t('subjectDonation')}</option>
        <option value="foreign">{t('subjectForeign')}</option>
        <option value="in_kind">{t('subjectInKind')}</option>
        <option value="data">{t('subjectData')}</option>
        <option value="other">{t('subjectOther')}</option>
      </select>
      <textarea name="body" required placeholder={t('message')} aria-label={t('message')} />
      {/* Honeypot — hidden from people, tempting to bots. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
      />
      <button className="btn navy" type="submit" disabled={pending}>
        <Icon name="mail" /> {t('send')}
      </button>
      {state.status === 'error' ? (
        <div className="note" role="alert">
          {t('failed')}
        </div>
      ) : null}
      <div className="note">{t('formNote')}</div>
    </form>
  );
}
