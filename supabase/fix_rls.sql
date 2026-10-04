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
