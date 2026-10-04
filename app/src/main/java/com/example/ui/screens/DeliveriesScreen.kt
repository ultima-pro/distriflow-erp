package com.example.ui.screens

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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Delivery
import com.example.data.model.DeliveryStatus
import com.example.data.model.User
import com.example.ui.components.DeliveryStatusBadge
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DeliveriesScreen(
    currentUser: User,
    deliveries: List<Delivery>,
    onDispatch: (Long, String, String, String) -> Unit,
    onCompleteDelivery: (Long, String) -> Unit
) {
    var selectedStatus by remember { mutableStateOf<DeliveryStatus?>(null) }
    var dispatchingDelivery by remember { mutableStateOf<Delivery?>(null) }
    var completingDelivery by remember { mutableStateOf<Delivery?>(null) }

    val filteredDeliveries = remember(deliveries, selectedStatus) {
        deliveries.filter { d ->
            selectedStatus == null || d.status == selectedStatus
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("deliveries_screen_container")
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                FilterChip(
                    selected = selectedStatus == null,
                    onClick = { selectedStatus = null },
                    label = { Text("All (${deliveries.size})") }
                )
            }
            items(DeliveryStatus.values()) { status ->
                val count = deliveries.count { it.status == status }
                FilterChip(
                    selected = selectedStatus == status,
                    onClick = { selectedStatus = if (selectedStatus == status) null else status },
                    label = { Text("${status.name} ($count)") }
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (filteredDeliveries.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                Text("No deliveries in this category.", color = Slate600)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 30.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredDeliveries) { delivery ->
                    DeliveryItemCard(
                        delivery = delivery,
                        onDispatch = { dispatchingDelivery = delivery },
                        onComplete = { completingDelivery = delivery }
                    )
                }
            }
        }
    }

    // Dispatch Dialog
    dispatchingDelivery?.let { delivery ->
        var driverName by remember { mutableStateOf(delivery.driverName.ifBlank { "Alex Rodriguez" }) }
        var driverPhone by remember { mutableStateOf(delivery.driverPhone.ifBlank { "+1 (555) 902-1122" }) }
        var notes by remember { mutableStateOf("Loaded onto delivery van #4") }

        AlertDialog(
            onDismissRequest = { dispatchingDelivery = null },
            title = { Text("Dispatch Order ${delivery.orderNumber}") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Destination: ${delivery.retailerName}", fontWeight = FontWeight.Bold)
                    Text("Address: ${delivery.deliveryAddress}", fontSize = 12.sp, color = Slate600)
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = driverName,
                        onValueChange = { driverName = it },
                        label = { Text("Driver / Courier Name *") },
                        modifier = Modifier.fillMaxWidth().testTag("dispatch_driver_name_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = driverPhone,
                        onValueChange = { driverPhone = it },
                        label = { Text("Driver Contact Phone") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Dispatch Notes") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (driverName.isNotBlank()) {
                            onDispatch(delivery.id, driverName, driverPhone, notes)
                            dispatchingDelivery = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                    modifier = Modifier.testTag("confirm_dispatch_button")
                ) {
                    Text("Mark Dispatched")
                }
            },
            dismissButton = {
                TextButton(onClick = { dispatchingDelivery = null }) { Text("Cancel") }
            }
        )
    }

    // Complete Delivery Dialog
    completingDelivery?.let { delivery ->
        var deliveryNotes by remember { mutableStateOf("Signed and received at retailer store.") }

        AlertDialog(
            onDismissRequest = { completingDelivery = null },
            title = { Text("Confirm Delivery Completion") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Order: ${delivery.orderNumber} for ${delivery.retailerName}")
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "Completing delivery will automatically deduct product items from warehouse inventory and log auditable stock movements.",
                        fontSize = 12.sp,
                        color = NavyPrimary
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = deliveryNotes,
                        onValueChange = { deliveryNotes = it },
                        label = { Text("Delivery Proof / Notes") },
                        modifier = Modifier.fillMaxWidth().testTag("complete_delivery_notes_input"),
                        minLines = 2
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onCompleteDelivery(delivery.id, deliveryNotes)
                        completingDelivery = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                    modifier = Modifier.testTag("confirm_delivery_completion_btn")
                ) {
                    Text("Confirm Delivered")
                }
            },
            dismissButton = {
                TextButton(onClick = { completingDelivery = null }) { Text("Cancel") }
            }
        )
    }
}

@Composable
fun DeliveryItemCard(
    delivery: Delivery,
    onDispatch: () -> Unit,
    onComplete: () -> Unit
) {
    val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())

    Card(
        modifier = Modifier.fillMaxWidth().testTag("delivery_card_${delivery.id}"),
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
                Text(delivery.orderNumber, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyPrimary)
                DeliveryStatusBadge(delivery.status)
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(delivery.retailerName, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text(delivery.deliveryAddress, fontSize = 12.sp, color = Slate600)

            if (delivery.driverName.isNotBlank()) {
                Text("Driver: ${delivery.driverName} ${if (delivery.driverPhone.isNotBlank()) "(${delivery.driverPhone})" else ""}", fontSize = 12.sp, color = Slate700)
            }

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Scheduled: ${dateFormat.format(Date(delivery.scheduledDate))}",
                    fontSize = 11.sp,
                    color = Slate400
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (delivery.status == DeliveryStatus.SCHEDULED) {
                        Button(
                            onClick = onDispatch,
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            modifier = Modifier.testTag("dispatch_delivery_btn_${delivery.id}")
                        ) {
                            Icon(Icons.Default.LocalShipping, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Dispatch", fontSize = 11.sp)
                        }
                    } else if (delivery.status == DeliveryStatus.DISPATCHED) {
                        Button(
                            onClick = onComplete,
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            modifier = Modifier.testTag("complete_delivery_btn_${delivery.id}")
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Delivered", fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}
