package com.example.ui.screens

import androidx.compose.foundation.background
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
import com.example.data.model.*
import com.example.ui.components.OrderStatusBadge
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    currentUser: User,
    orders: List<Order>,
    salespersons: List<User>,
    onApproveOrder: (Long, String) -> Unit,
    onRejectOrder: (Long, String) -> Unit,
    onRequestChanges: (Long, String) -> Unit,
    onGenerateInvoice: (Long) -> Unit,
    onNavigateToCreateOrder: () -> Unit
) {
    val isOwner = currentUser.role == UserRole.OWNER
    var searchQuery by remember { mutableStateOf("") }
    var selectedStatus by remember { mutableStateOf<OrderStatus?>(null) }
    var selectedSalespersonId by remember { mutableStateOf<Long?>(null) }

    // Selected order for detail dialog
    var viewingOrder by remember { mutableStateOf<Order?>(null) }

    // Action dialogs
    var showApproveDialog by remember { mutableStateOf(false) }
    var showRejectDialog by remember { mutableStateOf(false) }
    var showChangesDialog by remember { mutableStateOf(false) }
    var feedbackText by remember { mutableStateOf("") }

    val filteredOrders = remember(orders, searchQuery, selectedStatus, selectedSalespersonId, currentUser) {
        orders.filter { order ->
            val matchesRole = if (isOwner) true else order.salespersonId == currentUser.id
            val matchesSearch = searchQuery.isBlank() ||
                    order.orderNumber.contains(searchQuery, ignoreCase = true) ||
                    order.retailerName.contains(searchQuery, ignoreCase = true) ||
                    order.salespersonName.contains(searchQuery, ignoreCase = true)
            val matchesStatus = selectedStatus == null || order.status == selectedStatus
            val matchesSalesperson = selectedSalespersonId == null || order.salespersonId == selectedSalespersonId

            matchesRole && matchesSearch && matchesStatus && matchesSalesperson
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToCreateOrder,
                containerColor = NavyPrimary,
                contentColor = Color.White,
                modifier = Modifier.testTag("new_order_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Order")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .testTag("orders_screen_container")
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("order_search_input"),
                placeholder = { Text("Search by Order #, Retailer...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear")
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Status Filter Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                item {
                    FilterChip(
                        selected = selectedStatus == null,
                        onClick = { selectedStatus = null },
                        label = { Text("All (${orders.size})") }
                    )
                }
                items(OrderStatus.values()) { status ->
                    val count = orders.count { it.status == status }
                    FilterChip(
                        selected = selectedStatus == status,
                        onClick = {
                            selectedStatus = if (selectedStatus == status) null else status
                        },
                        label = { Text("${status.name.replace("_", " ")} ($count)") },
                        modifier = Modifier.testTag("filter_status_${status.name}")
                    )
                }
            }

            // Salesperson Filter (Owner Only)
            if (isOwner && salespersons.isNotEmpty()) {
                Spacer(modifier = Modifier.height(6.dp))
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    item {
                        FilterChip(
                            selected = selectedSalespersonId == null,
                            onClick = { selectedSalespersonId = null },
                            label = { Text("All Reps") }
                        )
                    }
                    items(salespersons) { rep ->
                        FilterChip(
                            selected = selectedSalespersonId == rep.id,
                            onClick = {
                                selectedSalespersonId = if (selectedSalespersonId == rep.id) null else rep.id
                            },
                            label = { Text(rep.fullName) }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Orders List
            if (filteredOrders.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.ReceiptLong, contentDescription = null, modifier = Modifier.size(48.dp), tint = Slate400)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No orders match the selected filters.", color = Slate600)
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 80.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredOrders) { order ->
                        OrderCardItem(
                            order = order,
                            isOwner = isOwner,
                            onClick = { viewingOrder = order }
                        )
                    }
                }
            }
        }
    }

    // Order Details & Review Dialog
    viewingOrder?.let { order ->
        val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        AlertDialog(
            onDismissRequest = { viewingOrder = null },
            title = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(order.orderNumber, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    OrderStatusBadge(order.status)
                }
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Retailer: ${order.retailerName}", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Text("Sales Rep: ${order.salespersonName}", color = Slate600, fontSize = 13.sp)
                    Text("Date: ${dateFormat.format(Date(order.orderDate))}", color = Slate600, fontSize = 12.sp)

                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Subtotal:", color = Slate600, fontSize = 13.sp)
                        Text("$${String.format("%,.2f", order.subtotal)}", fontSize = 13.sp)
                    }
                    if (order.discount > 0) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Discount:", color = StatusRed, fontSize = 13.sp)
                            Text("- $${String.format("%,.2f", order.discount)}", color = StatusRed, fontSize = 13.sp)
                        }
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total Amount:", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text(
                            "$${String.format("%,.2f", order.totalAmount)}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = NavyPrimary
                        )
                    }

                    if (order.notes.isNotBlank()) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Text("Notes from Salesperson:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                        Text(order.notes, fontSize = 12.sp, color = Slate700)
                    }

                    if (order.ownerFeedback.isNotBlank()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Card(
                            colors = CardDefaults.cardColors(containerColor = StatusAmberLight),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(8.dp)) {
                                Text("Owner Feedback:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = StatusAmber)
                                Text(order.ownerFeedback, fontSize = 12.sp, color = Slate800)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    if (isOwner && order.status == OrderStatus.SUBMITTED) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    showApproveDialog = true
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                                modifier = Modifier.weight(1f).testTag("order_approve_btn")
                            ) {
                                Text("Approve")
                            }
                            OutlinedButton(
                                onClick = {
                                    showChangesDialog = true
                                },
                                modifier = Modifier.weight(1f).testTag("order_request_changes_btn")
                            ) {
                                Text("Changes")
                            }
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedButton(
                            onClick = {
                                showRejectDialog = true
                            },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = StatusRed),
                            modifier = Modifier.fillMaxWidth().testTag("order_reject_btn")
                        ) {
                            Text("Reject Order")
                        }
                    } else if (isOwner && order.status == OrderStatus.APPROVED) {
                        Button(
                            onClick = {
                                onGenerateInvoice(order.id)
                                viewingOrder = null
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                            modifier = Modifier.fillMaxWidth().testTag("order_generate_invoice_btn")
                        ) {
                            Icon(Icons.Default.Receipt, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Generate Invoice & Schedule Delivery")
                        }
                    }

                    TextButton(
                        onClick = { viewingOrder = null },
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text("Close")
                    }
                }
            }
        )
    }

    // Approve Dialog
    if (showApproveDialog && viewingOrder != null) {
        AlertDialog(
            onDismissRequest = { showApproveDialog = false },
            title = { Text("Approve Order ${viewingOrder?.orderNumber}") },
            text = {
                Column {
                    Text("Confirm approval of this order for $${String.format("%,.2f", viewingOrder?.totalAmount)}?")
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = feedbackText,
                        onValueChange = { feedbackText = it },
                        label = { Text("Optional approval note / instructions") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onApproveOrder(viewingOrder!!.id, feedbackText)
                        showApproveDialog = false
                        viewingOrder = null
                        feedbackText = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                    modifier = Modifier.testTag("confirm_approve_order_button")
                ) {
                    Text("Confirm Approval")
                }
            },
            dismissButton = {
                TextButton(onClick = { showApproveDialog = false }) { Text("Cancel") }
            }
        )
    }

    // Request Changes Dialog
    if (showChangesDialog && viewingOrder != null) {
        AlertDialog(
            onDismissRequest = { showChangesDialog = false },
            title = { Text("Request Order Changes") },
            text = {
                Column {
                    Text("Provide specific feedback for the salesperson:")
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = feedbackText,
                        onValueChange = { feedbackText = it },
                        label = { Text("Required changes / instructions *") },
                        modifier = Modifier.fillMaxWidth().testTag("request_changes_feedback_input")
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (feedbackText.isNotBlank()) {
                            onRequestChanges(viewingOrder!!.id, feedbackText)
                            showChangesDialog = false
                            viewingOrder = null
                            feedbackText = ""
                        }
                    },
                    enabled = feedbackText.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = StatusAmber)
                ) {
                    Text("Send Feedback")
                }
            },
            dismissButton = {
                TextButton(onClick = { showChangesDialog = false }) { Text("Cancel") }
            }
        )
    }

    // Reject Dialog
    if (showRejectDialog && viewingOrder != null) {
        AlertDialog(
            onDismissRequest = { showRejectDialog = false },
            title = { Text("Reject Order") },
            text = {
                Column {
                    Text("Are you sure you want to reject Order ${viewingOrder?.orderNumber}?")
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = feedbackText,
                        onValueChange = { feedbackText = it },
                        label = { Text("Reason for rejection *") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onRejectOrder(viewingOrder!!.id, feedbackText)
                        showRejectDialog = false
                        viewingOrder = null
                        feedbackText = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = StatusRed)
                ) {
                    Text("Reject")
                }
            },
            dismissButton = {
                TextButton(onClick = { showRejectDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
fun OrderCardItem(
    order: Order,
    isOwner: Boolean,
    onClick: () -> Unit
) {
    val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("order_card_${order.id}")
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
                Text(
                    text = order.orderNumber,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = NavyPrimary
                )
                OrderStatusBadge(status = order.status)
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = order.retailerName,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Rep: ${order.salespersonName}",
                    fontSize = 12.sp,
                    color = Slate600
                )
                Text(
                    text = dateFormat.format(Date(order.orderDate)),
                    fontSize = 12.sp,
                    color = Slate400
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (order.notes.isNotBlank()) {
                    Text(
                        text = "Notes: ${order.notes}",
                        fontSize = 11.sp,
                        color = Slate400,
                        maxLines = 1,
                        modifier = Modifier.weight(1f)
                    )
                } else {
                    Spacer(modifier = Modifier.weight(1f))
                }

                Text(
                    text = "$${String.format("%,.2f", order.totalAmount)}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}
