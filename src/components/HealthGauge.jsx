import React from 'react';

export default function HealthGauge({ score }) {
  const value = Math.max(0, Math.min(100, score || 0));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? 'hsl(var(--accent))' : value >= 50 ? 'hsl(var(--chart-3))' : 'hsl(var(--destructive))';
  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-2xl font-bold" style={{ color }}>{value}</p>
        <p className="text-[10px] text-muted-foreground font-mono">health</p>
      </div>
    </div>
  );
}