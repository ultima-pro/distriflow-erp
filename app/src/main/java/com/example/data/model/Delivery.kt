package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class DeliveryStatus {
    SCHEDULED,
    DISPATCHED,
    DELIVERED,
    FAILED
}

@Entity(tableName = "deliveries")
data class Delivery(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val orderId: Long,
    val orderNumber: String,
    val invoiceId: Long? = null,
    val invoiceNumber: String = "",
    val retailerId: Long,
    val retailerName: String,
    val deliveryAddress: String,
    val driverName: String = "",
    val driverPhone: String = "",
    val status: DeliveryStatus = DeliveryStatus.SCHEDULED,
    val scheduledDate: Long = System.currentTimeMillis(),
    val deliveredDate: Long? = null,
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
