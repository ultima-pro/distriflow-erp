package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.Invoice
import com.example.data.model.InvoiceItem
import com.example.data.model.InvoicePaymentStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface InvoiceDao {
    @Query("SELECT * FROM invoices ORDER BY invoiceDate DESC")
    fun getAllInvoices(): Flow<List<Invoice>>

    @Query("SELECT * FROM invoices WHERE retailerId = :retailerId ORDER BY invoiceDate DESC")
    fun getInvoicesByRetailer(retailerId: Long): Flow<List<Invoice>>

    @Query("SELECT * FROM invoices WHERE orderId = :orderId LIMIT 1")
    suspend fun getInvoiceByOrderId(orderId: Long): Invoice?

    @Query("SELECT * FROM invoices WHERE id = :id LIMIT 1")
    suspend fun getInvoiceById(id: Long): Invoice?

    @Query("SELECT * FROM invoices WHERE id = :id LIMIT 1")
    fun observeInvoiceById(id: Long): Flow<Invoice?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInvoice(invoice: Invoice): Long

    @Update
    suspend fun updateInvoice(invoice: Invoice)

    @Query("UPDATE invoices SET amountPaid = amountPaid + :amount, remainingBalance = remainingBalance - :amount, paymentStatus = :status WHERE id = :invoiceId")
    suspend fun recordInvoicePayment(invoiceId: Long, amount: Double, status: InvoicePaymentStatus)

    // Invoice items
    @Query("SELECT * FROM invoice_items WHERE invoiceId = :invoiceId")
    fun getItemsForInvoice(invoiceId: Long): Flow<List<InvoiceItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInvoiceItems(items: List<InvoiceItem>)
}
