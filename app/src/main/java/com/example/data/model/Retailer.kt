package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "retailers")
data class Retailer(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val contactPerson: String,
    val phone: String,
    val email: String = "",
    val address: String,
    val city: String = "",
    val assignedSalespersonId: Long? = null,
    val creditLimit: Double = 5000.0,
    val outstandingBalance: Double = 0.0,
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)
