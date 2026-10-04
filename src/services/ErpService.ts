import { ErpDataSource } from './dataSources/ErpDataSource';
import { DevErpDataSource } from './dataSources/DevErpDataSource';
import { SupabaseErpDataSource } from './dataSources/SupabaseErpDataSource';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Retailer,
  Supplier,
  Product,
  Order,
  OrderItem,
  Invoice,
  InvoiceItem,
  Purchase,
  Payment,
  InventoryMovement,
  Delivery,
  User,
  PaymentMethod,
} from '../types/erp';

/**
 * Domain Service & Business Repository.
 * Contains all ERP state machines, accounting checks, and auditable stock transactions.
 * Selects either Supabase or the Dev DataSource automatically based on configuration.
 */
class ErpServiceClass {
  private dataSource: ErpDataSource;

  constructor() {
    if (isSupabaseConfigured) {
      this.dataSource = new SupabaseErpDataSource();
    } else {
      this.dataSource = new DevErpDataSource();
    }
  }

  isUsingSupabase(): boolean {
    return isSupabaseConfigured;
  }

  // --- Retailers ---
  async getRetailers(): Promise<Retailer[]> {
    return this.dataSource.getRetailers();
  }

  async getRetailerById(id: number): Promise<Retailer | null> {
    return this.dataSource.getRetailerById(id);
  }

  async saveRetailer(retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number }): Promise<Retailer> {
    return this.dataSource.saveRetailer(retailer);
  }

  async deleteRetailer(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return this.dataSource.deleteRetailer(id);
  }

  // --- Suppliers ---
  async getSuppliers(): Promise<Supplier[]> {
    return this.dataSource.getSuppliers();
  }

  async getSupplierById(id: number): Promise<Supplier | null> {
    return this.dataSource.getSupplierById(id);
  }

  async saveSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number }): Promise<Supplier> {
    return this.dataSource.saveSupplier(supplier);
  }

  async deleteSupplier(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return this.dataSource.deleteSupplier(id);
  }

  // --- Products & Auditable Stock Adjustments ---
  async getProducts(): Promise<Product[]> {
    return this.dataSource.getProducts();
  }

  async getProductById(id: number): Promise<Product | null> {
    return this.dataSource.getProductById(id);
  }

  async saveProduct(product: Omit<Product, 'id' | 'createdAt'> & { id?: number }): Promise<Product> {
    return this.dataSource.saveProduct(product);
  }

  async deleteProduct(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return this.dataSource.deleteProduct(id);
  }

  async recordStockAdjustment(productId: number, quantityDelta: number, reason: string): Promise<void> {
    const product = await this.dataSource.getProductById(productId);
    if (!product) throw new Error('Product not found');

    const previousStock = product.currentStock;
    const newStock = previousStock + quantityDelta;
    const movementType = quantityDelta >= 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';

    await this.dataSource.updateProductStock(productId, quantityDelta);
    await this.dataSource.createMovement({
      productId: product.id,
      productName: product.name,
      movementType,
      quantity: quantityDelta,
      previousStock,
      newStock,
      referenceType: 'MANUAL_ADJUSTMENT',
      referenceNumber: `ADJ-${Date.now() % 100000}`,
      reasonOrNotes: reason,
    });
  }

  // --- Orders & State Machine ---
  async getOrders(): Promise<Order[]> {
    return this.dataSource.getOrders();
  }

  async getOrderById(id: number): Promise<Order | null> {
    return this.dataSource.getOrderById(id);
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.dataSource.getOrderItems(orderId);
  }

  async createOrder(
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: number },
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ): Promise<Order> {
    return this.dataSource.saveOrder(order, items);
  }

  async approveOrder(orderId: number, feedback?: string): Promise<void> {
    await this.dataSource.updateOrderStatus(orderId, 'APPROVED', feedback || 'Approved by Owner');
  }

  async rejectOrder(orderId: number, feedback: string): Promise<void> {
    await this.dataSource.updateOrderStatus(orderId, 'REJECTED', feedback || 'Rejected by Owner');
  }

  async requestOrderChanges(orderId: number, feedback: string): Promise<void> {
    await this.dataSource.updateOrderStatus(orderId, 'CHANGES_REQUESTED', feedback);
  }

  async deleteOrder(orderId: number): Promise<void> {
    const invoices = await this.dataSource.getInvoices();
    const hasInvoice = invoices.some((inv) => inv.orderId === orderId);
    if (hasInvoice) {
      throw new Error('Cannot delete an order with an active invoice. Please delete the invoice first.');
    }
    return this.dataSource.deleteOrder(orderId);
  }

  // --- Invoicing ---
  async getInvoices(): Promise<Invoice[]> {
    return this.dataSource.getInvoices();
  }

  async getInvoiceById(id: number): Promise<Invoice | null> {
    return this.dataSource.getInvoiceById(id);
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return this.dataSource.getInvoiceItems(invoiceId);
  }

  async generateInvoiceFromOrder(orderId: number): Promise<Invoice> {
    const order = await this.dataSource.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    const items = await this.dataSource.getOrderItems(orderId);

    const invoiceNumber = `INV-${Date.now() % 1000000}`;
    const now = Date.now();
    const dueDate = now + 30 * 24 * 60 * 60 * 1000;

    const invoice = await this.dataSource.createInvoice(
      {
        invoiceNumber,
        orderId: order.id,
        retailerId: order.retailerId,
        retailerName: order.retailerName,
        invoiceDate: now,
        dueDate,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: 0,
        totalAmount: order.totalAmount,
        amountPaid: 0,
        remainingBalance: order.totalAmount,
        paymentStatus: 'UNPAID',
      },
      items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: (it.unitPrice * it.discountPercent) / 100,
        total: it.total,
      }))
    );

    // Update order status to INVOICED
    await this.dataSource.updateOrderStatus(order.id, 'INVOICED', `Invoice generated: ${invoiceNumber}`);

    // Update retailer outstanding balance
    await this.dataSource.updateRetailerBalance(order.retailerId, order.totalAmount);

    return invoice;
  }

  async deleteInvoice(invoiceId: number): Promise<void> {
    const invoice = await this.dataSource.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.amountPaid > 0) {
      throw new Error('Cannot delete an invoice that has payments recorded. Please reverse or remove associated payments first.');
    }
    const payments = await this.dataSource.getPayments();
    const hasPayments = payments.some((p) => p.invoiceId === invoiceId);
    if (hasPayments) {
      throw new Error('Cannot delete invoice linked to existing payment records. Please remove payments first.');
    }

    // Deduct invoice amount from retailer outstanding balance
    await this.dataSource.updateRetailerBalance(invoice.retailerId, -invoice.remainingBalance);

    // Revert order back to APPROVED status
    await this.dataSource.updateOrderStatus(invoice.orderId, 'APPROVED', 'Invoice deleted; returned to approved state');

    // Delete invoice records
    await this.dataSource.deleteInvoice(invoiceId);
  }

  // --- Deliveries & Moving for Delivery ---
  async getDeliveries(): Promise<Delivery[]> {
    return this.dataSource.getDeliveries();
  }

  async moveOrderForDelivery(
    orderId: number,
    options?: {
      deliveryAddress?: string;
      driverName?: string;
      driverPhone?: string;
      notes?: string;
    }
  ): Promise<Delivery> {
    const order = await this.dataSource.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    const invoices = await this.dataSource.getInvoices();
    const invoice = invoices.find((inv) => inv.orderId === orderId);

    const retailer = await this.dataSource.getRetailerById(order.retailerId);
    const deliveryAddress =
      options?.deliveryAddress || retailer?.address || 'Customer destination';

    const now = Date.now();
    const delivery = await this.dataSource.createDelivery({
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceId: invoice?.id || null,
      invoiceNumber: invoice?.invoiceNumber,
      retailerId: order.retailerId,
      retailerName: order.retailerName,
      deliveryAddress,
      driverName: options?.driverName || undefined,
      driverPhone: options?.driverPhone || undefined,
      status: 'SCHEDULED',
      scheduledDate: now + 24 * 60 * 60 * 1000,
      notes: options?.notes || `Scheduled for delivery from order ${order.orderNumber}`,
    });

    // Update order status to DISPATCHED or keep state synced
    await this.dataSource.updateOrderStatus(
      order.id,
      order.status === 'INVOICED' ? 'DISPATCHED' : order.status,
      `Moved for delivery (Delivery ID: ${delivery.id})`
    );

    return delivery;
  }

  async dispatchDelivery(
    deliveryId: number,
    driverName: string,
    driverPhone: string,
    notes: string
  ): Promise<void> {
    await this.dataSource.updateDeliveryStatus(deliveryId, 'DISPATCHED', undefined, notes);
    const deliveries = await this.dataSource.getDeliveries();
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (delivery) {
      await this.dataSource.updateOrderStatus(
        delivery.orderId,
        'DISPATCHED',
        `Dispatched with driver ${driverName} (${driverPhone})`
      );
    }
  }

  async completeDelivery(deliveryId: number, notes: string): Promise<void> {
    const deliveries = await this.dataSource.getDeliveries();
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    const now = Date.now();
    await this.dataSource.updateDeliveryStatus(deliveryId, 'DELIVERED', now, notes);
    await this.dataSource.updateOrderStatus(delivery.orderId, 'DELIVERED', 'Delivered successfully');

    // Deduct stock for all order items & record auditable movements
    const items = await this.dataSource.getOrderItems(delivery.orderId);
    for (const item of items) {
      const product = await this.dataSource.getProductById(item.productId);
      if (product) {
        const previousStock = product.currentStock;
        const newStock = previousStock - item.quantity;
        await this.dataSource.updateProductStock(product.id, -item.quantity);
        await this.dataSource.createMovement({
          productId: product.id,
          productName: product.name,
          movementType: 'ORDER_DELIVERY',
          quantity: -item.quantity,
          previousStock,
          newStock,
          referenceType: 'ORDER',
          referenceId: delivery.orderId,
          referenceNumber: delivery.orderNumber,
          reasonOrNotes: `Dispatched and delivered to ${delivery.retailerName}`,
        });
      }
    }
  }

  async deleteDelivery(id: number): Promise<void> {
    return this.dataSource.deleteDelivery(id);
  }

  // --- Purchases ---
  async getPurchases(): Promise<Purchase[]> {
    return this.dataSource.getPurchases();
  }

  async createPurchase(
    supplierId: number,
    billNumber: string,
    items: { product: Product; quantity: number }[],
    notes: string
  ): Promise<Purchase> {
    const supplier = await this.dataSource.getSupplierById(supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const totalAmount = items.reduce((sum, it) => sum + it.product.purchasePrice * it.quantity, 0);
    const now = Date.now();

    const purchase = await this.dataSource.createPurchase(
      {
        billNumber,
        supplierId,
        supplierName: supplier.name,
        purchaseDate: now,
        totalAmount,
        amountPaid: 0,
        paymentStatus: 'UNPAID',
        notes,
      },
      items.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        quantity: it.quantity,
        purchasePrice: it.product.purchasePrice,
        total: it.product.purchasePrice * it.quantity,
      }))
    );

    // Increase supplier payable balance
    await this.dataSource.updateSupplierBalance(supplierId, totalAmount);

    // Increment product stock and write auditable movement
    for (const it of items) {
      const fresh = (await this.dataSource.getProductById(it.product.id)) || it.product;
      const previousStock = fresh.currentStock;
      const newStock = previousStock + it.quantity;

      await this.dataSource.updateProductStock(it.product.id, it.quantity);
      await this.dataSource.createMovement({
        productId: it.product.id,
        productName: it.product.name,
        movementType: 'PURCHASE_RECEIPT',
        quantity: it.quantity,
        previousStock,
        newStock,
        referenceType: 'PURCHASE',
        referenceId: purchase.id,
        referenceNumber: billNumber,
        reasonOrNotes: `Received from supplier ${supplier.name}`,
      });
    }

    return purchase;
  }

  async deletePurchase(id: number): Promise<void> {
    const purchases = await this.dataSource.getPurchases();
    const purchase = purchases.find((p) => p.id === id);
    if (!purchase) throw new Error('Purchase not found');

    if (purchase.amountPaid > 0) {
      throw new Error('Cannot delete purchase with recorded payments. Please reverse or remove disbursements first.');
    }
    const payments = await this.dataSource.getPayments();
    const hasPayments = payments.some((p) => p.purchaseId === id);
    if (hasPayments) {
      throw new Error('Cannot delete purchase that has disbursement payments recorded.');
    }

    // Deduct unpaid amount from supplier payable balance
    const unpaid = purchase.totalAmount - purchase.amountPaid;
    if (unpaid > 0) {
      await this.dataSource.updateSupplierBalance(purchase.supplierId, -unpaid);
    }
    return this.dataSource.deletePurchase(id);
  }

  // --- Payments ---
  async getPayments(): Promise<Payment[]> {
    return this.dataSource.getPayments();
  }

  async recordRetailerPayment(
    retailerId: number,
    invoiceId: number | null,
    amount: number,
    paymentMethod: PaymentMethod,
    referenceNumber: string,
    notes: string,
    recordedByUserId: string | number,
    recordedByName: string
  ): Promise<Payment> {
    const retailer = await this.dataSource.getRetailerById(retailerId);
    if (!retailer) throw new Error('Retailer not found');
    if (amount <= 0) throw new Error('Payment amount must be greater than zero');

    const now = Date.now();
    const payment = await this.dataSource.createPayment({
      paymentNumber: `PAY-R-${now % 1000000}`,
      type: 'RETAILER_COLLECTION',
      entityId: retailerId,
      entityName: retailer.name,
      invoiceId,
      amount,
      paymentDate: now,
      paymentMethod,
      referenceNumber,
      notes,
      recordedByUserId,
      recordedByName,
    });

    // Deduct retailer outstanding balance
    await this.dataSource.updateRetailerBalance(retailerId, -amount);

    if (invoiceId) {
      const invoice = await this.dataSource.getInvoiceById(invoiceId);
      if (invoice) {
        const remaining = Math.max(0, invoice.remainingBalance - amount);
        const status = remaining <= 0.01 ? 'PAID' : remaining < invoice.totalAmount ? 'PARTIALLY_PAID' : 'UNPAID';
        await this.dataSource.updateInvoicePayment(invoiceId, amount, status);
      }
    }

    return payment;
  }

  async recordSupplierPayment(
    supplierId: number,
    purchaseId: number | null,
    amount: number,
    paymentMethod: PaymentMethod,
    referenceNumber: string,
    notes: string,
    recordedByUserId: string | number,
    recordedByName: string
  ): Promise<Payment> {
    const supplier = await this.dataSource.getSupplierById(supplierId);
    if (!supplier) throw new Error('Supplier not found');
    if (amount <= 0) throw new Error('Disbursement amount must be greater than zero');

    const now = Date.now();
    const payment = await this.dataSource.createPayment({
      paymentNumber: `PAY-S-${now % 1000000}`,
      type: 'SUPPLIER_PAYMENT',
      entityId: supplierId,
      entityName: supplier.name,
      purchaseId,
      amount,
      paymentDate: now,
      paymentMethod,
      referenceNumber,
      notes,
      recordedByUserId,
      recordedByName,
    });

    // Deduct supplier payable balance
    await this.dataSource.updateSupplierBalance(supplierId, -amount);

    // Update purchase payment status if linked to specific purchase
    if (purchaseId) {
      await this.dataSource.updatePurchasePayment(purchaseId, amount);
    }

    return payment;
  }

  async deletePayment(id: number): Promise<void> {
    const payments = await this.dataSource.getPayments();
    const payment = payments.find((p) => p.id === id);
    if (payment) {
      // Reverse balance effect
      if (payment.type === 'RETAILER_COLLECTION') {
        await this.dataSource.updateRetailerBalance(payment.entityId, payment.amount);
        if (payment.invoiceId) {
          const invoice = await this.dataSource.getInvoiceById(payment.invoiceId);
          if (invoice) {
            const newPaid = Math.max(0, invoice.amountPaid - payment.amount);
            const newStatus = newPaid <= 0 ? 'UNPAID' : 'PARTIALLY_PAID';
            await this.dataSource.updateInvoicePayment(payment.invoiceId, -payment.amount, newStatus);
          }
        }
      } else if (payment.type === 'SUPPLIER_PAYMENT') {
        await this.dataSource.updateSupplierBalance(payment.entityId, payment.amount);
        if (payment.purchaseId) {
          await this.dataSource.updatePurchasePayment(payment.purchaseId, -payment.amount);
        }
      }
    }
    return this.dataSource.deletePayment(id);
  }

  // --- Inventory Movements ---
  async getMovements(): Promise<InventoryMovement[]> {
    return this.dataSource.getMovements();
  }

  async deleteMovement(id: number): Promise<void> {
    return this.dataSource.deleteMovement(id);
  }

  // --- Users & Team ---
  async getUsers(): Promise<User[]> {
    return this.dataSource.getUsers();
  }

  async saveUser(user: Omit<User, 'id' | 'createdAt'> & { id?: number }): Promise<User> {
    return this.dataSource.saveUser(user);
  }

  async deleteUser(id: number): Promise<void> {
    return this.dataSource.deleteUser(id);
  }
}

export const ErpService = new ErpServiceClass();
