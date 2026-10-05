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
  CompanyProfile,
  DEFAULT_COMPANY_PROFILE,
  AuditLog,
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
  | 'salespersons'
  | 'settings';

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
  companyProfile: CompanyProfile;
  auditLogs: AuditLog[];
  lowStockProducts: Product[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  refreshAuditLogs: () => Promise<void>;

  // Orders Actions
  createOrder: (
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ) => Promise<Order>;
  approveOrder: (orderId: number, feedback?: string) => Promise<void>;
  rejectOrder: (orderId: number, feedback: string) => Promise<void>;
  requestOrderChanges: (orderId: number, feedback: string) => Promise<void>;
  deleteOrder: (orderId: number) => Promise<void>;
  restoreOrder: (orderId: number) => Promise<void>;
  permanentDeleteOrder: (orderId: number) => Promise<void>;

  // Invoices Actions
  generateInvoice: (orderId: number) => Promise<Invoice>;
  voidInvoice: (invoiceId: number, reason?: string) => Promise<void>;
  deleteInvoice: (invoiceId: number) => Promise<void>;

  // Deliveries Actions
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

  // Retailers Actions
  saveRetailer: (retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number }) => Promise<Retailer>;
  deleteRetailer: (retailerId: number) => Promise<{ deleted: boolean; deactivated: boolean; message?: string }>;
  restoreRetailer: (retailerId: number) => Promise<void>;
  permanentDeleteRetailer: (retailerId: number) => Promise<void>;

  // Products Actions
  saveProduct: (product: Omit<Product, 'id' | 'createdAt'> & { id?: number }) => Promise<Product>;
  adjustStock: (productId: number, delta: number, reason: string) => Promise<void>;
  deleteProduct: (productId: number) => Promise<{ deleted: boolean; deactivated: boolean; message?: string }>;
  restoreProduct: (productId: number) => Promise<void>;
  permanentDeleteProduct: (productId: number) => Promise<void>;
  deleteMovement: (movementId: number) => Promise<void>;

  // Suppliers Actions
  saveSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number }) => Promise<Supplier>;
  deleteSupplier: (supplierId: number) => Promise<{ deleted: boolean; deactivated: boolean; message?: string }>;
  restoreSupplier: (supplierId: number) => Promise<void>;
  permanentDeleteSupplier: (supplierId: number) => Promise<void>;

  // Purchases Actions
  recordPurchase: (
    supplierId: number,
    billNumber: string,
    items: { product: Product; quantity: number }[],
    notes: string
  ) => Promise<void>;
  voidPurchase: (purchaseId: number, reason?: string) => Promise<void>;
  deletePurchase: (purchaseId: number) => Promise<void>;

  // Payments & Collections Actions
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
  reversePayment: (paymentId: number, reason?: string) => Promise<void>;
  deletePayment: (paymentId: number) => Promise<void>;

  // Sales Team Actions
  saveUser: (user: Omit<User, 'id' | 'createdAt'> & { id?: number }) => Promise<User>;
  deleteUser: (userId: number) => Promise<void>;
  restoreUser: (userId: number) => Promise<void>;
  permanentDeleteUser: (userId: number) => Promise<void>;

  // Company Profile Actions
  saveCompanyProfile: (profile: Partial<CompanyProfile>) => Promise<CompanyProfile>;

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
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
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
        loadedProfile,
        loadedAudit,
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
        ErpService.getCompanyProfile(),
        ErpService.getAuditLogs(100),
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
      if (loadedProfile) setCompanyProfile(loadedProfile);
      setAuditLogs(loadedAudit);
    } catch (err: any) {
      showToast(err.message || 'Error loading ERP data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const refreshAuditLogs = useCallback(async () => {
    try {
      const logs = await ErpService.getAuditLogs(100);
      setAuditLogs(logs);
    } catch (e: any) {
      console.warn('Could not refresh audit logs:', e.message);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Synchronize document title with company name
  useEffect(() => {
    if (companyProfile.companyName) {
      document.title = `${companyProfile.companyName} — Distribution Management`;
    }
  }, [companyProfile.companyName]);

  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockLevel && p.isActive);

  const startNewOrderForRetailer = (retailer: Retailer) => {
    setPreselectedRetailer(retailer);
    setActiveTab('new-order');
  };

  const getActor = () => ({
    userId: currentUser?.cloudId || String(currentUser?.id || ''),
    userName: currentUser?.fullName || 'User',
    userRole: currentUser?.role || 'OWNER',
  });

  // ==========================================
  // ORDERS ACTIONS
  // ==========================================
  const createOrder = async (
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ) => {
    try {
      const created = await ErpService.createOrder(order, items, getActor());
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
      await ErpService.approveOrder(orderId, feedback, getActor());
      await refreshData();
      showToast(`Order #${orderId} approved successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve order', 'error');
      throw err;
    }
  };

  const rejectOrder = async (orderId: number, feedback: string) => {
    try {
      await ErpService.rejectOrder(orderId, feedback, getActor());
      await refreshData();
      showToast(`Order #${orderId} rejected`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to reject order', 'error');
      throw err;
    }
  };

  const requestOrderChanges = async (orderId: number, feedback: string) => {
    try {
      await ErpService.requestOrderChanges(orderId, feedback, getActor());
      await refreshData();
      showToast(`Requested changes on order #${orderId}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to request changes', 'error');
      throw err;
    }
  };

  const deleteOrder = async (orderId: number) => {
    try {
      await ErpService.deleteOrder(orderId, getActor());
      await refreshData();
      showToast(`Order #${orderId} archived`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete order', 'error');
      throw err;
    }
  };

  const restoreOrder = async (orderId: number) => {
    try {
      await ErpService.restoreOrder(orderId, getActor());
      await refreshData();
      showToast(`Order #${orderId} restored to draft state`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to restore order', 'error');
      throw err;
    }
  };

  const permanentDeleteOrder = async (orderId: number) => {
    try {
      await ErpService.permanentDeleteOrder(orderId, getActor());
      await refreshData();
      showToast(`Order #${orderId} permanently deleted`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to permanently delete order', 'error');
      throw err;
    }
  };

  // ==========================================
  // INVOICES ACTIONS
  // ==========================================
  const generateInvoice = async (orderId: number) => {
    try {
      const invoice = await ErpService.generateInvoiceFromOrder(orderId, getActor());
      await refreshData();
      showToast(`Invoice ${invoice.invoiceNumber} generated successfully. Customer balance updated.`, 'success');
      return invoice;
    } catch (err: any) {
      showToast(err.message || 'Failed to generate invoice', 'error');
      throw err;
    }
  };

  const voidInvoice = async (invoiceId: number, reason?: string) => {
    try {
      await ErpService.voidInvoice(invoiceId, reason, getActor());
      await refreshData();
      showToast('Invoice voided. Customer balance credited and order returned to approved state.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to void invoice', 'error');
      throw err;
    }
  };

  const deleteInvoice = async (invoiceId: number) => {
    return voidInvoice(invoiceId, 'Voided via Invoices screen');
  };

  // ==========================================
  // DELIVERIES ACTIONS
  // ==========================================
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
      const delivery = await ErpService.moveOrderForDelivery(orderId, options, getActor());
      await refreshData();
      showToast(`Delivery #${delivery.id} scheduled for order.`, 'success');
      return delivery;
    } catch (err: any) {
      showToast(err.message || 'Failed to move order for delivery', 'error');
      throw err;
    }
  };

  const dispatchDelivery = async (id: number, driver: string, phone: string, notes: string) => {
    try {
      await ErpService.dispatchDelivery(id, driver, phone, notes, getActor());
      await refreshData();
      showToast('Delivery marked as dispatched', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch delivery', 'error');
      throw err;
    }
  };

  const completeDelivery = async (id: number, notes: string) => {
    try {
      await ErpService.completeDelivery(id, notes, getActor());
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

  // ==========================================
  // RETAILERS ACTIONS
  // ==========================================
  const saveRetailer = async (retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number }) => {
    try {
      const res = await ErpService.saveRetailer(retailer, getActor());
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
      const res = await ErpService.deleteRetailer(retailerId, getActor());
      await refreshData();
      if (res?.deactivated) {
        showToast(res.message || 'Retailer has historical transactions and was archived.', 'info');
      } else {
        showToast('Retailer deleted successfully', 'success');
      }
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to delete retailer', 'error');
      throw err;
    }
  };

  const restoreRetailer = async (retailerId: number) => {
    try {
      await ErpService.restoreRetailer(retailerId, getActor());
      await refreshData();
      showToast('Retailer restored to active directory', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to restore retailer', 'error');
      throw err;
    }
  };

  const permanentDeleteRetailer = async (retailerId: number) => {
    try {
      await ErpService.permanentDeleteRetailer(retailerId, getActor());
      await refreshData();
      showToast('Retailer permanently deleted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Cannot delete retailer with dependencies', 'error');
      throw err;
    }
  };

  // ==========================================
  // PRODUCTS ACTIONS
  // ==========================================
  const saveProduct = async (product: Omit<Product, 'id' | 'createdAt'> & { id?: number }) => {
    try {
      const res = await ErpService.saveProduct(product, getActor());
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
      const res = await ErpService.deleteProduct(productId, getActor());
      await refreshData();
      if (res?.deactivated) {
        showToast(
          res.message || 'This product has historical transactions and cannot be permanently deleted. It has been archived instead.',
          'info'
        );
      } else {
        showToast('Product permanently deleted', 'success');
      }
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
      throw err;
    }
  };

  const restoreProduct = async (productId: number) => {
    try {
      await ErpService.restoreProduct(productId, getActor());
      await refreshData();
      showToast('Product restored to active catalog', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to restore product', 'error');
      throw err;
    }
  };

  const permanentDeleteProduct = async (productId: number) => {
    try {
      await ErpService.permanentDeleteProduct(productId, getActor());
      await refreshData();
      showToast('Product permanently purged', 'success');
    } catch (err: any) {
      showToast(err.message || 'Cannot delete product with transaction dependencies', 'error');
      throw err;
    }
  };

  const adjustStock = async (productId: number, delta: number, reason: string) => {
    try {
      await ErpService.recordStockAdjustment(productId, delta, reason, getActor());
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
      showToast('Movement adjusted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Historical inventory movements cannot be deleted directly.', 'error');
      throw err;
    }
  };

  // ==========================================
  // SUPPLIERS ACTIONS
  // ==========================================
  const saveSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number }) => {
    try {
      const res = await ErpService.saveSupplier(supplier, getActor());
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
      const res = await ErpService.deleteSupplier(supplierId, getActor());
      await refreshData();
      if (res?.deactivated) {
        showToast(res.message || 'Supplier has purchase records and was archived.', 'info');
      } else {
        showToast('Supplier deleted successfully', 'success');
      }
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to delete supplier', 'error');
      throw err;
    }
  };

  const restoreSupplier = async (supplierId: number) => {
    try {
      await ErpService.restoreSupplier(supplierId, getActor());
      await refreshData();
      showToast('Supplier restored to active vendor directory', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to restore supplier', 'error');
      throw err;
    }
  };

  const permanentDeleteSupplier = async (supplierId: number) => {
    try {
      await ErpService.permanentDeleteSupplier(supplierId, getActor());
      await refreshData();
      showToast('Supplier permanently deleted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Cannot delete supplier with recorded purchases', 'error');
      throw err;
    }
  };

  // ==========================================
  // PURCHASES ACTIONS
  // ==========================================
  const recordPurchase = async (
    supplierId: number,
    billNumber: string,
    items: { product: Product; quantity: number }[],
    notes: string
  ) => {
    try {
      await ErpService.createPurchase(supplierId, billNumber, items, notes, getActor());
      await refreshData();
      showToast(`Purchase bill recorded. Stock & payables updated.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to record purchase', 'error');
      throw err;
    }
  };

  const voidPurchase = async (purchaseId: number, reason?: string) => {
    try {
      await ErpService.voidPurchase(purchaseId, reason, getActor());
      await refreshData();
      showToast('Purchase bill voided. Supplier payables adjusted.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to void purchase bill', 'error');
      throw err;
    }
  };

  const deletePurchase = async (purchaseId: number) => {
    return voidPurchase(purchaseId, 'Voided via Purchases screen');
  };

  // ==========================================
  // PAYMENTS & COLLECTIONS ACTIONS
  // ==========================================
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
      showToast(`Collection of ${formatCurrency(amount)} recorded. Customer balance credited.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to record collection', 'error');
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
      showToast(err.message || 'Failed to record supplier payment', 'error');
      throw err;
    }
  };

  const reversePayment = async (paymentId: number, reason?: string) => {
    try {
      await ErpService.reversePayment(paymentId, reason, getActor());
      await refreshData();
      showToast('Payment reversed. Associated invoice and party balances restored.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reverse payment', 'error');
      throw err;
    }
  };

  const deletePayment = async (paymentId: number) => {
    return reversePayment(paymentId, 'Reversed via Payments screen');
  };

  // ==========================================
  // SALES TEAM ACTIONS
  // ==========================================
  const saveUser = async (user: Omit<User, 'id' | 'createdAt'> & { id?: number }) => {
    try {
      const res = await ErpService.saveUser(user, getActor());
      await refreshData();
      showToast(`Sales representative '${res.fullName}' saved`, 'success');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to save sales team member', 'error');
      throw err;
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      await ErpService.deleteUser(userId, getActor());
      await refreshData();
      showToast('Sales representative deactivated / archived', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate representative', 'error');
      throw err;
    }
  };

  const restoreUser = async (userId: number) => {
    try {
      await ErpService.restoreUser(userId, getActor());
      await refreshData();
      showToast('Sales representative restored', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to restore representative', 'error');
      throw err;
    }
  };

  const permanentDeleteUser = async (userId: number) => {
    try {
      await ErpService.permanentDeleteUser(userId, getActor());
      await refreshData();
      showToast('Sales representative permanently removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Cannot delete representative with historical records', 'error');
      throw err;
    }
  };

  // ==========================================
  // COMPANY PROFILE ACTIONS
  // ==========================================
  const saveCompanyProfile = async (profile: Partial<CompanyProfile>) => {
    try {
      const saved = await ErpService.saveCompanyProfile(profile, getActor());
      setCompanyProfile(saved);
      showToast(`Company profile updated: '${saved.companyName}'`, 'success');
      return saved;
    } catch (err: any) {
      showToast(err.message || 'Failed to save company profile', 'error');
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
    companyProfile,
    auditLogs,
    lowStockProducts,
    isLoading,
    refreshData,
    refreshAuditLogs,
    createOrder,
    approveOrder,
    rejectOrder,
    requestOrderChanges,
    deleteOrder,
    restoreOrder,
    permanentDeleteOrder,
    generateInvoice,
    voidInvoice,
    deleteInvoice,
    moveOrderForDelivery,
    dispatchDelivery,
    completeDelivery,
    deleteDelivery,
    saveRetailer,
    deleteRetailer,
    restoreRetailer,
    permanentDeleteRetailer,
    saveProduct,
    deleteProduct,
    restoreProduct,
    permanentDeleteProduct,
    adjustStock,
    deleteMovement,
    saveSupplier,
    deleteSupplier,
    restoreSupplier,
    permanentDeleteSupplier,
    recordPurchase,
    voidPurchase,
    deletePurchase,
    recordRetailerPayment,
    recordSupplierPayment,
    reversePayment,
    deletePayment,
    saveUser,
    deleteUser,
    restoreUser,
    permanentDeleteUser,
    saveCompanyProfile,
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
