import React from 'react';
import { ShieldCheck, Terminal } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6 border-b border-surfaceHighlight bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              CodeGuard <span className="text-primary">AI</span>
            </h1>
            <p className="text-xs text-muted font-mono tracking-wider uppercase">Automated Performance & Security Auditor</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surfaceHighlight border border-surface">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span className="text-xs text-muted font-mono">SYSTEM ONLINE</span>
           </div>
           <a href="#" className="text-muted hover:text-white transition-colors">
            <Terminal className="w-5 h-5" />
           </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
