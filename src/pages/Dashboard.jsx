const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Bug, AlertTriangle, Info, Activity, Loader2, Search, ChevronRight, Trash2, Download, X, CheckSquare, Square, Tag, FileText, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

import { exportReportsAsCSV, exportReportsAsPDF } from '@/utils/exportUtils';
import HealthGauge from '@/components/HealthGauge';
import AdSlot from '@/components/AdSlot';
import Typewriter from '@/components/Typewriter';
import { runScan } from '@/utils/runScan';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AVAILABLE_TAGS = ['security', 'performance', 'logic', 'syntax', 'best-practice', 'github', 'urgent', 'reviewed'];

export default function Dashboard() {
  const [reports, setReports] = useState(null);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [activeTag, setActiveTag] = useState('all');
  const [exportMenu, setExportMenu] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rescanningId, setRescanningId] = useState(null);
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => setReports([]));
  }, []);

  useEffect(() => {
    if (user) loadReports();
  }, [user]);

  const loadReports = async () => {
    try {
      const data = await db.entities.BugReport.filter({ created_by_id: user.id }, '-created_date', 50);
      setReports(data);
    } catch {
      setReports([]);
    }
  };

  // Collect all tags used across reports
  const allTags = useMemo(() => {
    const tagSet = new Set();
    (reports || []).forEach((r) => (r.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [reports]);

  const filtered = useMemo(() => {
    let result = reports ? reports.filter((r) => r.title?.toLowerCase().includes(search.toLowerCase())) : [];
    if (activeTag !== 'all') {
      result = result.filter((r) => (r.tags || []).includes(activeTag));
    }
    return result;
  }, [reports, search, activeTag]);

  const totalCritical = reports?.reduce((sum, r) => sum + (r.severity_counts?.critical || 0), 0) || 0;
  const totalWarning = reports?.reduce((sum, r) => sum + (r.severity_counts?.warning || 0), 0) || 0;
  const totalInfo = reports?.reduce((sum, r) => sum + (r.severity_counts?.info || 0), 0) || 0;

  const avgHealth = useMemo(() => {
    const completed = (reports || []).filter((r) => r.status === 'completed' && r.health_score != null);
    if (completed.length === 0) return null;
    return Math.round(completed.reduce((sum, r) => sum + r.health_score, 0) / completed.length);
  }, [reports]);

  const trendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ date: d, label: d.toLocaleDateString('en', { weekday: 'short' }), critical: 0, warning: 0, info: 0, total: 0 });
    }
    (reports || []).forEach((r) => {
      const rd = new Date(r.created_date);
      rd.setHours(0, 0, 0, 0);
      const day = days.find((d) => d.date.getTime() === rd.getTime());
      if (day) {
        day.critical += r.severity_counts?.critical || 0;
        day.warning += r.severity_counts?.warning || 0;
        day.info += r.severity_counts?.info || 0;
        day.total += (r.severity_counts?.critical || 0) + (r.severity_counts?.warning || 0) + (r.severity_counts?.info || 0);
      }
    });
    return days;
  }, [reports]);

  const stats = [
    { label: 'Total Scans', value: reports?.length || 0, icon: Activity, color: 'text-primary' },
    { label: 'Critical Bugs', value: totalCritical, icon: Bug, color: 'text-destructive' },
    { label: 'Warnings', value: totalWarning, icon: AlertTriangle, color: 'text-chart-3' },
    { label: 'Info', value: totalInfo, icon: Info, color: 'text-chart-5' },
  ];

  const totalBugs = totalCritical + totalWarning + totalInfo;
  const donutData = useMemo(() => ([
    { name: 'Critical', value: totalCritical, color: 'hsl(var(--destructive))' },
    { name: 'Warning', value: totalWarning, color: 'hsl(var(--chart-3))' },
    { name: 'Info', value: totalInfo, color: 'hsl(var(--chart-5))' },
  ]), [totalCritical, totalWarning, totalInfo]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const handleRescan = async (report) => {
    setRescanningId(report.id);
    try {
      const newId = await runScan({
        sourceType: report.source_type,
        content: report.source_content,
        tags: report.tags || [],
        title: report.title,
      });
      navigate(`/reports/${newId}`);
    } catch {
      setRescanningId(null);
    }
  };

  const handleBulkDelete = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await db.entities.BugReport.deleteMany({ id: { $in: Array.from(selected) } });
      setSelected(new Set());
      await loadReports();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const getSelectedReports = () => (reports || []).filter((r) => selected.has(r.id));

  const handleExportCSV = () => {
    exportReportsAsCSV(getSelectedReports());
    setExportMenu(false);
  };

  const handleExportPDF = () => {
    exportReportsAsPDF(getSelectedReports());
    setExportMenu(false);
  };

  // Keyboard shortcuts: / focus search, n new scan, a select all, Esc clear
  useEffect(() => {
    const handler = (e) => {
      const el = e.target;
      const isTyping = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === 'Escape') {
        if (selected.size > 0) setSelected(new Set());
        return;
      }
      if (isTyping) return;
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === 'n') {
        navigate('/analyzer');
      } else if (e.key.toLowerCase() === 'a') {
        toggleSelectAll();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, selected, filtered]);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-1 flex items-center gap-2 flex-wrap">
              <span className="text-accent font-mono text-base">bugsweep@dashboard:~$</span>
              <Typewriter
                text={`welcome${user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}`}
                speed={55}
                className="font-display"
              />
            </h1>
            <p className="text-muted-foreground font-mono text-sm">your bug scan history &amp; project health</p>
          </div>
          <Link
            to="/analyzer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            New Scan
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="relative p-5 rounded-xl border border-border bg-card/40 overflow-hidden hover:border-primary/40 transition group">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${s.color}`} />
                  <span className="text-[10px] font-mono text-muted-foreground/40">#{String(i + 1).padStart(2, '0')}</span>
                </div>
                <p className="font-display text-3xl font-bold font-mono">{reports === null ? '—' : s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Trend + insights */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Trend graph */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card/40 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="flex items-center justify-between mb-5 gap-4">
            <div>
              <h2 className="font-display font-semibold text-lg flex items-center gap-2 flex-wrap">
                <span className="text-accent font-mono text-sm">bugsweep@dashboard:~$</span>
                <Typewriter text="trend --7d" speed={60} startDelay={300} className="font-display" />
              </h2>
              <p className="text-sm text-muted-foreground font-mono">track project health over time</p>
            </div>
            {avgHealth != null && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-mono">avg health</p>
                  <p className="font-display font-bold text-lg" style={{ color: avgHealth >= 80 ? 'hsl(var(--accent))' : avgHealth >= 50 ? 'hsl(var(--chart-3))' : 'hsl(var(--destructive))' }}>{avgHealth}/100</p>
                </div>
                <div className="hidden sm:block">
                  <HealthGauge score={avgHealth} />
                </div>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  fontSize: '0.8rem',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              />
              <Bar dataKey="critical" stackId="a" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} maxBarSize={48} />
              <Bar dataKey="warning" stackId="a" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} maxBarSize={48} />
              <Bar dataKey="info" stackId="a" fill="hsl(var(--chart-5))" radius={[3, 3, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-4 text-xs font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-chart-3" /> Warning</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-chart-5" /> Info</span>
          </div>
        </div>

        {/* Insights donut */}
        <div className="p-6 rounded-xl border border-border bg-card/40 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          <div className="mb-4">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2 flex-wrap">
              <span className="text-accent font-mono text-sm">bugsweep@dashboard:~$</span>
              <Typewriter text="insights --dist" speed={55} startDelay={400} className="font-display" />
            </h2>
            <p className="text-sm text-muted-foreground font-mono">severity distribution</p>
          </div>
          {totalBugs === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground font-mono">no bugs detected · all clean</div>
          ) : (
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none">
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '0.8rem' }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-display text-2xl font-bold font-mono">{totalBugs}</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">total bugs</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-chart-3" /> Warning</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-chart-5" /> Info</span>
          </div>
        </div>
        </div>

        {/* Ad */}
        <div className="mb-6">
          <AdSlot />
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <button
              onClick={() => setActiveTag('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeTag === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize ${
                  activeTag === tag ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Search + bulk actions */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-border bg-card/40 text-sm focus:outline-none focus:border-primary/50 transition"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-border bg-secondary text-[10px] font-mono text-muted-foreground">/</kbd>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">{selected.size} selected</span>
              <div className="relative">
                <button
                  onClick={() => setExportMenu(!exportMenu)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card/40 text-sm font-medium hover:bg-card transition"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:block">Export</span>
                </button>
                {exportMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExportMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
                      <button onClick={handleExportCSV} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary transition text-left">
                        <FileSpreadsheet className="w-4 h-4 text-accent" />
                        Export as CSV
                      </button>
                      <button onClick={handleExportPDF} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary transition text-left">
                        <FileText className="w-4 h-4 text-primary" />
                        Export as PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/20 transition disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span className="hidden sm:block">Delete</span>
              </button>
              <button onClick={clearSelection} className="p-2.5 rounded-xl border border-border bg-card/40 text-muted-foreground hover:text-foreground transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Reports list */}
        {reports === null ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-border bg-card/30">
            <Bug className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{reports.length === 0 ? 'No scans yet.' : 'No reports match your filters.'}</p>
            {reports.length === 0 && (
              <Link to="/analyzer" className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline">
                Run your first scan <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition mb-2"
            >
              {selected.size === filtered.length && filtered.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selected.size === filtered.length && filtered.length > 0 ? 'Deselect all' : 'Select all'}
            </button>
            <div className="space-y-3">
              {filtered.map((report) => {
                const isSelected = selected.has(report.id);
                return (
                  <div
                    key={report.id}
                    className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      isSelected ? 'border-primary/40 bg-primary/5' : 'border-border bg-card/40 hover:bg-card/70 hover:border-primary/30'
                    }`}
                  >
                    <button onClick={() => toggleSelect(report.id)} className="shrink-0 p-1">
                      {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground hover:text-foreground transition" />}
                    </button>
                    <Link to={`/reports/${report.id}`} className="flex items-center justify-between min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <h3 className="font-medium truncate">{report.title}</h3>
                          {report.status === 'analyzing' && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-chart-5/15 text-chart-5 border border-chart-5/30">Analyzing</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="capitalize">{report.source_type}</span>
                          {report.language && <span className="font-mono">{report.language}</span>}
                          <span>{new Date(report.created_date).toLocaleDateString()}</span>
                          {report.health_score != null && report.status === 'completed' && (
                            <span className={`font-semibold ${report.health_score >= 80 ? 'text-accent' : report.health_score >= 50 ? 'text-chart-3' : 'text-destructive'}`}>
                              Score: {report.health_score}
                            </span>
                          )}
                          {report.tags && report.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {report.tags.map((tag) => (
                                <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground capitalize">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {report.severity_counts && report.status === 'completed' && (
                          <div className="flex items-center gap-2 text-xs">
                            {report.severity_counts.critical > 0 && (
                              <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive font-mono">{report.severity_counts.critical}C</span>
                            )}
                            {report.severity_counts.warning > 0 && (
                              <span className="px-2 py-1 rounded-md bg-chart-3/10 text-chart-3 font-mono">{report.severity_counts.warning}W</span>
                            )}
                            {report.severity_counts.info > 0 && (
                              <span className="px-2 py-1 rounded-md bg-chart-5/10 text-chart-5 font-mono">{report.severity_counts.info}I</span>
                            )}
                            {report.severity_counts.critical === 0 && report.severity_counts.warning === 0 && report.severity_counts.info === 0 && (
                              <span className="px-2 py-1 rounded-md bg-accent/10 text-accent font-mono">Clean</span>
                            )}
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRescan(report); }}
                          disabled={rescanningId === report.id}
                          title="Re-scan"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition disabled:opacity-50"
                        >
                          {rescanningId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete {selected.size} report{selected.size === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected scan{selected.size === 1 ? '' : 's'} from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}