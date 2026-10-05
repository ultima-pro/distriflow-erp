import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import {
  Menu,
  Cloud,
  HardDrive,
  LogOut,
  User as UserIcon,
  PlusCircle,
  ShieldCheck,
  Briefcase,
  Database,
  RefreshCw,
} from 'lucide-react';
import { DatabaseConfigModal } from '../settings/DatabaseConfigModal';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const { currentUser, isOwner, logout } = useAuth();
  const { setActiveTab, isUsingSupabase, refreshData, isLoading, companyProfile } = useErp();
  const [showDbModal, setShowDbModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-xs">
        {/* Left side: Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            {companyProfile.logoUrl ? (
              <img
                src={companyProfile.logoUrl}
                alt="Logo"
                className="w-9 h-9 object-contain rounded-xl border border-slate-200 bg-slate-50 p-0.5 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <span className="font-extrabold text-lg tracking-wider">
                  {companyProfile.companyName.charAt(0)}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 tracking-tight text-lg leading-none truncate max-w-[220px]">
                  {companyProfile.companyName}
                </span>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase border border-slate-200">
                  ERP
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium leading-none block mt-0.5 truncate max-w-[240px]">
                {companyProfile.tagline || 'Distribution Management'}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud vs Local DataSource Status */}
          <button
            onClick={() => setShowDbModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isUsingSupabase
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
            title="Configure Cloud Database Connection"
          >
            {isUsingSupabase ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="hidden md:inline">Supabase Cloud</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Local Storage</span>
              </>
            )}
            <Database className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Quick Refresh */}
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
            title="Refresh ERP Records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Quick + New Order Button */}
          <button
            onClick={() => setActiveTab('new-order')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl shadow-xs transition-all min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Order</span>
          </button>

          {/* User Account / Role dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px]"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                  isOwner ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'
                } shadow-sm`}
              >
                {currentUser?.fullName.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.fullName || 'User'}
                </p>
                <div className="flex items-center gap-1">
                  {isOwner ? (
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                  ) : (
                    <Briefcase className="w-3 h-3 text-blue-600" />
                  )}
                  <span className="text-[10px] font-semibold text-slate-500 tracking-wider">
                    {currentUser?.role}
                  </span>
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-sm animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">{currentUser?.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.email || `@${currentUser?.username}`}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    Role: {currentUser?.role}
                  </span>
                </div>

                {isOwner && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setActiveTab('settings');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 font-semibold"
                  >
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    Company Settings & ERP Admin
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowDbModal(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Database className="w-4 h-4 text-slate-500" />
                  Database & Cloud Settings
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Switch User / Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cloud Database Config Modal */}
      {showDbModal && <DatabaseConfigModal onClose={() => setShowDbModal(false)} />}
    </>
  );
};
