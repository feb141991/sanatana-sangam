'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronLeft } from 'lucide-react';

import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import { useKulMutations, useKulQuery } from '@/hooks/useKul';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// Modular Components
import { KulHub } from './components/KulHub';
import { KulMembers } from './components/KulMembers';
import { KulTasks } from './components/KulTasks';
import { KulSabha } from './components/KulSabha';
import { KulVansh } from './components/KulVansh';
import { KulEvents } from './components/KulEvents';
import { KulSanskara } from './components/KulSanskara';
import { NoKulPrompt } from './components/NoKulPrompt';
import { KulOnboarding } from './components/KulOnboarding';

// Dynamic Sheets
import { KulInviteSheet } from './components/KulInviteSheet';
import { KulTaskForm } from './components/KulTaskForm';
import { KulVanshForm } from './components/KulVanshForm';
import { KulEventForm } from './components/KulEventForm';
import { KulFamilyProfileSheet } from './components/KulFamilyProfileSheet';

// Types & Utils
import { KulSummary, MemberRow, TaskRow, MessageRow, FamilyMember, KulEvent, KulView } from './types';

interface Props {
  userId: string;
  userName: string;
  userProfile: any;
  kul: KulSummary | null;
  members: MemberRow[];
  tasks: TaskRow[];
  messages: MessageRow[];
  familyMembers: FamilyMember[];
  kulEvents: KulEvent[];
  myRole: 'guardian' | 'sadhak';
  view?: KulView;
}

export default function KulClient({
  userId,
  userName,
  userProfile,
  kul: initialKul,
  members: initialMembers,
  tasks: initialTasks,
  messages: initialMessages,
  familyMembers: initialFamilyMembers,
  kulEvents: initialEvents,
  myRole: initialRole,
  view: initialView = 'hub',
}: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<KulView>(initialView);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Sheet States
  const [showInvite, setShowInvite] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showVanshForm, setShowVanshForm] = useState(false);
  const [editMember, setEditMember] = useState<FamilyMember | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);

  // Queries & Mutations
  const { data } = useKulQuery(userId, {
    userId,
    userName,
    userProfile,
    kul: initialKul,
    members: initialMembers,
    tasks: initialTasks,
    messages: initialMessages,
    familyMembers: initialFamilyMembers,
    kulEvents: initialEvents,
    myRole: initialRole,
  });

  const kulMutations = useKulMutations(userId);

  // Onboarding Logic
  useEffect(() => {
    if (data?.kul && typeof window !== 'undefined') {
      const seen = window.localStorage.getItem(`kul-onboarding-seen-${data.kul.id}`);
      if (!seen) {
        setShowOnboarding(true);
      }
    }
  }, [data?.kul]);

  const closeOnboarding = () => {
    if (data?.kul) {
      window.localStorage.setItem(`kul-onboarding-seen-${data.kul.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateKul = async (name: string, emoji: string) => {
    await kulMutations.createKul.mutateAsync({ name, emoji });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleJoinKul = async (code: string) => {
    await kulMutations.joinKul.mutateAsync(code);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleSaveTask = async (task: any) => {
    if (!data?.kul) return;
    await kulMutations.assignTask.mutateAsync({
      kulId: data.kul.id,
      ...task,
      taskType: task.task_type,
      assignTo: task.assigned_to,
    });
    setShowTaskForm(false);
    toast.success('Task assigned!');
  };

  const handleSaveVansh = async (memberData: any) => {
    if (!data?.kul) return;
    try {
      await kulMutations.saveFamilyMember.mutateAsync({
        kulId: data.kul.id,
        memberId: memberData.id,
        ...memberData,
      });
      setShowVanshForm(false);
      setEditMember(null);
      toast.success(memberData.id ? 'Vansh updated! 🙏' : 'Added to Vansh! 🙏');
    } catch (err: any) {
      toast.error('Failed to save lineage: ' + err.message);
    }
  };

  const handleSaveEvent = async (eventData: any) => {
    if (!data?.kul) return;
    await kulMutations.saveEvent.mutateAsync({
      kulId: data.kul.id,
      ...eventData,
      event_type: 'custom',
    });
    setShowEventForm(false);
  };

  // ── Render Views ───────────────────────────────────────────────────────────

  if (!data || !data.kul) {
    return (
      <NoKulPrompt
        userId={userId}
        userName={userName}
        onCreate={handleCreateKul}
        onJoin={handleJoinKul}
      />
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'members':
        return (
          <KulMembers
            members={data.members}
            myRole={data.myRole}
            onInvite={() => setShowInvite(true)}
            onMemberClick={setSelectedMember}
          />
        );
      case 'tasks':
        return (
          <KulTasks
            tasks={data.tasks}
            members={data.members}
            myRole={data.myRole}
            userId={userId}
            onComplete={(id) => kulMutations.completeTask.mutate(id)}
            onAdd={() => setShowTaskForm(true)}
            onDelete={(id) => kulMutations.deleteTask.mutate(id)}
          />
        );
      case 'sabha':
        return (
          <KulSabha
            messages={data.messages}
            members={data.members}
            userId={userId}
            onSendMessage={(content) => kulMutations.sendMessage.mutate({ kulId: data?.kul?.id ?? '', content })}
          />
        );
      case 'vansh':
        return (
          <KulVansh
            members={data.members}
            familyMembers={data.familyMembers}
            canManageVansh={data.myRole === 'guardian'}
            openMemberDetails={() => {}} 
            openEdit={(m) => { setEditMember(m); setShowVanshForm(true); }}
            deleteMember={(id, name) => {
              if (confirm(`Remove ${name} from Vansh?`)) {
                kulMutations.deleteFamilyMember.mutate(id);
              }
            }}
            showAdd={showVanshForm}
            setShowAdd={setShowVanshForm}
          />
        );
      case 'events':
        return (
          <KulEvents
            events={data.kulEvents}
            members={data.members}
            myRole={data.myRole}
            onAdd={() => setShowEventForm(true)}
            onDelete={(id) => kulMutations.deleteEvent.mutate(id)}
          />
        );
      case 'sanskara':
        return <KulSanskara />;
      default:
        return (
          <KulHub
            kul={data.kul!}
            members={data.members}
            tasks={data.tasks}
            messages={data.messages}
            familyMembers={data.familyMembers}
            kulEvents={data.kulEvents}
            myRole={data.myRole}
            editingName={false}
            newKulName={data.kul!.name}
            setNewKulName={() => {}}
            setEditingName={() => {}}
            saveKulName={() => {}}
            onUpdateKul={(updates) => kulMutations.updateKul.mutate({ kulId: data.kul!.id, updates })}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      <ConfettiOverlay show={showConfetti} />
      {showOnboarding && <KulOnboarding onComplete={closeOnboarding} />}
      
      {/* Dynamic Sheets */}
      {showInvite && <KulInviteSheet inviteCode={data?.kul?.invite_code ?? ''} onClose={() => setShowInvite(false)} />}
      {showTaskForm && <KulTaskForm members={data.members} onClose={() => setShowTaskForm(false)} onSave={handleSaveTask} />}
      {showVanshForm && <KulVanshForm members={data.familyMembers} editMember={editMember} onClose={() => { setShowVanshForm(false); setEditMember(null); }} onSave={handleSaveVansh} />}
      {showEventForm && <KulEventForm onClose={() => setShowEventForm(false)} onSave={handleSaveEvent} />}
      {selectedMember && <KulFamilyProfileSheet member={selectedMember} onClose={() => setSelectedMember(null)} />}

      {/* Navigation Breadcrumb */}
      {activeView !== 'hub' && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setActiveView('hub')}
          className="flex items-center gap-2 text-sm theme-muted hover:theme-ink transition-colors mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
            <ChevronLeft size={16} />
          </div>
          <span className="font-bold uppercase tracking-widest text-[10px]">{t('kulBackToHub')}</span>
        </motion.button>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="bg-transparent">
            {renderContent()}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom Tab Bar (Mobile) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-md">
         <div className="glass-panel bg-white/70 backdrop-blur-2xl rounded-full p-2 border border-white/20 shadow-2xl flex items-center justify-between">
          {[
            { key: 'hub', label: t('navHome'), icon: '🏡' },
            { key: 'tasks', label: t('kulTasksTitle'), icon: '📋' },
            { key: 'sabha', label: t('kulSabhaTitle'), icon: '💬' },
            { key: 'vansh', label: t('kulVanshTitleLong'), icon: '🌳' },
            { key: 'members', label: t('kulMembersTitle'), icon: '👨‍👩‍👧' },
          ].map((tab) => (
             <button
               key={tab.key}
               onClick={() => setActiveView(tab.key as KulView)}
               className={`flex-1 flex flex-col items-center py-2 rounded-full transition-all ${activeView === tab.key ? 'bg-[var(--brand-primary)]/15 scale-110' : 'hover:bg-black/5'}`}
             >
               <span className="text-xl leading-none">{tab.icon}</span>
               <span className={`text-[8px] font-bold uppercase tracking-tighter mt-1 ${activeView === tab.key ? 'text-[var(--brand-primary-strong)]' : 'theme-muted'}`}>
                 {tab.label}
               </span>
             </button>
           ))}
         </div>
      </div>
    </div>
  );
}
