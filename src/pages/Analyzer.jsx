const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Globe, FolderGit2, ScanSearch, Loader2, AlertCircle, Sparkles, Activity, Shield, Tag, X } from 'lucide-react';
import { SeverityBadge } from '@/components/SeverityBadge';
import AdSlot from '@/components/AdSlot';
import { runScan } from '@/utils/runScan';
import ProjectDropZone from '@/components/ProjectDropZone';

const SUGGESTED_TAGS = ['urgent', 'feature-request', 'minor-fix', 'security', 'performance', 'reviewed'];

const EXAMPLES = [
  { label: 'JS · off-by-one', code: 'function sum(arr) {\n  let total = 0;\n  for (let i = 0; i <= arr.length; i++) {\n    total += arr[i];\n  }\n  return total;\n}' },
  { label: 'Python · SQL injection', code: 'import sqlite3\n\ndef get_user(name):\n  conn = sqlite3.connect("db.sqlite")\n  cur = conn.cursor()\n  cur.execute("SELECT * FROM users WHERE name = \'" + name + "\'")\n  return cur.fetchone()' },
  { label: 'JS · async bug', code: 'async function fetchAll(urls) {\n  const results = [];\n  for (const url of urls) {\n    const res = await fetch(url);\n    results.push(res.json());\n  }\n  return results;\n}' },
];

const SOURCE_TYPES = [
  { value: 'code', label: 'Code Snippet', icon: Code2, placeholder: 'Paste your code here...\n\nfunction example() {\n  const data = [];\n  for (let i = 0; i <= data.length; i++) {\n    console.log(data[i]);\n  }\n}' },
  { value: 'url', label: 'Website URL', icon: Globe, placeholder: 'https://example.com' },
  { value: 'project', label: 'Project Code', icon: FolderGit2, placeholder: 'Paste your project code or multiple files here...' },
];

export default function Analyzer() {
  const navigate = useNavigate();
  const [sourceType, setSourceType] = useState('code');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const currentType = SOURCE_TYPES.find((t) => t.value === sourceType);

  const handleAnalyze = async () => {
    setError('');
    if (!content.trim()) {
      setError('Please enter code or a URL to analyze.');
      return;
    }

    setLoading(true);
    try {
      const id = await runScan({ sourceType, content, tags });
      navigate(`/reports/${id}`);
    } catch (err) {
      setError('Analysis failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">New Bug Scan</h1>
          <p className="text-muted-foreground">Paste code or enter a URL — BugSweep's AI will find bugs and suggest fixes.</p>
        </div>

        <AdSlot className="mb-6" />

        {/* Source type selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {SOURCE_TYPES.map((type) => {
            const Icon = type.icon;
            const active = sourceType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => { setSourceType(type.value); setContent(''); setError(''); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input area */}
        {sourceType === 'project' ? (
          <ProjectDropZone onChange={setContent} />
        ) : (
          <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span className="font-mono">{currentType.label}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{content.length} chars</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={currentType.placeholder}
              className="w-full h-80 p-5 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none scrollbar-thin"
              spellCheck={false}
            />
          </div>
        )}

        {/* Examples */}
        {sourceType === 'code' && !content && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-mono">try an example:</span>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setContent(ex.code); setError(''); }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-destructive flex-wrap">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tags */}
        <div className="mt-6">
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            Tags <span className="text-muted-foreground font-normal">(optional — categorize this scan)</span>
          </label>
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-card/40">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium capitalize">
                {tag}
                <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault();
                  const t = tagInput.trim().toLowerCase();
                  if (!tags.includes(t)) setTags([...tags, t]);
                  setTagInput('');
                }
              }}
              placeholder={tags.length ? 'Add another...' : 'Type a tag and press Enter'}
              className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
              <button
                key={tag}
                onClick={() => setTags([...tags, tag])}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition capitalize"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Scan button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !content.trim()}
          className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed glow"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing for bugs...
            </>
          ) : (
            <>
              <ScanSearch className="w-5 h-5" />
              Analyze for Bugs
            </>
          )}
        </button>

        {loading && (
          <div className="mt-4 rounded-xl border border-border bg-card/40 overflow-hidden">
            <div className="flex items-center gap-2 px-4 h-9 border-b border-border bg-secondary/50">
              <span className="w-3 h-3 rounded-full bg-destructive/80" />
              <span className="w-3 h-3 rounded-full bg-chart-3/80" />
              <span className="w-3 h-3 rounded-full bg-accent/80" />
              <span className="ml-3 text-xs font-mono text-muted-foreground">bugsweep@scan:~$ analyzing...</span>
            </div>
            <div className="p-5 font-mono text-sm space-y-1">
              <p className="text-muted-foreground"><span className="text-accent">$</span> parsing input...</p>
              <p className="text-chart-5">✓ syntax tree built</p>
              <p className="text-muted-foreground">→ running AI detection<span className="animate-pulse">▋</span></p>
            </div>
          </div>
        )}

        {/* Feature hints */}
        {!loading && !content && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Sparkles, title: 'AI Detection', desc: 'Finds logic, syntax, and security bugs' },
              { icon: Shield, title: 'Security Checks', desc: 'Flags vulnerabilities and bad practices' },
              { icon: Activity, title: 'Health Score', desc: 'Get a 0–100 code quality score' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-4 rounded-xl border border-border bg-card/30 flex items-start gap-3">
                  <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}