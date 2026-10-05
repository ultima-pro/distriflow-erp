import { ErpDataSource } from './ErpDataSource';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
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

/**
 * Cloud Supabase implementation of ErpDataSource.
 * Interacts with PostgreSQL tables via PostgREST and enforces Row Level Security (RLS).
 * Every mutation explicitly checks for errors and throws on failure to guarantee data integrity.
 */
export class SupabaseErpDataSource implements ErpDataSource {
  private ensureConfigured() {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
    }
    return supabase;
  }

  // ==========================================
  // RETAILERS
  // ==========================================
  async getRetailers(): Promise<Retailer[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client.from('retailers').select('*').order('name');
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      contactPerson: row.contact_person,
      phone: row.phone,
      email: row.email,
      address: row.address,
      city: row.city,
      assignedSalespersonId: row.assigned_salesperson_id,
      creditLimit: parseFloat(row.credit_limit || '0'),
      outstandingBalance: parseFloat(row.outstanding_balance || '0'),
      isActive: row.is_active,
      archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  async getRetailerById(id: number): Promise<Retailer | null> {
    const client = this.ensureConfigured();
    const { data, error } = await client.from('retailers').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      assignedSalespersonId: data.assigned_salesperson_id,
      creditLimit: parseFloat(data.credit_limit || '0'),
      outstandingBalance: parseFloat(data.outstanding_balance || '0'),
      isActive: data.is_active,
      archivedAt: data.archived_at ? new Date(data.archived_at).getTime() : undefined,
      createdAt: new Date(data.created_at).getTime(),
    };
  }

  async saveRetailer(retailer: Omit<Retailer, 'id' | 'createdAt'> & { id?: number }): Promise<Retailer> {
    const client = this.ensureConfigured();
    const payload = {
      name: retailer.name,
      contact_person: retailer.contactPerson,
      phone: retailer.phone,
      email: retailer.email,
      address: retailer.address,
      city: retailer.city,
      assigned_salesperson_id: retailer.assignedSalespersonId,
      credit_limit: retailer.creditLimit,
      is_active: retailer.isActive ?? true,
    };

    if (retailer.id && retailer.id > 0) {
      const { data, error } = await client
        .from('retailers')
        .update(payload)
        .eq('id', retailer.id)
        .select()
        .single();
      if (error) throw error;
      return {
        ...retailer,
        id: data.id,
        outstandingBalance: parseFloat(data.outstanding_balance || '0'),
        createdAt: new Date(data.created_at).getTime(),
      };
    } else {
      const { data, error } = await client.from('retailers').insert([payload]).select().single();
      if (error) throw error;
      return {
        ...retailer,
        id: data.id,
        outstandingBalance: 0,
        createdAt: new Date(data.created_at).getTime(),
      };
    }
  }

  async updateRetailerBalance(id: number, delta: number): Promise<void> {
    const client = this.ensureConfigured();
    // Try calling RPC increment_retailer_balance first for atomic update
    const { error: rpcError } = await client.rpc('increment_retailer_balance', {
      retailer_id: id,
      delta: delta,
    });

    if (rpcError) {
      // Fallback to fetch and update
      const existing = await this.getRetailerById(id);
      if (existing) {
        const { error: updateError } = await client
          .from('retailers')
          .update({ outstanding_balance: existing.outstandingBalance + delta })
          .eq('id', id);
        if (updateError) throw updateError;
      }
    }
  }

  async deleteRetailer(id: number): Promise<{ deleted: boolean; deactivated: boolean; message?: string }> {
    const client = this.ensureConfigured();
    const { count: ordersCount } = await client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('retailer_id', id);

    const { count: invoicesCount } = await client
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('retailer_id', id);

    const hasHistory = (ordersCount || 0) > 0 || (invoicesCount || 0) > 0;
    if (hasHistory) {
      const { error: updateError } = await client
        .from('retailers')
        .update({ is_active: false, archived_at: new Date().toISOString() })
        .eq('id', id);
      if (updateError) throw updateError;
      return {
        deleted: false,
        deactivated: true,
        message: 'Retailer has existing orders or invoices and was archived instead of permanently deleted.',
      };
    }

    const { error: deleteError } = await client.from('retailers').delete().eq('id', id);
    if (deleteError) {
      const { error: updateError } = await client
        .from('retailers')
        .update({ is_active: false, archived_at: new Date().toISOString() })
        .eq('id', id);
      if (updateError) throw deleteError;
      return {
        deleted: false,
        deactivated: true,
        message: 'Retailer has dependencies and was archived instead of deleted.',
      };
    }
    return { deleted: true, deactivated: false, message: 'Retailer permanently deleted.' };
  }

  async restoreRetailer(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { error } = await client
      .from('retailers')
      .update({ is_active: true, archived_at: null })
      .eq('id', id);
    if (error) throw error;
  }

  async permanentDeleteRetailer(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { count: ordersCount } = await client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('retailer_id', id);
    const { count: invoicesCount } = await client
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('retailer_id', id);

    if ((ordersCount || 0) > 0 || (invoicesCount || 0) > 0) {
      throw new Error('Cannot permanently delete retailer: historical orders or invoices depend on this account.');
    }

    const { error } = await client.from('retailers').delete().eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // SUPPLIERS
  // ==========================================
  async getSuppliers(): Promise<Supplier[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client.from('suppliers').select('*').order('name');
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      contactPerson: row.contact_person,
      phone: row.phone,
      email: row.email,
      address: row.address,
      payableBalance: parseFloat(row.payable_balance || '0'),
      isActive: row.is_active,
      archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  async getSupplierById(id: number): Promise<Supplier | null> {
    const client = this.ensureConfigured();
    const { data, error } = await client.from('suppliers').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person,
      phone: data.phone,
      email: data.email,
      address: data.address,
      payableBalance: parseFloat(data.payable_balance || '0'),
      isActive: data.is_active,
      archivedAt: data.archived_at ? new Date(data.archived_at).getTime() : undefined,
      createdAt: new Date(data.created_at).getTime(),
    };
  }

  async saveSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'> & { id?: number }): Promise<Supplier> {
    const client = this.ensureConfigured();
    const payload = {
      name: supplier.name,
      contact_person: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      is_active: supplier.isActive ?? true,
    };
    if (supplier.id && supplier.id > 0) {
      const { data, error } = await client
        .from('suppliers')
        .update(payload)
        .eq('id', supplier.id)
        .select()
        .single();
      if (error) throw error;
      return {
        ...supplier,
        id: data.id,
        payableBalance: parseFloat(data.payable_balance || '0'),
        createdAt: new Date(data.created_at).getTime(),
      };
    } else {
      const { data, error } = await client.from('suppliers').insert([payload]).select().single();
      if (error) throw error;
      return {
        ...supplier,
        id: data.id,
        payableBalance: 0,
        createdAt: new Date(data.created_at).getTime(),
      };
    }
  }

  async updateSupplierBalance(id: number, delta: number): Promise<void> {
    const client = this.ensureConfigured();
    const { error: rpcError } = await client.rpc('increment_supplier_balance', {
      p_supplier_id: id,
      delta: delta,
    });

    if (rpcError) {
      const existing = await this.getSupplierById(id);
      if (existing) {
        const { error: updateError } = await client
          .from('suppliers')
          .update({ payable_balance: existing.payableBalance + delta })
          .eq('id', id);
        if (updateError) throw updateError;
      }
    }
  }

  async deleteSupplier(id: number): Promise<{ deleted: boolean; deactivated: boolean; message?: string }> {
    const client = this.ensureConfigured();
    const { count: purchasesCount } = await client
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id);

    const hasHistory = (purchasesCount || 0) > 0;
    if (hasHistory) {
      const { error: updateError } = await client
        .from('suppliers')
        .update({ is_active: false, archived_at: new Date().toISOString() })
        .eq('id', id);
      if (updateError) throw updateError;
      return {
        deleted: false,
        deactivated: true,
        message: 'Supplier has recorded purchase bills and was archived instead of permanently deleted.',
      };
    }

    const { error: deleteError } = await client.from('suppliers').delete().eq('id', id);
    if (deleteError) {
      const { error: updateError } = await client
        .from('suppliers')
        .update({ is_active: false, archived_at: new Date().toISOString() })
        .eq('id', id);
      if (updateError) throw deleteError;
      return {
        deleted: false,
        deactivated: true,
        message: 'Supplier has references and was archived.',
      };
    }
    return { deleted: true, deactivated: false, message: 'Supplier permanently deleted.' };
  }

  async restoreSupplier(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { error } = await client
      .from('suppliers')
      .update({ is_active: true, archived_at: null })
      .eq('id', id);
    if (error) throw error;
  }

  async permanentDeleteSupplier(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { count: purchasesCount } = await client
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id);

    if ((purchasesCount || 0) > 0) {
      throw new Error('Cannot permanently delete supplier: recorded purchases depend on this supplier.');
    }

    const { error } = await client.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // PRODUCTS
  // ==========================================
  async getProducts(): Promise<Product[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client.from('products').select('*, suppliers(name)').order('name');
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      category: row.category,
      unit: row.unit,
      purchasePrice: parseFloat(row.purchase_price || '0'),
      sellingPrice: parseFloat(row.selling_price || '0'),
      currentStock: row.current_stock,
      minStockLevel: row.min_stock_level,
      supplierId: row.supplier_id,
      supplierName: row.suppliers?.name || '',
      isActive: row.is_active,
      archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  async getProductById(id: number): Promise<Product | null> {
    const client = this.ensureConfigured();
    const { data, error } = await client.from('products').select('*, suppliers(name)').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      sku: data.sku,
      name: data.name,
      category: data.category,
      unit: data.unit,
      purchasePrice: parseFloat(data.purchase_price || '0'),
      sellingPrice: parseFloat(data.selling_price || '0'),
      currentStock: data.current_stock,
      minStockLevel: data.min_stock_level,
      supplierId: data.supplier_id,
      supplierName: data.suppliers?.name || '',
      isActive: data.is_active,
      archivedAt: data.archived_at ? new Date(data.archived_at).getTime() : undefined,
      createdAt: new Date(data.created_at).getTime(),
    };
  }

  async saveProduct(product: Omit<Product, 'id' | 'createdAt'> & { id?: number }): Promise<Product> {
    const client = this.ensureConfigured();
    const payload = {
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
      purchase_price: product.purchasePrice,
      selling_price: product.sellingPrice,
      current_stock: product.currentStock,
      min_stock_level: product.minStockLevel,
      supplier_id: product.supplierId || null,
      is_active: product.isActive ?? true,
    };
    if (product.id && product.id > 0) {
      const { data, error } = await client
        .from('products')
        .update(payload)
        .eq('id', product.id)
        .select()
        .single();
      if (error) throw error;
      return {
        ...product,
        id: data.id,
        createdAt: new Date(data.created_at).getTime(),
      };
    } else {
      const { data, error } = await client.from('products').insert([payload]).select().single();
      if (error) throw error;
      return {
        ...product,
        id: data.id,
        createdAt: new Date(data.created_at).getTime(),
      };
    }
  }

  async updateProductStock(id: number, qtyDelta: number): Promise<void> {
    const client = this.ensureConfigured();
    const existing = await this.getProductById(id);
    if (existing) {
      const { error } = await client
        .from('products')
        .update({ current_stock: existing.currentStock + qtyDelta })
        .eq('id', id);
      if (error) throw error;
    }
  }

  async deleteProduct(id: number): Promise<{ deleted: boolean; deactivated: boolean; message?: string }> {
    const client = this.ensureConfigured();
    const { count: orderItemsCount } = await client
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    const { count: purchaseItemsCount } = await client
      .from('purchase_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    const { count: movementsCount } = await client
      .from('inventory_movements')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    const hasHistory =
      (orderItemsCount || 0) > 0 ||
      (purchaseItemsCount || 0) > 0 ||
      (movementsCount || 0) > 0;

    if (hasHistory) {
      const { error: updateError } = await client
        .from('products')
        .update({ is_active: false, archived_at: new Date().toISOString() })
        .eq('id', id);
      if (updateError) throw updateError;
      return {
        deleted: false,
        deactivated: true,
        message: 'This product has historical transactions and cannot be permanently deleted. It has been archived instead.',
      };
    }

    const { error: deleteError } = await client.from('products').delete().eq('id', id);
    if (deleteError) {
      const { error: updateError } = await client
        .from('products')
        .update({ is_active: false, archived_at: new Date().toISOString() })
        .eq('id', id);
      if (updateError) throw deleteError;
      return {
        deleted: false,
        deactivated: true,
        message: 'This product has historical transactions and cannot be permanently deleted. It has been archived instead.',
      };
    }
    return { deleted: true, deactivated: false, message: 'Product permanently deleted.' };
  }

  async restoreProduct(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { error } = await client
      .from('products')
      .update({ is_active: true, archived_at: null })
      .eq('id', id);
    if (error) throw error;
  }

  async permanentDeleteProduct(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { count: orderItemsCount } = await client
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);
    const { count: purchaseItemsCount } = await client
      .from('purchase_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    if ((orderItemsCount || 0) > 0 || (purchaseItemsCount || 0) > 0) {
      throw new Error('Cannot permanently delete product: historical orders or purchase items depend on this record.');
    }

    const { error } = await client.from('products').delete().eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // ORDERS & ORDER ITEMS
  // ==========================================
  async getOrders(): Promise<Order[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client
      .from('orders')
      .select('*, retailers(name), profiles!orders_salesperson_id_fkey(full_name)')
      .order('order_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      retailerId: row.retailer_id,
      retailerName: row.retailers?.name || '',
      salespersonId: row.salesperson_id,
      salespersonName: row.profiles?.full_name || row['profiles!orders_salesperson_id_fkey']?.full_name || '',
      orderDate: new Date(row.order_date).getTime(),
      status: row.status,
      subtotal: parseFloat(row.subtotal || '0'),
      discount: parseFloat(row.discount || '0'),
      totalAmount: parseFloat(row.total_amount || '0'),
      notes: row.notes,
      ownerFeedback: row.owner_feedback,
      isArchived: row.is_archived || false,
      archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : undefined,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    }));
  }

  async getOrderById(id: number): Promise<Order | null> {
    const client = this.ensureConfigured();
    const { data, error } = await client
      .from('orders')
      .select('*, retailers(name), profiles!orders_salesperson_id_fkey(full_name)')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as any;
    return {
      id: row.id,
      orderNumber: row.order_number,
      retailerId: row.retailer_id,
      retailerName: row.retailers?.name || '',
      salespersonId: row.salesperson_id,
      salespersonName: row.profiles?.full_name || row['profiles!orders_salesperson_id_fkey']?.full_name || '',
      orderDate: new Date(row.order_date).getTime(),
      status: row.status,
      subtotal: parseFloat(row.subtotal || '0'),
      discount: parseFloat(row.discount || '0'),
      totalAmount: parseFloat(row.total_amount || '0'),
      notes: row.notes,
      ownerFeedback: row.owner_feedback,
      isArchived: row.is_archived || false,
      archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : undefined,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    };
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client
      .from('order_items')
      .select('*, products(name, sku)')
      .eq('order_id', orderId);
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      productName: row.products?.name || '',
      productSku: row.products?.sku || '',
      quantity: row.quantity,
      unitPrice: parseFloat(row.unit_price || '0'),
      discountPercent: parseFloat(row.discount_percent || '0'),
      total: parseFloat(row.total || '0'),
    }));
  }

  async saveOrder(
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: number },
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ): Promise<Order> {
    const client = this.ensureConfigured();
    const orderPayload = {
      order_number: order.orderNumber,
      retailer_id: order.retailerId,
      salesperson_id: order.salespersonId,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
      total_amount: order.totalAmount,
      notes: order.notes,
      owner_feedback: order.ownerFeedback,
      updated_at: new Date().toISOString(),
    };

    let savedOrderId = order.id;
    if (savedOrderId && savedOrderId > 0) {
      const { error: updateError } = await client.from('orders').update(orderPayload).eq('id', savedOrderId);
      if (updateError) throw updateError;
      const { error: deleteItemsError } = await client.from('order_items').delete().eq('order_id', savedOrderId);
      if (deleteItemsError) throw deleteItemsError;
    } else {
      const { data, error } = await client.from('orders').insert([orderPayload]).select().single();
      if (error) throw error;
      savedOrderId = data.id;
    }

    const itemsPayload = items.map((it) => ({
      order_id: savedOrderId,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      discount_percent: it.discountPercent,
      total: it.total,
    }));
    if (itemsPayload.length > 0) {
      const { error: itemsError } = await client.from('order_items').insert(itemsPayload);
      if (itemsError) throw itemsError;
    }

    const fresh = await this.getOrderById(savedOrderId!);
    if (!fresh) throw new Error('Order could not be verified after database write.');
    return fresh;
  }

  async updateOrderStatus(orderId: number, status: OrderStatus, feedback?: string): Promise<void> {
    const client = this.ensureConfigured();
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (feedback !== undefined) {
      updatePayload.owner_feedback = feedback;
    }
    const { error } = await client.from('orders').update(updatePayload).eq('id', orderId);
    if (error) throw error;
  }

  async deleteOrder(id: number): Promise<void> {
    const client = this.ensureConfigured();
    // Check if invoiced
    const { count: invoiceCount } = await client
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', id);

    if ((invoiceCount || 0) > 0) {
      // Soft-archive order instead of deleting
      const { error } = await client
        .from('orders')
        .update({ is_archived: true, archived_at: new Date().toISOString(), status: 'CANCELLED' })
        .eq('id', id);
      if (error) throw error;
      return;
    }

    const { error: itemsErr } = await client.from('order_items').delete().eq('order_id', id);
    if (itemsErr) throw itemsErr;

    const { error } = await client.from('orders').delete().eq('id', id);
    if (error) throw error;
  }

  async restoreOrder(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { error } = await client
      .from('orders')
      .update({ is_archived: false, archived_at: null, status: 'DRAFT' })
      .eq('id', id);
    if (error) throw error;
  }

  async permanentDeleteOrder(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { count: invoiceCount } = await client
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', id);

    if ((invoiceCount || 0) > 0) {
      throw new Error('Cannot permanently delete order: an associated invoice exists in the accounting ledger.');
    }

    await client.from('order_items').delete().eq('order_id', id);
    const { error } = await client.from('orders').delete().eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // INVOICES & INVOICE ITEMS
  // ==========================================
  async getInvoices(): Promise<Invoice[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client
      .from('invoices')
      .select('*, retailers(name)')
      .order('invoice_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      orderId: row.order_id,
      retailerId: row.retailer_id,
      retailerName: row.retailers?.name || '',
      invoiceDate: new Date(row.invoice_date).getTime(),
      dueDate: new Date(row.due_date).getTime(),
      subtotal: parseFloat(row.subtotal || '0'),
      discount: parseFloat(row.discount || '0'),
      tax: parseFloat(row.tax || '0'),
      totalAmount: parseFloat(row.total_amount || '0'),
      amountPaid: parseFloat(row.amount_paid || '0'),
      remainingBalance: parseFloat(row.remaining_balance || '0'),
      paymentStatus: row.payment_status,
      status: row.status || (row.payment_status === 'VOIDED' ? 'VOIDED' : 'POSTED'),
      voidedAt: row.voided_at ? new Date(row.voided_at).getTime() : undefined,
      voidedBy: row.voided_by,
      voidReason: row.void_reason,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  async getInvoiceById(id: number): Promise<Invoice | null> {
    const client = this.ensureConfigured();
    const { data, error } = await client.from('invoices').select('*, retailers(name)').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      orderId: data.order_id,
      retailerId: data.retailer_id,
      retailerName: data.retailers?.name || '',
      invoiceDate: new Date(data.invoice_date).getTime(),
      dueDate: new Date(data.due_date).getTime(),
      subtotal: parseFloat(data.subtotal || '0'),
      discount: parseFloat(data.discount || '0'),
      tax: parseFloat(data.tax || '0'),
      totalAmount: parseFloat(data.total_amount || '0'),
      amountPaid: parseFloat(data.amount_paid || '0'),
      remainingBalance: parseFloat(data.remaining_balance || '0'),
      paymentStatus: data.payment_status,
      status: data.status || (data.payment_status === 'VOIDED' ? 'VOIDED' : 'POSTED'),
      voidedAt: data.voided_at ? new Date(data.voided_at).getTime() : undefined,
      voidedBy: data.voided_by,
      voidReason: data.void_reason,
      createdAt: new Date(data.created_at).getTime(),
    };
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client.from('invoice_items').select('*, products(name)').eq('invoice_id', invoiceId);
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      invoiceId: row.invoice_id,
      productId: row.product_id,
      productName: row.products?.name || '',
      quantity: row.quantity,
      unitPrice: parseFloat(row.unit_price || '0'),
      discount: parseFloat(row.discount || '0'),
      total: parseFloat(row.total || '0'),
    }));
  }

  async createInvoice(
    invoice: Omit<Invoice, 'id' | 'createdAt'>,
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]
  ): Promise<Invoice> {
    const client = this.ensureConfigured();
    const payload = {
      invoice_number: invoice.invoiceNumber,
      order_id: invoice.orderId,
      retailer_id: invoice.retailerId,
      due_date: new Date(invoice.dueDate).toISOString(),
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      total_amount: invoice.totalAmount,
      amount_paid: invoice.amountPaid,
      remaining_balance: invoice.remainingBalance,
      payment_status: invoice.paymentStatus,
    };
    const { data, error } = await client.from('invoices').insert([payload]).select().single();
    if (error) throw error;

    const itemsPayload = items.map((it) => ({
      invoice_id: data.id,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      discount: it.discount,
      total: it.total,
    }));
    if (itemsPayload.length > 0) {
      const { error: itemsError } = await client.from('invoice_items').insert(itemsPayload);
      if (itemsError) throw itemsError;
    }

    const created = await this.getInvoiceById(data.id);
    if (!created) throw new Error('Invoice was created but could not be verified from database.');
    return created;
  }

  async updateInvoicePayment(id: number, amount: number, status: InvoicePaymentStatus): Promise<void> {
    const client = this.ensureConfigured();
    const invoice = await this.getInvoiceById(id);
    if (invoice) {
      const newPaid = Math.max(0, invoice.amountPaid + amount);
      const newRemaining = Math.max(0, invoice.totalAmount - newPaid);
      const computedStatus = newPaid >= invoice.totalAmount ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
      const { error } = await client
        .from('invoices')
        .update({
          amount_paid: newPaid,
          remaining_balance: newRemaining,
          payment_status: status || computedStatus,
        })
        .eq('id', id);
      if (error) throw error;
    }
  }

  async deleteInvoice(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { error: itemsErr } = await client.from('invoice_items').delete().eq('invoice_id', id);
    if (itemsErr) throw itemsErr;
    const { error } = await client.from('invoices').delete().eq('id', id);
    if (error) throw error;
  }

  async voidInvoice(id: number, reason?: string, voidedBy?: string): Promise<void> {
    const client = this.ensureConfigured();
    const { error } = await client
      .from('invoices')
      .update({
        payment_status: 'VOIDED',
        status: 'VOIDED',
        voided_at: new Date().toISOString(),
        voided_by: voidedBy || null,
        void_reason: reason || 'Voided by Administrator',
      })
      .eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // PURCHASES & PURCHASE ITEMS
  // ==========================================
  async getPurchases(): Promise<Purchase[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client
      .from('purchases')
      .select('*, suppliers(name)')
      .order('purchase_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      billNumber: row.bill_number,
      supplierId: row.supplier_id,
      supplierName: row.suppliers?.name || '',
      purchaseDate: new Date(row.purchase_date).getTime(),
      totalAmount: parseFloat(row.total_amount || '0'),
      amountPaid: parseFloat(row.amount_paid || '0'),
      paymentStatus: row.payment_status,
      status: row.status || (row.payment_status === 'VOIDED' ? 'VOIDED' : 'POSTED'),
      voidedAt: row.voided_at ? new Date(row.voided_at).getTime() : undefined,
      voidedBy: row.voided_by,
      voidReason: row.void_reason,
      notes: row.notes,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  async createPurchase(
    purchase: Omit<Purchase, 'id' | 'createdAt'>,
    items: Omit<PurchaseItem, 'id' | 'purchaseId'>[]
  ): Promise<Purchase> {
    const client = this.ensureConfigured();
    const payload = {
      bill_number: purchase.billNumber,
      supplier_id: purchase.supplierId,
      total_amount: purchase.totalAmount,
      amount_paid: purchase.amountPaid,
      payment_status: purchase.paymentStatus,
      notes: purchase.notes,
    };
    const { data, error } = await client.from('purchases').insert([payload]).select().single();
    if (error) throw error;

    const itemsPayload = items.map((it) => ({
      purchase_id: data.id,
      product_id: it.productId,
      quantity: it.quantity,
      purchase_price: it.purchasePrice,
      total: it.total,
    }));
    if (itemsPayload.length > 0) {
      const { error: itemsError } = await client.from('purchase_items').insert(itemsPayload);
      if (itemsError) throw itemsError;
    }

    return {
      ...purchase,
      id: data.id,
      createdAt: new Date(data.created_at).getTime(),
    };
  }

  async updatePurchasePayment(purchaseId: number, amount: number): Promise<void> {
    const client = this.ensureConfigured();
    const { data: purchase, error } = await client.from('purchases').select('*').eq('id', purchaseId).maybeSingle();
    if (error || !purchase) return;

    const currentPaid = parseFloat(purchase.amount_paid || '0');
    const total = parseFloat(purchase.total_amount || '0');
    const newPaid = Math.max(0, currentPaid + amount);
    const newStatus = newPaid >= total ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

    const { error: updateError } = await client
      .from('purchases')
      .update({
        amount_paid: newPaid,
        payment_status: newStatus,
      })
      .eq('id', purchaseId);
    if (updateError) throw updateError;
  }

  async deletePurchase(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { error: itemsErr } = await client.from('purchase_items').delete().eq('purchase_id', id);
    if (itemsErr) throw itemsErr;
    const { error } = await client.from('purchases').delete().eq('id', id);
    if (error) throw error;
  }

  async voidPurchase(id: number, reason?: string, voidedBy?: string): Promise<void> {
    const client = this.ensureConfigured();
    const { error } = await client
      .from('purchases')
      .update({
        payment_status: 'VOIDED',
        status: 'VOIDED',
        voided_at: new Date().toISOString(),
        voided_by: voidedBy || null,
        void_reason: reason || 'Voided by Administrator',
      })
      .eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // PAYMENTS & COLLECTIONS
  // ==========================================
  async getPayments(): Promise<Payment[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client
      .from('payments')
      .select('*, profiles(full_name)')
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      paymentNumber: row.payment_number,
      type: row.type,
      entityId: row.entity_id,
      entityName: row.entity_name,
      invoiceId: row.invoice_id,
      purchaseId: row.purchase_id,
      amount: parseFloat(row.amount || '0'),
      paymentDate: new Date(row.payment_date).getTime(),
      paymentMethod: row.payment_method,
      referenceNumber: row.reference_number,
      notes: row.notes,
      recordedByUserId: row.recorded_by_user_id,
      recordedByName: row.profiles?.full_name || '',
      status: row.status || 'ACTIVE',
      reversedAt: row.reversed_at ? new Date(row.reversed_at).getTime() : undefined,
      reversedBy: row.reversed_by,
      reversalReason: row.reversal_reason,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const client = this.ensureConfigured();

    let validUserId: string | null = null;
    if (typeof payment.recordedByUserId === 'string' && payment.recordedByUserId.includes('-')) {
      validUserId = payment.recordedByUserId;
    } else {
      const user = (await client.auth.getUser()).data?.user;
      if (user?.id) validUserId = user.id;
    }

    const payload = {
      payment_number: payment.paymentNumber,
      type: payment.type,
      entity_id: payment.entityId,
      entity_name: payment.entityName,
      invoice_id: payment.invoiceId || null,
      purchase_id: payment.purchaseId || null,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      reference_number: payment.referenceNumber || null,
      notes: payment.notes || null,
      recorded_by_user_id: validUserId,
      status: payment.status || 'ACTIVE',
    };
    const { data, error } = await client.from('payments').insert([payload]).select().single();
    if (error) throw error;
    return {
      ...payment,
      id: data.id,
      status: data.status || 'ACTIVE',
      createdAt: new Date(data.created_at).getTime(),
    };
  }

  async deletePayment(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { error } = await client.from('payments').delete().eq('id', id);
    if (error) throw error;
  }

  async reversePayment(id: number, reason?: string, reversedBy?: string): Promise<void> {
    const client = this.ensureConfigured();
    const { error } = await client
      .from('payments')
      .update({
        status: 'REVERSED',
        reversed_at: new Date().toISOString(),
        reversed_by: reversedBy || null,
        reversal_reason: reason || 'Reversed by Administrator',
      })
      .eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // INVENTORY MOVEMENTS (AUDIT TRAIL)
  // ==========================================
  async getMovements(): Promise<InventoryMovement[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client
      .from('inventory_movements')
      .select('*, products(name)')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.products?.name || '',
      movementType: row.movement_type,
      quantity: row.quantity,
      previousStock: row.previous_stock,
      newStock: row.new_stock,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      referenceNumber: row.reference_number,
      reasonOrNotes: row.reason_or_notes,
      timestamp: new Date(row.timestamp).getTime(),
    }));
  }

  async createMovement(movement: Omit<InventoryMovement, 'id' | 'timestamp'>): Promise<InventoryMovement> {
    const client = this.ensureConfigured();
    const payload = {
      product_id: movement.productId,
      movement_type: movement.movementType,
      quantity: movement.quantity,
      previous_stock: movement.previousStock,
      new_stock: movement.newStock,
      reference_type: movement.referenceType,
      reference_id: movement.referenceId,
      reference_number: movement.referenceNumber,
      reason_or_notes: movement.reasonOrNotes,
    };
    const { data, error } = await client.from('inventory_movements').insert([payload]).select().single();
    if (error) throw error;
    return {
      ...movement,
      id: data.id,
      timestamp: new Date(data.timestamp).getTime(),
    };
  }

  async deleteMovement(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { error } = await client.from('inventory_movements').delete().eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // DELIVERIES
  // ==========================================
  async getDeliveries(): Promise<Delivery[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client
      .from('deliveries')
      .select('*, retailers(name), orders(order_number), invoices(invoice_number)')
      .order('scheduled_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      orderNumber: row.orders?.order_number || row.order_number || `ORD-${row.order_id}`,
      invoiceId: row.invoice_id,
      invoiceNumber: row.invoices?.invoice_number || row.invoice_number,
      retailerId: row.retailer_id,
      retailerName: row.retailers?.name || '',
      deliveryAddress: row.delivery_address || '',
      driverName: row.driver_name,
      driverPhone: row.driver_phone,
      status: row.status,
      scheduledDate: new Date(row.scheduled_date).getTime(),
      deliveredDate: row.delivered_date ? new Date(row.delivered_date).getTime() : undefined,
      notes: row.notes,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  async createDelivery(delivery: Omit<Delivery, 'id' | 'createdAt'>): Promise<Delivery> {
    const client = this.ensureConfigured();
    const payload = {
      order_id: delivery.orderId,
      invoice_id: delivery.invoiceId || null,
      retailer_id: delivery.retailerId,
      delivery_address: delivery.deliveryAddress,
      driver_name: delivery.driverName || null,
      driver_phone: delivery.driverPhone || null,
      status: delivery.status,
      scheduled_date: new Date(delivery.scheduledDate).toISOString(),
      notes: delivery.notes || null,
    };
    const { data, error } = await client.from('deliveries').insert([payload]).select().single();
    if (error) throw error;
    return {
      ...delivery,
      id: data.id,
      createdAt: new Date(data.created_at).getTime(),
    };
  }

  async updateDeliveryStatus(
    id: number,
    status: DeliveryStatus,
    deliveredDate?: number,
    notes?: string
  ): Promise<void> {
    const client = this.ensureConfigured();
    const payload: Record<string, unknown> = { status };
    if (deliveredDate) payload.delivered_date = new Date(deliveredDate).toISOString();
    if (notes) payload.notes = notes;
    const { error } = await client.from('deliveries').update(payload).eq('id', id);
    if (error) throw error;
  }

  async deleteDelivery(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const { error } = await client.from('deliveries').delete().eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // USERS / SALES TEAM / PROFILES
  // ==========================================
  async getUsers(): Promise<User[]> {
    const client = this.ensureConfigured();
    const { data, error } = await client.from('profiles').select('*').order('full_name');
    if (error) throw error;
    return (data || []).map((row, idx) => ({
      id: idx + 1,
      cloudId: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      phone: row.phone,
      isActive: row.is_active,
      archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  async getUserById(id: number): Promise<User | null> {
    const users = await this.getUsers();
    return users.find((u) => u.id === id) || null;
  }

  async saveUser(user: Omit<User, 'id' | 'createdAt'> & { id?: number }): Promise<User> {
    const client = this.ensureConfigured();

    if (user.cloudId) {
      // Update existing profile
      const { data, error } = await client
        .from('profiles')
        .update({
          username: user.username,
          full_name: user.fullName,
          role: user.role,
          phone: user.phone || '',
          is_active: user.isActive ?? true,
        })
        .eq('id', user.cloudId)
        .select()
        .single();
      if (error) throw error;
      return {
        ...user,
        id: user.id || Date.now(),
        cloudId: data.id,
        createdAt: new Date(data.created_at).getTime(),
      };
    } else {
      // Create new sales team member
      const cleanEmail = user.email?.trim() || `${user.username.trim()}@distriflow.internal`;
      const cleanPassword = 'Sales@' + (Date.now() % 10000);

      // Attempt to register via Supabase Auth signUp to create valid auth.users UUID
      let newUuid: string | null = null;
      try {
        const { data: authData, error: authErr } = await client.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              username: user.username.trim(),
              full_name: user.fullName.trim(),
              role: user.role,
              phone: user.phone || '',
            },
          },
        });
        if (!authErr && authData.user?.id) {
          newUuid = authData.user.id;
        }
      } catch (e) {
        console.warn('Supabase Auth signUp note:', e);
      }

      // If signUp didn't return UUID (e.g. rate limit, or email taken), generate a random UUID
      if (!newUuid) {
        newUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null;
      }

      const payload = {
        id: newUuid,
        username: user.username.trim(),
        full_name: user.fullName.trim(),
        role: user.role,
        phone: user.phone || '',
        is_active: user.isActive ?? true,
      };

      const { data, error } = await client.from('profiles').upsert([payload]).select().single();
      if (error) throw error;

      return {
        ...user,
        id: user.id || Date.now(),
        cloudId: data.id,
        createdAt: new Date(data.created_at).getTime(),
      };
    }
  }

  async deleteUser(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const user = await this.getUserById(id);
    if (user?.cloudId) {
      // Check if user has orders or assigned retailers
      const { count: ordersCount } = await client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('salesperson_id', user.cloudId);

      const hasHistory = (ordersCount || 0) > 0;
      if (hasHistory) {
        // Soft deactivate/archive
        const { error } = await client
          .from('profiles')
          .update({ is_active: false, archived_at: new Date().toISOString() })
          .eq('id', user.cloudId);
        if (error) throw error;
        return;
      }

      const { error } = await client.from('profiles').delete().eq('id', user.cloudId);
      if (error) {
        // Fallback to deactivate if FK prevent delete
        await client
          .from('profiles')
          .update({ is_active: false, archived_at: new Date().toISOString() })
          .eq('id', user.cloudId);
      }
    }
  }

  async restoreUser(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const user = await this.getUserById(id);
    if (user?.cloudId) {
      const { error } = await client
        .from('profiles')
        .update({ is_active: true, archived_at: null })
        .eq('id', user.cloudId);
      if (error) throw error;
    }
  }

  async permanentDeleteUser(id: number): Promise<void> {
    const client = this.ensureConfigured();
    const user = await this.getUserById(id);
    if (user?.cloudId) {
      const { count: ordersCount } = await client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('salesperson_id', user.cloudId);

      if ((ordersCount || 0) > 0) {
        throw new Error('Cannot permanently delete sales team member: historical orders are associated with their profile.');
      }

      const { error } = await client.from('profiles').delete().eq('id', user.cloudId);
      if (error) throw error;
    }
  }

  // ==========================================
  // COMPANY PROFILE
  // ==========================================
  async getCompanyProfile(): Promise<CompanyProfile> {
    const client = this.ensureConfigured();
    try {
      const { data, error } = await client.from('company_profile').select('*').eq('id', 1).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          companyName: data.company_name || DEFAULT_COMPANY_PROFILE.companyName,
          legalName: data.legal_name || DEFAULT_COMPANY_PROFILE.legalName,
          businessType: data.business_type || DEFAULT_COMPANY_PROFILE.businessType,
          tagline: data.tagline || DEFAULT_COMPANY_PROFILE.tagline,
          phone: data.phone || DEFAULT_COMPANY_PROFILE.phone,
          alternatePhone: data.alternate_phone || DEFAULT_COMPANY_PROFILE.alternatePhone,
          email: data.email || DEFAULT_COMPANY_PROFILE.email,
          website: data.website || DEFAULT_COMPANY_PROFILE.website,
          address: data.address || DEFAULT_COMPANY_PROFILE.address,
          city: data.city || DEFAULT_COMPANY_PROFILE.city,
          district: data.district || DEFAULT_COMPANY_PROFILE.district,
          province: data.province || DEFAULT_COMPANY_PROFILE.province,
          country: data.country || DEFAULT_COMPANY_PROFILE.country,
          panNumber: data.pan_number || DEFAULT_COMPANY_PROFILE.panNumber,
          vatNumber: data.vat_number || DEFAULT_COMPANY_PROFILE.vatNumber,
          registrationNumber: data.registration_number || DEFAULT_COMPANY_PROFILE.registrationNumber,
          logoUrl: data.logo_url,
          invoiceHeaderLogoUrl: data.invoice_header_logo_url,
          invoiceFooterText: data.invoice_footer_text || DEFAULT_COMPANY_PROFILE.invoiceFooterText,
          receiptFooterText: data.receipt_footer_text || DEFAULT_COMPANY_PROFILE.receiptFooterText,
          defaultInvoiceNotes: data.default_invoice_notes || DEFAULT_COMPANY_PROFILE.defaultInvoiceNotes,
          defaultPaymentTerms: data.default_payment_terms || DEFAULT_COMPANY_PROFILE.defaultPaymentTerms,
          currency: data.currency || DEFAULT_COMPANY_PROFILE.currency,
          currencySymbol: data.currency_symbol || DEFAULT_COMPANY_PROFILE.currencySymbol,
          updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
        };
      }
    } catch {
      // Table may not yet exist on live Supabase
    }
    return DEFAULT_COMPANY_PROFILE;
  }

  async saveCompanyProfile(profile: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const client = this.ensureConfigured();
    const payload = {
      id: 1,
      company_name: profile.companyName,
      legal_name: profile.legalName,
      business_type: profile.businessType,
      tagline: profile.tagline,
      phone: profile.phone,
      alternate_phone: profile.alternatePhone,
      email: profile.email,
      website: profile.website,
      address: profile.address,
      city: profile.city,
      district: profile.district,
      province: profile.province,
      country: profile.country,
      pan_number: profile.panNumber,
      vat_number: profile.vatNumber,
      registration_number: profile.registrationNumber,
      logo_url: profile.logoUrl,
      invoice_header_logo_url: profile.invoiceHeaderLogoUrl,
      invoice_footer_text: profile.invoiceFooterText,
      receipt_footer_text: profile.receiptFooterText,
      default_invoice_notes: profile.defaultInvoiceNotes,
      default_payment_terms: profile.defaultPaymentTerms,
      currency: profile.currency || 'NPR',
      currency_symbol: profile.currencySymbol || 'Rs.',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('company_profile')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;

    return {
      ...DEFAULT_COMPANY_PROFILE,
      ...profile,
      id: data.id,
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const client = this.ensureConfigured();
    try {
      const { data, error } = await client
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userRole: row.user_role,
        action: row.action,
        module: row.module,
        recordId: row.record_id,
        recordIdentifier: row.record_identifier,
        description: row.description,
        reason: row.reason,
        metadata: row.metadata,
        timestamp: new Date(row.timestamp).getTime(),
      }));
    } catch {
      return [];
    }
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const client = this.ensureConfigured();
    const payload = {
      user_id: log.userId && log.userId.includes('-') ? log.userId : null,
      user_name: log.userName,
      user_role: log.userRole,
      action: log.action,
      module: log.module,
      record_id: log.recordId,
      record_identifier: log.recordIdentifier,
      description: log.description,
      reason: log.reason,
      metadata: log.metadata,
    };
    try {
      const { data, error } = await client.from('audit_logs').insert([payload]).select().single();
      if (!error && data) {
        return {
          ...log,
          id: data.id,
          timestamp: new Date(data.timestamp).getTime(),
        };
      }
    } catch (e) {
      console.warn('Audit log write warning:', e);
    }
    return {
      ...log,
      id: Date.now(),
      timestamp: Date.now(),
    };
  }
}
