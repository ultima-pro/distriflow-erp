package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class InvoicePaymentStatus {
    UNPAID,
    PARTIALLY_PAID,
    PAID
}

@Entity(tableName = "invoices")
data class Invoice(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val invoiceNumber: String,
    val orderId: Long,
    val retailerId: Long,
    val retailerName: String,
    val invoiceDate: Long = System.currentTimeMillis(),
    val dueDate: Long = System.currentTimeMillis() + (30L * 24 * 60 * 60 * 1000), // 30 days
    val subtotal: Double,
    val discount: Double = 0.0,
    val tax: Double = 0.0,
    val totalAmount: Double,
    val amountPaid: Double = 0.0,
    val remainingBalance: Double,
    val paymentStatus: InvoicePaymentStatus = InvoicePaymentStatus.UNPAID,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "invoice_items")
data class InvoiceItem(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val invoiceId: Long,
    val productId: Long,
    val productName: String,
    val quantity: Int,
    val unitPrice: Double,
    val discount: Double = 0.0,
    val total: Double
)
