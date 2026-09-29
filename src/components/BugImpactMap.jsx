import React, { useState, useMemo } from 'react';

const TYPE_COLORS = {
  root: { fill: 'hsl(var(--primary))', ring: 'hsl(var(--primary))' },
  component: { fill: 'hsl(var(--accent))', ring: 'hsl(var(--accent))' },
  api: { fill: 'hsl(var(--chart-5))', ring: 'hsl(var(--chart-5))' },
  module: { fill: 'hsl(var(--chart-3))', ring: 'hsl(var(--chart-3))' },
  dependency: { fill: 'hsl(var(--muted-foreground))', ring: 'hsl(var(--muted-foreground))' },
  file: { fill: 'hsl(var(--chart-4))', ring: 'hsl(var(--chart-4))' },
};

const TYPE_LABELS = {
  root: 'Root',
  component: 'Component',
  api: 'API',
  module: 'Module',
  dependency: 'Dependency',
  file: 'File',
};

const truncate = (s, n = 18) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');

export default function BugImpactMap({ impact }) {
  const [selectedId, setSelectedId] = useState(null);

  const chain = impact?.dependency_chain || {};
  const rawNodes = chain.nodes || [];
  const edges = chain.edges || [];

  const nodes = useMemo(() => {
    const list = [...rawNodes];
    if (!list.some((n) => n.id === 'root')) {
      const rc = impact?.root_component;
      list.unshift({
        id: 'root',
        label: rc?.name || 'Root',
        type: 'root',
        file: rc?.file || '',
        detail: rc?.detail || 'The issue originates here.',
      });
    }
    return list;
  }, [rawNodes, impact]);

  const positions = useMemo(() => {
    const cx = 300;
    const cy = 200;
    const map = {};
    const root = nodes.find((n) => n.id === 'root');
    if (root) map[root.id] = { x: cx, y: cy };
    const others = nodes.filter((n) => n.id !== 'root');
    const R = others.length <= 1 ? 0 : 130;
    others.forEach((n, i) => {
      const angle = (i / others.length) * Math.PI * 2 - Math.PI / 2;
      map[n.id] = { x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R };
    });
    return map;
  }, [nodes]);

  const selected = nodes.find((n) => n.id === selectedId) || null;

  if (nodes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground font-mono py-8 text-center">
        No dependency data available for this estimate.
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border border-border bg-background/40 overflow-hidden">
        <svg viewBox="0 0 600 400" className="w-full h-auto" style={{ maxHeight: 360 }}>
          {edges.map((e, i) => {
            const a = positions[e.from];
            const b = positions[e.to];
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <g key={`e${i}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--border))" strokeWidth={1.5} strokeDasharray="4 3" />
                {e.label && (
                  <text x={mx} y={my - 4} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" className="font-mono">
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
          {nodes.map((n) => {
            const p = positions[n.id];
            if (!p) return null;
            const c = TYPE_COLORS[n.type] || TYPE_COLORS.dependency;
            const isRoot = n.id === 'root';
            const isSelected = selectedId === n.id;
            const r = isRoot ? 22 : 16;
            return (
              <g key={n.id} className="cursor-pointer" onClick={() => setSelectedId(isSelected ? null : n.id)}>
                {isSelected && <circle cx={p.x} cy={p.y} r={r + 6} fill="none" stroke={c.ring} strokeWidth={2} opacity={0.5} />}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={c.fill}
                  fillOpacity={isRoot ? 0.9 : 0.7}
                  stroke={c.ring}
                  strokeWidth={isRoot ? 2.5 : 1.5}
                />
                <text x={p.x} y={p.y + r + 14} textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))" className="font-mono font-medium">
                  {truncate(n.label)}
                </text>
                <text x={p.x} y={p.y + r + 26} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))" className="font-mono uppercase">
                  {TYPE_LABELS[n.type] || n.type}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] font-mono uppercase tracking-wider">
        {Object.entries(TYPE_LABELS).map(([k, label]) => {
          const c = TYPE_COLORS[k];
          return (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.fill }} />
              {label}
            </span>
          );
        })}
      </div>

      <div className="mt-4">
        {selected ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: (TYPE_COLORS[selected.type] || TYPE_COLORS.dependency).fill }} />
              <h4 className="text-sm font-semibold">{selected.label}</h4>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-secondary text-muted-foreground">
                {TYPE_LABELS[selected.type] || selected.type}
              </span>
            </div>
            {selected.file && <p className="text-xs font-mono text-muted-foreground mb-2">{selected.file}</p>}
            <p className="text-sm text-foreground/90">{selected.detail || 'No additional detail available for this estimate.'}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground font-mono text-center py-2">
            Click a node to inspect its estimated details.
          </p>
        )}
      </div>
    </div>
  );
}