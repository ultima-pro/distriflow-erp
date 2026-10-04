export type UserRole = 'OWNER' | 'SALESPERSON';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: number;
  cloudId?: string; // Supabase auth UUID
}

export interface Retailer {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  assignedSalespersonId?: string | number | null;
  creditLimit: number;
  outstandingBalance: number;
  isActive: boolean;
  createdAt: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  payableBalance: number;
  isActive: boolean;
  createdAt: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
  supplierId?: number | null;
  supplierName?: string;
  isActive: boolean;
  createdAt: number;
}

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'INVOICED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  id: number;
  orderNumber: string;
  retailerId: number;
  retailerName: string;
  salespersonId: string | number;
  salespersonName: string;
  orderDate: number;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  ownerFeedback?: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  total: number;
}

export type InvoicePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  retailerId: number;
  retailerName: string;
  invoiceDate: number;
  dueDate: number;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  paymentStatus: InvoicePaymentStatus;
  createdAt: number;
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Purchase {
  id: number;
  billNumber: string;
  supplierId: number;
  supplierName: string;
  purchaseDate: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: InvoicePaymentStatus;
  notes?: string;
  createdAt: number;
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  productName: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

export type PaymentType = 'RETAILER_COLLECTION' | 'SUPPLIER_PAYMENT';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY';

export interface Payment {
  id: number;
  paymentNumber: string;
  type: PaymentType;
  entityId: number; // retailerId or supplierId
  entityName: string;
  invoiceId?: number | null;
  purchaseId?: number | null;
  amount: number;
  paymentDate: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  recordedByUserId?: string | number;
  recordedByName: string;
  createdAt: number;
}

export type MovementType =
  | 'PURCHASE_RECEIPT'
  | 'ORDER_DELIVERY'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT';

export interface InventoryMovement {
  id: number;
  productId: number;
  productName: string;
  movementType: MovementType;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  referenceType: string;
  referenceId?: number | null;
  referenceNumber?: string;
  reasonOrNotes?: string;
  timestamp: number;
}

export type DeliveryStatus = 'SCHEDULED' | 'DISPATCHED' | 'DELIVERED' | 'FAILED';

export interface Delivery {
  id: number;
  orderId: number;
  orderNumber: string;
  invoiceId?: number | null;
  invoiceNumber?: string;
  retailerId: number;
  retailerName: string;
  deliveryAddress: string;
  driverName?: string;
  driverPhone?: string;
  status: DeliveryStatus;
  scheduledDate: number;
  deliveredDate?: number | null;
  notes?: string;
  createdAt: number;
}

export interface OrderLineDraft {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  total: number;
}
