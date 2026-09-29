import { jsPDF } from 'jspdf';

export function exportReportsAsCSV(reports) {
  const headers = ['Title', 'Source Type', 'Language', 'Status', 'Health Score', 'Critical', 'Warning', 'Info', 'Tags', 'Created Date', 'Summary'];
  const rows = reports.map((r) => {
    const sc = r.severity_counts || {};
    return [
      escapeCSV(r.title || ''),
      r.source_type || '',
      r.language || '',
      r.status || '',
      r.health_score ?? '',
      sc.critical || 0,
      sc.warning || 0,
      sc.info || 0,
      (r.tags || []).join('; '),
      r.created_date ? new Date(r.created_date).toISOString() : '',
      escapeCSV(r.summary || ''),
    ];
  });
  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  downloadFile(csv, `bugsweep-reports-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

export function exportReportsAsPDF(reports) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('BugSweep Report Export', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(120);
  doc.text(`${reports.length} report(s) — ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
  y += 12;
  doc.setTextColor(0);

  reports.forEach((r, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const sc = r.severity_counts || {};
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(`${idx + 1}. ${truncate(r.title || 'Untitled', 70)}`, 14, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80);
    doc.text(`Type: ${r.source_type || '-'}  |  Language: ${r.language || '-'}  |  Health: ${r.health_score ?? '-'}/100  |  Date: ${r.created_date ? new Date(r.created_date).toLocaleDateString() : '-'}`, 14, y);
    y += 5;
    doc.text(`Bugs: ${sc.critical || 0} critical, ${sc.warning || 0} warning, ${sc.info || 0} info${r.tags?.length ? '  |  Tags: ' + r.tags.join(', ') : ''}`, 14, y);
    y += 6;

    if (r.summary) {
      doc.setTextColor(100);
      const lines = doc.splitTextToSize(`Summary: ${r.summary}`, pageWidth - 28);
      doc.text(lines, 14, y);
      y += lines.length * 4 + 2;
    }

    const bugs = r.bugs || [];
    if (bugs.length) {
      doc.setTextColor(0);
      bugs.slice(0, 5).forEach((bug) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.setFont(undefined, 'bold');
        doc.text(`  [${(bug.severity || 'info').toUpperCase()}] ${truncate(bug.title || '', 60)}`, 14, y);
        y += 4;
        doc.setFont(undefined, 'normal');
        doc.setTextColor(120);
        const descLines = doc.splitTextToSize(`     ${truncate(bug.description || '', 100)}`, pageWidth - 35);
        doc.text(descLines, 14, y);
        y += descLines.length * 4;
        if (bug.fix) {
          const fixLines = doc.splitTextToSize(`     Fix: ${truncate(bug.fix, 90)}`, pageWidth - 35);
          doc.text(fixLines, 14, y);
          y += fixLines.length * 4;
        }
        y += 2;
        doc.setTextColor(0);
      });
      if (bugs.length > 5) {
        doc.setTextColor(120);
        doc.text(`  ...and ${bugs.length - 5} more issue(s)`, 14, y);
        y += 5;
      }
    }
    y += 4;
    doc.setDrawColor(220);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;
  });

  doc.save(`bugsweep-reports-${new Date().toISOString().split('T')[0]}.pdf`);
}

function escapeCSV(val) {
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}