import React, { useState, useRef } from 'react';
import { UploadCloud, FolderOpen, FileCode2, X, FilePlus2 } from 'lucide-react';

const CODE_EXT = [
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'css', 'scss', 'sass', 'less',
  'html', 'xml', 'svg', 'md', 'mdx', 'txt', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
  'cc', 'rs', 'go', 'rb', 'php', 'sh', 'bash', 'yml', 'yaml', 'toml', 'ini', 'env',
  'sql', 'vue', 'svelte', 'astro', 'swift', 'kt', 'scala', 'lua', 'pl', 'r', 'dart',
  'gradle', 'gitignore', 'dockerfile', 'makefile', 'prettierrc', 'eslintrc', 'editorconfig',
];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.cache', '.vscode', '.idea', '__pycache__', '.venv', 'venv', 'target', '.turbo'];
const MAX_FILES = 100;
const MAX_TOTAL = 600 * 1024;
const MAX_FILE = 100 * 1024;

const hasCodeExt = (name) => {
  const base = name.split('/').pop();
  const ext = base.includes('.') ? base.split('.').pop().toLowerCase() : base.toLowerCase();
  return CODE_EXT.includes(ext);
};
const isIgnored = (path) => IGNORE_DIRS.some((d) => path.split('/').includes(d));

function readText(file) {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(typeof fr.result === 'string' ? fr.result : null);
    fr.onerror = () => resolve(null);
    fr.readAsText(file);
  });
}

function traverseEntry(entry, path, out) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => { out.push({ file, path: path + entry.name }); resolve(); }, () => resolve());
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (!entries.length) return resolve();
          await Promise.all(entries.map((e) => traverseEntry(e, path + entry.name + '/', out)));
          readBatch();
        }, () => resolve());
      };
      readBatch();
    } else {
      resolve();
    }
  });
}

export default function ProjectDropZone({ onChange }) {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [warning, setWarning] = useState('');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const dragCounter = useRef(0);

  const build = (list) => {
    const combined = list.map((f) => `// ===== file: ${f.path} =====\n${f.content}`).join('\n\n');
    onChange(combined);
  };

  const ingest = async (rawFiles) => {
    setWarning('');
    const accepted = [];
    let total = files.reduce((s, f) => s + f.size, 0);
    let skipped = 0;

    for (const { file, path } of rawFiles) {
      if (accepted.length + files.length >= MAX_FILES) { setWarning(`Reached the ${MAX_FILES}-file limit.`); break; }
      const p = path || file.name;
      if (isIgnored(p) || !hasCodeExt(p) || file.size > MAX_FILE) { skipped++; continue; }
      if (total + file.size > MAX_TOTAL) { setWarning('Total size limit reached (600 KB). Some files were skipped.'); break; }
      const content = await readText(file);
      if (content == null) { skipped++; continue; }
      accepted.push({ path: p, content, size: file.size });
      total += file.size;
    }

    if (accepted.length === 0) {
      if (skipped > 0) setWarning('No readable code files found in the selection.');
      return;
    }
    const next = [...files, ...accepted];
    setFiles(next);
    build(next);
  };

  const handleFileInput = (e) => {
    const list = Array.from(e.target.files || []).map((file) => ({
      file,
      path: file.webkitRelativePath || file.name,
    }));
    ingest(list);
    e.target.value = '';
  };

  const onDrop = async (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const items = e.dataTransfer.items;
    const collected = [];
    if (items && items.length && items[0].webkitGetAsEntry) {
      const entries = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
      await Promise.all(entries.map((entry) => traverseEntry(entry, '', collected)));
    } else {
      Array.from(e.dataTransfer.files || []).forEach((file) => collected.push({ file, path: file.name }));
    }
    ingest(collected);
  };

  const remove = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    build(next);
  };
  const clearAll = () => { setFiles([]); onChange(''); setWarning(''); };

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileCode2 className="w-4 h-4" />
          <span className="font-mono">Project Code</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{files.length} files · {(totalSize / 1024).toFixed(1)} KB</span>
      </div>

      <div
        onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setDragging(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => { dragCounter.current--; if (dragCounter.current <= 0) { setDragging(false); dragCounter.current = 0; } }}
        onDrop={onDrop}
        className={`m-4 rounded-xl border-2 border-dashed p-8 text-center transition ${dragging ? 'border-primary bg-primary/10' : 'border-border bg-background/30'}`}
      >
        <UploadCloud className={`w-8 h-8 mx-auto mb-3 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="text-sm font-medium mb-1">Drag &amp; drop files or a folder here</p>
        <p className="text-xs text-muted-foreground mb-4 font-mono">code files only · node_modules, .git, dist auto-skipped</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card/60 text-sm font-medium hover:bg-card transition">
            <FilePlus2 className="w-4 h-4" /> Select files
          </button>
          <button onClick={() => folderInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card/60 text-sm font-medium hover:bg-card transition">
            <FolderOpen className="w-4 h-4" /> Select folder
          </button>
        </div>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} />
        <input ref={folderInputRef} type="file" className="hidden" onChange={handleFileInput} webkitdirectory="" directory="" />
      </div>

      {warning && <p className="px-5 pb-2 text-xs text-chart-3 font-mono">{warning}</p>}

      {files.length > 0 && (
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Selected files</span>
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive transition font-mono">clear all</button>
          </div>
          <div className="max-h-56 overflow-y-auto scrollbar-thin space-y-1.5">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background/40">
                <FileCode2 className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-xs font-mono truncate flex-1">{f.path}</span>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}