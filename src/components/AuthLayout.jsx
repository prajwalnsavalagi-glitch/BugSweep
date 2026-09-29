import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/15 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5 font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Terminal window */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl glow">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 h-10 border-b border-border bg-secondary/50">
            <span className="w-3 h-3 rounded-full bg-destructive/80" />
            <span className="w-3 h-3 rounded-full bg-chart-3/80" />
            <span className="w-3 h-3 rounded-full bg-accent/80" />
            <span className="ml-3 text-xs font-mono text-muted-foreground select-none">bugsweep@auth:~$</span>
          </div>

          {/* Body */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 border border-primary/20">
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground mt-0.5 font-mono">{subtitle}</p>}
              </div>
            </div>
            {children}
          </div>
        </div>

        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6 font-mono">{footer}</p>
        )}
      </div>
    </div>
  );
}