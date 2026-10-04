import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { Delivery } from '../../types/erp';
import { StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Truck,
  Search,
  CheckCircle,
  MapPin,
  Calendar,
  Phone,
  User,
  ArrowRight,
  Boxes,
  FileText,
} from 'lucide-react';

export const DeliveriesScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const { deliveries, dispatchDelivery, completeDelivery } = useErp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dispatch Modal
  const [dispatchingDelivery, setDispatchingDelivery] = useState<Delivery | null>(null);
  const [driverName, setDriverName] = useState('Carlos Gomez');
  const [driverPhone, setDriverPhone] = useState('+1 (555) 789-0123');
  const [dispatchNotes, setDispatchNotes] = useState('Vehicle #TRK-104');

  // Complete Delivery Modal
  const [completingDelivery, setCompletingDelivery] = useState<Delivery | null>(null);
  const [completeNotes, setCompleteNotes] = useState('Signed by store manager on delivery dock');

  const filtered = deliveries.filter((d) => {
    const matchesSearch =
      d.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.retailerName.toLowerCase().includes(search.toLowerCase()) ||
      d.deliveryAddress.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchingDelivery) return;

    await dispatchDelivery(dispatchingDelivery.id, driverName, driverPhone, dispatchNotes);
    setDispatchingDelivery(null);
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingDelivery) return;

    await completeDelivery(completingDelivery.id, completeNotes);
    setCompletingDelivery(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Logistics & Deliveries
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Dispatch trucks, track delivery fulfillment, and automatically deduct delivered inventory
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search deliveries by order #, retailer, or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Delivery Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="DISPATCHED">Dispatched (In Transit)</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      {/* Deliveries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <div
            key={d.id}
            className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-xs text-blue-600 block">
                    {d.orderNumber}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
                    {d.retailerName}
                  </h3>
                </div>
                <StatusBadge status={d.status} />
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <p className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{d.deliveryAddress}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Scheduled: {new Date(d.scheduledDate).toLocaleDateString()}
                  </span>
                </p>
                {d.driverName && (
                  <p className="flex items-center gap-2 text-slate-700 font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Driver: {d.driverName} ({d.driverPhone})</span>
                  </p>
                )}
                {d.deliveredDate && (
                  <p className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delivered on {new Date(d.deliveredDate).toLocaleDateString()}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {d.status === 'SCHEDULED' && isOwner && (
                <button
                  onClick={() => setDispatchingDelivery(d)}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 min-h-[40px]"
                >
                  <Truck className="w-4 h-4" />
                  <span>Assign Driver & Dispatch</span>
                </button>
              )}

              {d.status === 'DISPATCHED' && isOwner && (
                <button
                  onClick={() => setCompletingDelivery(d)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 min-h-[40px]"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Handover & Deduct Stock</span>
                </button>
              )}

              {d.status === 'DELIVERED' && (
                <div className="text-xs text-slate-400 font-medium py-1">
                  Fulfilled & Inventory Deducted
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dispatch Modal */}
      {dispatchingDelivery && (
        <Modal
          isOpen={true}
          onClose={() => setDispatchingDelivery(null)}
          title={`Dispatch Shipment: ${dispatchingDelivery.orderNumber}`}
          subtitle={`Destination: ${dispatchingDelivery.retailerName}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmDispatch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Driver Name *
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Driver Phone *
              </label>
              <input
                type="tel"
                required
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Vehicle / Route Notes
              </label>
              <input
                type="text"
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDispatchingDelivery(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px]"
              >
                Dispatch Delivery
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Delivery Confirmation Modal */}
      {completingDelivery && (
        <Modal
          isOpen={true}
          onClose={() => setCompletingDelivery(null)}
          title={`Confirm Delivery: ${completingDelivery.orderNumber}`}
          subtitle={`Handing over goods to ${completingDelivery.retailerName}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmComplete} className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-emerald-600" />
                Automatic Stock Deduction
              </p>
              <p>
                Confirming delivery will mark the order as delivered, decrement product stock levels,
                and log auditable inventory movements for each delivered item.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Delivery Notes / Receiver Sign-off
              </label>
              <textarea
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={2}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletingDelivery(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px]"
              >
                Confirm Delivery & Deduct Inventory
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
