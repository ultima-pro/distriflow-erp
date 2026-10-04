package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("DistriFlow ERP", appName)
  }

  @Test
  fun `order line calculation verifies correct total and discount`() {
    val product = com.example.data.model.Product(
      id = 1,
      sku = "TEST-01",
      name = "Test Item",
      category = "General",
      unit = "box",
      purchasePrice = 10.0,
      sellingPrice = 20.0
    )
    val draft = com.example.ui.viewmodel.OrderLineDraft(
      product = product,
      quantity = 5,
      unitPrice = 20.0,
      discountPercent = 10.0
    )
    // 5 * 20 = 100. 10% discount = 10. Total = 90.
    assertEquals(90.0, draft.total, 0.001)
  }

  @Test
  fun `auth repository registers and authenticates real user`() = kotlinx.coroutines.runBlocking {
    val mockAuthSource = object : com.example.data.datasource.AuthDataSource {
      val users = mutableListOf<com.example.data.model.User>()
      override suspend fun getUserByCredentials(emailOrUsername: String, password: String): com.example.data.model.User? =
        users.find { (it.username == emailOrUsername || it.email == emailOrUsername) && it.passwordHash == password }
      override suspend fun getUserByEmailOrUsername(emailOrUsername: String): com.example.data.model.User? =
        users.find { it.username == emailOrUsername || it.email == emailOrUsername }
      override suspend fun getUserById(id: Long): com.example.data.model.User? =
        users.find { it.id == id }
      override suspend fun registerUser(user: com.example.data.model.User): Long {
        val newId = (users.size + 1).toLong()
        users.add(user.copy(id = newId))
        return newId
      }
    }

    val authRepo = com.example.data.repository.DefaultAuthRepository(mockAuthSource)
    val newUser = com.example.data.model.User(
      username = "test_owner",
      passwordHash = "securepass",
      fullName = "Test Business Owner",
      role = com.example.data.model.UserRole.OWNER,
      email = "owner@testcorp.com"
    )

    val regResult = authRepo.register(newUser)
    org.junit.Assert.assertTrue(regResult.isSuccess)

    val loginResult = authRepo.login("test_owner", "securepass")
    org.junit.Assert.assertTrue(loginResult.isSuccess)
    assertEquals(com.example.data.model.UserRole.OWNER, authRepo.currentSession.value?.role)

    authRepo.logout()
    org.junit.Assert.assertNull(authRepo.currentSession.value)
  }
}
