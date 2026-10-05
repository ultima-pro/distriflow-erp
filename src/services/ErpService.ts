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
  CompanyProfile,
  AuditLog,
  AuditAction,
  AuditModule,
} from '../types/erp';

/**
 * Domain Service & Business Repository.
 * Enforces ERP data lifecycle rules:
 * - Master data: ACTIVE -> ARCHIVED -> RESTORED
 * - Financial transactions: POSTED -> VOIDED / REVERSED
 * - Inventory movements: Immutable ledger with correcting adjustments
 * - Every operation logs to ERP Audit Trail
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

  // --- Audit Trail Helper ---
  async logAudit(
    action: AuditAction,
    module: AuditModule,
    recordId: string | number,
    recordIdentifier: string,
    description: string,
    options?: {
      userId?: string;
      userName?: string;
      userRole?: 'OWNER' | 'SALESPERSON';
      reason?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      await this.dataSource.createAuditLog({
        action,
        module,
        recordId: String(recordId),
        recordIdentifier,
        description,
        userId: options?.userId,
        userName: options?.userName || 'System / Admin',
        userRole: options?.userRole || 'OWNER',
        reason: options?.reason,
        metadata: options?.metadata,
      });
    } catch (e) {
      console.warn('Audit logging warning:', e);
    }
  }

  // ==========================================
  // RETAILERS
  // ==========================================
  async getRetailers(): Promise<Retailer[]> {
    return this.dataSource.getRetailers();
  }

  async getRetailerById(id: number): Promise<Retailer | null> {
    return this.dataSource.getRetailerById(id);
  }

  async saveRetailer(
    retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number },
    actor?: { userId?: string; userName?: string }
  ): Promise<Retailer> {
    const isUpdate = Boolean(retailer.id && retailer.id > 0);
    const saved = await this.dataSource.saveRetailer(retailer);
    await this.logAudit(
      isUpdate ? 'UPDATE' : 'CREATE',
      'RETAILERS',
      saved.id,
      saved.name,
      `${isUpdate ? 'Updated' : 'Created'} customer store '${saved.name}'`,
      actor
    );
    return saved;
  }

  async deleteRetailer(
    id: number,
    actor?: { userId?: string; userName?: string }
  ): Promise<{ deleted: boolean; deactivated: boolean; message?: string }> {
    const retailer = await this.dataSource.getRetailerById(id);
    const res = await this.dataSource.deleteRetailer(id);
    await this.logAudit(
      res.deactivated ? 'ARCHIVE' : 'PERMANENT_DELETE',
      'RETAILERS',
      id,
      retailer?.name || `Retailer #${id}`,
      res.deactivated
        ? `Archived retailer '${retailer?.name || id}' due to historical transactions`
        : `Permanently deleted retailer '${retailer?.name || id}'`,
      actor
    );
    return res;
  }

  async restoreRetailer(id: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const retailer = await this.dataSource.getRetailerById(id);
    await this.dataSource.restoreRetailer(id);
    await this.logAudit(
      'RESTORE',
      'RETAILERS',
      id,
      retailer?.name || `Retailer #${id}`,
      `Restored retailer '${retailer?.name || id}' to active directory`,
      actor
    );
  }

  async permanentDeleteRetailer(id: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const retailer = await this.dataSource.getRetailerById(id);
    await this.dataSource.permanentDeleteRetailer(id);
    await this.logAudit(
      'PERMANENT_DELETE',
      'RETAILERS',
      id,
      retailer?.name || `Retailer #${id}`,
      `Permanently purged retailer '${retailer?.name || id}' from database`,
      actor
    );
  }

  // ==========================================
  // SUPPLIERS
  // ==========================================
  async getSuppliers(): Promise<Supplier[]> {
    return this.dataSource.getSuppliers();
  }

  async getSupplierById(id: number): Promise<Supplier | null> {
    return this.dataSource.getSupplierById(id);
  }

  async saveSupplier(
    supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number },
    actor?: { userId?: string; userName?: string }
  ): Promise<Supplier> {
    const isUpdate = Boolean(supplier.id && supplier.id > 0);
    const saved = await this.dataSource.saveSupplier(supplier);
    await this.logAudit(
      isUpdate ? 'UPDATE' : 'CREATE',
      'SUPPLIERS',
      saved.id,
      saved.name,
      `${isUpdate ? 'Updated' : 'Registered'} supplier '${saved.name}'`,
      actor
    );
    return saved;
  }

  async deleteSupplier(
    id: number,
    actor?: { userId?: string; userName?: string }
  ): Promise<{ deleted: boolean; deactivated: boolean; message?: string }> {
    const supplier = await this.dataSource.getSupplierById(id);
    const res = await this.dataSource.deleteSupplier(id);
    await this.logAudit(
      res.deactivated ? 'ARCHIVE' : 'PERMANENT_DELETE',
      'SUPPLIERS',
      id,
      supplier?.name || `Supplier #${id}`,
      res.deactivated
        ? `Archived supplier '${supplier?.name || id}' due to purchase history`
        : `Permanently deleted supplier '${supplier?.name || id}'`,
      actor
    );
    return res;
  }

  async restoreSupplier(id: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const supplier = await this.dataSource.getSupplierById(id);
    await this.dataSource.restoreSupplier(id);
    await this.logAudit(
      'RESTORE',
      'SUPPLIERS',
      id,
      supplier?.name || `Supplier #${id}`,
      `Restored supplier '${supplier?.name || id}' to active status`,
      actor
    );
  }

  async permanentDeleteSupplier(id: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const supplier = await this.dataSource.getSupplierById(id);
    await this.dataSource.permanentDeleteSupplier(id);
    await this.logAudit(
      'PERMANENT_DELETE',
      'SUPPLIERS',
      id,
      supplier?.name || `Supplier #${id}`,
      `Permanently deleted supplier '${supplier?.name || id}'`,
      actor
    );
  }

  // ==========================================
  // PRODUCTS & STOCK
  // ==========================================
  async getProducts(): Promise<Product[]> {
    return this.dataSource.getProducts();
  }

  async getProductById(id: number): Promise<Product | null> {
    return this.dataSource.getProductById(id);
  }

  async saveProduct(
    product: Omit<Product, 'id' | 'createdAt'> & { id?: number },
    actor?: { userId?: string; userName?: string }
  ): Promise<Product> {
    const isUpdate = Boolean(product.id && product.id > 0);
    const saved = await this.dataSource.saveProduct(product);
    await this.logAudit(
      isUpdate ? 'UPDATE' : 'CREATE',
      'PRODUCTS',
      saved.id,
      `${saved.sku} - ${saved.name}`,
      `${isUpdate ? 'Updated' : 'Created'} catalog item '${saved.name}' (SKU: ${saved.sku})`,
      actor
    );
    return saved;
  }

  async deleteProduct(
    id: number,
    actor?: { userId?: string; userName?: string }
  ): Promise<{ deleted: boolean; deactivated: boolean; message?: string }> {
    const product = await this.dataSource.getProductById(id);
    const res = await this.dataSource.deleteProduct(id);
    await this.logAudit(
      res.deactivated ? 'ARCHIVE' : 'PERMANENT_DELETE',
      'PRODUCTS',
      id,
      product?.name || `Product #${id}`,
      res.deactivated
        ? `Archived product '${product?.name || id}' because historical purchases/orders exist.`
        : `Permanently deleted product '${product?.name || id}'`,
      actor
    );
    return res;
  }

  async restoreProduct(id: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const product = await this.dataSource.getProductById(id);
    await this.dataSource.restoreProduct(id);
    await this.logAudit(
      'RESTORE',
      'PRODUCTS',
      id,
      product?.name || `Product #${id}`,
      `Restored product '${product?.name || id}' to active inventory catalog`,
      actor
    );
  }

  async permanentDeleteProduct(id: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const product = await this.dataSource.getProductById(id);
    await this.dataSource.permanentDeleteProduct(id);
    await this.logAudit(
      'PERMANENT_DELETE',
      'PRODUCTS',
      id,
      product?.name || `Product #${id}`,
      `Permanently deleted product '${product?.name || id}'`,
      actor
    );
  }

  async recordStockAdjustment(
    productId: number,
    quantityDelta: number,
    reason: string,
    actor?: { userId?: string; userName?: string }
  ): Promise<void> {
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

    await this.logAudit(
      'STOCK_ADJUSTMENT',
      'INVENTORY',
      productId,
      product.name,
      `Stock adjusted: ${quantityDelta > 0 ? '+' : ''}${quantityDelta} units. New balance: ${newStock}`,
      { ...actor, reason }
    );
  }

  // ==========================================
  // ORDERS
  // ==========================================
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
    items: Omit<OrderItem, 'id' | 'orderId'>[],
    actor?: { userId?: string; userName?: string }
  ): Promise<Order> {
    const created = await this.dataSource.saveOrder(order, items);
    await this.logAudit(
      'CREATE',
      'ORDERS',
      created.id,
      created.orderNumber,
      `Order ${created.orderNumber} created for ${created.retailerName} (Total: Rs. ${created.totalAmount})`,
      actor
    );
    return created;
  }

  async approveOrder(orderId: number, feedback?: string, actor?: { userId?: string; userName?: string }): Promise<void> {
    await this.dataSource.updateOrderStatus(orderId, 'APPROVED', feedback || 'Approved by Owner');
    await this.logAudit(
      'STATUS_CHANGE',
      'ORDERS',
      orderId,
      `Order #${orderId}`,
      `Approved sales order #${orderId}`,
      { ...actor, reason: feedback }
    );
  }

  async rejectOrder(orderId: number, feedback: string, actor?: { userId?: string; userName?: string }): Promise<void> {
    await this.dataSource.updateOrderStatus(orderId, 'REJECTED', feedback);
    await this.logAudit(
      'STATUS_CHANGE',
      'ORDERS',
      orderId,
      `Order #${orderId}`,
      `Rejected sales order #${orderId}: ${feedback}`,
      { ...actor, reason: feedback }
    );
  }

  async requestOrderChanges(orderId: number, feedback: string, actor?: { userId?: string; userName?: string }): Promise<void> {
    await this.dataSource.updateOrderStatus(orderId, 'CHANGES_REQUESTED', feedback);
    await this.logAudit(
      'STATUS_CHANGE',
      'ORDERS',
      orderId,
      `Order #${orderId}`,
      `Requested revisions for order #${orderId}: ${feedback}`,
      { ...actor, reason: feedback }
    );
  }

  async deleteOrder(orderId: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const order = await this.dataSource.getOrderById(orderId);
    await this.dataSource.deleteOrder(orderId);
    await this.logAudit(
      'ARCHIVE',
      'ORDERS',
      orderId,
      order?.orderNumber || `Order #${orderId}`,
      `Archived / removed sales order ${order?.orderNumber || orderId}`,
      actor
    );
  }

  async restoreOrder(orderId: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const order = await this.dataSource.getOrderById(orderId);
    await this.dataSource.restoreOrder(orderId);
    await this.logAudit(
      'RESTORE',
      'ORDERS',
      orderId,
      order?.orderNumber || `Order #${orderId}`,
      `Restored order ${order?.orderNumber || orderId} to active draft status`,
      actor
    );
  }

  async permanentDeleteOrder(orderId: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const order = await this.dataSource.getOrderById(orderId);
    await this.dataSource.permanentDeleteOrder(orderId);
    await this.logAudit(
      'PERMANENT_DELETE',
      'ORDERS',
      orderId,
      order?.orderNumber || `Order #${orderId}`,
      `Permanently deleted order ${order?.orderNumber || orderId}`,
      actor
    );
  }

  // ==========================================
  // INVOICING (ATOMIC & DUPLICATE-PROTECTED)
  // ==========================================
  async getInvoices(): Promise<Invoice[]> {
    return this.dataSource.getInvoices();
  }

  async getInvoiceById(id: number): Promise<Invoice | null> {
    return this.dataSource.getInvoiceById(id);
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return this.dataSource.getInvoiceItems(invoiceId);
  }

  async generateInvoiceFromOrder(
    orderId: number,
    actor?: { userId?: string; userName?: string }
  ): Promise<Invoice> {
    const order = await this.dataSource.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    // Prevent duplicate invoice creation
    const existingInvoices = await this.dataSource.getInvoices();
    const existing = existingInvoices.find(
      (inv) => inv.orderId === orderId && inv.paymentStatus !== 'VOIDED' && inv.status !== 'VOIDED'
    );
    if (existing) {
      throw new Error(
        `Order ${order.orderNumber} already has an active invoice (${existing.invoiceNumber}). Duplicate invoice prevented.`
      );
    }

    const items = await this.dataSource.getOrderItems(orderId);
    const invoiceNumber = `INV-${Date.now() % 1000000}`;
    const now = Date.now();
    const dueDate = now + 30 * 24 * 60 * 60 * 1000; // Net 30 default

    // 1. Create Invoice & line items
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

    // 2. Update order status to INVOICED
    await this.dataSource.updateOrderStatus(order.id, 'INVOICED', `Invoice issued: ${invoiceNumber}`);

    // 3. Atomically increase retailer outstanding balance
    await this.dataSource.updateRetailerBalance(order.retailerId, order.totalAmount);

    // 4. Audit Log
    await this.logAudit(
      'CREATE_INVOICE',
      'INVOICES',
      invoice.id,
      invoiceNumber,
      `Issued tax invoice ${invoiceNumber} for order ${order.orderNumber} to ${order.retailerName} (Total: Rs. ${order.totalAmount})`,
      actor
    );

    return invoice;
  }

  async voidInvoice(
    invoiceId: number,
    reason: string = 'Voided by Administrator',
    actor?: { userId?: string; userName?: string }
  ): Promise<void> {
    const invoice = await this.dataSource.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'VOIDED' || invoice.paymentStatus === 'VOIDED') {
      throw new Error('This invoice is already voided.');
    }

    // Check if any active payments exist
    const payments = await this.dataSource.getPayments();
    const activePayments = payments.filter((p) => p.invoiceId === invoiceId && p.status !== 'REVERSED');
    if (activePayments.length > 0) {
      throw new Error(
        'Cannot void an invoice that has active payments recorded. Please reverse all related payments first.'
      );
    }

    // 1. Deduct unpaid balance from retailer outstanding balance
    await this.dataSource.updateRetailerBalance(invoice.retailerId, -invoice.remainingBalance);

    // 2. Revert order status back to APPROVED
    await this.dataSource.updateOrderStatus(invoice.orderId, 'APPROVED', `Invoice ${invoice.invoiceNumber} voided.`);

    // 3. Mark invoice as VOIDED in database
    await this.dataSource.voidInvoice(invoiceId, reason, actor?.userName);

    // 4. Audit log
    await this.logAudit(
      'VOID',
      'INVOICES',
      invoiceId,
      invoice.invoiceNumber,
      `Voided invoice ${invoice.invoiceNumber}. Retailer balance credited by Rs. ${invoice.remainingBalance}.`,
      { ...actor, reason }
    );
  }

  async deleteInvoice(invoiceId: number): Promise<void> {
    // Redirect to voidInvoice to preserve accounting history
    return this.voidInvoice(invoiceId, 'Deleted/Voided via Invoices screen');
  }

  // ==========================================
  // DELIVERIES
  // ==========================================
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
    },
    actor?: { userId?: string; userName?: string }
  ): Promise<Delivery> {
    const order = await this.dataSource.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    // Prevent duplicate delivery creation for same order
    const deliveries = await this.dataSource.getDeliveries();
    const existing = deliveries.find((d) => d.orderId === orderId && d.status !== 'FAILED');
    if (existing) {
      return existing;
    }

    const invoices = await this.dataSource.getInvoices();
    const invoice = invoices.find(
      (inv) => inv.orderId === orderId && inv.paymentStatus !== 'VOIDED' && inv.status !== 'VOIDED'
    );

    const retailer = await this.dataSource.getRetailerById(order.retailerId);
    const deliveryAddress = options?.deliveryAddress || retailer?.address || 'Customer destination';
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

    await this.dataSource.updateOrderStatus(
      order.id,
      order.status === 'INVOICED' ? 'DISPATCHED' : order.status,
      `Moved for delivery (Delivery ID: #${delivery.id})`
    );

    await this.logAudit(
      'DELIVERY_DISPATCH',
      'DELIVERIES',
      delivery.id,
      `Delivery #${delivery.id}`,
      `Scheduled delivery for order ${order.orderNumber} to ${order.retailerName}`,
      actor
    );

    return delivery;
  }

  async dispatchDelivery(
    deliveryId: number,
    driverName: string,
    driverPhone: string,
    notes: string,
    actor?: { userId?: string; userName?: string }
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
      await this.logAudit(
        'DELIVERY_DISPATCH',
        'DELIVERIES',
        deliveryId,
        `Delivery #${deliveryId}`,
        `Dispatched delivery #${deliveryId} with ${driverName}`,
        actor
      );
    }
  }

  async completeDelivery(
    deliveryId: number,
    notes: string,
    actor?: { userId?: string; userName?: string }
  ): Promise<void> {
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

    await this.logAudit(
      'DELIVERY_COMPLETE',
      'DELIVERIES',
      deliveryId,
      `Delivery #${deliveryId}`,
      `Completed delivery for order ${delivery.orderNumber}. Stock deducted.`,
      actor
    );
  }

  async deleteDelivery(id: number): Promise<void> {
    return this.dataSource.deleteDelivery(id);
  }

  // ==========================================
  // PURCHASES & SUPPLIER BILLS
  // ==========================================
  async getPurchases(): Promise<Purchase[]> {
    return this.dataSource.getPurchases();
  }

  async createPurchase(
    supplierId: number,
    billNumber: string,
    items: { product: Product; quantity: number }[],
    notes: string,
    actor?: { userId?: string; userName?: string }
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

    // Increment product stock and log auditable movements
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

    await this.logAudit(
      'CREATE',
      'SUPPLIERS',
      purchase.id,
      billNumber,
      `Recorded purchase bill ${billNumber} from ${supplier.name} (Total: Rs. ${totalAmount})`,
      actor
    );

    return purchase;
  }

  async voidPurchase(
    purchaseId: number,
    reason: string = 'Voided by Administrator',
    actor?: { userId?: string; userName?: string }
  ): Promise<void> {
    const purchases = await this.dataSource.getPurchases();
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) throw new Error('Purchase not found');
    if (purchase.status === 'VOIDED' || purchase.paymentStatus === 'VOIDED') {
      throw new Error('This purchase is already voided.');
    }

    // Check if any active disbursements exist
    const payments = await this.dataSource.getPayments();
    const activePayments = payments.filter((p) => p.purchaseId === purchaseId && p.status !== 'REVERSED');
    if (activePayments.length > 0) {
      throw new Error('Cannot void purchase that has active payments recorded. Please reverse payments first.');
    }

    // 1. Deduct unpaid balance from supplier payables
    const unpaid = purchase.totalAmount - purchase.amountPaid;
    if (unpaid > 0) {
      await this.dataSource.updateSupplierBalance(purchase.supplierId, -unpaid);
    }

    // 2. Mark purchase as VOIDED in database
    await this.dataSource.voidPurchase(purchaseId, reason, actor?.userName);

    // 3. Audit log
    await this.logAudit(
      'VOID',
      'SUPPLIERS',
      purchaseId,
      purchase.billNumber,
      `Voided purchase bill ${purchase.billNumber}. Supplier payables credited.`,
      { ...actor, reason }
    );
  }

  async deletePurchase(id: number): Promise<void> {
    return this.voidPurchase(id, 'Deleted/Voided via Purchases screen');
  }

  // ==========================================
  // PAYMENTS & COLLECTIONS
  // ==========================================
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
    if (amount <= 0) throw new Error('Payment collection amount must be greater than zero');

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
      status: 'ACTIVE',
    });

    // 1. Deduct retailer outstanding balance
    await this.dataSource.updateRetailerBalance(retailerId, -amount);

    // 2. Update invoice amount_paid & balance
    if (invoiceId) {
      const invoice = await this.dataSource.getInvoiceById(invoiceId);
      if (invoice) {
        const remaining = Math.max(0, invoice.remainingBalance - amount);
        const status = remaining <= 0.01 ? 'PAID' : remaining < invoice.totalAmount ? 'PARTIALLY_PAID' : 'UNPAID';
        await this.dataSource.updateInvoicePayment(invoiceId, amount, status);
      }
    }

    // 3. Audit log
    await this.logAudit(
      'RECORD_COLLECTION',
      'PAYMENTS',
      payment.id,
      payment.paymentNumber,
      `Collected Rs. ${amount} from ${retailer.name} via ${paymentMethod} (${payment.paymentNumber})`,
      { userId: String(recordedByUserId), userName: recordedByName }
    );

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
      status: 'ACTIVE',
    });

    // 1. Deduct supplier payable balance
    await this.dataSource.updateSupplierBalance(supplierId, -amount);

    // 2. Update purchase payment status
    if (purchaseId) {
      await this.dataSource.updatePurchasePayment(purchaseId, amount);
    }

    // 3. Audit log
    await this.logAudit(
      'RECORD_DISBURSEMENT',
      'PAYMENTS',
      payment.id,
      payment.paymentNumber,
      `Disbursed Rs. ${amount} to supplier ${supplier.name} via ${paymentMethod} (${payment.paymentNumber})`,
      { userId: String(recordedByUserId), userName: recordedByName }
    );

    return payment;
  }

  async reversePayment(
    paymentId: number,
    reason: string = 'Reversed by Administrator',
    actor?: { userId?: string; userName?: string }
  ): Promise<void> {
    const payments = await this.dataSource.getPayments();
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');
    if (payment.status === 'REVERSED') throw new Error('This payment has already been reversed.');

    // 1. Reverse balance effects
    if (payment.type === 'RETAILER_COLLECTION') {
      // Re-add to retailer outstanding balance
      await this.dataSource.updateRetailerBalance(payment.entityId, payment.amount);

      // Revert invoice payment
      if (payment.invoiceId) {
        const invoice = await this.dataSource.getInvoiceById(payment.invoiceId);
        if (invoice) {
          const newPaid = Math.max(0, invoice.amountPaid - payment.amount);
          const newRemaining = Math.max(0, invoice.totalAmount - newPaid);
          const newStatus = newPaid <= 0 ? 'UNPAID' : 'PARTIALLY_PAID';
          await this.dataSource.updateInvoicePayment(payment.invoiceId, -payment.amount, newStatus);
        }
      }
    } else if (payment.type === 'SUPPLIER_PAYMENT') {
      // Re-add to supplier payable balance
      await this.dataSource.updateSupplierBalance(payment.entityId, payment.amount);

      // Revert purchase payment
      if (payment.purchaseId) {
        await this.dataSource.updatePurchasePayment(payment.purchaseId, -payment.amount);
      }
    }

    // 2. Mark payment status as REVERSED
    await this.dataSource.reversePayment(paymentId, reason, actor?.userName);

    // 3. Audit log
    await this.logAudit(
      'REVERSE_PAYMENT',
      'PAYMENTS',
      paymentId,
      payment.paymentNumber,
      `Reversed payment ${payment.paymentNumber} of Rs. ${payment.amount}. Balances restored.`,
      { ...actor, reason }
    );
  }

  async deletePayment(id: number): Promise<void> {
    return this.reversePayment(id, 'Reversed via Payments screen');
  }

  // ==========================================
  // INVENTORY MOVEMENTS (AUDIT TRAIL)
  // ==========================================
  async getMovements(): Promise<InventoryMovement[]> {
    return this.dataSource.getMovements();
  }

  async deleteMovement(id: number): Promise<void> {
    // Preserve audit trail - stock ledger cannot be destroyed
    throw new Error('Direct deletion of inventory movements is forbidden to maintain accounting integrity. Please record a correcting Stock Adjustment instead.');
  }

  // ==========================================
  // USERS & SALES TEAM
  // ==========================================
  async getUsers(): Promise<User[]> {
    return this.dataSource.getUsers();
  }

  async saveUser(
    user: Omit<User, 'id' | 'createdAt'> & { id?: number },
    actor?: { userId?: string; userName?: string }
  ): Promise<User> {
    const isUpdate = Boolean(user.id && user.id > 0);
    const saved = await this.dataSource.saveUser(user);
    await this.logAudit(
      isUpdate ? 'UPDATE' : 'CREATE',
      'SALES_TEAM',
      saved.cloudId || saved.id,
      saved.fullName,
      `${isUpdate ? 'Updated' : 'Created'} sales representative '${saved.fullName}' (@${saved.username})`,
      actor
    );
    return saved;
  }

  async deleteUser(id: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const user = await this.dataSource.getUserById(id);
    await this.dataSource.deleteUser(id);
    await this.logAudit(
      'ARCHIVE',
      'SALES_TEAM',
      user?.cloudId || id,
      user?.fullName || `User #${id}`,
      `Deactivated sales team member '${user?.fullName || id}'`,
      actor
    );
  }

  async restoreUser(id: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const user = await this.dataSource.getUserById(id);
    await this.dataSource.restoreUser(id);
    await this.logAudit(
      'RESTORE',
      'SALES_TEAM',
      user?.cloudId || id,
      user?.fullName || `User #${id}`,
      `Restored sales team member '${user?.fullName || id}'`,
      actor
    );
  }

  async permanentDeleteUser(id: number, actor?: { userId?: string; userName?: string }): Promise<void> {
    const user = await this.dataSource.getUserById(id);
    await this.dataSource.permanentDeleteUser(id);
    await this.logAudit(
      'PERMANENT_DELETE',
      'SALES_TEAM',
      user?.cloudId || id,
      user?.fullName || `User #${id}`,
      `Permanently deleted user '${user?.fullName || id}'`,
      actor
    );
  }

  // ==========================================
  // COMPANY PROFILE
  // ==========================================
  async getCompanyProfile(): Promise<CompanyProfile> {
    return this.dataSource.getCompanyProfile();
  }

  async saveCompanyProfile(
    profile: Partial<CompanyProfile>,
    actor?: { userId?: string; userName?: string }
  ): Promise<CompanyProfile> {
    const saved = await this.dataSource.saveCompanyProfile(profile);
    await this.logAudit(
      'COMPANY_PROFILE_UPDATE',
      'COMPANY_PROFILE',
      '1',
      saved.companyName,
      `Updated company profile identity to '${saved.companyName}'`,
      actor
    );
    return saved;
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return this.dataSource.getAuditLogs(limit);
  }
}

export const ErpService = new ErpServiceClass();
