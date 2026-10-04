package com.example.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.data.model.*
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SuppliersScreen(
    currentUser: User,
    suppliers: List<Supplier>,
    products: List<Product>,
    onSaveSupplier: (Supplier) -> Unit,
    onRecordPurchase: (Long, String, List<Pair<Product, Int>>, String) -> Unit,
    onRecordSupplierPayment: (Long, Long?, Double, PaymentMethod, String, String) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var showAddSupplierDialog by remember { mutableStateOf(false) }
    var editingSupplier by remember { mutableStateOf<Supplier?>(null) }
    var purchasingFromSupplier by remember { mutableStateOf<Supplier?>(null) }
    var payingSupplier by remember { mutableStateOf<Supplier?>(null) }

    val filteredSuppliers = remember(suppliers, searchQuery) {
        suppliers.filter { s ->
            searchQuery.isBlank() ||
                    s.name.contains(searchQuery, ignoreCase = true) ||
                    s.contactPerson.contains(searchQuery, ignoreCase = true)
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    editingSupplier = null
                    showAddSupplierDialog = true
                },
                containerColor = NavyPrimary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_supplier_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Supplier")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .testTag("suppliers_screen_container")
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("supplier_search_input"),
                placeholder = { Text("Search suppliers...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (filteredSuppliers.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No suppliers found.", color = Slate600)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 80.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredSuppliers) { supplier ->
                        SupplierItemCard(
                            supplier = supplier,
                            onEdit = {
                                editingSupplier = supplier
                                showAddSupplierDialog = true
                            },
                            onNewPurchase = { purchasingFromSupplier = supplier },
                            onPay = { payingSupplier = supplier }
                        )
                    }
                }
            }
        }
    }

    // Add / Edit Supplier Dialog
    if (showAddSupplierDialog) {
        var name by remember { mutableStateOf(editingSupplier?.name ?: "") }
        var contactPerson by remember { mutableStateOf(editingSupplier?.contactPerson ?: "") }
        var phone by remember { mutableStateOf(editingSupplier?.phone ?: "") }
        var email by remember { mutableStateOf(editingSupplier?.email ?: "") }
        var address by remember { mutableStateOf(editingSupplier?.address ?: "") }

        AlertDialog(
            onDismissRequest = { showAddSupplierDialog = false },
            title = { Text(if (editingSupplier == null) "Add Supplier" else "Edit Supplier") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Supplier Business Name *") },
                        modifier = Modifier.fillMaxWidth().testTag("supplier_name_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = contactPerson,
                        onValueChange = { contactPerson = it },
                        label = { Text("Contact Person") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone Number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
                        label = { Text("Address / Warehouse") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val sup = Supplier(
                            id = editingSupplier?.id ?: 0L,
                            name = name,
                            contactPerson = contactPerson,
                            phone = phone,
                            email = email,
                            address = address,
                            payableBalance = editingSupplier?.payableBalance ?: 0.0,
                            isActive = true
                        )
                        onSaveSupplier(sup)
                        showAddSupplierDialog = false
                    },
                    enabled = name.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                    modifier = Modifier.testTag("save_supplier_button")
                ) {
                    Text("Save Supplier")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddSupplierDialog = false }) { Text("Cancel") }
            }
        )
    }

    // New Purchase Bill Dialog
    purchasingFromSupplier?.let { supplier ->
        var billNumber by remember { mutableStateOf("BILL-${System.currentTimeMillis() % 100000}") }
        var selectedProduct by remember { mutableStateOf(products.firstOrNull()) }
        var quantityStr by remember { mutableStateOf("20") }
        var notes by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { purchasingFromSupplier = null },
            title = { Text("Record Supplier Purchase Bill") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Supplier: ${supplier.name}", fontWeight = FontWeight.Bold, color = NavyPrimary)
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = billNumber,
                        onValueChange = { billNumber = it },
                        label = { Text("Bill / Invoice Number *") },
                        modifier = Modifier.fillMaxWidth().testTag("purchase_bill_num_input"),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Select Product to Receive:", fontSize = 12.sp, color = Slate600)
                    LazyColumn(modifier = Modifier.heightIn(max = 140.dp)) {
                        items(products) { prod ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 2.dp)
                                    .clickable { selectedProduct = prod },
                                colors = CardDefaults.cardColors(
                                    containerColor = if (selectedProduct?.id == prod.id) Color(0xFFDBEAFE) else Slate100
                                )
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(prod.name, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                    Text("$${String.format("%.2f", prod.purchasePrice)}", fontSize = 12.sp)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = quantityStr,
                        onValueChange = { quantityStr = it },
                        label = { Text("Quantity to Stock In *") },
                        modifier = Modifier.fillMaxWidth().testTag("purchase_qty_input"),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Notes") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    val qty = quantityStr.toIntOrNull() ?: 0
                    val total = (selectedProduct?.purchasePrice ?: 0.0) * qty
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Total Purchase Bill: $${String.format("%,.2f", total)}",
                        fontWeight = FontWeight.Bold,
                        color = NavyPrimary,
                        fontSize = 14.sp
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val prod = selectedProduct
                        val qty = quantityStr.toIntOrNull() ?: 0
                        if (prod != null && qty > 0 && billNumber.isNotBlank()) {
                            onRecordPurchase(supplier.id, billNumber, listOf(prod to qty), notes)
                            purchasingFromSupplier = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                    modifier = Modifier.testTag("confirm_purchase_bill_btn")
                ) {
                    Text("Confirm & Receive Stock")
                }
            },
            dismissButton = {
                TextButton(onClick = { purchasingFromSupplier = null }) { Text("Cancel") }
            }
        )
    }

    // Pay Supplier Dialog
    payingSupplier?.let { supplier ->
        var amountStr by remember { mutableStateOf("") }
        var selectedMethod by remember { mutableStateOf(PaymentMethod.BANK_TRANSFER) }
        var refNumber by remember { mutableStateOf("") }
        var notes by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { payingSupplier = null },
            title = { Text("Pay Supplier: ${supplier.name}") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Current Payable Balance: $${String.format("%,.2f", supplier.payableBalance)}", fontWeight = FontWeight.Bold, color = StatusRed)
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = amountStr,
                        onValueChange = { amountStr = it },
                        label = { Text("Payment Amount ($) *") },
                        modifier = Modifier.fillMaxWidth().testTag("supplier_pay_amount_input"),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = refNumber,
                        onValueChange = { refNumber = it },
                        label = { Text("Bank Reference / Cheque #") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Payment Notes") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amount = amountStr.toDoubleOrNull() ?: 0.0
                        if (amount > 0) {
                            onRecordSupplierPayment(supplier.id, null, amount, selectedMethod, refNumber, notes)
                            payingSupplier = null
                        }
                    },
                    enabled = (amountStr.toDoubleOrNull() ?: 0.0) > 0,
                    colors = ButtonDefaults.buttonColors(containerColor = StatusGreen)
                ) {
                    Text("Confirm Payment")
                }
            },
            dismissButton = {
                TextButton(onClick = { payingSupplier = null }) { Text("Cancel") }
            }
        )
    }
}

@Composable
fun SupplierItemCard(
    supplier: Supplier,
    onEdit: () -> Unit,
    onNewPurchase: () -> Unit,
    onPay: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().testTag("supplier_card_${supplier.id}"),
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
                    Text(supplier.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("${supplier.contactPerson} • ${supplier.phone}", fontSize = 12.sp, color = Slate600)
                }
                IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit", tint = Slate600, modifier = Modifier.size(18.dp))
                }
            }

            if (supplier.address.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(supplier.address, fontSize = 12.sp, color = Slate600)
            }

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Payable Balance", fontSize = 11.sp, color = Slate400)
                    Text(
                        "$${String.format("%,.2f", supplier.payableBalance)}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = if (supplier.payableBalance > 0) StatusRed else StatusGreen
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onPay,
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text("Pay", fontSize = 11.sp)
                    }

                    Button(
                        onClick = onNewPurchase,
                        colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.testTag("supplier_new_purchase_btn_${supplier.id}")
                    ) {
                        Icon(Icons.Default.AddBusiness, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Stock In Bill", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
