import React from 'react';
import { Radar, FileCode2, Boxes, Users, Crosshair, AlertOctagon, Gauge } from 'lucide-react';
import BugImpactMap from '@/components/BugImpactMap';

const RISK_STYLES = {
  Low: 'bg-accent/15 text-accent border-accent/30',
  Medium: 'bg-chart-3/15 text-chart-3 border-chart-3/30',
  High: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
  Critical: 'bg-destructive/15 text-destructive border-destructive/30',
};

const BLAST_STYLES = {
  contained: 'bg-accent/15 text-accent border-accent/30',
  module: 'bg-chart-5/15 text-chart-5 border-chart-5/30',
  system: 'bg-chart-3/15 text-chart-3 border-chart-3/30',
  global: 'bg-destructive/15 text-destructive border-destructive/30',
};

const scoreColor = (s) => (s >= 75 ? 'text-destructive' : s >= 50 ? 'text-chart-3' : 'text-accent');
const scoreBg = (s) => (s >= 75 ? 'bg-destructive' : s >= 50 ? 'bg-chart-3' : 'bg-accent');

export default function BugImpactPanel({ impact }) {
  if (!impact) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-border bg-card/20 p-4 text-center">
        <Radar className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Impact analysis unavailable for this scan.</p>
        <p className="text-xs text-muted-foreground/70 font-mono mt-1">Re-scan to generate a Bug Impact Map.</p>
      </div>
    );
  }

  const score = impact.impact_score ?? 0;
  const files = impact.affected_files || [];
  const features = impact.affected_features || [];
  const users = impact.user_impact || [];
  const blast = impact.blast_radius || {};
  const root = impact.root_component || {};

  return (
    <div className="mt-5 rounded-xl border border-border bg-card/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Radar className="w-4 h-4 text-primary" />
          Bug Impact
        </h4>
        <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">AI estimate · not confirmed</span>
      </div>

      <div className="p-4 space-y-5">
        <p className="text-xs text-muted-foreground font-mono">
          <span className="text-accent">$</span> impact analysis is estimated by AI from the code — treat as guidance, not verified fact.
        </p>

        {/* Top metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
              <Gauge className="w-3.5 h-3.5" /> Impact Score
            </div>
            <p className={`font-display text-2xl font-bold font-mono ${scoreColor(score)}`}>
              {score}<span className="text-sm text-muted-foreground">/100</span>
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${scoreBg(score)} rounded-full transition-all`} style={{ width: `${score}%` }} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
              <AlertOctagon className="w-3.5 h-3.5" /> Risk Level
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${RISK_STYLES[impact.risk_level] || RISK_STYLES.Low}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {impact.risk_level || 'Low'}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
              <Crosshair className="w-3.5 h-3.5" /> Blast Radius
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${BLAST_STYLES[blast.level] || BLAST_STYLES.contained}`}>
              {blast.level || 'contained'}
            </span>
            {blast.affected_count != null && <p className="text-xs text-muted-foreground mt-2 font-mono">~{blast.affected_count} affected</p>}
          </div>
        </div>

        {blast.description && <p className="text-sm text-muted-foreground -mt-2">{blast.description}</p>}

        {/* Root component */}
        {root.name && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-primary mb-1.5 font-mono uppercase tracking-wider">
              <Crosshair className="w-3.5 h-3.5" /> Root Component
            </div>
            <p className="text-sm font-medium">{root.name}</p>
            {root.file && <p className="text-xs font-mono text-muted-foreground mt-0.5">{root.file}</p>}
            {root.detail && <p className="text-xs text-muted-foreground mt-1.5">{root.detail}</p>}
          </div>
        )}

        {/* Files + Features */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h5 className="flex items-center gap-1.5 text-xs font-semibold mb-2 font-mono uppercase tracking-wider text-muted-foreground">
              <FileCode2 className="w-3.5 h-3.5" /> Affected Files
              <span className="text-foreground/50 normal-case">({files.length})</span>
            </h5>
            {files.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono">None identified.</p>
            ) : (
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="rounded-lg border border-border bg-background/40 p-2.5">
                    <p className="text-sm font-medium">{f.name}</p>
                    {f.path && <p className="text-xs font-mono text-muted-foreground mt-0.5">{f.path}</p>}
                    {f.reason && <p className="text-xs text-muted-foreground mt-1">{f.reason}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h5 className="flex items-center gap-1.5 text-xs font-semibold mb-2 font-mono uppercase tracking-wider text-muted-foreground">
              <Boxes className="w-3.5 h-3.5" /> Affected Features
              <span className="text-foreground/50 normal-case">({features.length})</span>
            </h5>
            {features.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono">None identified.</p>
            ) : (
              <ul className="space-y-2">
                {features.map((f, i) => (
                  <li key={i} className="rounded-lg border border-border bg-background/40 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{f.name}</p>
                      {f.severity && <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-secondary text-muted-foreground">{f.severity}</span>}
                    </div>
                    {f.impact && <p className="text-xs text-muted-foreground mt-1">{f.impact}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* User impact */}
        <div>
          <h5 className="flex items-center gap-1.5 text-xs font-semibold mb-2 font-mono uppercase tracking-wider text-muted-foreground">
            <Users className="w-3.5 h-3.5" /> User Impact
          </h5>
          {users.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono">None identified.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {users.map((u, i) => (
                <div key={i} className="rounded-lg border border-border bg-background/40 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{u.audience}</p>
                    {u.severity && <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-secondary text-muted-foreground">{u.severity}</span>}
                  </div>
                  {u.workflow && <p className="text-xs text-muted-foreground mt-1">{u.workflow}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dependency map */}
        <div>
          <h5 className="flex items-center gap-1.5 text-xs font-semibold mb-3 font-mono uppercase tracking-wider text-muted-foreground">
            <Radar className="w-3.5 h-3.5" /> Dependency &amp; Impact Map
          </h5>
          <BugImpactMap impact={impact} />
        </div>
      </div>
    </div>
  );
}