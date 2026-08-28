-- DREAM Cosmetic & Skincare E-Commerce Database Schema
-- Compatible with MySQL 8.0+ / MariaDB / XAMPP / WAMP

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notification_logs;
DROP TABLE IF EXISTS chatbot_messages;
DROP TABLE IF EXISTS chatbot_conversations;
DROP TABLE IF EXISTS skin_analysis;
DROP TABLE IF EXISTS skin_profiles;
DROP TABLE IF EXISTS coupon_usage;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS product_reviews;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table (Customers)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Admins Table
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'super_admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Categories Table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    status ENUM('active', 'disabled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3.1 Sub-Categories Table
CREATE TABLE subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Brands Table
CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Products Table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    brand_id INT,
    category_id INT,
    sub_category VARCHAR(150),
    sub_category_slug VARCHAR(150),
    original_price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2),
    stock_qty INT DEFAULT 0,
    rating_avg DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    main_image VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients TEXT,
    benefits TEXT,
    how_to_use TEXT,
    suitable_skin_types VARCHAR(255) COMMENT 'Comma separated: Oily,Dry,Combination,Sensitive,Normal',
    skin_concerns VARCHAR(255) COMMENT 'Comma separated: Acne,Redness,Dark Spots,Wrinkles,Dryness,Uneven Tone',
    is_featured TINYINT(1) DEFAULT 0,
    is_bestseller TINYINT(1) DEFAULT 0,
    is_new_arrival TINYINT(1) DEFAULT 0,
    status ENUM('active', 'draft', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Product Images Table
CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Product Reviews Table
CREATE TABLE product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(150),
    comment TEXT,
    image_url VARCHAR(255),
    status ENUM('pending', 'approved', 'hidden') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Wishlists Table
CREATE TABLE wishlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY user_prod_unique (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Cart Table
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(100),
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Addresses Table
CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    is_default TINYINT(1) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Orders Table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    shipping_fee DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    coupon_code VARCHAR(50),
    order_status ENUM('Placed', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Placed',
    payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Order Items Table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Coupons Table
CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_usage INT DEFAULT 1000,
    times_used INT DEFAULT 0,
    expires_at DATETIME,
    status ENUM('active', 'disabled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Skin Profiles & Quiz Table
CREATE TABLE skin_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skin_type VARCHAR(50),
    oiliness_level VARCHAR(50),
    dryness_level VARCHAR(50),
    primary_concern VARCHAR(100),
    secondary_concern VARCHAR(100),
    preferred_product_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. AI Skin Analysis Table
CREATE TABLE skin_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    image_url VARCHAR(255),
    skin_type VARCHAR(50),
    oiliness VARCHAR(50),
    dryness VARCHAR(50),
    redness VARCHAR(50),
    blemishes VARCHAR(50),
    dark_spots VARCHAR(50),
    uneven_tone VARCHAR(50),
    under_eye VARCHAR(50),
    texture VARCHAR(50),
    overall_health_score INT DEFAULT 85,
    analysis_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- SEED DATA
-- ========================================================

-- Admins Seed
INSERT INTO admins (username, email, password_hash, role) VALUES
('admin', 'admin@dream.com', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1e8E0KkC1J/mY9o5pC7rS9s9y6e4s0.', 'super_admin');
-- Default password: admin123

-- Users Seed
INSERT INTO users (full_name, email, phone, password_hash, status) VALUES
('Jane Doe', 'jane@example.com', '+1 (555) 234-5678', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1e8E0KkC1J/mY9o5pC7rS9s9y6e4s0.', 'active'),
('Alex Smith', 'alex@example.com', '+1 (555) 987-6543', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1e8E0KkC1J/mY9o5pC7rS9s9y6e4s0.', 'active');

-- Brands Seed
INSERT INTO brands (id, name, slug, logo_url) VALUES
(1, 'GlowLab', 'glowlab', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200'),
(2, 'Botanical Lux', 'botanical-lux', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200'),
(3, 'Aura Derm', 'aura-derm', 'https://images.unsplash.com/photo-1608248597261-e4d0450cbf1c?w=200'),
(4, 'PureRadiance', 'pureradiance', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200'),
(5, 'ZenSkin', 'zenskin', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=200');

-- Categories Seed
INSERT INTO categories (id, name, slug, description, image_url, status) VALUES
(1, 'Mack up', 'mack-up', '', 'https://i.pinimg.com/736x/03/04/9a/03049a0d2b32cc50a086e3c396ac9eb4.jpg', 'active'),
(3, 'Hair care', 'hair-care', '', 'https://i.pinimg.com/736x/c8/0f/be/c80fbec28bdad8066aa290f0a4fd729f.jpg', 'active'),
(5, 'Fragrance', 'fragrance', '', 'https://i.pinimg.com/736x/07/71/ed/0771edee4246abc5f034c3be2e739e74.jpg', 'active'),
(6, 'Skin care', 'skin-care', '', 'https://i.pinimg.com/736x/c1/31/ec/c131ec684397ade5bc350f235caea578.jpg', 'active'),
(7, 'Bath and body', 'bath-and-body', '', 'https://i.pinimg.com/736x/4a/60/32/4a60323ec9ee00f401fbfb7b3ef0878a.jpg', 'active');

-- Sub-Categories Seed
INSERT INTO subcategories (id, category_id, name, slug, description, image_url, icon) VALUES
(101, 1, 'Lipstick', 'lipstick', '', 'https://i.pinimg.com/736x/fb/84/28/fb84283996b6fcfbc226a3cf7af56160.jpg', ''),
(102, 1, 'Foundation', 'foundation', '', 'https://i.pinimg.com/1200x/9b/3a/e5/9b3ae5fb897da6d18b6b3b01950d09b6.jpg', ''),
(103, 1, 'Mascara', 'mascara', '', 'https://i.pinimg.com/736x/50/76/18/50761868929df6009e48c437f243c268.jpg', ''),
(104, 1, 'Blush', 'blush', '', 'https://i.pinimg.com/736x/58/a1/09/58a10975126b061fca1e5a0a96c600b3.jpg', ''),
(105, 1, ' Tools and brushes', 'tools-and-brushes', '', 'https://i.pinimg.com/736x/61/ae/4e/61ae4ea603f447f3c70f0c8a62f60a79.jpg', ''),
(301, 3, 'Shampoo', 'shampoo', '', 'https://i.pinimg.com/736x/5d/aa/71/5daa71d84c15531d8e3baad871e043ae.jpg', ''),
(302, 3, 'Conditioner', 'conditioner', '', 'https://i.pinimg.com/1200x/59/d5/99/59d5990985698794dae3c4c965cbb3f7.jpg', ''),
(303, 3, 'Hair Mask ', 'hair-mask', '', 'https://i.pinimg.com/1200x/d5/17/33/d517330436055c8f83d51478a593ff3e.jpg', ''),
(304, 3, 'Serum', 'serum', '', 'https://i.pinimg.com/1200x/b4/3a/00/b43a004b97d785cfb87112df7278772b.jpg', ''),
(305, 3, 'Hair oil', 'hair-oil', '', 'https://i.pinimg.com/736x/0d/77/33/0d773397923dcd7f5a12f613b147a195.jpg', ''),
(502, 5, 'Minis', 'minis', '', 'https://i.pinimg.com/736x/00/d6/69/00d6695798d388166ae7405a4cb8caa5.jpg', ''),
(503, 5, 'Special Collection', 'special-collection', '', 'https://i.pinimg.com/736x/79/3a/d1/793ad1b1626b7f536f85fb1b98011c0f.jpg', ''),
(504, 5, 'Women', 'women', '', 'https://i.pinimg.com/736x/45/4f/ca/454fca30058b9be6a9829d6ee3d32a17.jpg', ''),
(505, 5, 'Men', 'men', '', 'https://i.pinimg.com/736x/ae/6c/4a/ae6c4a38b14ec8cb6c0ed12b1fe34e92.jpg', ''),
(601, 6, 'Moisturiser ', 'moisturiser', '', 'https://i.pinimg.com/736x/b7/7d/4f/b77d4f223734fc4a20a6b13ccb9ab04a.jpg', ''),
(602, 6, ' Sunscreen', 'sunscreen', '', 'https://i.pinimg.com/736x/70/cf/98/70cf98569e380ec6fcdd2e44ce0e666d.jpg', ''),
(603, 6, '  Cleanser', 'cleanser', '', 'https://i.pinimg.com/736x/31/c2/52/31c2528fd84debe2fee61804716de5cb.jpg', ''),
(604, 6, ' Serum', 'serum', '', 'https://i.pinimg.com/736x/bf/78/59/bf7859003e47d036a1f93d40bc20bf52.jpg', ''),
(605, 6, 'Mask', 'mask', '', 'https://i.pinimg.com/736x/a8/1f/7c/a81f7cc17c713370d9b2ed40db82fe65.jpg', ''),
(701, 7, 'Shower gel', 'shower-gel', '', 'https://i.pinimg.com/1200x/0c/51/9a/0c519a0318f112a545f48e732c7a1795.jpg', ''),
(702, 7, ' Lotion or Cream', 'lotion-or-cream', '', 'https://i.pinimg.com/1200x/54/f5/c8/54f5c8ec94c8fbe9d1963454e8043016.jpg', ''),
(703, 7, 'Roll ons', 'roll-ons', '', 'https://i.pinimg.com/736x/f8/83/95/f8839532ef2261b6576d6647f429b615.jpg', ''),
(704, 7, 'Scrub', 'scrub', '', 'https://i.pinimg.com/736x/a8/d0/9e/a8d09e90bb6725a547c8fde600098045.jpg', '');

-- Products Seed
INSERT INTO products (id, sku, name, slug, brand_id, category_id, sub_category, sub_category_slug, original_price, discounted_price, stock_qty, rating_avg, review_count, main_image, description, ingredients, benefits, how_to_use, suitable_skin_types, skin_concerns, is_featured, is_bestseller, is_new_arrival, status) VALUES
(2, 'GLOW-1994', 'Lancome Idole Eau De Parfum Best Seller Luxury Perfume With Four Roses, Jasmine and Chypre Accord', 'lancome-idole-eau-de-parfum-best-seller-luxury-perfume-with-four-roses-jasmine-and-chypre-accord', 1, 5, 'Women', 'women', 10500.00, NULL, 20, 5.00, 0, 'https://images-static.nykaa.com/media/catalog/product/6/6/66e95e6LANCO00000281_1x.jpg?tr=w-344,h-344,cm-pad_resize', '', '', '', '', 'Oily,Dry,Combination,Sensitive,Normal', 'Dryness,Redness', 0, 0, 0, 'active'),
(3, 'GLOW-4029', 'Moi Cherry Bomb Long-Lasting Eau De Parfum For Women (Sweet, Juicy, Gourmand, Smoky, Day+Night)', 'moi-cherry-bomb-long-lasting-eau-de-parfum-for-women-sweet-juicy-gourmand-smoky-day-night', 1, 5, 'Women', 'women', 809.00, NULL, 25, 5.00, 0, 'https://images-static.nykaa.com/media/catalog/product/f/0/f07a22bNYKAF00000028_r1.jpg', '', '', '', '', 'Oily,Dry,Combination,Sensitive,Normal', 'Dryness,Redness', 0, 0, 0, 'active'),
(4, 'GLOW-2645', 'Yves Saint Laurent Libre Eau De Parfum With Lavender Essence, Orange Blossom, Musk & Warm Vanilla', 'yves-saint-laurent-libre-eau-de-parfum-with-lavender-essence-orange-blossom-musk-warm-vanilla', 1, 5, 'Minis', 'minis', 2800.00, NULL, 50, 5.00, 0, 'https://images-static.nykaa.com/media/catalog/product/8/1/81e24abYVESS00000024_1.jpg?tr=w-344,h-344,cm-pad_resize', '', '', '', '', 'Oily,Dry,Combination,Sensitive,Normal', 'Dryness,Redness', 0, 0, 0, 'active'),
(5, 'GLOW-5093', 'Moi Raison D''Etre Sensual Floral Mini Perfume | Travel Size Long-Lasting Vanilla EDP For Women', 'moi-raison-d-etre-sensual-floral-mini-perfume-travel-size-long-lasting-vanilla-edp-for-women', 1, 5, 'Minis', 'minis', 400.00, NULL, 30, 5.00, 0, 'https://images-static.nykaa.com/media/catalog/product/d/3/d3289988904245710729_0.jpg', '', '', '', '', 'Oily,Dry,Combination,Sensitive,Normal', 'Dryness,Redness', 0, 0, 0, 'active'),
(6, 'GLOW-4371', 'Kayali Eden Plush Pear Eau De Parfum', 'kayali-eden-plush-pear-eau-de-parfum', 1, 5, 'Minis', 'minis', 2600.00, NULL, 25, 5.00, 0, 'https://images-static.nykaa.com/media/catalog/product/4/c/4c306a86294018408680_1.jpg', '', '', '', '', 'Oily,Dry,Combination,Sensitive,Normal', 'Dryness,Redness', 0, 0, 0, 'active'),
(7, 'GLOW-1480', 'Plum BodyLovin Vanilla Vibes Eau De Parfum - Long Lasting Warm Vanilla Perfume', 'plum-bodylovin-vanilla-vibes-eau-de-parfum-long-lasting-warm-vanilla-perfume', 1, 5, 'Minis', 'minis', 300.00, NULL, 25, 5.00, 0, 'https://images-static.nykaa.com/media/catalog/product/d/4/d4efa8aPLUMX00000286_01.jpg', '', '', '', '', 'Oily,Dry,Combination,Sensitive,Normal', 'Dryness,Redness', 0, 0, 0, 'active');

-- Coupons Seed
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expires_at, status) VALUES
('GLOW20', 'percentage', 20.00, 30.00, '2027-12-31 23:59:59', 'active'),
('SKIN10', 'fixed', 10.00, 40.00, '2027-12-31 23:59:59', 'active'),
('WELCOME15', 'percentage', 15.00, 25.00, '2027-12-31 23:59:59', 'active');

-- Product Reviews Seed (Cleared)

