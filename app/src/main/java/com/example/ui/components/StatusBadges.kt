package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.DeliveryStatus
import com.example.data.model.InvoicePaymentStatus
import com.example.data.model.OrderStatus
import com.example.ui.theme.*

@Composable
fun OrderStatusBadge(status: OrderStatus, modifier: Modifier = Modifier) {
    val (bgColor, textColor, label) = when (status) {
        OrderStatus.DRAFT -> Triple(Slate200, Slate700, "Draft")
        OrderStatus.SUBMITTED -> Triple(StatusBlueLight, StatusBlue, "Submitted")
        OrderStatus.CHANGES_REQUESTED -> Triple(StatusAmberLight, StatusAmber, "Changes Req.")
        OrderStatus.APPROVED -> Triple(StatusGreenLight, StatusGreen, "Approved")
        OrderStatus.REJECTED -> Triple(StatusRedLight, StatusRed, "Rejected")
        OrderStatus.INVOICED -> Triple(StatusPurpleLight, StatusPurple, "Invoiced")
        OrderStatus.DISPATCHED -> Triple(Color(0xFFE0F2FE), Color(0xFF0369A1), "Dispatched")
        OrderStatus.DELIVERED -> Triple(Color(0xFFDCFCE7), Color(0xFF15803D), "Delivered")
        OrderStatus.CANCELLED -> Triple(Slate200, Slate600, "Cancelled")
    }

    Box(
        modifier = modifier
            .testTag("order_status_badge_${status.name}")
            .background(bgColor, RoundedCornerShape(12.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun PaymentStatusBadge(status: InvoicePaymentStatus, modifier: Modifier = Modifier) {
    val (bgColor, textColor, label) = when (status) {
        InvoicePaymentStatus.UNPAID -> Triple(StatusRedLight, StatusRed, "Unpaid")
        InvoicePaymentStatus.PARTIALLY_PAID -> Triple(StatusAmberLight, StatusAmber, "Partial")
        InvoicePaymentStatus.PAID -> Triple(StatusGreenLight, StatusGreen, "Paid")
    }

    Box(
        modifier = modifier
            .testTag("payment_status_badge_${status.name}")
            .background(bgColor, RoundedCornerShape(12.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun DeliveryStatusBadge(status: DeliveryStatus, modifier: Modifier = Modifier) {
    val (bgColor, textColor, label) = when (status) {
        DeliveryStatus.SCHEDULED -> Triple(StatusBlueLight, StatusBlue, "Scheduled")
        DeliveryStatus.DISPATCHED -> Triple(StatusAmberLight, StatusAmber, "In Transit")
        DeliveryStatus.DELIVERED -> Triple(StatusGreenLight, StatusGreen, "Delivered")
        DeliveryStatus.FAILED -> Triple(StatusRedLight, StatusRed, "Failed")
    }

    Box(
        modifier = modifier
            .testTag("delivery_status_badge_${status.name}")
            .background(bgColor, RoundedCornerShape(12.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String? = null,
    icon: ImageVector? = null,
    iconColor: Color = NavyPrimary,
    containerColor: Color = MaterialTheme.colorScheme.surface,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.testTag("metric_card_${title.lowercase().replace(" ", "_")}"),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = Slate600
                )
                if (icon != null) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(iconColor.copy(alpha = 0.12f), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = title,
                            tint = iconColor,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            if (!subtitle.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate400
                )
            }
        }
    }
}
