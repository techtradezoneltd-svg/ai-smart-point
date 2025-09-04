-- Add more sample products to make the system functional
INSERT INTO public.products (id, name, sku, description, cost_price, selling_price, current_stock, min_stock_level, max_stock_level, category_id, unit_id, barcode, is_active) VALUES
-- Electronics
(gen_random_uuid(), 'iPhone 15 Pro', 'IP15P-128', 'Latest iPhone with advanced camera system', 800.00, 1200.00, 25, 5, 100, (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1), (SELECT id FROM units WHERE name = 'Piece' LIMIT 1), '194253000000', true),
(gen_random_uuid(), 'Samsung Galaxy S24', 'SGS24-256', 'Premium Android smartphone', 700.00, 1000.00, 15, 3, 50, (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1), (SELECT id FROM units WHERE name = 'Piece' LIMIT 1), '194253000001', true),
(gen_random_uuid(), 'MacBook Air M3', 'MBA-M3-256', 'Lightweight laptop with M3 chip', 1000.00, 1499.00, 8, 2, 20, (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1), (SELECT id FROM units WHERE name = 'Piece' LIMIT 1), '194253000002', true),
(gen_random_uuid(), 'AirPods Pro 2', 'APP2-USB-C', 'Wireless earbuds with noise cancellation', 180.00, 249.00, 30, 10, 100, (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1), (SELECT id FROM units WHERE name = 'Piece' LIMIT 1), '194253000003', true),

-- Clothing
(gen_random_uuid(), 'Cotton T-Shirt', 'CTS-001-L', 'Comfortable cotton t-shirt, size L', 8.00, 25.00, 50, 20, 200, (SELECT id FROM categories WHERE name = 'Clothing' LIMIT 1), (SELECT id FROM units WHERE name = 'Piece' LIMIT 1), '194253000004', true),
(gen_random_uuid(), 'Denim Jeans', 'DJ-32x32', 'Classic blue denim jeans, 32x32', 25.00, 65.00, 30, 10, 100, (SELECT id FROM categories WHERE name = 'Clothing' LIMIT 1), (SELECT id FROM units WHERE name = 'Piece' LIMIT 1), '194253000005', true),
(gen_random_uuid(), 'Sneakers', 'SNK-42-WHT', 'White sneakers, size 42', 40.00, 89.00, 20, 5, 50, (SELECT id FROM categories WHERE name = 'Clothing' LIMIT 1), (SELECT id FROM units WHERE name = 'Pair' LIMIT 1), '194253000006', true),

-- Food & Beverages
(gen_random_uuid(), 'Organic Coffee Beans', 'OCB-1KG', 'Premium organic coffee beans', 12.00, 28.00, 40, 15, 100, (SELECT id FROM categories WHERE name = 'Food & Beverages' LIMIT 1), (SELECT id FROM units WHERE name = 'Kilogram' LIMIT 1), '194253000007', true),
(gen_random_uuid(), 'Green Tea Bags', 'GTB-100CT', '100 count green tea bags', 5.00, 15.00, 60, 20, 200, (SELECT id FROM categories WHERE name = 'Food & Beverages' LIMIT 1), (SELECT id FROM units WHERE name = 'Box' LIMIT 1), '194253000008', true),
(gen_random_uuid(), 'Chocolate Bar', 'CHB-DARK-100G', 'Dark chocolate bar 100g', 2.00, 6.00, 100, 30, 300, (SELECT id FROM categories WHERE name = 'Food & Beverages' LIMIT 1), (SELECT id FROM units WHERE name = 'Piece' LIMIT 1), '194253000009', true),

-- Books
(gen_random_uuid(), 'JavaScript Guide', 'JSG-2024', 'Complete JavaScript programming guide', 15.00, 45.00, 25, 5, 50, (SELECT id FROM categories WHERE name = 'Books' LIMIT 1), (SELECT id FROM units WHERE name = 'Piece' LIMIT 1), '194253000010', true),
(gen_random_uuid(), 'Business Strategy', 'BS-MGMT-001', 'Modern business strategy handbook', 20.00, 55.00, 15, 3, 30, (SELECT id FROM categories WHERE name = 'Books' LIMIT 1), (SELECT id FROM units WHERE name = 'Piece' LIMIT 1), '194253000011', true);

-- Insert some AI recommendations
INSERT INTO public.ai_recommendations (type, title, message, priority, data) VALUES
('restock', 'Low Stock Alert', 'iPhone 15 Pro stock is running low. Consider restocking soon.', 'high', '{"product_id": "iPhone 15 Pro", "current_stock": 25, "min_stock": 5}'),
('pricing', 'Price Optimization', 'Samsung Galaxy S24 could benefit from a 10% promotional discount this week.', 'medium', '{"product": "Samsung Galaxy S24", "suggested_discount": 10}'),
('trend', 'Sales Trend', 'Coffee products showing 23% increase in sales this month.', 'low', '{"category": "Food & Beverages", "trend": "up", "percentage": 23}');