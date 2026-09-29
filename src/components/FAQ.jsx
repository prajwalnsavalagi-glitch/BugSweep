import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'How does BugSweep detect bugs?', a: 'BugSweep uses AI to analyze your code, URLs, or projects for syntax errors, logic bugs, security vulnerabilities, and best-practice violations — with line-level precision.' },
  { q: 'What languages are supported?', a: 'BugSweep supports 30+ languages including JavaScript, Python, TypeScript, Java, Go, Rust, HTML/CSS, and more.' },
  { q: 'Is my code stored?', a: 'Your scans are saved to your account so you can review history and trends. You can delete any report at any time.' },
  { q: 'Is BugSweep really free?', a: 'Yes — BugSweep is free to use and supported by ads. Run as many scans as you need, no subscription required.' },
  { q: 'How accurate is the AI?', a: 'BugSweep catches real bugs with high accuracy and provides actionable fixes, but always review suggestions before applying them to production.' },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Questions? <span className="gradient-text">We've got answers</span></h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="rounded-xl border border-border bg-card/40 overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-medium font-mono text-sm">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}