import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Retailer,
  Supplier,
  Product,
  Order,
  Invoice,
  Delivery,
  Payment,
  InventoryMovement,
  User,
  OrderItem,
  PaymentMethod,
  Purchase,
} from '../types/erp';
import { ErpService } from '../services/ErpService';
import { useAuth } from './AuthContext';
import { formatCurrency } from '../lib/format';

export type ErpTab =
  | 'dashboard'
  | 'orders'
  | 'new-order'
  | 'retailers'
  | 'products'
  | 'suppliers'
  | 'invoices'
  | 'deliveries'
  | 'payments'
  | 'inventory'
  | 'reports'
  | 'salespersons';

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ErpContextType {
  activeTab: ErpTab;
  setActiveTab: (tab: ErpTab) => void;
  preselectedRetailer: Retailer | null;
  startNewOrderForRetailer: (retailer: Retailer) => void;

  // Data State
  retailers: Retailer[];
  suppliers: Supplier[];
  products: Product[];
  orders: Order[];
  invoices: Invoice[];
  deliveries: Delivery[];
  payments: Payment[];
  movements: InventoryMovement[];
  users: User[];
  purchases: Purchase[];
  lowStockProducts: Product[];
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Actions
  createOrder: (
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ) => Promise<Order>;
  approveOrder: (orderId: number, feedback?: string) => Promise<void>;
  rejectOrder: (orderId: number, feedback: string) => Promise<void>;
  requestOrderChanges: (orderId: number, feedback: string) => Promise<void>;
  deleteOrder: (orderId: number) => Promise<void>;

  generateInvoice: (orderId: number) => Promise<Invoice>;
  deleteInvoice: (invoiceId: number) => Promise<void>;

  moveOrderForDelivery: (
    orderId: number,
    options?: {
      deliveryAddress?: string;
      driverName?: string;
      driverPhone?: string;
      notes?: string;
    }
  ) => Promise<Delivery>;
  dispatchDelivery: (id: number, driver: string, phone: string, notes: string) => Promise<void>;
  completeDelivery: (id: number, notes: string) => Promise<void>;
  deleteDelivery: (deliveryId: number) => Promise<void>;

  saveRetailer: (retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number }) => Promise<Retailer>;
  deleteRetailer: (retailerId: number) => Promise<{ deleted: boolean; deactivated: boolean }>;

  saveProduct: (product: Omit<Product, 'id' | 'createdAt'> & { id?: number }) => Promise<Product>;
  adjustStock: (productId: number, delta: number, reason: string) => Promise<void>;
  deleteProduct: (productId: number) => Promise<{ deleted: boolean; deactivated: boolean }>;
  deleteMovement: (movementId: number) => Promise<void>;

  saveSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number }) => Promise<Supplier>;
  deleteSupplier: (supplierId: number) => Promise<{ deleted: boolean; deactivated: boolean }>;

  recordPurchase: (
    supplierId: number,
    billNumber: string,
    items: { product: Product; quantity: number }[],
    notes: string
  ) => Promise<void>;
  deletePurchase: (purchaseId: number) => Promise<void>;

  recordRetailerPayment: (
    retailerId: number,
    invoiceId: number | null,
    amount: number,
    method: PaymentMethod,
    ref: string,
    notes: string
  ) => Promise<void>;
  recordSupplierPayment: (
    supplierId: number,
    purchaseId: number | null,
    amount: number,
    method: PaymentMethod,
    ref: string,
    notes: string
  ) => Promise<void>;
  deletePayment: (paymentId: number) => Promise<void>;

  saveUser: (user: Omit<User, 'id' | 'createdAt'> & { id?: number }) => Promise<User>;
  deleteUser: (userId: number) => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  isUsingSupabase: boolean;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ErpTab>('dashboard');
  const [preselectedRetailer, setPreselectedRetailer] = useState<Retailer | null>(null);

  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        loadedRetailers,
        loadedSuppliers,
        loadedProducts,
        loadedOrders,
        loadedInvoices,
        loadedDeliveries,
        loadedPayments,
        loadedMovements,
        loadedUsers,
        loadedPurchases,
      ] = await Promise.all([
        ErpService.getRetailers(),
        ErpService.getSuppliers(),
        ErpService.getProducts(),
        ErpService.getOrders(),
        ErpService.getInvoices(),
        ErpService.getDeliveries(),
        ErpService.getPayments(),
        ErpService.getMovements(),
        ErpService.getUsers(),
        ErpService.getPurchases(),
      ]);

      setRetailers(loadedRetailers);
      setSuppliers(loadedSuppliers);
      setProducts(loadedProducts);
      setOrders(loadedOrders);
      setInvoices(loadedInvoices);
      setDeliveries(loadedDeliveries);
      setPayments(loadedPayments);
      setMovements(loadedMovements);
      setUsers(loadedUsers);
      setPurchases(loadedPurchases);
    } catch (err: any) {
      showToast(err.message || 'Error loading ERP data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockLevel && p.isActive);

  const startNewOrderForRetailer = (retailer: Retailer) => {
    setPreselectedRetailer(retailer);
    setActiveTab('new-order');
  };

  // Actions
  const createOrder = async (
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ) => {
    try {
      const created = await ErpService.createOrder(order, items);
      await refreshData();
      showToast(`Order ${created.orderNumber} placed successfully`, 'success');
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to place order', 'error');
      throw err;
    }
  };

  const approveOrder = async (orderId: number, feedback?: string) => {
    try {
      await ErpService.approveOrder(orderId, feedback);
      await refreshData();
      showToast(`Order #${orderId} approved successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve order', 'error');
      throw err;
    }
  };

  const rejectOrder = async (orderId: number, feedback: string) => {
    try {
      await ErpService.rejectOrder(orderId, feedback);
      await refreshData();
      showToast(`Order #${orderId} rejected`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to reject order', 'error');
      throw err;
    }
  };

  const requestOrderChanges = async (orderId: number, feedback: string) => {
    try {
      await ErpService.requestOrderChanges(orderId, feedback);
      await refreshData();
      showToast(`Requested changes on order #${orderId}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to request changes', 'error');
      throw err;
    }
  };

  const deleteOrder = async (orderId: number) => {
    try {
      await ErpService.deleteOrder(orderId);
      await refreshData();
      showToast(`Order #${orderId} deleted successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete order', 'error');
      throw err;
    }
  };

  const generateInvoice = async (orderId: number) => {
    try {
      const invoice = await ErpService.generateInvoiceFromOrder(orderId);
      await refreshData();
      showToast(`Invoice ${invoice.invoiceNumber} generated successfully. Ready to move for delivery.`, 'success');
      return invoice;
    } catch (err: any) {
      showToast(err.message || 'Failed to generate invoice', 'error');
      throw err;
    }
  };

  const deleteInvoice = async (invoiceId: number) => {
    try {
      await ErpService.deleteInvoice(invoiceId);
      await refreshData();
      showToast('Invoice deleted and order returned to approved state', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete invoice', 'error');
      throw err;
    }
  };

  const moveOrderForDelivery = async (
    orderId: number,
    options?: {
      deliveryAddress?: string;
      driverName?: string;
      driverPhone?: string;
      notes?: string;
    }
  ) => {
    try {
      const delivery = await ErpService.moveOrderForDelivery(orderId, options);
      await refreshData();
      showToast(`Order moved for delivery! Scheduled delivery #${delivery.id} created.`, 'success');
      return delivery;
    } catch (err: any) {
      showToast(err.message || 'Failed to move order for delivery', 'error');
      throw err;
    }
  };

  const dispatchDelivery = async (id: number, driver: string, phone: string, notes: string) => {
    try {
      await ErpService.dispatchDelivery(id, driver, phone, notes);
      await refreshData();
      showToast('Delivery marked as dispatched', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch delivery', 'error');
      throw err;
    }
  };

  const completeDelivery = async (id: number, notes: string) => {
    try {
      await ErpService.completeDelivery(id, notes);
      await refreshData();
      showToast('Delivery completed! Inventory stock and movements updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to complete delivery', 'error');
      throw err;
    }
  };

  const deleteDelivery = async (deliveryId: number) => {
    try {
      await ErpService.deleteDelivery(deliveryId);
      await refreshData();
      showToast('Delivery record deleted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete delivery', 'error');
      throw err;
    }
  };

  const saveRetailer = async (retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number }) => {
    try {
      const res = await ErpService.saveRetailer(retailer);
      await refreshData();
      showToast(`Retailer '${res.name}' saved`, 'success');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to save retailer', 'error');
      throw err;
    }
  };

  const deleteRetailer = async (retailerId: number) => {
    try {
      const res = await ErpService.deleteRetailer(retailerId);
      await refreshData();
      if (res?.deactivated) {
        showToast('Retailer has transaction history and was deactivated instead of deleted', 'info');
      } else {
        showToast('Retailer deleted successfully', 'success');
      }
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to delete retailer', 'error');
      throw err;
    }
  };

  const saveProduct = async (product: Omit<Product, 'id' | 'createdAt'> & { id?: number }) => {
    try {
      const res = await ErpService.saveProduct(product);
      await refreshData();
      showToast(`Product '${res.name}' saved`, 'success');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
      throw err;
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      const res = await ErpService.deleteProduct(productId);
      await refreshData();
      if (res?.deactivated) {
        showToast('Product has historical records and was deactivated instead of deleted', 'info');
      } else {
        showToast('Product deleted successfully', 'success');
      }
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
      throw err;
    }
  };

  const adjustStock = async (productId: number, delta: number, reason: string) => {
    try {
      await ErpService.recordStockAdjustment(productId, delta, reason);
      await refreshData();
      showToast(`Stock adjusted by ${delta > 0 ? '+' : ''}${delta}. Movement logged.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust stock', 'error');
      throw err;
    }
  };

  const deleteMovement = async (movementId: number) => {
    try {
      await ErpService.deleteMovement(movementId);
      await refreshData();
      showToast('Movement record deleted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete movement record', 'error');
      throw err;
    }
  };

  const saveSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number }) => {
    try {
      const res = await ErpService.saveSupplier(supplier);
      await refreshData();
      showToast(`Supplier '${res.name}' saved`, 'success');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to save supplier', 'error');
      throw err;
    }
  };

  const deleteSupplier = async (supplierId: number) => {
    try {
      const res = await ErpService.deleteSupplier(supplierId);
      await refreshData();
      if (res?.deactivated) {
        showToast('Supplier has purchase records and was deactivated instead of deleted', 'info');
      } else {
        showToast('Supplier deleted successfully', 'success');
      }
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to delete supplier', 'error');
      throw err;
    }
  };

  const recordPurchase = async (
    supplierId: number,
    billNumber: string,
    items: { product: Product; quantity: number }[],
    notes: string
  ) => {
    try {
      await ErpService.createPurchase(supplierId, billNumber, items, notes);
      await refreshData();
      showToast(`Purchase bill recorded. Stock & payables updated.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to record purchase', 'error');
      throw err;
    }
  };

  const deletePurchase = async (purchaseId: number) => {
    try {
      await ErpService.deletePurchase(purchaseId);
      await refreshData();
      showToast('Purchase record deleted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete purchase', 'error');
      throw err;
    }
  };

  const recordRetailerPayment = async (
    retailerId: number,
    invoiceId: number | null,
    amount: number,
    method: PaymentMethod,
    ref: string,
    notes: string
  ) => {
    if (!currentUser) return;
    try {
      const userId = currentUser.cloudId || currentUser.id;
      await ErpService.recordRetailerPayment(
        retailerId,
        invoiceId,
        amount,
        method,
        ref,
        notes,
        userId,
        currentUser.fullName
      );
      await refreshData();
      showToast(`Payment of ${formatCurrency(amount)} recorded. Customer balance updated.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment collection', 'error');
      throw err;
    }
  };

  const recordSupplierPayment = async (
    supplierId: number,
    purchaseId: number | null,
    amount: number,
    method: PaymentMethod,
    ref: string,
    notes: string
  ) => {
    if (!currentUser) return;
    try {
      const userId = currentUser.cloudId || currentUser.id;
      await ErpService.recordSupplierPayment(
        supplierId,
        purchaseId,
        amount,
        method,
        ref,
        notes,
        userId,
        currentUser.fullName
      );
      await refreshData();
      showToast(`Disbursed ${formatCurrency(amount)} to supplier. Payable balance updated.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to record supplier disbursement', 'error');
      throw err;
    }
  };

  const deletePayment = async (paymentId: number) => {
    try {
      await ErpService.deletePayment(paymentId);
      await refreshData();
      showToast('Payment record deleted and balances restored', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete payment', 'error');
      throw err;
    }
  };

  const saveUser = async (user: Omit<User, 'id' | 'createdAt'> & { id?: number }) => {
    try {
      const res = await ErpService.saveUser(user);
      await refreshData();
      showToast(`User '${res.fullName}' saved`, 'success');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to save sales team member', 'error');
      throw err;
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      await ErpService.deleteUser(userId);
      await refreshData();
      showToast('Sales representative removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove representative', 'error');
      throw err;
    }
  };

  const value: ErpContextType = {
    activeTab,
    setActiveTab,
    preselectedRetailer,
    startNewOrderForRetailer,
    retailers,
    suppliers,
    products,
    orders,
    invoices,
    deliveries,
    payments,
    movements,
    users,
    purchases,
    lowStockProducts,
    isLoading,
    refreshData,
    createOrder,
    approveOrder,
    rejectOrder,
    requestOrderChanges,
    deleteOrder,
    generateInvoice,
    deleteInvoice,
    moveOrderForDelivery,
    dispatchDelivery,
    completeDelivery,
    deleteDelivery,
    saveRetailer,
    deleteRetailer,
    saveProduct,
    deleteProduct,
    adjustStock,
    deleteMovement,
    saveSupplier,
    deleteSupplier,
    recordPurchase,
    deletePurchase,
    recordRetailerPayment,
    recordSupplierPayment,
    deletePayment,
    saveUser,
    deleteUser,
    toasts,
    showToast,
    removeToast,
    isUsingSupabase: ErpService.isUsingSupabase(),
  };

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
};

export const useErp = (): ErpContextType => {
  const context = useContext(ErpContext);
  if (!context) {
    throw new Error('useErp must be used within an ErpProvider');
  }
  return context;
};
