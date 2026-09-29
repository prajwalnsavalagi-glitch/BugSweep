const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import AdSlot from '@/components/AdSlot';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.auth
      .me()
      .then((me) => setUser(me))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">Settings</h1>
          <p className="text-muted-foreground">Your account details</p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40 mb-8">
          <h2 className="font-display font-semibold text-lg mb-4">Account</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
              {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium">{user?.full_name || 'User'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        <AdSlot />
      </div>
    </div>
  );
}