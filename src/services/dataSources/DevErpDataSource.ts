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
 * In-memory development data source.
 * Strictly used when Supabase is not connected.
 */
export class DevErpDataSource implements ErpDataSource {
  private users: User[] = [...INITIAL_DEMO_USERS];
  private suppliers: Supplier[] = [...INITIAL_DEMO_SUPPLIERS];
  private products: Product[] = [...INITIAL_DEMO_PRODUCTS];
  private retailers: Retailer[] = [...INITIAL_DEMO_RETAILERS];
  private orders: Order[] = [...INITIAL_DEMO_ORDERS];
  private orderItems: OrderItem[] = [...INITIAL_DEMO_ORDER_ITEMS];
  private invoices: Invoice[] = [...INITIAL_DEMO_INVOICES];
  private invoiceItems: InvoiceItem[] = [];
  private purchases: Purchase[] = [];
  private purchaseItems: PurchaseItem[] = [];
  private payments: Payment[] = [...INITIAL_DEMO_PAYMENTS];
  private movements: InventoryMovement[] = [...INITIAL_DEMO_MOVEMENTS];
  private deliveries: Delivery[] = [...INITIAL_DEMO_DELIVERIES];

  // Retailers
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
        return updated;
      }
    }
    const newId = Math.max(0, ...this.retailers.map((r) => r.id)) + 1;
    const created: Retailer = {
      ...retailer,
      id: newId,
      creditLimit: retailer.creditLimit ?? 2500,
      outstandingBalance: retailer.outstandingBalance ?? 0,
      isActive: retailer.isActive ?? true,
      createdAt: Date.now(),
    };
    this.retailers.push(created);
    return created;
  }

  async updateRetailerBalance(id: number, delta: number): Promise<void> {
    const retailer = this.retailers.find((r) => r.id === id);
    if (retailer) {
      retailer.outstandingBalance += delta;
    }
  }

  async deleteRetailer(id: number): Promise<void> {
    this.retailers = this.retailers.filter((r) => r.id !== id);
  }

  // Suppliers
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
        return updated;
      }
    }
    const newId = Math.max(0, ...this.suppliers.map((s) => s.id)) + 1;
    const created: Supplier = {
      ...supplier,
      id: newId,
      payableBalance: supplier.payableBalance ?? 0,
      isActive: supplier.isActive ?? true,
      createdAt: Date.now(),
    };
    this.suppliers.push(created);
    return created;
  }

  async updateSupplierBalance(id: number, delta: number): Promise<void> {
    const supplier = this.suppliers.find((s) => s.id === id);
    if (supplier) {
      supplier.payableBalance += delta;
    }
  }

  async deleteSupplier(id: number): Promise<void> {
    this.suppliers = this.suppliers.filter((s) => s.id !== id);
  }

  // Products
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
    return created;
  }

  async updateProductStock(id: number, qtyDelta: number): Promise<void> {
    const product = this.products.find((p) => p.id === id);
    if (product) {
      product.currentStock += qtyDelta;
    }
  }

  async deleteProduct(id: number): Promise<void> {
    this.products = this.products.filter((p) => p.id !== id);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return [...this.orders].sort((a, b) => b.orderDate - a.orderDate);
  }

  async getOrderById(id: number): Promise<Order | null> {
    return this.orders.find((o) => o.id === id) || null;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.orderItems.filter((i) => i.orderId === orderId);
  }

  async saveOrder(
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: number },
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ): Promise<Order> {
    const now = Date.now();
    let orderId = order.id;

    if (orderId && orderId > 0) {
      const idx = this.orders.findIndex((o) => o.id === orderId);
      if (idx >= 0) {
        this.orders[idx] = {
          ...this.orders[idx],
          ...order,
          id: orderId,
          updatedAt: now,
        };
      }
      this.orderItems = this.orderItems.filter((i) => i.orderId !== orderId);
    } else {
      orderId = Math.max(0, ...this.orders.map((o) => o.id)) + 1;
      const created: Order = {
        ...order,
        id: orderId,
        createdAt: now,
        updatedAt: now,
      };
      this.orders.unshift(created);
    }

    let nextItemId = Math.max(0, ...this.orderItems.map((i) => i.id)) + 1;
    const createdItems: OrderItem[] = items.map((it) => ({
      ...it,
      id: nextItemId++,
      orderId: orderId!,
    }));
    this.orderItems.push(...createdItems);

    return this.orders.find((o) => o.id === orderId)!;
  }

  async updateOrderStatus(orderId: number, status: OrderStatus, feedback?: string): Promise<void> {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      if (feedback !== undefined) order.ownerFeedback = feedback;
      order.updatedAt = Date.now();
    }
  }

  async deleteOrder(id: number): Promise<void> {
    this.orders = this.orders.filter((o) => o.id !== id);
    this.orderItems = this.orderItems.filter((i) => i.orderId !== id);
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return [...this.invoices].sort((a, b) => b.invoiceDate - a.invoiceDate);
  }

  async getInvoiceById(id: number): Promise<Invoice | null> {
    return this.invoices.find((i) => i.id === id) || null;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return this.invoiceItems.filter((i) => i.invoiceId === invoiceId);
  }

  async createInvoice(
    invoice: Omit<Invoice, 'id' | 'createdAt'>,
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]
  ): Promise<Invoice> {
    const newId = Math.max(0, ...this.invoices.map((i) => i.id)) + 1;
    const createdInvoice: Invoice = {
      ...invoice,
      id: newId,
      createdAt: Date.now(),
    };
    this.invoices.unshift(createdInvoice);

    let nextItemId = Math.max(0, ...this.invoiceItems.map((i) => i.id)) + 1;
    const createdItems: InvoiceItem[] = items.map((it) => ({
      ...it,
      id: nextItemId++,
      invoiceId: newId,
    }));
    this.invoiceItems.push(...createdItems);

    return createdInvoice;
  }

  async updateInvoicePayment(id: number, amount: number, status: InvoicePaymentStatus): Promise<void> {
    const invoice = this.invoices.find((i) => i.id === id);
    if (invoice) {
      invoice.amountPaid += amount;
      invoice.remainingBalance = Math.max(0, invoice.remainingBalance - amount);
      invoice.paymentStatus = status;
    }
  }

  async deleteInvoice(id: number): Promise<void> {
    this.invoices = this.invoices.filter((i) => i.id !== id);
    this.invoiceItems = this.invoiceItems.filter((it) => it.invoiceId !== id);
  }

  // Purchases
  async getPurchases(): Promise<Purchase[]> {
    return [...this.purchases].sort((a, b) => b.purchaseDate - a.purchaseDate);
  }

  async createPurchase(
    purchase: Omit<Purchase, 'id' | 'createdAt'>,
    items: Omit<PurchaseItem, 'id' | 'purchaseId'>[]
  ): Promise<Purchase> {
    const newId = Math.max(0, ...this.purchases.map((p) => p.id)) + 1;
    const createdPurchase: Purchase = {
      ...purchase,
      id: newId,
      createdAt: Date.now(),
    };
    this.purchases.unshift(createdPurchase);

    let nextItemId = Math.max(0, ...this.purchaseItems.map((i) => i.id)) + 1;
    const createdItems: PurchaseItem[] = items.map((it) => ({
      ...it,
      id: nextItemId++,
      purchaseId: newId,
    }));
    this.purchaseItems.push(...createdItems);

    return createdPurchase;
  }

  async updatePurchasePayment(purchaseId: number, amount: number): Promise<void> {
    const purchase = this.purchases.find((p) => p.id === purchaseId);
    if (purchase) {
      purchase.amountPaid += amount;
      if (purchase.amountPaid >= purchase.totalAmount) {
        purchase.paymentStatus = 'PAID';
      } else if (purchase.amountPaid > 0) {
        purchase.paymentStatus = 'PARTIALLY_PAID';
      }
    }
  }

  async deletePurchase(id: number): Promise<void> {
    this.purchases = this.purchases.filter((p) => p.id !== id);
    this.purchaseItems = this.purchaseItems.filter((i) => i.purchaseId !== id);
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return [...this.payments].sort((a, b) => b.paymentDate - a.paymentDate);
  }

  async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const newId = Math.max(0, ...this.payments.map((p) => p.id)) + 1;
    const created: Payment = {
      ...payment,
      id: newId,
      createdAt: Date.now(),
    };
    this.payments.unshift(created);
    return created;
  }

  async deletePayment(id: number): Promise<void> {
    this.payments = this.payments.filter((p) => p.id !== id);
  }

  // Movements
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
    this.movements.unshift(created);
    return created;
  }

  async deleteMovement(id: number): Promise<void> {
    this.movements = this.movements.filter((m) => m.id !== id);
  }

  // Deliveries
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
    this.deliveries.unshift(created);
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
    }
  }

  async deleteDelivery(id: number): Promise<void> {
    this.deliveries = this.deliveries.filter((d) => d.id !== id);
  }

  // Users
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
        this.users[idx] = {
          ...this.users[idx],
          ...user,
          id: user.id,
        };
        return this.users[idx];
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
    return created;
  }

  async deleteUser(id: number): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id);
  }
}
