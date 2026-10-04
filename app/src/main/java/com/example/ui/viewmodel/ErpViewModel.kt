package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.ErpApplication
import com.example.data.model.*
import com.example.data.repository.AuthRepository
import com.example.data.repository.ErpRepository
import com.example.di.DefaultAppContainer
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

enum class ErpScreen(val title: String) {
    LOGIN("Sign In"),
    DASHBOARD("Dashboard"),
    ORDERS("Sales Orders"),
    CREATE_ORDER("New Order"),
    RETAILERS("Retailers & Customers"),
    PRODUCTS("Product Catalog"),
    SUPPLIERS("Suppliers & Purchases"),
    INVOICES("Invoices"),
    DELIVERIES("Dispatch & Deliveries"),
    PAYMENTS("Payments & Collections"),
    INVENTORY("Inventory & Audit"),
    REPORTS("Business Reports"),
    SALESPERSONS("Sales Team")
}

data class OrderLineDraft(
    val product: Product,
    val quantity: Int,
    val unitPrice: Double,
    val discountPercent: Double = 0.0
) {
    val total: Double
        get() {
            val base = unitPrice * quantity
            val disc = base * (discountPercent / 100.0)
            return (base - disc).coerceAtLeast(0.0)
        }
}

/**
 * UI State Coordinator.
 * Strictly communicates with abstract AuthRepository and ErpRepository.
 * Does NOT import or reference Room, SQLite, or database entities directly.
 */
class ErpViewModel(
    application: Application,
    private val authRepository: AuthRepository,
    val repository: ErpRepository
) : AndroidViewModel(application) {

    // Fallback constructor for tooling and backward compatibility
    constructor(application: Application) : this(
        application = application,
        authRepository = (application as? ErpApplication)?.appContainer?.authRepository
            ?: DefaultAppContainer(application).authRepository,
        repository = (application as? ErpApplication)?.appContainer?.erpRepository
            ?: DefaultAppContainer(application).erpRepository
    )

    // Current Session from AuthRepository
    val currentUser: StateFlow<User?> = authRepository.currentSession

    private val _currentScreen = MutableStateFlow(ErpScreen.LOGIN)
    val currentScreen: StateFlow<ErpScreen> = _currentScreen.asStateFlow()

    // Navigation Stack for back handling
    private val screenBackStack = mutableListOf<ErpScreen>()

    // Global Snackbar / Toast messages
    private val _userMessage = MutableStateFlow<String?>(null)
    val userMessage: StateFlow<String?> = _userMessage.asStateFlow()

    // Reactive streams from repository abstraction
    val allOrders = repository.allOrders.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val allRetailers = repository.allRetailers.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val allProducts = repository.allProducts.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val lowStockProducts = repository.lowStockProducts.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val allSuppliers = repository.allSuppliers.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val allInvoices = repository.allInvoices.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val allDeliveries = repository.allDeliveries.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val allPayments = repository.allPayments.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val allMovements = repository.allInventoryMovements.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val allSalespersons = repository.allSalespersons.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Order Creation Form State
    private val _selectedRetailerForOrder = MutableStateFlow<Retailer?>(null)
    val selectedRetailerForOrder: StateFlow<Retailer?> = _selectedRetailerForOrder.asStateFlow()

    private val _orderLines = MutableStateFlow<List<OrderLineDraft>>(emptyList())
    val orderLines: StateFlow<List<OrderLineDraft>> = _orderLines.asStateFlow()

    private val _orderNotes = MutableStateFlow("")
    val orderNotes: StateFlow<String> = _orderNotes.asStateFlow()

    private val _orderDiscount = MutableStateFlow(0.0)
    val orderDiscount: StateFlow<Double> = _orderDiscount.asStateFlow()

    fun clearUserMessage() {
        _userMessage.value = null
    }

    fun showMessage(msg: String) {
        _userMessage.value = msg
    }

    // Auth actions
    fun login(emailOrUsername: String, password: String) {
        viewModelScope.launch {
            val result = authRepository.login(emailOrUsername, password)
            if (result.isSuccess) {
                val user = result.getOrThrow()
                screenBackStack.clear()
                _currentScreen.value = ErpScreen.DASHBOARD
                showMessage("Welcome back, ${user.fullName} (${user.role})")
            } else {
                showMessage(result.exceptionOrNull()?.message ?: "Invalid credentials or inactive account.")
            }
        }
    }

    fun quickLoginAsOwner() {
        login("admin", "admin123")
    }

    fun quickLoginAsSalesperson(username: String = "john") {
        login(username, "sales123")
    }

    fun registerUser(
        username: String,
        password: String,
        fullName: String,
        role: UserRole,
        phone: String = "",
        email: String = ""
    ) {
        viewModelScope.launch {
            val user = User(
                username = username.trim(),
                passwordHash = password,
                fullName = fullName.trim(),
                role = role,
                phone = phone,
                email = email,
                isActive = true
            )
            val result = authRepository.register(user)
            if (result.isSuccess) {
                showMessage("Account registered for ${user.fullName}.")
                login(username, password)
            } else {
                showMessage(result.exceptionOrNull()?.message ?: "Registration failed.")
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            screenBackStack.clear()
            _currentScreen.value = ErpScreen.LOGIN
        }
    }

    // Navigation
    fun navigateTo(screen: ErpScreen) {
        if (_currentScreen.value != screen) {
            screenBackStack.add(_currentScreen.value)
            _currentScreen.value = screen
        }
    }

    fun navigateBack(): Boolean {
        if (screenBackStack.isNotEmpty()) {
            val prev = screenBackStack.removeAt(screenBackStack.size - 1)
            _currentScreen.value = prev
            return true
        }
        return false
    }

    // Order Draft management
    fun startNewOrder(preselectedRetailer: Retailer? = null) {
        _selectedRetailerForOrder.value = preselectedRetailer
        _orderLines.value = emptyList()
        _orderNotes.value = ""
        _orderDiscount.value = 0.0
        navigateTo(ErpScreen.CREATE_ORDER)
    }

    fun selectRetailerForOrder(retailer: Retailer) {
        _selectedRetailerForOrder.value = retailer
    }

    fun addProductToOrder(product: Product, quantity: Int = 1) {
        val current = _orderLines.value.toMutableList()
        val existingIndex = current.indexOfFirst { it.product.id == product.id }
        if (existingIndex >= 0) {
            val existing = current[existingIndex]
            current[existingIndex] = existing.copy(quantity = existing.quantity + quantity)
        } else {
            current.add(
                OrderLineDraft(
                    product = product,
                    quantity = quantity,
                    unitPrice = product.sellingPrice,
                    discountPercent = 0.0
                )
            )
        }
        _orderLines.value = current
    }

    fun updateOrderLine(index: Int, quantity: Int, unitPrice: Double, discountPercent: Double) {
        val current = _orderLines.value.toMutableList()
        if (index in current.indices) {
            if (quantity <= 0) {
                current.removeAt(index)
            } else {
                current[index] = current[index].copy(
                    quantity = quantity,
                    unitPrice = unitPrice,
                    discountPercent = discountPercent
                )
            }
            _orderLines.value = current
        }
    }

    fun removeOrderLine(index: Int) {
        val current = _orderLines.value.toMutableList()
        if (index in current.indices) {
            current.removeAt(index)
            _orderLines.value = current
        }
    }

    fun setOrderNotes(notes: String) {
        _orderNotes.value = notes
    }

    fun setOrderDiscount(discount: Double) {
        _orderDiscount.value = discount
    }

    fun submitOrder(asDraft: Boolean = false) {
        val user = currentUser.value ?: return
        val retailer = _selectedRetailerForOrder.value
        if (retailer == null) {
            showMessage("Please select a retailer.")
            return
        }
        val lines = _orderLines.value
        if (lines.isEmpty()) {
            showMessage("Please add at least one product.")
            return
        }

        viewModelScope.launch {
            val subtotal = lines.sumOf { it.total }
            val discount = _orderDiscount.value
            val totalAmount = (subtotal - discount).coerceAtLeast(0.0)

            val orderNumber = "ORD-${System.currentTimeMillis() % 1000000}"
            val status = if (asDraft) OrderStatus.DRAFT else OrderStatus.SUBMITTED

            val order = Order(
                orderNumber = orderNumber,
                retailerId = retailer.id,
                retailerName = retailer.name,
                salespersonId = user.id,
                salespersonName = user.fullName,
                orderDate = System.currentTimeMillis(),
                status = status,
                subtotal = subtotal,
                discount = discount,
                totalAmount = totalAmount,
                notes = _orderNotes.value,
                ownerFeedback = ""
            )

            val items = lines.map {
                OrderItem(
                    orderId = 0,
                    productId = it.product.id,
                    productName = it.product.name,
                    productSku = it.product.sku,
                    quantity = it.quantity,
                    unitPrice = it.unitPrice,
                    discountPercent = it.discountPercent,
                    total = it.total
                )
            }

            repository.createOrder(order, items)
            showMessage(if (asDraft) "Order saved as Draft ($orderNumber)" else "Order submitted for Owner Review ($orderNumber)")
            _orderLines.value = emptyList()
            _selectedRetailerForOrder.value = null
            _orderNotes.value = ""
            navigateTo(ErpScreen.ORDERS)
        }
    }

    // Owner Order Actions
    fun approveOrder(orderId: Long, feedback: String = "") {
        viewModelScope.launch {
            repository.approveOrder(orderId, feedback)
            showMessage("Order #$orderId has been APPROVED.")
        }
    }

    fun rejectOrder(orderId: Long, feedback: String) {
        viewModelScope.launch {
            repository.rejectOrder(orderId, feedback)
            showMessage("Order #$orderId has been REJECTED.")
        }
    }

    fun requestChangesOnOrder(orderId: Long, feedback: String) {
        viewModelScope.launch {
            repository.requestOrderChanges(orderId, feedback)
            showMessage("Requested changes on Order #$orderId.")
        }
    }

    fun generateInvoice(orderId: Long) {
        viewModelScope.launch {
            try {
                repository.generateInvoiceFromOrder(orderId)
                showMessage("Invoice generated & scheduled for delivery!")
            } catch (e: Exception) {
                showMessage("Error generating invoice: ${e.message}")
            }
        }
    }

    // Delivery actions
    fun dispatchOrder(deliveryId: Long, driverName: String, driverPhone: String, notes: String) {
        viewModelScope.launch {
            repository.dispatchDelivery(deliveryId, driverName, driverPhone, notes)
            showMessage("Delivery marked as DISPATCHED.")
        }
    }

    fun completeDelivery(deliveryId: Long, notes: String) {
        viewModelScope.launch {
            repository.completeDelivery(deliveryId, notes)
            showMessage("Delivery COMPLETED. Inventory stock updated!")
        }
    }

    // Retailer / Product / Supplier actions
    fun saveRetailer(retailer: Retailer) {
        viewModelScope.launch {
            if (retailer.id == 0L) {
                repository.saveRetailer(retailer)
                showMessage("Retailer '${retailer.name}' added successfully.")
            } else {
                repository.updateRetailer(retailer)
                showMessage("Retailer '${retailer.name}' updated.")
            }
        }
    }

    fun saveProduct(product: Product) {
        viewModelScope.launch {
            if (product.id == 0L) {
                repository.saveProduct(product)
                showMessage("Product '${product.name}' added.")
            } else {
                repository.updateProduct(product)
                showMessage("Product '${product.name}' updated.")
            }
        }
    }

    fun adjustStock(productId: Long, delta: Int, reason: String) {
        viewModelScope.launch {
            repository.recordStockAdjustment(productId, delta, reason)
            showMessage("Stock adjusted by $delta. Auditable movement logged.")
        }
    }

    fun saveSupplier(supplier: Supplier) {
        viewModelScope.launch {
            if (supplier.id == 0L) {
                repository.saveSupplier(supplier)
                showMessage("Supplier '${supplier.name}' added.")
            } else {
                repository.updateSupplier(supplier)
                showMessage("Supplier '${supplier.name}' updated.")
            }
        }
    }

    fun recordPurchase(supplierId: Long, billNumber: String, items: List<Pair<Product, Int>>, notes: String) {
        viewModelScope.launch {
            repository.createPurchase(supplierId, billNumber, items, notes)
            showMessage("Purchase bill recorded. Stock & payables updated.")
        }
    }

    fun recordRetailerPayment(
        retailerId: Long,
        invoiceId: Long?,
        amount: Double,
        method: PaymentMethod,
        ref: String,
        notes: String
    ) {
        val user = currentUser.value ?: return
        viewModelScope.launch {
            repository.recordRetailerPayment(
                retailerId = retailerId,
                invoiceId = invoiceId,
                amount = amount,
                method = method,
                referenceNumber = ref,
                notes = notes,
                recordedByUserId = user.id,
                recordedByName = user.fullName
            )
            showMessage("Payment of $${String.format("%.2f", amount)} recorded. Balance updated.")
        }
    }

    fun recordSupplierPayment(
        supplierId: Long,
        purchaseId: Long?,
        amount: Double,
        method: PaymentMethod,
        ref: String,
        notes: String
    ) {
        val user = currentUser.value ?: return
        viewModelScope.launch {
            repository.recordSupplierPayment(
                supplierId = supplierId,
                purchaseId = purchaseId,
                amount = amount,
                method = method,
                referenceNumber = ref,
                notes = notes,
                recordedByUserId = user.id,
                recordedByName = user.fullName
            )
            showMessage("Supplier payment of $${String.format("%.2f", amount)} recorded.")
        }
    }

    fun saveUser(user: User) {
        viewModelScope.launch {
            if (user.id == 0L) {
                repository.saveUser(user)
                showMessage("Sales rep '${user.fullName}' added.")
            } else {
                repository.updateUser(user)
                showMessage("Sales rep '${user.fullName}' updated.")
            }
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val app = (this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as ErpApplication)
                ErpViewModel(
                    application = app,
                    authRepository = app.appContainer.authRepository,
                    repository = app.appContainer.erpRepository
                )
            }
        }
    }
}
