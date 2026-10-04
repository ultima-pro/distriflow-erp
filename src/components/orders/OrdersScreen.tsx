import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import { Order, OrderStatus, OrderItem } from '../../types/erp';
import { ErpService } from '../../services/ErpService';
import { StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Calendar,
  User as UserIcon,
  Store,
  DollarSign,
} from 'lucide-react';

export const OrdersScreen: React.FC = () => {
  const { isOwner, currentUser } = useAuth();
  const {
    orders,
    retailers,
    users,
    setActiveTab,
    approveOrder,
    rejectOrder,
    requestOrderChanges,
    generateInvoice,
  } = useErp();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');
  const [actionType, setActionType] = useState<'REJECT' | 'CHANGES' | null>(null);

  // Filter based on role permissions
  const accessibleOrders = isOwner
    ? orders
    : orders.filter((o) => o.salespersonId === currentUser?.cloudId);

  const filteredOrders = accessibleOrders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.retailerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesRep =
      salespersonFilter === 'ALL' || o.salespersonId.toString() === salespersonFilter;
    return matchesSearch && matchesStatus && matchesRep;
  });

  const handleOpenDetail = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const items = await ErpService.getOrderItems(order.id);
      setSelectedOrderItems(items);
    } catch {
      setSelectedOrderItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleApprove = async (orderId: number) => {
    await approveOrder(orderId);
    setSelectedOrder(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedOrder) return;
    if (actionType === 'REJECT') {
      await rejectOrder(selectedOrder.id, actionFeedback || 'Rejected by Owner');
    } else if (actionType === 'CHANGES') {
      await requestOrderChanges(selectedOrder.id, actionFeedback || 'Please update order quantities');
    }
    setActionType(null);
    setActionFeedback('');
    setSelectedOrder(null);
  };

  const handleGenerateInvoice = async (orderId: number) => {
    await generateInvoice(orderId);
    setSelectedOrder(null);
  };

  const salespersonsList = users.filter((u) => u.role === 'SALESPERSON');

  return (
    <div className="space-y-6">
      {/* Top Header & New Order Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sales Orders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {isOwner
              ? 'Review field orders, approve for fulfillment, and issue invoices'
              : 'Track and manage your submitted customer orders'}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('new-order')}
          className="self-start sm:self-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 text-xs sm:text-sm min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Sales Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by order # or retailer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted (Pending)</option>
            <option value="APPROVED">Approved</option>
            <option value="INVOICED">Invoiced</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CHANGES_REQUESTED">Changes Requested</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Salesperson Filter (Owner Only) */}
        {isOwner && (
          <select
            value={salespersonFilter}
            onChange={(e) => setSalespersonFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Salespersons</option>
            {salespersonsList.map((sp) => (
              <option key={sp.id} value={sp.id.toString()}>
                {sp.fullName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No sales orders found</p>
            <p className="text-xs text-slate-400">Try changing your filters or create a new order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Retailer</th>
                  <th className="py-3 px-4">Salesperson</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleOpenDetail(order)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {order.retailerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{order.salespersonName}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg min-h-[36px] min-w-[36px]"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedOrder(null);
            setActionType(null);
          }}
          title={`Order ${selectedOrder.orderNumber}`}
          subtitle={`Placed by ${selectedOrder.salespersonName} on ${new Date(selectedOrder.orderDate).toLocaleString()}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Header info cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Retailer</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {selectedOrder.retailerName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Subtotal</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  ${selectedOrder.subtotal.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Total Amount</span>
                <span className="font-black text-blue-700 text-base mt-0.5 block">
                  ${selectedOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Notes & Feedback */}
            {selectedOrder.notes && (
              <div className="text-xs bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <span className="font-bold text-blue-900 block mb-0.5">Salesperson Notes:</span>
                <p className="text-blue-800">{selectedOrder.notes}</p>
              </div>
            )}

            {selectedOrder.ownerFeedback && (
              <div className="text-xs bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 block mb-0.5">Owner Review Feedback:</span>
                <p className="text-amber-800">{selectedOrder.ownerFeedback}</p>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Order Line Items
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                {loadingItems ? (
                  <div className="p-4 text-center text-slate-400">Loading line items...</div>
                ) : selectedOrderItems.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No items found</div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Disc %</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedOrderItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                          <td className="p-2.5 text-slate-500 font-mono">{item.productSku}</td>
                          <td className="p-2.5 text-center font-bold text-slate-800">
                            {item.quantity}
                          </td>
                          <td className="p-2.5 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="p-2.5 text-right text-slate-500">{item.discountPercent}%</td>
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

            {/* Action Dialog if Reject or Request Changes selected */}
            {actionType && (
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 space-y-3">
                <h5 className="font-bold text-xs text-amber-900 uppercase">
                  {actionType === 'REJECT' ? 'Reason for Rejection' : 'Specific Changes Requested'}
                </h5>
                <textarea
                  value={actionFeedback}
                  onChange={(e) => setActionFeedback(e.target.value)}
                  placeholder="Provide guidance to the salesperson..."
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-amber-200 text-xs outline-none bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setActionType(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-200 rounded-lg min-h-[36px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    className="px-4 py-1.5 text-xs text-white font-bold bg-amber-600 hover:bg-amber-700 rounded-lg min-h-[36px]"
                  >
                    Confirm {actionType === 'REJECT' ? 'Rejection' : 'Change Request'}
                  </button>
                </div>
              </div>
            )}

            {/* Owner Workflow Actions */}
            {isOwner && !actionType && (
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                {selectedOrder.status === 'SUBMITTED' && (
                  <>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(selectedOrder.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs min-h-[44px] flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Order
                      </button>
                      <button
                        onClick={() => setActionType('CHANGES')}
                        className="px-3 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold border border-amber-200 min-h-[44px]"
                      >
                        Request Changes
                      </button>
                    </div>

                    <button
                      onClick={() => setActionType('REJECT')}
                      className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200 min-h-[44px]"
                    >
                      Reject Order
                    </button>
                  </>
                )}

                {selectedOrder.status === 'APPROVED' && (
                  <button
                    onClick={() => handleGenerateInvoice(selectedOrder.id)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <FileText className="w-4 h-4" />
                    Generate Invoice & Schedule Delivery
                  </button>
                )}

                {selectedOrder.status === 'INVOICED' && (
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      setActiveTab('invoices');
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold min-h-[44px] flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    View Generated Invoice
                  </button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
