package com.example.data.seed

import com.example.data.local.AppDatabase
import com.example.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * ISOLATED DEMO/SEED DATA SOURCE
 *
 * NOTE: This file is strictly for initial prototype evaluation and JVM tests.
 * These demo records (Sarah, John Davis, Maria Santos, etc.) are NOT real company users
 * and should never be treated as the permanent cloud architecture.
 *
 * When migrating to Supabase:
 * 1. Set IS_DEMO_SEEDING_ENABLED = false.
 * 2. Authenticate real users via Supabase GoTrue Auth.
 * 3. Seed live business records via SQL migrations or initial organization onboarding.
 */
object DemoDataSeeder {

    /**
     * Master toggle for demo seeding. Set to false when connecting to production cloud backend.
     */
    var IS_DEMO_SEEDING_ENABLED: Boolean = true

    suspend fun seedDemoDataIfEmpty(db: AppDatabase) {
        if (!IS_DEMO_SEEDING_ENABLED) return

        withContext(Dispatchers.IO) {
            val existingAdmin = db.userDao().getUserByUsername("admin")
            if (existingAdmin != null) return@withContext

            val now = System.currentTimeMillis()
            val dayMs = 24L * 60 * 60 * 1000

            // 1. Prototype Users (Isolated for local testing only)
            val demoOwner = User(
                id = 1,
                username = "admin",
                passwordHash = "admin123",
                fullName = "Sarah Jenkins (Demo Owner)",
                role = UserRole.OWNER,
                email = "admin@distriflow-demo.com",
                phone = "+1 (555) 234-5678",
                isActive = true,
                createdAt = now - (60 * dayMs)
            )
            val demoSales1 = User(
                id = 2,
                username = "john",
                passwordHash = "sales123",
                fullName = "John Davis (Demo Rep)",
                role = UserRole.SALESPERSON,
                email = "john.rep@distriflow-demo.com",
                phone = "+1 (555) 345-6789",
                isActive = true,
                createdAt = now - (45 * dayMs)
            )
            val demoSales2 = User(
                id = 3,
                username = "maria",
                passwordHash = "sales123",
                fullName = "Maria Santos (Demo Rep)",
                role = UserRole.SALESPERSON,
                email = "maria.rep@distriflow-demo.com",
                phone = "+1 (555) 456-7890",
                isActive = true,
                createdAt = now - (30 * dayMs)
            )
            db.userDao().insertUsers(listOf(demoOwner, demoSales1, demoSales2))

            // 2. Prototype Suppliers
            val sup1 = Supplier(
                id = 1,
                name = "Apex Beverage Distributors",
                contactPerson = "Michael Chang",
                phone = "+1 (555) 111-2233",
                email = "orders@apexbeverage.com",
                address = "1200 Industrial Pkwy, Sector 4",
                payableBalance = 4250.00,
                createdAt = now - (60 * dayMs)
            )
            val sup2 = Supplier(
                id = 2,
                name = "Prime Foods Wholesale",
                contactPerson = "Elena Rostova",
                phone = "+1 (555) 222-3344",
                email = "supply@primefoods.com",
                address = "45 Harbor Blvd, Pier 9",
                payableBalance = 6800.00,
                createdAt = now - (60 * dayMs)
            )
            val sup3 = Supplier(
                id = 3,
                name = "CleanCare Household Supplies",
                contactPerson = "David Miller",
                phone = "+1 (555) 333-4455",
                email = "sales@cleancare.com",
                address = "88 Logistic Way, Suite 100",
                payableBalance = 1500.00,
                createdAt = now - (60 * dayMs)
            )
            db.supplierDao().insertSuppliers(listOf(sup1, sup2, sup3))

            // 3. Prototype Products
            val p1 = Product(
                id = 1,
                sku = "BEV-001",
                name = "Premium Arabica Iced Coffee (12pk)",
                category = "Beverages",
                unit = "case",
                purchasePrice = 18.50,
                sellingPrice = 27.50,
                currentStock = 120,
                minStockLevel = 30,
                supplierId = sup1.id,
                supplierName = sup1.name,
                createdAt = now - (50 * dayMs)
            )
            val p2 = Product(
                id = 2,
                sku = "BEV-002",
                name = "Sparkling Spring Water 500ml (24pk)",
                category = "Beverages",
                unit = "case",
                purchasePrice = 11.00,
                sellingPrice = 17.50,
                currentStock = 85,
                minStockLevel = 25,
                supplierId = sup1.id,
                supplierName = sup1.name,
                createdAt = now - (50 * dayMs)
            )
            val p3 = Product(
                id = 3,
                sku = "SNK-001",
                name = "Organic Sea Salt Chips (30pk)",
                category = "Snacks",
                unit = "box",
                purchasePrice = 22.00,
                sellingPrice = 34.00,
                currentStock = 8,
                minStockLevel = 20,
                supplierId = sup2.id,
                supplierName = sup2.name,
                createdAt = now - (50 * dayMs)
            )
            val p4 = Product(
                id = 4,
                sku = "SNK-002",
                name = "Almond Protein Crunch Bars (24pk)",
                category = "Snacks",
                unit = "box",
                purchasePrice = 26.00,
                sellingPrice = 42.00,
                currentStock = 65,
                minStockLevel = 15,
                supplierId = sup2.id,
                supplierName = sup2.name,
                createdAt = now - (50 * dayMs)
            )
            val p5 = Product(
                id = 5,
                sku = "CLN-001",
                name = "Commercial Surface Sanitizer 5L",
                category = "Household",
                unit = "jug",
                purchasePrice = 14.20,
                sellingPrice = 24.00,
                currentStock = 5,
                minStockLevel = 15,
                supplierId = sup3.id,
                supplierName = sup3.name,
                createdAt = now - (50 * dayMs)
            )
            val p6 = Product(
                id = 6,
                sku = "GRC-001",
                name = "Golden Grain Wheat Flour 25kg",
                category = "Groceries",
                unit = "bag",
                purchasePrice = 28.00,
                sellingPrice = 38.50,
                currentStock = 90,
                minStockLevel = 20,
                supplierId = sup2.id,
                supplierName = sup2.name,
                createdAt = now - (50 * dayMs)
            )
            db.productDao().insertProducts(listOf(p1, p2, p3, p4, p5, p6))

            // 4. Prototype Retailers
            val r1 = Retailer(
                id = 1,
                name = "Metro Central Mart",
                contactPerson = "Arthur Pendelton",
                phone = "+1 (555) 777-8899",
                email = "arthur@metromart.com",
                address = "450 Commercial Ave",
                city = "Metropolis",
                assignedSalespersonId = demoSales1.id,
                creditLimit = 8000.00,
                outstandingBalance = 1650.00,
                createdAt = now - (40 * dayMs)
            )
            val r2 = Retailer(
                id = 2,
                name = "Sunrise Convenience Store",
                contactPerson = "Lucy Henderson",
                phone = "+1 (555) 888-9900",
                email = "lucy@sunrisestore.com",
                address = "12 4th Street",
                city = "Westside",
                assignedSalespersonId = demoSales1.id,
                creditLimit = 4000.00,
                outstandingBalance = 840.00,
                createdAt = now - (40 * dayMs)
            )
            val r3 = Retailer(
                id = 3,
                name = "Valley Grocers Co-op",
                contactPerson = "Gregory Vance",
                phone = "+1 (555) 999-0011",
                email = "greg@valleycoop.com",
                address = "89 Valley View Rd",
                city = "Oakdale",
                assignedSalespersonId = demoSales2.id,
                creditLimit = 12000.00,
                outstandingBalance = 3200.00,
                createdAt = now - (30 * dayMs)
            )
            val r4 = Retailer(
                id = 4,
                name = "Corner Pocket Bodega",
                contactPerson = "Marcus Cole",
                phone = "+1 (555) 321-6547",
                email = "marcus@pocketbodega.com",
                address = "707 Elm St",
                city = "Downtown",
                assignedSalespersonId = demoSales2.id,
                creditLimit = 3000.00,
                outstandingBalance = 0.00,
                createdAt = now - (20 * dayMs)
            )
            db.retailerDao().insertRetailers(listOf(r1, r2, r3, r4))

            // 5. Prototype Orders
            val o1 = Order(
                id = 1,
                orderNumber = "ORD-2026-001",
                retailerId = r1.id,
                retailerName = r1.name,
                salespersonId = demoSales1.id,
                salespersonName = demoSales1.fullName,
                orderDate = now - (2 * 60 * 60 * 1000),
                status = OrderStatus.SUBMITTED,
                subtotal = 735.00,
                discount = 25.00,
                totalAmount = 710.00,
                notes = "Urgent weekend replenishment. Store requested morning slot.",
                ownerFeedback = "",
                createdAt = now - (2 * 60 * 60 * 1000),
                updatedAt = now - (2 * 60 * 60 * 1000)
            )
            val o1Items = listOf(
                OrderItem(
                    id = 1,
                    orderId = 1,
                    productId = p1.id,
                    productName = p1.name,
                    productSku = p1.sku,
                    quantity = 15,
                    unitPrice = p1.sellingPrice,
                    discountPercent = 0.0,
                    total = 15 * p1.sellingPrice
                ),
                OrderItem(
                    id = 2,
                    orderId = 1,
                    productId = p2.id,
                    productName = p2.name,
                    productSku = p2.sku,
                    quantity = 20,
                    unitPrice = p2.sellingPrice,
                    discountPercent = 0.0,
                    total = 20 * p2.sellingPrice
                )
            )
            db.orderDao().insertOrder(o1)
            db.orderDao().insertOrderItems(o1Items)

            val o2 = Order(
                id = 2,
                orderNumber = "ORD-2026-002",
                retailerId = r2.id,
                retailerName = r2.name,
                salespersonId = demoSales1.id,
                salespersonName = demoSales1.fullName,
                orderDate = now - (1 * dayMs),
                status = OrderStatus.CHANGES_REQUESTED,
                subtotal = 544.00,
                discount = 50.00,
                totalAmount = 494.00,
                notes = "Regular store order.",
                ownerFeedback = "Please reduce discount to max 5% or verify credit approval before resubmission.",
                createdAt = now - (1 * dayMs),
                updatedAt = now - (20 * 60 * 60 * 1000)
            )
            val o2Items = listOf(
                OrderItem(
                    id = 3,
                    orderId = 2,
                    productId = p3.id,
                    productName = p3.name,
                    productSku = p3.sku,
                    quantity = 16,
                    unitPrice = p3.sellingPrice,
                    discountPercent = 0.0,
                    total = 16 * p3.sellingPrice
                )
            )
            db.orderDao().insertOrder(o2)
            db.orderDao().insertOrderItems(o2Items)

            val o3 = Order(
                id = 3,
                orderNumber = "ORD-2026-003",
                retailerId = r3.id,
                retailerName = r3.name,
                salespersonId = demoSales2.id,
                salespersonName = demoSales2.fullName,
                orderDate = now - (2 * dayMs),
                status = OrderStatus.APPROVED,
                subtotal = 1155.00,
                discount = 0.0,
                totalAmount = 1155.00,
                notes = "Pre-approved weekly bulk run.",
                ownerFeedback = "Approved by Sarah J. Proceed with packing.",
                createdAt = now - (2 * dayMs),
                updatedAt = now - (36 * 60 * 60 * 1000)
            )
            val o3Items = listOf(
                OrderItem(
                    id = 4,
                    orderId = 3,
                    productId = p6.id,
                    productName = p6.name,
                    productSku = p6.sku,
                    quantity = 30,
                    unitPrice = p6.sellingPrice,
                    discountPercent = 0.0,
                    total = 30 * p6.sellingPrice
                )
            )
            db.orderDao().insertOrder(o3)
            db.orderDao().insertOrderItems(o3Items)

            val o4 = Order(
                id = 4,
                orderNumber = "ORD-2026-004",
                retailerId = r1.id,
                retailerName = r1.name,
                salespersonId = demoSales1.id,
                salespersonName = demoSales1.fullName,
                orderDate = now - (5 * dayMs),
                status = OrderStatus.DELIVERED,
                subtotal = 1650.00,
                discount = 0.0,
                totalAmount = 1650.00,
                notes = "Delivered without issues.",
                ownerFeedback = "Completed.",
                createdAt = now - (5 * dayMs),
                updatedAt = now - (4 * dayMs)
            )
            db.orderDao().insertOrder(o4)

            val inv1 = Invoice(
                id = 1,
                invoiceNumber = "INV-2026-101",
                orderId = o4.id,
                retailerId = r1.id,
                retailerName = r1.name,
                invoiceDate = now - (5 * dayMs),
                dueDate = now + (25 * dayMs),
                subtotal = 1650.00,
                discount = 0.0,
                tax = 0.0,
                totalAmount = 1650.00,
                amountPaid = 650.00,
                remainingBalance = 1000.00,
                paymentStatus = InvoicePaymentStatus.PARTIALLY_PAID,
                createdAt = now - (5 * dayMs)
            )
            db.invoiceDao().insertInvoice(inv1)

            val del1 = Delivery(
                id = 1,
                orderId = o4.id,
                orderNumber = o4.orderNumber,
                invoiceId = inv1.id,
                invoiceNumber = inv1.invoiceNumber,
                retailerId = r1.id,
                retailerName = r1.name,
                deliveryAddress = r1.address,
                driverName = "Carlos Gomez",
                driverPhone = "+1 (555) 444-1234",
                status = DeliveryStatus.DELIVERED,
                scheduledDate = now - (5 * dayMs),
                deliveredDate = now - (4 * dayMs),
                notes = "Signed and received by receiving dock supervisor."
            )
            db.deliveryDao().insertDelivery(del1)

            val pay1 = Payment(
                id = 1,
                paymentNumber = "PAY-2026-001",
                type = PaymentType.RETAILER_COLLECTION,
                entityId = r1.id,
                entityName = r1.name,
                invoiceId = inv1.id,
                amount = 650.00,
                paymentDate = now - (3 * dayMs),
                paymentMethod = PaymentMethod.BANK_TRANSFER,
                referenceNumber = "WIRE-8930412",
                notes = "First installment for INV-2026-101",
                recordedByUserId = demoSales1.id,
                recordedByName = demoSales1.fullName,
                createdAt = now - (3 * dayMs)
            )
            db.paymentDao().insertPayment(pay1)

            val m1 = InventoryMovement(
                id = 1,
                productId = p1.id,
                productName = p1.name,
                movementType = MovementType.PURCHASE_RECEIPT,
                quantity = 100,
                previousStock = 20,
                newStock = 120,
                referenceType = "PURCHASE",
                referenceId = 1,
                referenceNumber = "PUR-2026-01",
                reasonOrNotes = "Received supplier delivery from Apex Beverage",
                timestamp = now - (7 * dayMs)
            )
            val m2 = InventoryMovement(
                id = 2,
                productId = p3.id,
                productName = p3.name,
                movementType = MovementType.ORDER_DELIVERY,
                quantity = -20,
                previousStock = 28,
                newStock = 8,
                referenceType = "ORDER",
                referenceId = o4.id,
                referenceNumber = o4.orderNumber,
                reasonOrNotes = "Dispatched and delivered to Metro Central Mart",
                timestamp = now - (4 * dayMs)
            )
            db.inventoryDao().insertMovement(m1)
            db.inventoryDao().insertMovement(m2)
        }
    }
}
