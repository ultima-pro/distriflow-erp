package com.example.data.repository

import com.example.data.datasource.AuthDataSource
import com.example.data.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Default implementation of AuthRepository.
 * Manages in-app session state and delegates authentication to AuthDataSource.
 */
class DefaultAuthRepository(
    private val authDataSource: AuthDataSource
) : AuthRepository {

    private val _currentSession = MutableStateFlow<User?>(null)
    override val currentSession: StateFlow<User?> = _currentSession.asStateFlow()

    override val isAuthenticated: Boolean
        get() = _currentSession.value != null

    override suspend fun login(emailOrUsername: String, password: String): Result<User> {
        val user = authDataSource.getUserByCredentials(emailOrUsername, password)
        return if (user != null) {
            _currentSession.value = user
            Result.success(user)
        } else {
            Result.failure(IllegalArgumentException("Invalid username/email or password."))
        }
    }

    override suspend fun logout() {
        _currentSession.value = null
    }

    override suspend fun register(user: User): Result<User> {
        val existing = authDataSource.getUserByEmailOrUsername(user.username)
        if (existing != null) {
            return Result.failure(IllegalArgumentException("Username '${user.username}' is already in use."))
        }
        val newId = authDataSource.registerUser(user)
        val createdUser = user.copy(id = newId)
        return Result.success(createdUser)
    }

    override suspend fun restoreSession(): User? {
        // Ready for persistent token/refresh restoration with Supabase
        return _currentSession.value
    }
}
