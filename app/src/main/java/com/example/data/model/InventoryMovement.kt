package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class MovementType {
    PURCHASE_RECEIPT,
    ORDER_DELIVERY,
    ADJUSTMENT_IN,
    ADJUSTMENT_OUT
}

@Entity(tableName = "inventory_movements")
data class InventoryMovement(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val productId: Long,
    val productName: String,
    val movementType: MovementType,
    val quantity: Int, // positive change or negative change
    val previousStock: Int,
    val newStock: Int,
    val referenceType: String, // "PURCHASE", "ORDER", "MANUAL_ADJUSTMENT"
    val referenceId: Long? = null,
    val referenceNumber: String = "",
    val reasonOrNotes: String = "",
    val timestamp: Long = System.currentTimeMillis()
)
