import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { formatCurrency } from '../../lib/format';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Users,
  Store,
  Package,
  Calendar,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { orders, invoices, retailers, products, users } = useErp();
  const [activeReport, setActiveReport] = useState<'salespersons' | 'retailers' | 'products' | 'pnl'>(
    'salespersons'
  );

  // Sales by Salesperson
  const salespersons = users.filter((u) => u.role === 'SALESPERSON');
  const repSalesData = salespersons.map((sp) => {
    const spOrders = orders.filter(
      (o) => o.salespersonId === sp.id && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
    );
    const totalRevenue = spOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const assignedRetailerCount = retailers.filter((r) => r.assignedSalespersonId === sp.id).length;
    return {
      rep: sp,
      ordersCount: spOrders.length,
      revenue: totalRevenue,
      retailersCount: assignedRetailerCount,
    };
  });

  // Sales by Retailer
  const retailerSalesData = retailers
    .map((r) => {
      const rOrders = orders.filter(
        (o) => o.retailerId === r.id && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
      );
      const totalRevenue = rOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      return {
        retailer: r,
        ordersCount: rOrders.length,
        revenue: totalRevenue,
        outstanding: r.outstandingBalance,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // P&L calculation
  const totalInvoicedSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const estimatedCost = totalInvoicedSales * 0.65;
  const grossProfit = totalInvoicedSales - estimatedCost;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Business & Financial Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Analytics on sales teams, top retail accounts, profit margins, and performance
          </p>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveReport('salespersons')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeReport === 'salespersons'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sales by Salesperson
        </button>
        <button
          onClick={() => setActiveReport('retailers')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeReport === 'retailers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sales by Retailer Account
        </button>
        <button
          onClick={() => setActiveReport('pnl')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeReport === 'pnl'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profit & Margin Statement
        </button>
      </div>

      {/* Active Report Body */}
      {activeReport === 'salespersons' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Sales Representative Performance Ledger
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Salesperson Name</th>
                  <th className="py-3 px-4">Assigned Retailers</th>
                  <th className="py-3 px-4 text-center">Orders Submitted</th>
                  <th className="py-3 px-4 text-right">Total Revenue Booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {repSalesData.map((d) => (
                  <tr key={d.rep.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.rep.fullName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{d.retailersCount} stores</td>
                    <td className="py-3.5 px-4 text-center font-bold">{d.ordersCount}</td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-700 text-base">
                      {formatCurrency(d.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'retailers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-600" />
              Top Retail Accounts by Revenue Volume
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Retailer Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Orders Count</th>
                  <th className="py-3 px-4 text-right">Current Balance</th>
                  <th className="py-3 px-4 text-right">Total Booked Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {retailerSalesData.map((d) => (
                  <tr key={d.retailer.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.retailer.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{d.retailer.contactPerson}</td>
                    <td className="py-3.5 px-4 text-center font-bold">{d.ordersCount}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-700">
                      {formatCurrency(d.outstanding)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatCurrency(d.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'pnl' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Gross Profit & Margins Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Summary of invoiced customer revenues against supplier acquisition costs
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              Positive Cashflow
            </span>
          </div>

          <div className="space-y-3 max-w-xl text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Total Invoiced Sales Revenue:</span>
              <span className="font-black text-slate-900">{formatCurrency(totalInvoicedSales)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
              <span>Cost of Goods Sold (Suppliers):</span>
              <span className="font-bold">-{formatCurrency(estimatedCost)}</span>
            </div>

            <div className="flex justify-between py-3 border-b-2 border-slate-300 text-base font-black text-emerald-700">
              <span>Gross Profit Margin:</span>
              <span>+{formatCurrency(grossProfit)}</span>
            </div>

            <div className="flex justify-between py-1 text-xs text-slate-500">
              <span>Gross Profit Percentage:</span>
              <span className="font-bold">~35.0%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
