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
fun RetailersScreen(
    currentUser: User,
    retailers: List<Retailer>,
    salespersons: List<User>,
    onSaveRetailer: (Retailer) -> Unit,
    onRecordPayment: (Long, Long?, Double, PaymentMethod, String, String) -> Unit,
    onStartOrderForRetailer: (Retailer) -> Unit
) {
    val isOwner = currentUser.role == UserRole.OWNER
    var searchQuery by remember { mutableStateOf("") }
    var showAddEditDialog by remember { mutableStateOf(false) }
    var editingRetailer by remember { mutableStateOf<Retailer?>(null) }
    var collectingForRetailer by remember { mutableStateOf<Retailer?>(null) }
    var viewingRetailer by remember { mutableStateOf<Retailer?>(null) }

    val filteredRetailers = remember(retailers, searchQuery, currentUser) {
        retailers.filter { r ->
            val matchesRole = if (isOwner) true else r.assignedSalespersonId == currentUser.id
            val matchesSearch = searchQuery.isBlank() ||
                    r.name.contains(searchQuery, ignoreCase = true) ||
                    r.contactPerson.contains(searchQuery, ignoreCase = true) ||
                    r.city.contains(searchQuery, ignoreCase = true)
            matchesRole && matchesSearch
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    editingRetailer = null
                    showAddEditDialog = true
                },
                containerColor = NavyPrimary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_retailer_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Retailer")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .testTag("retailers_screen_container")
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("retailer_search_input"),
                placeholder = { Text("Search retailers, contact, city...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (filteredRetailers.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No retailers found.", color = Slate600)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 80.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredRetailers) { retailer ->
                        RetailerItemCard(
                            retailer = retailer,
                            salespersons = salespersons,
                            isOwner = isOwner,
                            onClick = { viewingRetailer = retailer },
                            onEdit = {
                                editingRetailer = retailer
                                showAddEditDialog = true
                            },
                            onCollectPayment = { collectingForRetailer = retailer },
                            onNewOrder = { onStartOrderForRetailer(retailer) }
                        )
                    }
                }
            }
        }
    }

    // Add / Edit Retailer Dialog
    if (showAddEditDialog) {
        var name by remember { mutableStateOf(editingRetailer?.name ?: "") }
        var contactPerson by remember { mutableStateOf(editingRetailer?.contactPerson ?: "") }
        var phone by remember { mutableStateOf(editingRetailer?.phone ?: "") }
        var email by remember { mutableStateOf(editingRetailer?.email ?: "") }
        var address by remember { mutableStateOf(editingRetailer?.address ?: "") }
        var city by remember { mutableStateOf(editingRetailer?.city ?: "") }
        var creditLimitStr by remember { mutableStateOf(editingRetailer?.creditLimit?.toString() ?: "5000.0") }
        var assignedRepId by remember { mutableStateOf(editingRetailer?.assignedSalespersonId ?: (if (!isOwner) currentUser.id else salespersons.firstOrNull()?.id)) }

        AlertDialog(
            onDismissRequest = { showAddEditDialog = false },
            title = { Text(if (editingRetailer == null) "Add New Retailer" else "Edit Retailer") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Store / Retailer Name *") },
                        modifier = Modifier.fillMaxWidth().testTag("retailer_name_input"),
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
                        label = { Text("Phone Number *") },
                        modifier = Modifier.fillMaxWidth().testTag("retailer_phone_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
                        label = { Text("Physical Address") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = creditLimitStr,
                        onValueChange = { creditLimitStr = it },
                        label = { Text("Credit Limit ($)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val limit = creditLimitStr.toDoubleOrNull() ?: 5000.0
                        val newOrUpdated = Retailer(
                            id = editingRetailer?.id ?: 0L,
                            name = name,
                            contactPerson = contactPerson,
                            phone = phone,
                            email = email,
                            address = address,
                            city = city,
                            assignedSalespersonId = assignedRepId,
                            creditLimit = limit,
                            outstandingBalance = editingRetailer?.outstandingBalance ?: 0.0,
                            isActive = true
                        )
                        onSaveRetailer(newOrUpdated)
                        showAddEditDialog = false
                    },
                    enabled = name.isNotBlank() && phone.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                    modifier = Modifier.testTag("save_retailer_button")
                ) {
                    Text("Save Retailer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddEditDialog = false }) { Text("Cancel") }
            }
        )
    }

    // Payment Collection Dialog
    collectingForRetailer?.let { retailer ->
        var amountStr by remember { mutableStateOf("") }
        var selectedMethod by remember { mutableStateOf(PaymentMethod.CASH) }
        var refNumber by remember { mutableStateOf("") }
        var notes by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { collectingForRetailer = null },
            title = { Text("Collect Payment from ${retailer.name}") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Current Outstanding Balance: $${String.format("%,.2f", retailer.outstandingBalance)}", color = StatusRed, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = amountStr,
                        onValueChange = { amountStr = it },
                        label = { Text("Amount Collected ($) *") },
                        modifier = Modifier.fillMaxWidth().testTag("payment_amount_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Text("Payment Method:", fontSize = 12.sp, color = Slate600)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        PaymentMethod.values().forEach { method ->
                            FilterChip(
                                selected = selectedMethod == method,
                                onClick = { selectedMethod = method },
                                label = { Text(method.name.replace("_", " "), fontSize = 10.sp) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = refNumber,
                        onValueChange = { refNumber = it },
                        label = { Text("Receipt / Ref Number") },
                        modifier = Modifier.fillMaxWidth(),
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
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amount = amountStr.toDoubleOrNull() ?: 0.0
                        if (amount > 0) {
                            onRecordPayment(retailer.id, null, amount, selectedMethod, refNumber, notes)
                            collectingForRetailer = null
                        }
                    },
                    enabled = (amountStr.toDoubleOrNull() ?: 0.0) > 0,
                    colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                    modifier = Modifier.testTag("confirm_record_payment_btn")
                ) {
                    Text("Record Payment")
                }
            },
            dismissButton = {
                TextButton(onClick = { collectingForRetailer = null }) { Text("Cancel") }
            }
        )
    }

    // Detail Dialog
    viewingRetailer?.let { retailer ->
        val assignedRep = salespersons.find { it.id == retailer.assignedSalespersonId }?.fullName ?: "Unassigned"
        AlertDialog(
            onDismissRequest = { viewingRetailer = null },
            title = { Text(retailer.name, fontWeight = FontWeight.Bold) },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Contact: ${retailer.contactPerson}", fontWeight = FontWeight.SemiBold)
                    Text("Phone: ${retailer.phone}", color = Slate600)
                    Text("Address: ${retailer.address}, ${retailer.city}", color = Slate600)
                    Text("Assigned Salesperson: $assignedRep", color = NavyPrimary)
                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Outstanding Balance:")
                        Text(
                            "$${String.format("%,.2f", retailer.outstandingBalance)}",
                            fontWeight = FontWeight.Bold,
                            color = if (retailer.outstandingBalance > 0) StatusRed else StatusGreen
                        )
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Credit Limit:")
                        Text("$${String.format("%,.0f", retailer.creditLimit)}", fontWeight = FontWeight.SemiBold)
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { viewingRetailer = null }) { Text("Close") }
            }
        )
    }
}

@Composable
fun RetailerItemCard(
    retailer: Retailer,
    salespersons: List<User>,
    isOwner: Boolean,
    onClick: () -> Unit,
    onEdit: () -> Unit,
    onCollectPayment: () -> Unit,
    onNewOrder: () -> Unit
) {
    val assignedRep = salespersons.find { it.id == retailer.assignedSalespersonId }?.fullName ?: "Unassigned"

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("retailer_card_${retailer.id}")
            .clickable(onClick = onClick),
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
                    Text(retailer.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("${retailer.contactPerson} • ${retailer.phone}", fontSize = 12.sp, color = Slate600)
                }
                if (isOwner) {
                    IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", tint = Slate600, modifier = Modifier.size(18.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${retailer.address}${if (retailer.city.isNotBlank()) ", ${retailer.city}" else ""}",
                fontSize = 12.sp,
                color = Slate600
            )
            Text(text = "Rep: $assignedRep", fontSize = 11.sp, color = NavyPrimary)

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Outstanding Balance", fontSize = 11.sp, color = Slate400)
                    Text(
                        "$${String.format("%,.2f", retailer.outstandingBalance)}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = if (retailer.outstandingBalance > 0) StatusRed else StatusGreen
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onCollectPayment,
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.testTag("collect_payment_btn_${retailer.id}")
                    ) {
                        Icon(Icons.Default.Payment, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Collect", fontSize = 11.sp)
                    }

                    Button(
                        onClick = onNewOrder,
                        colors = ButtonDefaults.buttonColors(containerColor = TealSecondary),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Icon(Icons.Default.AddShoppingCart, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Order", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
