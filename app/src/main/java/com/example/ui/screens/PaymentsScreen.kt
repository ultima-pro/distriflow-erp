package com.example.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Payment
import com.example.data.model.PaymentType
import com.example.data.model.User
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun PaymentsScreen(
    currentUser: User,
    payments: List<Payment>
) {
    var selectedType by remember { mutableStateOf<PaymentType?>(null) }

    val filteredPayments = remember(payments, selectedType) {
        payments.filter { p ->
            selectedType == null || p.type == selectedType
        }
    }

    val totalCollections = payments.filter { it.type == PaymentType.RETAILER_COLLECTION }.sumOf { it.amount }
    val totalDisbursements = payments.filter { it.type == PaymentType.SUPPLIER_PAYMENT }.sumOf { it.amount }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("payments_screen_container")
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        // Metrics Banner
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = StatusGreenLight.copy(alpha = 0.6f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Retailer Collections", fontSize = 11.sp, color = StatusGreen, fontWeight = FontWeight.Bold)
                    Text("$${String.format("%,.2f", totalCollections)}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Slate900)
                }
            }

            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = StatusRedLight.copy(alpha = 0.6f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Supplier Payments", fontSize = 11.sp, color = StatusRed, fontWeight = FontWeight.Bold)
                    Text("$${String.format("%,.2f", totalDisbursements)}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Slate900)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                FilterChip(
                    selected = selectedType == null,
                    onClick = { selectedType = null },
                    label = { Text("All Payments (${payments.size})") }
                )
            }
            item {
                FilterChip(
                    selected = selectedType == PaymentType.RETAILER_COLLECTION,
                    onClick = { selectedType = if (selectedType == PaymentType.RETAILER_COLLECTION) null else PaymentType.RETAILER_COLLECTION },
                    label = { Text("Retailer Collections") }
                )
            }
            item {
                FilterChip(
                    selected = selectedType == PaymentType.SUPPLIER_PAYMENT,
                    onClick = { selectedType = if (selectedType == PaymentType.SUPPLIER_PAYMENT) null else PaymentType.SUPPLIER_PAYMENT },
                    label = { Text("Supplier Disbursed") }
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (filteredPayments.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                Text("No payment transactions found.", color = Slate600)
            }
        } else {
            val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 30.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredPayments) { payment ->
                    val isCollection = payment.type == PaymentType.RETAILER_COLLECTION
                    Card(
                        modifier = Modifier.fillMaxWidth().testTag("payment_card_${payment.id}"),
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
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = if (isCollection) StatusGreenLight else StatusRedLight
                                    ) {
                                        Text(
                                            text = if (isCollection) "COLLECTION IN" else "PAYMENT OUT",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 10.sp,
                                            color = if (isCollection) StatusGreen else StatusRed,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(payment.paymentNumber, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }

                                Text(
                                    text = "${if (isCollection) "+" else "-"} $${String.format("%,.2f", payment.amount)}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    color = if (isCollection) StatusGreen else StatusRed
                                )
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            Text(payment.entityName, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text("Method: ${payment.paymentMethod.name.replace("_", " ")} ${if (payment.referenceNumber.isNotBlank()) "• Ref: ${payment.referenceNumber}" else ""}", fontSize = 12.sp, color = Slate600)
                            Text("Recorded by: ${payment.recordedByName} • ${dateFormat.format(Date(payment.paymentDate))}", fontSize = 11.sp, color = Slate400)

                            if (payment.notes.isNotBlank()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Notes: ${payment.notes}", fontSize = 11.sp, color = Slate700)
                            }
                        }
                    }
                }
            }
        }
    }
}
