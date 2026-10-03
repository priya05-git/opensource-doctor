const LEVEL = {
  beginner: ['🟢', 'bg-neon/10 text-neon'],
  intermediate: ['🟡', 'bg-amber/10 text-amber'],
  advanced: ['🔴', 'bg-danger/10 text-danger'],
};

export default function Results({ data, first, onOpen }) {
  const s = Math.max(0, Math.min(100, +data.health_score || 0));
  const color = s >= 75 ? '#5ef08e' : s >= 50 ? '#f5c542' : '#ff6b6b';
  const tasks = data.contribution_tasks || [];

  return (
    <>
      <div className="card grid items-center gap-6 sm:grid-cols-[150px_1fr]">
        <div className="justify-self-center text-center">
          <div className="grid h-[130px] w-[130px] place-items-center rounded-full"
            style={{ background: `conic-gradient(${color} ${s}%, #1f2a30 0)` }}>
            <b className="grid h-[104px] w-[104px] place-items-center rounded-full bg-panel font-head text-[34px]">{s}</b>
          </div>
          <small className="mt-1.5 block text-xs text-mute">/100 health</small>
        </div>
        <div>
          <div className="h-label">🧠 AI UNDERSTANDING · {data.repo}</div>
          <p className="text-sm leading-7 text-[#c4cdd6]">{data.summary}</p>
          <p className="mt-2 text-sm text-mute">{data.health_reason}</p>
        </div>
      </div>

      <div className="h-label mb-3.5 mt-7">{first ? '🎯 YOUR FIRST CONTRIBUTION' : '🚨 CONTRIBUTION OPPORTUNITIES'}</div>
      {tasks.map((t, i) => {
        const lv = (t.difficulty || 'beginner').toLowerCase();
        const [icon, cls] = LEVEL[lv] || LEVEL.beginner;
        return (
          <div key={i} className="card flex gap-4">
            <div className="font-head text-[22px] font-bold text-mute">#{i + 1}</div>
            <div className="flex-1">
              <span className={`lvl ${cls}`}>{icon} {lv.toUpperCase()}</span>
              <h3 className="mb-2 font-head text-[19px] font-bold">{t.title}</h3>
              <div className="my-2 text-[13px] text-mute">
                Difficulty: {'⭐'.repeat(Math.min(5, +t.stars || 1))} · Estimated time: {t.minutes || 30} min
              </div>
              <div>{(t.files || []).map(f => <code key={f} className="code">{f}</code>)}</div>
              <p className="mt-2.5 text-sm leading-7 text-[#c4cdd6]"><b className="text-ink">Why this matters:</b> {t.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <button className="ghost" onClick={() => onOpen(t)}>Start contribution →</button>
                <button className="ghost" onClick={() => onOpen({ ...t, _explain: true })}>🤖 Explain this issue to me</button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
