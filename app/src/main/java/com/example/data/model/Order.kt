package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class OrderStatus {
    DRAFT,
    SUBMITTED,
    CHANGES_REQUESTED,
    APPROVED,
    REJECTED,
    INVOICED,
    DISPATCHED,
    DELIVERED,
    CANCELLED
}

@Entity(tableName = "orders")
data class Order(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val orderNumber: String,
    val retailerId: Long,
    val retailerName: String,
    val salespersonId: Long,
    val salespersonName: String,
    val orderDate: Long = System.currentTimeMillis(),
    val status: OrderStatus = OrderStatus.DRAFT,
    val subtotal: Double = 0.0,
    val discount: Double = 0.0,
    val totalAmount: Double = 0.0,
    val notes: String = "",
    val ownerFeedback: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "order_items")
data class OrderItem(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val orderId: Long,
    val productId: Long,
    val productName: String,
    val productSku: String,
    val quantity: Int,
    val unitPrice: Double,
    val discountPercent: Double = 0.0,
    val total: Double
)
