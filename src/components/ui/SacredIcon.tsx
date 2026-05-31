'use client';

import React from 'react';

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
  | 'wind'
  | 'flame';

type IconProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
  'aria-hidden'?: boolean;
};

type GlyphProps = {
  strokeWidth: number;
};

type SacredIconComponent = React.ComponentType<GlyphProps>;

function SvgShell({
  children,
  size = 18,
  className,
  style,
  ariaHidden = true,
}: {
  children: React.ReactNode;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  ariaHidden?: boolean;
}) {
  return (
    <svg
      aria-hidden={ariaHidden}
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function base(strokeWidth: number) {
  return {
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
}

const ActivityIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M3.5 13.5C6 13.5 6.8 7.5 8.5 7.5C10 7.5 10.6 16.5 12.6 16.5C14.1 16.5 14.9 10.5 16.1 10.5C17.4 10.5 18.1 13.5 20.5 13.5" />
      <path {...p} d="M4 18.5C6 19.7 8.7 20.5 12 20.5C15.3 20.5 18 19.7 20 18.5" opacity="0.45" />
    </>
  );
};

const AlertIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M12 4.5L20 18.5H4L12 4.5Z" />
      <path {...p} d="M12 9V13.2" />
      <circle cx="12" cy="16.2" r="0.8" fill="currentColor" />
    </>
  );
};

const BellIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M7.5 9.2C7.5 6.7 9.4 5 12 5C14.6 5 16.5 6.7 16.5 9.2V12.5C16.5 13.8 16.9 15 17.7 16L18.5 17H5.5L6.3 16C7.1 15 7.5 13.8 7.5 12.5V9.2Z" />
      <path {...p} d="M10 19C10.4 20 11.1 20.5 12 20.5C12.9 20.5 13.6 20 14 19" />
    </>
  );
};

const BookIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M6 6.5C6 5.7 6.7 5 7.5 5H18V18.5H8C6.9 18.5 6 17.6 6 16.5V6.5Z" />
      <path {...p} d="M6 16.5C6 15.4 6.9 14.5 8 14.5H18" />
      <path {...p} d="M9.5 8.5H15" opacity="0.55" />
      <path {...p} d="M9.5 11H14" opacity="0.55" />
    </>
  );
};

const BrainIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M9 6.5C7 6.5 5.7 8 5.7 9.8C4.4 10.3 3.8 11.5 3.8 12.8C3.8 14.6 5 16 6.8 16.3C7 18 8.4 19.3 10.1 19.3C11.1 19.3 11.8 18.9 12.3 18.3V7.8C11.7 7 10.5 6.5 9 6.5Z" />
      <path {...p} d="M15 6.5C17 6.5 18.3 8 18.3 9.8C19.6 10.3 20.2 11.5 20.2 12.8C20.2 14.6 19 16 17.2 16.3C17 18 15.6 19.3 13.9 19.3C12.9 19.3 12.2 18.9 11.7 18.3V7.8C12.3 7 13.5 6.5 15 6.5Z" />
      <path {...p} d="M8.2 11.3C9.1 11.7 9.8 12.3 10.2 13.1" opacity="0.5" />
      <path {...p} d="M15.8 11.3C14.9 11.7 14.2 12.3 13.8 13.1" opacity="0.5" />
    </>
  );
};

const CalendarIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <rect {...p} x="4.5" y="6" width="15" height="13.5" rx="3" />
      <path {...p} d="M8 4.5V7.5" />
      <path {...p} d="M16 4.5V7.5" />
      <path {...p} d="M4.8 10H19.2" />
      <circle cx="9" cy="13.5" r="0.9" fill="currentColor" />
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor" opacity="0.6" />
      <circle cx="15" cy="13.5" r="0.9" fill="currentColor" opacity="0.35" />
    </>
  );
};

const ChantIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M12 5.2C14.4 5.2 16 7 16 9.4V11.6C16 14 14.4 15.8 12 15.8C9.6 15.8 8 14 8 11.6V9.4C8 7 9.6 5.2 12 5.2Z" />
      <path {...p} d="M6.5 11.5C6.5 14.6 8.8 17 12 17C15.2 17 17.5 14.6 17.5 11.5" />
      <path {...p} d="M12 17V20" />
    </>
  );
};

const ClockIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <circle {...p} cx="12" cy="12" r="7.5" />
      <path {...p} d="M12 8.5V12.2L14.8 14" />
    </>
  );
};

const CompassIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <circle {...p} cx="12" cy="12" r="7.5" />
      <path {...p} d="M14.7 9.3L13.1 13.1L9.3 14.7L10.9 10.9L14.7 9.3Z" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  );
};

const FlowerIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M12 10.6C10.9 9 10 7.7 10 6.6C10 5.5 10.9 4.7 12 4.7C13.1 4.7 14 5.5 14 6.6C14 7.7 13.1 9 12 10.6Z" />
      <path {...p} d="M13.4 12C15.4 11.5 16.9 11.2 17.8 11.8C18.8 12.4 19.1 13.6 18.5 14.5C17.9 15.4 16.7 15.7 15.7 15.1C14.8 14.5 14.1 13.2 13.4 12Z" />
      <path {...p} d="M10.6 12C9.9 13.2 9.2 14.5 8.3 15.1C7.3 15.7 6.1 15.4 5.5 14.5C4.9 13.6 5.2 12.4 6.2 11.8C7.1 11.2 8.6 11.5 10.6 12Z" />
      <path {...p} d="M12 13.2V19.5" />
      <path {...p} d="M9.5 19.5H14.5" opacity="0.45" />
    </>
  );
};

const HeartIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <path {...p} d="M12 19C10.2 17.1 6.5 14.3 5.2 11.8C4 9.5 5 6.8 7.5 6.3C9.2 6 10.5 6.9 12 8.4C13.5 6.9 14.8 6 16.5 6.3C19 6.8 20 9.5 18.8 11.8C17.5 14.3 13.8 17.1 12 19Z" />
  );
};

const JapaIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <circle {...p} cx="12" cy="12" r="5.8" strokeDasharray="1 2.2" />
      <circle cx="12" cy="6" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" opacity="0.55" />
    </>
  );
};

const KulIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <circle {...p} cx="12" cy="8" r="2.4" />
      <path {...p} d="M7 18.5C7.6 15.9 9.4 14.5 12 14.5C14.6 14.5 16.4 15.9 17 18.5" />
      <path {...p} d="M4.8 10.6C5.4 9.6 6.4 9 7.4 9" opacity="0.45" />
      <path {...p} d="M19.2 10.6C18.6 9.6 17.6 9 16.6 9" opacity="0.45" />
    </>
  );
};

const LandmarkIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M12 5L18.5 8H5.5L12 5Z" />
      <path {...p} d="M7 8.5V16" />
      <path {...p} d="M12 8.5V16" />
      <path {...p} d="M17 8.5V16" />
      <path {...p} d="M5 18.5H19" />
    </>
  );
};

const LocationIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M12 19.5C15.3 15.7 17 13.1 17 10.2C17 7.4 14.8 5.5 12 5.5C9.2 5.5 7 7.4 7 10.2C7 13.1 8.7 15.7 12 19.5Z" />
      <circle {...p} cx="12" cy="10.2" r="1.9" />
    </>
  );
};

const MandaliIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M6.5 16.5C5.5 15.7 4.8 14.5 4.8 13C4.8 10 7.2 7.8 10.2 7.8C12.8 7.8 14.8 9.3 15.4 11.6C18 11.8 19.8 13.4 19.8 15.8C19.8 18.2 18 19.8 15.4 20" />
      <path {...p} d="M8.5 17L6.8 20L9.8 18.9" />
    </>
  );
};

const MoonIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return <path {...p} d="M15.6 5.4C14.8 5.1 14 5 13.1 5C9.2 5 6 8.2 6 12.1C6 15.8 8.8 18.8 12.5 19.1C15.4 19.3 18 17.6 19 14.9C15.8 14.9 13.1 12.2 13.1 9C13.1 7.7 13.5 6.5 14.2 5.5L15.6 5.4Z" />;
};

const MountainIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M4.5 18.5L10.2 9.2L13.2 13.7L15 11.2L19.5 18.5" />
      <path {...p} d="M9.2 18.5H19.5" opacity="0.45" />
    </>
  );
};

const MusicIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M14 6.2V15.4" />
      <path {...p} d="M14 6.2L18 5V14.1" />
      <circle {...p} cx="10" cy="16.8" r="2.2" />
      <circle {...p} cx="18" cy="15.6" r="2.2" />
    </>
  );
};

const RadioIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <rect {...p} x="4.5" y="7.5" width="15" height="10.5" rx="3" />
      <path {...p} d="M8 7.5L10.5 5.5" />
      <circle {...p} cx="10" cy="12.8" r="2.3" />
      <path {...p} d="M14.5 11H17.2" />
      <path {...p} d="M14.5 13.5H17.2" opacity="0.55" />
    </>
  );
};

const ScrollIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M8 6.2H14.8C16.6 6.2 18 7.5 18 9.3V16.2C18 17.5 16.9 18.5 15.6 18.5H9.2C8 18.5 7 17.5 7 16.3C7 15.1 8 14.1 9.2 14.1H16.2" />
      <path {...p} d="M9.8 9.3H14" opacity="0.55" />
      <path {...p} d="M9.8 11.8H13.2" opacity="0.55" />
    </>
  );
};

const SettingsIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <circle {...p} cx="12" cy="12" r="2.2" />
      <path {...p} d="M12 5.2V3.8" />
      <path {...p} d="M12 20.2V18.8" />
      <path {...p} d="M18.8 12H20.2" />
      <path {...p} d="M3.8 12H5.2" />
      <path {...p} d="M16.8 7.2L17.8 6.2" />
      <path {...p} d="M6.2 17.8L7.2 16.8" />
      <path {...p} d="M16.8 16.8L17.8 17.8" />
      <path {...p} d="M6.2 6.2L7.2 7.2" />
    </>
  );
};

const ShieldIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return <path {...p} d="M12 4.8C13.8 6 15.9 6.7 18.2 6.9V11.3C18.2 15.3 15.8 18 12 19.8C8.2 18 5.8 15.3 5.8 11.3V6.9C8.1 6.7 10.2 6 12 4.8Z" />;
};

const SparklesIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M12 5.2L13.2 8.8L16.8 10L13.2 11.2L12 14.8L10.8 11.2L7.2 10L10.8 8.8L12 5.2Z" />
      <path {...p} d="M18.2 5.8L18.8 7.5L20.5 8.1L18.8 8.7L18.2 10.4L17.6 8.7L15.9 8.1L17.6 7.5L18.2 5.8Z" opacity="0.65" />
      <path {...p} d="M6 14.8L6.6 16.4L8.2 17L6.6 17.6L6 19.2L5.4 17.6L3.8 17L5.4 16.4L6 14.8Z" opacity="0.65" />
    </>
  );
};

const StarIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return <path {...p} d="M12 4.8L13.9 9L18.5 9.5L15.1 12.6L16.1 17.2L12 14.8L7.9 17.2L8.9 12.6L5.5 9.5L10.1 9L12 4.8Z" />;
};

const SunIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <circle {...p} cx="12" cy="12" r="3.3" />
      <path {...p} d="M12 4.6V6.2" />
      <path {...p} d="M12 17.8V19.4" />
      <path {...p} d="M19.4 12H17.8" />
      <path {...p} d="M6.2 12H4.6" />
      <path {...p} d="M17.1 6.9L16 8" />
      <path {...p} d="M8 16L6.9 17.1" />
      <path {...p} d="M17.1 17.1L16 16" />
      <path {...p} d="M8 8L6.9 6.9" />
    </>
  );
};

const SunriseIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M6 16C6 12.8 8.7 10.2 12 10.2C15.3 10.2 18 12.8 18 16" />
      <path {...p} d="M4.5 18.5H19.5" />
      <path {...p} d="M12 5V9" />
      <path {...p} d="M8.5 7L12 5L15.5 7" />
    </>
  );
};

const SunsetIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M6 14C6 10.8 8.7 8.2 12 8.2C15.3 8.2 18 10.8 18 14" />
      <path {...p} d="M4.5 18.5H19.5" />
      <path {...p} d="M12 11V7" />
      <path {...p} d="M8.5 9L12 11L15.5 9" />
    </>
  );
};

const TreeIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M12 5.2C14.9 5.2 17 7.2 17 9.8C17 11.5 16.1 12.8 14.7 13.5C14.8 15.8 13.6 17.3 12 17.8C10.4 17.3 9.2 15.8 9.3 13.5C7.9 12.8 7 11.5 7 9.8C7 7.2 9.1 5.2 12 5.2Z" />
      <path {...p} d="M12 17.8V20" />
      <path {...p} d="M10 20H14" opacity="0.45" />
    </>
  );
};

const WaterIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M6 10.5C7.3 12 8.7 12 10 10.5C11.3 9 12.7 9 14 10.5C15.3 12 16.7 12 18 10.5" />
      <path {...p} d="M4.5 14.3C6 15.8 7.8 15.8 9.3 14.3C10.8 12.8 12.6 12.8 14.1 14.3C15.6 15.8 17.4 15.8 18.9 14.3" opacity="0.8" />
      <path {...p} d="M7.5 18C8.8 19 10 19.2 12 19.2C14 19.2 15.2 19 16.5 18" opacity="0.5" />
    </>
  );
};

const WindIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M4.5 10C6.5 10 7.8 9.2 9 8C10.2 6.8 11.3 6.2 13 6.2C14.9 6.2 16.2 7.2 16.2 8.7C16.2 10.1 15.1 11 13.8 11" />
      <path {...p} d="M4.5 14.2C7 14.2 8.7 13.4 10.1 12C11.5 10.6 12.7 10.2 14.2 10.2C16.3 10.2 17.8 11.3 17.8 12.9C17.8 14.4 16.5 15.4 15 15.4" />
      <path {...p} d="M4.5 18C6.2 18 7.3 17.7 8.5 16.7" opacity="0.55" />
    </>
  );
};

const FlameIcon: SacredIconComponent = ({ strokeWidth }) => {
  const p = base(strokeWidth);
  return (
    <>
      <path {...p} d="M12.2 5.2C13.1 7.1 15.8 8.4 15.8 11.7C15.8 14.8 13.9 17.2 11.2 17.2C8.9 17.2 7 15.5 7 13.1C7 10.7 8.2 9.4 9.4 8C10.4 6.9 11.2 6.1 12.2 5.2Z" />
      <path {...p} d="M11.5 11.2C12.1 12 12.8 12.7 12.8 14C12.8 15.3 11.9 16.2 10.8 16.2C9.8 16.2 9 15.4 9 14.4C9 13.4 9.6 12.8 10.2 12.2C10.7 11.7 11 11.4 11.5 11.2Z" opacity="0.55" />
    </>
  );
};

const ICONS: Record<SacredIconName, SacredIconComponent> = {
  activity: ActivityIcon,
  alert: AlertIcon,
  bell: BellIcon,
  book: BookIcon,
  brain: BrainIcon,
  calendar: CalendarIcon,
  chant: ChantIcon,
  clock: ClockIcon,
  compass: CompassIcon,
  flower: FlowerIcon,
  guidance: CompassIcon,
  heart: HeartIcon,
  japa: JapaIcon,
  kul: KulIcon,
  landmark: LandmarkIcon,
  location: LocationIcon,
  mandali: MandaliIcon,
  moon: MoonIcon,
  mountain: MountainIcon,
  music: MusicIcon,
  radio: RadioIcon,
  scroll: ScrollIcon,
  settings: SettingsIcon,
  shield: ShieldIcon,
  sparkles: SparklesIcon,
  star: StarIcon,
  sun: SunIcon,
  sunrise: SunriseIcon,
  sunset: SunsetIcon,
  tree: TreeIcon,
  water: WaterIcon,
  wind: WindIcon,
  flame: FlameIcon,
};

export function getSacredIcon(name: SacredIconName): SacredIconComponent {
  return ICONS[name];
}

export default function SacredIcon({
  name,
  size = 18,
  className,
  style,
  strokeWidth = 1.8,
  'aria-hidden': ariaHidden = true,
}: IconProps & { name: SacredIconName }) {
  const Icon = ICONS[name];
  return (
    <SvgShell size={size} className={className} style={style} ariaHidden={ariaHidden}>
      <Icon strokeWidth={strokeWidth} />
    </SvgShell>
  );
}
