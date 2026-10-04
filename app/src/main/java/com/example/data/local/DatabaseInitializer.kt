package com.example.data.local

import com.example.data.seed.DemoDataSeeder

/**
 * Initializes database on startup.
 * Isolates demo/prototype seeding so it can be disabled when cloud backend is connected.
 */
object DatabaseInitializer {
    suspend fun populateInitialDataIfEmpty(db: AppDatabase) {
        DemoDataSeeder.seedDemoDataIfEmpty(db)
    }
}
