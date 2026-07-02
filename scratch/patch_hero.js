const fs = require('fs');
let code = fs.readFileSync('src/app/(main)/home/sections/HeroSection.tsx', 'utf-8');

const openingStart = "function getTraditionSadhanaOpening(tradition: string | null): string {";
const openingEnd = "}\n\n// ── Time-aware greeting helper";

const targetOpening = code.substring(code.indexOf(openingStart), code.indexOf(openingEnd) + 1);

const replacementOpening = `function getTraditionJapaDetails(tradition: string | null) {
  switch (tradition) {
    case 'sikh': return { label: 'Naam Simran', detail: '108 jaaps · +5 seva' };
    case 'buddhist': return { label: 'Mantra Mala', detail: '108 recitations · +5 seva' };
    case 'jain': return { label: 'Navkar Mala', detail: '108 jaaps · +5 seva' };
    case 'hindu':
    default: return { label: 'Japa Mala', detail: '108 names · +5 seva' };
  }
}

function getDailySadhanaCta({
  tradition,
  completedPracticesCount,
  nextPracticeObj,
  meta,
}: {
  tradition: string | null;
  completedPracticesCount: number;
  nextPracticeObj: any;
  meta: any;
}): DailySadhanaCta {
  if (!nextPracticeObj) {
    return {
      id: 'complete',
      title: "Today's Sadhana Complete",
      subtitle: \`Your \${meta.shortLabel || tradition || 'Dharma'} rhythm is steady today · +seva earned\`,
      buttonLabel: "Today's Recap",
      href: '/my-progress',
      ariaLabel: "View today's sadhana progress",
      icon: '✨',
    };
  }

  if (completedPracticesCount === 0) {
    return {
      id: nextPracticeObj.id as any,
      title: "Begin Today's Sadhana",
      subtitle: \`Start with \${nextPracticeObj.label} · \${5 - completedPracticesCount} practices today\`,
      buttonLabel: 'Begin',
      href: nextPracticeObj.href,
      ariaLabel: \`Begin today's sadhana with \${nextPracticeObj.label}\`,
      icon: nextPracticeObj.icon,
    };
  }

  return {
    id: nextPracticeObj.id as any,
    title: "Continue Today's Sadhana",
    subtitle: \`Next: \${nextPracticeObj.label} · \${nextPracticeObj.detail}\`,
    buttonLabel: 'Continue',
    href: nextPracticeObj.href,
    ariaLabel: \`Continue with \${nextPracticeObj.label}\`,
    icon: nextPracticeObj.icon,
  };
}`;

code = code.replace(targetOpening, replacementOpening);

const ctaStart = "const dailySadhanaCta: DailySadhanaCta = (() => {";
const ctaEnd = "})();\n\n  function handleDailySadhanaCta() {";

const targetCta = code.substring(code.indexOf(ctaStart), code.indexOf(ctaEnd) + 7);

const replacementCta = `const japaDetails = getTraditionJapaDetails(tradition);
  const practices = [
    { id: 'japa', done: japaAlreadyDoneToday, label: japaDetails.label, detail: japaDetails.detail, icon: '📿', href: '/japa' },
    { id: 'nitya', done: nityaDoneToday, label: meta.nityaKarmaTitle, detail: 'morning rhythm', icon: '🌅', href: '/nitya-karma' },
    { id: 'pathshala', done: pathshalaDoneToday, label: meta.pathshalaVocabulary, detail: sacredTextMeta.label, icon: sacredTextMeta.icon || '📖', href: '/pathshala' },
    { id: 'quiz', done: dailyDharmaStackState.quizDone, label: 'Daily Quiz', detail: 'test your dharmic memory', icon: '🧠', href: '/quiz' },
    { id: 'dharmveer', done: dailyDharmaStackState.dharmVeerDone, label: dharmVeer.name || 'Dharm Veer', detail: 'remember a life of courage', icon: '⚔️', href: dharmVeer.id ? \`/dharm-veer/\${dharmVeer.id}\` : '/dharm-veer' }
  ];

  const completedPracticesCount = practices.filter(p => p.done).length;
  const nextPracticeObj = practices.find(p => !p.done);

  const dailySadhanaCta = getDailySadhanaCta({
    tradition,
    completedPracticesCount,
    nextPracticeObj,
    meta,
  });`;

code = code.replace(targetCta, replacementCta);

fs.writeFileSync('src/app/(main)/home/sections/HeroSection.tsx', code, 'utf-8');
console.log('Patched HeroSection.tsx');
