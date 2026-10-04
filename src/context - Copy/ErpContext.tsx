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
  generateInvoice: (orderId: number) => Promise<Invoice>;
  dispatchDelivery: (id: number, driver: string, phone: string, notes: string) => Promise<void>;
  completeDelivery: (id: number, notes: string) => Promise<void>;
  saveRetailer: (retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number }) => Promise<Retailer>;
  saveProduct: (product: Omit<Product, 'id' | 'createdAt'> & { id?: number }) => Promise<Product>;
  adjustStock: (productId: number, delta: number, reason: string) => Promise<void>;
  saveSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number }) => Promise<Supplier>;
  recordPurchase: (
    supplierId: number,
    billNumber: string,
    items: { product: Product; quantity: number }[],
    notes: string
  ) => Promise<void>;
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
  saveUser: (user: Omit<User, 'id' | 'createdAt'> & { id?: number }) => Promise<User>;

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
    const created = await ErpService.createOrder(order, items);
    await refreshData();
    showToast(`Order ${created.orderNumber} placed successfully`, 'success');
    return created;
  };

  const approveOrder = async (orderId: number, feedback?: string) => {
    await ErpService.approveOrder(orderId, feedback);
    await refreshData();
    showToast(`Order #${orderId} approved`, 'success');
  };

  const rejectOrder = async (orderId: number, feedback: string) => {
    await ErpService.rejectOrder(orderId, feedback);
    await refreshData();
    showToast(`Order #${orderId} rejected`, 'info');
  };

  const requestOrderChanges = async (orderId: number, feedback: string) => {
    await ErpService.requestOrderChanges(orderId, feedback);
    await refreshData();
    showToast(`Requested changes on order #${orderId}`, 'info');
  };

  const generateInvoice = async (orderId: number) => {
    const invoice = await ErpService.generateInvoiceFromOrder(orderId);
    await refreshData();
    showToast(`Invoice ${invoice.invoiceNumber} generated & scheduled for delivery`, 'success');
    return invoice;
  };

  const dispatchDelivery = async (id: number, driver: string, phone: string, notes: string) => {
    await ErpService.dispatchDelivery(id, driver, phone, notes);
    await refreshData();
    showToast('Delivery marked as dispatched', 'success');
  };

  const completeDelivery = async (id: number, notes: string) => {
    await ErpService.completeDelivery(id, notes);
    await refreshData();
    showToast('Delivery completed! Inventory stock and movements updated', 'success');
  };

  const saveRetailer = async (retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number }) => {
    const res = await ErpService.saveRetailer(retailer);
    await refreshData();
    showToast(`Retailer '${res.name}' saved`, 'success');
    return res;
  };

  const saveProduct = async (product: Omit<Product, 'id' | 'createdAt'> & { id?: number }) => {
    const res = await ErpService.saveProduct(product);
    await refreshData();
    showToast(`Product '${res.name}' saved`, 'success');
    return res;
  };

  const adjustStock = async (productId: number, delta: number, reason: string) => {
    await ErpService.recordStockAdjustment(productId, delta, reason);
    await refreshData();
    showToast(`Stock adjusted by ${delta > 0 ? '+' : ''}${delta}. Movement logged.`, 'success');
  };

  const saveSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number }) => {
    const res = await ErpService.saveSupplier(supplier);
    await refreshData();
    showToast(`Supplier '${res.name}' saved`, 'success');
    return res;
  };

  const recordPurchase = async (
    supplierId: number,
    billNumber: string,
    items: { product: Product; quantity: number }[],
    notes: string
  ) => {
    await ErpService.createPurchase(supplierId, billNumber, items, notes);
    await refreshData();
    showToast(`Purchase bill recorded. Stock & payables updated.`, 'success');
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
    await ErpService.recordRetailerPayment(
      retailerId,
      invoiceId,
      amount,
      method,
      ref,
      notes,
      currentUser.id,
      currentUser.fullName
    );
    await refreshData();
    showToast(`Payment of $${amount.toFixed(2)} recorded. Customer balance updated.`, 'success');
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
    await ErpService.recordSupplierPayment(
      supplierId,
      purchaseId,
      amount,
      method,
      ref,
      notes,
      currentUser.id,
      currentUser.fullName
    );
    await refreshData();
    showToast(`Disbursed $${amount.toFixed(2)} to supplier. Payable balance updated.`, 'success');
  };

  const saveUser = async (user: Omit<User, 'id' | 'createdAt'> & { id?: number }) => {
    const res = await ErpService.saveUser(user);
    await refreshData();
    showToast(`User '${res.fullName}' saved`, 'success');
    return res;
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
    generateInvoice,
    dispatchDelivery,
    completeDelivery,
    saveRetailer,
    saveProduct,
    adjustStock,
    saveSupplier,
    recordPurchase,
    recordRetailerPayment,
    recordSupplierPayment,
    saveUser,
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
