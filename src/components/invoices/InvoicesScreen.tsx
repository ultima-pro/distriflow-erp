import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { Invoice, InvoiceItem } from '../../types/erp';
import { ErpService } from '../../services/ErpService';
import { StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  FileText,
  Search,
  DollarSign,
  Printer,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle,
} from 'lucide-react';

export const InvoicesScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const { invoices, setActiveTab, recordRetailerPayment } = useErp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Pay invoice modal
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY'>('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.retailerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    setLoadingItems(true);
    try {
      const items = await ErpService.getInvoiceItems(inv.id);
      setInvoiceItems(items);
    } catch {
      setInvoiceItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || payAmount <= 0) return;

    await recordRetailerPayment(
      payingInvoice.retailerId,
      payingInvoice.id,
      payAmount,
      payMethod,
      payRef || `COL-${Date.now() % 10000}`,
      payNotes
    );

    setPayingInvoice(null);
    setPayAmount(0);
    setPayRef('');
    setPayNotes('');
    if (selectedInvoice && selectedInvoice.id === payingInvoice.id) {
      setSelectedInvoice(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer Invoices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Official billing documents, payment statuses, and customer receivables tracking
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search invoices by invoice # or retailer..."
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
          <option value="ALL">All Payment Statuses</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Fully Paid</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Retailer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map((inv) => {
                const isOverdue = inv.dueDate < Date.now() && inv.remainingBalance > 0;
                return (
                  <tr
                    key={inv.id}
                    onClick={() => handleOpenDetail(inv)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.retailerName}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                      {isOverdue && (
                        <span className="block text-[10px] text-rose-500 font-bold uppercase">
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.paymentStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      ${inv.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-amber-700">
                      ${inv.remainingBalance.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDetail(inv)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg min-h-[36px] min-w-[36px]"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.remainingBalance > 0 && (
                          <button
                            onClick={() => {
                              setPayingInvoice(inv);
                              setPayAmount(inv.remainingBalance);
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg min-h-[36px] min-w-[36px]"
                            title="Collect Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          subtitle={`Issued on ${new Date(selectedInvoice.invoiceDate).toLocaleDateString()}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Bill To</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {selectedInvoice.retailerName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Due Date</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                  {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Total Amount</span>
                <span className="font-black text-slate-900 text-sm mt-0.5 block">
                  ${selectedInvoice.totalAmount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Balance Due</span>
                <span className="font-black text-amber-700 text-sm mt-0.5 block">
                  ${selectedInvoice.remainingBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Invoiced Products
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                {loadingItems ? (
                  <div className="p-4 text-center text-slate-400">Loading invoice items...</div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                      <tr>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Discount</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {invoiceItems.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                          <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="p-2.5 text-right text-slate-500">${item.discount.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-black text-slate-900">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 min-h-[44px]"
              >
                <Printer className="w-4 h-4" />
                Print / Export
              </button>

              {selectedInvoice.remainingBalance > 0 && (
                <button
                  onClick={() => {
                    setPayingInvoice(selectedInvoice);
                    setPayAmount(selectedInvoice.remainingBalance);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs min-h-[44px] flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  Record Collection (${selectedInvoice.remainingBalance.toFixed(2)})
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Pay Invoice Dialog */}
      {payingInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setPayingInvoice(null)}
          title={`Collect Payment: ${payingInvoice.invoiceNumber}`}
          subtitle={`Customer: ${payingInvoice.retailerName} • Remaining Due: $${payingInvoice.remainingBalance.toFixed(2)}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Amount ($) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={payingInvoice.remainingBalance}
                required
                value={payAmount || ''}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black text-slate-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none bg-white font-semibold"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reference #
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Receipt or cheque #"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Collection memo..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={payAmount <= 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px] disabled:opacity-40"
              >
                Confirm Payment Receipt
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
