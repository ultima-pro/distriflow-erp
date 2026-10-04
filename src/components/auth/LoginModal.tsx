import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { Shield, Briefcase, Lock, User as UserIcon, Mail, Phone, ArrowRight } from 'lucide-react';
import { UserRole } from '../../types/erp';

export const LoginModal: React.FC = () => {
  const { login, registerUser } = useAuth();
  const { showToast } = useErp();

  const [isRegistering, setIsRegistering] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('OWNER');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!usernameOrEmail.trim() || !fullName.trim()) {
          throw new Error('Please fill in required username and full name');
        }
        await registerUser(usernameOrEmail.trim(), fullName.trim(), role, phone, email, password);
        showToast(`Account created for ${fullName}! Welcome to DistriFlow ERP.`, 'success');
      } else {
        if (!usernameOrEmail.trim() || !password) {
          throw new Error('Please enter your username/email and password');
        }
        await login(usernameOrEmail.trim(), password);
        showToast('Signed in successfully', 'success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-900 text-white p-6 pb-7 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 mb-3">
            <span className="font-black text-2xl tracking-wider">D</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">DistriFlow ERP</h2>
          <p className="text-xs text-blue-200/80 mt-1 font-medium">
            Cloud Distribution Management & Mobile Sales Automation
          </p>
        </div>

        {/* Content Box */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {isRegistering ? 'Choose Username *' : 'Username or Email'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder={isRegistering ? 'e.g. admin or sales_agent' : 'Username or email'}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm transition-all outline-none"
                />
              </div>
            </div>

            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@distriflow.internal"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+977 9800000000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select System Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('OWNER')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        role === 'OWNER'
                          ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Owner / Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('SALESPERSON')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        role === 'SALESPERSON'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      Salesperson
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
            >
              <span>{isRegistering ? 'Register Account' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="text-center mt-3">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg(null);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              {isRegistering
                ? 'Already have an account? Sign in here'
                : 'Need a new user account? Register here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
