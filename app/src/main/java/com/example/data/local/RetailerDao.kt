package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.Retailer
import kotlinx.coroutines.flow.Flow

@Dao
interface RetailerDao {
    @Query("SELECT * FROM retailers ORDER BY name ASC")
    fun getAllRetailers(): Flow<List<Retailer>>

    @Query("SELECT * FROM retailers WHERE assignedSalespersonId = :salespersonId AND isActive = 1 ORDER BY name ASC")
    fun getRetailersBySalesperson(salespersonId: Long): Flow<List<Retailer>>

    @Query("SELECT * FROM retailers WHERE id = :id LIMIT 1")
    suspend fun getRetailerById(id: Long): Retailer?

    @Query("SELECT * FROM retailers WHERE id = :id LIMIT 1")
    fun observeRetailerById(id: Long): Flow<Retailer?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRetailer(retailer: Retailer): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRetailers(retailers: List<Retailer>)

    @Update
    suspend fun updateRetailer(retailer: Retailer)

    @Query("UPDATE retailers SET outstandingBalance = outstandingBalance + :amountDelta WHERE id = :retailerId")
    suspend fun updateOutstandingBalance(retailerId: Long, amountDelta: Double)
}
