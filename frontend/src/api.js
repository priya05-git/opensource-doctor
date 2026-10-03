async function post(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data;
}
export const analyze = (repoUrl, firstContribution = false) => post('/api/analyze', { repoUrl, firstContribution });
export const explain = (repo, task) => post('/api/explain', { repo, task });
