package com.example.data.repository

import com.example.data.datasource.ErpDataSource
import com.example.data.model.*
import kotlinx.coroutines.flow.Flow

/**
 * Default implementation of ErpRepository.
 * Coordinates domain business logic, state transitions, and audit records.
 * Uses an abstract ErpDataSource, decoupling business rules from local or cloud storage.
 */
class DefaultErpRepository(
    private val dataSource: ErpDataSource
) : ErpRepository {

    // --- Retailers ---
    override val allRetailers: Flow<List<Retailer>> = dataSource.allRetailers
    override fun getRetailersBySalesperson(salespersonId: Long): Flow<List<Retailer>> =
        dataSource.getRetailersBySalesperson(salespersonId)

    override suspend fun getRetailerById(id: Long): Retailer? = dataSource.getRetailerById(id)
    override fun observeRetailerById(id: Long): Flow<Retailer?> = dataSource.observeRetailerById(id)
    override suspend fun saveRetailer(retailer: Retailer): Long = dataSource.insertRetailer(retailer)
    override suspend fun updateRetailer(retailer: Retailer) = dataSource.updateRetailer(retailer)

    // --- Suppliers ---
    override val allSuppliers: Flow<List<Supplier>> = dataSource.allSuppliers
    override suspend fun getSupplierById(id: Long): Supplier? = dataSource.getSupplierById(id)
    override suspend fun saveSupplier(supplier: Supplier): Long = dataSource.insertSupplier(supplier)
    override suspend fun updateSupplier(supplier: Supplier) = dataSource.updateSupplier(supplier)

    // --- Products ---
    override val allProducts: Flow<List<Product>> = dataSource.allProducts
    override val activeProducts: Flow<List<Product>> = dataSource.activeProducts
    override val lowStockProducts: Flow<List<Product>> = dataSource.lowStockProducts
    override suspend fun getProductById(id: Long): Product? = dataSource.getProductById(id)
    override suspend fun saveProduct(product: Product): Long = dataSource.insertProduct(product)
    override suspend fun updateProduct(product: Product) = dataSource.updateProduct(product)

    override suspend fun recordStockAdjustment(
        productId: Long,
        quantityDelta: Int,
        reason: String
    ) {
        val product = dataSource.getProductById(productId) ?: return
        val newStock = product.currentStock + quantityDelta
        val movementType = if (quantityDelta >= 0) MovementType.ADJUSTMENT_IN else MovementType.ADJUSTMENT_OUT
        val now = System.currentTimeMillis()

        dataSource.updateProductStock(productId, quantityDelta)
        dataSource.insertInventoryMovement(
            InventoryMovement(
                productId = productId,
                productName = product.name,
                movementType = movementType,
                quantity = quantityDelta,
                previousStock = product.currentStock,
                newStock = newStock,
                referenceType = "MANUAL_ADJUSTMENT",
                referenceId = null,
                referenceNumber = "ADJ-${now % 100000}",
                reasonOrNotes = reason,
                timestamp = now
            )
        )
    }

    // --- Orders ---
    override val allOrders: Flow<List<Order>> = dataSource.allOrders
    override fun getOrdersBySalesperson(salespersonId: Long): Flow<List<Order>> =
        dataSource.getOrdersBySalesperson(salespersonId)

    override fun getOrdersByRetailer(retailerId: Long): Flow<List<Order>> =
        dataSource.getOrdersByRetailer(retailerId)

    override fun getOrdersByStatus(status: OrderStatus): Flow<List<Order>> =
        dataSource.getOrdersByStatus(status)

    override suspend fun getOrderById(id: Long): Order? = dataSource.getOrderById(id)
    override fun observeOrderById(id: Long): Flow<Order?> = dataSource.observeOrderById(id)
    override fun getItemsForOrder(orderId: Long): Flow<List<OrderItem>> = dataSource.getItemsForOrder(orderId)

    override suspend fun createOrder(order: Order, items: List<OrderItem>): Long {
        val orderId = dataSource.insertOrder(order)
        val itemsWithOrderId = items.map { it.copy(orderId = orderId) }
        dataSource.insertOrderItems(itemsWithOrderId)
        return orderId
    }

    override suspend fun updateOrderWithItems(order: Order, items: List<OrderItem>) {
        dataSource.updateOrder(order)
        dataSource.deleteItemsForOrder(order.id)
        val itemsWithOrderId = items.map { it.copy(orderId = order.id) }
        dataSource.insertOrderItems(itemsWithOrderId)
    }

    override suspend fun approveOrder(orderId: Long, feedback: String) {
        dataSource.updateOrderStatus(
            orderId = orderId,
            status = OrderStatus.APPROVED,
            feedback = feedback.ifBlank { "Approved by Admin" },
            timestamp = System.currentTimeMillis()
        )
    }

    override suspend fun rejectOrder(orderId: Long, feedback: String) {
        dataSource.updateOrderStatus(
            orderId = orderId,
            status = OrderStatus.REJECTED,
            feedback = feedback.ifBlank { "Rejected by Admin" },
            timestamp = System.currentTimeMillis()
        )
    }

    override suspend fun requestOrderChanges(orderId: Long, feedback: String) {
        dataSource.updateOrderStatus(
            orderId = orderId,
            status = OrderStatus.CHANGES_REQUESTED,
            feedback = feedback,
            timestamp = System.currentTimeMillis()
        )
    }

    // --- Invoices ---
    override val allInvoices: Flow<List<Invoice>> = dataSource.allInvoices
    override fun getInvoicesByRetailer(retailerId: Long): Flow<List<Invoice>> =
        dataSource.getInvoicesByRetailer(retailerId)

    override fun getItemsForInvoice(invoiceId: Long): Flow<List<InvoiceItem>> =
        dataSource.getItemsForInvoice(invoiceId)

    override suspend fun getInvoiceById(id: Long): Invoice? = dataSource.getInvoiceById(id)

    override suspend fun generateInvoiceFromOrder(orderId: Long): Long {
        val order = dataSource.getOrderById(orderId) ?: throw IllegalArgumentException("Order not found")
        val items = dataSource.getItemsForOrderSync(orderId)

        val invoiceNumber = "INV-${System.currentTimeMillis() % 1000000}"
        val now = System.currentTimeMillis()
        val invoice = Invoice(
            invoiceNumber = invoiceNumber,
            orderId = order.id,
            retailerId = order.retailerId,
            retailerName = order.retailerName,
            invoiceDate = now,
            dueDate = now + (30L * 24 * 60 * 60 * 1000),
            subtotal = order.subtotal,
            discount = order.discount,
            tax = 0.0,
            totalAmount = order.totalAmount,
            amountPaid = 0.0,
            remainingBalance = order.totalAmount,
            paymentStatus = InvoicePaymentStatus.UNPAID
        )
        val invoiceId = dataSource.insertInvoice(invoice)

        val invoiceItems = items.map {
            InvoiceItem(
                invoiceId = invoiceId,
                productId = it.productId,
                productName = it.productName,
                quantity = it.quantity,
                unitPrice = it.unitPrice,
                discount = it.unitPrice * (it.discountPercent / 100.0),
                total = it.total
            )
        }
        dataSource.insertInvoiceItems(invoiceItems)

        dataSource.updateOrderStatus(order.id, OrderStatus.INVOICED, "Invoice generated: $invoiceNumber", now)
        dataSource.updateRetailerOutstandingBalance(order.retailerId, order.totalAmount)

        // Automatically schedule delivery
        val retailer = dataSource.getRetailerById(order.retailerId)
        val delivery = Delivery(
            orderId = order.id,
            orderNumber = order.orderNumber,
            invoiceId = invoiceId,
            invoiceNumber = invoiceNumber,
            retailerId = order.retailerId,
            retailerName = order.retailerName,
            deliveryAddress = retailer?.address ?: "Default Address",
            driverName = "Assigned Logistics Team",
            driverPhone = "",
            status = DeliveryStatus.SCHEDULED,
            scheduledDate = now + (24 * 60 * 60 * 1000),
            notes = "Generated from Invoice $invoiceNumber"
        )
        dataSource.insertDelivery(delivery)

        return invoiceId
    }

    // --- Deliveries ---
    override val allDeliveries: Flow<List<Delivery>> = dataSource.allDeliveries

    override suspend fun dispatchDelivery(
        deliveryId: Long,
        driverName: String,
        driverPhone: String,
        notes: String
    ) {
        val delivery = dataSource.getDeliveryById(deliveryId) ?: return
        val now = System.currentTimeMillis()
        dataSource.updateDelivery(
            delivery.copy(
                driverName = driverName,
                driverPhone = driverPhone,
                status = DeliveryStatus.DISPATCHED,
                notes = notes
            )
        )
        dataSource.updateOrderStatus(delivery.orderId, OrderStatus.DISPATCHED, "Dispatched with driver $driverName", now)
    }

    override suspend fun completeDelivery(deliveryId: Long, notes: String) {
        val delivery = dataSource.getDeliveryById(deliveryId) ?: return
        val now = System.currentTimeMillis()

        dataSource.updateDeliveryStatus(deliveryId, DeliveryStatus.DELIVERED, now, notes)
        dataSource.updateOrderStatus(delivery.orderId, OrderStatus.DELIVERED, "Delivered successfully", now)

        val items = dataSource.getItemsForOrderSync(delivery.orderId)
        for (item in items) {
            val product = dataSource.getProductById(item.productId)
            if (product != null) {
                val newStock = product.currentStock - item.quantity
                dataSource.updateProductStock(product.id, -item.quantity)
                dataSource.insertInventoryMovement(
                    InventoryMovement(
                        productId = product.id,
                        productName = product.name,
                        movementType = MovementType.ORDER_DELIVERY,
                        quantity = -item.quantity,
                        previousStock = product.currentStock,
                        newStock = newStock,
                        referenceType = "ORDER",
                        referenceId = delivery.orderId,
                        referenceNumber = delivery.orderNumber,
                        reasonOrNotes = "Dispatched and delivered to ${delivery.retailerName}",
                        timestamp = now
                    )
                )
            }
        }
    }

    // --- Purchases ---
    override val allPurchases: Flow<List<Purchase>> = dataSource.allPurchases
    override fun getItemsForPurchase(purchaseId: Long): Flow<List<PurchaseItem>> =
        dataSource.getItemsForPurchase(purchaseId)

    override suspend fun createPurchase(
        supplierId: Long,
        billNumber: String,
        items: List<Pair<Product, Int>>,
        notes: String
    ): Long {
        val supplier = dataSource.getSupplierById(supplierId) ?: throw IllegalArgumentException("Supplier not found")
        val now = System.currentTimeMillis()
        val totalAmount = items.sumOf { it.first.purchasePrice * it.second }

        val purchase = Purchase(
            billNumber = billNumber,
            supplierId = supplierId,
            supplierName = supplier.name,
            purchaseDate = now,
            totalAmount = totalAmount,
            amountPaid = 0.0,
            paymentStatus = InvoicePaymentStatus.UNPAID,
            notes = notes,
            createdAt = now
        )
        val purchaseId = dataSource.insertPurchase(purchase)

        val purchaseItems = items.map { (prod, qty) ->
            PurchaseItem(
                purchaseId = purchaseId,
                productId = prod.id,
                productName = prod.name,
                quantity = qty,
                purchasePrice = prod.purchasePrice,
                total = prod.purchasePrice * qty
            )
        }
        dataSource.insertPurchaseItems(purchaseItems)
        dataSource.updateSupplierPayableBalance(supplierId, totalAmount)

        for ((prod, qty) in items) {
            val freshProduct = dataSource.getProductById(prod.id) ?: prod
            val newStock = freshProduct.currentStock + qty
            dataSource.updateProductStock(prod.id, qty)
            dataSource.insertInventoryMovement(
                InventoryMovement(
                    productId = prod.id,
                    productName = prod.name,
                    movementType = MovementType.PURCHASE_RECEIPT,
                    quantity = qty,
                    previousStock = freshProduct.currentStock,
                    newStock = newStock,
                    referenceType = "PURCHASE",
                    referenceId = purchaseId,
                    referenceNumber = billNumber,
                    reasonOrNotes = "Received from supplier: ${supplier.name}",
                    timestamp = now
                )
            )
        }

        return purchaseId
    }

    // --- Payments ---
    override val allPayments: Flow<List<Payment>> = dataSource.allPayments
    override fun getRetailerPayments(retailerId: Long): Flow<List<Payment>> =
        dataSource.getPaymentsForEntity(retailerId, PaymentType.RETAILER_COLLECTION)

    override fun getSalespersonCollections(salespersonId: Long): Flow<List<Payment>> =
        dataSource.getCollectionsBySalesperson(salespersonId)

    override suspend fun recordRetailerPayment(
        retailerId: Long,
        invoiceId: Long?,
        amount: Double,
        method: PaymentMethod,
        referenceNumber: String,
        notes: String,
        recordedByUserId: Long,
        recordedByName: String
    ): Long {
        val retailer = dataSource.getRetailerById(retailerId) ?: throw IllegalArgumentException("Retailer not found")
        val now = System.currentTimeMillis()
        val paymentNumber = "PAY-R-${now % 1000000}"

        val payment = Payment(
            paymentNumber = paymentNumber,
            type = PaymentType.RETAILER_COLLECTION,
            entityId = retailerId,
            entityName = retailer.name,
            invoiceId = invoiceId,
            amount = amount,
            paymentDate = now,
            paymentMethod = method,
            referenceNumber = referenceNumber,
            notes = notes,
            recordedByUserId = recordedByUserId,
            recordedByName = recordedByName,
            createdAt = now
        )
        val paymentId = dataSource.insertPayment(payment)
        dataSource.updateRetailerOutstandingBalance(retailerId, -amount)

        if (invoiceId != null) {
            val invoice = dataSource.getInvoiceById(invoiceId)
            if (invoice != null) {
                val newRemaining = invoice.remainingBalance - amount
                val newStatus = when {
                    newRemaining <= 0.01 -> InvoicePaymentStatus.PAID
                    newRemaining < invoice.totalAmount -> InvoicePaymentStatus.PARTIALLY_PAID
                    else -> InvoicePaymentStatus.UNPAID
                }
                dataSource.recordInvoicePayment(invoiceId, amount, newStatus)
            }
        }

        return paymentId
    }

    override suspend fun recordSupplierPayment(
        supplierId: Long,
        purchaseId: Long?,
        amount: Double,
        method: PaymentMethod,
        referenceNumber: String,
        notes: String,
        recordedByUserId: Long,
        recordedByName: String
    ): Long {
        val supplier = dataSource.getSupplierById(supplierId) ?: throw IllegalArgumentException("Supplier not found")
        val now = System.currentTimeMillis()
        val paymentNumber = "PAY-S-${now % 1000000}"

        val payment = Payment(
            paymentNumber = paymentNumber,
            type = PaymentType.SUPPLIER_PAYMENT,
            entityId = supplierId,
            entityName = supplier.name,
            purchaseId = purchaseId,
            amount = amount,
            paymentDate = now,
            paymentMethod = method,
            referenceNumber = referenceNumber,
            notes = notes,
            recordedByUserId = recordedByUserId,
            recordedByName = recordedByName,
            createdAt = now
        )
        val paymentId = dataSource.insertPayment(payment)
        dataSource.updateSupplierPayableBalance(supplierId, -amount)

        if (purchaseId != null) {
            val purchase = dataSource.getPurchaseById(purchaseId)
            if (purchase != null) {
                val totalPaid = purchase.amountPaid + amount
                val newStatus = when {
                    totalPaid >= purchase.totalAmount - 0.01 -> InvoicePaymentStatus.PAID
                    totalPaid > 0 -> InvoicePaymentStatus.PARTIALLY_PAID
                    else -> InvoicePaymentStatus.UNPAID
                }
                dataSource.recordPurchasePayment(purchaseId, amount, newStatus)
            }
        }

        return paymentId
    }

    // --- Inventory Movements ---
    override val allInventoryMovements: Flow<List<InventoryMovement>> = dataSource.allInventoryMovements

    // --- Users ---
    override val allUsers: Flow<List<User>> = dataSource.allUsers
    override val allSalespersons: Flow<List<User>> = dataSource.allSalespersons
    override suspend fun getUserById(id: Long): User? = dataSource.getUserById(id)
    override suspend fun saveUser(user: User): Long = dataSource.insertUser(user)
    override suspend fun updateUser(user: User) = dataSource.updateUser(user)
}
