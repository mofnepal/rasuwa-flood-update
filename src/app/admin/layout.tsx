import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { EMBLEM } from '@/lib/emblem';
import Link from 'next/link';
import { currentUser } from '@/lib/permissions';
import { BASE_PATH } from '@/lib/constants';
import '../globals.css';
import './admin.css';

export const metadata: Metadata = {
  title: 'प्रशासन — रसुवा–भोटेकोशी बाढी अपडेट',
  robots: { index: false, follow: false },
  icons: { icon: [{ url: `${BASE_PATH}/img/favicon-32.png`, sizes: '32x32', type: 'image/png' }] },
};

const NAV = [
  { href: '/admin', label: 'ड्यासबोर्ड · Dashboard' },
  { href: '/admin/queue', label: 'कार्यसूची · Queue' },
  { href: '/admin/imports', label: 'आयात · Imports' },
  { href: '/admin/audit', label: 'अभिलेख · Audit' },
  { href: '/admin/users', label: 'प्रयोगकर्ता · Users' },
  { href: '/admin/settings', label: 'सेटिङ · Settings' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();

  return (
    <html lang="ne">
      <body>
        <div className="adm">
          <div className="adm-top">
            <div className="wrap">
              <Image src={EMBLEM} alt="" width={34} height={34} />
              <div>
                <b>रसुवा–भोटेकोशी बाढी अपडेट</b>
                <small>नेपाल सरकार, अर्थ मन्त्रालय — प्रशासन</small>
              </div>
              {user ? (
                <div className="who">
                  <b>{user.name}</b>
                  <span>
                    {user.email} · {user.role}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {user ? (
            <nav className="adm-nav">
              <div className="wrap">
                {NAV.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
                <Link href="/ne" style={{ marginLeft: 'auto' }}>
                  सार्वजनिक पोर्टल ↗
                </Link>
              </div>
            </nav>
          ) : null}

          <main className="adm-main">
            <div className="wrap">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
