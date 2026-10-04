import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { Supplier, Product, Purchase } from '../../types/erp';
import { Modal } from '../common/Modal';
import {
  Factory,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FilePlus,
  Package,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';

export const SuppliersScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const {
    suppliers,
    products,
    purchases,
    payments,
    saveSupplier,
    recordPurchase,
    recordSupplierPayment,
  } = useErp();

  const [search, setSearch] = useState('');
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  // New Purchase Bill Modal
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState<number | null>(null);
  const [purchaseBillNum, setPurchaseBillNum] = useState(`BILL-${Date.now() % 100000}`);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<{ product: Product; quantity: number }[]>([]);

  // Disburse Payment Modal
  const [disbursingSupplier, setDisbursingSupplier] = useState<Supplier | null>(null);
  const [disburseAmount, setDisburseAmount] = useState<number>(0);
  const [disburseMethod, setDisburseMethod] = useState<'BANK_TRANSFER' | 'CHEQUE' | 'CASH'>('BANK_TRANSFER');
  const [disburseRef, setDisburseRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  const handleStartAddSupplier = () => {
    setEditingSupplier({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      payableBalance: 0,
      isActive: true,
    });
    setIsEditingSupplier(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editingSupplier.name?.trim()) return;

    await saveSupplier({
      id: editingSupplier.id,
      name: editingSupplier.name.trim(),
      contactPerson: editingSupplier.contactPerson || '',
      phone: editingSupplier.phone || '',
      email: editingSupplier.email || '',
      address: editingSupplier.address || '',
      payableBalance: Number(editingSupplier.payableBalance) || 0,
      isActive: editingSupplier.isActive ?? true,
    });

    setIsEditingSupplier(false);
    setEditingSupplier(null);
  };

  // Add line to purchase
  const handleAddPurchaseLine = (p: Product) => {
    const existing = purchaseItems.find((it) => it.product.id === p.id);
    if (existing) {
      setPurchaseItems(
        purchaseItems.map((it) =>
          it.product.id === p.id ? { ...it, quantity: it.quantity + 10 } : it
        )
      );
    } else {
      setPurchaseItems([...purchaseItems, { product: p, quantity: 20 }]);
    }
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseSupplierId || purchaseItems.length === 0) return;

    await recordPurchase(purchaseSupplierId, purchaseBillNum, purchaseItems, purchaseNotes);
    setIsCreatingPurchase(false);
    setPurchaseItems([]);
    setPurchaseNotes('');
    setPurchaseBillNum(`BILL-${Date.now() % 100000}`);
  };

  const handleConfirmDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disbursingSupplier || disburseAmount <= 0) return;

    await recordSupplierPayment(
      disbursingSupplier.id,
      null,
      disburseAmount,
      disburseMethod,
      disburseRef || `WIRE-${Date.now() % 10000}`,
      disburseNotes
    );

    setDisbursingSupplier(null);
    setDisburseAmount(0);
    setDisburseRef('');
    setDisburseNotes('');
  };

  const purchaseTotal = purchaseItems.reduce(
    (sum, it) => sum + it.product.purchasePrice * it.quantity,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Suppliers & Purchasing
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Wholesale vendors, inbound inventory purchase orders, and payable balances
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPurchaseSupplierId(suppliers[0]?.id || null);
                setPurchaseItems([]);
                setIsCreatingPurchase(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 text-xs sm:text-sm min-h-[44px]"
            >
              <FilePlus className="w-4 h-4" />
              <span>Record Purchase Bill</span>
            </button>

            <button
              onClick={handleStartAddSupplier}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 text-xs sm:text-sm min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search suppliers by name, contact, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => {
          const supplierPurchases = purchases.filter((p: Purchase) => p.supplierId === s.id);
          return (
            <div
              key={s.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{s.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{s.contactPerson}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Vendor
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.phone}</span>
                  </p>
                  {s.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.email}</span>
                    </p>
                  )}
                  {s.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{s.address}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Payables box */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Payable Balance
                    </span>
                    <span
                      className={`text-sm font-black ${
                        s.payableBalance > 0 ? 'text-rose-700' : 'text-slate-800'
                      }`}
                    >
                      ${s.payableBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Purchases
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {supplierPurchases.length} bills
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDisbursingSupplier(s);
                      setDisburseAmount(s.payableBalance > 0 ? s.payableBalance : 0);
                    }}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 min-h-[36px]"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Disburse Payment</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingSupplier(s);
                      setIsEditingSupplier(true);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Edit Supplier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Record Inbound Purchase Bill Modal */}
      {isCreatingPurchase && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreatingPurchase(false)}
          title="Record Inbound Purchase Bill"
          subtitle="Receiving items into warehouse increases stock and logs auditable movement"
          maxWidth="2xl"
        >
          <form onSubmit={handleSavePurchase} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Supplier *
                </label>
                <select
                  required
                  value={purchaseSupplierId || ''}
                  onChange={(e) => setPurchaseSupplierId(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none bg-white font-medium"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bill / Invoice # *
                </label>
                <input
                  type="text"
                  required
                  value={purchaseBillNum}
                  onChange={(e) => setPurchaseBillNum(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none font-mono"
                />
              </div>
            </div>

            {/* Product selection for receipt */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select Received Products
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddPurchaseLine(p)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-blue-500 rounded-lg text-xs font-medium text-slate-800 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-blue-600 font-bold font-mono">
                      + (${p.purchasePrice})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Purchase Line Items */}
            {purchaseItems.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5 text-center">Cost Price</th>
                      <th className="p-2.5 text-center">Received Qty</th>
                      <th className="p-2.5 text-right">Line Total</th>
                      <th className="p-2.5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {purchaseItems.map((it, idx) => (
                      <tr key={it.product.id}>
                        <td className="p-2.5 font-bold text-slate-900">{it.product.name}</td>
                        <td className="p-2.5 text-center">${it.product.purchasePrice.toFixed(2)}</td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              const updated = [...purchaseItems];
                              updated[idx].quantity = qty;
                              setPurchaseItems(updated);
                            }}
                            className="w-16 p-1 border border-slate-300 rounded text-center font-bold text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          ${(it.product.purchasePrice * it.quantity).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setPurchaseItems(purchaseItems.filter((_, i) => i !== idx))
                            }
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Notes / Shipment Tracking
              </label>
              <textarea
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                placeholder="e.g. Received via DHL freight tracking #98234..."
                rows={2}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Total Purchase Value:</span>
              <span className="text-base text-blue-700 font-black">
                ${purchaseTotal.toFixed(2)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingPurchase(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={purchaseItems.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px] disabled:opacity-40"
              >
                Post Purchase Bill & Receive Stock
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Disburse Supplier Payment Modal */}
      {disbursingSupplier && (
        <Modal
          isOpen={true}
          onClose={() => setDisbursingSupplier(null)}
          title={`Disburse Payment: ${disbursingSupplier.name}`}
          subtitle={`Current payable balance: $${disbursingSupplier.payableBalance.toFixed(2)}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmDisburse} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Disbursement Amount ($) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={disburseAmount || ''}
                onChange={(e) => setDisburseAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black text-slate-900 outline-none"
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
                  placeholder="Wire ref or cheque #"
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
                onClick={() => setDisbursingSupplier(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disburseAmount <= 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px] disabled:opacity-40"
              >
                Confirm Disbursement
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Supplier Modal */}
      {isEditingSupplier && editingSupplier && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditingSupplier(false)}
          title={editingSupplier.id ? 'Edit Supplier' : 'Add Supplier'}
          subtitle="Vendor contact information and credit terms"
          maxWidth="md"
        >
          <form onSubmit={handleSaveSupplier} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Supplier / Company Name *
              </label>
              <input
                type="text"
                required
                value={editingSupplier.name || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={editingSupplier.contactPerson || ''}
                  onChange={(e) =>
                    setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={editingSupplier.phone || ''}
                  onChange={(e) =>
                    setEditingSupplier({ ...editingSupplier, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                value={editingSupplier.email || ''}
                onChange={(e) =>
                  setEditingSupplier({ ...editingSupplier, email: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Warehouse / Office Address
              </label>
              <input
                type="text"
                value={editingSupplier.address || ''}
                onChange={(e) =>
                  setEditingSupplier({ ...editingSupplier, address: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingSupplier(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px]"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
