import type { IconName } from '@/components/Icon';

export interface NavItem {
  href: string;
  key: 'home' | 'contributions' | 'foreign' | 'rescue' | 'initiatives' | 'contact';
  icon: IconName;
}

export const NAV: readonly NavItem[] = [
  { href: '/', key: 'home', icon: 'home' },
  { href: '/contributions', key: 'contributions', icon: 'fund' },
  { href: '/foreign', key: 'foreign', icon: 'foreign' },
  { href: '/rescue', key: 'rescue', icon: 'rescue' },
  { href: '/initiatives', key: 'initiatives', icon: 'decisions' },
  { href: '/contact', key: 'contact', icon: 'contact' },
];
