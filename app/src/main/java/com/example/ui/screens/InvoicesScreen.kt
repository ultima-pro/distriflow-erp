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
import com.example.data.model.*
import com.example.ui.components.PaymentStatusBadge
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun InvoicesScreen(
    currentUser: User,
    invoices: List<Invoice>,
    onRecordPayment: (Long, Long?, Double, PaymentMethod, String, String) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedStatus by remember { mutableStateOf<InvoicePaymentStatus?>(null) }
    var payingInvoice by remember { mutableStateOf<Invoice?>(null) }
    var viewingInvoice by remember { mutableStateOf<Invoice?>(null) }

    val filteredInvoices = remember(invoices, searchQuery, selectedStatus) {
        invoices.filter { inv ->
            val matchesSearch = searchQuery.isBlank() ||
                    inv.invoiceNumber.contains(searchQuery, ignoreCase = true) ||
                    inv.retailerName.contains(searchQuery, ignoreCase = true)
            val matchesStatus = selectedStatus == null || inv.paymentStatus == selectedStatus
            matchesSearch && matchesStatus
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("invoices_screen_container")
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search invoice #, retailer...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            modifier = Modifier.fillMaxWidth().testTag("invoice_search_input"),
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                FilterChip(
                    selected = selectedStatus == null,
                    onClick = { selectedStatus = null },
                    label = { Text("All (${invoices.size})") }
                )
            }
            items(InvoicePaymentStatus.values()) { status ->
                val count = invoices.count { it.paymentStatus == status }
                FilterChip(
                    selected = selectedStatus == status,
                    onClick = { selectedStatus = if (selectedStatus == status) null else status },
                    label = { Text("${status.name.replace("_", " ")} ($count)") }
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (filteredInvoices.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                Text("No invoices found.", color = Slate600)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 30.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredInvoices) { invoice ->
                    InvoiceItemCard(
                        invoice = invoice,
                        onClick = { viewingInvoice = invoice },
                        onPay = { payingInvoice = invoice }
                    )
                }
            }
        }
    }

    // Record Payment Dialog
    payingInvoice?.let { inv ->
        var amountStr by remember { mutableStateOf(inv.remainingBalance.toString()) }
        var method by remember { mutableStateOf(PaymentMethod.CASH) }
        var refNumber by remember { mutableStateOf("") }
        var notes by remember { mutableStateOf("Payment for invoice ${inv.invoiceNumber}") }

        AlertDialog(
            onDismissRequest = { payingInvoice = null },
            title = { Text("Record Payment for ${inv.invoiceNumber}") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Retailer: ${inv.retailerName}", fontWeight = FontWeight.Bold)
                    Text("Remaining Balance: Rs. ${String.format("%,.2f", inv.remainingBalance)}", color = StatusRed)
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = amountStr,
                        onValueChange = { amountStr = it },
                        label = { Text("Amount Paid (Rs.) *") },
                        modifier = Modifier.fillMaxWidth().testTag("invoice_pay_amount_input"),
                        singleLine = true
                    )
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
                            onRecordPayment(inv.retailerId, inv.id, amount, method, refNumber, notes)
                            payingInvoice = null
                        }
                    },
                    enabled = (amountStr.toDoubleOrNull() ?: 0.0) > 0,
                    colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                    modifier = Modifier.testTag("confirm_invoice_payment_btn")
                ) {
                    Text("Record Payment")
                }
            },
            dismissButton = {
                TextButton(onClick = { payingInvoice = null }) { Text("Cancel") }
            }
        )
    }

    // Detail Dialog
    viewingInvoice?.let { inv ->
        val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
        AlertDialog(
            onDismissRequest = { viewingInvoice = null },
            title = {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(inv.invoiceNumber, fontWeight = FontWeight.Bold)
                    PaymentStatusBadge(inv.paymentStatus)
                }
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("Customer: ${inv.retailerName}", fontWeight = FontWeight.SemiBold)
                    Text("Invoice Date: ${dateFormat.format(Date(inv.invoiceDate))}", fontSize = 12.sp, color = Slate600)
                    Text("Due Date: ${dateFormat.format(Date(inv.dueDate))}", fontSize = 12.sp, color = Slate600)
                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Subtotal:", color = Slate600)
                        Text("$${String.format("%,.2f", inv.subtotal)}")
                    }
                    if (inv.discount > 0) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Discount:", color = StatusRed)
                            Text("- $${String.format("%,.2f", inv.discount)}", color = StatusRed)
                        }
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total Invoice Amount:", fontWeight = FontWeight.Bold)
                        Text("Rs. ${String.format("%,.2f", inv.totalAmount)}", fontWeight = FontWeight.Bold, color = NavyPrimary)
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Amount Paid:")
                        Text("Rs. ${String.format("%,.2f", inv.amountPaid)}", color = StatusGreen, fontWeight = FontWeight.SemiBold)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Remaining Balance:")
                        Text("Rs. ${String.format("%,.2f", inv.remainingBalance)}", color = StatusRed, fontWeight = FontWeight.Bold)
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { viewingInvoice = null }) { Text("Close") }
            }
        )
    }
}

@Composable
fun InvoiceItemCard(
    invoice: Invoice,
    onClick: () -> Unit,
    onPay: () -> Unit
) {
    val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())

    Card(
        modifier = Modifier.fillMaxWidth().testTag("invoice_card_${invoice.id}").clickable(onClick = onClick),
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
                Text(invoice.invoiceNumber, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyPrimary)
                PaymentStatusBadge(invoice.paymentStatus)
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(invoice.retailerName, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text("Date: ${dateFormat.format(Date(invoice.invoiceDate))}", fontSize = 11.sp, color = Slate400)

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Total: Rs. ${String.format("%,.2f", invoice.totalAmount)}", fontSize = 12.sp, color = Slate600)
                    Text(
                        "Remaining: Rs. ${String.format("%,.2f", invoice.remainingBalance)}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = if (invoice.remainingBalance > 0) StatusRed else StatusGreen
                    )
                }

                if (invoice.paymentStatus != InvoicePaymentStatus.PAID) {
                    Button(
                        onClick = onPay,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = StatusGreen),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        modifier = Modifier.testTag("invoice_pay_button_${invoice.id}")
                    ) {
                        Icon(Icons.Default.Payment, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Record Pay", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
