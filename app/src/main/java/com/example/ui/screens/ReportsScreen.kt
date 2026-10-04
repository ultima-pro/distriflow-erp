package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.*
import com.example.ui.theme.*

enum class ReportPeriod(val label: String, val days: Int) {
    TODAY("Today", 1),
    WEEK("Last 7 Days", 7),
    MONTH("Last 30 Days", 30),
    ALL_TIME("All Time", 365)
}

@Composable
fun ReportsScreen(
    orders: List<Order>,
    retailers: List<Retailer>,
    suppliers: List<Supplier>,
    products: List<Product>,
    salespersons: List<User>
) {
    var selectedPeriod by remember { mutableStateOf(ReportPeriod.MONTH) }

    val now = System.currentTimeMillis()
    val periodMs = selectedPeriod.days * 24L * 60 * 60 * 1000

    val filteredOrders = remember(orders, selectedPeriod) {
        orders.filter {
            it.status in listOf(OrderStatus.APPROVED, OrderStatus.INVOICED, OrderStatus.DISPATCHED, OrderStatus.DELIVERED) &&
                    (selectedPeriod == ReportPeriod.ALL_TIME || (now - it.orderDate) <= periodMs)
        }
    }

    val totalSales = filteredOrders.sumOf { it.totalAmount }
    val estimatedCogs = totalSales * 0.65
    val grossProfit = totalSales - estimatedCogs
    val totalReceivables = retailers.sumOf { it.outstandingBalance }
    val totalPayables = suppliers.sumOf { it.payableBalance }
    val inventoryValue = products.sumOf { it.currentStock * it.purchasePrice }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("reports_screen_container"),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(vertical = 14.dp)
    ) {
        // Period filter chips
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(ReportPeriod.values()) { period ->
                    FilterChip(
                        selected = selectedPeriod == period,
                        onClick = { selectedPeriod = period },
                        label = { Text(period.label) },
                        modifier = Modifier.testTag("report_period_${period.name.lowercase()}")
                    )
                }
            }
        }

        // Executive P&L Snapshot
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text("Executive Profit & Loss Statement", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("Calculated for: ${selectedPeriod.label}", fontSize = 12.sp, color = Slate600)
                    Spacer(modifier = Modifier.height(14.dp))

                    ReportRow("Gross Sales Revenue", "$${String.format("%,.2f", totalSales)}", StatusGreen, isBold = true)
                    Spacer(modifier = Modifier.height(6.dp))
                    ReportRow("Less: Cost of Goods Sold (COGS)", "- $${String.format("%,.2f", estimatedCogs)}", StatusRed)
                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(8.dp))
                    ReportRow("Gross Operating Margin", "$${String.format("%,.2f", grossProfit)}", NavyPrimary, isBold = true, isLarge = true)
                }
            }
        }

        // Balance Sheet Snapshot (Receivables vs Payables vs Inventory)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text("Working Capital & Asset Overview", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(12.dp))

                    ReportRow("Current Inventory Asset Valuation", "$${String.format("%,.2f", inventoryValue)}", NavyPrimary)
                    Spacer(modifier = Modifier.height(6.dp))
                    ReportRow("Accounts Receivable (Retailers Owe)", "$${String.format("%,.2f", totalReceivables)}", AmberTertiary)
                    Spacer(modifier = Modifier.height(6.dp))
                    ReportRow("Accounts Payable (Owed to Suppliers)", "$${String.format("%,.2f", totalPayables)}", StatusRed)
                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(8.dp))
                    val netPosition = (inventoryValue + totalReceivables) - totalPayables
                    ReportRow("Net Liquid Distribution Position", "$${String.format("%,.2f", netPosition)}", if (netPosition >= 0) StatusGreen else StatusRed, isBold = true)
                }
            }
        }

        // Sales by Salesperson Breakdown
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text("Sales Rep Performance", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(12.dp))

                    if (salespersons.isEmpty()) {
                        Text("No salespersons found.", color = Slate600)
                    } else {
                        val maxSales = salespersons.maxOfOrNull { rep ->
                            filteredOrders.filter { it.salespersonId == rep.id }.sumOf { it.totalAmount }
                        }?.coerceAtLeast(1.0) ?: 1.0

                        salespersons.forEach { rep ->
                            val repSales = filteredOrders.filter { it.salespersonId == rep.id }.sumOf { it.totalAmount }
                            val repOrdersCount = filteredOrders.count { it.salespersonId == rep.id }
                            val fraction = (repSales / maxSales).toFloat().coerceIn(0.05f, 1f)

                            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(rep.fullName, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                    Text("$${String.format("%,.2f", repSales)} ($repOrdersCount orders)", fontSize = 12.sp, color = NavyPrimary, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                LinearProgressIndicator(
                                    progress = { fraction },
                                    modifier = Modifier.fillMaxWidth().height(8.dp),
                                    color = TealSecondary,
                                    trackColor = Slate200,
                                    strokeCap = androidx.compose.ui.graphics.StrokeCap.Round
                                )
                            }
                        }
                    }
                }
            }
        }

        // Top Retailers by Order Volume
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text("Top Retailer Volume", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(12.dp))

                    val topRetailers = retailers.map { ret ->
                        val sales = filteredOrders.filter { it.retailerId == ret.id }.sumOf { it.totalAmount }
                        ret to sales
                    }.sortedByDescending { it.second }.take(5)

                    topRetailers.forEach { (ret, sales) ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(ret.name, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                Text("Outstanding: $${String.format("%,.2f", ret.outstandingBalance)}", fontSize = 11.sp, color = Slate600)
                            }
                            Text("$${String.format("%,.2f", sales)}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                        }
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = Slate100)
                    }
                }
            }
        }
    }
}

@Composable
fun ReportRow(
    label: String,
    value: String,
    valueColor: Color = Slate900,
    isBold: Boolean = false,
    isLarge: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = if (isLarge) 15.sp else 13.sp,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Normal,
            color = if (isBold) Slate900 else Slate600
        )
        Text(
            text = value,
            fontSize = if (isLarge) 17.sp else 13.sp,
            fontWeight = FontWeight.Bold,
            color = valueColor
        )
    }
}
