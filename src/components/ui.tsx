import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** Section heading: icon badge, title, sub-line and an optional right-hand slot. */
export function SectionHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="sh">
      <span className="ico">
        <Icon name={icon} />
      </span>
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {right ? <div className="r">{right}</div> : null}
    </div>
  );
}

/** The "स्रोत: …" chip that sits beside every figure and chart. */
export function SourceChip({ children }: { children: ReactNode }) {
  return <span className="src">{children}</span>;
}

export function Chip({ children, tone }: { children: ReactNode; tone?: 'red' | 'navy' }) {
  return (
    <span className={`chip${tone === 'red' ? ' r' : tone === 'navy' ? ' n' : ''}`}>{children}</span>
  );
}

/** Shown wherever a figure has no verified, published record behind it yet. */
export function EmptyState({ label }: { label: string }) {
  return <div className="empty">{label}</div>;
}

export function Note({ children }: { children: ReactNode }) {
  return <div className="note">{children}</div>;
}

export function Card({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={className ? `card ${className}` : 'card'} id={id}>
      {children}
    </section>
  );
}
