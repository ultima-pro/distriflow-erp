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
  archivedAt?: number;
  archivedBy?: string;
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
  archivedAt?: number;
  archivedBy?: string;
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
  archivedAt?: number;
  archivedBy?: string;
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
  archivedAt?: number;
  archivedBy?: string;
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
  isArchived?: boolean;
  archivedAt?: number;
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

export type InvoicePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'VOIDED';
export type FinancialRecordStatus = 'POSTED' | 'VOIDED';

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
  status?: FinancialRecordStatus;
  voidedAt?: number;
  voidedBy?: string;
  voidReason?: string;
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
  status?: FinancialRecordStatus;
  voidedAt?: number;
  voidedBy?: string;
  voidReason?: string;
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
export type PaymentStatus = 'ACTIVE' | 'REVERSED';

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
  status?: PaymentStatus;
  reversedAt?: number;
  reversedBy?: string;
  reversalReason?: string;
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

export interface DeleteResult {
  deleted: boolean;
  deactivated: boolean;
  message?: string;
}

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

// --- Company / Business Profile ---
export interface CompanyProfile {
  id?: number;
  companyName: string;
  legalName?: string;
  businessType?: string;
  tagline?: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  district?: string;
  province?: string;
  country: string;
  panNumber?: string;
  vatNumber?: string;
  registrationNumber?: string;
  logoUrl?: string;
  invoiceHeaderLogoUrl?: string;
  invoiceFooterText?: string;
  receiptFooterText?: string;
  defaultInvoiceNotes?: string;
  defaultPaymentTerms?: string;
  currency: string;
  currencySymbol: string;
  updatedAt?: number;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'DistriFlow ERP',
  legalName: 'DistriFlow Distribution Solutions Pvt. Ltd.',
  businessType: 'Wholesale & FMCG Distribution',
  tagline: 'Distribution Management & Wholesale Supply',
  phone: '+977-1-4500000',
  alternatePhone: '+977 9801234567',
  email: 'info@distriflow.internal',
  website: 'www.distriflow.internal',
  address: 'Kathmandu, Nepal',
  city: 'Kathmandu',
  district: 'Kathmandu',
  province: 'Bagmati Province',
  country: 'Nepal',
  panNumber: '600123456',
  vatNumber: '600123456',
  registrationNumber: 'REG-104928/080',
  invoiceFooterText: 'Thank you for your business. Cheques payable to company account.',
  receiptFooterText: 'Official acknowledgment of payment received.',
  defaultInvoiceNotes: 'Goods once sold and delivered in good order are subject to distributor return policy within 7 working days.',
  defaultPaymentTerms: 'Net 30 Days',
  currency: 'NPR',
  currencySymbol: 'Rs.',
};

// --- Audit & Activity Log ---
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'PERMANENT_DELETE'
  | 'VOID'
  | 'REVERSE_PAYMENT'
  | 'CREATE_INVOICE'
  | 'RECORD_COLLECTION'
  | 'RECORD_DISBURSEMENT'
  | 'STATUS_CHANGE'
  | 'DELIVERY_DISPATCH'
  | 'DELIVERY_COMPLETE'
  | 'STOCK_ADJUSTMENT'
  | 'COMPANY_PROFILE_UPDATE';

export type AuditModule =
  | 'PRODUCTS'
  | 'RETAILERS'
  | 'SUPPLIERS'
  | 'ORDERS'
  | 'INVOICES'
  | 'PAYMENTS'
  | 'DELIVERIES'
  | 'SALES_TEAM'
  | 'COMPANY_PROFILE'
  | 'INVENTORY';

export interface AuditLog {
  id: number;
  userId?: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  module: AuditModule;
  recordId: string;
  recordIdentifier?: string;
  description: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

// --- Recycle Bin Model ---
export interface RecycleBinItem {
  id: number | string;
  numericId: number;
  module: 'PRODUCTS' | 'RETAILERS' | 'SUPPLIERS' | 'SALES_TEAM' | 'ORDERS';
  name: string;
  identifier: string;
  archivedAt: number;
  archivedBy?: string;
  hasHistoricalReferences: boolean;
  dependencyNote?: string;
}

