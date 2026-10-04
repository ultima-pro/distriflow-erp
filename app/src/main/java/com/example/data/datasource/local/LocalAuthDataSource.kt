package com.example.data.datasource.local

import com.example.data.datasource.AuthDataSource
import com.example.data.local.UserDao
import com.example.data.model.User

/**
 * Local Room-based implementation of AuthDataSource.
 * Handles local user lookup and credential checking.
 * When Supabase is connected, SupabaseAuthDataSource will be used instead.
 */
class LocalAuthDataSource(private val userDao: UserDao) : AuthDataSource {

    override suspend fun getUserByCredentials(emailOrUsername: String, password: String): User? {
        val cleanIdentifier = emailOrUsername.trim()
        val user = userDao.getUserByUsername(cleanIdentifier)
        return if (user != null && user.passwordHash == password && user.isActive) {
            user
        } else {
            null
        }
    }

    override suspend fun getUserByEmailOrUsername(emailOrUsername: String): User? {
        return userDao.getUserByUsername(emailOrUsername.trim())
    }

    override suspend fun getUserById(id: Long): User? {
        return userDao.getUserById(id)
    }

    override suspend fun registerUser(user: User): Long {
        return userDao.insertUser(user)
    }
}
