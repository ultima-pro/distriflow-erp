import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { User, Retailer } from '../../types/erp';
import { Modal } from '../common/Modal';
import {
  Users2,
  Plus,
  Phone,
  Mail,
  Store,
  DollarSign,
  ShoppingCart,
  Edit2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const SalespersonsScreen: React.FC = () => {
  const { users, retailers, orders, payments, saveUser, saveRetailer } = useErp();

  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  // Assign retailers modal
  const [assigningRep, setAssigningRep] = useState<User | null>(null);

  const salespersons = users.filter((u) => u.role === 'SALESPERSON');

  const handleStartAdd = () => {
    setEditingUser({
      username: `rep_${Date.now() % 1000}`,
      fullName: '',
      role: 'SALESPERSON',
      phone: '',
      email: '',
      isActive: true,
    });
    setIsEditingUser(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.fullName?.trim() || !editingUser.username?.trim()) return;

    await saveUser({
      id: editingUser.id,
      username: editingUser.username.trim(),
      fullName: editingUser.fullName.trim(),
      role: 'SALESPERSON',
      phone: editingUser.phone || '',
      email: editingUser.email || '',
      isActive: editingUser.isActive ?? true,
    });

    setIsEditingUser(false);
    setEditingUser(null);
  };

  const handleToggleRetailerAssignment = async (retailer: Retailer, repId: number) => {
    const isCurrentlyAssigned = retailer.assignedSalespersonId === repId;
    await saveRetailer({
      ...retailer,
      assignedSalespersonId: isCurrentlyAssigned ? null : repId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sales Team & Field Agents
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage field representative profiles, assign retail stores, and monitor individual performance
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="self-start sm:self-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 text-xs sm:text-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sales Representative</span>
        </button>
      </div>

      {/* Grid of Sales Rep Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {salespersons.map((sp) => {
          const assignedStores = retailers.filter((r) => r.assignedSalespersonId === sp.id);
          const repOrders = orders.filter((o) => o.salespersonId === sp.id);
          const totalSales = repOrders
            .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
            .reduce((sum, o) => sum + o.totalAmount, 0);

          return (
            <div
              key={sp.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold text-base flex items-center justify-center">
                      {sp.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{sp.fullName}</h3>
                      <p className="text-xs text-slate-500">@{sp.username}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sp.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                  {sp.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sp.phone}</span>
                    </p>
                  )}
                  {sp.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sp.email}</span>
                    </p>
                  )}
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Revenue
                    </span>
                    <span className="font-black text-blue-700 text-sm mt-0.5 block">
                      ${totalSales.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Assigned Retailers
                    </span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      {assignedStores.length} accounts
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setAssigningRep(sp)}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 min-h-[36px]"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Assign Accounts ({assignedStores.length})</span>
                </button>

                <button
                  onClick={() => {
                    setEditingUser(sp);
                    setIsEditingUser(true);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Edit Salesperson"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Salesperson Modal */}
      {isEditingUser && editingUser && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsEditingUser(false);
            setEditingUser(null);
          }}
          title={editingUser.id ? 'Edit Sales Representative' : 'Add New Sales Representative'}
          subtitle="Configure agent login handle and contact details"
          maxWidth="md"
        >
          <form onSubmit={handleSaveUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={editingUser.fullName || ''}
                onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Username / Login Handle *
              </label>
              <input
                type="text"
                required
                value={editingUser.username || ''}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="activeUserCheckbox"
                checked={editingUser.isActive ?? true}
                onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="activeUserCheckbox" className="text-xs font-semibold text-slate-700">
                Active account (Authorized to log in and create orders)
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingUser(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px]"
              >
                Save Representative
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Retailers Modal */}
      {assigningRep && (
        <Modal
          isOpen={true}
          onClose={() => setAssigningRep(null)}
          title={`Assign Retailers: ${assigningRep.fullName}`}
          subtitle="Toggle which customer stores this representative visits and takes orders for"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {retailers.map((r) => {
                const isAssigned = r.assignedSalespersonId === assigningRep.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleToggleRetailerAssignment(r, assigningRep.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isAssigned
                        ? 'bg-blue-50/80 border-blue-300 text-blue-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {r.address} • Contact: {r.contactPerson}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAssigned ? (
                        <span className="text-blue-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          Assigned
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Click to Assign</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setAssigningRep(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs min-h-[44px]"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
