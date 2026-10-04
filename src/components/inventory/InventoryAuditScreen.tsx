import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { InventoryMovement, MovementType } from '../../types/erp';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Boxes,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Calendar,
  Trash2,
} from 'lucide-react';

export const InventoryAuditScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const { movements, deleteMovement } = useErp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [movementToDelete, setMovementToDelete] = useState<InventoryMovement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!movementToDelete) return;
    try {
      setIsDeleting(true);
      await deleteMovement(movementToDelete.id);
      setMovementToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = movements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      (m.referenceNumber && m.referenceNumber.toLowerCase().includes(search.toLowerCase())) ||
      (m.reasonOrNotes && m.reasonOrNotes.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || m.movementType === typeFilter;
    return matchesSearch && matchesType;
  });

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case 'PURCHASE_RECEIPT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ORDER_DELIVERY':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ADJUSTMENT_IN':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'ADJUSTMENT_OUT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Inventory Stock Audit Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable trace of every single inbound purchase, customer delivery, and stock adjustment
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by product, order/bill reference, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Movement Types</option>
          <option value="PURCHASE_RECEIPT">Purchase Receipts (Inbound)</option>
          <option value="ORDER_DELIVERY">Order Deliveries (Outbound)</option>
          <option value="ADJUSTMENT_IN">Adjustment In</option>
          <option value="ADJUSTMENT_OUT">Adjustment Out</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Prev Stock</th>
                <th className="py-3 px-4 text-center">Quantity Delta</th>
                <th className="py-3 px-4 text-center">New Stock</th>
                <th className="py-3 px-4">Reference Document</th>
                <th className="py-3 px-4">Audit Memo</th>
                {isOwner && <th className="py-3 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map((m) => {
                const isPositive = m.quantity >= 0;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {new Date(m.timestamp).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{m.productName}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block font-bold text-xs px-2 py-0.5 rounded-full border ${getMovementBadge(
                          m.movementType
                        )}`}
                      >
                        {m.movementType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500 font-semibold">
                      {m.previousStock}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block font-black text-xs px-2 py-0.5 rounded ${
                          isPositive ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {m.newStock}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-600">
                      {m.referenceNumber || m.referenceType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{m.reasonOrNotes || '—'}</td>
                    {isOwner && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setMovementToDelete(m)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-h-[32px] min-w-[32px] inline-flex items-center justify-center transition-colors"
                          title="Delete Audit Movement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Movement Confirmation */}
      {movementToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setMovementToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Stock Movement Record?"
          message={`Are you sure you want to delete the movement entry for '${movementToDelete.productName}' (${movementToDelete.movementType}, delta: ${movementToDelete.quantity})?`}
          confirmText="Yes, Delete Record"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
