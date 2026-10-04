package com.example.data.datasource.local

import com.example.data.datasource.ErpDataSource
import com.example.data.local.AppDatabase
import com.example.data.model.*
import kotlinx.coroutines.flow.Flow

/**
 * Room-backed local implementation of ErpDataSource.
 * Confines all Room database operations strictly within the local data layer.
 */
class RoomErpDataSource(private val db: AppDatabase) : ErpDataSource {

    // Retailers
    override val allRetailers: Flow<List<Retailer>> = db.retailerDao().getAllRetailers()
    override fun getRetailersBySalesperson(salespersonId: Long): Flow<List<Retailer>> =
        db.retailerDao().getRetailersBySalesperson(salespersonId)

    override suspend fun getRetailerById(id: Long): Retailer? = db.retailerDao().getRetailerById(id)
    override fun observeRetailerById(id: Long): Flow<Retailer?> = db.retailerDao().observeRetailerById(id)
    override suspend fun insertRetailer(retailer: Retailer): Long = db.retailerDao().insertRetailer(retailer)
    override suspend fun updateRetailer(retailer: Retailer) = db.retailerDao().updateRetailer(retailer)
    override suspend fun updateRetailerOutstandingBalance(retailerId: Long, amountDelta: Double) =
        db.retailerDao().updateOutstandingBalance(retailerId, amountDelta)

    // Suppliers
    override val allSuppliers: Flow<List<Supplier>> = db.supplierDao().getAllSuppliers()
    override suspend fun getSupplierById(id: Long): Supplier? = db.supplierDao().getSupplierById(id)
    override fun observeSupplierById(id: Long): Flow<Supplier?> = db.supplierDao().observeSupplierById(id)
    override suspend fun insertSupplier(supplier: Supplier): Long = db.supplierDao().insertSupplier(supplier)
    override suspend fun updateSupplier(supplier: Supplier) = db.supplierDao().updateSupplier(supplier)
    override suspend fun updateSupplierPayableBalance(supplierId: Long, amountDelta: Double) =
        db.supplierDao().updatePayableBalance(supplierId, amountDelta)

    // Products
    override val allProducts: Flow<List<Product>> = db.productDao().getAllProducts()
    override val activeProducts: Flow<List<Product>> = db.productDao().getActiveProducts()
    override val lowStockProducts: Flow<List<Product>> = db.productDao().getLowStockProducts()
    override suspend fun getProductById(id: Long): Product? = db.productDao().getProductById(id)
    override fun observeProductById(id: Long): Flow<Product?> = db.productDao().observeProductById(id)
    override suspend fun insertProduct(product: Product): Long = db.productDao().insertProduct(product)
    override suspend fun updateProduct(product: Product) = db.productDao().updateProduct(product)
    override suspend fun updateProductStock(productId: Long, qtyChange: Int) =
        db.productDao().updateStock(productId, qtyChange)

    // Orders & Items
    override val allOrders: Flow<List<Order>> = db.orderDao().getAllOrders()
    override fun getOrdersBySalesperson(salespersonId: Long): Flow<List<Order>> =
        db.orderDao().getOrdersBySalesperson(salespersonId)

    override fun getOrdersByRetailer(retailerId: Long): Flow<List<Order>> =
        db.orderDao().getOrdersByRetailer(retailerId)

    override fun getOrdersByStatus(status: OrderStatus): Flow<List<Order>> =
        db.orderDao().getOrdersByStatus(status)

    override suspend fun getOrderById(id: Long): Order? = db.orderDao().getOrderById(id)
    override fun observeOrderById(id: Long): Flow<Order?> = db.orderDao().observeOrderById(id)
    override suspend fun insertOrder(order: Order): Long = db.orderDao().insertOrder(order)
    override suspend fun updateOrder(order: Order) = db.orderDao().updateOrder(order)
    override suspend fun updateOrderStatus(orderId: Long, status: OrderStatus, feedback: String, timestamp: Long) =
        db.orderDao().updateOrderStatus(orderId, status, feedback, timestamp)

    override fun getItemsForOrder(orderId: Long): Flow<List<OrderItem>> = db.orderDao().getItemsForOrder(orderId)
    override suspend fun getItemsForOrderSync(orderId: Long): List<OrderItem> = db.orderDao().getItemsForOrderSync(orderId)
    override suspend fun insertOrderItems(items: List<OrderItem>) = db.orderDao().insertOrderItems(items)
    override suspend fun deleteItemsForOrder(orderId: Long) = db.orderDao().deleteItemsForOrder(orderId)

    // Invoices & Items
    override val allInvoices: Flow<List<Invoice>> = db.invoiceDao().getAllInvoices()
    override fun getInvoicesByRetailer(retailerId: Long): Flow<List<Invoice>> =
        db.invoiceDao().getInvoicesByRetailer(retailerId)

    override suspend fun getInvoiceById(id: Long): Invoice? = db.invoiceDao().getInvoiceById(id)
    override suspend fun getInvoiceByOrderId(orderId: Long): Invoice? = db.invoiceDao().getInvoiceByOrderId(orderId)
    override fun observeInvoiceById(id: Long): Flow<Invoice?> = db.invoiceDao().observeInvoiceById(id)
    override suspend fun insertInvoice(invoice: Invoice): Long = db.invoiceDao().insertInvoice(invoice)
    override suspend fun updateInvoice(invoice: Invoice) = db.invoiceDao().updateInvoice(invoice)
    override suspend fun recordInvoicePayment(invoiceId: Long, amount: Double, status: InvoicePaymentStatus) =
        db.invoiceDao().recordInvoicePayment(invoiceId, amount, status)

    override fun getItemsForInvoice(invoiceId: Long): Flow<List<InvoiceItem>> = db.invoiceDao().getItemsForInvoice(invoiceId)
    override suspend fun insertInvoiceItems(items: List<InvoiceItem>) = db.invoiceDao().insertInvoiceItems(items)

    // Purchases & Items
    override val allPurchases: Flow<List<Purchase>> = db.purchaseDao().getAllPurchases()
    override fun getPurchasesBySupplier(supplierId: Long): Flow<List<Purchase>> =
        db.purchaseDao().getPurchasesBySupplier(supplierId)

    override suspend fun getPurchaseById(id: Long): Purchase? = db.purchaseDao().getPurchaseById(id)
    override fun observePurchaseById(id: Long): Flow<Purchase?> = db.purchaseDao().observePurchaseById(id)
    override suspend fun insertPurchase(purchase: Purchase): Long = db.purchaseDao().insertPurchase(purchase)
    override suspend fun updatePurchase(purchase: Purchase) = db.purchaseDao().updatePurchase(purchase)
    override suspend fun recordPurchasePayment(purchaseId: Long, amount: Double, status: InvoicePaymentStatus) =
        db.purchaseDao().recordPurchasePayment(purchaseId, amount, status)

    override fun getItemsForPurchase(purchaseId: Long): Flow<List<PurchaseItem>> = db.purchaseDao().getItemsForPurchase(purchaseId)
    override suspend fun insertPurchaseItems(items: List<PurchaseItem>) = db.purchaseDao().insertPurchaseItems(items)

    // Payments
    override val allPayments: Flow<List<Payment>> = db.paymentDao().getAllPayments()
    override fun getPaymentsByType(type: PaymentType): Flow<List<Payment>> = db.paymentDao().getPaymentsByType(type)
    override fun getPaymentsForEntity(entityId: Long, type: PaymentType): Flow<List<Payment>> =
        db.paymentDao().getPaymentsForEntity(entityId, type)

    override fun getCollectionsBySalesperson(salespersonId: Long): Flow<List<Payment>> =
        db.paymentDao().getCollectionsBySalesperson(salespersonId)

    override suspend fun insertPayment(payment: Payment): Long = db.paymentDao().insertPayment(payment)

    // Inventory Movements
    override val allInventoryMovements: Flow<List<InventoryMovement>> = db.inventoryDao().getAllMovements()
    override fun getMovementsForProduct(productId: Long): Flow<List<InventoryMovement>> =
        db.inventoryDao().getMovementsForProduct(productId)

    override suspend fun insertInventoryMovement(movement: InventoryMovement): Long =
        db.inventoryDao().insertMovement(movement)

    // Deliveries
    override val allDeliveries: Flow<List<Delivery>> = db.deliveryDao().getAllDeliveries()
    override fun getDeliveriesByStatus(status: DeliveryStatus): Flow<List<Delivery>> =
        db.deliveryDao().getDeliveriesByStatus(status)

    override suspend fun getDeliveryByOrderId(orderId: Long): Delivery? = db.deliveryDao().getDeliveryByOrderId(orderId)
    override suspend fun getDeliveryById(id: Long): Delivery? = db.deliveryDao().getDeliveryById(id)
    override suspend fun insertDelivery(delivery: Delivery): Long = db.deliveryDao().insertDelivery(delivery)
    override suspend fun updateDelivery(delivery: Delivery) = db.deliveryDao().updateDelivery(delivery)
    override suspend fun updateDeliveryStatus(deliveryId: Long, status: DeliveryStatus, deliveredDate: Long?, notes: String) =
        db.deliveryDao().updateDeliveryStatus(deliveryId, status, deliveredDate, notes)

    // Users
    override val allUsers: Flow<List<User>> = db.userDao().getAllUsers()
    override val allSalespersons: Flow<List<User>> = db.userDao().getUsersByRole(UserRole.SALESPERSON)
    override suspend fun getUserById(id: Long): User? = db.userDao().getUserById(id)
    override suspend fun insertUser(user: User): Long = db.userDao().insertUser(user)
    override suspend fun updateUser(user: User) = db.userDao().updateUser(user)
}
