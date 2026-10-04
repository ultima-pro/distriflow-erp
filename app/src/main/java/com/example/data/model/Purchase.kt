package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "purchases")
data class Purchase(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val billNumber: String,
    val supplierId: Long,
    val supplierName: String,
    val purchaseDate: Long = System.currentTimeMillis(),
    val totalAmount: Double,
    val amountPaid: Double = 0.0,
    val paymentStatus: InvoicePaymentStatus = InvoicePaymentStatus.UNPAID,
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "purchase_items")
data class PurchaseItem(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val purchaseId: Long,
    val productId: Long,
    val productName: String,
    val quantity: Int,
    val purchasePrice: Double,
    val total: Double
)
