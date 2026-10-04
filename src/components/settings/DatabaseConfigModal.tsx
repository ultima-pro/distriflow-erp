import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useErp } from '../../context/ErpContext';
import { Cloud, HardDrive, CheckCircle2, ShieldAlert, Key, Link as LinkIcon, Database } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface DatabaseConfigModalProps {
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({ onClose }) => {
  const { showToast, refreshData } = useErp();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
          setTestResult(`Connection failed: ${error.message}`);
        } else {
          setTestResult('Successfully connected to Supabase PostgreSQL cluster!');
          showToast('Supabase connection verified', 'success');
        }
      } else {
        setTestResult('Currently running in isolated Local Development Data Source (localStorage persistence).');
      }
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetDemoData = () => {
    if (confirm('Reset local database back to default seed data?')) {
      localStorage.removeItem('distriflow_retailers');
      localStorage.removeItem('distriflow_suppliers');
      localStorage.removeItem('distriflow_products');
      localStorage.removeItem('distriflow_orders');
      localStorage.removeItem('distriflow_invoices');
      localStorage.removeItem('distriflow_deliveries');
      localStorage.removeItem('distriflow_payments');
      localStorage.removeItem('distriflow_movements');
      localStorage.removeItem('distriflow_users');
      refreshData();
      showToast('Local database restored to fresh seed state', 'success');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Cloud Architecture & Database Settings"
      subtitle="Connect Supabase for multi-device sync or run with local persistent storage"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Status Card */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            isSupabaseConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          {isSupabaseConfigured ? (
            <Cloud className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <HardDrive className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="font-bold text-sm">
              {isSupabaseConfigured
                ? 'Active Backend: Supabase PostgreSQL Cloud'
                : 'Active Backend: Isolated Local Storage (Dev Repository)'}
            </h4>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {isSupabaseConfigured
                ? 'All business transactions, stock movements, and orders synchronize in real time across owner desktops and salesperson mobile phones.'
                : 'Data persists in your browser storage using the clean ErpDataSource abstraction. All business rules, inventory adjustments, and status workflows operate identically.'}
            </p>
          </div>
        </div>

        {/* Supabase Setup Instructions */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
            <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
            Connecting Production Supabase
          </h5>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            To connect your live Supabase project, provide environment variables in your deployment or
            Secrets panel:
          </p>
          <div className="space-y-2 text-xs font-mono bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto">
            <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
            <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOi...</div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            The database schema file is located in <code className="text-blue-700 font-mono">/supabase/schema.sql</code>. It includes Row Level Security (RLS) policies for Owner and Salesperson roles.
          </p>
        </div>

        {/* Connection Test */}
        <div className="flex flex-col gap-2">
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Database className="w-4 h-4" />
            {isTesting ? 'Verifying...' : 'Test Active Connection'}
          </button>
          {testResult && (
            <div className="text-xs p-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-800">
              {testResult}
            </div>
          )}
        </div>

        {/* Dev Actions */}
        <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
          <button
            onClick={handleResetDemoData}
            className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-semibold min-h-[44px] flex items-center"
          >
            Reset Local Storage Data to Seed Default
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold min-h-[44px]"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
