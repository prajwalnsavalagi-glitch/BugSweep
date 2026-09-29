const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';

const SUGGESTED = ['urgent', 'feature-request', 'minor-fix', 'security', 'performance', 'reviewed'];

export default function TagManager({ report, onUpdate }) {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const tags = report.tags || [];

  const save = async (next) => {
    setSaving(true);
    try {
      await db.entities.BugReport.update(report.id, { tags: next });
      onUpdate({ ...report, tags: next });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const addTag = (t) => {
    const clean = t.trim().toLowerCase();
    if (!clean || tags.includes(clean)) return;
    save([...tags, clean]);
    setInput('');
  };

  const removeTag = (t) => {
    save(tags.filter((x) => x !== t));
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        Tags
      </label>
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-card/40">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium capitalize">
            {tag}
            <button onClick={() => removeTag(tag)} disabled={saving} className="hover:opacity-70 disabled:opacity-30">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault();
              addTag(input);
            }
          }}
          placeholder={tags.length ? 'Add another...' : 'Type a tag and press Enter'}
          className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {SUGGESTED.filter((t) => !tags.includes(t)).map((tag) => (
          <button
            key={tag}
            onClick={() => addTag(tag)}
            disabled={saving}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition capitalize disabled:opacity-50"
          >
            + {tag}
          </button>
        ))}
      </div>
    </div>
  );
}