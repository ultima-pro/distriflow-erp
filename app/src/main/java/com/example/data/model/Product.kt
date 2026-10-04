package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class Product(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val sku: String,
    val name: String,
    val category: String,
    val unit: String = "pcs", // e.g., pcs, box, carton, kg
    val purchasePrice: Double,
    val sellingPrice: Double,
    val currentStock: Int = 0,
    val minStockLevel: Int = 10,
    val supplierId: Long? = null,
    val supplierName: String = "",
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)
