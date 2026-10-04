import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErp, ErpTab } from '../../context/ErpContext';
import {
  LayoutDashboard,
  ShoppingCart,
  PlusCircle,
  Store,
  Package,
  Truck,
  FileText,
  DollarSign,
  Boxes,
  BarChart3,
  Users2,
  Factory,
  ChevronRight,
  Shield,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { isOwner, currentUser } = useAuth();
  const { activeTab, setActiveTab, orders, lowStockProducts } = useErp();

  // Pending orders badge count
  const pendingOrdersCount = orders.filter((o) => o.status === 'SUBMITTED').length;

  const handleSelect = (tab: ErpTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const navItemClass = (tab: ErpTab) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] ${
      activeTab === tab
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen lg:h-[calc(100vh-57px)]`}
      >
        {/* Mobile Header in Drawer */}
        <div className="lg:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <span className="font-bold text-slate-800 text-sm">DistriFlow ERP</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* User Role Tag */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workspace Role
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isOwner
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              {isOwner ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
              {currentUser?.role}
            </span>
          </div>
        </div>

        {/* Scrollable Nav List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Section 1: Overview */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Overview
            </p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleSelect('dashboard')}
                  className={navItemClass('dashboard')}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>

          {/* Section 2: Distribution Operations */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Field & Sales Orders
            </p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleSelect('new-order')}
                  className={navItemClass('new-order')}
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-emerald-500" />
                    <span>Create Order</span>
                  </div>
                </button>
              </li>
              <li>
                <button onClick={() => handleSelect('orders')} className={navItemClass('orders')}>
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Sales Orders</span>
                  </div>
                  {isOwner && pendingOrdersCount > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSelect('retailers')}
                  className={navItemClass('retailers')}
                >
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4" />
                    <span>Retailers / Customers</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSelect('invoices')}
                  className={navItemClass('invoices')}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4" />
                    <span>Invoices</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSelect('deliveries')}
                  className={navItemClass('deliveries')}
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4" />
                    <span>Deliveries</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSelect('payments')}
                  className={navItemClass('payments')}
                >
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4" />
                    <span>Payments & Collections</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>

          {/* Section 3: Supply Chain & Warehouse */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Supply & Warehouse
            </p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleSelect('products')}
                  className={navItemClass('products')}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>Products & Stock</span>
                  </div>
                  {lowStockProducts.length > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {lowStockProducts.length}
                    </span>
                  )}
                </button>
              </li>

              {isOwner && (
                <li>
                  <button
                    onClick={() => handleSelect('suppliers')}
                    className={navItemClass('suppliers')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Factory className="w-4 h-4" />
                      <span>Suppliers & Purchases</span>
                    </div>
                  </button>
                </li>
              )}

              <li>
                <button
                  onClick={() => handleSelect('inventory')}
                  className={navItemClass('inventory')}
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="w-4 h-4" />
                    <span>Stock Audit Ledger</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>

          {/* Section 4: Analytics & Team (Owner Only) */}
          {isOwner && (
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Owner Insights
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleSelect('reports')}
                    className={navItemClass('reports')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4" />
                      <span>Financial & Sales Reports</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelect('salespersons')}
                    className={navItemClass('salespersons')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users2 className="w-4 h-4" />
                      <span>Sales Team</span>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 font-medium">
            <span>DistriFlow v2.0 Web</span>
            <span>Cloud Architecture</span>
          </div>
        </div>
      </aside>
    </>
  );
};
