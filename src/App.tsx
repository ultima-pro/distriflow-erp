import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErpProvider, useErp } from './context/ErpContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginModal } from './components/auth/LoginModal';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { OrdersScreen } from './components/orders/OrdersScreen';
import { NewOrderScreen } from './components/orders/NewOrderScreen';
import { RetailersScreen } from './components/retailers/RetailersScreen';
import { ProductsScreen } from './components/products/ProductsScreen';
import { SuppliersScreen } from './components/suppliers/SuppliersScreen';
import { InvoicesScreen } from './components/invoices/InvoicesScreen';
import { DeliveriesScreen } from './components/deliveries/DeliveriesScreen';
import { PaymentsScreen } from './components/payments/PaymentsScreen';
import { InventoryAuditScreen } from './components/inventory/InventoryAuditScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { SalespersonsScreen } from './components/salespersons/SalespersonsScreen';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { activeTab } = useErp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'orders':
        return <OrdersScreen />;
      case 'new-order':
        return <NewOrderScreen />;
      case 'retailers':
        return <RetailersScreen />;
      case 'products':
        return <ProductsScreen />;
      case 'suppliers':
        return <SuppliersScreen />;
      case 'invoices':
        return <InvoicesScreen />;
      case 'deliveries':
        return <DeliveriesScreen />;
      case 'payments':
        return <PaymentsScreen />;
      case 'inventory':
        return <InventoryAuditScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'salespersons':
        return <SalespersonsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-10">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Android Mobile Browsers) */}
      <MobileBottomNav onOpenMenu={() => setMobileSidebarOpen(true)} />

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ErpProvider>
        <MainLayout />
      </ErpProvider>
    </AuthProvider>
  );
};

export default App;
