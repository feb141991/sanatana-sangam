'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import CircularProgress from '@/components/ui/CircularProgress';

// ─── 16 Sanskaras data ───────────────────────────────────────────────────────
export const SANSKARAS = [
  {
    id: 'garbhadhana',
    number: 1,
    name: 'Garbhadhana',
    devanagari: 'गर्भाधान',
    stage: 'Prenatal',
    stageEmoji: '🤰',
    meaning: 'Conception ceremony',
    description: 'The first sanskara — a sacred invocation performed before conception, seeking divine blessings for a virtuous soul to enter the family lineage.',
    timing: 'Before conception',
    deity: 'Prajapati',
    significance: 'Sets the spiritual and genetic foundation of the new life. The mental and spiritual state of parents at conception shapes the child\'s soul.',
  },
  {
    id: 'pumsavana',
    number: 2,
    name: 'Pumsavana',
    devanagari: 'पुंसवन',
    stage: 'Prenatal',
    stageEmoji: '🌱',
    meaning: 'Fetal rite for a healthy child',
    description: 'Performed in the second or third month of pregnancy. Prayers and mantras are offered for the healthy development of the child and protection of the womb.',
    timing: '2nd–3rd month of pregnancy',
    deity: 'Vishnu & Chandra',
    significance: 'Modern science confirms the importance of maternal mental state during early fetal development. Mantras reduce stress and promote well-being.',
  },
  {
    id: 'simantonnayana',
    number: 3,
    name: 'Simantonnayana',
    devanagari: 'सीमन्तोन्नयन',
    stage: 'Prenatal',
    stageEmoji: '✨',
    meaning: 'Hair-parting ceremony',
    description: 'A blessing ceremony in the 5th–8th month where the father parts the mother\'s hair, symbolising protection and joy. Music, prayers, and blessings surround the mother.',
    timing: '5th–7th month of pregnancy',
    deity: 'Surya & Chandra',
    significance: 'Focuses positive energy on the mother and child. The child can hear music from the 5th month — this is the basis of Garbha Samskara.',
  },
  {
    id: 'jatakarma',
    number: 4,
    name: 'Jatakarma',
    devanagari: 'जातकर्म',
    stage: 'Birth',
    stageEmoji: '👶',
    meaning: 'Birth rites',
    description: 'Performed immediately at birth. The father touches the baby\'s lips with ghee and honey while chanting Vedic mantras, and whispers the child\'s secret name (naamakaran-naam) into their ear.',
    timing: 'Immediately at birth',
    deity: 'Savitri & Brihaspati',
    significance: 'The first conscious act of welcoming the soul into the family. Establishes spiritual bond between father and child.',
  },
  {
    id: 'namakarana',
    number: 5,
    name: 'Namakarana',
    devanagari: 'नामकरण',
    stage: 'Infant',
    stageEmoji: '📛',
    meaning: 'Naming ceremony',
    description: 'The formal naming of the child on the 11th or 12th day after birth. A name is chosen based on nakshatra (birth star), family tradition, and meaning. The name becomes the child\'s primary identity.',
    timing: '11th–12th day after birth',
    deity: 'Surya',
    significance: 'Sound shapes consciousness. A name with auspicious meaning and linked to a deity becomes a daily invocation of those qualities.',
  },
  {
    id: 'nishkramana',
    number: 6,
    name: 'Nishkramana',
    devanagari: 'निष्क्रमण',
    stage: 'Infant',
    stageEmoji: '🌞',
    meaning: 'First outdoor outing',
    description: 'The first time the child is taken outside the home, usually to a temple. The child sees the sun and open sky for the first time, receiving the blessing of Surya (the sun deity).',
    timing: '4th month after birth',
    deity: 'Surya & Vayu',
    significance: 'Connects the child to the natural world and the universe beyond the home. Sunlight is the first natural medicine.',
  },
  {
    id: 'annaprashana',
    number: 7,
    name: 'Annaprashana',
    devanagari: 'अन्नप्राशन',
    stage: 'Infant',
    stageEmoji: '🍚',
    meaning: 'First solid food',
    description: 'The weaning ceremony. A small spoon of cooked rice or kheer (rice pudding) is placed in the child\'s mouth with mantras, marking the transition from mother\'s milk to solid food.',
    timing: '6th month after birth',
    deity: 'Annapurna',
    significance: 'Food is sacred. This ceremony establishes a conscious, grateful relationship with nourishment — Anna (food) is Brahman.',
  },
  {
    id: 'chudakarana',
    number: 8,
    name: 'Chudakarana',
    devanagari: 'चूडाकरण',
    stage: 'Early Childhood',
    stageEmoji: '✂️',
    meaning: 'First haircut (Mundan)',
    description: 'The first ritual shaving of the head, removing the hair from the womb. The child\'s head is shaved by the family barber while mantras are chanted, offering the hair to a sacred river or temple.',
    timing: '1st or 3rd year',
    deity: 'Agni & Surya',
    significance: 'Hair from the womb is considered impure. The shaving removes past karmas and negative energies, giving the child a fresh spiritual start.',
  },
  {
    id: 'karnavedha',
    number: 9,
    name: 'Karnavedha',
    devanagari: 'कर्णवेध',
    stage: 'Early Childhood',
    stageEmoji: '💫',
    meaning: 'Ear piercing ceremony',
    description: 'The piercing of the ears for both boys and girls. Gold earrings are worn, which according to Ayurveda activate acupressure points that benefit vision, hearing, and brain development.',
    timing: '6th month to 5th year',
    deity: 'Surya & Chandra',
    significance: 'Acupressure point on the ear corresponds to vision. Gold has antimicrobial properties. This combines medicine and spirituality.',
  },
  {
    id: 'vidyarambha',
    number: 10,
    name: 'Vidyarambha',
    devanagari: 'विद्यारम्भ',
    stage: 'Childhood',
    stageEmoji: '📚',
    meaning: 'Beginning of education',
    description: 'The child\'s formal initiation into learning. The guru or parent guides the child to write the first letters on rice or sand while chanting to Saraswati. Education is treated as a divine gift.',
    timing: '3rd–5th year',
    deity: 'Saraswati & Ganesha',
    significance: 'Learning is a sacred act. The ceremony establishes reverence for knowledge, the teacher, and the learning process — the foundation of Guru-Shishya tradition.',
  },
  {
    id: 'upanayana',
    number: 11,
    name: 'Upanayana',
    devanagari: 'उपनयन',
    stage: 'Youth',
    stageEmoji: '🧵',
    meaning: 'Sacred thread ceremony (Janeu)',
    description: 'The most significant of all sanskaras. The boy receives the sacred Yajnopavita (janeu/thread) from the guru, symbolising his second birth (Dvija). He enters studentship (Brahmacharya) and begins Vedic study.',
    timing: '8–12 years (boy)',
    deity: 'Savitri & Brihaspati',
    significance: 'Marks the transition from childhood to disciplined studenthood. The Gayatri Mantra is whispered into the student\'s ear for the first time. He becomes responsible for his own spiritual development.',
  },
  {
    id: 'vedarambha',
    number: 12,
    name: 'Vedarambha',
    devanagari: 'वेदारम्भ',
    stage: 'Youth',
    stageEmoji: '🕉️',
    meaning: 'Beginning of Vedic study',
    description: 'Formal commencement of the study of the Vedas and scriptures under a guru. Often performed together with or shortly after Upanayana.',
    timing: 'After Upanayana',
    deity: 'Brihaspati & Saraswati',
    significance: 'Connects the student to the unbroken lineage of Vedic transmission. Knowledge is received as a sacred trust, not a commodity.',
  },
  {
    id: 'keshanta',
    number: 13,
    name: 'Keshanta / Godana',
    devanagari: 'केशान्त / गोदान',
    stage: 'Youth',
    stageEmoji: '🪒',
    meaning: 'First shave for young men',
    description: 'The first shaving of the beard, performed ritually. The boy gives a cow (or equivalent gift) to the guru as Dakshina, symbolising the completion of the first phase of learning.',
    timing: '16th year',
    deity: 'Surya',
    significance: 'Marks the transition from boyhood to young manhood. The gift of a cow symbolises nurturing and sustenance — gratitude to the guru.',
  },
  {
    id: 'samavartana',
    number: 14,
    name: 'Samavartana',
    devanagari: 'समावर्तन',
    stage: 'Youth',
    stageEmoji: '🎓',
    meaning: 'Graduation from studentship',
    description: 'The formal end of Brahmacharya (studentship) and return to family life. The student takes a final bath (Snaataka), receives blessings from the guru, and is ready to enter the householder stage (Grihastha).',
    timing: 'Completion of Vedic studies',
    deity: 'Brihaspati & Saraswati',
    significance: 'Marks the transition from student to householder. The knowledge gained is now to be lived and shared — not just studied.',
  },
  {
    id: 'vivaha',
    number: 15,
    name: 'Vivaha',
    devanagari: 'विवाह',
    stage: 'Adult',
    stageEmoji: '💐',
    meaning: 'Marriage',
    description: 'The sacred union of two souls. The couple takes seven steps around the sacred fire (Saptapadi), each step representing a vow. Marriage in Dharma is not a contract but a spiritual sadhana of two becoming one.',
    timing: 'Adulthood',
    deity: 'Agni (witness) & Prajapati',
    significance: 'The couple\'s relationship becomes a vehicle for mutual spiritual growth. Grihastha Ashrama — the householder stage — is one of the four pillars of Dharmic life.',
  },
  {
    id: 'antyesti',
    number: 16,
    name: 'Antyesti',
    devanagari: 'अन्त्येष्टि',
    stage: 'Death',
    stageEmoji: '🔥',
    meaning: 'Last rites (Cremation)',
    description: 'The final and most profound sanskara. The body is cremated with Vedic mantras, returning the five elements (Pancha Mahabhuta) to nature. The soul is released to continue its journey.',
    timing: 'At death',
    deity: 'Yama & Agni',
    significance: 'Cremation is not mourning but a sacred ceremony of release. Fire liberates the soul from the physical body. The ashes are immersed in sacred waters.',
  },
] as const;

type SanskaraId = (typeof SANSKARAS)[number]['id'];

interface CompletedRecord {
  sanskara_id: string;
  completed_date: string | null;
  notes: string | null;
  performed_by: string | null;
  location: string | null;
}

interface Props {
  userId: string;
  completed: CompletedRecord[];
}

// ─── Stage colour map ─────────────────────────────────────────────────────────
const STAGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Prenatal':        { bg: 'rgba(160,80,200,0.12)', border: 'rgba(160,80,200,0.3)', text: '#c07be0' },
  'Birth':           { bg: 'rgba(230,120,30,0.12)', border: 'rgba(230,120,30,0.3)', text: '#e07830' },
  'Infant':          { bg: 'rgba(50,180,160,0.12)', border: 'rgba(50,180,160,0.3)', text: '#40c0a0' },
  'Early Childhood': { bg: 'rgba(60,160,230,0.12)', border: 'rgba(60,160,230,0.3)', text: '#50a0e0' },
  'Childhood':       { bg: 'rgba(80,200,80,0.12)',  border: 'rgba(80,200,80,0.3)',  text: '#60c060' },
  'Youth':           { bg: 'rgba(230,200,40,0.12)', border: 'rgba(230,200,40,0.3)', text: '#d4b830' },
  'Adult':           { bg: 'rgba(212,100,50,0.14)', border: 'rgba(212,100,50,0.35)', text: '#d46030' },
  'Death':           { bg: 'rgba(100,100,120,0.12)', border: 'rgba(100,100,120,0.3)', text: '#9090a0' },
};

// ─── Mark form ────────────────────────────────────────────────────────────────
function MarkForm({
  sanskaraId,
  onSave,
  onCancel,
}: {
  sanskaraId: string;
  onSave: (data: { date: string; notes: string; performed_by: string; location: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [date,        setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [notes,       setNotes]       = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [location,    setLocation]    = useState('');
  const [saving,      setSaving]      = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="mt-3 space-y-3 rounded-xl p-4" style={{ background: 'rgba(212,166,70,0.06)', border: '1px solid rgba(212,166,70,0.15)' }}>
        <p className="text-xs font-semibold text-amber-200/70">Record this sanskara</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,220,150,0.9)' }}
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider">Location</label>
            <input
              type="text"
              placeholder="City / Temple"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,220,150,0.9)' }}
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Performed by (Pandit / Granthi)</label>
          <input
            type="text"
            placeholder="Name (optional)"
            value={performedBy}
            onChange={e => setPerformedBy(e.target.value)}
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,220,150,0.9)' }}
          />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Notes / Memories</label>
          <textarea
            placeholder="A note to remember this day…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,220,150,0.9)' }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setSaving(true);
              await onSave({ date, notes, performed_by: performedBy, location });
              setSaving(false);
            }}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition"
            style={{ background: 'linear-gradient(135deg, rgba(212,120,20,0.9), rgba(212,166,70,0.8))', color: '#1c1208' }}
          >
            {saving ? 'Saving…' : <><Check size={12} /> Mark complete</>}
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-xs transition"
            style={{ color: 'rgba(245,210,130,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Single sanskara card ─────────────────────────────────────────────────────
function SanskaraCard({
  s,
  record,
  onMark,
}: {
  s: typeof SANSKARAS[number];
  record: CompletedRecord | undefined;
  onMark: (id: string, data: { date: string; notes: string; performed_by: string; location: string }) => Promise<void>;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [marking,   setMarking]   = useState(false);
  const done  = Boolean(record);
  const stage = STAGE_COLORS[s.stage] ?? STAGE_COLORS['Adult'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: done ? 'rgba(80,200,100,0.06)' : 'rgba(10,8,22,0.6)',
        border: `1px solid ${done ? 'rgba(80,200,100,0.2)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {/* Card header */}
      <button
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Number / checkmark */}
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold mt-0.5"
          style={{
            background: done ? 'rgba(80,200,100,0.18)' : 'rgba(212,166,70,0.1)',
            border: `1.5px solid ${done ? 'rgba(80,200,100,0.4)' : 'rgba(212,166,70,0.2)'}`,
            color: done ? '#60c060' : 'rgba(212,166,70,0.7)',
          }}
        >
          {done ? <Check size={16} strokeWidth={2.5} /> : s.number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: done ? 'rgba(180,240,180,0.85)' : 'rgba(245,220,150,0.85)' }}>
              {s.name}
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(245,210,130,0.4)' }}>{s.devanagari}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: stage.bg, border: `1px solid ${stage.border}`, color: stage.text }}
            >
              {s.stageEmoji} {s.stage}
            </span>
            <span className="text-[11px]" style={{ color: 'rgba(245,210,130,0.45)' }}>{s.meaning}</span>
          </div>
          {done && record?.completed_date && (
            <p className="mt-1 text-[10px]" style={{ color: 'rgba(80,200,100,0.6)' }}>
              ✓ {new Date(record.completed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {record.location ? ` · ${record.location}` : ''}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 mt-1">
          {expanded ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="pt-3 space-y-2">
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,210,130,0.6)' }}>
                  {s.description}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Timing</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(245,220,150,0.65)' }}>{s.timing}</p>
                  </div>
                  <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Deity</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(245,220,150,0.65)' }}>{s.deity}</p>
                  </div>
                </div>
                <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(212,166,70,0.06)', border: '1px solid rgba(212,166,70,0.12)' }}>
                  <p className="text-[10px] text-amber-200/50 uppercase tracking-wider flex items-center gap-1">
                    <Info size={10} /> Significance
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(245,210,130,0.55)' }}>{s.significance}</p>
                </div>
              </div>

              {/* Completed details */}
              {done && (
                <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(80,200,100,0.07)', border: '1px solid rgba(80,200,100,0.15)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(80,200,100,0.6)' }}>Completed</p>
                  {record?.performed_by && <p className="text-xs mt-1" style={{ color: 'rgba(180,240,180,0.6)' }}>By: {record.performed_by}</p>}
                  {record?.notes && <p className="text-xs mt-1 italic" style={{ color: 'rgba(180,240,180,0.5)' }}>&ldquo;{record.notes}&rdquo;</p>}
                </div>
              )}

              {/* Mark button */}
              {!done && !marking && (
                <button
                  onClick={() => setMarking(true)}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition"
                  style={{ background: 'rgba(212,166,70,0.1)', border: '1px solid rgba(212,166,70,0.22)', color: '#d4a030' }}
                >
                  <Check size={13} /> Mark as completed
                </button>
              )}

              {/* Mark form */}
              <AnimatePresence>
                {marking && (
                  <MarkForm
                    sanskaraId={s.id}
                    onSave={async (data) => {
                      await onMark(s.id, data);
                      setMarking(false);
                    }}
                    onCancel={() => setMarking(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SanskaraClient({ userId, completed: initialCompleted }: Props) {
  const supabase  = createClient();
  const [completed, setCompleted] = useState<CompletedRecord[]>(initialCompleted);

  const completedCount = completed.length;
  const pct = Math.round((completedCount / SANSKARAS.length) * 100);

  function getRecord(id: string) {
    return completed.find(c => c.sanskara_id === id);
  }

  async function handleMark(
    sanskaraId: string,
    data: { date: string; notes: string; performed_by: string; location: string }
  ) {
    const { error } = await supabase.from('user_sanskaras').upsert({
      user_id:        userId,
      sanskara_id:    sanskaraId,
      completed_date: data.date || null,
      notes:          data.notes || null,
      performed_by:   data.performed_by || null,
      location:       data.location || null,
    }, { onConflict: 'user_id,sanskara_id' });

    if (error) {
      toast.error('Could not save — please try again');
      return;
    }

    setCompleted(prev => {
      const filtered = prev.filter(c => c.sanskara_id !== sanskaraId);
      return [...filtered, {
        sanskara_id:    sanskaraId,
        completed_date: data.date || null,
        notes:          data.notes || null,
        performed_by:   data.performed_by || null,
        location:       data.location || null,
      }];
    });
    toast.success('Sanskara recorded 🙏', { duration: 2500 });
  }

  // Group by stage for section headers
  const stages = [...new Set(SANSKARAS.map(s => s.stage))];

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div
        className="rounded-[1.8rem] px-5 py-5"
        style={{
          background: 'linear-gradient(135deg, rgba(30,18,10,0.95), rgba(20,12,8,0.98))',
          border: '1px solid rgba(212,166,70,0.15)',
        }}
      >
        <div className="flex items-center gap-4">
          <CircularProgress
            pct={pct}
            accent="#d4a030"
            size={72}
            strokeWidth={5}
            label={
              <div className="text-center">
                <p className="text-lg font-bold leading-none" style={{ color: '#d4a030' }}>{completedCount}</p>
                <p className="text-[9px] mt-0.5" style={{ color: 'rgba(245,210,130,0.45)' }}>of 16</p>
              </div>
            }
          />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#f5dfa0' }}>16 Sanskaras</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(245,210,130,0.45)' }}>
              षोडश संस्कार — Sacred rites of passage
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(245,210,130,0.35)' }}>
              {pct}% of lifecycle journey recorded
            </p>
          </div>
        </div>
      </div>

      {/* Timeline grouped by life stage */}
      {stages.map((stage) => {
        const stageItems = SANSKARAS.filter(s => s.stage === stage);
        const stageColor = STAGE_COLORS[stage] ?? STAGE_COLORS['Adult'];
        return (
          <div key={stage} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1" style={{ background: stageColor.border }} />
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2" style={{ color: stageColor.text }}>
                {stageItems[0]?.stageEmoji} {stage}
              </span>
              <div className="h-px flex-1" style={{ background: stageColor.border }} />
            </div>
            <div className="space-y-2">
              {stageItems.map((s) => (
                <SanskaraCard
                  key={s.id}
                  s={s}
                  record={getRecord(s.id)}
                  onMark={handleMark}
                />
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-center text-xs pb-2" style={{ color: 'rgba(245,210,130,0.25)' }}>
        Records are private to your profile. Family sharing coming soon.
      </p>
    </div>
  );
}
