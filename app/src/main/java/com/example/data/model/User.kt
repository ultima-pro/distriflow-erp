package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class UserRole {
    OWNER,
    SALESPERSON
}

@Entity(tableName = "users")
data class User(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val username: String,
    val passwordHash: String,
    val fullName: String,
    val role: UserRole,
    val phone: String = "",
    val email: String = "",
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)
