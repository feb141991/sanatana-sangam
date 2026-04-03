import type { CSSProperties } from 'react';
import type { StoryCharacterAgeState } from '@/lib/story/kanu-story';

interface KanuGuideAvatarProps {
  state: StoryCharacterAgeState;
  size?: 'sm' | 'md' | 'lg';
}

export function KanuGuideAvatar({ state, size = 'lg' }: KanuGuideAvatarProps) {
  const [primary, accent, glow] = state.costumePalette;
  const style = {
    '--kanu-primary': primary,
    '--kanu-accent': accent,
    '--kanu-glow': glow,
  } as CSSProperties;

  return (
    <div className={`kanu-avatar-shell kanu-avatar-${size}`} style={style}>
      <svg viewBox="0 0 220 280" className="kanu-avatar-svg" role="img" aria-label={`${state.displayName} portrait`}>
        <defs>
          <radialGradient id={`halo-${state.id}`} cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.94)" />
            <stop offset="60%" stopColor="var(--kanu-glow)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id={`robe-${state.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--kanu-accent)" />
            <stop offset="100%" stopColor="var(--kanu-primary)" />
          </linearGradient>
        </defs>

        <ellipse cx="110" cy="138" rx="86" ry="104" fill={`url(#halo-${state.id})`} />
        <ellipse cx="110" cy="260" rx="52" ry="10" fill="rgba(28, 33, 68, 0.16)" />

        <path
          d="M124 34 C134 14, 164 10, 170 34 C176 58, 146 76, 130 60 C116 48, 116 44, 124 34 Z"
          fill="#1b8d7e"
          stroke="#ffd36b"
          strokeWidth="4"
        />
        <path
          d="M138 26 C151 18, 162 26, 164 38 C166 50, 153 58, 141 52 C132 48, 130 32, 138 26 Z"
          fill="#2f5de1"
          opacity="0.92"
        />
        <circle cx="150" cy="39" r="6" fill="#ffd86b" />

        <path
          d="M72 114 C66 62, 86 38, 110 38 C134 38, 156 60, 148 120 L148 144 L72 144 Z"
          fill="#1e2451"
        />
        <circle cx="110" cy="110" r="42" fill="#f3c9a8" />
        <path
          d="M81 98 C92 86, 128 86, 139 98"
          stroke="#1e2451"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="96" cy="113" r="4.5" fill="#192046" />
        <circle cx="124" cy="113" r="4.5" fill="#192046" />
        <path
          d="M102 136 C108 142, 116 142, 122 136"
          stroke="#a05e48"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M110 118 C110 126, 107 129, 107 131 C109 133, 114 133, 116 131"
          stroke="#e3b089"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="70" cy="114" r="8" fill="#f3c9a8" />
        <circle cx="150" cy="114" r="8" fill="#f3c9a8" />

        <path
          d="M58 208 C64 172, 78 154, 110 154 C142 154, 156 172, 162 208 L146 230 C136 210, 126 198, 110 198 C94 198, 84 210, 74 230 Z"
          fill={`url(#robe-${state.id})`}
        />
        <path
          d="M94 154 C98 176, 122 176, 126 154"
          stroke="#fdf5e4"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M66 174 C72 168, 76 166, 82 166"
          stroke="#fdf5e4"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M138 166 C144 166, 148 168, 154 174"
          stroke="#fdf5e4"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M75 176 C103 178, 126 170, 149 160"
          stroke="#c48533"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          opacity="0.86"
        />
      </svg>
    </div>
  );
}
