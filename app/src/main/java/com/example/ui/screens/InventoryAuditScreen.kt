package com.example.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warehouse
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.InventoryMovement
import com.example.data.model.MovementType
import com.example.data.model.Product
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun InventoryAuditScreen(
    products: List<Product>,
    movements: List<InventoryMovement>,
    lowStockProducts: List<Product>
) {
    val totalInventoryValue = products.sumOf { it.currentStock * it.purchasePrice }
    val totalUnits = products.sumOf { it.currentStock }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("inventory_audit_screen_container")
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        // Inventory Valuation Summary Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = NavyPrimary)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Total Inventory Valuation", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                        Text("$${String.format("%,.2f", totalInventoryValue)}", fontWeight = FontWeight.Bold, fontSize = 24.sp, color = Color.White)
                    }
                    Surface(shape = RoundedCornerShape(8.dp), color = Color.White.copy(alpha = 0.2f)) {
                        Text("$totalUnits Units in Stock", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.padding(8.dp))
                    }
                }
            }
        }

        // Low stock warning banner if any
        if (lowStockProducts.isNotEmpty()) {
            Spacer(modifier = Modifier.height(10.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = StatusAmberLight)
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = StatusAmber)
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text("${lowStockProducts.size} Items Below Minimum Stock Level", fontWeight = FontWeight.Bold, color = StatusAmber, fontSize = 13.sp)
                        Text(lowStockProducts.joinToString(", ") { "${it.name} (${it.currentStock} left)" }, fontSize = 11.sp, color = Slate700)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))
        Text("Auditable Stock Movement Ledger", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))

        if (movements.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                Text("No inventory movements recorded yet.", color = Slate600)
            }
        } else {
            val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(bottom = 30.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(movements) { mov ->
                    val isPositive = mov.quantity > 0
                    val (tagColor, tagBg) = when (mov.movementType) {
                        MovementType.PURCHASE_RECEIPT -> Pair(StatusGreen, StatusGreenLight)
                        MovementType.ORDER_DELIVERY -> Pair(StatusBlue, StatusBlueLight)
                        MovementType.ADJUSTMENT_IN -> Pair(TealSecondary, Color(0xFFCCFBF1))
                        MovementType.ADJUSTMENT_OUT -> Pair(StatusRed, StatusRedLight)
                    }

                    Card(
                        modifier = Modifier.fillMaxWidth().testTag("movement_card_${mov.id}"),
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(shape = RoundedCornerShape(6.dp), color = tagBg) {
                                        Text(
                                            text = mov.movementType.name.replace("_", " "),
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = tagColor,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(mov.productName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }

                                Text(
                                    text = "${if (isPositive) "+" else ""}${mov.quantity}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = if (isPositive) StatusGreen else StatusRed
                                )
                            }

                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Stock: ${mov.previousStock} → ${mov.newStock}", fontSize = 11.sp, color = Slate600)
                                Text(mov.referenceNumber, fontSize = 11.sp, color = NavyPrimary, fontWeight = FontWeight.SemiBold)
                            }

                            if (mov.reasonOrNotes.isNotBlank()) {
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("Reason: ${mov.reasonOrNotes}", fontSize = 11.sp, color = Slate600)
                            }

                            Text(dateFormat.format(Date(mov.timestamp)), fontSize = 10.sp, color = Slate400)
                        }
                    }
                }
            }
        }
    }
}
