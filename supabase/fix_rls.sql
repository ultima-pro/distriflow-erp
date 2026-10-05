-- ==============================================================================
-- DistriFlow ERP — Supabase RLS & Permissions Fix Script
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- Drop old / incomplete policies
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Owners can update profiles" ON profiles;
DROP POLICY IF EXISTS "Read products" ON products;
DROP POLICY IF EXISTS "Manage products" ON products;
DROP POLICY IF EXISTS "Retailers select policy" ON retailers;
DROP POLICY IF EXISTS "Retailers update policy" ON retailers;
DROP POLICY IF EXISTS "Retailers manage policy" ON retailers;
DROP POLICY IF EXISTS "Orders select policy" ON orders;
DROP POLICY IF EXISTS "Salespersons can create orders" ON orders;
DROP POLICY IF EXISTS "Only owners can approve orders" ON orders;
DROP POLICY IF EXISTS "Owners can delete orders" ON orders;
DROP POLICY IF EXISTS "Order items select policy" ON order_items;
DROP POLICY IF EXISTS "Order items insert policy" ON order_items;
DROP POLICY IF EXISTS "Order items update policy" ON order_items;
DROP POLICY IF EXISTS "Order items delete policy" ON order_items;
DROP POLICY IF EXISTS "Invoices select policy" ON invoices;
DROP POLICY IF EXISTS "Invoices insert policy" ON invoices;
DROP POLICY IF EXISTS "Invoices update policy" ON invoices;
DROP POLICY IF EXISTS "Invoices delete policy" ON invoices;
DROP POLICY IF EXISTS "Invoice items select policy" ON invoice_items;
DROP POLICY IF EXISTS "Invoice items insert policy" ON invoice_items;
DROP POLICY IF EXISTS "Invoice items update policy" ON invoice_items;
DROP POLICY IF EXISTS "Invoice items delete policy" ON invoice_items;
DROP POLICY IF EXISTS "Purchases select policy" ON purchases;
DROP POLICY IF EXISTS "Purchases insert policy" ON purchases;
DROP POLICY IF EXISTS "Purchases update policy" ON purchases;
DROP POLICY IF EXISTS "Purchases manage policy" ON purchases;
DROP POLICY IF EXISTS "Purchases delete policy" ON purchases;
DROP POLICY IF EXISTS "Purchase items select policy" ON purchase_items;
DROP POLICY IF EXISTS "Purchase items insert policy" ON purchase_items;
DROP POLICY IF EXISTS "Purchase items update policy" ON purchase_items;
DROP POLICY IF EXISTS "Purchase items manage policy" ON purchase_items;
DROP POLICY IF EXISTS "Purchase items delete policy" ON purchase_items;
DROP POLICY IF EXISTS "Payments select policy" ON payments;
DROP POLICY IF EXISTS "Payments insert policy" ON payments;
DROP POLICY IF EXISTS "Payments update policy" ON payments;
DROP POLICY IF EXISTS "Payments delete policy" ON payments;
DROP POLICY IF EXISTS "Deliveries select policy" ON deliveries;
DROP POLICY IF EXISTS "Deliveries insert policy" ON deliveries;
DROP POLICY IF EXISTS "Deliveries update policy" ON deliveries;
DROP POLICY IF EXISTS "Deliveries delete policy" ON deliveries;

-- Helper function to check if current user is OWNER
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'OWNER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Authenticated users can view profiles; users can insert/update their own; owners can manage all
CREATE POLICY "Users can read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR is_owner() OR NOT EXISTS (SELECT 1 FROM profiles));
CREATE POLICY "Users can update profiles" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR is_owner());
CREATE POLICY "Owners can delete profiles" ON profiles FOR DELETE TO authenticated USING (is_owner());

-- Products: Everyone authenticated can view; product modifications are owner-controlled
CREATE POLICY "Read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage products" ON products FOR ALL TO authenticated USING (is_owner());

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage categories" ON categories FOR ALL TO authenticated USING (is_owner());

-- Suppliers: Owner-controlled
CREATE POLICY "Read suppliers" ON suppliers FOR SELECT TO authenticated USING (is_owner());
CREATE POLICY "Manage suppliers" ON suppliers FOR ALL TO authenticated USING (is_owner());

-- Retailers: Salespersons can access their assigned retailers; modifications are owner-controlled
CREATE POLICY "Retailers select policy" ON retailers FOR SELECT TO authenticated USING (
  is_owner() OR assigned_salesperson_id = auth.uid()
);
CREATE POLICY "Retailers manage policy" ON retailers FOR ALL TO authenticated USING (is_owner());

-- Orders: Salespersons can see their own orders; owners can access all orders; salespersons can create for themselves
CREATE POLICY "Orders select policy" ON orders FOR SELECT TO authenticated USING (
  is_owner() OR salesperson_id = auth.uid()
);
CREATE POLICY "Salespersons can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (
  salesperson_id = auth.uid() OR is_owner()
);
CREATE POLICY "Only owners can approve orders" ON orders FOR UPDATE TO authenticated USING (
  is_owner() OR (salesperson_id = auth.uid() AND status IN ('DRAFT', 'CHANGES_REQUESTED'))
);
CREATE POLICY "Owners can delete orders" ON orders FOR DELETE TO authenticated USING (is_owner());

-- Order items: Authenticated users can SELECT, INSERT, UPDATE
CREATE POLICY "Order items select policy" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Order items insert policy" ON order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Order items update policy" ON order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Order items delete policy" ON order_items FOR DELETE TO authenticated USING (is_owner());

-- Invoices: Authenticated users can SELECT, INSERT, UPDATE
CREATE POLICY "Invoices select policy" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Invoices insert policy" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Invoices update policy" ON invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Invoices delete policy" ON invoices FOR DELETE TO authenticated USING (is_owner());

-- Invoice items: Authenticated users can SELECT, INSERT, UPDATE
CREATE POLICY "Invoice items select policy" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Invoice items insert policy" ON invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Invoice items update policy" ON invoice_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Invoice items delete policy" ON invoice_items FOR DELETE TO authenticated USING (is_owner());

-- Purchases: Owner-controlled
CREATE POLICY "Purchases select policy" ON purchases FOR SELECT TO authenticated USING (is_owner());
CREATE POLICY "Purchases manage policy" ON purchases FOR ALL TO authenticated USING (is_owner());

-- Purchase items: Owner-controlled
CREATE POLICY "Purchase items select policy" ON purchase_items FOR SELECT TO authenticated USING (is_owner());
CREATE POLICY "Purchase items manage policy" ON purchase_items FOR ALL TO authenticated USING (is_owner());

-- Payments: Authenticated users can INSERT and SELECT payments
CREATE POLICY "Payments select policy" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Payments insert policy" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Payments update policy" ON payments FOR UPDATE TO authenticated USING (is_owner());
CREATE POLICY "Payments delete policy" ON payments FOR DELETE TO authenticated USING (is_owner());

-- Inventory movements
CREATE POLICY "Movements select policy" ON inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Movements insert policy" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Movements delete policy" ON inventory_movements FOR DELETE TO authenticated USING (is_owner());

-- Deliveries: Authenticated users can SELECT, INSERT, UPDATE
CREATE POLICY "Deliveries select policy" ON deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Deliveries insert policy" ON deliveries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Deliveries update policy" ON deliveries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Deliveries delete policy" ON deliveries FOR DELETE TO authenticated USING (is_owner());

-- Helper RPC for atomic retailer balance updates
CREATE OR REPLACE FUNCTION increment_retailer_balance(retailer_id BIGINT, delta NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE retailers
  SET outstanding_balance = outstanding_balance + delta
  WHERE id = retailer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper RPC for atomic supplier balance updates
CREATE OR REPLACE FUNCTION increment_supplier_balance(p_supplier_id BIGINT, delta NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE suppliers
  SET payable_balance = payable_balance + delta
  WHERE id = p_supplier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Company Profile (Singleton Configuration)
CREATE TABLE IF NOT EXISTS company_profile (
  id BIGINT PRIMARY KEY DEFAULT 1,
  company_name TEXT NOT NULL DEFAULT 'DistriFlow ERP',
  legal_name TEXT,
  business_type TEXT DEFAULT 'Wholesale & FMCG Distribution',
  tagline TEXT DEFAULT 'Distribution Management & Wholesale Supply',
  phone TEXT DEFAULT '+977-1-4500000',
  alternate_phone TEXT,
  email TEXT DEFAULT 'info@distriflow.internal',
  website TEXT,
  address TEXT DEFAULT 'Kathmandu, Nepal',
  city TEXT DEFAULT 'Kathmandu',
  district TEXT DEFAULT 'Kathmandu',
  province TEXT DEFAULT 'Bagmati Province',
  country TEXT DEFAULT 'Nepal',
  pan_number TEXT,
  vat_number TEXT,
  registration_number TEXT,
  logo_url TEXT,
  invoice_header_logo_url TEXT,
  invoice_footer_text TEXT DEFAULT 'Thank you for your business. Cheques payable to company account.',
  receipt_footer_text TEXT DEFAULT 'Official acknowledgment of payment received.',
  default_invoice_notes TEXT DEFAULT 'Goods once sold and delivered in good order are subject to distributor return policy within 7 working days.',
  default_payment_terms TEXT DEFAULT 'Net 30 Days',
  currency TEXT DEFAULT 'NPR',
  currency_symbol TEXT DEFAULT 'Rs.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read company profile" ON company_profile;
DROP POLICY IF EXISTS "Owners manage company profile" ON company_profile;
CREATE POLICY "Read company profile" ON company_profile FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners manage company profile" ON company_profile FOR ALL TO authenticated USING (is_owner());

INSERT INTO company_profile (id, company_name, legal_name, phone, email, address, city, country)
VALUES (1, 'DistriFlow ERP', 'DistriFlow Distribution Solutions Pvt. Ltd.', '+977-1-4500000', 'info@distriflow.internal', 'Kathmandu, Nepal', 'Kathmandu', 'Nepal')
ON CONFLICT (id) DO NOTHING;

-- Audit Logs (Immutable Ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'OWNER',
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_identifier TEXT,
  description TEXT NOT NULL,
  reason TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System and users can insert audit logs" ON audit_logs;
CREATE POLICY "Owners can view audit logs" ON audit_logs FOR SELECT TO authenticated USING (is_owner());
CREATE POLICY "System and users can insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Add lifecycle columns to existing tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='status') THEN
    ALTER TABLE payments ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';
    ALTER TABLE payments ADD COLUMN reversed_at TIMESTAMPTZ;
    ALTER TABLE payments ADD COLUMN reversed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    ALTER TABLE payments ADD COLUMN reversal_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='status') THEN
    ALTER TABLE invoices ADD COLUMN status TEXT NOT NULL DEFAULT 'POSTED';
    ALTER TABLE invoices ADD COLUMN voided_at TIMESTAMPTZ;
    ALTER TABLE invoices ADD COLUMN voided_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    ALTER TABLE invoices ADD COLUMN void_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='status') THEN
    ALTER TABLE purchases ADD COLUMN status TEXT NOT NULL DEFAULT 'POSTED';
    ALTER TABLE purchases ADD COLUMN voided_at TIMESTAMPTZ;
    ALTER TABLE purchases ADD COLUMN voided_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    ALTER TABLE purchases ADD COLUMN void_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='is_archived') THEN
    ALTER TABLE orders ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE orders ADD COLUMN archived_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='archived_at') THEN
    ALTER TABLE products ADD COLUMN archived_at TIMESTAMPTZ;
    ALTER TABLE products ADD COLUMN archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='retailers' AND column_name='archived_at') THEN
    ALTER TABLE retailers ADD COLUMN archived_at TIMESTAMPTZ;
    ALTER TABLE retailers ADD COLUMN archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='archived_at') THEN
    ALTER TABLE suppliers ADD COLUMN archived_at TIMESTAMPTZ;
    ALTER TABLE suppliers ADD COLUMN archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='archived_at') THEN
    ALTER TABLE profiles ADD COLUMN archived_at TIMESTAMPTZ;
    ALTER TABLE profiles ADD COLUMN archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

