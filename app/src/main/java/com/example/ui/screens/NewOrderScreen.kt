package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
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
import com.example.data.model.*
import com.example.ui.theme.*
import com.example.ui.viewmodel.OrderLineDraft

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewOrderScreen(
    currentUser: User,
    retailers: List<Retailer>,
    products: List<Product>,
    selectedRetailer: Retailer?,
    orderLines: List<OrderLineDraft>,
    orderNotes: String,
    orderDiscount: Double,
    onSelectRetailer: (Retailer) -> Unit,
    onAddProduct: (Product, Int) -> Unit,
    onUpdateLine: (Int, Int, Double, Double) -> Unit,
    onRemoveLine: (Int) -> Unit,
    onSetNotes: (String) -> Unit,
    onSetDiscount: (Double) -> Unit,
    onSubmitOrder: (Boolean) -> Unit, // Boolean asDraft
    onBack: () -> Unit
) {
    val isOwner = currentUser.role == UserRole.OWNER
    val availableRetailers = if (isOwner) retailers else retailers.filter { it.assignedSalespersonId == currentUser.id }

    var showRetailerPicker by remember { mutableStateOf(false) }
    var showProductPicker by remember { mutableStateOf(false) }
    var productSearchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }

    val subtotal = orderLines.sumOf { it.total }
    val finalTotal = (subtotal - orderDiscount).coerceAtLeast(0.0)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Sales Order", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .testTag("new_order_screen"),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(bottom = 90.dp)
        ) {
            // Retailer Selection Card
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showRetailerPicker = true }
                        .testTag("select_retailer_card"),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Retailer / Customer *", style = MaterialTheme.typography.labelMedium, color = Slate600)
                            Spacer(modifier = Modifier.height(4.dp))
                            if (selectedRetailer != null) {
                                Text(selectedRetailer.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text(
                                    "${selectedRetailer.contactPerson} • ${selectedRetailer.city}",
                                    fontSize = 12.sp,
                                    color = Slate600
                                )
                                Text(
                                    "Balance: $${String.format("%,.2f", selectedRetailer.outstandingBalance)} / Limit: $${String.format("%,.0f", selectedRetailer.creditLimit)}",
                                    fontSize = 11.sp,
                                    color = if (selectedRetailer.outstandingBalance >= selectedRetailer.creditLimit) StatusRed else StatusGreen
                                )
                            } else {
                                Text("Tap to select a retailer", color = Slate400, fontSize = 15.sp)
                            }
                        }
                        Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = NavyPrimary)
                    }
                }
            }

            // Products Header & Add Button
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Order Items (${orderLines.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Button(
                        onClick = { showProductPicker = true },
                        colors = ButtonDefaults.buttonColors(containerColor = TealSecondary),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.testTag("add_item_btn")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Add Product")
                    }
                }
            }

            // Line Items List
            if (orderLines.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Slate100),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No items added yet. Click 'Add Product' above.", color = Slate600, fontSize = 13.sp)
                        }
                    }
                }
            } else {
                itemsIndexed(orderLines) { index, line ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("order_line_$index"),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(line.product.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("SKU: ${line.product.sku} • Stock: ${line.product.currentStock} ${line.product.unit}", fontSize = 11.sp, color = Slate600)
                                }
                                IconButton(
                                    onClick = { onRemoveLine(index) },
                                    modifier = Modifier.testTag("remove_line_${index}_btn")
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = "Remove", tint = StatusRed, modifier = Modifier.size(20.dp))
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Qty modifier
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    IconButton(
                                        onClick = {
                                            onUpdateLine(index, line.quantity - 1, line.unitPrice, line.discountPercent)
                                        },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.Remove, contentDescription = "Decrease")
                                    }
                                    Text(
                                        text = "${line.quantity}",
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp)
                                    )
                                    IconButton(
                                        onClick = {
                                            onUpdateLine(index, line.quantity + 1, line.unitPrice, line.discountPercent)
                                        },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.Add, contentDescription = "Increase")
                                    }
                                }

                                Text(
                                    text = "@ $${String.format("%.2f", line.unitPrice)}",
                                    fontSize = 13.sp,
                                    color = Slate600
                                )

                                Text(
                                    text = "$${String.format("%,.2f", line.total)}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = NavyPrimary
                                )
                            }
                        }
                    }
                }
            }

            // Summary & Financials
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Order Summary", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Subtotal:", color = Slate600, fontSize = 13.sp)
                            Text("$${String.format("%,.2f", subtotal)}", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Discount ($):", color = Slate600, fontSize = 13.sp)
                            Text("- $${String.format("%,.2f", orderDiscount)}", color = StatusRed, fontSize = 13.sp)
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        HorizontalDivider()
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Final Total:", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text(
                                "$${String.format("%,.2f", finalTotal)}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp,
                                color = NavyPrimary
                            )
                        }
                    }
                }
            }

            // Notes field
            item {
                OutlinedTextField(
                    value = orderNotes,
                    onValueChange = onSetNotes,
                    label = { Text("Order Notes & Delivery Instructions") },
                    placeholder = { Text("e.g. Deliver before 11am, contact manager at back dock") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("order_notes_input"),
                    shape = RoundedCornerShape(12.dp),
                    minLines = 2
                )
            }

            // Action Buttons
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { onSubmitOrder(true) },
                        enabled = selectedRetailer != null && orderLines.isNotEmpty(),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("save_draft_button"),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Save Draft")
                    }

                    Button(
                        onClick = { onSubmitOrder(false) },
                        enabled = selectedRetailer != null && orderLines.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("submit_order_button"),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Submit for Review", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Retailer Picker Sheet / Dialog
    if (showRetailerPicker) {
        AlertDialog(
            onDismissRequest = { showRetailerPicker = false },
            title = { Text("Select Retailer") },
            text = {
                LazyColumn(modifier = Modifier.heightIn(max = 350.dp)) {
                    items(availableRetailers) { retailer ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable {
                                    onSelectRetailer(retailer)
                                    showRetailerPicker = false
                                },
                            colors = CardDefaults.cardColors(containerColor = Slate50)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(retailer.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("${retailer.address} • ${retailer.phone}", fontSize = 11.sp, color = Slate600)
                                Text("Outstanding: $${String.format("%,.2f", retailer.outstandingBalance)}", fontSize = 11.sp, color = StatusRed)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showRetailerPicker = false }) { Text("Close") }
            }
        )
    }

    // Product Picker Dialog
    if (showProductPicker) {
        val filteredProducts = products.filter { p ->
            (productSearchQuery.isBlank() || p.name.contains(productSearchQuery, ignoreCase = true) || p.sku.contains(productSearchQuery, ignoreCase = true)) &&
                    (selectedCategory == null || p.category == selectedCategory)
        }

        AlertDialog(
            onDismissRequest = { showProductPicker = false },
            title = { Text("Select Product") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = productSearchQuery,
                        onValueChange = { productSearchQuery = it },
                        placeholder = { Text("Search product name, SKU...") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    LazyColumn(modifier = Modifier.heightIn(max = 350.dp)) {
                        items(filteredProducts) { prod ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .clickable {
                                        onAddProduct(prod, 1)
                                        showProductPicker = false
                                    },
                                colors = CardDefaults.cardColors(containerColor = Slate50)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(10.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(prod.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        Text("${prod.sku} • Stock: ${prod.currentStock} ${prod.unit}", fontSize = 11.sp, color = if (prod.currentStock <= prod.minStockLevel) StatusRed else StatusGreen)
                                    }
                                    Text(
                                        "$${String.format("%.2f", prod.sellingPrice)}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = NavyPrimary
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showProductPicker = false }) { Text("Cancel") }
            }
        )
    }
}
