import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { CompanyProfile, AuditLog, RecycleBinItem } from '../../types/erp';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency } from '../../lib/format';
import {
  Building2,
  Trash2,
  RotateCcw,
  ClipboardList,
  Database,
  Save,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User as UserIcon,
  Tag,
  Eye,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export const SettingsScreen: React.FC = () => {
  const { isOwner, currentUser } = useAuth();
  const {
    companyProfile,
    saveCompanyProfile,
    auditLogs,
    refreshAuditLogs,
    products,
    retailers,
    suppliers,
    users,
    orders,
    restoreProduct,
    permanentDeleteProduct,
    restoreRetailer,
    permanentDeleteRetailer,
    restoreSupplier,
    permanentDeleteSupplier,
    restoreUser,
    permanentDeleteUser,
    restoreOrder,
    permanentDeleteOrder,
    showToast,
    refreshData,
  } = useErp();

  const [activeTab, setActiveTab] = useState<'profile' | 'recycle' | 'audit' | 'database'>('profile');

  // --- Company Profile Form State ---
  const [profileForm, setProfileForm] = useState<CompanyProfile>({ ...companyProfile });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile form when context updates
  React.useEffect(() => {
    setProfileForm({ ...companyProfile });
  }, [companyProfile]);

  const handleProfileChange = (field: keyof CompanyProfile, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        showToast('Logo image must be smaller than 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setProfileForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      showToast('Only owners can update business profile settings', 'error');
      return;
    }
    try {
      setIsSavingProfile(true);
      await saveCompanyProfile(profileForm);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- Recycle Bin State ---
  const [recycleModuleFilter, setRecycleModuleFilter] = useState<'ALL' | 'PRODUCTS' | 'RETAILERS' | 'SUPPLIERS' | 'SALES_TEAM' | 'ORDERS'>('ALL');
  const [itemToPermanentDelete, setItemToPermanentDelete] = useState<RecycleBinItem | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  // Build Recycle Bin Items from master data
  const recycleItems: RecycleBinItem[] = [];

  // 1. Archived Products
  products
    .filter((p) => !p.isActive)
    .forEach((p) => {
      recycleItems.push({
        id: `prod-${p.id}`,
        numericId: p.id,
        module: 'PRODUCTS',
        name: p.name,
        identifier: `SKU: ${p.sku}`,
        archivedAt: p.archivedAt || p.createdAt,
        hasHistoricalReferences: true, // Safeguard: preserved master data
        dependencyNote: 'Referenced in inventory ledger or previous orders',
      });
    });

  // 2. Archived Retailers
  retailers
    .filter((r) => !r.isActive)
    .forEach((r) => {
      recycleItems.push({
        id: `ret-${r.id}`,
        numericId: r.id,
        module: 'RETAILERS',
        name: r.name,
        identifier: r.phone || r.contactPerson,
        archivedAt: r.archivedAt || r.createdAt,
        hasHistoricalReferences: r.outstandingBalance > 0,
        dependencyNote: r.outstandingBalance > 0 ? `Unsettled balance: ${formatCurrency(r.outstandingBalance)}` : undefined,
      });
    });

  // 3. Archived Suppliers
  suppliers
    .filter((s) => !s.isActive)
    .forEach((s) => {
      recycleItems.push({
        id: `sup-${s.id}`,
        numericId: s.id,
        module: 'SUPPLIERS',
        name: s.name,
        identifier: s.phone || s.contactPerson,
        archivedAt: s.archivedAt || s.createdAt,
        hasHistoricalReferences: s.payableBalance > 0,
        dependencyNote: s.payableBalance > 0 ? `Payable: ${formatCurrency(s.payableBalance)}` : undefined,
      });
    });

  // 4. Deactivated Sales Team Members
  users
    .filter((u) => !u.isActive && u.role === 'SALESPERSON')
    .forEach((u) => {
      recycleItems.push({
        id: `user-${u.id}`,
        numericId: u.id,
        module: 'SALES_TEAM',
        name: u.fullName,
        identifier: `@${u.username}`,
        archivedAt: u.archivedAt || u.createdAt,
        hasHistoricalReferences: true,
        dependencyNote: 'Historical salesperson order assignment',
      });
    });

  // 5. Archived Orders
  orders
    .filter((o) => o.isArchived)
    .forEach((o) => {
      recycleItems.push({
        id: `ord-${o.id}`,
        numericId: o.id,
        module: 'ORDERS',
        name: `Order ${o.orderNumber}`,
        identifier: `${o.retailerName} (${formatCurrency(o.totalAmount)})`,
        archivedAt: o.archivedAt || o.updatedAt,
        hasHistoricalReferences: o.status === 'INVOICED' || o.status === 'DELIVERED',
        dependencyNote: o.status === 'INVOICED' ? 'Accounting invoice issued' : undefined,
      });
    });

  const filteredRecycleItems = recycleItems.filter(
    (item) => recycleModuleFilter === 'ALL' || item.module === recycleModuleFilter
  );

  const handleRestoreItem = async (item: RecycleBinItem) => {
    try {
      if (item.module === 'PRODUCTS') await restoreProduct(item.numericId);
      else if (item.module === 'RETAILERS') await restoreRetailer(item.numericId);
      else if (item.module === 'SUPPLIERS') await restoreSupplier(item.numericId);
      else if (item.module === 'SALES_TEAM') await restoreUser(item.numericId);
      else if (item.module === 'ORDERS') await restoreOrder(item.numericId);
    } catch (err: any) {
      showToast(err.message || 'Failed to restore record', 'error');
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!itemToPermanentDelete) return;
    try {
      setIsPurging(true);
      if (itemToPermanentDelete.module === 'PRODUCTS') await permanentDeleteProduct(itemToPermanentDelete.numericId);
      else if (itemToPermanentDelete.module === 'RETAILERS') await permanentDeleteRetailer(itemToPermanentDelete.numericId);
      else if (itemToPermanentDelete.module === 'SUPPLIERS') await permanentDeleteSupplier(itemToPermanentDelete.numericId);
      else if (itemToPermanentDelete.module === 'SALES_TEAM') await permanentDeleteUser(itemToPermanentDelete.numericId);
      else if (itemToPermanentDelete.module === 'ORDERS') await permanentDeleteOrder(itemToPermanentDelete.numericId);
      setItemToPermanentDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Permanent deletion blocked: dependencies exist', 'error');
    } finally {
      setIsPurging(false);
    }
  };

  // --- Audit Log Filter State ---
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('ALL');

  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (log.recordIdentifier && log.recordIdentifier.toLowerCase().includes(auditSearch.toLowerCase())) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesModule = auditModuleFilter === 'ALL' || log.module === auditModuleFilter;
    return matchesSearch && matchesModule;
  });

  // --- Database Settings State ---
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ERP Administration & Business Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure company branding, inspect system audit trail, manage recycle bin, and monitor database
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Administrator Control</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company & Business Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('recycle')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'recycle'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Recycle Bin & Archives</span>
          {recycleItems.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {recycleItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Audit & Activity Log</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'database'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cloud & Database</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: COMPANY / BUSINESS PROFILE */}
      {/* ========================================== */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Section: Core Identity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Business Identity & Branding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Business / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.companyName}
                  onChange={(e) => handleProfileChange('companyName', e.target.value)}
                  placeholder="e.g. Acme FMCG Distributors"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Displayed on top navigation bar, printable tax invoices, and sales reports.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Legal / Registered Business Name
                </label>
                <input
                  type="text"
                  value={profileForm.legalName || ''}
                  onChange={(e) => handleProfileChange('legalName', e.target.value)}
                  placeholder="e.g. Acme Distribution Solutions Pvt. Ltd."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Business Type
                </label>
                <input
                  type="text"
                  value={profileForm.businessType || ''}
                  onChange={(e) => handleProfileChange('businessType', e.target.value)}
                  placeholder="e.g. Wholesale FMCG, Beverages & Dry Goods"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={profileForm.tagline || ''}
                  onChange={(e) => handleProfileChange('tagline', e.target.value)}
                  placeholder="e.g. Reliable FMCG Supply Across The Province"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Logo Upload & Preview */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Company Logo
              </label>
              <div className="flex items-center gap-4">
                {profileForm.logoUrl ? (
                  <div className="relative group">
                    <img
                      src={profileForm.logoUrl}
                      alt="Company Logo Preview"
                      className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleProfileChange('logoUrl', '')}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                    <Building2 className="w-6 h-6" />
                    <span className="text-[9px] mt-0.5 font-bold">No Logo</span>
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload Logo File (PNG / JPG)</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Appears on invoice headers, official printouts, and top left branding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Contact & Location */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              2. Contact & Headquarters Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Primary Phone *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  placeholder="+977-1-4500000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Alternate Phone
                </label>
                <input
                  type="text"
                  value={profileForm.alternatePhone || ''}
                  onChange={(e) => handleProfileChange('alternatePhone', e.target.value)}
                  placeholder="+977 9800000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  placeholder="contact@mycompany.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                  placeholder="e.g. Ward No. 4, New Baneshwor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.city}
                  onChange={(e) => handleProfileChange('city', e.target.value)}
                  placeholder="Kathmandu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={profileForm.district || ''}
                  onChange={(e) => handleProfileChange('district', e.target.value)}
                  placeholder="Kathmandu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Province
                </label>
                <input
                  type="text"
                  value={profileForm.province || ''}
                  onChange={(e) => handleProfileChange('province', e.target.value)}
                  placeholder="Bagmati Province"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={profileForm.country || 'Nepal'}
                  onChange={(e) => handleProfileChange('country', e.target.value)}
                  placeholder="Nepal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Tax & Regulatory Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              3. Registration, PAN & Tax Numbers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  PAN Number (Permanent Account No.)
                </label>
                <input
                  type="text"
                  value={profileForm.panNumber || ''}
                  onChange={(e) => handleProfileChange('panNumber', e.target.value)}
                  placeholder="e.g. 600123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  VAT Registration Number
                </label>
                <input
                  type="text"
                  value={profileForm.vatNumber || ''}
                  onChange={(e) => handleProfileChange('vatNumber', e.target.value)}
                  placeholder="e.g. 600123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Company Registration Number
                </label>
                <input
                  type="text"
                  value={profileForm.registrationNumber || ''}
                  onChange={(e) => handleProfileChange('registrationNumber', e.target.value)}
                  placeholder="e.g. 104928/080"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Document Customization */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              4. Invoices, Receipts & Standard Document Footers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Invoice Footer Payment Instructions
                </label>
                <textarea
                  rows={2}
                  value={profileForm.invoiceFooterText || ''}
                  onChange={(e) => handleProfileChange('invoiceFooterText', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Default Payment Terms
                </label>
                <input
                  type="text"
                  value={profileForm.defaultPaymentTerms || ''}
                  onChange={(e) => handleProfileChange('defaultPaymentTerms', e.target.value)}
                  placeholder="Net 30 Days"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Default Invoice Legal Notes / Return Policy
                </label>
                <textarea
                  rows={2}
                  value={profileForm.defaultInvoiceNotes || ''}
                  onChange={(e) => handleProfileChange('defaultInvoiceNotes', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isOwner && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all text-xs sm:text-sm disabled:opacity-50 min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Saving Changes...' : 'Save Business Profile'}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* ========================================== */}
      {/* TAB 2: RECYCLE BIN & ARCHIVED RECORDS */}
      {/* ========================================== */}
      {activeTab === 'recycle' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold">ERP Data Lifecycle Protection Active</p>
              <p className="mt-0.5">
                Records referenced by historical accounting, orders, or stock movements cannot be accidentally destroyed.
                They are safely archived and can be restored back to live operations at any time.
              </p>
            </div>
          </div>

          {/* Module Filter */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['ALL', 'PRODUCTS', 'RETAILERS', 'SUPPLIERS', 'SALES_TEAM', 'ORDERS'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setRecycleModuleFilter(m)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                    recycleModuleFilter === m
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {m === 'ALL' ? 'All Archived' : m.replace('_', ' ')}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-slate-500 shrink-0">
              {filteredRecycleItems.length} records
            </span>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredRecycleItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Trash2 className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Recycle Bin is Empty</p>
                <p className="text-xs mt-1">No archived records found in this category.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4">Record Identifier</th>
                      <th className="py-3 px-4">Archived Date</th>
                      <th className="py-3 px-4">Safety Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRecycleItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {item.module.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[11px] text-slate-400">{item.identifier}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {new Date(item.archivedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {item.hasHistoricalReferences ? (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded inline-block text-[11px]">
                              Protected (Accounting History)
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">Safe to purge</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRestoreItem(item)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors min-h-[32px]"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>

                            {isOwner && (
                              <button
                                onClick={() => setItemToPermanentDelete(item)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors min-h-[32px]"
                                title="Permanent Delete (Only if dependency-free)"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span className="hidden sm:inline">Purge</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: AUDIT & ACTIVITY LOG */}
      {/* ========================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2.5 py-2 outline-none"
              >
                <option value="ALL">All Modules</option>
                <option value="ORDERS">Orders</option>
                <option value="INVOICES">Invoices</option>
                <option value="PAYMENTS">Payments & Collections</option>
                <option value="DELIVERIES">Deliveries</option>
                <option value="PRODUCTS">Products</option>
                <option value="RETAILERS">Retailers</option>
                <option value="SUPPLIERS">Suppliers</option>
                <option value="SALES_TEAM">Sales Team</option>
                <option value="INVENTORY">Inventory</option>
                <option value="COMPANY_PROFILE">Company Profile</option>
              </select>

              <button
                onClick={() => refreshAuditLogs()}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh Audit Logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ClipboardList className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">No Audit Events Logged</p>
                <p className="text-xs mt-1">Actions performed across the ERP will be recorded here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Module</th>
                      <th className="py-2.5 px-4">Event Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {log.userName}
                          <span className="text-[10px] text-slate-400 font-normal block">{log.userRole}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              log.action === 'CREATE' || log.action === 'CREATE_INVOICE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.action === 'VOID' || log.action === 'REVERSE_PAYMENT' || log.action === 'PERMANENT_DELETE'
                                ? 'bg-rose-100 text-rose-800'
                                : log.action === 'ARCHIVE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 uppercase text-[10px] font-bold">
                          {log.module.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 text-slate-800">
                          <p className="font-semibold">{log.description}</p>
                          {log.reason && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">Reason: "{log.reason}"</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: DATABASE & CLOUD CONFIGURATION */}
      {/* ========================================== */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-2xl border flex items-start gap-4 ${
              isSupabaseConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <Database className="w-6 h-6 mt-1 shrink-0 text-emerald-600" />
            <div>
              <h4 className="font-bold text-base">
                {isSupabaseConfigured
                  ? 'Active Production Backend: Supabase PostgreSQL Cloud'
                  : 'Active Development Backend: Local Browser Storage (Dev Prototype)'}
              </h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {isSupabaseConfigured
                  ? 'Real-time synchronization across owner desktop and salesperson mobile app is enabled via PostgreSQL and Row Level Security.'
                  : 'Data is persisted in your local browser state with all business rules, accounting constraints, and audit logging active.'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-900">Database Connection Diagnostic</h4>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={testConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                {isTesting ? 'Testing Connectivity...' : 'Run Connectivity Check'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono mt-3 ${
                  testResult.includes('Successfully')
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                {testResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Permanent Deletion */}
      {itemToPermanentDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setItemToPermanentDelete(null)}
          onConfirm={handleConfirmPermanentDelete}
          title={`Permanently Purge ${itemToPermanentDelete.name}?`}
          message={
            itemToPermanentDelete.hasHistoricalReferences
              ? `WARNING: This record has historical references (${itemToPermanentDelete.dependencyNote || 'accounting history'}). Permanent deletion will be rejected to protect financial integrity. Are you sure you wish to attempt purging?`
              : `Are you sure you want to permanently delete this record? This action cannot be undone.`
          }
          confirmText="Yes, Permanently Purge"
          isLoading={isPurging}
        />
      )}
    </div>
  );
};
