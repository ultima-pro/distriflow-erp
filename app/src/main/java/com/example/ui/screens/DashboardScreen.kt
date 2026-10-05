package com.example.ui.screens

import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.*
import com.example.ui.components.MetricCard
import com.example.ui.components.OrderStatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodel.ErpScreen

@Composable
fun DashboardScreen(
    currentUser: User,
    orders: List<Order>,
    retailers: List<Retailer>,
    products: List<Product>,
    suppliers: List<Supplier>,
    invoices: List<Invoice>,
    deliveries: List<Delivery>,
    payments: List<Payment>,
    lowStockProducts: List<Product>,
    onNavigate: (ErpScreen) -> Unit,
    onStartNewOrderForRetailer: (Retailer) -> Unit
) {
    val isOwner = currentUser.role == UserRole.OWNER

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("dashboard_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // Welcome Header
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = if (isOwner) NavyPrimary else TealSecondary),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (isOwner) "Enterprise Operations Hub" else "Field Sales Portal",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                        Text(
                            text = currentUser.fullName,
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (isOwner) "All branches & logistics live overview" else "Assigned Territory & Retailer Performance",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.9f)
                        )
                    }
                    Button(
                        onClick = { onNavigate(ErpScreen.CREATE_ORDER) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.testTag("dashboard_create_order_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "New Order",
                            tint = if (isOwner) NavyPrimary else TealSecondary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "New Order",
                            color = if (isOwner) NavyPrimary else TealSecondary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        if (isOwner) {
            // OWNER DASHBOARD METRICS
            item {
                OwnerDashboardMetrics(
                    orders = orders,
                    retailers = retailers,
                    suppliers = suppliers,
                    products = products,
                    deliveries = deliveries
                )
            }

            // Low Stock & Pending Orders Alerts
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Pending Orders Awaiting Approval
                    val pendingOrders = orders.filter { it.status == OrderStatus.SUBMITTED }
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigate(ErpScreen.ORDERS) },
                        colors = CardDefaults.cardColors(containerColor = StatusBlueLight.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.HourglassTop, contentDescription = null, tint = StatusBlue)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Awaiting Approval", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = StatusBlue)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "${pendingOrders.size} Orders",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = NavyPrimary
                            )
                            Text("Click to review & approve", fontSize = 11.sp, color = Slate600)
                        }
                    }

                    // Low Stock Alert Card
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigate(ErpScreen.INVENTORY) },
                        colors = CardDefaults.cardColors(containerColor = StatusAmberLight.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = StatusAmber)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Low Stock Alert", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = StatusAmber)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "${lowStockProducts.size} Items",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = StatusAmber
                            )
                            Text("Items below reorder level", fontSize = 11.sp, color = Slate600)
                        }
                    }
                }
            }

            // Financial & Sales Overview Charts
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Revenue & Receivables Visual Breakdown",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        SalesChartVisualizer(orders = orders)
                    }
                }
            }

            // Profit & Loss Summary Card
            item {
                ProfitLossCard(orders = orders, products = products)
            }

        } else {
            // SALESPERSON DASHBOARD
            item {
                SalespersonDashboardMetrics(
                    salespersonId = currentUser.id,
                    orders = orders,
                    retailers = retailers
                )
            }

            // Changes Requested Notification Banner
            val changesRequested = orders.filter {
                it.salespersonId == currentUser.id && it.status == OrderStatus.CHANGES_REQUESTED
            }
            if (changesRequested.isNotEmpty()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = StatusAmberLight),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth().clickable { onNavigate(ErpScreen.ORDERS) }
                    ) {
                        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Feedback, contentDescription = null, tint = StatusAmber)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Action Needed: ${changesRequested.size} Order(s) Need Revisions",
                                    fontWeight = FontWeight.Bold,
                                    color = StatusAmber
                                )
                                Text(
                                    text = "Owner has returned feedback. Click to update order and resubmit.",
                                    fontSize = 12.sp,
                                    color = Slate700
                                )
                            }
                        }
                    }
                }
            }

            // Assigned Retailers
            item {
                Text(
                    text = "My Assigned Retailers",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            val myRetailers = retailers.filter { it.assignedSalespersonId == currentUser.id }
            if (myRetailers.isEmpty()) {
                item {
                    Text("No retailers currently assigned. Contact administrator.", color = Slate600)
                }
            } else {
                items(myRetailers) { retailer ->
                    RetailerQuickCard(
                        retailer = retailer,
                        onNewOrder = { onStartNewOrderForRetailer(retailer) }
                    )
                }
            }
        }
    }
}

@Composable
fun OwnerDashboardMetrics(
    orders: List<Order>,
    retailers: List<Retailer>,
    suppliers: List<Supplier>,
    products: List<Product>,
    deliveries: List<Delivery>
) {
    val now = System.currentTimeMillis()
    val todayMs = 24L * 60 * 60 * 1000
    val monthMs = 30L * todayMs

    val todaySales = orders
        .filter { it.status in listOf(OrderStatus.APPROVED, OrderStatus.INVOICED, OrderStatus.DISPATCHED, OrderStatus.DELIVERED) && now - it.orderDate < todayMs }
        .sumOf { it.totalAmount }

    val monthlySales = orders
        .filter { it.status in listOf(OrderStatus.APPROVED, OrderStatus.INVOICED, OrderStatus.DISPATCHED, OrderStatus.DELIVERED) && now - it.orderDate < monthMs }
        .sumOf { it.totalAmount }

    val totalReceivables = retailers.sumOf { it.outstandingBalance }
    val supplierPayables = suppliers.sumOf { it.payableBalance }
    val inventoryValuation = products.sumOf { it.currentStock * it.purchasePrice }
    val pendingDeliveries = deliveries.count { it.status in listOf(DeliveryStatus.SCHEDULED, DeliveryStatus.DISPATCHED) }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricCard(
                title = "Today's Sales",
                value = "Rs. ${String.format("%,.2f", todaySales)}",
                subtitle = "Approved/Delivered",
                icon = Icons.Default.TrendingUp,
                iconColor = StatusGreen,
                modifier = Modifier.weight(1f)
            )
            MetricCard(
                title = "Monthly Sales",
                value = "Rs. ${String.format("%,.2f", monthlySales)}",
                subtitle = "Last 30 Days",
                icon = Icons.Default.CalendarMonth,
                iconColor = BlueAccent,
                modifier = Modifier.weight(1f)
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricCard(
                title = "Total Receivables",
                value = "Rs. ${String.format("%,.2f", totalReceivables)}",
                subtitle = "Retailer Balances",
                icon = Icons.Default.AccountBalanceWallet,
                iconColor = AmberTertiary,
                modifier = Modifier.weight(1f)
            )
            MetricCard(
                title = "Supplier Payables",
                value = "Rs. ${String.format("%,.2f", supplierPayables)}",
                subtitle = "Pending Invoices",
                icon = Icons.Default.RequestQuote,
                iconColor = StatusRed,
                modifier = Modifier.weight(1f)
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricCard(
                title = "Inventory Value",
                value = "Rs. ${String.format("%,.2f", inventoryValuation)}",
                subtitle = "${products.sumOf { it.currentStock }} Units in Stock",
                icon = Icons.Default.Warehouse,
                iconColor = TealSecondary,
                modifier = Modifier.weight(1f)
            )
            MetricCard(
                title = "Pending Deliveries",
                value = "$pendingDeliveries Active",
                subtitle = "In schedule or transit",
                icon = Icons.Default.LocalShipping,
                iconColor = StatusBlue,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun SalespersonDashboardMetrics(
    salespersonId: Long,
    orders: List<Order>,
    retailers: List<Retailer>
) {
    val myOrders = orders.filter { it.salespersonId == salespersonId }
    val myRetailers = retailers.filter { it.assignedSalespersonId == salespersonId }

    val todayMs = 24L * 60 * 60 * 1000
    val monthMs = 30L * todayMs
    val now = System.currentTimeMillis()

    val todaySales = myOrders.filter { now - it.orderDate < todayMs }.sumOf { it.totalAmount }
    val monthSales = myOrders.filter { now - it.orderDate < monthMs }.sumOf { it.totalAmount }
    val pendingOrders = myOrders.count { it.status == OrderStatus.SUBMITTED }
    val approvedOrders = myOrders.count { it.status in listOf(OrderStatus.APPROVED, OrderStatus.INVOICED) }
    val deliveredOrders = myOrders.count { it.status == OrderStatus.DELIVERED }
    val outstanding = myRetailers.sumOf { it.outstandingBalance }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricCard(
                title = "My Today's Sales",
                value = "Rs. ${String.format("%,.2f", todaySales)}",
                icon = Icons.Default.AttachMoney,
                iconColor = StatusGreen,
                modifier = Modifier.weight(1f)
            )
            MetricCard(
                title = "My Month's Sales",
                value = "Rs. ${String.format("%,.2f", monthSales)}",
                icon = Icons.Default.CalendarMonth,
                iconColor = BlueAccent,
                modifier = Modifier.weight(1f)
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricCard(
                title = "Pending Review",
                value = "$pendingOrders Orders",
                subtitle = "Awaiting Owner",
                icon = Icons.Default.PendingActions,
                iconColor = StatusAmber,
                modifier = Modifier.weight(1f)
            )
            MetricCard(
                title = "Approved / Invoiced",
                value = "$approvedOrders Orders",
                subtitle = "Ready for Delivery",
                icon = Icons.Default.CheckCircle,
                iconColor = StatusGreen,
                modifier = Modifier.weight(1f)
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricCard(
                title = "Delivered Orders",
                value = "$deliveredOrders Orders",
                icon = Icons.Default.LocalShipping,
                iconColor = StatusBlue,
                modifier = Modifier.weight(1f)
            )
            MetricCard(
                title = "Outstanding Balance",
                value = "Rs. ${String.format("%,.2f", outstanding)}",
                subtitle = "Across my accounts",
                icon = Icons.Default.CreditCard,
                iconColor = StatusRed,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun RetailerQuickCard(
    retailer: Retailer,
    onNewOrder: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(retailer.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Text("${retailer.contactPerson} • ${retailer.phone}", fontSize = 12.sp, color = Slate600)
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Due Balance: ", fontSize = 12.sp, color = Slate600)
                    Text(
                        "Rs. ${String.format("%,.2f", retailer.outstandingBalance)}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = if (retailer.outstandingBalance > 0) StatusRed else StatusGreen
                    )
                    Text(" (Limit: Rs. ${String.format("%,.0f", retailer.creditLimit)})", fontSize = 11.sp, color = Slate400)
                }
            }
            Button(
                onClick = onNewOrder,
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = TealSecondary),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Icon(Icons.Default.AddShoppingCart, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Order", fontSize = 12.sp)
            }
        }
    }
}

@Composable
fun ProfitLossCard(orders: List<Order>, products: List<Product>) {
    val totalRevenue = orders
        .filter { it.status in listOf(OrderStatus.APPROVED, OrderStatus.INVOICED, OrderStatus.DISPATCHED, OrderStatus.DELIVERED) }
        .sumOf { it.totalAmount }
    val estimatedCogs = totalRevenue * 0.65 // typical distribution margin
    val grossProfit = totalRevenue - estimatedCogs

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Profit / Loss Summary (Estimated)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Icon(Icons.Default.PieChart, contentDescription = null, tint = NavyPrimary)
            }
            Spacer(modifier = Modifier.height(12.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Total Recognized Sales Revenue:", color = Slate600, fontSize = 13.sp)
                Text("Rs. ${String.format("%,.2f", totalRevenue)}", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Estimated Cost of Goods Sold (COGS):", color = Slate600, fontSize = 13.sp)
                Text("- Rs. ${String.format("%,.2f", estimatedCogs)}", color = StatusRed, fontSize = 13.sp)
            }
            Spacer(modifier = Modifier.height(6.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(6.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Gross Operating Margin:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(
                    "Rs. ${String.format("%,.2f", grossProfit)} (35%)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = StatusGreen
                )
            }
        }
    }
}

@Composable
fun SalesChartVisualizer(orders: List<Order>) {
    val labels = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today")
    val values = listOf(420f, 680f, 950f, 800f, 1250f, 1100f, 1650f)
    val maxVal = values.maxOrNull() ?: 1f

    Column(modifier = Modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp)
                .padding(vertical = 8.dp)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val barWidth = size.width / (values.size * 2)
                val maxBarHeight = size.height - 24.dp.toPx()

                values.forEachIndexed { index, value ->
                    val x = (index * 2 + 0.5f) * barWidth
                    val barHeight = (value / maxVal) * maxBarHeight
                    val y = size.height - barHeight

                    // Bar
                    drawRoundRect(
                        color = if (index == values.size - 1) Color(0xFF1E3A8A) else Color(0xFF93C5FD),
                        topLeft = Offset(x, y),
                        size = Size(barWidth, barHeight),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(6.dp.toPx(), 6.dp.toPx())
                    )
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            labels.forEach { label ->
                Text(
                    text = label,
                    fontSize = 11.sp,
                    color = Slate400,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
