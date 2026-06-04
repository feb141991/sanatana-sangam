'use client';

import Link from 'next/link';
import { SadhanaSection } from './sections/SadhanaSection';
import { CommunitySection } from './sections/CommunitySection';
import { DiscoverySection } from './sections/DiscoverySection';
import type { DharmVeer } from '@/lib/dharm-veer';

interface BelowFoldSectionsProps {
  userId: string;
  userName: string;
  tradition: string | null;
  sampradaya: string | null;
  isPro: boolean;
  japaAlreadyDoneToday: boolean;
  nityaDoneToday: boolean;
  activeSankalpa: { id: string; text: string; start_date: string; end_date: string; tradition: string } | null;
  sankalpaCheckedToday: boolean;
  onSankalpaCheckin: () => Promise<void>;
  onSetSankalpa: () => void;
  onSankalpaComplete: () => void;
  isDark: boolean;
  readToday: boolean;
  dailyDharmaStackState: {
    japaBeads: number;
    japaRounds: number;
    quizDone: boolean;
    dharmVeerDone: boolean;
    stotramDone: boolean;
    kathaDone: boolean;
    pathshalaProgress: number;
  };
  dharmVeer: DharmVeer;
  appLanguage: string;
  onOpenMoodJourney: (moodKey: string) => void;
  onDismissMood: () => void;
  backendMoodState: {
    hasCompletedToday: boolean;
    hasDismissedToday: boolean;
    isLoaded: boolean;
    lastCompletedMood: string | null;
  };
  quiz: any;
  quizAnswered: number | null;
  quizStreak: number;
  onOpenQuiz: () => void;
  sevaScore: number;
  onInviteClick: () => void;
  pathshalaProgress: number;
  pathshalaDoneToday: boolean;
  pathshalaLabel: string;
  pathshalaHref: string;
  isAdmin: boolean;
}

export default function BelowFoldSections({
  userId,
  userName,
  tradition,
  sampradaya,
  isPro,
  japaAlreadyDoneToday,
  nityaDoneToday,
  activeSankalpa,
  sankalpaCheckedToday,
  onSankalpaCheckin,
  onSetSankalpa,
  onSankalpaComplete,
  isDark,
  readToday,
  dailyDharmaStackState,
  dharmVeer,
  appLanguage,
  onOpenMoodJourney,
  onDismissMood,
  backendMoodState,
  quiz,
  quizAnswered,
  quizStreak,
  onOpenQuiz,
  sevaScore,
  onInviteClick,
  pathshalaProgress,
  pathshalaDoneToday,
  pathshalaLabel,
  pathshalaHref,
  isAdmin,
}: BelowFoldSectionsProps) {
  return (
    <>
      {/* ── Section 3: Sadhana Section ── */}
      <SadhanaSection
        userId={userId}
        userName={userName}
        tradition={tradition}
        sampradaya={sampradaya}
        isPro={isPro}
        japaAlreadyDoneToday={japaAlreadyDoneToday}
        nityaDoneToday={nityaDoneToday}
        activeSankalpa={activeSankalpa}
        sankalpaCheckedToday={sankalpaCheckedToday}
        onSankalpaCheckin={onSankalpaCheckin}
        onSetSankalpa={onSetSankalpa}
        onSankalpaComplete={onSankalpaComplete}
        isDark={isDark}
        readToday={readToday}
        dailyDharmaStackState={dailyDharmaStackState}
        dharmVeer={dharmVeer}
        appLanguage={appLanguage}
        onOpenMoodJourney={onOpenMoodJourney}
        onDismissMood={onDismissMood}
        backendMoodState={backendMoodState}
        quiz={quiz}
        quizAnswered={quizAnswered}
        quizStreak={quizStreak}
        onOpenQuiz={onOpenQuiz}
      />

      {/* ── Section 4: Community Section ── */}
      <CommunitySection
        userId={userId}
        userName={userName}
        tradition={tradition}
        isPro={isPro}
        sevaScore={sevaScore}
        isDark={isDark}
        onInviteClick={onInviteClick}
      />

      {/* ── Section 5: Discovery Section ── */}
      <DiscoverySection
        tradition={tradition}
        isDark={isDark}
        isPro={isPro}
        pathshalaProgress={pathshalaProgress}
        pathshalaDoneToday={pathshalaDoneToday}
        pathshalaLabel={pathshalaLabel}
        pathshalaHref={pathshalaHref}
        isAdmin={isAdmin}
      />

      {/* ── Seva Card — always at the bottom ── */}
      <div className="px-4 pb-2">
        <Link href="/seva" className="divine-seva-card motion-lift block no-underline">
          <span className="divine-card-motif divine-card-motif-large" aria-hidden="true" />
          <span>
            <span className="divine-section-title">Donate / Seva</span>
            <span className="divine-feature-copy mt-1 block">Support temples, cow seva, annadaan and more.</span>
          </span>
          <span className="divine-seva-cta">Donate Now</span>
        </Link>
      </div>
    </>
  );
}
