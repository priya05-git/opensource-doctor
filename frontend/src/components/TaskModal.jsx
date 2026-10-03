import { useEffect, useState } from 'react';
import { explain } from '../api.js';

const Section = ({ title, children }) => (
  <>
    <div className="h-label mt-5 !mb-1.5">{title}</div>
    {children}
  </>
);

export default function TaskModal({ repo, task, onClose }) {
  const [ans, setAns] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function ask() {
    setBusy(true); setErr('');
    try { const { _explain, ...t } = task; setAns(await explain(repo, t)); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }
  useEffect(() => { if (task._explain) ask(); }, []);

  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="max-h-[86vh] w-[min(680px,92vw)] overflow-auto rounded-2xl border border-neon/40 bg-panel p-6 text-sm leading-7 text-[#c4cdd6] animate-up">
        <div className="h-label">TASK</div>
        <h3 className="font-head text-[22px] font-bold text-ink">{task.title}</h3>

        <Section title="📍 FILES">{(task.files || []).map(f => <code key={f} className="code">{f}</code>)}</Section>
        <Section title="📖 WHAT TO LEARN"><ul className="list-disc pl-5">{(task.learn || []).map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
        <Section title="🛠 STEPS"><ol className="list-decimal pl-5">{(task.steps || []).map((x, i) => <li key={i}>{x}</li>)}</ol></Section>

        {!ans && <button className="btn mt-5" disabled={busy} onClick={ask}>🤖 Ask the doctor</button>}
        {busy && <p className="spinner mt-4 text-mute">Doctor is thinking</p>}
        {err && <p className="mt-4 text-danger">⚠ {err}</p>}
        {ans && (
          <>
            <Section title="👋 WHY THIS FITS YOU"><p>{ans.why_suitable}</p></Section>
            <Section title="📚 WHAT YOU NEED TO LEARN"><ol className="list-decimal pl-5">{(ans.learn || []).map((x, i) => <li key={i}>{x}</li>)}</ol></Section>
            <Section title="🛠 SUGGESTED APPROACH"><ol className="pl-0">{(ans.approach || []).map((x, i) => <li key={i} className="list-none">Step {i + 1} → {x}</li>)}</ol></Section>
            <Section title="⚠ COMMON MISTAKES"><ul className="list-disc pl-5">{(ans.common_mistakes || []).map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
          </>
        )}
        <div className="mt-6"><button className="ghost" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}
