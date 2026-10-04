package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.User
import com.example.data.model.UserRole
import com.example.ui.theme.*
import com.example.ui.viewmodel.ErpScreen

data class NavItem(
    val screen: ErpScreen,
    val icon: ImageVector,
    val ownerOnly: Boolean = false
)

val NavigationItems = listOf(
    NavItem(ErpScreen.DASHBOARD, Icons.Default.Dashboard),
    NavItem(ErpScreen.ORDERS, Icons.Default.ShoppingCart),
    NavItem(ErpScreen.RETAILERS, Icons.Default.Store),
    NavItem(ErpScreen.PRODUCTS, Icons.Default.Inventory2),
    NavItem(ErpScreen.INVOICES, Icons.Default.Receipt),
    NavItem(ErpScreen.DELIVERIES, Icons.Default.LocalShipping),
    NavItem(ErpScreen.PAYMENTS, Icons.Default.Payments),
    NavItem(ErpScreen.SUPPLIERS, Icons.Default.Factory, ownerOnly = true),
    NavItem(ErpScreen.INVENTORY, Icons.Default.Warehouse, ownerOnly = true),
    NavItem(ErpScreen.REPORTS, Icons.Default.Assessment, ownerOnly = true),
    NavItem(ErpScreen.SALESPERSONS, Icons.Default.Badge, ownerOnly = true)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpTopAppBar(
    currentScreen: ErpScreen,
    currentUser: User?,
    onOpenDrawer: () -> Unit,
    onLogout: () -> Unit,
    onSwitchUserClick: (() -> Unit)? = null
) {
    TopAppBar(
        title = {
            Column {
                Text(
                    text = currentScreen.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                if (currentUser != null) {
                    Text(
                        text = "DistriFlow • ${currentUser.fullName}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        },
        navigationIcon = {
            IconButton(
                onClick = onOpenDrawer,
                modifier = Modifier.testTag("nav_menu_button")
            ) {
                Icon(Icons.Default.Menu, contentDescription = "Menu")
            }
        },
        actions = {
            if (currentUser != null) {
                // Role Badge
                val isOwner = currentUser.role == UserRole.OWNER
                Surface(
                    shape = CircleShape,
                    color = if (isOwner) StatusPurpleLight else StatusBlueLight,
                    modifier = Modifier.padding(end = 8.dp)
                ) {
                    Text(
                        text = if (isOwner) "OWNER / ADMIN" else "SALES REP",
                        color = if (isOwner) StatusPurple else StatusBlue,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }

                IconButton(
                    onClick = onLogout,
                    modifier = Modifier.testTag("logout_button")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                        contentDescription = "Logout",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun ErpBottomNavBar(
    currentScreen: ErpScreen,
    currentUser: User?,
    onSelectScreen: (ErpScreen) -> Unit
) {
    val isOwner = currentUser?.role == UserRole.OWNER
    val mobileItems = if (isOwner) {
        listOf(
            NavItem(ErpScreen.DASHBOARD, Icons.Default.Dashboard),
            NavItem(ErpScreen.ORDERS, Icons.Default.ShoppingCart),
            NavItem(ErpScreen.RETAILERS, Icons.Default.Store),
            NavItem(ErpScreen.INVOICES, Icons.Default.Receipt),
            NavItem(ErpScreen.REPORTS, Icons.Default.Assessment)
        )
    } else {
        listOf(
            NavItem(ErpScreen.DASHBOARD, Icons.Default.Dashboard),
            NavItem(ErpScreen.ORDERS, Icons.Default.ShoppingCart),
            NavItem(ErpScreen.CREATE_ORDER, Icons.Default.AddCircle),
            NavItem(ErpScreen.RETAILERS, Icons.Default.Store),
            NavItem(ErpScreen.PAYMENTS, Icons.Default.Payments)
        )
    }

    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 6.dp
    ) {
        mobileItems.forEach { item ->
            val selected = currentScreen == item.screen
            NavigationBarItem(
                selected = selected,
                onClick = { onSelectScreen(item.screen) },
                icon = {
                    Icon(item.icon, contentDescription = item.screen.title)
                },
                label = {
                    Text(
                        text = item.screen.title.split(" ").first(),
                        fontSize = 11.sp,
                        maxLines = 1
                    )
                },
                modifier = Modifier.testTag("nav_bottom_${item.screen.name.lowercase()}")
            )
        }
    }
}

@Composable
fun ErpNavRail(
    currentScreen: ErpScreen,
    currentUser: User?,
    onSelectScreen: (ErpScreen) -> Unit,
    onLogout: () -> Unit
) {
    val isOwner = currentUser?.role == UserRole.OWNER
    val visibleItems = NavigationItems.filter { !it.ownerOnly || isOwner }

    NavigationRail(
        containerColor = MaterialTheme.colorScheme.surface,
        header = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(vertical = 12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(NavyPrimary, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.LocalShipping,
                        contentDescription = "DistriFlow",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "DistriFlow",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = NavyPrimary
                )
            }
        },
        modifier = Modifier.fillMaxHeight().testTag("erp_navigation_rail")
    ) {
        visibleItems.forEach { item ->
            val selected = currentScreen == item.screen
            NavigationRailItem(
                selected = selected,
                onClick = { onSelectScreen(item.screen) },
                icon = { Icon(item.icon, contentDescription = item.screen.title) },
                label = { Text(item.screen.title.split(" ").first(), fontSize = 10.sp) },
                modifier = Modifier.testTag("nav_rail_${item.screen.name.lowercase()}")
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        IconButton(
            onClick = onLogout,
            modifier = Modifier.padding(bottom = 16.dp).testTag("nav_rail_logout")
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                contentDescription = "Logout",
                tint = MaterialTheme.colorScheme.error
            )
        }
    }
}
