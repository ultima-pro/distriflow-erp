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

/**
 * Low-level data source interface.
 * Implemented by DevErpDataSource (local prototype) and SupabaseErpDataSource (cloud).
 */
export interface ErpDataSource {
  // Retailers
  getRetailers(): Promise<Retailer[]>;
  getRetailerById(id: number): Promise<Retailer | null>;
  saveRetailer(retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number }): Promise<Retailer>;
  updateRetailerBalance(id: number, delta: number): Promise<void>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplierById(id: number): Promise<Supplier | null>;
  saveSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number }): Promise<Supplier>;
  updateSupplierBalance(id: number, delta: number): Promise<void>;

  // Products
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | null>;
  saveProduct(product: Omit<Product, 'id' | 'createdAt'> & { id?: number }): Promise<Product>;
  updateProductStock(id: number, qtyDelta: number): Promise<void>;

  // Orders & Items
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | null>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  saveOrder(
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: number },
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ): Promise<Order>;
  updateOrderStatus(orderId: number, status: OrderStatus, feedback?: string): Promise<void>;

  // Invoices & Items
  getInvoices(): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | null>;
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoice(
    invoice: Omit<Invoice, 'id' | 'createdAt'>,
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]
  ): Promise<Invoice>;
  updateInvoicePayment(id: number, amount: number, status: InvoicePaymentStatus): Promise<void>;

  // Purchases & Items
  getPurchases(): Promise<Purchase[]>;
  createPurchase(
    purchase: Omit<Purchase, 'id' | 'createdAt'>,
    items: Omit<PurchaseItem, 'id' | 'purchaseId'>[]
  ): Promise<Purchase>;

  // Payments
  getPayments(): Promise<Payment[]>;
  createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment>;

  // Inventory Movements (Audit Trail)
  getMovements(): Promise<InventoryMovement[]>;
  createMovement(movement: Omit<InventoryMovement, 'id' | 'timestamp'>): Promise<InventoryMovement>;

  // Deliveries
  getDeliveries(): Promise<Delivery[]>;
  createDelivery(delivery: Omit<Delivery, 'id' | 'createdAt'>): Promise<Delivery>;
  updateDeliveryStatus(id: number, status: DeliveryStatus, deliveredDate?: number, notes?: string): Promise<void>;

  // Users Directory
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | null>;
  saveUser(user: Omit<User, 'id' | 'createdAt'> & { id?: number }): Promise<User>;
}
