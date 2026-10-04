package com.example.di

import android.content.Context
import com.example.data.datasource.AuthDataSource
import com.example.data.datasource.ErpDataSource
import com.example.data.datasource.local.LocalAuthDataSource
import com.example.data.datasource.local.RoomErpDataSource
import com.example.data.local.AppDatabase
import com.example.data.repository.*

/**
 * Dependency Container for DistriFlow ERP.
 * Cleanly separates UI/ViewModel from Data Source implementations.
 *
 * To connect Supabase in the future:
 * 1. Implement SupabaseAuthDataSource : AuthDataSource
 * 2. Implement SupabaseErpDataSource : ErpDataSource
 * 3. Replace local data source instances below.
 */
interface AppContainer {
    val authRepository: AuthRepository
    val erpRepository: ErpRepository
}

class DefaultAppContainer(private val context: Context) : AppContainer {

    private val database: AppDatabase by lazy {
        AppDatabase.getDatabase(context)
    }

    // Abstract Data Sources
    private val localErpDataSource: ErpDataSource by lazy {
        RoomErpDataSource(database)
    }

    private val localAuthDataSource: AuthDataSource by lazy {
        LocalAuthDataSource(database.userDao())
    }

    // High-Level Domain Repositories
    override val authRepository: AuthRepository by lazy {
        DefaultAuthRepository(localAuthDataSource)
    }

    override val erpRepository: ErpRepository by lazy {
        DefaultErpRepository(localErpDataSource)
    }
}
