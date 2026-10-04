import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { Payment, PaymentMethod } from '../../types/erp';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency } from '../../lib/format';
import {
  DollarSign,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
} from 'lucide-react';

export const PaymentsScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const {
    payments,
    retailers,
    suppliers,
    invoices,
    recordRetailerPayment,
    recordSupplierPayment,
    deletePayment,
  } = useErp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // New Retailer Collection Modal
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedRetailerId, setSelectedRetailerId] = useState<number | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('CASH');
  const [collectRef, setCollectRef] = useState('');
  const [collectNotes, setCollectNotes] = useState('');

  // Disburse Supplier Payment Modal
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [disburseAmount, setDisburseAmount] = useState<number>(0);
  const [disburseMethod, setDisburseMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [disburseRef, setDisburseRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');

  // Delete Payment Confirmation
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.entityName.toLowerCase().includes(search.toLowerCase()) ||
      p.recordedByName.toLowerCase().includes(search.toLowerCase()) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleConfirmCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRetailerId || collectAmount <= 0) return;

    await recordRetailerPayment(
      selectedRetailerId,
      selectedInvoiceId,
      collectAmount,
      collectMethod,
      collectRef || `RCV-${Date.now() % 10000}`,
      collectNotes
    );

    setIsCollecting(false);
    setSelectedRetailerId(null);
    setSelectedInvoiceId(null);
    setCollectAmount(0);
    setCollectRef('');
    setCollectNotes('');
  };

  const handleConfirmDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || disburseAmount <= 0) return;

    await recordSupplierPayment(
      selectedSupplierId,
      null,
      disburseAmount,
      disburseMethod,
      disburseRef || `WIRE-${Date.now() % 10000}`,
      disburseNotes
    );

    setIsDisbursing(false);
    setSelectedSupplierId(null);
    setDisburseAmount(0);
    setDisburseRef('');
    setDisburseNotes('');
  };

  const handleConfirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      setIsDeleting(true);
      await deletePayment(paymentToDelete.id);
      setPaymentToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter invoices for chosen retailer
  const retailerUnpaidInvoices = selectedRetailerId
    ? invoices.filter((i) => i.retailerId === selectedRetailerId && i.remainingBalance > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Financial Ledger & Payments
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Field cash/cheque collections from retailers and supplier vendor disbursements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedRetailerId(retailers[0]?.id || null);
              setCollectAmount(retailers[0]?.outstandingBalance || 0);
              setIsCollecting(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 text-xs sm:text-sm min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Collect from Retailer</span>
          </button>

          {isOwner && (
            <button
              onClick={() => {
                setSelectedSupplierId(suppliers[0]?.id || null);
                setDisburseAmount(suppliers[0]?.payableBalance || 0);
                setIsDisbursing(true);
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 text-xs sm:text-sm min-h-[44px]"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Disburse Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search payments by receipt #, customer, reference..."
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
          <option value="ALL">All Payment Types</option>
          <option value="RETAILER_COLLECTION">Retailer Collections (Inflow)</option>
          <option value="SUPPLIER_PAYMENT">Supplier Disbursements (Outflow)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Entity / Party</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-right">Amount</th>
                {isOwner && <th className="py-3 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map((pay) => {
                const isInflow = pay.type === 'RETAILER_COLLECTION';
                return (
                  <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {pay.paymentNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${
                          isInflow
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isInflow ? (
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                        )}
                        {isInflow ? 'Collection' : 'Disbursement'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{pay.entityName}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(pay.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">
                        {pay.paymentMethod.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                      {pay.referenceNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{pay.recordedByName}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-black text-sm ${
                          isInflow ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {isInflow ? '+' : '-'}{formatCurrency(pay.amount)}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setPaymentToDelete(pay)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-h-[36px] min-w-[36px]"
                          title="Delete Payment Record"
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

      {/* Collect from Retailer Modal */}
      {isCollecting && (
        <Modal
          isOpen={true}
          onClose={() => setIsCollecting(false)}
          title="Record Retailer Payment Collection"
          subtitle="Updates customer balance and sets invoice payment status"
          maxWidth="md"
        >
          <form onSubmit={handleConfirmCollection} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select Retailer *
              </label>
              <select
                required
                value={selectedRetailerId || ''}
                onChange={(e) => {
                  const rId = parseInt(e.target.value);
                  setSelectedRetailerId(rId);
                  const ret = retailers.find((r) => r.id === rId);
                  if (ret) setCollectAmount(ret.outstandingBalance > 0 ? ret.outstandingBalance : 0);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none bg-white font-semibold"
              >
                {retailers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Balance: {formatCurrency(r.outstandingBalance)})
                  </option>
                ))}
              </select>
            </div>

            {retailerUnpaidInvoices.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Apply to Specific Invoice (Optional)
                </label>
                <select
                  value={selectedInvoiceId || ''}
                  onChange={(e) => {
                    const invId = e.target.value ? parseInt(e.target.value) : null;
                    setSelectedInvoiceId(invId);
                    if (invId) {
                      const inv = retailerUnpaidInvoices.find((i) => i.id === invId);
                      if (inv) setCollectAmount(inv.remainingBalance);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none bg-white"
                >
                  <option value="">General Account Balance</option>
                  {retailerUnpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - Due: {formatCurrency(inv.remainingBalance)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Collected Amount (Rs.) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={collectAmount || ''}
                onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-black text-emerald-800 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none bg-white font-semibold"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="MOBILE_MONEY">Digital Wallet / QR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reference #
                </label>
                <input
                  type="text"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  placeholder="Receipt # or Txn #"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes</label>
              <input
                type="text"
                value={collectNotes}
                onChange={(e) => setCollectNotes(e.target.value)}
                placeholder="Field collection remarks..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCollecting(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={collectAmount <= 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px] disabled:opacity-40"
              >
                Record Collection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Disburse to Supplier Modal */}
      {isDisbursing && (
        <Modal
          isOpen={true}
          onClose={() => setIsDisbursing(false)}
          title="Disburse Payment to Supplier"
          subtitle="Reduces accounts payable balance"
          maxWidth="md"
        >
          <form onSubmit={handleConfirmDisbursement} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select Supplier *
              </label>
              <select
                required
                value={selectedSupplierId || ''}
                onChange={(e) => {
                  const sId = parseInt(e.target.value);
                  setSelectedSupplierId(sId);
                  const sup = suppliers.find((s) => s.id === sId);
                  if (sup) setDisburseAmount(sup.payableBalance > 0 ? sup.payableBalance : 0);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none bg-white font-semibold"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Payable: {formatCurrency(s.payableBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Disbursement Amount (Rs.) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={disburseAmount || ''}
                onChange={(e) => setDisburseAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-black text-slate-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={disburseMethod}
                  onChange={(e) => setDisburseMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none bg-white font-semibold"
                >
                  <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reference #
                </label>
                <input
                  type="text"
                  value={disburseRef}
                  onChange={(e) => setDisburseRef(e.target.value)}
                  placeholder="Wire ref or check #"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes</label>
              <input
                type="text"
                value={disburseNotes}
                onChange={(e) => setDisburseNotes(e.target.value)}
                placeholder="Payment memo..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDisbursing(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disburseAmount <= 0}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px] disabled:opacity-40"
              >
                Confirm Disbursement
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {paymentToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setPaymentToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete Payment ${paymentToDelete.paymentNumber}?`}
          message={`Are you sure you want to delete this payment record of ${formatCurrency(paymentToDelete.amount)} for ${paymentToDelete.entityName}? The party balance will be restored.`}
          confirmText="Yes, Delete Payment"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
