import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { Product } from '../../types/erp';
import { Modal } from '../common/Modal';
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  ArrowUpDown,
  History,
  Edit2,
  Boxes,
  CheckCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const ProductsScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const {
    products,
    suppliers,
    movements,
    saveProduct,
    adjustStock,
    setActiveTab,
  } = useErp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Edit / Add modal
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjDelta, setAdjDelta] = useState<number>(0);
  const [adjReason, setAdjReason] = useState<string>('');

  // Product History Modal
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesLowStock = !onlyLowStock || p.currentStock <= p.minStockLevel;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleStartAdd = () => {
    setEditingProduct({
      sku: `SKU-${Date.now() % 10000}`,
      name: '',
      category: categories[0] || 'General',
      unit: 'Unit',
      purchasePrice: 10,
      sellingPrice: 15,
      currentStock: 0,
      minStockLevel: 10,
      supplierId: suppliers[0]?.id || null,
      isActive: true,
    });
    setIsEditing(true);
  };

  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setIsEditing(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name?.trim() || !editingProduct.sku?.trim()) return;

    const supplierObj = suppliers.find((s) => s.id === editingProduct.supplierId);

    await saveProduct({
      id: editingProduct.id,
      sku: editingProduct.sku.trim(),
      name: editingProduct.name.trim(),
      category: editingProduct.category || 'General',
      unit: editingProduct.unit || 'Unit',
      purchasePrice: Number(editingProduct.purchasePrice) || 0,
      sellingPrice: Number(editingProduct.sellingPrice) || 0,
      currentStock: Number(editingProduct.currentStock) || 0,
      minStockLevel: Number(editingProduct.minStockLevel) || 5,
      supplierId: editingProduct.supplierId || null,
      supplierName: supplierObj?.name,
      isActive: editingProduct.isActive ?? true,
    });

    setIsEditing(false);
    setEditingProduct(null);
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjDelta === 0) return;
    await adjustStock(adjustingProduct.id, adjDelta, adjReason || 'Manual Inventory Adjustment');
    setAdjustingProduct(null);
    setAdjDelta(0);
    setAdjReason('');
  };

  const productMovements = historyProduct
    ? movements.filter((m) => m.productId === historyProduct.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Products & Inventory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Wholesale stock levels, pricing, category management, and physical inventory audits
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartAdd}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 text-xs sm:text-sm min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search products by SKU, name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border transition-colors min-h-[40px] ${
            onlyLowStock
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Stock</th>
                {isOwner && <th className="py-3 px-4 text-right">Cost Price</th>}
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map((p) => {
                const isLow = p.currentStock <= p.minStockLevel;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{p.sku}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-400">Unit: {p.unit}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-md font-semibold">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block font-black text-sm px-2 py-0.5 rounded-lg ${
                          isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {p.currentStock} {p.unit}
                      </span>
                      {isLow && (
                        <span className="block text-[10px] text-rose-600 font-bold mt-0.5">
                          Min: {p.minStockLevel}
                        </span>
                      )}
                    </td>

                    {isOwner && (
                      <td className="py-3.5 px-4 text-right text-slate-500 font-semibold">
                        ${p.purchasePrice.toFixed(2)}
                      </td>
                    )}

                    <td className="py-3.5 px-4 text-right font-black text-blue-700 text-sm">
                      ${p.sellingPrice.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isOwner && (
                          <>
                            <button
                              onClick={() => {
                                setAdjustingProduct(p);
                                setAdjDelta(0);
                                setAdjReason('');
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Auditable Stock Adjustment"
                            >
                              <ArrowUpDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setHistoryProduct(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="View Inventory Movements"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <Modal
          isOpen={true}
          onClose={() => setAdjustingProduct(null)}
          title={`Adjust Stock: ${adjustingProduct.name}`}
          subtitle={`Current physical stock: ${adjustingProduct.currentStock} ${adjustingProduct.unit}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmAdjustment} className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
              Auditable inventory adjustment will record previous stock, new stock, timestamp, and
              reason into the immutable stock ledger.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Stock Change (+ or -) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  value={adjDelta || ''}
                  onChange={(e) => setAdjDelta(parseInt(e.target.value) || 0)}
                  placeholder="e.g. +25 or -5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold outline-none"
                />
                <span className="text-xs font-semibold text-slate-500">{adjustingProduct.unit}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                New stock will be: <strong>{adjustingProduct.currentStock + adjDelta}</strong>{' '}
                {adjustingProduct.unit}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason / Note *
              </label>
              <input
                type="text"
                required
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="e.g. Physical inventory count correction, damaged goods write-off..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjDelta === 0}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px] disabled:opacity-40"
              >
                Save Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Product Modal */}
      {isEditing && editingProduct && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsEditing(false);
            setEditingProduct(null);
          }}
          title={editingProduct.id ? 'Edit Product' : 'Add New Product'}
          subtitle="Configure pricing, categories, and minimum threshold"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  SKU / Code *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.sku || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.category || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, category: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={editingProduct.name || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Unit of Measure
                </label>
                <input
                  type="text"
                  value={editingProduct.unit || 'Box'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                  placeholder="e.g. Box, Case, Kg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Purchase Cost ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingProduct.purchasePrice ?? 0}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      purchasePrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Selling Price ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={editingProduct.sellingPrice ?? 0}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      sellingPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none font-bold text-blue-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Initial / Current Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.currentStock ?? 0}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      currentStock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Min Stock Alert Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.minStockLevel ?? 5}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      minStockLevel: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Default Supplier
              </label>
              <select
                value={editingProduct.supplierId || ''}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    supplierId: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none bg-white"
              >
                <option value="">No specific supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs min-h-[44px]"
              >
                Save Product
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Product Movement History Modal */}
      {historyProduct && (
        <Modal
          isOpen={true}
          onClose={() => setHistoryProduct(null)}
          title={`Inventory Audit History: ${historyProduct.name}`}
          subtitle={`SKU: ${historyProduct.sku} • Current Stock: ${historyProduct.currentStock} ${historyProduct.unit}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {productMovements.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs">
                No recorded stock movements for this item yet.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-center">Change</th>
                      <th className="p-2.5 text-center">New Stock</th>
                      <th className="p-2.5">Reference / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {productMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-slate-500">
                          {new Date(m.timestamp).toLocaleDateString()}
                        </td>
                        <td className="p-2.5 font-bold">{m.movementType}</td>
                        <td
                          className={`p-2.5 text-center font-black ${
                            m.quantity >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-800">
                          {m.newStock}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          <span className="font-semibold text-slate-900 block">
                            {m.referenceNumber || m.referenceType}
                          </span>
                          <span className="text-[11px] text-slate-400">{m.reasonOrNotes}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
