'use client';

import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { StoryCharacterAgeState } from '@/lib/story/kanu-story';

interface KanuGuideAvatarProps {
  state: StoryCharacterAgeState;
  size?: 'sm' | 'md' | 'lg';
  emphasis?: 'lead' | 'support';
}

interface AvatarProfile {
  skinTone: string;
  hairColor: string;
  robeCurve: string;
  robeTrim: string;
  faceCx: number;
  faceCy: number;
  faceRx: number;
  faceRy: number;
  eyeY: number;
  eyeScale: number;
  eyeSpacing: number;
  browTilt: number;
  mouthCurve: number;
  shoulderWidth: number;
  shoulderTop: number;
  glowScale: number;
  symbol: 'feather' | 'crown' | 'headband';
  symbolTilt: number;
  jawSoftness: number;
}

function getAvatarProfile(state: StoryCharacterAgeState): AvatarProfile {
  const youthful = state.characterId === 'kanu' && state.arc !== 'kurukshetra';
  const matureKanu = state.characterId === 'kanu' && state.arc === 'kurukshetra';
  const divineKrishna = state.characterId === 'krishna';
  const warriorArjuna = state.characterId === 'arjuna';

  if (warriorArjuna) {
    return {
      skinTone: '#d9af87',
      hairColor: '#2a2236',
      robeCurve: 'M58 214 C70 182, 86 166, 110 166 C134 166, 150 182, 162 214 L146 236 C136 218, 124 206, 110 206 C96 206, 84 218, 74 236 Z',
      robeTrim: '#9d7c53',
      faceCx: 110,
      faceCy: 108,
      faceRx: 36,
      faceRy: 40,
      eyeY: 114,
      eyeScale: 0.88,
      eyeSpacing: 29,
      browTilt: 2.5,
      mouthCurve: 2,
      shoulderWidth: 56,
      shoulderTop: 164,
      glowScale: 0.86,
      symbol: 'headband',
      symbolTilt: -2,
      jawSoftness: 8,
    };
  }

  if (divineKrishna) {
    return {
      skinTone: '#e8ba93',
      hairColor: '#1e204f',
      robeCurve: 'M56 210 C62 172, 80 152, 110 152 C140 152, 158 172, 164 210 L148 236 C136 214, 124 202, 110 202 C96 202, 84 214, 72 236 Z',
      robeTrim: '#f6d07c',
      faceCx: 110,
      faceCy: 108,
      faceRx: 38,
      faceRy: 42,
      eyeY: 112,
      eyeScale: 0.94,
      eyeSpacing: 31,
      browTilt: -1,
      mouthCurve: 5,
      shoulderWidth: 58,
      shoulderTop: 154,
      glowScale: 1.04,
      symbol: 'crown',
      symbolTilt: 1,
      jawSoftness: 10,
    };
  }

  if (matureKanu) {
    return {
      skinTone: '#efc6a1',
      hairColor: '#1e224a',
      robeCurve: 'M56 212 C64 174, 82 156, 110 156 C138 156, 156 174, 164 212 L146 236 C136 216, 126 206, 110 206 C94 206, 84 216, 74 236 Z',
      robeTrim: '#f8d68d',
      faceCx: 110,
      faceCy: 109,
      faceRx: 36,
      faceRy: 41,
      eyeY: 113,
      eyeScale: 0.92,
      eyeSpacing: 29,
      browTilt: -1.5,
      mouthCurve: 4,
      shoulderWidth: 60,
      shoulderTop: 158,
      glowScale: 1.06,
      symbol: 'feather',
      symbolTilt: -5,
      jawSoftness: 10,
    };
  }

  if (youthful && state.arc === 'mathura') {
    return {
      skinTone: '#f0c49d',
      hairColor: '#202451',
      robeCurve: 'M58 210 C64 176, 82 158, 110 158 C138 158, 156 176, 162 210 L146 232 C134 214, 124 204, 110 204 C96 204, 86 214, 74 232 Z',
      robeTrim: '#efcf89',
      faceCx: 110,
      faceCy: 110,
      faceRx: 38,
      faceRy: 42,
      eyeY: 114,
      eyeScale: 0.96,
      eyeSpacing: 31,
      browTilt: 0,
      mouthCurve: 5,
      shoulderWidth: 58,
      shoulderTop: 160,
      glowScale: 1,
      symbol: 'feather',
      symbolTilt: -7,
      jawSoftness: 12,
    };
  }

  return {
    skinTone: '#f3c9a8',
    hairColor: '#1f2450',
    robeCurve: 'M58 208 C64 172, 78 154, 110 154 C142 154, 156 172, 162 208 L146 230 C136 210, 126 198, 110 198 C94 198, 84 210, 74 230 Z',
    robeTrim: '#f9df9f',
    faceCx: 110,
    faceCy: 110,
    faceRx: 41,
    faceRy: 42,
    eyeY: 113,
    eyeScale: 1,
    eyeSpacing: 30,
    browTilt: -2,
    mouthCurve: 6,
    shoulderWidth: 54,
    shoulderTop: 154,
    glowScale: 1,
    symbol: 'feather',
    symbolTilt: -10,
    jawSoftness: 13,
  };
}

function buildMouthPath(profile: AvatarProfile) {
  return `M${110 - 11} 137 C${104} ${137 + profile.mouthCurve}, ${116} ${137 + profile.mouthCurve}, ${121} 137`;
}

function buildBrowPath(left: boolean, profile: AvatarProfile) {
  const offset = profile.eyeSpacing;
  const x1 = left ? 110 - offset - 11 : 110 + offset - 2;
  const x2 = left ? 110 - offset + 7 : 110 + offset + 16;
  const y1 = 97 + profile.browTilt;
  const y2 = 96 - profile.browTilt;
  return `M${x1} ${y1} C${x1 + 6} ${y1 - 5}, ${x2 - 5} ${y2 - 5}, ${x2} ${y2}`;
}

function renderSymbol(profile: AvatarProfile, state: StoryCharacterAgeState) {
  if (profile.symbol === 'headband') {
    return (
      <g transform={`rotate(${profile.symbolTilt} 110 58)`}>
        <path
          d="M70 58 C82 48, 98 44, 110 44 C122 44, 138 48, 150 58"
          stroke="#d9ba7d"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M88 54 L100 64"
          stroke="#5f3b2b"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (profile.symbol === 'crown') {
    return (
      <g transform={`rotate(${profile.symbolTilt} 110 40)`}>
        <path
          d="M78 55 L88 28 L104 47 L118 22 L132 46 L145 29 L154 55 Z"
          fill="#f0c25f"
          stroke="#f8df9a"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <circle cx="118" cy="30" r="6" fill="#2ab7b0" />
      </g>
    );
  }

  return (
    <g transform={`rotate(${profile.symbolTilt} 150 36)`}>
      <path
        d="M124 34 C134 14, 164 10, 170 34 C176 58, 146 76, 130 60 C116 48, 116 44, 124 34 Z"
        fill="#1b8d7e"
        stroke="#ffd36b"
        strokeWidth="4"
      />
      <path
        d="M138 26 C151 18, 162 26, 164 38 C166 50, 153 58, 141 52 C132 48, 130 32, 138 26 Z"
        fill={state.characterId === 'kanu' ? '#2f5de1' : '#243d8c'}
        opacity="0.94"
      />
      <circle cx="150" cy="39" r="6" fill="#ffd86b" />
    </g>
  );
}

export function KanuGuideAvatar({
  state,
  size = 'lg',
  emphasis = 'support',
}: KanuGuideAvatarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [primary, accent, glow] = state.costumePalette;
  const profile = getAvatarProfile(state);

  const style = {
    '--kanu-primary': primary,
    '--kanu-accent': accent,
    '--kanu-glow': glow,
  } as CSSProperties;

  const floatY = emphasis === 'lead' ? 6 : 3;
  const blinkDelay = state.characterId === 'arjuna' ? 0.9 : state.characterId === 'krishna' ? 0.4 : 0;

  return (
    <motion.div
      className={`kanu-avatar-shell kanu-avatar-${size} ${emphasis === 'lead' ? 'kanu-avatar-lead' : ''}`}
      style={style}
      animate={
        prefersReducedMotion
          ? undefined
          : { y: [0, -floatY, 0], rotate: [0, state.characterId === 'arjuna' ? -0.3 : 0.5, 0] }
      }
      transition={{ duration: emphasis === 'lead' ? 4.8 : 5.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.svg
        viewBox="0 0 220 280"
        className="kanu-avatar-svg"
        role="img"
        aria-label={`${state.displayName} portrait`}
      >
        <defs>
          <radialGradient id={`halo-${state.id}`} cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.96)" />
            <stop offset="55%" stopColor="var(--kanu-glow)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id={`robe-${state.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--kanu-accent)" />
            <stop offset="100%" stopColor="var(--kanu-primary)" />
          </linearGradient>
        </defs>

        <motion.ellipse
          cx="110"
          cy="138"
          rx={86 * profile.glowScale}
          ry={104 * profile.glowScale}
          fill={`url(#halo-${state.id})`}
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.05, 1] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <ellipse cx="110" cy="260" rx="52" ry="10" fill="rgba(28, 33, 68, 0.16)" />

        <motion.g
          animate={prefersReducedMotion ? undefined : { rotate: [0, 2.5, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '150px 40px' }}
        >
          {renderSymbol(profile, state)}
        </motion.g>

        <path
          d={`M${110 - profile.shoulderWidth} ${profile.eyeY + 7} C${72} 62, 88 36, 110 36 C132 36, 150 60, 148 ${profile.eyeY + 8} L148 144 L72 144 Z`}
          fill={profile.hairColor}
        />

        <ellipse
          cx={profile.faceCx}
          cy={profile.faceCy}
          rx={profile.faceRx}
          ry={profile.faceRy}
          fill={profile.skinTone}
        />

        <path
          d={buildBrowPath(true, profile)}
          stroke={profile.hairColor}
          strokeWidth={state.characterId === 'kanu' ? 6 : 6.5}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={buildBrowPath(false, profile)}
          stroke={profile.hairColor}
          strokeWidth={state.characterId === 'kanu' ? 6 : 6.5}
          strokeLinecap="round"
          fill="none"
        />

        <motion.g
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  scaleY: [1, 1, 0.16, 1, 1],
                  y: [0, 0, 2, 0, 0],
                }
          }
          transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: blinkDelay }}
          style={{ transformOrigin: `110px ${profile.eyeY}px` }}
        >
          <ellipse cx={110 - profile.eyeSpacing} cy={profile.eyeY} rx={6.5 * profile.eyeScale} ry={5.2 * profile.eyeScale} fill="#192046" />
          <ellipse cx={110 + profile.eyeSpacing} cy={profile.eyeY} rx={6.5 * profile.eyeScale} ry={5.2 * profile.eyeScale} fill="#192046" />
          <circle cx={110 - profile.eyeSpacing + 1.6} cy={profile.eyeY - 1.2} r="1.1" fill="white" opacity="0.7" />
          <circle cx={110 + profile.eyeSpacing + 1.6} cy={profile.eyeY - 1.2} r="1.1" fill="white" opacity="0.7" />
        </motion.g>

        <path
          d={`M110 ${profile.eyeY + 6} C110 ${profile.eyeY + 13}, ${107} ${profile.eyeY + 17}, ${107} ${profile.eyeY + 19} C109 ${profile.eyeY + 21}, 114 ${profile.eyeY + 21}, 116 ${profile.eyeY + 19}`}
          stroke="#dfaf89"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        <motion.path
          d={buildMouthPath(profile)}
          stroke={state.characterId === 'arjuna' ? '#905844' : '#a05e48'}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          animate={prefersReducedMotion ? undefined : { d: [buildMouthPath(profile), buildMouthPath({ ...profile, mouthCurve: profile.mouthCurve + 1 }), buildMouthPath(profile)] }}
          transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <circle cx={110 - profile.faceRx + 2} cy={profile.faceCy + 4} r="8" fill={profile.skinTone} />
        <circle cx={110 + profile.faceRx - 2} cy={profile.faceCy + 4} r="8" fill={profile.skinTone} />

        <path d={profile.robeCurve} fill={`url(#robe-${state.id})`} />
        <path
          d={`M${110 - 16} 154 C${98} 176, ${122} 176, ${126} 154`}
          stroke="#fdf5e4"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M${110 - profile.shoulderWidth + 8} ${profile.shoulderTop + 12} C${110 - profile.shoulderWidth + 14} ${profile.shoulderTop + 6}, ${110 - profile.shoulderWidth + 18} ${profile.shoulderTop + 4}, ${110 - profile.shoulderWidth + 24} ${profile.shoulderTop + 4}`}
          stroke="#fdf5e4"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M${110 + profile.shoulderWidth - 28} ${profile.shoulderTop + 4} C${110 + profile.shoulderWidth - 22} ${profile.shoulderTop + 4}, ${110 + profile.shoulderWidth - 18} ${profile.shoulderTop + 6}, ${110 + profile.shoulderWidth - 12} ${profile.shoulderTop + 12}`}
          stroke="#fdf5e4"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M76 176 C100 180, 126 172, 149 160`}
          stroke={profile.robeTrim}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          opacity="0.92"
        />
      </motion.svg>
    </motion.div>
  );
}
