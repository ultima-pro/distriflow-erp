package com.example.data.repository

import com.example.data.model.User
import kotlinx.coroutines.flow.StateFlow

/**
 * Authentication Repository managing user session, authorization, and credentials.
 * The UI layer communicates exclusively through this interface without knowledge
 * of whether authentication is backed locally or via Supabase Auth.
 */
interface AuthRepository {
    val currentSession: StateFlow<User?>
    val isAuthenticated: Boolean

    suspend fun login(emailOrUsername: String, password: String): Result<User>
    suspend fun logout()
    suspend fun register(user: User): Result<User>
    suspend fun restoreSession(): User?
}
