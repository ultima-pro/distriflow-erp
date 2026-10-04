package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class PaymentType {
    RETAILER_COLLECTION,
    SUPPLIER_PAYMENT
}

enum class PaymentMethod {
    CASH,
    BANK_TRANSFER,
    CHEQUE,
    MOBILE_MONEY
}

@Entity(tableName = "payments")
data class Payment(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val paymentNumber: String,
    val type: PaymentType,
    val entityId: Long, // retailerId or supplierId
    val entityName: String,
    val invoiceId: Long? = null,
    val purchaseId: Long? = null,
    val amount: Double,
    val paymentDate: Long = System.currentTimeMillis(),
    val paymentMethod: PaymentMethod = PaymentMethod.CASH,
    val referenceNumber: String = "",
    val notes: String = "",
    val recordedByUserId: Long,
    val recordedByName: String,
    val createdAt: Long = System.currentTimeMillis()
)
