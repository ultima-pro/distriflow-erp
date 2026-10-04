package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.Delivery
import com.example.data.model.DeliveryStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface DeliveryDao {
    @Query("SELECT * FROM deliveries ORDER BY scheduledDate DESC")
    fun getAllDeliveries(): Flow<List<Delivery>>

    @Query("SELECT * FROM deliveries WHERE status = :status ORDER BY scheduledDate DESC")
    fun getDeliveriesByStatus(status: DeliveryStatus): Flow<List<Delivery>>

    @Query("SELECT * FROM deliveries WHERE orderId = :orderId LIMIT 1")
    suspend fun getDeliveryByOrderId(orderId: Long): Delivery?

    @Query("SELECT * FROM deliveries WHERE id = :id LIMIT 1")
    suspend fun getDeliveryById(id: Long): Delivery?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDelivery(delivery: Delivery): Long

    @Update
    suspend fun updateDelivery(delivery: Delivery)

    @Query("UPDATE deliveries SET status = :status, deliveredDate = :deliveredDate, notes = :notes WHERE id = :deliveryId")
    suspend fun updateDeliveryStatus(deliveryId: Long, status: DeliveryStatus, deliveredDate: Long?, notes: String)
}
