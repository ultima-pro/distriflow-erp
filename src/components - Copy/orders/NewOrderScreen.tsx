import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { Retailer, Product, OrderLineDraft } from '../../types/erp';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Store,
  Package,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';

export const NewOrderScreen: React.FC = () => {
  const { currentUser, isOwner } = useAuth();
  const {
    retailers,
    products,
    preselectedRetailer,
    setActiveTab,
    createOrder,
  } = useErp();

  // Selected Retailer
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(
    preselectedRetailer || null
  );
  const [retailerSearch, setRetailerSearch] = useState('');

  // Line items
  const [items, setItems] = useState<OrderLineDraft[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedRetailer) {
      setSelectedRetailer(preselectedRetailer);
    }
  }, [preselectedRetailer]);

  // Accessible Retailers
  const accessibleRetailers = isOwner
    ? retailers.filter((r) => r.isActive)
    : retailers.filter(
        (r) => r.isActive && (r.assignedSalespersonId === currentUser?.id || !r.assignedSalespersonId)
      );

  const filteredRetailers = accessibleRetailers.filter(
    (r) =>
      r.name.toLowerCase().includes(retailerSearch.toLowerCase()) ||
      r.contactPerson.toLowerCase().includes(retailerSearch.toLowerCase()) ||
      r.address.toLowerCase().includes(retailerSearch.toLowerCase())
  );

  // Filtered Products
  const activeProducts = products.filter((p) => p.isActive);
  const filteredProducts = activeProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Add product to draft
  const handleAddProduct = (product: Product) => {
    const existingIndex = items.findIndex((it) => it.product.id === product.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      const cur = updated[existingIndex];
      const newQty = cur.quantity + 1;
      const total = newQty * cur.unitPrice * (1 - cur.discountPercent / 100);
      updated[existingIndex] = { ...cur, quantity: newQty, total };
      setItems(updated);
    } else {
      const newLine: OrderLineDraft = {
        product,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discountPercent: 0,
        total: product.sellingPrice,
      };
      setItems([...items, newLine]);
    }
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...items];
    const item = updated[index];
    const total = newQty * item.unitPrice * (1 - item.discountPercent / 100);
    updated[index] = { ...item, quantity: newQty, total };
    setItems(updated);
  };

  const handleUpdateUnitPrice = (index: number, price: number) => {
    const validPrice = Math.max(0, price);
    const updated = [...items];
    const item = updated[index];
    const total = item.quantity * validPrice * (1 - item.discountPercent / 100);
    updated[index] = { ...item, unitPrice: validPrice, total };
    setItems(updated);
  };

  const handleUpdateDiscount = (index: number, discountPercent: number) => {
    const validDiscount = Math.min(100, Math.max(0, discountPercent));
    const updated = [...items];
    const item = updated[index];
    const total = item.quantity * item.unitPrice * (1 - validDiscount / 100);
    updated[index] = { ...item, discountPercent: validDiscount, total };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Totals
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const grandTotal = items.reduce((sum, it) => sum + it.total, 0);
  const totalDiscount = subtotal - grandTotal;

  // Credit limit check
  const exceedsCreditLimit =
    selectedRetailer &&
    selectedRetailer.creditLimit > 0 &&
    selectedRetailer.outstandingBalance + grandTotal > selectedRetailer.creditLimit;

  // Submit Order
  const handleSubmitOrder = async (isDraft: boolean = false) => {
    if (!selectedRetailer) {
      alert('Please select a retailer');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one product item');
      return;
    }

    setSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now() % 1000000}`;
      await createOrder(
        {
          orderNumber,
          retailerId: selectedRetailer.id,
          retailerName: selectedRetailer.name,
          salespersonId: currentUser?.cloudId || '',
          salespersonName: currentUser?.fullName || 'Salesperson',
          orderDate: Date.now(),
          status: isDraft ? 'DRAFT' : 'SUBMITTED',
          subtotal,
          discount: totalDiscount,
          totalAmount: grandTotal,
          notes,
        },
        items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          productSku: it.product.sku,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          total: it.total,
        }))
      );
      setActiveTab('orders');
    } catch (err: any) {
      alert(err.message || 'Error submitting order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Create Sales Order
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Field order creation for retailers with real-time stock & custom pricing
          </p>
        </div>
      </div>

      {/* Step 1: Retailer Selection */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            1. Select Retailer / Customer
          </h3>
          {selectedRetailer && (
            <button
              onClick={() => setSelectedRetailer(null)}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              Change Retailer
            </button>
          )}
        </div>

        {!selectedRetailer ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search retailers by name, contact, or address..."
                value={retailerSearch}
                onChange={(e) => setRetailerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
              {filteredRetailers.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRetailer(r)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all text-xs"
                >
                  <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{r.contactPerson} • {r.phone}</p>
                  <p className="text-slate-400 text-[10px] truncate mt-1">{r.address}</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between font-semibold">
                    <span className="text-slate-500">Balance:</span>
                    <span className={r.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-700'}>
                      Rs. {r.outstandingBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-extrabold text-blue-950 text-base">{selectedRetailer.name}</p>
              <p className="text-blue-800 text-xs mt-0.5">
                Contact: {selectedRetailer.contactPerson} • {selectedRetailer.phone}
              </p>
              <p className="text-blue-700/80 text-[11px] mt-0.5">{selectedRetailer.address}</p>
            </div>

            <div className="flex sm:flex-col items-end gap-2 text-right">
              <div>
                <span className="text-blue-700 font-semibold text-[11px] block">Current Balance:</span>
                <span className="font-black text-slate-900 text-sm">
                  Rs. {selectedRetailer.outstandingBalance.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">
                  Credit Limit: Rs. {selectedRetailer.creditLimit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Credit warning */}
        {exceedsCreditLimit && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Credit Limit Warning:</strong> This order will exceed the retailer's credit limit
              (Rs. {selectedRetailer?.creditLimit.toFixed(2)}). An Owner approval will be strictly required.
            </span>
          </div>
        )}
      </div>

      {/* Step 2: Add Line Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Picker (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            2. Available Catalog
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const inStock = p.currentStock > 0;
              return (
                <div
                  key={p.id}
                  onClick={() => inStock && handleAddProduct(p)}
                  className={`p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    inStock
                      ? 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer'
                      : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-400">SKU: {p.sku} • {p.category}</p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.currentStock <= p.minStockLevel
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Stock: {p.currentStock} {p.unit}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-slate-900 text-sm">
                      Rs. {p.sellingPrice.toFixed(2)}
                    </p>
                    <button
                      type="button"
                      disabled={!inStock}
                      className="mt-1 px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-95 text-[11px] disabled:opacity-30"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Line Items & Pricing (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>3. Order Items ({items.length})</span>
              {items.length > 0 && (
                <button
                  onClick={() => setItems([])}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Clear All
                </button>
              )}
            </h3>

            {items.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-3">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No products added yet</p>
                <p className="text-xs text-slate-400">Select items from the catalog on the left.</p>
              </div>
            ) : (
              <div className="space-y-3 mt-3 max-h-[300px] overflow-y-auto pr-1">
                {items.map((line, idx) => (
                  <div
                    key={line.product.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">{line.product.name}</p>
                      <p className="text-[11px] text-slate-500">
                        SKU: {line.product.sku} • {line.product.unit}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                      {/* Editable Price */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-xs">Rs.</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) => handleUpdateUnitPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-16 p-1.5 text-center font-semibold text-xs border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Qty Stepper */}
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, line.quantity - 1)}
                          className="p-1 text-slate-600 hover:bg-slate-100 min-h-[32px] min-w-[28px] flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value) || 1)}
                          className="w-10 text-center text-xs font-bold outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, line.quantity + 1)}
                          className="p-1 text-slate-600 hover:bg-slate-100 min-h-[32px] min-w-[28px] flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Discount % */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={line.discountPercent}
                          onChange={(e) => handleUpdateDiscount(idx, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-10 p-1.5 text-center text-xs border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-500"
                        />
                        <span className="text-slate-400 text-xs">%</span>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[60px]">
                        <span className="font-black text-slate-900 text-sm block">
                          Rs. {line.total.toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Totals & Notes */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Remarks / Delivery Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Deliver before 11 AM, side gate entrance..."
                rows={2}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>

            {/* Calculations Box */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Line Item Discounts:</span>
                  <span>-Rs. {totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-blue-700">Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                disabled={submitting || items.length === 0 || !selectedRetailer}
                onClick={() => handleSubmitOrder(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-40"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit Order for Approval</span>
              </button>

              <button
                type="button"
                disabled={submitting || items.length === 0 || !selectedRetailer}
                onClick={() => handleSubmitOrder(true)}
                className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors min-h-[48px] disabled:opacity-40"
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};