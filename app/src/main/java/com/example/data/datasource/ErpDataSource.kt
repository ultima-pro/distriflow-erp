package com.example.data.datasource

import com.example.data.model.*
import kotlinx.coroutines.flow.Flow

/**
 * Data Source abstraction for all ERP business domain entities.
 * Decouples the business repository layer from database frameworks.
 * Can be implemented by Room (local), Supabase (cloud), or mock sources.
 */
interface ErpDataSource {
    // Retailers
    val allRetailers: Flow<List<Retailer>>
    fun getRetailersBySalesperson(salespersonId: Long): Flow<List<Retailer>>
    suspend fun getRetailerById(id: Long): Retailer?
    fun observeRetailerById(id: Long): Flow<Retailer?>
    suspend fun insertRetailer(retailer: Retailer): Long
    suspend fun updateRetailer(retailer: Retailer)
    suspend fun updateRetailerOutstandingBalance(retailerId: Long, amountDelta: Double)

    // Suppliers
    val allSuppliers: Flow<List<Supplier>>
    suspend fun getSupplierById(id: Long): Supplier?
    fun observeSupplierById(id: Long): Flow<Supplier?>
    suspend fun insertSupplier(supplier: Supplier): Long
    suspend fun updateSupplier(supplier: Supplier)
    suspend fun updateSupplierPayableBalance(supplierId: Long, amountDelta: Double)

    // Products
    val allProducts: Flow<List<Product>>
    val activeProducts: Flow<List<Product>>
    val lowStockProducts: Flow<List<Product>>
    suspend fun getProductById(id: Long): Product?
    fun observeProductById(id: Long): Flow<Product?>
    suspend fun insertProduct(product: Product): Long
    suspend fun updateProduct(product: Product)
    suspend fun updateProductStock(productId: Long, qtyChange: Int)

    // Orders & Items
    val allOrders: Flow<List<Order>>
    fun getOrdersBySalesperson(salespersonId: Long): Flow<List<Order>>
    fun getOrdersByRetailer(retailerId: Long): Flow<List<Order>>
    fun getOrdersByStatus(status: OrderStatus): Flow<List<Order>>
    suspend fun getOrderById(id: Long): Order?
    fun observeOrderById(id: Long): Flow<Order?>
    suspend fun insertOrder(order: Order): Long
    suspend fun updateOrder(order: Order)
    suspend fun updateOrderStatus(orderId: Long, status: OrderStatus, feedback: String, timestamp: Long)

    fun getItemsForOrder(orderId: Long): Flow<List<OrderItem>>
    suspend fun getItemsForOrderSync(orderId: Long): List<OrderItem>
    suspend fun insertOrderItems(items: List<OrderItem>)
    suspend fun deleteItemsForOrder(orderId: Long)

    // Invoices & Items
    val allInvoices: Flow<List<Invoice>>
    fun getInvoicesByRetailer(retailerId: Long): Flow<List<Invoice>>
    suspend fun getInvoiceById(id: Long): Invoice?
    suspend fun getInvoiceByOrderId(orderId: Long): Invoice?
    fun observeInvoiceById(id: Long): Flow<Invoice?>
    suspend fun insertInvoice(invoice: Invoice): Long
    suspend fun updateInvoice(invoice: Invoice)
    suspend fun recordInvoicePayment(invoiceId: Long, amount: Double, status: InvoicePaymentStatus)

    fun getItemsForInvoice(invoiceId: Long): Flow<List<InvoiceItem>>
    suspend fun insertInvoiceItems(items: List<InvoiceItem>)

    // Purchases & Items
    val allPurchases: Flow<List<Purchase>>
    fun getPurchasesBySupplier(supplierId: Long): Flow<List<Purchase>>
    suspend fun getPurchaseById(id: Long): Purchase?
    fun observePurchaseById(id: Long): Flow<Purchase?>
    suspend fun insertPurchase(purchase: Purchase): Long
    suspend fun updatePurchase(purchase: Purchase)
    suspend fun recordPurchasePayment(purchaseId: Long, amount: Double, status: InvoicePaymentStatus)

    fun getItemsForPurchase(purchaseId: Long): Flow<List<PurchaseItem>>
    suspend fun insertPurchaseItems(items: List<PurchaseItem>)

    // Payments
    val allPayments: Flow<List<Payment>>
    fun getPaymentsByType(type: PaymentType): Flow<List<Payment>>
    fun getPaymentsForEntity(entityId: Long, type: PaymentType): Flow<List<Payment>>
    fun getCollectionsBySalesperson(salespersonId: Long): Flow<List<Payment>>
    suspend fun insertPayment(payment: Payment): Long

    // Inventory Movements (Auditable ledger)
    val allInventoryMovements: Flow<List<InventoryMovement>>
    fun getMovementsForProduct(productId: Long): Flow<List<InventoryMovement>>
    suspend fun insertInventoryMovement(movement: InventoryMovement): Long

    // Deliveries
    val allDeliveries: Flow<List<Delivery>>
    fun getDeliveriesByStatus(status: DeliveryStatus): Flow<List<Delivery>>
    suspend fun getDeliveryByOrderId(orderId: Long): Delivery?
    suspend fun getDeliveryById(id: Long): Delivery?
    suspend fun insertDelivery(delivery: Delivery): Long
    suspend fun updateDelivery(delivery: Delivery)
    suspend fun updateDeliveryStatus(deliveryId: Long, status: DeliveryStatus, deliveredDate: Long?, notes: String)

    // User Directory (for business views, assigning reps)
    val allUsers: Flow<List<User>>
    val allSalespersons: Flow<List<User>>
    suspend fun getUserById(id: Long): User?
    suspend fun insertUser(user: User): Long
    suspend fun updateUser(user: User)
}
