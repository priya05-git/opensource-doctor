import { useState } from 'react';
import { analyze } from './api.js';
import Results from './components/Results.jsx';
import TaskModal from './components/TaskModal.jsx';

const EXAMPLES = ['sindresorhus/is', 'expressjs/express', 'pmndrs/zustand'];

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [first, setFirst] = useState(false);
  const [err, setErr] = useState('');
  const [active, setActive] = useState(null);

  async function run(target = url, firstMode = false) {
    setLoading(true); setErr(''); setData(null); setFirst(firstMode);
    try { setData(await analyze(target, firstMode)); }
    catch (e) { setErr(e.message); }
    setLoading(false);
  }

  return (
    <div className="relative">
      <header className="flex items-center justify-between px-7 py-5">
        <div className="flex items-center gap-3 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-neon font-bold text-[#06210f]">+</span>
          opensource-doctor
        </div>
        <span className="hidden text-sm text-mute sm:block">AI maintainer agent · MIT</span>
      </header>

      <main className="mx-auto max-w-[980px] px-5 pb-20 pt-10 text-center">
        <div className="text-[13px] font-semibold tracking-[0.3em] text-neon">OPEN SOURCE HAS A CONTRIBUTION PROBLEM</div>
        <h1 className="my-6 font-head text-[clamp(38px,7vw,72px)] font-bold leading-[1.1]">
          Don’t know where to start?<br /><span className="text-neon">Let the doctor diagnose.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-[560px] leading-7 text-mute">
          Paste any public GitHub repo. The AI reads its code, README and issues, then prescribes contribution tasks you can actually finish.
        </p>

        <div className="mx-auto flex max-w-[840px] flex-col gap-2.5 rounded-2xl border border-neon/50 bg-panel p-2.5 shadow-[0_0_40px_rgba(94,240,142,0.15)] sm:flex-row">
          <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="https://github.com/owner/repo" spellCheck="false"
            className="min-w-0 flex-1 bg-transparent px-3.5 py-2 text-ink outline-none placeholder:text-mute" />
          <button className="btn" disabled={loading} onClick={() => run()}>✨ Analyze repository</button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-sm text-mute">
          <button className="ghost" disabled={loading} onClick={() => run(url, true)}>🎯 Find my first contribution</button>
          <span>or try</span>
          {EXAMPLES.map(r => (
            <button key={r} className="chip" onClick={() => { const u = `https://github.com/${r}`; setUrl(u); run(u); }}>{r}</button>
          ))}
        </div>

        <div className="mt-14 text-left">
          {loading && <div className="card spinner text-center text-mute">The doctor is examining the repository</div>}
          {err && <div className="card border-danger text-danger">⚠ {err}</div>}
          {data && <Results data={data} first={first} onOpen={setActive} />}
        </div>
      </main>

      {active && <TaskModal repo={data.repo} task={active} onClose={() => setActive(null)} />}
    </div>
  );
}
