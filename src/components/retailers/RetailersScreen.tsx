import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { Retailer } from '../../types/erp';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency } from '../../lib/format';
import {
  Search,
  Plus,
  Store,
  Phone,
  MapPin,
  ShoppingCart,
  UserCheck,
  Edit2,
  Trash2,
} from 'lucide-react';

export const RetailersScreen: React.FC = () => {
  const { isOwner, currentUser } = useAuth();
  const {
    retailers,
    users,
    saveRetailer,
    deleteRetailer,
    startNewOrderForRetailer,
  } = useErp();

  const [search, setSearch] = useState('');
  const [filterRep, setFilterRep] = useState('ALL');
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Partial<Retailer> | null>(null);

  // Delete Confirmation
  const [retailerToDelete, setRetailerToDelete] = useState<Retailer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Salespersons list for assignment
  const salespersons = users.filter((u) => u.role === 'SALESPERSON');

  // Permissions: salesperson sees assigned or unassigned
  const accessibleRetailers = isOwner
    ? retailers
    : retailers.filter(
        (r) =>
          r.assignedSalespersonId === currentUser?.cloudId ||
          r.assignedSalespersonId === currentUser?.id ||
          !r.assignedSalespersonId
      );

  const filtered = accessibleRetailers.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase());
    const matchesRep =
      filterRep === 'ALL' || r.assignedSalespersonId?.toString() === filterRep;
    return matchesSearch && matchesRep;
  });

  const handleStartAdd = () => {
    setEditingRetailer({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      creditLimit: 50000,
      outstandingBalance: 0,
      assignedSalespersonId: currentUser?.role === 'SALESPERSON' ? currentUser.cloudId || currentUser.id : null,
      isActive: true,
    });
    setIsEditing(true);
  };

  const handleStartEdit = (r: Retailer) => {
    setEditingRetailer(r);
    setIsEditing(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRetailer || !editingRetailer.name?.trim()) return;

    await saveRetailer({
      id: editingRetailer.id,
      name: editingRetailer.name.trim(),
      contactPerson: editingRetailer.contactPerson || '',
      phone: editingRetailer.phone || '',
      email: editingRetailer.email || '',
      address: editingRetailer.address || '',
      city: editingRetailer.city || '',
      creditLimit: Number(editingRetailer.creditLimit) || 0,
      outstandingBalance: Number(editingRetailer.outstandingBalance) || 0,
      assignedSalespersonId: editingRetailer.assignedSalespersonId || null,
      isActive: editingRetailer.isActive ?? true,
    });

    setIsEditing(false);
    setEditingRetailer(null);
  };

  const handleConfirmDelete = async () => {
    if (!retailerToDelete) return;
    try {
      setIsDeleting(true);
      await deleteRetailer(retailerToDelete.id);
      setRetailerToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Retailers & Customers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Client accounts, credit limits, balances, and field order creation
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="self-start sm:self-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 text-xs sm:text-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Retailer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search retailers by store name, contact, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {isOwner && (
          <select
            value={filterRep}
            onChange={(e) => setFilterRep(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
          >
            <option value="ALL">All Sales Representatives</option>
            {salespersons.map((s) => (
              <option key={s.cloudId || s.id} value={(s.cloudId || s.id).toString()}>
                {s.fullName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Retailers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const assignedRep = salespersons.find(
            (s) => s.cloudId === r.assignedSalespersonId || s.id === r.assignedSalespersonId
          );
          return (
            <div
              key={r.id}
              className={`p-5 rounded-2xl border bg-white shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between ${
                !r.isActive ? 'opacity-60 bg-slate-50' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                      {r.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {r.contactPerson}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {r.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{r.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{r.address}{r.city ? `, ${r.city}` : ''}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Rep: {assignedRep?.fullName || 'Unassigned'}</span>
                  </p>
                </div>
              </div>

              {/* Financial Box */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Outstanding
                    </span>
                    <span
                      className={`text-sm font-black ${
                        r.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-800'
                      }`}
                    >
                      {formatCurrency(r.outstandingBalance)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Credit Limit
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {formatCurrency(r.creditLimit)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startNewOrderForRetailer(r)}
                    className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[36px]"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Create Order</span>
                  </button>

                  <button
                    onClick={() => handleStartEdit(r)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Edit Retailer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => setRetailerToDelete(r)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete Retailer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Retailer Modal */}
      {isEditing && editingRetailer && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsEditing(false);
            setEditingRetailer(null);
          }}
          title={editingRetailer.id ? 'Edit Retailer' : 'Add New Retailer'}
          subtitle="Keep customer contact, address, and credit information up to date"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Store / Company Name *
              </label>
              <input
                type="text"
                required
                value={editingRetailer.name || ''}
                onChange={(e) => setEditingRetailer({ ...editingRetailer, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={editingRetailer.contactPerson || ''}
                  onChange={(e) => setEditingRetailer({ ...editingRetailer, contactPerson: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editingRetailer.phone || ''}
                  onChange={(e) => setEditingRetailer({ ...editingRetailer, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingRetailer.email || ''}
                  onChange={(e) => setEditingRetailer({ ...editingRetailer, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={editingRetailer.city || ''}
                  onChange={(e) => setEditingRetailer({ ...editingRetailer, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={editingRetailer.address || ''}
                onChange={(e) => setEditingRetailer({ ...editingRetailer, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Credit Limit (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={editingRetailer.creditLimit ?? 25000}
                  onChange={(e) => setEditingRetailer({ ...editingRetailer, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Assigned Sales Representative
                </label>
                <select
                  value={editingRetailer.assignedSalespersonId || ''}
                  onChange={(e) => setEditingRetailer({ ...editingRetailer, assignedSalespersonId: e.target.value || null })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-blue-500"
                >
                  <option value="">-- Unassigned --</option>
                  {salespersons.map((s) => (
                    <option key={s.cloudId || s.id} value={s.cloudId || s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingRetailer(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 min-h-[40px]"
              >
                Save Retailer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {retailerToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setRetailerToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete Retailer ${retailerToDelete.name}?`}
          message={`Are you sure you want to delete ${retailerToDelete.name}? This will remove the retailer from your customer list.`}
          confirmText="Yes, Delete Retailer"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
