import React from 'react';

export const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    badge: 'bg-destructive/15 text-destructive border-destructive/30',
    dot: 'bg-destructive',
    glow: 'shadow-destructive/20',
  },
  warning: {
    label: 'Warning',
    badge: 'bg-chart-3/15 text-chart-3 border-chart-3/30',
    dot: 'bg-chart-3',
    glow: 'shadow-chart-3/20',
  },
  info: {
    label: 'Info',
    badge: 'bg-chart-5/15 text-chart-5 border-chart-5/30',
    dot: 'bg-chart-5',
    glow: 'shadow-chart-5/20',
  },
};

export function SeverityBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}