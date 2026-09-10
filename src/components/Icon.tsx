import {
  BadgeCheck,
  Banknote,
  Building2,
  CalendarDays,
  ChartColumn,
  CircleCheck,
  Clock,
  Coins,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Flag,
  Fuel,
  Gavel,
  Globe,
  HandHeart,
  Home,
  Landmark,
  LifeBuoy,
  Mail,
  MapPin,
  Menu,
  Percent,
  Phone,
  Plane,
  QrCode,
  RadioTower,
  Search,
  Shield,
  ShieldPlus,
  Truck,
  Umbrella,
  Users,
  Wrench,
  X,
  Zap,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

/**
 * The portal's icon vocabulary. Every KPI, section header and category uses one
 * of these — no emoji, no clip-art, no stock photography.
 */
export const ICONS = {
  home: Home,
  fund: Coins,
  online: CreditCard,
  bank: Landmark,
  qr: QrCode,
  handover: HandHeart,
  foreign: Globe,
  rescue: LifeBuoy,
  rescuedPersons: Users,
  casualties: Umbrella,
  missing: Search,
  injured: ShieldPlus,
  holdingCentre: Home,
  security: Shield,
  helicopter: Plane,
  decisions: Gavel,
  measure: FileText,
  customs: Truck,
  tax: Percent,
  loan: Landmark,
  insurance: Umbrella,
  contact: Phone,
  location: MapPin,
  download: Download,
  verified: BadgeCheck,
  search: Search,
  clock: Clock,
  chart: ChartColumn,
  mail: Mail,
  menu: Menu,
  close: X,
  external: ExternalLink,
  check: CircleCheck,
  calendar: CalendarDays,
  electricity: Zap,
  fuel: Fuel,
  tower: RadioTower,
  organisation: Building2,
  cash: Banknote,
  flag: Flag,
  recovery: Wrench,
} satisfies Record<string, ComponentType<LucideProps>>;

export type IconName = keyof typeof ICONS;

interface IconProps extends LucideProps {
  name: IconName;
}

/** Sized in `em` by the stylesheet, so it inherits the surrounding type scale. */
export function Icon({ name, className, ...props }: IconProps) {
  const Component = ICONS[name];
  return (
    <Component
      className={className ? `i ${className}` : 'i'}
      strokeWidth={1.9}
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}
