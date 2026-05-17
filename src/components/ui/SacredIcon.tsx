'use client';

import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Clock,
  Compass,
  Flower2,
  Heart,
  Landmark,
  MapPin,
  MessageCircle,
  Mic,
  Moon,
  Mountain,
  Music2,
  Radio,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Sunset,
  TreePine,
  Users,
  Waves,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SacredIconName =
  | 'activity'
  | 'alert'
  | 'bell'
  | 'book'
  | 'brain'
  | 'calendar'
  | 'chant'
  | 'clock'
  | 'compass'
  | 'flower'
  | 'guidance'
  | 'heart'
  | 'japa'
  | 'kul'
  | 'landmark'
  | 'location'
  | 'mandali'
  | 'moon'
  | 'mountain'
  | 'music'
  | 'radio'
  | 'scroll'
  | 'settings'
  | 'shield'
  | 'sparkles'
  | 'star'
  | 'sun'
  | 'sunrise'
  | 'sunset'
  | 'tree'
  | 'water'
  | 'wind';

const ICONS: Record<SacredIconName, LucideIcon> = {
  activity: Activity,
  alert: AlertTriangle,
  bell: Bell,
  book: BookOpen,
  brain: Brain,
  calendar: CalendarDays,
  chant: Mic,
  clock: Clock,
  compass: Compass,
  flower: Flower2,
  guidance: Compass,
  heart: Heart,
  japa: Heart,
  kul: Users,
  landmark: Landmark,
  location: MapPin,
  mandali: MessageCircle,
  moon: Moon,
  mountain: Mountain,
  music: Music2,
  radio: Radio,
  scroll: ScrollText,
  settings: Settings,
  shield: Shield,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  sunrise: Sunrise,
  sunset: Sunset,
  tree: TreePine,
  water: Waves,
  wind: Wind,
};

interface SacredIconProps {
  name: SacredIconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  'aria-hidden'?: boolean;
}

export function getSacredIcon(name: SacredIconName): LucideIcon {
  return ICONS[name];
}

export default function SacredIcon({
  name,
  size = 18,
  className,
  strokeWidth = 1.8,
  'aria-hidden': ariaHidden = true,
}: SacredIconProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden={ariaHidden} className={className} size={size} strokeWidth={strokeWidth} />;
}
