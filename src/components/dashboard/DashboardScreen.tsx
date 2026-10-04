import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp } from '../../context/ErpContext';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  Truck,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  PlusCircle,
  Building2,
  Calendar,
  BarChart2,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import { formatCurrency, formatCurrencyCompact } from '../../lib/format';

export const DashboardScreen: React.FC = () => {
  const { isOwner, currentUser } = useAuth();
  const {
    orders,
    retailers,
    products,
    suppliers,
    invoices,
    deliveries,
    payments,
    lowStockProducts,
    setActiveTab,
    startNewOrderForRetailer,
    approveOrder,
    rejectOrder,
  } = useErp();

  // Metrics calculation
  const now = Date.now();
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  // Filter orders by salesperson if not owner
  const accessibleOrders = isOwner
    ? orders
    : orders.filter((o) => o.salespersonId === currentUser?.cloudId || o.salespersonId === currentUser?.id);

  const todayOrders = accessibleOrders.filter(
    (o) => o.orderDate >= startOfToday && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
  );
  const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const monthOrders = accessibleOrders.filter(
    (o) => o.orderDate >= startOfMonth && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
  );
  const monthSales = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Receivables
  const totalReceivables = retailers.reduce((sum, r) => sum + Math.max(0, r.outstandingBalance), 0);
  const overdueInvoices = invoices.filter((i) => i.dueDate < now && i.remainingBalance > 0);
  const overdueReceivables = overdueInvoices.reduce((sum, i) => sum + i.remainingBalance, 0);

  // Payables & Inventory
  const totalPayables = suppliers.reduce((sum, s) => sum + Math.max(0, s.payableBalance), 0);
  const inventoryValue = products.reduce((sum, p) => sum + p.purchasePrice * p.currentStock, 0);

  // Pending Actions
  const pendingOrders = orders.filter((o) => o.status === 'SUBMITTED');
  const pendingDeliveries = deliveries.filter((d) => d.status === 'SCHEDULED' || d.status === 'DISPATCHED');
  const recentPayments = [...payments].sort((a, b) => b.paymentDate - a.paymentDate).slice(0, 5);

  // Basic P&L calculations (Owner)
  const totalInvoicedSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const estimatedCogs = totalInvoicedSales * 0.65; // ~65% purchase cost ratio
  const grossProfit = totalInvoicedSales - estimatedCogs;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {isOwner ? 'Executive Owner Portal' : 'Field Sales Workspace'}
              </span>
              <span className="text-blue-200/60 text-xs">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.fullName}
            </h1>
            <p className="text-sm text-blue-100/80 mt-1 max-w-xl">
              {isOwner
                ? 'Real-time overview of distribution sales, customer receivables, inventory health, and team order approvals.'
                : 'Manage your retail client visits, submit live sales orders, and track your payment collections.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('new-order')}
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Order</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all min-h-[44px]"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>{isOwner ? 'Financial Ledger' : 'Collect Payment'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(todaySales)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span className="text-emerald-600 font-bold">{todayOrders.length} orders</span> submitted today
          </p>
        </div>

        {/* Monthly Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Sales</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(monthSales)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {monthOrders.length} orders this month
          </p>
        </div>

        {/* Receivables */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Retailer Receivables</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(totalReceivables)}
          </p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
            {overdueReceivables > 0 && <span>{formatCurrencyCompact(overdueReceivables)} overdue</span>}
          </p>
        </div>

        {/* Supplier Payables or Assigned Retailers */}
        {isOwner ? (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier Payables</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {formatCurrency(totalPayables)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {suppliers.length} active suppliers
            </p>
          </div>
        ) : (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Retail Clients</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {retailers.filter((r) => r.assignedSalespersonId === currentUser?.cloudId || r.assignedSalespersonId === currentUser?.id).length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Assigned retail accounts
            </p>
          </div>
        )}
      </div>

      {/* Owner Financial & Inventory Overview Bar */}
      {isOwner && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold">Inventory Value</span>
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {formatCurrency(inventoryValue)}
            </p>
          </div>

          <div
            onClick={() => setActiveTab('products')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              lowStockProducts.length > 0
                ? 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold">Low Stock Alerts</span>
            </div>
            <p className="text-lg font-bold mt-1">
              {lowStockProducts.length} Products Low
            </p>
          </div>

          <div
            onClick={() => setActiveTab('orders')}
            className="p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold">Pending Approval</span>
            </div>
            <p className="text-lg font-bold mt-1">
              {pendingOrders.length} Sales Orders
            </p>
          </div>

          <div
            onClick={() => setActiveTab('deliveries')}
            className="p-4 rounded-xl border bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold">In Logistics</span>
            </div>
            <p className="text-lg font-bold mt-1">
              {pendingDeliveries.length} Shipments
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Pending Approval Orders + Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Orders Pending Review */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {isOwner ? 'Recent Orders Pending Approval' : 'My Recent Orders'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isOwner ? 'Verify stock quantities and approve for dispatch' : 'Live status of submitted customer orders'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {accessibleOrders.slice(0, 5).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No orders submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {accessibleOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 rounded-xl px-2 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{order.orderNumber}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        {order.retailerName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        By {order.salespersonName} • {new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400">Total</span>
                      </div>

                      {isOwner ? (
                        <div className="flex items-center gap-1.5">
                          {order.status === 'SUBMITTED' && (
                            <>
                              <button
                                onClick={() => approveOrder(order.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs min-h-[36px]"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Reason for rejection:');
                                  if (reason) rejectOrder(order.id, reason);
                                }}
                                className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold border border-rose-200 min-h-[36px]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setActiveTab('orders')}
                            className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
                          >
                            Details
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Graphical Business Analytics (Owner View) */}
          {isOwner && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  Monthly Performance & Gross Margin Breakdown
                </h3>
                <span className="text-xs text-slate-400 font-medium">Estimated YTD</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-bold text-blue-700 uppercase">Gross Revenue</span>
                  <p className="text-lg font-black text-blue-950 mt-0.5">{formatCurrency(totalInvoicedSales)}</p>
                  <span className="text-[10px] text-blue-600">From invoiced shipments</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 uppercase">COGS (Purchase Cost)</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(estimatedCogs)}</p>
                  <span className="text-[10px] text-slate-500">Supplier inventory cost</span>
                </div>
                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">Gross Margin</span>
                  <p className="text-lg font-black text-emerald-950 mt-0.5">{formatCurrency(grossProfit)}</p>
                  <span className="text-[10px] text-emerald-600 font-bold">~35.0% profit margin</span>
                </div>
              </div>

              {/* Visual distribution bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Gross Margin Ratio</span>
                  <span>35% Net Gross Profit</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: '35%' }} title="Gross Margin" />
                  <div className="h-full bg-blue-500" style={{ width: '50%' }} title="Cost of Goods Sold" />
                  <div className="h-full bg-amber-400" style={{ width: '15%' }} title="Logistics & Delivery" />
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Margin</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Product COGS</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Logistics</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Low Stock Alerts & Recent Collections */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Low Stock Thresholds
              </h3>
              <button
                onClick={() => setActiveTab('products')}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Catalog
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">All product stocks are healthy.</p>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-500">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-rose-700 text-sm">
                        {p.currentStock} {p.unit}
                      </span>
                      <p className="text-[10px] text-slate-400">Min: {p.minStockLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payments & Collections */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Recent Payment Collections
              </h3>
              <button
                onClick={() => setActiveTab('payments')}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                All
              </button>
            </div>

            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No payment entries recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {recentPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{pay.entityName}</p>
                      <p className="text-[11px] text-slate-400">
                        {pay.paymentMethod.replace(/_/g, ' ')} • {pay.recordedByName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black ${
                          pay.type === 'RETAILER_COLLECTION' ? 'text-emerald-700' : 'text-slate-800'
                        }`}
                      >
                        +{formatCurrency(pay.amount)}
                      </span>
                      <p className="text-[10px] text-slate-400">{new Date(pay.paymentDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
