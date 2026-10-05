package com.example.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.example.data.model.Product
import com.example.data.model.Supplier
import com.example.data.model.User
import com.example.data.model.UserRole
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductsScreen(
    currentUser: User,
    products: List<Product>,
    suppliers: List<Supplier>,
    onSaveProduct: (Product) -> Unit,
    onAdjustStock: (Long, Int, String) -> Unit
) {
    val isOwner = currentUser.role == UserRole.OWNER
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var showAddEditDialog by remember { mutableStateOf(false) }
    var editingProduct by remember { mutableStateOf<Product?>(null) }
    var adjustingProduct by remember { mutableStateOf<Product?>(null) }

    val categories = remember(products) { products.map { it.category }.distinct() }

    val filteredProducts = remember(products, searchQuery, selectedCategory) {
        products.filter { p ->
            val matchesSearch = searchQuery.isBlank() ||
                    p.name.contains(searchQuery, ignoreCase = true) ||
                    p.sku.contains(searchQuery, ignoreCase = true)
            val matchesCategory = selectedCategory == null || p.category == selectedCategory
            matchesSearch && matchesCategory
        }
    }

    Scaffold(
        floatingActionButton = {
            if (isOwner) {
                FloatingActionButton(
                    onClick = {
                        editingProduct = null
                        showAddEditDialog = true
                    },
                    containerColor = NavyPrimary,
                    contentColor = Color.White,
                    modifier = Modifier.testTag("add_product_fab")
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Product")
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .testTag("products_screen_container")
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Search
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("product_search_input"),
                placeholder = { Text("Search products, SKU...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Categories
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    FilterChip(
                        selected = selectedCategory == null,
                        onClick = { selectedCategory = null },
                        label = { Text("All (${products.size})") }
                    )
                }
                items(categories) { cat ->
                    FilterChip(
                        selected = selectedCategory == cat,
                        onClick = { selectedCategory = if (selectedCategory == cat) null else cat },
                        label = { Text(cat) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            if (filteredProducts.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No products found.", color = Slate600)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 80.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredProducts) { product ->
                        ProductItemCard(
                            product = product,
                            isOwner = isOwner,
                            onEdit = {
                                editingProduct = product
                                showAddEditDialog = true
                            },
                            onAdjust = { adjustingProduct = product }
                        )
                    }
                }
            }
        }
    }

    // Add / Edit Product Dialog
    if (showAddEditDialog) {
        var sku by remember { mutableStateOf(editingProduct?.sku ?: "") }
        var name by remember { mutableStateOf(editingProduct?.name ?: "") }
        var category by remember { mutableStateOf(editingProduct?.category ?: "Beverages") }
        var unit by remember { mutableStateOf(editingProduct?.unit ?: "pcs") }
        var purchasePriceStr by remember { mutableStateOf(editingProduct?.purchasePrice?.toString() ?: "") }
        var sellingPriceStr by remember { mutableStateOf(editingProduct?.sellingPrice?.toString() ?: "") }
        var stockStr by remember { mutableStateOf(editingProduct?.currentStock?.toString() ?: "0") }
        var minStockStr by remember { mutableStateOf(editingProduct?.minStockLevel?.toString() ?: "10") }
        var selectedSupplierId by remember { mutableStateOf(editingProduct?.supplierId ?: suppliers.firstOrNull()?.id) }

        AlertDialog(
            onDismissRequest = { showAddEditDialog = false },
            title = { Text(if (editingProduct == null) "New Product" else "Edit Product") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = sku,
                        onValueChange = { sku = it },
                        label = { Text("SKU / Code *") },
                        modifier = Modifier.fillMaxWidth().testTag("product_sku_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Product Name *") },
                        modifier = Modifier.fillMaxWidth().testTag("product_name_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = category,
                            onValueChange = { category = it },
                            label = { Text("Category") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = unit,
                            onValueChange = { unit = it },
                            label = { Text("Unit (box, pcs)") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = purchasePriceStr,
                            onValueChange = { purchasePriceStr = it },
                            label = { Text("Buy Price (Rs.)") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = sellingPriceStr,
                            onValueChange = { sellingPriceStr = it },
                            label = { Text("Sell Price (Rs.) *") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = stockStr,
                            onValueChange = { stockStr = it },
                            label = { Text("Current Stock") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = minStockStr,
                            onValueChange = { minStockStr = it },
                            label = { Text("Min Level") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val buyPrice = purchasePriceStr.toDoubleOrNull() ?: 0.0
                        val sellPrice = sellingPriceStr.toDoubleOrNull() ?: 0.0
                        val stock = stockStr.toIntOrNull() ?: 0
                        val minStock = minStockStr.toIntOrNull() ?: 10
                        val supplierName = suppliers.find { it.id == selectedSupplierId }?.name ?: ""

                        val prod = Product(
                            id = editingProduct?.id ?: 0L,
                            sku = sku,
                            name = name,
                            category = category,
                            unit = unit,
                            purchasePrice = buyPrice,
                            sellingPrice = sellPrice,
                            currentStock = stock,
                            minStockLevel = minStock,
                            supplierId = selectedSupplierId,
                            supplierName = supplierName,
                            isActive = true
                        )
                        onSaveProduct(prod)
                        showAddEditDialog = false
                    },
                    enabled = sku.isNotBlank() && name.isNotBlank() && (sellingPriceStr.toDoubleOrNull() ?: 0.0) > 0,
                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                    modifier = Modifier.testTag("save_product_button")
                ) {
                    Text("Save Product")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddEditDialog = false }) { Text("Cancel") }
            }
        )
    }

    // Stock Adjustment Dialog
    adjustingProduct?.let { product ->
        var deltaStr by remember { mutableStateOf("") }
        var isAddition by remember { mutableStateOf(true) }
        var reason by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { adjustingProduct = null },
            title = { Text("Stock Adjustment: ${product.name}") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Current Stock: ${product.currentStock} ${product.unit}", fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = isAddition,
                            onClick = { isAddition = true },
                            label = { Text("+ Stock In / Found") },
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            selected = !isAddition,
                            onClick = { isAddition = false },
                            label = { Text("- Stock Out / Damaged") },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = deltaStr,
                        onValueChange = { deltaStr = it },
                        label = { Text("Quantity Units *") },
                        modifier = Modifier.fillMaxWidth().testTag("stock_adjustment_qty_input"),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = reason,
                        onValueChange = { reason = it },
                        label = { Text("Auditable Reason *") },
                        placeholder = { Text("e.g. Physical warehouse recount, damaged boxes") },
                        modifier = Modifier.fillMaxWidth().testTag("stock_adjustment_reason_input"),
                        minLines = 2
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val qty = deltaStr.toIntOrNull() ?: 0
                        val delta = if (isAddition) qty else -qty
                        if (qty > 0 && reason.isNotBlank()) {
                            onAdjustStock(product.id, delta, reason)
                            adjustingProduct = null
                        }
                    },
                    enabled = (deltaStr.toIntOrNull() ?: 0) > 0 && reason.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                    modifier = Modifier.testTag("confirm_stock_adjustment_btn")
                ) {
                    Text("Apply Adjustment")
                }
            },
            dismissButton = {
                TextButton(onClick = { adjustingProduct = null }) { Text("Cancel") }
            }
        )
    }
}

@Composable
fun ProductItemCard(
    product: Product,
    isOwner: Boolean,
    onEdit: () -> Unit,
    onAdjust: () -> Unit
) {
    val isLowStock = product.currentStock <= product.minStockLevel

    Card(
        modifier = Modifier.fillMaxWidth().testTag("product_card_${product.id}"),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(product.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Text("SKU: ${product.sku} • ${product.category}", fontSize = 12.sp, color = Slate600)
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (isLowStock) StatusAmberLight else StatusGreenLight
                ) {
                    Text(
                        text = "${product.currentStock} ${product.unit}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = if (isLowStock) StatusAmber else StatusGreen,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Column {
                        Text("Selling Price", fontSize = 11.sp, color = Slate400)
                        Text("Rs. ${String.format("%.2f", product.sellingPrice)}", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyPrimary)
                    }
                    if (isOwner) {
                        Column {
                            Text("Cost Price", fontSize = 11.sp, color = Slate400)
                            Text("Rs. ${String.format("%.2f", product.purchasePrice)}", fontSize = 13.sp, color = Slate600)
                        }
                    }
                }

                if (isOwner) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        OutlinedButton(
                            onClick = onAdjust,
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text("Adjust Stock", fontSize = 11.sp)
                        }
                        IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit", tint = Slate600, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}
