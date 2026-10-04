package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.data.model.Payment
import com.example.data.model.PaymentType
import kotlinx.coroutines.flow.Flow

@Dao
interface PaymentDao {
    @Query("SELECT * FROM payments ORDER BY paymentDate DESC")
    fun getAllPayments(): Flow<List<Payment>>

    @Query("SELECT * FROM payments WHERE type = :type ORDER BY paymentDate DESC")
    fun getPaymentsByType(type: PaymentType): Flow<List<Payment>>

    @Query("SELECT * FROM payments WHERE entityId = :entityId AND type = :type ORDER BY paymentDate DESC")
    fun getPaymentsForEntity(entityId: Long, type: PaymentType): Flow<List<Payment>>

    @Query("SELECT * FROM payments WHERE recordedByUserId = :salespersonId AND type = 'RETAILER_COLLECTION' ORDER BY paymentDate DESC")
    fun getCollectionsBySalesperson(salespersonId: Long): Flow<List<Payment>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayment(payment: Payment): Long
}
