import React from 'react';

export default function CodeBlock({ code, highlightLines, accent = false }) {
  if (!code) {
    return (
      <div className={`rounded-xl border bg-background/50 p-4 text-sm text-muted-foreground font-mono ${accent ? 'border-accent/30' : 'border-border'}`}>
        No corrected code available for this scan.
      </div>
    );
  }

  const lines = code.split('\n');
  const hl = highlightLines || new Set();

  return (
    <div className={`rounded-xl border bg-background/50 overflow-hidden ${accent ? 'border-accent/30' : 'border-border'}`}>
      <div className="overflow-x-auto scrollbar-thin">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          {lines.map((line, i) => {
            const lineNum = i + 1;
            const isHl = hl.has(lineNum);
            return (
              <div key={i} className={`flex ${isHl ? 'bg-destructive/15 -mx-4 px-4' : ''}`}>
                <span className="select-none text-muted-foreground/40 w-10 shrink-0 text-right pr-3">{lineNum}</span>
                <span className="text-foreground/80 whitespace-pre">{line || ' '}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}