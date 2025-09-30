import React, { useEffect, useMemo, useState } from 'react';
import { DevLogger, LogEntry } from '@/services/devtools/loggerService';

const levelColors: Record<string, string> = {
  debug: '#6b7280',
  info: '#16a34a',
  warn: '#d97706',
  error: '#dc2626',
};

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(DevLogger.getAll());
  const [q, setQ] = useState('');
  const [levels, setLevels] = useState<Record<string, boolean>>({ debug: true, info: true, warn: true, error: true });
  const [kinds, setKinds] = useState<Record<string, boolean>>({ log: true, request: true, response: true, error: true, exception: true, rejection: true });

  useEffect(() => {
    const unsub = DevLogger.subscribe(() => setLogs(DevLogger.getAll()));
    return () => { unsub(); };
  }, []);

  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    return logs.filter((l) =>
      levels[l.level] && kinds[l.kind] &&
      (!qlc || l.message.toLowerCase().includes(qlc) || JSON.stringify(l.context).toLowerCase().includes(qlc))
    ).slice().reverse();
  }, [logs, q, levels, kinds]);

  const handleExport = () => {
    const blob = new Blob([DevLogger.export()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggle = (set: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, key: string) =>
    set((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div style={{ padding: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
      <h2 style={{ margin: '6px 0 12px' }}>Logs</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <input
          placeholder="Search..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: '1 1 160px', minWidth: 140, padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
        />
        <button onClick={() => setLogs(DevLogger.getAll())} style={{ padding: '6px 10px' }}>Refresh</button>
        <button onClick={() => DevLogger.clear()} style={{ padding: '6px 10px' }}>Clear</button>
        <button onClick={handleExport} style={{ padding: '6px 10px' }}>Export JSON</button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Levels</div>
          {Object.keys(levelColors).map((lvl) => (
            <label key={lvl} style={{ marginRight: 8 }}>
              <input type="checkbox" checked={!!levels[lvl]} onChange={() => toggle(setLevels, lvl)} />
              <span style={{ marginLeft: 4, color: levelColors[lvl] }}>{lvl}</span>
            </label>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Kinds</div>
          {['log','request','response','error','exception','rejection'].map((k) => (
            <label key={k} style={{ marginRight: 8 }}>
              <input type="checkbox" checked={!!kinds[k]} onChange={() => toggle(setKinds, k)} />
              <span style={{ marginLeft: 4 }}>{k}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map((l) => (
          <div key={l.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', background: '#111827' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{new Date(l.ts).toLocaleTimeString()}</span>
              <span style={{ fontSize: 12, color: levelColors[l.level], textTransform: 'uppercase' }}>{l.level}</span>
              <span style={{ fontSize: 12, color: '#111827' }}>[{l.kind}]</span>
              <span style={{ fontSize: 13 }}>{l.message}</span>
            </div>
            {l.context && (
              <pre style={{ margin: 0, padding: 8, fontSize: 12, background: '111827', overflowX: 'auto' }}>
                {JSON.stringify(l.context, null, 2)}
              </pre>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ color: '#6b7280', padding: 16 }}>No logs</div>
        )}
      </div>
    </div>
  );
};

export default LogsPage;
