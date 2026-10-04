package com.example.data.local

import androidx.room.TypeConverter
import com.example.data.model.DeliveryStatus
import com.example.data.model.InvoicePaymentStatus
import com.example.data.model.MovementType
import com.example.data.model.OrderStatus
import com.example.data.model.PaymentMethod
import com.example.data.model.PaymentType
import com.example.data.model.UserRole

class Converters {
    @TypeConverter
    fun fromUserRole(value: UserRole): String = value.name

    @TypeConverter
    fun toUserRole(value: String): UserRole = try {
        UserRole.valueOf(value)
    } catch (_: Exception) {
        UserRole.SALESPERSON
    }

    @TypeConverter
    fun fromOrderStatus(value: OrderStatus): String = value.name

    @TypeConverter
    fun toOrderStatus(value: String): OrderStatus = try {
        OrderStatus.valueOf(value)
    } catch (_: Exception) {
        OrderStatus.DRAFT
    }

    @TypeConverter
    fun fromInvoicePaymentStatus(value: InvoicePaymentStatus): String = value.name

    @TypeConverter
    fun toInvoicePaymentStatus(value: String): InvoicePaymentStatus = try {
        InvoicePaymentStatus.valueOf(value)
    } catch (_: Exception) {
        InvoicePaymentStatus.UNPAID
    }

    @TypeConverter
    fun fromPaymentType(value: PaymentType): String = value.name

    @TypeConverter
    fun toPaymentType(value: String): PaymentType = try {
        PaymentType.valueOf(value)
    } catch (_: Exception) {
        PaymentType.RETAILER_COLLECTION
    }

    @TypeConverter
    fun fromPaymentMethod(value: PaymentMethod): String = value.name

    @TypeConverter
    fun toPaymentMethod(value: String): PaymentMethod = try {
        PaymentMethod.valueOf(value)
    } catch (_: Exception) {
        PaymentMethod.CASH
    }

    @TypeConverter
    fun fromMovementType(value: MovementType): String = value.name

    @TypeConverter
    fun toMovementType(value: String): MovementType = try {
        MovementType.valueOf(value)
    } catch (_: Exception) {
        MovementType.ADJUSTMENT_IN
    }

    @TypeConverter
    fun fromDeliveryStatus(value: DeliveryStatus): String = value.name

    @TypeConverter
    fun toDeliveryStatus(value: String): DeliveryStatus = try {
        DeliveryStatus.valueOf(value)
    } catch (_: Exception) {
        DeliveryStatus.SCHEDULED
    }
}
