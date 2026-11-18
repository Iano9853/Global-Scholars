import React, { useState } from 'react';
import { GraduationCap, Menu, X } from 'lucide-react';
import { ActiveTab, UserProfile } from '../types/program';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  savedCount: number;
  user: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  savedCount,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string }[] = user
    ? [
        { id: 'dashboard', label: 'My Dashboard' },
        { id: 'student-portal', label: 'Student Portal' },
        { id: 'browse', label: 'Browse Programs' },
        { id: 'visa-guides', label: 'Visa & Work Guides' },
        { id: 'document-vault', label: 'Document Vault' },
      ]
    : [
        { id: 'browse', label: 'Browse Programs' },
        { id: 'student-portal', label: 'Student Portal' },
        { id: 'visa-guides', label: 'Visa & Work Guides' },
        { id: 'how-it-works', label: 'How It Works' },
        { id: 'document-vault', label: 'Document Vault' },
      ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand Mark */}
        <button
          type="button"
          onClick={() => handleNavClick(user ? 'dashboard' : 'browse')}
          className="flex items-center gap-2 text-left whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340] rounded-md cursor-pointer"
        >
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0C2340] text-white flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-[1.03]">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <span className="font-display font-bold text-[14px] sm:text-[16px] leading-tight tracking-tight text-[#0C2340]">
            ScholarWork Global
          </span>
        </button>

        {/* Zone 2: Primary Navigation (Desktop) */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative py-2 text-[14px] font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340] rounded cursor-pointer ${
                  isActive
                    ? 'text-[#0C2340] font-semibold'
                    : 'text-slate-600 hover:text-[#0C2340]'
                }`}
              >
                {item.label}
                {item.id === 'document-vault' && savedCount > 0 && (
                  <span className="ml-1.5 font-mono text-[12px] text-[#B46900] tabular-nums">
                    ({savedCount})
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-[#0C2340]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Auth Actions (Always Visible on Mobile, Tablet & Desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('dashboard')}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-medium text-[#0C2340] bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[140px] sm:max-w-none truncate"
              >
                {user.name.split(' ')[0]}
                {user.onboarding.passportCountry ? ` · ${user.onboarding.passportCountry}` : ''}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-medium text-slate-600 hover:text-[#0C2340] border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-semibold text-[#0C2340] bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-semibold text-white bg-[#0C2340] hover:bg-[#16365E] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign Up
              </button>
            </>
          )}

          {/* Mobile/Tablet Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-1.5 sm:p-2 text-slate-700 hover:text-[#0C2340] rounded-md border border-slate-200 shrink-0 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile/Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1.5 shadow-md">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-md text-[14px] font-medium flex items-center justify-between cursor-pointer ${
                activeTab === item.id
                  ? 'bg-[#0C2340] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{item.label}</span>
              {item.id === 'document-vault' && savedCount > 0 && (
                <span className="font-mono text-xs tabular-nums">({savedCount})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
