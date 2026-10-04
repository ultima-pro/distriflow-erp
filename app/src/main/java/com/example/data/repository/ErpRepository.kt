package com.example.data.repository

import com.example.data.model.*
import kotlinx.coroutines.flow.Flow

/**
 * Domain repository interface for DistriFlow ERP.
 * Defines all business data operations and rules independent of the database engine.
 * ViewModels depend strictly on this interface.
 */
interface ErpRepository {
    // Retailers
    val allRetailers: Flow<List<Retailer>>
    fun getRetailersBySalesperson(salespersonId: Long): Flow<List<Retailer>>
    suspend fun getRetailerById(id: Long): Retailer?
    fun observeRetailerById(id: Long): Flow<Retailer?>
    suspend fun saveRetailer(retailer: Retailer): Long
    suspend fun updateRetailer(retailer: Retailer)

    // Suppliers
    val allSuppliers: Flow<List<Supplier>>
    suspend fun getSupplierById(id: Long): Supplier?
    suspend fun saveSupplier(supplier: Supplier): Long
    suspend fun updateSupplier(supplier: Supplier)

    // Products & Stock
    val allProducts: Flow<List<Product>>
    val activeProducts: Flow<List<Product>>
    val lowStockProducts: Flow<List<Product>>
    suspend fun getProductById(id: Long): Product?
    suspend fun saveProduct(product: Product): Long
    suspend fun updateProduct(product: Product)
    suspend fun recordStockAdjustment(productId: Long, quantityDelta: Int, reason: String)

    // Orders & Workflow
    val allOrders: Flow<List<Order>>
    fun getOrdersBySalesperson(salespersonId: Long): Flow<List<Order>>
    fun getOrdersByRetailer(retailerId: Long): Flow<List<Order>>
    fun getOrdersByStatus(status: OrderStatus): Flow<List<Order>>
    suspend fun getOrderById(id: Long): Order?
    fun observeOrderById(id: Long): Flow<Order?>
    fun getItemsForOrder(orderId: Long): Flow<List<OrderItem>>
    suspend fun createOrder(order: Order, items: List<OrderItem>): Long
    suspend fun updateOrderWithItems(order: Order, items: List<OrderItem>)
    suspend fun approveOrder(orderId: Long, feedback: String = "")
    suspend fun rejectOrder(orderId: Long, feedback: String)
    suspend fun requestOrderChanges(orderId: Long, feedback: String)

    // Invoices
    val allInvoices: Flow<List<Invoice>>
    fun getInvoicesByRetailer(retailerId: Long): Flow<List<Invoice>>
    fun getItemsForInvoice(invoiceId: Long): Flow<List<InvoiceItem>>
    suspend fun getInvoiceById(id: Long): Invoice?
    suspend fun generateInvoiceFromOrder(orderId: Long): Long

    // Deliveries
    val allDeliveries: Flow<List<Delivery>>
    suspend fun dispatchDelivery(deliveryId: Long, driverName: String, driverPhone: String, notes: String)
    suspend fun completeDelivery(deliveryId: Long, notes: String)

    // Purchases
    val allPurchases: Flow<List<Purchase>>
    fun getItemsForPurchase(purchaseId: Long): Flow<List<PurchaseItem>>
    suspend fun createPurchase(
        supplierId: Long,
        billNumber: String,
        items: List<Pair<Product, Int>>,
        notes: String
    ): Long

    // Payments & Collections
    val allPayments: Flow<List<Payment>>
    fun getRetailerPayments(retailerId: Long): Flow<List<Payment>>
    fun getSalespersonCollections(salespersonId: Long): Flow<List<Payment>>
    suspend fun recordRetailerPayment(
        retailerId: Long,
        invoiceId: Long?,
        amount: Double,
        method: PaymentMethod,
        referenceNumber: String,
        notes: String,
        recordedByUserId: Long,
        recordedByName: String
    ): Long
    suspend fun recordSupplierPayment(
        supplierId: Long,
        purchaseId: Long?,
        amount: Double,
        method: PaymentMethod,
        referenceNumber: String,
        notes: String,
        recordedByUserId: Long,
        recordedByName: String
    ): Long

    // Auditable Inventory Movements
    val allInventoryMovements: Flow<List<InventoryMovement>>

    // Salespersons directory
    val allUsers: Flow<List<User>>
    val allSalespersons: Flow<List<User>>
    suspend fun getUserById(id: Long): User?
    suspend fun saveUser(user: User): Long
    suspend fun updateUser(user: User)
}
