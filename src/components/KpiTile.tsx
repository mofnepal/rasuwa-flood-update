import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { CountUp } from './CountUp';

interface KpiTileProps {
  icon: IconName;
  label: string;
  sub?: string;
  /** Pre-formatted figure — always the exact published number. */
  value: string;
  /** Supply to animate the figure on load. */
  countTo?: { value: number; decimals?: number; prefix?: string; suffix?: string };
  foot?: ReactNode;
  tone?: 'red' | 'navy';
  delta?: { direction: 'up' | 'dn'; label: string };
}

export function KpiTile({ icon, label, sub, value, countTo, foot, tone, delta }: KpiTileProps) {
  return (
    <div className={`kpi${tone ? ` ${tone}` : ''}`}>
      <Icon name={icon} className="ico" />
      <div className="l">
        <b>{label}</b>
        {sub ? <span>{sub}</span> : null}
      </div>
      <div className="v" title={value}>
        {countTo ? <CountUp {...countTo} formatted={value} /> : value}
      </div>
      {foot ? <div className="s">{foot}</div> : null}
      {delta ? <div className={`d ${delta.direction}`}>{delta.label}</div> : null}
    </div>
  );
}
