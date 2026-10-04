package com.example.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Edit
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

@Composable
fun SalespersonsScreen(
    salespersons: List<User>,
    retailers: List<Retailer>,
    orders: List<Order>,
    payments: List<Payment>,
    onSaveUser: (User) -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = NavyPrimary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_salesperson_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Salesperson")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .testTag("salespersons_screen_container")
        ) {
            Spacer(modifier = Modifier.height(14.dp))
            Text("Sales Representatives Management", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("Assign territories, review quotas and live collections", fontSize = 12.sp, color = Slate600)
            Spacer(modifier = Modifier.height(12.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 80.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(salespersons) { rep ->
                    val assignedRetailers = retailers.filter { it.assignedSalespersonId == rep.id }
                    val repOrders = orders.filter { it.salespersonId == rep.id }
                    val repSales = repOrders.filter { it.status in listOf(OrderStatus.APPROVED, OrderStatus.INVOICED, OrderStatus.DELIVERED) }.sumOf { it.totalAmount }
                    val repCollections = payments.filter { it.recordedByUserId == rep.id && it.type == PaymentType.RETAILER_COLLECTION }.sumOf { it.amount }

                    Card(
                        modifier = Modifier.fillMaxWidth().testTag("salesperson_card_${rep.id}"),
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
                                    Icon(Icons.Default.Badge, contentDescription = null, tint = TealSecondary)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(rep.fullName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                }
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (rep.isActive) StatusGreenLight else StatusRedLight
                                ) {
                                    Text(
                                        text = if (rep.isActive) "ACTIVE" else "INACTIVE",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 10.sp,
                                        color = if (rep.isActive) StatusGreen else StatusRed,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Username: @${rep.username} • Phone: ${rep.phone}", fontSize = 12.sp, color = Slate600)
                            Text("Assigned Retailers: ${assignedRetailers.size} stores", fontSize = 12.sp, color = NavyPrimary)

                            Spacer(modifier = Modifier.height(10.dp))
                            HorizontalDivider()
                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text("Orders Placed", fontSize = 11.sp, color = Slate400)
                                    Text("${repOrders.size} Orders", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                                Column {
                                    Text("Sales Volume", fontSize = 11.sp, color = Slate400)
                                    Text("$${String.format("%,.2f", repSales)}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = StatusGreen)
                                }
                                Column {
                                    Text("Collections", fontSize = 11.sp, color = Slate400)
                                    Text("$${String.format("%,.2f", repCollections)}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Add Salesperson Dialog
    if (showAddDialog) {
        var username by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("sales123") }
        var fullName by remember { mutableStateOf("") }
        var phone by remember { mutableStateOf("") }
        var email by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Add Sales Representative") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = fullName,
                        onValueChange = { fullName = it },
                        label = { Text("Full Name *") },
                        modifier = Modifier.fillMaxWidth().testTag("new_sales_fullname"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = { Text("Login Username *") },
                        modifier = Modifier.fillMaxWidth().testTag("new_sales_username"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Default Password *") },
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
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val newUser = User(
                            username = username.trim(),
                            passwordHash = password,
                            fullName = fullName.trim(),
                            role = UserRole.SALESPERSON,
                            phone = phone,
                            email = email,
                            isActive = true
                        )
                        onSaveUser(newUser)
                        showAddDialog = false
                    },
                    enabled = fullName.isNotBlank() && username.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                    modifier = Modifier.testTag("confirm_add_sales_btn")
                ) {
                    Text("Add Rep")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) { Text("Cancel") }
            }
        )
    }
}
