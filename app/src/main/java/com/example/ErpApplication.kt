package com.example

import android.app.Application
import com.example.data.local.AppDatabase
import com.example.data.local.DatabaseInitializer
import com.example.di.AppContainer
import com.example.di.DefaultAppContainer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class ErpApplication : Application() {

    lateinit var appContainer: AppContainer
        private set

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        appContainer = DefaultAppContainer(this)

        // Preload/verify initial database state asynchronously
        applicationScope.launch {
            val db = AppDatabase.getDatabase(this@ErpApplication)
            DatabaseInitializer.populateInitialDataIfEmpty(db)
        }
    }
}
