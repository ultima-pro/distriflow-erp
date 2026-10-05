import { ErpDataSource } from './ErpDataSource';
import {
  User,
  Retailer,
  Supplier,
  Product,
  Order,
  OrderItem,
  Invoice,
  InvoiceItem,
  Purchase,
  PurchaseItem,
  Payment,
  InventoryMovement,
  Delivery,
  OrderStatus,
  InvoicePaymentStatus,
  DeliveryStatus,
  CompanyProfile,
  DEFAULT_COMPANY_PROFILE,
  AuditLog,
} from '../../types/erp';
import {
  INITIAL_DEMO_USERS,
  INITIAL_DEMO_SUPPLIERS,
  INITIAL_DEMO_PRODUCTS,
  INITIAL_DEMO_RETAILERS,
  INITIAL_DEMO_ORDERS,
  INITIAL_DEMO_ORDER_ITEMS,
  INITIAL_DEMO_INVOICES,
  INITIAL_DEMO_DELIVERIES,
  INITIAL_DEMO_PAYMENTS,
  INITIAL_DEMO_MOVEMENTS,
} from '../../data/demoSeedData';

/**
 * In-memory development data source with localStorage persistence.
 * Strictly used when Supabase is not connected.
 */
export class DevErpDataSource implements ErpDataSource {
  private users: User[];
  private suppliers: Supplier[];
  private products: Product[];
  private retailers: Retailer[];
  private orders: Order[];
  private orderItems: OrderItem[];
  private invoices: Invoice[];
  private invoiceItems: InvoiceItem[];
  private purchases: Purchase[];
  private purchaseItems: PurchaseItem[];
  private payments: Payment[];
  private movements: InventoryMovement[];
  private deliveries: Delivery[];
  private companyProfile: CompanyProfile;
  private auditLogs: AuditLog[];

  constructor() {
    this.users = this.loadLocal('distriflow_users', INITIAL_DEMO_USERS);
    this.suppliers = this.loadLocal('distriflow_suppliers', INITIAL_DEMO_SUPPLIERS);
    this.products = this.loadLocal('distriflow_products', INITIAL_DEMO_PRODUCTS);
    this.retailers = this.loadLocal('distriflow_retailers', INITIAL_DEMO_RETAILERS);
    this.orders = this.loadLocal('distriflow_orders', INITIAL_DEMO_ORDERS);
    this.orderItems = this.loadLocal('distriflow_order_items', INITIAL_DEMO_ORDER_ITEMS);
    this.invoices = this.loadLocal('distriflow_invoices', INITIAL_DEMO_INVOICES);
    this.invoiceItems = this.loadLocal('distriflow_invoice_items', []);
    this.purchases = this.loadLocal('distriflow_purchases', []);
    this.purchaseItems = this.loadLocal('distriflow_purchase_items', []);
    this.payments = this.loadLocal('distriflow_payments', INITIAL_DEMO_PAYMENTS);
    this.movements = this.loadLocal('distriflow_movements', INITIAL_DEMO_MOVEMENTS);
    this.deliveries = this.loadLocal('distriflow_deliveries', INITIAL_DEMO_DELIVERIES);
    this.companyProfile = this.loadLocal('distriflow_company_profile', DEFAULT_COMPANY_PROFILE);
    this.auditLogs = this.loadLocal('distriflow_audit_logs', []);
  }

  private loadLocal<T>(key: string, fallback: T): T {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (item) return JSON.parse(item);
      }
    } catch {
      // Fallback
    }
    return fallback;
  }

  private saveLocal(key: string, data: unknown) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(data));
      }
    } catch {
      // Ignore storage quota errors
    }
  }

  // ==========================================
  // RETAILERS
  // ==========================================
  async getRetailers(): Promise<Retailer[]> {
    return [...this.retailers];
  }

  async getRetailerById(id: number): Promise<Retailer | null> {
    return this.retailers.find((r) => r.id === id) || null;
  }

  async saveRetailer(retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number }): Promise<Retailer> {
    if (retailer.id && retailer.id > 0) {
      const idx = this.retailers.findIndex((r) => r.id === retailer.id);
      if (idx >= 0) {
        const updated: Retailer = {
          ...this.retailers[idx],
          ...retailer,
          id: retailer.id,
        };
        this.retailers[idx] = updated;
        this.saveLocal('distriflow_retailers', this.retailers);
        return updated;
      }
    }
    const newId = Math.max(0, ...this.retailers.map((r) => r.id)) + 1;
    const created: Retailer = {
      ...retailer,
      id: newId,
      creditLimit: retailer.creditLimit ?? 5000,
      outstandingBalance: retailer.outstandingBalance ?? 0,
      isActive: retailer.isActive ?? true,
      createdAt: Date.now(),
    };
    this.retailers.push(created);
    this.saveLocal('distriflow_retailers', this.retailers);
    return created;
  }

  async updateRetailerBalance(id: number, delta: number): Promise<void> {
    const retailer = this.retailers.find((r) => r.id === id);
    if (retailer) {
      retailer.outstandingBalance += delta;
      this.saveLocal('distriflow_retailers', this.retailers);
    }
  }

  async deleteRetailer(id: number): Promise<{ deleted: boolean; deactivated: boolean; message?: string }> {
    const hasHistory =
      this.orders.some((o) => o.retailerId === id) ||
      this.invoices.some((i) => i.retailerId === id) ||
      this.deliveries.some((d) => d.retailerId === id);

    if (hasHistory) {
      const retailer = this.retailers.find((r) => r.id === id);
      if (retailer) {
        retailer.isActive = false;
        retailer.archivedAt = Date.now();
      }
      this.saveLocal('distriflow_retailers', this.retailers);
      return {
        deleted: false,
        deactivated: true,
        message: 'This retailer has historical transactions and has been made inactive. Historical records remain preserved.',
      };
    }

    this.retailers = this.retailers.filter((r) => r.id !== id);
    this.saveLocal('distriflow_retailers', this.retailers);
    return { deleted: true, deactivated: false, message: 'Retailer permanently deleted.' };
  }

  async restoreRetailer(id: number): Promise<void> {
    const retailer = this.retailers.find((r) => r.id === id);
    if (retailer) {
      retailer.isActive = true;
      retailer.archivedAt = undefined;
      this.saveLocal('distriflow_retailers', this.retailers);
    }
  }

  async permanentDeleteRetailer(id: number): Promise<void> {
    const hasHistory =
      this.orders.some((o) => o.retailerId === id) ||
      this.invoices.some((i) => i.retailerId === id) ||
      this.deliveries.some((d) => d.retailerId === id);
    if (hasHistory) {
      throw new Error('This retailer has historical transactions and has been made inactive. Historical records remain preserved.');
    }
    this.retailers = this.retailers.filter((r) => r.id !== id);
    this.saveLocal('distriflow_retailers', this.retailers);
  }

  // ==========================================
  // SUPPLIERS
  // ==========================================
  async getSuppliers(): Promise<Supplier[]> {
    return [...this.suppliers];
  }

  async getSupplierById(id: number): Promise<Supplier | null> {
    return this.suppliers.find((s) => s.id === id) || null;
  }

  async saveSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number }): Promise<Supplier> {
    if (supplier.id && supplier.id > 0) {
      const idx = this.suppliers.findIndex((s) => s.id === supplier.id);
      if (idx >= 0) {
        const updated: Supplier = {
          ...this.suppliers[idx],
          ...supplier,
          id: supplier.id,
        };
        this.suppliers[idx] = updated;
        this.saveLocal('distriflow_suppliers', this.suppliers);
        return updated;
      }
    }
    const newId = Math.max(0, ...this.suppliers.map((s) => s.id)) + 1;
    const created: Supplier = {
      ...supplier,
      id: newId,
      payableBalance: 0,
      isActive: supplier.isActive ?? true,
      createdAt: Date.now(),
    };
    this.suppliers.push(created);
    this.saveLocal('distriflow_suppliers', this.suppliers);
    return created;
  }

  async updateSupplierBalance(id: number, delta: number): Promise<void> {
    const supplier = this.suppliers.find((s) => s.id === id);
    if (supplier) {
      supplier.payableBalance += delta;
      this.saveLocal('distriflow_suppliers', this.suppliers);
    }
  }

  async deleteSupplier(id: number): Promise<{ deleted: boolean; deactivated: boolean; message?: string }> {
    const hasHistory =
      this.purchases.some((p) => p.supplierId === id) ||
      this.products.some((pr) => pr.supplierId === id);
    if (hasHistory) {
      const supplier = this.suppliers.find((s) => s.id === id);
      if (supplier) {
        supplier.isActive = false;
        supplier.archivedAt = Date.now();
      }
      this.saveLocal('distriflow_suppliers', this.suppliers);
      return {
        deleted: false,
        deactivated: true,
        message: 'This supplier has historical transactions and has been made inactive. Historical records remain preserved.',
      };
    }
    this.suppliers = this.suppliers.filter((s) => s.id !== id);
    this.saveLocal('distriflow_suppliers', this.suppliers);
    return { deleted: true, deactivated: false, message: 'Supplier permanently deleted.' };
  }

  async restoreSupplier(id: number): Promise<void> {
    const supplier = this.suppliers.find((s) => s.id === id);
    if (supplier) {
      supplier.isActive = true;
      supplier.archivedAt = undefined;
      this.saveLocal('distriflow_suppliers', this.suppliers);
    }
  }

  async permanentDeleteSupplier(id: number): Promise<void> {
    const hasHistory =
      this.purchases.some((p) => p.supplierId === id) ||
      this.products.some((pr) => pr.supplierId === id);
    if (hasHistory) {
      throw new Error('This supplier has historical transactions and has been made inactive. Historical records remain preserved.');
    }
    this.suppliers = this.suppliers.filter((s) => s.id !== id);
    this.saveLocal('distriflow_suppliers', this.suppliers);
  }

  // ==========================================
  // PRODUCTS
  // ==========================================
  async getProducts(): Promise<Product[]> {
    return [...this.products];
  }

  async getProductById(id: number): Promise<Product | null> {
    return this.products.find((p) => p.id === id) || null;
  }

  async saveProduct(product: Omit<Product, 'id' | 'createdAt'> & { id?: number }): Promise<Product> {
    if (product.id && product.id > 0) {
      const idx = this.products.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const updated: Product = {
          ...this.products[idx],
          ...product,
          id: product.id,
        };
        this.products[idx] = updated;
        this.saveLocal('distriflow_products', this.products);
        return updated;
      }
    }
    const newId = Math.max(0, ...this.products.map((p) => p.id)) + 1;
    const created: Product = {
      ...product,
      id: newId,
      isActive: product.isActive ?? true,
      createdAt: Date.now(),
    };
    this.products.push(created);
    this.saveLocal('distriflow_products', this.products);
    return created;
  }

  async updateProductStock(id: number, qtyDelta: number): Promise<void> {
    const product = this.products.find((p) => p.id === id);
    if (product) {
      product.currentStock += qtyDelta;
      this.saveLocal('distriflow_products', this.products);
    }
  }

  async deleteProduct(id: number): Promise<{ deleted: boolean; deactivated: boolean; message?: string }> {
    const hasHistory =
      this.orderItems.some((i) => i.productId === id) ||
      this.invoiceItems.some((i) => i.productId === id) ||
      this.purchaseItems.some((i) => i.productId === id) ||
      this.movements.some((m) => m.productId === id);

    if (hasHistory) {
      const product = this.products.find((p) => p.id === id);
      if (product) {
        product.isActive = false;
        product.archivedAt = Date.now();
      }
      this.saveLocal('distriflow_products', this.products);
      return {
        deleted: false,
        deactivated: true,
        message: 'This product has historical transactions and has been made inactive. Historical documents remain preserved.',
      };
    }

    this.products = this.products.filter((p) => p.id !== id);
    this.saveLocal('distriflow_products', this.products);
    return { deleted: true, deactivated: false, message: 'Product permanently deleted.' };
  }

  async restoreProduct(id: number): Promise<void> {
    const product = this.products.find((p) => p.id === id);
    if (product) {
      product.isActive = true;
      product.archivedAt = undefined;
      this.saveLocal('distriflow_products', this.products);
    }
  }

  async permanentDeleteProduct(id: number): Promise<void> {
    const hasHistory =
      this.orderItems.some((i) => i.productId === id) ||
      this.invoiceItems.some((i) => i.productId === id) ||
      this.purchaseItems.some((i) => i.productId === id) ||
      this.movements.some((m) => m.productId === id);
    if (hasHistory) {
      throw new Error('This product has historical transactions and has been made inactive. Historical documents remain preserved.');
    }
    this.products = this.products.filter((p) => p.id !== id);
    this.saveLocal('distriflow_products', this.products);
  }

  // ==========================================
  // ORDERS & ORDER ITEMS
  // ==========================================
  async getOrders(): Promise<Order[]> {
    return [...this.orders].sort((a, b) => b.orderDate - a.orderDate);
  }

  async getOrderById(id: number): Promise<Order | null> {
    return this.orders.find((o) => o.id === id) || null;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.orderItems.filter((it) => it.orderId === orderId);
  }

  async saveOrder(
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: number },
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ): Promise<Order> {
    let savedOrderId = order.id;
    if (savedOrderId && savedOrderId > 0) {
      const idx = this.orders.findIndex((o) => o.id === savedOrderId);
      if (idx >= 0) {
        const updated: Order = {
          ...this.orders[idx],
          ...order,
          id: savedOrderId,
          updatedAt: Date.now(),
        };
        this.orders[idx] = updated;
        this.orderItems = this.orderItems.filter((it) => it.orderId !== savedOrderId);
      }
    } else {
      savedOrderId = Math.max(0, ...this.orders.map((o) => o.id)) + 1;
      const created: Order = {
        ...order,
        id: savedOrderId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.orders.push(created);
    }

    let nextItemId = Math.max(0, ...this.orderItems.map((it) => it.id)) + 1;
    for (const it of items) {
      this.orderItems.push({
        ...it,
        id: nextItemId++,
        orderId: savedOrderId!,
      });
    }

    this.saveLocal('distriflow_orders', this.orders);
    this.saveLocal('distriflow_order_items', this.orderItems);

    return (await this.getOrderById(savedOrderId!))!;
  }

  async updateOrderStatus(orderId: number, status: OrderStatus, feedback?: string): Promise<void> {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      if (feedback !== undefined) order.ownerFeedback = feedback;
      order.updatedAt = Date.now();
      this.saveLocal('distriflow_orders', this.orders);
    }
  }

  async deleteOrder(id: number): Promise<void> {
    const hasInvoice = this.invoices.some((i) => i.orderId === id);
    const hasDelivery = this.deliveries.some((d) => d.orderId === id);
    if (hasInvoice || hasDelivery) {
      const order = this.orders.find((o) => o.id === id);
      if (order) {
        order.isArchived = true;
        order.archivedAt = Date.now();
        order.status = 'CANCELLED';
      }
      this.saveLocal('distriflow_orders', this.orders);
      return;
    }
    this.orders = this.orders.filter((o) => o.id !== id);
    this.orderItems = this.orderItems.filter((it) => it.orderId !== id);
    this.saveLocal('distriflow_orders', this.orders);
    this.saveLocal('distriflow_order_items', this.orderItems);
  }

  async restoreOrder(id: number): Promise<void> {
    const hasInvoice = this.invoices.some((i) => i.orderId === id);
    if (hasInvoice) {
      throw new Error('Cannot restore order: an associated invoice exists in the accounting ledger.');
    }
    const order = this.orders.find((o) => o.id === id);
    if (order) {
      order.isArchived = false;
      order.archivedAt = undefined;
      order.status = 'DRAFT';
      this.saveLocal('distriflow_orders', this.orders);
    }
  }

  async permanentDeleteOrder(id: number): Promise<void> {
    const hasInvoice = this.invoices.some((i) => i.orderId === id);
    const hasDelivery = this.deliveries.some((d) => d.orderId === id);
    if (hasInvoice || hasDelivery) {
      throw new Error('Cannot permanently delete order: historical invoice or delivery records depend on this order.');
    }
    this.orders = this.orders.filter((o) => o.id !== id);
    this.orderItems = this.orderItems.filter((it) => it.orderId !== id);
    this.saveLocal('distriflow_orders', this.orders);
    this.saveLocal('distriflow_order_items', this.orderItems);
  }

  // ==========================================
  // INVOICES & INVOICE ITEMS
  // ==========================================
  async getInvoices(): Promise<Invoice[]> {
    return [...this.invoices].sort((a, b) => b.invoiceDate - a.invoiceDate);
  }

  async getInvoiceById(id: number): Promise<Invoice | null> {
    return this.invoices.find((i) => i.id === id) || null;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return this.invoiceItems.filter((it) => it.invoiceId === invoiceId);
  }

  async createInvoice(
    invoice: Omit<Invoice, 'id' | 'createdAt'>,
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]
  ): Promise<Invoice> {
    const newId = Math.max(0, ...this.invoices.map((i) => i.id)) + 1;
    const created: Invoice = {
      ...invoice,
      id: newId,
      status: 'POSTED',
      createdAt: Date.now(),
    };
    this.invoices.push(created);

    let nextItemId = Math.max(0, ...this.invoiceItems.map((it) => it.id)) + 1;
    for (const it of items) {
      this.invoiceItems.push({
        ...it,
        id: nextItemId++,
        invoiceId: newId,
      });
    }

    this.saveLocal('distriflow_invoices', this.invoices);
    this.saveLocal('distriflow_invoice_items', this.invoiceItems);
    return created;
  }

  async updateInvoicePayment(id: number, amount: number, status: InvoicePaymentStatus): Promise<void> {
    const invoice = this.invoices.find((i) => i.id === id);
    if (invoice) {
      invoice.amountPaid = Math.max(0, invoice.amountPaid + amount);
      invoice.remainingBalance = Math.max(0, invoice.totalAmount - invoice.amountPaid);
      invoice.paymentStatus =
        status ||
        (invoice.amountPaid >= invoice.totalAmount ? 'PAID' : invoice.amountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID');
      this.saveLocal('distriflow_invoices', this.invoices);
    }
  }

  async deleteInvoice(id: number): Promise<void> {
    return this.voidInvoice(id, 'Deleted/Voided via Invoices screen');
  }

  async voidInvoice(id: number, reason?: string, voidedBy?: string): Promise<void> {
    const invoice = this.invoices.find((i) => i.id === id);
    if (invoice) {
      invoice.paymentStatus = 'VOIDED';
      invoice.status = 'VOIDED';
      invoice.voidedAt = Date.now();
      invoice.voidedBy = voidedBy;
      invoice.voidReason = reason;
      this.saveLocal('distriflow_invoices', this.invoices);
    }
  }

  // ==========================================
  // PURCHASES
  // ==========================================
  async getPurchases(): Promise<Purchase[]> {
    return [...this.purchases].sort((a, b) => b.purchaseDate - a.purchaseDate);
  }

  async createPurchase(
    purchase: Omit<Purchase, 'id' | 'createdAt'>,
    items: Omit<PurchaseItem, 'id' | 'purchaseId'>[]
  ): Promise<Purchase> {
    const newId = Math.max(0, ...this.purchases.map((p) => p.id)) + 1;
    const created: Purchase = {
      ...purchase,
      id: newId,
      status: 'POSTED',
      createdAt: Date.now(),
    };
    this.purchases.push(created);

    let nextItemId = Math.max(0, ...this.purchaseItems.map((it) => it.id)) + 1;
    for (const it of items) {
      this.purchaseItems.push({
        ...it,
        id: nextItemId++,
        purchaseId: newId,
      });
    }

    this.saveLocal('distriflow_purchases', this.purchases);
    this.saveLocal('distriflow_purchase_items', this.purchaseItems);
    return created;
  }

  async updatePurchasePayment(purchaseId: number, amount: number): Promise<void> {
    const purchase = this.purchases.find((p) => p.id === purchaseId);
    if (purchase) {
      purchase.amountPaid = Math.max(0, purchase.amountPaid + amount);
      purchase.paymentStatus =
        purchase.amountPaid >= purchase.totalAmount ? 'PAID' : purchase.amountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
      this.saveLocal('distriflow_purchases', this.purchases);
    }
  }

  async deletePurchase(id: number): Promise<void> {
    return this.voidPurchase(id, 'Deleted/Voided via Purchases screen');
  }

  async voidPurchase(id: number, reason?: string, voidedBy?: string): Promise<void> {
    const purchase = this.purchases.find((p) => p.id === id);
    if (purchase) {
      purchase.paymentStatus = 'VOIDED';
      purchase.status = 'VOIDED';
      purchase.voidedAt = Date.now();
      purchase.voidedBy = voidedBy;
      purchase.voidReason = reason;
      this.saveLocal('distriflow_purchases', this.purchases);
    }
  }

  // ==========================================
  // PAYMENTS & COLLECTIONS
  // ==========================================
  async getPayments(): Promise<Payment[]> {
    return [...this.payments].sort((a, b) => b.paymentDate - a.paymentDate);
  }

  async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const newId = Math.max(0, ...this.payments.map((p) => p.id)) + 1;
    const created: Payment = {
      ...payment,
      id: newId,
      status: payment.status || 'ACTIVE',
      createdAt: Date.now(),
    };
    this.payments.push(created);
    this.saveLocal('distriflow_payments', this.payments);
    return created;
  }

  async deletePayment(id: number): Promise<void> {
    return this.reversePayment(id, 'Reversed via Payments screen');
  }

  async reversePayment(id: number, reason?: string, reversedBy?: string): Promise<void> {
    const payment = this.payments.find((p) => p.id === id);
    if (payment) {
      payment.status = 'REVERSED';
      payment.reversedAt = Date.now();
      payment.reversedBy = reversedBy;
      payment.reversalReason = reason || 'Reversed by Administrator';
      this.saveLocal('distriflow_payments', this.payments);
    }
  }

  // ==========================================
  // INVENTORY MOVEMENTS (AUDIT TRAIL)
  // ==========================================
  async getMovements(): Promise<InventoryMovement[]> {
    return [...this.movements].sort((a, b) => b.timestamp - a.timestamp);
  }

  async createMovement(movement: Omit<InventoryMovement, 'id' | 'timestamp'>): Promise<InventoryMovement> {
    const newId = Math.max(0, ...this.movements.map((m) => m.id)) + 1;
    const created: InventoryMovement = {
      ...movement,
      id: newId,
      timestamp: Date.now(),
    };
    this.movements.push(created);
    this.saveLocal('distriflow_movements', this.movements);
    return created;
  }

  async deleteMovement(_id: number): Promise<void> {
    throw new Error('Direct deletion of inventory movements is forbidden to maintain accounting integrity. Please record a correcting Stock Adjustment instead.');
  }

  // ==========================================
  // DELIVERIES
  // ==========================================
  async getDeliveries(): Promise<Delivery[]> {
    return [...this.deliveries].sort((a, b) => b.scheduledDate - a.scheduledDate);
  }

  async createDelivery(delivery: Omit<Delivery, 'id' | 'createdAt'>): Promise<Delivery> {
    const newId = Math.max(0, ...this.deliveries.map((d) => d.id)) + 1;
    const created: Delivery = {
      ...delivery,
      id: newId,
      createdAt: Date.now(),
    };
    this.deliveries.push(created);
    this.saveLocal('distriflow_deliveries', this.deliveries);
    return created;
  }

  async updateDeliveryStatus(
    id: number,
    status: DeliveryStatus,
    deliveredDate?: number,
    notes?: string
  ): Promise<void> {
    const delivery = this.deliveries.find((d) => d.id === id);
    if (delivery) {
      delivery.status = status;
      if (deliveredDate) delivery.deliveredDate = deliveredDate;
      if (notes) delivery.notes = notes;
      this.saveLocal('distriflow_deliveries', this.deliveries);
    }
  }

  async deleteDelivery(id: number): Promise<void> {
    this.deliveries = this.deliveries.filter((d) => d.id !== id);
    this.saveLocal('distriflow_deliveries', this.deliveries);
  }

  // ==========================================
  // USERS / SALES TEAM
  // ==========================================
  async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async saveUser(user: Omit<User, 'id' | 'createdAt'> & { id?: number }): Promise<User> {
    if (user.id && user.id > 0) {
      const idx = this.users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        const updated: User = {
          ...this.users[idx],
          ...user,
          id: user.id,
        };
        this.users[idx] = updated;
        this.saveLocal('distriflow_users', this.users);
        return updated;
      }
    }
    const newId = Math.max(0, ...this.users.map((u) => u.id)) + 1;
    const created: User = {
      ...user,
      id: newId,
      cloudId: `user-${newId}`,
      isActive: user.isActive ?? true,
      createdAt: Date.now(),
    };
    this.users.push(created);
    this.saveLocal('distriflow_users', this.users);
    return created;
  }

  async deleteUser(id: number): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      const hasHistory =
        this.orders.some((o) => o.salespersonId === user.id || o.salespersonId === user.cloudId) ||
        this.retailers.some((r) => r.assignedSalespersonId === user.id || r.assignedSalespersonId === user.cloudId);
      if (hasHistory) {
        user.isActive = false;
        user.archivedAt = Date.now();
      } else {
        this.users = this.users.filter((u) => u.id !== id);
      }
      this.saveLocal('distriflow_users', this.users);
    }
  }

  async restoreUser(id: number): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.isActive = true;
      user.archivedAt = undefined;
      this.saveLocal('distriflow_users', this.users);
    }
  }

  async permanentDeleteUser(id: number): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      const hasHistory =
        this.orders.some((o) => o.salespersonId === user.id || o.salespersonId === user.cloudId) ||
        this.retailers.some((r) => r.assignedSalespersonId === user.id || r.assignedSalespersonId === user.cloudId);
      if (hasHistory) {
        throw new Error('This sales team member has historical transactions and has been made inactive. Historical records remain preserved.');
      }
      this.users = this.users.filter((u) => u.id !== id);
      this.saveLocal('distriflow_users', this.users);
    }
  }

  // ==========================================
  // COMPANY PROFILE
  // ==========================================
  async getCompanyProfile(): Promise<CompanyProfile> {
    return { ...this.companyProfile };
  }

  async saveCompanyProfile(profile: Partial<CompanyProfile>): Promise<CompanyProfile> {
    this.companyProfile = {
      ...this.companyProfile,
      ...profile,
      updatedAt: Date.now(),
    };
    this.saveLocal('distriflow_company_profile', this.companyProfile);
    return { ...this.companyProfile };
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return [...this.auditLogs].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newId = Math.max(0, ...this.auditLogs.map((l) => l.id)) + 1;
    const created: AuditLog = {
      ...log,
      id: newId,
      timestamp: Date.now(),
    };
    this.auditLogs.unshift(created);
    this.saveLocal('distriflow_audit_logs', this.auditLogs);
    return created;
  }
}
