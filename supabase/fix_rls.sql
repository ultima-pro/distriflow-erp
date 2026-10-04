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
DROP POLICY IF EXISTS "Orders select policy" ON orders;
DROP POLICY IF EXISTS "Salespersons can create orders" ON orders;
DROP POLICY IF EXISTS "Only owners can approve orders" ON orders;

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

-- Products: Everyone authenticated can view; owners can manage
CREATE POLICY "Read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage products" ON products FOR ALL TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage categories" ON categories FOR ALL TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Suppliers: Authenticated can view; owners can manage
CREATE POLICY "Read suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage suppliers" ON suppliers FOR ALL TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Retailers: Owners can manage all; Salespersons can view and update
CREATE POLICY "Retailers select policy" ON retailers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Retailers insert policy" ON retailers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Retailers update policy" ON retailers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Retailers delete policy" ON retailers FOR DELETE TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Orders: Salespersons can insert/read; Owners can manage all
CREATE POLICY "Orders select policy" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Orders insert policy" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Orders update policy" ON orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Orders delete policy" ON orders FOR DELETE TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Order items
CREATE POLICY "Order items select policy" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Order items insert policy" ON order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Order items update policy" ON order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Order items delete policy" ON order_items FOR DELETE TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Invoices & Items
CREATE POLICY "Invoices select policy" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Invoices insert policy" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Invoices update policy" ON invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Invoices delete policy" ON invoices FOR DELETE TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

CREATE POLICY "Invoice items select policy" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Invoice items insert policy" ON invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Invoice items update policy" ON invoice_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Invoice items delete policy" ON invoice_items FOR DELETE TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Purchases & Items
CREATE POLICY "Purchases select policy" ON purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Purchases insert policy" ON purchases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Purchases update policy" ON purchases FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Purchases delete policy" ON purchases FOR DELETE TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

CREATE POLICY "Purchase items select policy" ON purchase_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Purchase items insert policy" ON purchase_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Purchase items update policy" ON purchase_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Purchase items delete policy" ON purchase_items FOR DELETE TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Payments
CREATE POLICY "Payments select policy" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Payments insert policy" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Payments update policy" ON payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Payments delete policy" ON payments FOR DELETE TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Inventory movements
CREATE POLICY "Movements select policy" ON inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Movements insert policy" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Movements delete policy" ON inventory_movements FOR DELETE TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Deliveries
CREATE POLICY "Deliveries select policy" ON deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Deliveries insert policy" ON deliveries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Deliveries update policy" ON deliveries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Deliveries delete policy" ON deliveries FOR DELETE TO authenticated USING (is_owner() OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'OWNER'));

-- Helper RPC for atomic retailer balance updates
CREATE OR REPLACE FUNCTION increment_retailer_balance(retailer_id BIGINT, delta NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE retailers
  SET outstanding_balance = outstanding_balance + delta
  WHERE id = retailer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
