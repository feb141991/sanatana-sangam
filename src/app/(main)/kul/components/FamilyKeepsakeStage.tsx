'use client';

import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import { FamilyMember } from '../types';

export function FamilyKeepsakeStage({ member }: { member: FamilyMember }) {
  const initials = getInitials(member.name || '?');
  
  // Traditional Sacred Colors
  const terracotta = 'rgba(195, 82, 45,'; // Sindoor/Terracotta
  const sandalwood = 'rgba(240, 220, 180,'; // Chandan/Sandalwood
  const ash        = 'rgba(120, 115, 110,'; // Bhasma/Ash
  
  const medallionRing = member.is_alive
    ? `linear-gradient(145deg, ${terracotta} 0.22), ${sandalwood} 0.26))`
    : `linear-gradient(145deg, ${ash} 0.16), rgba(125, 138, 139, 0.22))`;
    
  const medallionFill = member.is_alive
    ? 'linear-gradient(145deg, #fdfaf5, #f5f0e5)'
    : 'linear-gradient(145deg, #f2eee9, #e6ebeb)';
    
  const statusTone = member.is_alive ? 'var(--brand-primary-strong)' : 'var(--brand-earth)';

  return (
    <div className="clay-portrait-stage relative group">
      {/* Decorative Aura / Halo */}
      <div className={`absolute inset-0 rounded-full blur-[12px] opacity-20 group-hover:opacity-40 transition-opacity ${member.is_alive ? 'bg-orange-200' : 'bg-slate-200'}`} />
      
      <div className="clay-memory-orbit" />
      <div className="clay-memory-medallion" style={{ background: medallionRing }}>
        <div className="clay-memory-medallion-inner relative overflow-hidden flex items-center justify-center" style={{ background: medallionFill }}>
          {/* Subtle Clay Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
          
          {member.photo_url ? (
            <Image
              src={member.photo_url}
              alt={`${member.name} keepsake`}
              fill
              sizes="160px"
              className="object-cover rounded-[1.2rem] filter sepia-[0.1] contrast-[1.05]"
            />
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-display text-lg font-bold tracking-[0.16em]" style={{ color: statusTone }}>
                {initials}
              </span>
              {/* Sacred Symbol placeholder */}
              <span className="text-[10px] opacity-40 mt-1">
                {member.is_alive ? '🕉️' : '🪷'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Ritual Seal - Bottom Right overlay */}
      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full shadow-lg flex items-center justify-center text-[10px] border border-white/20"
        style={{ 
          background: member.is_alive ? 'var(--brand-primary)' : 'var(--brand-earth)',
          color: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
        }}>
        {member.is_alive ? '☀' : '🪔'}
      </div>
    </div>
  );
}
