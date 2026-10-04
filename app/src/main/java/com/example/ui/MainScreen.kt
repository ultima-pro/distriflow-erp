package com.example.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.model.UserRole
import com.example.ui.components.*
import com.example.ui.screens.*
import com.example.ui.theme.*
import com.example.ui.viewmodel.ErpScreen
import com.example.ui.viewmodel.ErpViewModel
import kotlinx.coroutines.launch

@Composable
fun MainScreen(viewModel: ErpViewModel) {
    val currentUser by viewModel.currentUser.collectAsStateWithLifecycle()
    val currentScreen by viewModel.currentScreen.collectAsStateWithLifecycle()
    val userMessage by viewModel.userMessage.collectAsStateWithLifecycle()

    val orders by viewModel.allOrders.collectAsStateWithLifecycle()
    val retailers by viewModel.allRetailers.collectAsStateWithLifecycle()
    val products by viewModel.allProducts.collectAsStateWithLifecycle()
    val suppliers by viewModel.allSuppliers.collectAsStateWithLifecycle()
    val invoices by viewModel.allInvoices.collectAsStateWithLifecycle()
    val deliveries by viewModel.allDeliveries.collectAsStateWithLifecycle()
    val payments by viewModel.allPayments.collectAsStateWithLifecycle()
    val movements by viewModel.allMovements.collectAsStateWithLifecycle()
    val salespersons by viewModel.allSalespersons.collectAsStateWithLifecycle()
    val lowStockProducts by viewModel.lowStockProducts.collectAsStateWithLifecycle()

    val selectedRetailer by viewModel.selectedRetailerForOrder.collectAsStateWithLifecycle()
    val orderLines by viewModel.orderLines.collectAsStateWithLifecycle()
    val orderNotes by viewModel.orderNotes.collectAsStateWithLifecycle()
    val orderDiscount by viewModel.orderDiscount.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)

    // Handle user messages
    LaunchedEffect(userMessage) {
        userMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearUserMessage()
        }
    }

    // Hardware Back button handling
    BackHandler(enabled = currentScreen != ErpScreen.LOGIN) {
        if (drawerState.isOpen) {
            scope.launch { drawerState.close() }
        } else if (currentScreen != ErpScreen.DASHBOARD) {
            val handled = viewModel.navigateBack()
            if (!handled) {
                viewModel.navigateTo(ErpScreen.DASHBOARD)
            }
        }
    }

    if (currentScreen == ErpScreen.LOGIN || currentUser == null) {
        LoginScreen(
            onLogin = { u, p -> viewModel.login(u, p) },
            onQuickOwnerLogin = { viewModel.quickLoginAsOwner() },
            onQuickSalesLogin = { rep -> viewModel.quickLoginAsSalesperson(rep) },
            onRegisterUser = { u, p, name, role, phone, email ->
                viewModel.registerUser(u, p, name, role, phone, email)
            }
        )
        return
    }

    val isOwner = currentUser?.role == UserRole.OWNER
    val visibleNavItems = NavigationItems.filter { !it.ownerOnly || isOwner }

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val isWideScreen = maxWidth >= 600.dp

        ModalNavigationDrawer(
            drawerState = drawerState,
            gesturesEnabled = !isWideScreen,
            drawerContent = {
                ModalDrawerSheet(
                    drawerContainerColor = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.width(300.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(NavyPrimary)
                            .padding(20.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(Color.White.copy(alpha = 0.2f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.LocalShipping, contentDescription = null, tint = Color.White)
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Text("DistriFlow ERP", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 18.sp)
                        Text(
                            text = "${currentUser?.fullName} (${if (isOwner) "Owner / Admin" else "Sales Rep"})",
                            fontSize = 12.sp,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp)) {
                        items(visibleNavItems) { item ->
                            val selected = currentScreen == item.screen
                            NavigationDrawerItem(
                                icon = { Icon(item.icon, contentDescription = item.screen.title) },
                                label = { Text(item.screen.title, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal) },
                                selected = selected,
                                onClick = {
                                    viewModel.navigateTo(item.screen)
                                    scope.launch { drawerState.close() }
                                },
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }

                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                            HorizontalDivider()
                            Spacer(modifier = Modifier.height(8.dp))
                            NavigationDrawerItem(
                                icon = { Icon(Icons.Default.ExitToApp, contentDescription = null, tint = StatusRed) },
                                label = { Text("Sign Out", color = StatusRed) },
                                selected = false,
                                onClick = {
                                    scope.launch { drawerState.close() }
                                    viewModel.logout()
                                }
                            )
                        }
                    }
                }
            }
        ) {
            Row(modifier = Modifier.fillMaxSize()) {
                // Wide Screen Navigation Rail
                if (isWideScreen) {
                    ErpNavRail(
                        currentScreen = currentScreen,
                        currentUser = currentUser,
                        onSelectScreen = { viewModel.navigateTo(it) },
                        onLogout = { viewModel.logout() }
                    )
                }

                // Main Content Scaffold
                Scaffold(
                    topBar = {
                        ErpTopAppBar(
                            currentScreen = currentScreen,
                            currentUser = currentUser,
                            onOpenDrawer = { scope.launch { drawerState.open() } },
                            onLogout = { viewModel.logout() }
                        )
                    },
                    bottomBar = {
                        if (!isWideScreen && currentScreen != ErpScreen.CREATE_ORDER) {
                            ErpBottomNavBar(
                                currentScreen = currentScreen,
                                currentUser = currentUser,
                                onSelectScreen = { viewModel.navigateTo(it) }
                            )
                        }
                    },
                    snackbarHost = { SnackbarHost(snackbarHostState) },
                    contentWindowInsets = WindowInsets.systemBars
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                            .background(MaterialTheme.colorScheme.background)
                    ) {
                        when (currentScreen) {
                            ErpScreen.LOGIN -> {}
                            ErpScreen.DASHBOARD -> DashboardScreen(
                                currentUser = currentUser!!,
                                orders = orders,
                                retailers = retailers,
                                products = products,
                                suppliers = suppliers,
                                invoices = invoices,
                                deliveries = deliveries,
                                payments = payments,
                                lowStockProducts = lowStockProducts,
                                onNavigate = { viewModel.navigateTo(it) },
                                onStartNewOrderForRetailer = { viewModel.startNewOrder(it) }
                            )
                            ErpScreen.ORDERS -> OrdersScreen(
                                currentUser = currentUser!!,
                                orders = orders,
                                salespersons = salespersons,
                                onApproveOrder = { id, feedback -> viewModel.approveOrder(id, feedback) },
                                onRejectOrder = { id, feedback -> viewModel.rejectOrder(id, feedback) },
                                onRequestChanges = { id, feedback -> viewModel.requestChangesOnOrder(id, feedback) },
                                onGenerateInvoice = { id -> viewModel.generateInvoice(id) },
                                onNavigateToCreateOrder = { viewModel.startNewOrder(null) }
                            )
                            ErpScreen.CREATE_ORDER -> NewOrderScreen(
                                currentUser = currentUser!!,
                                retailers = retailers,
                                products = products,
                                selectedRetailer = selectedRetailer,
                                orderLines = orderLines,
                                orderNotes = orderNotes,
                                orderDiscount = orderDiscount,
                                onSelectRetailer = { viewModel.selectRetailerForOrder(it) },
                                onAddProduct = { prod, qty -> viewModel.addProductToOrder(prod, qty) },
                                onUpdateLine = { idx, qty, price, disc -> viewModel.updateOrderLine(idx, qty, price, disc) },
                                onRemoveLine = { idx -> viewModel.removeOrderLine(idx) },
                                onSetNotes = { viewModel.setOrderNotes(it) },
                                onSetDiscount = { viewModel.setOrderDiscount(it) },
                                onSubmitOrder = { asDraft -> viewModel.submitOrder(asDraft) },
                                onBack = { viewModel.navigateBack() }
                            )
                            ErpScreen.RETAILERS -> RetailersScreen(
                                currentUser = currentUser!!,
                                retailers = retailers,
                                salespersons = salespersons,
                                onSaveRetailer = { viewModel.saveRetailer(it) },
                                onRecordPayment = { retId, invId, amt, method, ref, notes ->
                                    viewModel.recordRetailerPayment(retId, invId, amt, method, ref, notes)
                                },
                                onStartOrderForRetailer = { viewModel.startNewOrder(it) }
                            )
                            ErpScreen.PRODUCTS -> ProductsScreen(
                                currentUser = currentUser!!,
                                products = products,
                                suppliers = suppliers,
                                onSaveProduct = { viewModel.saveProduct(it) },
                                onAdjustStock = { prodId, delta, reason -> viewModel.adjustStock(prodId, delta, reason) }
                            )
                            ErpScreen.SUPPLIERS -> SuppliersScreen(
                                currentUser = currentUser!!,
                                suppliers = suppliers,
                                products = products,
                                onSaveSupplier = { viewModel.saveSupplier(it) },
                                onRecordPurchase = { supId, bill, items, notes -> viewModel.recordPurchase(supId, bill, items, notes) },
                                onRecordSupplierPayment = { supId, purId, amt, method, ref, notes ->
                                    viewModel.recordSupplierPayment(supId, purId, amt, method, ref, notes)
                                }
                            )
                            ErpScreen.INVOICES -> InvoicesScreen(
                                currentUser = currentUser!!,
                                invoices = invoices,
                                onRecordPayment = { retId, invId, amt, method, ref, notes ->
                                    viewModel.recordRetailerPayment(retId, invId, amt, method, ref, notes)
                                }
                            )
                            ErpScreen.DELIVERIES -> DeliveriesScreen(
                                currentUser = currentUser!!,
                                deliveries = deliveries,
                                onDispatch = { id, driver, phone, notes -> viewModel.dispatchOrder(id, driver, phone, notes) },
                                onCompleteDelivery = { id, notes -> viewModel.completeDelivery(id, notes) }
                            )
                            ErpScreen.PAYMENTS -> PaymentsScreen(
                                currentUser = currentUser!!,
                                payments = payments
                            )
                            ErpScreen.INVENTORY -> InventoryAuditScreen(
                                products = products,
                                movements = movements,
                                lowStockProducts = lowStockProducts
                            )
                            ErpScreen.REPORTS -> ReportsScreen(
                                orders = orders,
                                retailers = retailers,
                                suppliers = suppliers,
                                products = products,
                                salespersons = salespersons
                            )
                            ErpScreen.SALESPERSONS -> SalespersonsScreen(
                                salespersons = salespersons,
                                retailers = retailers,
                                orders = orders,
                                payments = payments,
                                onSaveUser = { viewModel.saveUser(it) }
                            )
                        }
                    }
                }
            }
        }
    }
}
