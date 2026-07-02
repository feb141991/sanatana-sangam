import fs from 'fs';

const UI_PATH = 'src/app/(main)/dharm-veer/[id]/DharmVeerClient.tsx';
let content = fs.readFileSync(UI_PATH, 'utf-8');

const askMoreState = `
  const [askMoreQuery, setAskMoreQuery] = useState('');
  const [askMoreResponse, setAskMoreResponse] = useState('');
  const [askMoreLoading, setAskMoreLoading] = useState(false);

  const handleAskMore = async () => {
    if (!askMoreQuery.trim()) return;
    setAskMoreLoading(true);
    setAskMoreResponse('');
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: askMoreQuery,
          mode: 'dharam_veer_reflection',
          figure_id: hero.id
        }),
      });
      if (res.ok) {
        const text = await res.text();
        setAskMoreResponse(text);
      } else {
        setAskMoreResponse('Failed to fetch response.');
      }
    } catch(err) {
      setAskMoreResponse('An error occurred.');
    } finally {
      setAskMoreLoading(false);
    }
  };
`;

content = content.replace("const [lang, setLang] = useState<'en' | 'local'>(\n    getInitialReaderDisplayMode(preferences, hasCompleteLocalContent)\n  );", "const [lang, setLang] = useState<'en' | 'local'>(\n    getInitialReaderDisplayMode(preferences, hasCompleteLocalContent)\n  );\n" + askMoreState);

const askMoreUI = `
        {/* Ask More Section */}
        <section className="space-y-4 pt-12 border-t border-white/10">
            <h2 className="text-xl font-bold">Ask more about this Dharam Veer</h2>
            <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  value={askMoreQuery} 
                  onChange={e => setAskMoreQuery(e.target.value)} 
                  placeholder="Ask a question..."
                  className="w-full p-3 rounded-xl bg-[var(--surface-base)] text-black border border-black/10 focus:outline-none"
                />
                <button 
                  onClick={handleAskMore}
                  disabled={askMoreLoading || !askMoreQuery.trim()}
                  className="px-6 py-3 rounded-xl bg-[var(--brand-primary)] text-black font-bold disabled:opacity-50 self-end transition hover:scale-105 active:scale-95"
                >
                  {askMoreLoading ? 'Asking...' : 'Ask AI'}
                </button>
            </div>
            {askMoreResponse && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                    {askMoreResponse}
                </div>
            )}
        </section>
`;

content = content.replace("{/* Share Button */}", askMoreUI + "\n        {/* Share Button */}");

fs.writeFileSync(UI_PATH, content, 'utf-8');
console.log('patched UI');
