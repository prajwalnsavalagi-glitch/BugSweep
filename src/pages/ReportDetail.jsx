const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bug, Loader2, CheckCircle2, AlertTriangle, Info, ShieldCheck, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

import { SeverityBadge, SEVERITY_CONFIG } from '@/components/SeverityBadge';
import TagManager from '@/components/TagManager';
import CodeBlock from '@/components/CodeBlock';
import BugImpactPanel from '@/components/BugImpactPanel';

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedBug, setExpandedBug] = useState(null);
  const [copiedFix, setCopiedFix] = useState(null);

  const bugLines = useMemo(() => {
    const lines = new Set();
    (report?.bugs || []).forEach((bug) => {
      const raw = bug.line;
      if (!raw || raw === 'N/A') return;
      const matches = String(raw).match(/\d+/g);
      if (!matches) return;
      if (matches.length >= 2 && String(raw).includes('-')) {
        const start = parseInt(matches[0], 10);
        const end = parseInt(matches[1], 10);
        for (let i = start; i <= end; i++) lines.add(i);
      } else {
        matches.forEach((m) => lines.add(parseInt(m, 10)));
      }
    });
    return lines;
  }, [report]);

  useEffect(() => {
    let active = true;
    let timer;
    const run = async () => {
      try {
        const data = await db.entities.BugReport.get(id);
        if (!active) return;
        const me = await db.auth.me().catch(() => null);
        if (!active) return;
        if (me && data.created_by_id && data.created_by_id !== me.id) {
          setReport(false);
          return;
        }
        setReport(data);
        if (data.status === 'analyzing') {
          timer = setTimeout(run, 3000);
        }
      } catch {
        if (active) setReport(false);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; clearTimeout(timer); };
  }, [id]);

  const copyFix = (fix, index) => {
    navigator.clipboard.writeText(fix);
    setCopiedFix(index);
    setTimeout(() => setCopiedFix(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (report === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Bug className="w-10 h-10 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-4">Report not found.</p>
        <Link to="/dashboard" className="text-primary font-medium text-sm hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  if (report.status === 'analyzing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium mb-1">Analyzing your code...</p>
        <p className="text-sm text-muted-foreground">BugSweep is scanning for bugs, vulnerabilities, and issues.</p>
      </div>
    );
  }

  const counts = report.severity_counts || { critical: 0, warning: 0, info: 0 };
  const bugs = report.bugs || [];
  const sortedBugs = [...bugs].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity] || 3) - (order[b.severity] || 3);
  });

  const healthColor = report.health_score >= 80 ? 'text-accent' : report.health_score >= 50 ? 'text-chart-3' : 'text-destructive';
  const healthBg = report.health_score >= 80 ? 'bg-accent' : report.health_score >= 50 ? 'bg-chart-3' : 'bg-destructive';

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 capitalize font-mono">{report.source_type}</span>
            {report.language && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border font-mono">{report.language}</span>}
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-3 flex items-center gap-2 flex-wrap">
            <span className="text-accent font-mono text-base">bugsweep@report:~$</span>
            <span>{report.title}</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm">{report.summary || 'No summary available.'}</p>
          <div className="mt-5">
            <TagManager report={report} onUpdate={setReport} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Health score */}
          <div className="relative p-5 rounded-xl border border-border bg-card/40 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-mono text-muted-foreground/40">#01</span>
            </div>
            <p className={`font-display text-3xl font-bold font-mono ${healthColor}`}>{report.health_score ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">Health Score</p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${healthBg} rounded-full transition-all`} style={{ width: `${report.health_score || 0}%` }} />
            </div>
          </div>
          {/* Critical */}
          <div className="relative p-5 rounded-xl border border-border bg-card/40 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <Bug className="w-5 h-5 text-destructive" />
              <span className="text-[10px] font-mono text-muted-foreground/40">#02</span>
            </div>
            <p className="font-display text-3xl font-bold text-destructive font-mono">{counts.critical}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">Critical</p>
          </div>
          {/* Warning */}
          <div className="relative p-5 rounded-xl border border-border bg-card/40 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-chart-3/40 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle className="w-5 h-5 text-chart-3" />
              <span className="text-[10px] font-mono text-muted-foreground/40">#03</span>
            </div>
            <p className="font-display text-3xl font-bold text-chart-3 font-mono">{counts.warning}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">Warnings</p>
          </div>
          {/* Info */}
          <div className="relative p-5 rounded-xl border border-border bg-card/40 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-chart-5/40 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <Info className="w-5 h-5 text-chart-5" />
              <span className="text-[10px] font-mono text-muted-foreground/40">#04</span>
            </div>
            <p className="font-display text-3xl font-bold text-chart-5 font-mono">{counts.info}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">Info</p>
          </div>
        </div>

        {/* Bugs list */}
        {sortedBugs.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-border bg-card/30">
            <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-4" />
            <p className="text-lg font-medium mb-1">No bugs found!</p>
            <p className="text-sm text-muted-foreground">Your code looks clean. Great job!</p>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-accent font-mono text-sm">bugsweep@report:~$</span>
              <span>issues --list ({sortedBugs.length})</span>
            </h2>
            <div className="space-y-3">
              {sortedBugs.map((bug, index) => {
                const config = SEVERITY_CONFIG[bug.severity] || SEVERITY_CONFIG.info;
                const isOpen = expandedBug === index;
                return (
                  <div key={index} className={`rounded-xl border bg-card/40 overflow-hidden transition-all ${isOpen ? 'border-primary/30' : 'border-border'}`}>
                    <button
                      onClick={() => setExpandedBug(isOpen ? null : index)}
                      className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-card/20 transition"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className={`w-2 h-2 rounded-full ${config.dot} mt-1.5 shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">{bug.title}</h3>
                            <SeverityBadge severity={bug.severity} />
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{bug.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {bug.category && <span className="px-2 py-0.5 rounded-md bg-secondary">{bug.category}</span>}
                            {bug.line && bug.line !== 'N/A' && <span className="font-mono">Line {bug.line}</span>}
                          </div>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-0 border-t border-border/50">
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-accent flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              Recommended Fix
                            </h4>
                            <button
                              onClick={() => copyFix(bug.fix, index)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border hover:bg-secondary transition"
                            >
                              {copiedFix === index ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedFix === index ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div className="p-4 rounded-lg bg-background/50 border border-border">
                            <p className="text-sm font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">{bug.fix}</p>
                          </div>
                        </div>
                        <BugImpactPanel impact={bug.impact} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Code comparison */}
        {report.source_type !== 'url' && report.source_content && (
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold mb-1 flex items-center gap-2 flex-wrap">
              <span className="text-accent font-mono text-sm">bugsweep@report:~$</span>
              <span>diff --compare</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-4 font-mono">original (mistakes highlighted) vs. ai-corrected</p>
            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  Analyzed Code
                </div>
                <CodeBlock code={report.source_content} highlightLines={bugLines} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                  Corrected Code
                </div>
                <CodeBlock code={report.corrected_code || ''} accent />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}