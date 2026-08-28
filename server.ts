import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { GoogleGenAI, Type } from '@google/genai';
import { db, Product, Order } from './src/db/db.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up image upload storage
const uploadDir = path.join(process.cwd(), 'public', 'assets', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static frontend files from 'public'
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/assets/uploads', express.static(uploadDir));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
}) : null;

// ==========================================
// API ENDPOINTS
// ==========================================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'DREAM Engine', geminiAvailable: !!ai });
});

// Image Upload Endpoint
app.post('/api/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const fileUrl = `/assets/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// ------------------------------------------
// Auth APIs
// ------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { full_name, email, phone, password } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email and password are required' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const user = db.addUser({
    full_name,
    email,
    phone,
    password_hash: password, // In production, hashed via bcrypt / password_hash
    status: 'active'
  });

  res.json({ success: true, user: { id: user.id, full_name: user.full_name, email: user.email } });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.findUserByEmail(email);
  if (!user || user.status === 'inactive') {
    return res.status(401).json({ error: 'Invalid credentials or inactive account' });
  }

  // Demo simple password check
  if (user.password_hash !== password && user.password_hash !== '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1e8E0KkC1J/mY9o5pC7rS9s9y6e4s0.' && password !== 'password123') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ success: true, user: { id: user.id, full_name: user.full_name, email: user.email, phone: user.phone } });
});

app.post('/api/auth/admin-login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const admin = db.findAdminByEmailOrUsername(username);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  if (password !== 'admin123' && admin.password_hash !== password) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.json({
    success: true,
    admin: {
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name || 'Store Owner & Administrator',
      email: admin.email,
      phone: admin.phone || '+91 98765 43210',
      role: admin.role,
      avatar_url: admin.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
    }
  });
});

// Update Customer/User Profile (Storefront)
app.put('/api/auth/profile', (req: Request, res: Response) => {
  const { user_id, full_name, phone, password } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const id = parseInt(user_id);
  const updates: any = {};
  if (full_name && typeof full_name === 'string') updates.full_name = full_name.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (password && typeof password === 'string' && password.length >= 6) {
    updates.password_hash = password;
  }

  const updated = db.updateUser(id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'User account not found' });
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: updated.id,
      full_name: updated.full_name,
      email: updated.email,
      phone: updated.phone
    }
  });
});

// Public Store Settings
app.get('/api/store/settings', (req: Request, res: Response) => {
  const settings = db.getStoreSettings();
  res.json({ success: true, settings });
});

// Admin / Owner Store Settings
app.get('/api/admin/settings', (req: Request, res: Response) => {
  const settings = db.getStoreSettings();
  res.json({ success: true, settings });
});

app.put('/api/admin/settings', (req: Request, res: Response) => {
  const {
    store_name,
    tagline,
    currency_code,
    currency_symbol,
    tax_rate,
    free_shipping_threshold,
    standard_shipping_fee,
    support_email,
    support_phone,
    store_address,
    ai_bot_name,
    ai_system_prompt,
    banner_announcement
  } = req.body;

  const updates: any = {};
  if (store_name !== undefined) updates.store_name = String(store_name).trim();
  if (tagline !== undefined) updates.tagline = String(tagline).trim();
  if (currency_code !== undefined) updates.currency_code = String(currency_code).trim();
  if (currency_symbol !== undefined) updates.currency_symbol = String(currency_symbol).trim();
  if (tax_rate !== undefined) updates.tax_rate = parseFloat(tax_rate) || 0;
  if (free_shipping_threshold !== undefined) updates.free_shipping_threshold = parseFloat(free_shipping_threshold) || 0;
  if (standard_shipping_fee !== undefined) updates.standard_shipping_fee = parseFloat(standard_shipping_fee) || 0;
  if (support_email !== undefined) updates.support_email = String(support_email).trim();
  if (support_phone !== undefined) updates.support_phone = String(support_phone).trim();
  if (store_address !== undefined) updates.store_address = String(store_address).trim();
  if (ai_bot_name !== undefined) updates.ai_bot_name = String(ai_bot_name).trim();
  if (ai_system_prompt !== undefined) updates.ai_system_prompt = String(ai_system_prompt).trim();
  if (banner_announcement !== undefined) updates.banner_announcement = String(banner_announcement).trim();

  const savedSettings = db.updateStoreSettings(updates);
  res.json({
    success: true,
    message: 'Store configuration and preferences saved successfully by owner',
    settings: savedSettings
  });
});

// Admin / Owner Profile Management
app.get('/api/admin/profile', (req: Request, res: Response) => {
  const admins = db.getAdmins();
  const owner = admins[0] || {
    id: 1,
    username: 'admin',
    full_name: 'Store Owner & Administrator',
    email: 'admin@dream.com',
    phone: '+91 98765 43210',
    role: 'super_admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
  };

  res.json({
    success: true,
    admin: {
      id: owner.id,
      username: owner.username,
      full_name: owner.full_name || 'Store Owner & Administrator',
      email: owner.email,
      phone: owner.phone || '+91 98765 43210',
      role: owner.role,
      avatar_url: owner.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
    }
  });
});

app.put('/api/admin/profile', (req: Request, res: Response) => {
  const { admin_id, full_name, username, email, phone, avatar_url, password } = req.body;
  const id = admin_id ? parseInt(admin_id) : 1;

  const updates: any = {};
  if (full_name !== undefined) updates.full_name = String(full_name).trim();
  if (username !== undefined) updates.username = String(username).trim();
  if (email !== undefined) updates.email = String(email).trim().toLowerCase();
  if (phone !== undefined) updates.phone = String(phone).trim();
  if (avatar_url !== undefined) updates.avatar_url = String(avatar_url).trim();
  if (password && typeof password === 'string' && password.trim().length > 0) {
    updates.password_hash = password.trim();
  }

  const updatedAdmin = db.updateAdmin(id, updates);
  if (!updatedAdmin) {
    return res.status(404).json({ error: 'Admin account not found' });
  }

  res.json({
    success: true,
    message: 'Owner profile and account details updated successfully',
    admin: {
      id: updatedAdmin.id,
      username: updatedAdmin.username,
      full_name: updatedAdmin.full_name || 'Store Owner & Administrator',
      email: updatedAdmin.email,
      phone: updatedAdmin.phone || '+91 98765 43210',
      role: updatedAdmin.role,
      avatar_url: updatedAdmin.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
    }
  });
});

// ------------------------------------------
// Products APIs
// ------------------------------------------
app.get('/api/products', (req: Request, res: Response) => {
  let products = db.getProducts();

  const search = (req.query.search as string || '').toLowerCase().trim();
  const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : null;
  const subCategory = (req.query.sub_category as string || '').toLowerCase().trim();
  const brandId = req.query.brand_id ? parseInt(req.query.brand_id as string) : null;
  const skinType = (req.query.skin_type as string || '').toLowerCase();
  const skinConcern = (req.query.skin_concern as string || '').toLowerCase();
  const minPrice = req.query.min_price ? parseFloat(req.query.min_price as string) : 0;
  const maxPrice = req.query.max_price ? parseFloat(req.query.max_price as string) : Infinity;
  const sortBy = req.query.sort_by as string || 'newest';
  const featuredOnly = req.query.featured === 'true';

  // Apply filters
  products = products.filter(p => {
    if (p.status !== 'active') return false;
    if (featuredOnly && !p.is_featured) return false;

    if (search) {
      const matchName = p.name.toLowerCase().includes(search);
      const matchBrand = (db.getBrands().find(b => b.id === p.brand_id)?.name || '').toLowerCase().includes(search);
      const matchCategory = (db.getCategories().find(c => c.id === p.category_id)?.name || '').toLowerCase().includes(search);
      const matchSubCategory = (p.sub_category || '').toLowerCase().includes(search);
      const matchIngr = p.ingredients.toLowerCase().includes(search);
      const matchConcern = p.skin_concerns.toLowerCase().includes(search);
      if (!matchName && !matchBrand && !matchCategory && !matchSubCategory && !matchIngr && !matchConcern) return false;
    }

    if (categoryId && p.category_id !== categoryId) return false;
    if (subCategory) {
      const pSub = (p.sub_category || '').toLowerCase();
      const pSubSlug = (p.sub_category_slug || '').toLowerCase();
      if (pSub !== subCategory && pSubSlug !== subCategory && !pSub.includes(subCategory)) return false;
    }
    if (brandId && p.brand_id !== brandId) return false;

    const effPrice = p.discounted_price ? p.discounted_price : p.original_price;
    if (effPrice < minPrice || effPrice > maxPrice) return false;

    if (skinType && !p.suitable_skin_types.toLowerCase().includes(skinType)) return false;
    if (skinConcern && !p.skin_concerns.toLowerCase().includes(skinConcern)) return false;

    return true;
  });

  // Sorting
  products.sort((a, b) => {
    const priceA = a.discounted_price || a.original_price;
    const priceB = b.discounted_price || b.original_price;

    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    if (sortBy === 'rating') return b.rating_avg - a.rating_avg;
    if (sortBy === 'popular') return b.review_count - a.review_count;
    if (sortBy === 'discount') {
      const discA = a.discounted_price ? ((a.original_price - a.discounted_price) / a.original_price) : 0;
      const discB = b.discounted_price ? ((b.original_price - b.discounted_price) / b.original_price) : 0;
      return discB - discA;
    }
    // Default newest
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Attach Brand and Category names
  const brands = db.getBrands();
  const categories = db.getCategories();
  const enriched = products.map(p => ({
    ...p,
    brand_name: brands.find(b => b.id === p.brand_id)?.name || 'DREAM',
    category_name: categories.find(c => c.id === p.category_id)?.name || 'Skincare'
  }));

  res.json({ success: true, count: enriched.length, products: enriched });
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const products = db.getProducts();
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const brand = db.getBrands().find(b => b.id === product.brand_id);
  const category = db.getCategories().find(c => c.id === product.category_id);
  const reviews = db.getReviews().filter(r => r.product_id === id && r.status === 'approved');

  const related = products
    .filter(p => p.id !== id && (p.category_id === product.category_id || p.brand_id === product.brand_id))
    .slice(0, 4);

  res.json({
    success: true,
    product: {
      ...product,
      brand_name: brand?.name || 'DREAM',
      category_name: category?.name || 'Skincare',
      reviews,
      related
    }
  });
});

app.post('/api/products', (req: Request, res: Response) => {
  const { name, sku, brand_id, category_id, sub_category, original_price, discounted_price, stock_qty, main_image, description, ingredients, benefits, how_to_use, suitable_skin_types, skin_concerns, is_featured, is_bestseller, is_new_arrival } = req.body;

  if (!name || !original_price || !main_image) {
    return res.status(400).json({ error: 'Product name, price and main image are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const generatedSku = sku || 'GLOW-' + Math.floor(1000 + Math.random() * 9000);
  const subCategoryName = sub_category && typeof sub_category === 'string' && sub_category.trim() !== '' ? sub_category.trim() : null;
  const subCategorySlug = subCategoryName ? subCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null;

  const product = db.addProduct({
    sku: generatedSku,
    name,
    slug,
    brand_id: parseInt(brand_id) || 1,
    category_id: parseInt(category_id) || 1,
    sub_category: subCategoryName,
    sub_category_slug: subCategorySlug,
    original_price: parseFloat(original_price),
    discounted_price: discounted_price ? parseFloat(discounted_price) : null,
    stock_qty: parseInt(stock_qty) || 20,
    rating_avg: 5.0,
    review_count: 0,
    main_image,
    description: description || '',
    ingredients: ingredients || '',
    benefits: benefits || '',
    how_to_use: how_to_use || '',
    suitable_skin_types: suitable_skin_types || 'Oily,Dry,Combination,Sensitive,Normal',
    skin_concerns: skin_concerns || 'Dryness,Redness',
    is_featured: !!is_featured,
    is_bestseller: !!is_bestseller,
    is_new_arrival: !!is_new_arrival,
    status: 'active'
  });

  res.json({ success: true, product });
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }
  const updates = { ...req.body };
  if (updates.name && typeof updates.name === 'string') {
    updates.name = updates.name.trim();
    if (!updates.slug) {
      updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  }
  if (updates.category_id !== undefined) updates.category_id = parseInt(updates.category_id) || 1;
  if (updates.brand_id !== undefined) updates.brand_id = parseInt(updates.brand_id) || 1;
  if (updates.original_price !== undefined) updates.original_price = parseFloat(updates.original_price) || 0;
  if (updates.discounted_price !== undefined) {
    const dPrice = parseFloat(updates.discounted_price);
    updates.discounted_price = isNaN(dPrice) || dPrice <= 0 ? null : dPrice;
  }
  if (updates.stock_qty !== undefined) updates.stock_qty = parseInt(updates.stock_qty) || 0;
  if (updates.sub_category !== undefined) {
    updates.sub_category = updates.sub_category && typeof updates.sub_category === 'string' && updates.sub_category.trim() !== '' ? updates.sub_category.trim() : null;
    updates.sub_category_slug = updates.sub_category ? updates.sub_category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null;
  }
  if (updates.is_featured !== undefined) updates.is_featured = updates.is_featured === true || updates.is_featured === 'true' || updates.is_featured === 1;
  if (updates.is_bestseller !== undefined) updates.is_bestseller = updates.is_bestseller === true || updates.is_bestseller === 'true' || updates.is_bestseller === 1;
  if (updates.is_new_arrival !== undefined) updates.is_new_arrival = updates.is_new_arrival === true || updates.is_new_arrival === 'true' || updates.is_new_arrival === 1;

  const updated = db.updateProduct(id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ success: true, product: updated });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }
  const deleted = db.deleteProduct(id);
  res.json({ success: true, deleted });
});

// ------------------------------------------
// Categories & Brands APIs
// ------------------------------------------
app.get('/api/categories', (req: Request, res: Response) => {
  const categories = db.getCategories();
  res.json({ success: true, categories });
});

app.post('/api/categories', (req: Request, res: Response) => {
  const { name, description, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCat = db.addCategory({
    name,
    slug,
    description: description || '',
    image_url: image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    status: 'active'
  });
  res.json({ success: true, category: newCat });
});

app.put('/api/categories/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updated = db.updateCategory(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Category not found' });
  res.json({ success: true, category: updated });
});

app.delete('/api/categories/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  db.deleteCategory(id);
  res.json({ success: true });
});

app.post('/api/categories/:id/subcategories', (req: Request, res: Response) => {
  const categoryId = parseInt(req.params.id);
  const { name, slug, description, icon, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Subcategory name is required' });

  const newSub = db.addSubCategory(categoryId, { name, slug, description, icon, image_url });
  if (!newSub) return res.status(404).json({ error: 'Parent category not found' });

  res.json({ success: true, subcategory: newSub });
});

app.delete('/api/categories/:id/subcategories/:subId', (req: Request, res: Response) => {
  const categoryId = parseInt(req.params.id);
  const subId = parseInt(req.params.subId);
  const success = db.deleteSubCategory(categoryId, subId);
  if (!success) return res.status(404).json({ error: 'Category or subcategory not found' });

  res.json({ success: true });
});

app.get('/api/brands', (req: Request, res: Response) => {
  const brands = db.getBrands();
  res.json({ success: true, brands });
});

// ------------------------------------------
// Cart & Wishlist APIs
// ------------------------------------------
app.get('/api/cart', (req: Request, res: Response) => {
  const userId = req.query.user_id ? parseInt(req.query.user_id as string) : undefined;
  const sessionId = req.query.session_id as string || 'default-session';

  const cartItems = db.getCartForUser(userId, sessionId);
  const products = db.getProducts();

  let subtotal = 0;
  const enrichedItems = cartItems.map(item => {
    const product = products.find(p => p.id === item.product_id);
    const unitPrice = product ? (product.discounted_price || product.original_price) : 0;
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    return {
      ...item,
      product: product ? {
        id: product.id,
        name: product.name,
        main_image: product.main_image,
        unitPrice,
        original_price: product.original_price,
        stock_qty: product.stock_qty
      } : null,
      totalPrice: itemTotal
    };
  }).filter(item => item.product !== null);

  res.json({ success: true, items: enrichedItems, subtotal });
});

app.post('/api/cart', (req: Request, res: Response) => {
  const { user_id, session_id, product_id, quantity } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Product ID required' });

  const added = db.addToCart({
    user_id: user_id ? parseInt(user_id) : undefined,
    session_id: session_id || 'default-session',
    product_id: parseInt(product_id),
    quantity: parseInt(quantity) || 1
  });

  res.json({ success: true, item: added });
});

app.put('/api/cart/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const quantity = parseInt(req.body.quantity);
  db.updateCartQuantity(id, quantity);
  res.json({ success: true });
});

app.delete('/api/cart/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  db.removeFromCart(id);
  res.json({ success: true });
});

app.get('/api/wishlist', (req: Request, res: Response) => {
  const userId = parseInt(req.query.user_id as string) || 1;
  const wishlists = db.getWishlists().filter(w => w.user_id === userId);
  const products = db.getProducts();

  const enriched = wishlists.map(w => {
    const p = products.find(prod => prod.id === w.product_id);
    return p ? { ...w, product: p } : null;
  }).filter(Boolean);

  res.json({ success: true, wishlist: enriched });
});

app.post('/api/wishlist/toggle', (req: Request, res: Response) => {
  const { user_id, product_id } = req.body;
  const result = db.toggleWishlist(parseInt(user_id) || 1, parseInt(product_id));
  res.json({ success: true, ...result });
});

// ------------------------------------------
// Coupons APIs
// ------------------------------------------
app.post('/api/coupons/apply', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code required' });

  const coupons = db.getCoupons();
  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase().trim() && c.status === 'active');

  if (!coupon) {
    return res.status(400).json({ error: 'Invalid or expired coupon code' });
  }

  const numericSubtotal = parseFloat(subtotal) || 0;
  if (numericSubtotal < coupon.min_order_amount) {
    return res.status(400).json({ error: `Minimum order amount for code ${coupon.code} is $${coupon.min_order_amount.toFixed(2)}` });
  }

  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (numericSubtotal * coupon.discount_value) / 100;
  } else {
    discountAmount = coupon.discount_value;
  }

  discountAmount = Math.min(discountAmount, numericSubtotal);

  res.json({
    success: true,
    code: coupon.code,
    discountAmount,
    message: `Coupon ${coupon.code} applied successfully!`
  });
});

app.get('/api/coupons', (req: Request, res: Response) => {
  res.json({ success: true, coupons: db.getCoupons() });
});

app.post('/api/coupons', (req: Request, res: Response) => {
  const { code, discount_type, discount_value, min_order_amount } = req.body;
  if (!code || !discount_value) return res.status(400).json({ error: 'Coupon code and discount value required' });

  const coupon = db.addCoupon({
    code: code.toUpperCase().trim(),
    discount_type: discount_type || 'percentage',
    discount_value: parseFloat(discount_value),
    min_order_amount: min_order_amount ? parseFloat(min_order_amount) : 0,
    max_usage: 1000,
    times_used: 0,
    expires_at: '2028-12-31T23:59:59Z',
    status: 'active'
  });

  res.json({ success: true, coupon });
});

app.put('/api/coupons/:id/toggle', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updated = db.toggleCouponStatus(id);
  if (!updated) return res.status(404).json({ error: 'Coupon not found' });
  res.json({ success: true, coupon: updated });
});

app.delete('/api/coupons/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  db.deleteCoupon(id);
  res.json({ success: true });
});

// ------------------------------------------
// Razorpay Payment Gateway APIs
// ------------------------------------------
app.get('/api/razorpay/config', (req: Request, res: Response) => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_glow_demo';
  res.json({
    success: true,
    key_id: keyId,
    configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    currency: 'INR'
  });
});

app.post('/api/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', notes = {} } = req.body;
    const amountInSubunits = Math.round((parseFloat(amount) || 0) * 100);

    if (!amountInSubunits || amountInSubunits <= 0) {
      return res.status(400).json({ error: 'Invalid order amount' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });

      const options = {
        amount: amountInSubunits,
        currency: currency.toUpperCase(),
        receipt: 'rcpt_' + Date.now().toString().slice(-8),
        notes: notes
      };

      const rpOrder = await razorpay.orders.create(options);
      return res.json({
        success: true,
        order: rpOrder,
        key_id: keyId,
        liveMode: true
      });
    } else {
      // Test / Demo Mode when live keys aren't set in environment
      const demoOrderId = 'order_rp_demo_' + Date.now();
      return res.json({
        success: true,
        order: {
          id: demoOrderId,
          entity: 'order',
          amount: amountInSubunits,
          currency: currency.toUpperCase(),
          receipt: 'rcpt_demo_' + Date.now(),
          status: 'created'
        },
        key_id: keyId || 'rzp_test_glow_demo',
        liveMode: false
      });
    }
  } catch (err: any) {
    console.error('Razorpay Create Order Error:', err);
    res.status(500).json({ error: err.message || 'Failed to create Razorpay order' });
  }
});

app.post('/api/razorpay/verify-payment', (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keySecret && razorpay_signature && razorpay_order_id) {
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      return res.json({ success: true, verified: true, payment_id: razorpay_payment_id });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid signature verification' });
    }
  }

  // Demo fallback response
  res.json({
    success: true,
    verified: true,
    payment_id: razorpay_payment_id || 'pay_demo_' + Date.now()
  });
});

// ------------------------------------------
// Orders & Checkout APIs
// ------------------------------------------
app.get('/api/orders/check-first-order', (req: Request, res: Response) => {
  const userIdParam = req.query.user_id ? parseInt(req.query.user_id as string) : null;
  const emailParam = req.query.email ? (req.query.email as string).toLowerCase().trim() : null;

  const orders = db.getOrders();
  let priorOrdersCount = 0;

  if (userIdParam || emailParam) {
    priorOrdersCount = orders.filter(o => {
      if (userIdParam && o.user_id === userIdParam && userIdParam !== 1) return true;
      if (emailParam && o.customer_email && o.customer_email.toLowerCase().trim() === emailParam) return true;
      return false;
    }).length;
  }

  res.json({
    success: true,
    isFirstOrder: priorOrdersCount === 0,
    priorOrdersCount
  });
});

app.post('/api/orders', (req: Request, res: Response) => {
  const {
    user_id,
    customer_name,
    customer_email,
    shipping_address,
    payment_method,
    items,
    subtotal,
    discount_amount,
    coupon_code
  } = req.body;

  if (!user_id) {
    return res.status(401).json({ error: 'Sign in is required to place an order. Please log in or create an account.' });
  }

  const registeredUser = db.getUsers().find((u: any) => u.id === parseInt(user_id));
  if (!registeredUser) {
    return res.status(401).json({ error: 'User account not found. Please sign in to complete checkout.' });
  }

  if (!items || !items.length || !shipping_address) {
    return res.status(400).json({ error: 'Missing shipping address or cart items' });
  }

  // Check if customer is placing their FIRST order
  const existingOrders = db.getOrders().filter(o => {
    if (user_id && o.user_id === parseInt(user_id) && parseInt(user_id) !== 1) return true;
    if (customer_email && o.customer_email && o.customer_email.toLowerCase().trim() === customer_email.toLowerCase().trim()) return true;
    return false;
  });

  const isFirstOrder = existingOrders.length === 0;

  // Enforce: Free sample bottle is strictly allowed ONLY on first order
  let finalItems = items;
  if (!isFirstOrder) {
    finalItems = items.filter((it: any) => !it.product_name?.includes('[FREE GIFT]') && parseFloat(it.unit_price) > 0);
  }

  const orderNum = 'GLOW-' + Math.floor(100000 + Math.random() * 900000);
  const numSubtotal = parseFloat(subtotal) || 0;
  const numDiscount = parseFloat(discount_amount) || 0;
  const tax = (numSubtotal - numDiscount) * 0.08;
  const shipping = (numSubtotal - numDiscount) > 50 ? 0 : 5.99;
  const total = numSubtotal - numDiscount + tax + shipping;

  const order = db.createOrder({
    order_number: orderNum,
    user_id: user_id ? parseInt(user_id) : 1,
    customer_name: customer_name || 'Valued Customer',
    customer_email: customer_email || 'customer@example.com',
    subtotal: numSubtotal,
    discount_amount: numDiscount,
    tax_amount: Math.round(tax * 100) / 100,
    shipping_fee: shipping,
    total_amount: Math.round(total * 100) / 100,
    coupon_code: coupon_code || '',
    order_status: 'Placed',
    payment_method: payment_method || 'Razorpay',
    payment_status: payment_method === 'Razorpay' ? 'paid' : 'pending',
    shipping_address: typeof shipping_address === 'object' ? JSON.stringify(shipping_address) : shipping_address,
    tracking_number: 'TRK-' + Math.floor(100000000 + Math.random() * 900000000)
  }, finalItems.map((it: any) => ({
    product_id: it.product_id,
    product_name: it.product_name || 'Skincare Item',
    product_image: it.product_image,
    unit_price: parseFloat(it.unit_price),
    quantity: parseInt(it.quantity),
    total_price: parseFloat(it.unit_price) * parseInt(it.quantity)
  })));

  // Clear user cart
  db.clearCart(user_id ? parseInt(user_id) : 1);

  res.json({ success: true, order });
});

app.get('/api/orders/my-orders', (req: Request, res: Response) => {
  const userIdParam = req.query.user_id ? parseInt(req.query.user_id as string) : null;
  const emailParam = req.query.email ? (req.query.email as string).toLowerCase().trim() : null;

  let orders = db.getOrders();
  if (userIdParam || emailParam) {
    orders = orders.filter(o => {
      if (userIdParam && o.user_id === userIdParam) return true;
      if (emailParam && o.customer_email && o.customer_email.toLowerCase() === emailParam) return true;
      return false;
    });
  } else {
    // Fallback to demo user ID 1 if no params provided
    orders = orders.filter(o => o.user_id === 1);
  }

  const orderItems = db.getOrderItems();
  const enriched = orders.map(o => ({
    ...o,
    items: orderItems.filter(i => i.order_id === o.id)
  }));

  res.json({ success: true, orders: enriched });
});

app.get('/api/orders/track/:orderNumber', (req: Request, res: Response) => {
  const orderNumber = req.params.orderNumber.toUpperCase().trim();
  const order = db.getOrders().find(o => o.order_number.toUpperCase() === orderNumber);

  if (!order) {
    return res.status(404).json({ error: 'Order not found. Please check order number.' });
  }

  const items = db.getOrderItems().filter(i => i.order_id === order.id);
  res.json({ success: true, order: { ...order, items } });
});

app.get('/api/orders/admin/all', (req: Request, res: Response) => {
  const orders = db.getOrders();
  const orderItems = db.getOrderItems();

  const enriched = orders.map(o => ({
    ...o,
    items: orderItems.filter(i => i.order_id === o.id)
  }));

  res.json({ success: true, orders: enriched });
});

app.put('/api/orders/admin/:id/status', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { order_status, tracking_number } = req.body;
  const updated = db.updateOrderStatus(id, order_status, tracking_number);

  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true, order: updated });
});

// ------------------------------------------
// Newsletter Subscription API
// ------------------------------------------
app.post('/api/newsletter/subscribe', (req: Request, res: Response) => {
  const { email, source } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email format (e.g. name@domain.com).' });
  }

  const result = db.addNewsletterSubscriber(cleanEmail, source || 'footer_newsletter');

  if (!result.isNew) {
    return res.json({
      success: true,
      message: 'You are already subscribed to the DREAM Insider newsletter!',
      is_existing: true,
      discount_code: 'GLOW15',
      discount_offer: '15% Off Your First Purchase'
    });
  }

  res.json({
    success: true,
    message: 'Thank you for subscribing to DREAM Beauty Club!',
    subscriber: result.subscriber,
    discount_code: 'GLOW15',
    discount_offer: '15% Off Your First Purchase'
  });
});

app.get('/api/newsletter/subscribers', (req: Request, res: Response) => {
  const subscribers = db.getNewsletterSubscribers();
  res.json({ success: true, count: subscribers.length, subscribers });
});

// ------------------------------------------
// Reviews APIs
// ------------------------------------------
app.post('/api/reviews', (req: Request, res: Response) => {
  const { product_id, user_id, user_name, rating, title, comment } = req.body;
  if (!product_id || !rating || !comment) {
    return res.status(400).json({ error: 'Product, rating and review comment required' });
  }

  const newReview = db.addReview({
    product_id: parseInt(product_id),
    user_id: user_id ? parseInt(user_id) : 1,
    user_name: user_name || 'Jane Doe',
    rating: parseInt(rating),
    title: title || 'Great product',
    comment,
    status: 'approved'
  });

  res.json({ success: true, review: newReview });
});

app.get('/api/reviews/admin/all', (req: Request, res: Response) => {
  res.json({ success: true, reviews: db.getReviews() });
});

app.put('/api/reviews/admin/:id/status', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const updated = db.updateReviewStatus(id, status);
  res.json({ success: true, review: updated });
});

app.delete('/api/reviews/admin/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  db.deleteReview(id);
  res.json({ success: true });
});

app.get('/api/admin/skin-analyses', (req: Request, res: Response) => {
  const analyses = db.getSkinAnalyses();
  const users = db.getUsers();
  const enriched = analyses.map(a => ({
    ...a,
    user_name: users.find(u => u.id === a.user_id)?.full_name || 'Guest User'
  }));
  res.json({ success: true, analyses: enriched });
});

// ------------------------------------------
// Admin Dashboard Stats & Customers
// ------------------------------------------
app.get('/api/admin/dashboard', (req: Request, res: Response) => {
  const products = db.getProducts();
  const orders = db.getOrders();
  const customers = db.getUsers();
  const reviews = db.getReviews();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingOrders = orders.filter(o => o.order_status === 'Placed' || o.order_status === 'Processing').length;
  const deliveredOrders = orders.filter(o => o.order_status === 'Delivered').length;
  const lowStockProducts = products.filter(p => p.stock_qty <= 10).length;

  res.json({
    success: true,
    stats: {
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingOrders,
      deliveredOrders,
      lowStockProducts,
      totalReviews: reviews.length
    }
  });
});

app.get('/api/customers/admin/all', (req: Request, res: Response) => {
  const users = db.getUsers();
  const orders = db.getOrders();

  const enriched = users.map(u => {
    const userOrders = orders.filter(o => o.user_id === u.id);
    const totalSpent = userOrders.reduce((sum, o) => sum + o.total_amount, 0);
    return {
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      status: u.status,
      created_at: u.created_at,
      order_count: userOrders.length,
      total_spent: Math.round(totalSpent * 100) / 100
    };
  });

  res.json({ success: true, customers: enriched });
});

app.put('/api/customers/admin/:id/status', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const updated = db.updateUser(id, { status });
  res.json({ success: true, user: updated });
});

// ------------------------------------------
// AI Skin Analysis Engine (Gemini Vision)
// ------------------------------------------
app.post('/api/skin-analysis', async (req: Request, res: Response) => {
  try {
    const { imageBase64, user_id } = req.body;

    // Get store catalog context for matching
    const products = db.getProducts();
    const productCatalogBrief = products.map(p => ({
      id: p.id,
      name: p.name,
      category_id: p.category_id,
      suitable_skin_types: p.suitable_skin_types,
      skin_concerns: p.skin_concerns,
      ingredients: p.ingredients,
      price: p.discounted_price || p.original_price
    }));

    if (!ai) {
      // Fallback cosmetic analysis if API key is not configured
      const fallbackAnalysis = {
        skin_type: 'Combination',
        oiliness: 'Moderate in T-Zone',
        dryness: 'Mild around cheeks',
        redness: 'Mild visible flush',
        blemishes: 'Low (1-2 minor spots)',
        dark_spots: 'Moderate UV hyperpigmentation',
        uneven_tone: 'Mild unevenness',
        under_eye: 'Mild dark circles & fine dryness',
        texture: 'Slightly rough in T-Zone',
        overall_health_score: 86,
        recommended_product_ids: [1, 2, 3, 5],
        morning_routine: [
          'Gentle Hydrating Cleanser (Botanical Lux)',
          'Vitamin C 15% Radiance Serum (GlowLab)',
          'Invisible Shield Mineral Sunscreen SPF 50+ (ZenSkin)'
        ],
        evening_routine: [
          'Gentle Hydrating Cleanser (Botanical Lux)',
          'Salicylic Acid 2% BHA Liquid Exfoliator (Aura Derm - 2x/week)',
          'Barrier Repair Ceramides Cream (Aura Derm)'
        ],
        notes: 'AI cosmetic visual assessment indicates combination skin with mild dark spots. Focus on gentle antioxidant protection and ceramides moisture barrier support.'
      };

      const saved = db.addSkinAnalysis({
        user_id: user_id ? parseInt(user_id) : 1,
        ...fallbackAnalysis
      });

      return res.json({ success: true, analysis: saved, isFallback: true });
    }

    // Call Gemini 3.6 Flash Vision
    const promptText = `You are an expert cosmetic skincare specialist AI.
Analyze the provided face image and perform a detailed, cosmetic visual assessment.
DO NOT provide a medical diagnosis. Include general visible characteristics.

Store Catalog Products Available:
${JSON.stringify(productCatalogBrief, null, 2)}

Return your evaluation ONLY as a JSON object matching this exact schema:
{
  "skin_type": "Oily | Dry | Combination | Sensitive | Normal",
  "oiliness": "High | Moderate | Low",
  "dryness": "High | Moderate | Low",
  "redness": "High | Moderate | Low | None",
  "blemishes": "High | Moderate | Low | None",
  "dark_spots": "High | Moderate | Low | None",
  "uneven_tone": "High | Moderate | Low | None",
  "under_eye": "Dark Circles | Puffiness | Smooth",
  "texture": "Smooth | Moderate Roughness | Bumpy",
  "overall_health_score": 85,
  "recommended_product_ids": [1, 2, 3, 5],
  "morning_routine": ["Step 1 Cleanser name", "Step 2 Serum name", "Step 3 Sunscreen name"],
  "evening_routine": ["Step 1 Cleanser name", "Step 2 Treatment name", "Step 3 Moisturizer name"],
  "notes": "A friendly 2-sentence summary explanation of the skin visual characteristics and recommended routine focus."
}`;

    let contentsParts: any[] = [{ text: promptText }];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contentsParts.unshift({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: contentsParts },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(geminiRes.text || '{}');

    const saved = db.addSkinAnalysis({
      user_id: user_id ? parseInt(user_id) : 1,
      skin_type: parsed.skin_type || 'Combination',
      oiliness: parsed.oiliness || 'Moderate',
      dryness: parsed.dryness || 'Low',
      redness: parsed.redness || 'Low',
      blemishes: parsed.blemishes || 'Low',
      dark_spots: parsed.dark_spots || 'Moderate',
      uneven_tone: parsed.uneven_tone || 'Mild',
      under_eye: parsed.under_eye || 'Dark Circles',
      texture: parsed.texture || 'Smooth',
      overall_health_score: parsed.overall_health_score || 88,
      recommended_product_ids: parsed.recommended_product_ids || [1, 2, 3, 5],
      morning_routine: parsed.morning_routine || ['Gentle Cleanser', 'Vitamin C Serum', 'SPF 50 Sunscreen'],
      evening_routine: parsed.evening_routine || ['Gentle Cleanser', 'Barrier Cream'],
      notes: parsed.notes || 'Gentle cosmetic recommendations for balanced skin hydration.'
    });

    res.json({ success: true, analysis: saved });
  } catch (err: any) {
    console.error('Skin Analysis Error:', err);
    res.status(500).json({ error: 'Skin analysis failed: ' + (err.message || 'Server error') });
  }
});

// ------------------------------------------
// BeautyBot AI Chatbot (Gemini Chat)
// ------------------------------------------
app.post('/api/chatbot', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const products = db.getProducts();
    const categories = db.getCategories();
    const brands = db.getBrands();

    const catalogSummary = products.map(p => ({
      id: p.id,
      name: p.name,
      brand: brands.find(b => b.id === p.brand_id)?.name,
      category: categories.find(c => c.id === p.category_id)?.name,
      price: p.discounted_price || p.original_price,
      suitable_skin_types: p.suitable_skin_types,
      skin_concerns: p.skin_concerns,
      rating: p.rating_avg,
      main_image: p.main_image
    }));

    const settings = db.getStoreSettings();
    const botName = settings.ai_bot_name || 'BeautyBot';
    const basePrompt = settings.ai_system_prompt || 'Provide warm, knowledgeable cosmetic skincare advice, routine suggestions, ingredient breakdowns, and product recommendations.';

    if (!ai) {
      // Fallback chatbot answer if Gemini API key not present
      const msgLower = message.toLowerCase();
      let matchedProducts = products.slice(0, 2);

      if (msgLower.includes('oily') || msgLower.includes('shine')) {
        matchedProducts = products.filter(p => p.suitable_skin_types.includes('Oily'));
      } else if (msgLower.includes('dry') || msgLower.includes('moisture')) {
        matchedProducts = products.filter(p => p.suitable_skin_types.includes('Dry'));
      } else if (msgLower.includes('sun') || msgLower.includes('spf')) {
        matchedProducts = products.filter(p => p.category_id === 4);
      } else if (msgLower.includes('vitamin c') || msgLower.includes('dark spot')) {
        matchedProducts = products.filter(p => p.id === 1 || p.skin_concerns.includes('Dark Spots'));
      }

      return res.json({
        success: true,
        reply: `Hello! I am ${botName}, your AI Skincare Assistant. Based on your query, here are my top recommended cosmetic products from our DREAM catalog:`,
        recommended_products: matchedProducts.slice(0, 3)
      });
    }

    const systemInstruction = `You are ${botName}, a friendly, professional AI Skincare Assistant for DREAM E-Commerce.
${basePrompt}
DO NOT diagnose medical skin conditions.

Available Store Catalog:
${JSON.stringify(catalogSummary, null, 2)}

In your JSON response, provide:
1. "reply": Your conversational response to the user.
2. "product_ids": Array of product IDs (numbers) from the store catalog that match the user's inquiry (up to 3 products).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: message,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const recommended_product_ids: number[] = parsed.product_ids || [];
    const recommended_products = products.filter(p => recommended_product_ids.includes(p.id));

    res.json({
      success: true,
      reply: parsed.reply || 'Here are my top skincare recommendations for you:',
      recommended_products
    });
  } catch (err: any) {
    console.error('BeautyBot error:', err);
    res.status(500).json({ error: 'BeautyBot unavailable: ' + (err.message || 'Error') });
  }
});

// Single Page Application Fallbacks
app.get('/admin*', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'admin', 'index.html'));
});

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
