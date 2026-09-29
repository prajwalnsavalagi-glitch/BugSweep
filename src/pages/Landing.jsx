const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bug, ScanSearch, ShieldCheck, Code2, Globe, ArrowRight, Check, GitBranch, Lightbulb, Gauge, Terminal, LogOut } from 'lucide-react';

import FAQ from '@/components/FAQ';
import AdSlot from '@/components/AdSlot';

const features = [
  { icon: Code2, title: 'Code Analysis', desc: 'Paste any code snippet — get instant bug detection across 30+ languages with line-level precision.' },
  { icon: Globe, title: 'URL Scanning', desc: 'Enter a website URL and BugSweep analyzes the page for errors, vulnerabilities, and issues.' },
  { icon: Lightbulb, title: 'AI Fix Suggestions', desc: 'Every detected bug comes with a clear, actionable fix you can apply right away.' },
  { icon: ShieldCheck, title: 'Security Checks', desc: 'Identifies vulnerabilities, injection risks, and bad practices before they hit production.' },
  { icon: Gauge, title: 'Health Scoring', desc: 'Get a code health score from 0–100 so you know exactly how your project is doing.' },
  { icon: GitBranch, title: 'Project Wide', desc: 'Analyze entire projects — not just single files — to catch cross-file issues.' },
];

export default function Landing() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    db.auth.isAuthenticated().then(setAuthed);
  }, []);
  const handleSignOut = async () => {
    await db.auth.logout();
    window.location.href = '/';
  };
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Bug className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg">BugSweep</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            {authed ? (
              <>
                <Link to="/dashboard" className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition font-mono">~/dashboard</Link>
                <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition hidden sm:block">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition hidden sm:block">Sign in</Link>
                <Link to="/register" className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-accent/15 rounded-full blur-[100px]" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 text-xs font-medium text-muted-foreground mb-6 font-mono">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            bugsweep@platform:~$ scan --ai
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Find bugs. <span className="gradient-text">Fix them fast.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            BugSweep scans your code, apps, and websites to detect bugs, vulnerabilities, and bad practices — then gives you instant, actionable fixes powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={authed ? "/analyzer" : "/login?returnTo=/dashboard"} className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition glow font-mono">
              <ScanSearch className="w-5 h-5" />
              {authed ? "$ scan ./your-code" : "Scan Your Code Now"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent" /> no-credit-card</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent" /> 30+-languages</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent" /> instant-results</span>
          </div>

          {/* Terminal mockup */}
          <div className="mt-16 max-w-2xl mx-auto rounded-xl border border-border bg-card/80 overflow-hidden shadow-2xl glow text-left">
            <div className="flex items-center gap-2 px-4 h-9 border-b border-border bg-secondary/50">
              <span className="w-3 h-3 rounded-full bg-destructive/80" />
              <span className="w-3 h-3 rounded-full bg-chart-3/80" />
              <span className="w-3 h-3 rounded-full bg-accent/80" />
              <span className="ml-3 text-xs font-mono text-muted-foreground select-none">bugsweep@platform:~$ scan ./src</span>
            </div>
            <div className="p-5 font-mono text-sm leading-relaxed">
              <p className="text-muted-foreground"><span className="text-accent">$</span> bugsweep scan ./src --deep</p>
              <p className="text-muted-foreground mt-1">→ analyzing 24 files...</p>
              <p className="text-chart-5 mt-1">✓ syntax check passed</p>
              <p className="text-chart-3 mt-1">⚠ 3 warnings found</p>
              <p className="text-destructive mt-1">✕ 1 critical: SQL injection on line 42</p>
              <p className="text-accent mt-1">→ fix: use parameterized queries</p>
              <p className="text-muted-foreground mt-2"><span className="text-primary">health score: 78/100</span> <span className="text-accent">▋</span></p>
              <p className="text-muted-foreground mt-2 flex items-center"><span className="text-primary">$</span> <span className="ml-1.5 inline-block w-2 h-4 bg-primary animate-pulse" /></p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 px-6 border-y border-border/50 bg-card/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '50K+', label: 'bugs found' },
            { value: '30+', label: 'languages' },
            { value: '99.9%', label: 'accuracy' },
            { value: '<3s', label: 'avg scan time' },
          ].map((s, i) => (
            <div key={i}>
              <p className="font-display text-3xl md:text-4xl font-extrabold gradient-text font-mono">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1 font-mono">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-xs font-mono text-muted-foreground mb-5">
              <Terminal className="w-3.5 h-3.5 text-accent" />
              bugsweep@platform:~$ cat features
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Everything you need to <span className="gradient-text">ship clean code</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Powerful AI analysis that goes beyond simple linting — find real bugs, security issues, and get fixes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="group p-6 rounded-2xl border border-border bg-card/40 hover:bg-card/70 hover:border-primary/30 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-xs font-mono text-muted-foreground mb-5">
              <Terminal className="w-3.5 h-3.5 text-accent" />
              bugsweep@platform:~$ run --steps
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Three steps to <span className="gradient-text">bug-free code</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Paste or Upload', desc: 'Drop in your code snippet, paste a URL, or upload a project file.' },
              { step: '02', title: 'AI Analyzes', desc: 'BugSweep scans for bugs, vulnerabilities, and code quality issues instantly.' },
              { step: '03', title: 'Get Fixes', desc: 'Review detected issues with clear explanations and copy-ready fixes.' },
            ].map((s, i) => (
              <div key={i} className="relative p-7 rounded-2xl border border-border bg-card/40 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <span className="font-mono text-sm text-accent font-bold mb-3 block">$ {s.step}</span>
                <h3 className="font-display font-semibold text-xl mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <AdSlot />
        </div>
      </section>

      <FAQ />

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl border border-border bg-card/40 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Ready to <span className="gradient-text">sweep your bugs?</span></h2>
            <p className="text-lg text-muted-foreground mb-8">Join developers shipping cleaner code with BugSweep.</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition glow">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bug className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold">BugSweep</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 BugSweep. Find bugs. Fix them fast.</p>
        </div>
      </footer>
    </div>
  );
}