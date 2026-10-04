package com.example.data.datasource

import com.example.data.model.User

/**
 * Authentication data source contract.
 * Separates authentication from business data operations.
 * Allows switching between Local Room and Supabase GoTrue Auth.
 */
interface AuthDataSource {
    suspend fun getUserByCredentials(emailOrUsername: String, password: String): User?
    suspend fun getUserByEmailOrUsername(emailOrUsername: String): User?
    suspend fun getUserById(id: Long): User?
    suspend fun registerUser(user: User): Long
}
