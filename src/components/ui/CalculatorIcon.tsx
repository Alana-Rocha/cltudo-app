import {
  Baby,
  Building2,
  Scale,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Clock,
  FileText,
  Gift,
  Landmark,
  Moon,
  Palmtree,
  PiggyBank,
  Receipt,
  ShieldAlert,
  Timer,
  TrendingUp,
  TriangleAlert,
  Umbrella,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  wallet: Wallet,
  'file-text': FileText,
  'palm-tree': Palmtree,
  gift: Gift,
  clock: Clock,
  'piggy-bank': PiggyBank,
  'calendar-clock': CalendarClock,
  landmark: Landmark,
  receipt: Receipt,
  moon: Moon,
  'shield-alert': ShieldAlert,
  'triangle-alert': TriangleAlert,
  'calendar-days': CalendarDays,
  timer: Timer,
  'calendar-range': CalendarRange,
  baby: Baby,
  umbrella: Umbrella,
  'trending-up': TrendingUp,
  building: Building2,
  scale: Scale,
};

export function CalculatorIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Wallet;
  return <Icon className={className} aria-hidden="true" />;
}
