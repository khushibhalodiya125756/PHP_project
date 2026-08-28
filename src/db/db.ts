import fs from 'fs';
import path from 'path';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  password_hash: string;
  avatar_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Admin {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  currency_code: string;
  currency_symbol: string;
  tax_rate: number;
  free_shipping_threshold: number;
  standard_shipping_fee: number;
  support_email: string;
  support_phone: string;
  store_address: string;
  ai_bot_name: string;
  ai_system_prompt: string;
  banner_announcement: string;
}

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  status: 'active' | 'disabled';
  subcategories?: SubCategory[];
  created_at: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  created_at: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  brand_id: number;
  category_id: number;
  sub_category?: string;
  sub_category_slug?: string;
  original_price: number;
  discounted_price: number | null;
  stock_qty: number;
  rating_avg: number;
  review_count: number;
  main_image: string;
  description: string;
  ingredients: string;
  benefits: string;
  how_to_use: string;
  suitable_skin_types: string;
  skin_concerns: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
}

export interface ProductReview {
  id: number;
  product_id: number;
  user_id: number;
  user_name?: string;
  rating: number;
  title: string;
  comment: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'hidden';
  created_at: string;
}

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  created_at: string;
}

export interface CartItem {
  id: number;
  user_id?: number;
  session_id?: string;
  product_id: number;
  quantity: number;
  created_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  customer_name?: string;
  customer_email?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_fee: number;
  total_amount: number;
  coupon_code?: string;
  order_status: 'Placed' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  shipping_address: string;
  tracking_number?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_usage: number;
  times_used: number;
  expires_at: string;
  status: 'active' | 'disabled';
}

export interface SkinProfile {
  id: number;
  user_id: number;
  skin_type: string;
  oiliness_level: string;
  dryness_level: string;
  primary_concern: string;
  secondary_concern: string;
  preferred_product_type: string;
  created_at: string;
}

export interface SkinAnalysis {
  id: number;
  user_id: number;
  image_url?: string;
  skin_type: string;
  oiliness: string;
  dryness: string;
  redness: string;
  blemishes: string;
  dark_spots: string;
  uneven_tone: string;
  under_eye: string;
  texture: string;
  overall_health_score: number;
  recommended_product_ids: number[];
  morning_routine: string[];
  evening_routine: string[];
  notes?: string;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  source?: string;
  status: 'active' | 'unsubscribed';
  created_at: string;
}

export interface DatabaseSchema {
  users: User[];
  admins: Admin[];
  categories: Category[];
  brands: Brand[];
  products: Product[];
  reviews: ProductReview[];
  wishlists: WishlistItem[];
  cart: CartItem[];
  addresses: Address[];
  orders: Order[];
  order_items: OrderItem[];
  coupons: Coupon[];
  skin_profiles: SkinProfile[];
  skin_analyses: SkinAnalysis[];
  newsletter_subscribers?: NewsletterSubscriber[];
  store_settings?: StoreSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial seed matching schema.sql
const initialData: DatabaseSchema = {
  users: [
    {
      id: 1,
      email: 'jane@example.com',
      password_hash: 'password123',
      full_name: 'Jane Doe',
      phone: '+1 (555) 234-5678',
      avatar_url: '',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ],
  admins: [
    {
      id: 1,
      username: 'admin',
      full_name: 'Store Owner & Administrator',
      email: 'admin@dream.com',
      phone: '+91 98765 43210',
      password_hash: '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1e8E0KkC1J/mY9o5pC7rS9s9y6e4s0.', // admin123
      role: 'super_admin',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      created_at: new Date().toISOString()
    }
  ],
  store_settings: {
    store_name: 'DREAM Skincare',
    tagline: 'Science-Backed Botanical Formulations',
    currency_code: 'INR',
    currency_symbol: '₹',
    tax_rate: 8.0,
    free_shipping_threshold: 50.00,
    standard_shipping_fee: 5.99,
    support_email: 'support@dream.com',
    support_phone: '+91 (800) 456-7890',
    store_address: '104 Bloom Plaza, Luxury Beauty District, Mumbai, MH 400001',
    ai_bot_name: 'BeautyBot — Expert Skincare Advisor',
    ai_system_prompt: 'Provide knowledgeable, gentle cosmetic skincare advice, routine suggestions, ingredient breakdowns, and product recommendations from the catalog. DO NOT provide medical diagnoses.',
    banner_announcement: 'Complimentary luxury sample bottle with every first order over ₹500 • Free express shipping on orders over ₹50'
  },
  categories: [
    {
      id: 1,
      name: 'Mack up',
      slug: 'mack-up',
      description: '',
      image_url: 'https://i.pinimg.com/736x/03/04/9a/03049a0d2b32cc50a086e3c396ac9eb4.jpg',
      status: 'active',
      subcategories: [
        {
          id: 101,
          name: 'Lipstick',
          slug: 'lipstick',
          description: '',
          image_url: 'https://i.pinimg.com/736x/fb/84/28/fb84283996b6fcfbc226a3cf7af56160.jpg',
          icon: ''
        },
        {
          id: 102,
          name: 'Foundation',
          slug: 'foundation',
          description: '',
          image_url: 'https://i.pinimg.com/1200x/9b/3a/e5/9b3ae5fb897da6d18b6b3b01950d09b6.jpg',
          icon: ''
        },
        {
          id: 103,
          name: 'Mascara',
          slug: 'mascara',
          description: '',
          image_url: 'https://i.pinimg.com/736x/50/76/18/50761868929df6009e48c437f243c268.jpg',
          icon: ''
        },
        {
          id: 104,
          name: 'Blush',
          slug: 'blush',
          description: '',
          image_url: 'https://i.pinimg.com/736x/58/a1/09/58a10975126b061fca1e5a0a96c600b3.jpg',
          icon: ''
        },
        {
          id: 105,
          name: ' Tools and brushes',
          slug: 'tools-and-brushes',
          description: '',
          image_url: 'https://i.pinimg.com/736x/61/ae/4e/61ae4ea603f447f3c70f0c8a62f60a79.jpg',
          icon: ''
        }
      ],
      created_at: '2026-08-20T15:56:04.774Z'
    },
    {
      id: 3,
      name: 'Hair care',
      slug: 'hair-care',
      description: '',
      image_url: 'https://i.pinimg.com/736x/c8/0f/be/c80fbec28bdad8066aa290f0a4fd729f.jpg',
      status: 'active',
      subcategories: [
        {
          id: 301,
          name: 'Shampoo',
          slug: 'shampoo',
          description: '',
          image_url: 'https://i.pinimg.com/736x/5d/aa/71/5daa71d84c15531d8e3baad871e043ae.jpg',
          icon: ''
        },
        {
          id: 302,
          name: 'Conditioner',
          slug: 'conditioner',
          description: '',
          image_url: 'https://i.pinimg.com/1200x/59/d5/99/59d5990985698794dae3c4c965cbb3f7.jpg',
          icon: ''
        },
        {
          id: 303,
          name: 'Hair Mask ',
          slug: 'hair-mask',
          description: '',
          image_url: 'https://i.pinimg.com/1200x/d5/17/33/d517330436055c8f83d51478a593ff3e.jpg',
          icon: ''
        },
        {
          id: 304,
          name: 'Serum',
          slug: 'serum',
          description: '',
          image_url: 'https://i.pinimg.com/1200x/b4/3a/00/b43a004b97d785cfb87112df7278772b.jpg',
          icon: ''
        },
        {
          id: 305,
          name: 'Hair oil',
          slug: 'hair-oil',
          description: '',
          image_url: 'https://i.pinimg.com/736x/0d/77/33/0d773397923dcd7f5a12f613b147a195.jpg',
          icon: ''
        }
      ],
      created_at: '2026-08-20T15:58:48.954Z'
    },
    {
      id: 5,
      name: 'Fragrance',
      slug: 'fragrance',
      description: '',
      image_url: 'https://i.pinimg.com/736x/07/71/ed/0771edee4246abc5f034c3be2e739e74.jpg',
      status: 'active',
      subcategories: [
        {
          id: 502,
          name: 'Minis',
          slug: 'minis',
          description: '',
          image_url: 'https://i.pinimg.com/736x/00/d6/69/00d6695798d388166ae7405a4cb8caa5.jpg',
          icon: ''
        },
        {
          id: 503,
          name: 'Special Collection',
          slug: 'special-collection',
          description: '',
          image_url: 'https://i.pinimg.com/736x/79/3a/d1/793ad1b1626b7f536f85fb1b98011c0f.jpg',
          icon: ''
        },
        {
          id: 504,
          name: 'Women',
          slug: 'women',
          description: '',
          image_url: 'https://i.pinimg.com/736x/45/4f/ca/454fca30058b9be6a9829d6ee3d32a17.jpg',
          icon: ''
        },
        {
          id: 505,
          name: 'Men',
          slug: 'men',
          description: '',
          image_url: 'https://i.pinimg.com/736x/ae/6c/4a/ae6c4a38b14ec8cb6c0ed12b1fe34e92.jpg',
          icon: ''
        }
      ],
      created_at: '2026-08-20T16:01:11.468Z'
    },
    {
      id: 6,
      name: 'Skin care',
      slug: 'skin-care',
      description: '',
      image_url: 'https://i.pinimg.com/736x/c1/31/ec/c131ec684397ade5bc350f235caea578.jpg',
      status: 'active',
      subcategories: [
        {
          id: 601,
          name: 'Moisturiser ',
          slug: 'moisturiser',
          description: '',
          image_url: 'https://i.pinimg.com/736x/b7/7d/4f/b77d4f223734fc4a20a6b13ccb9ab04a.jpg',
          icon: ''
        },
        {
          id: 602,
          name: ' Sunscreen',
          slug: 'sunscreen',
          description: '',
          image_url: 'https://i.pinimg.com/736x/70/cf/98/70cf98569e380ec6fcdd2e44ce0e666d.jpg',
          icon: ''
        },
        {
          id: 603,
          name: '  Cleanser',
          slug: 'cleanser',
          description: '',
          image_url: 'https://i.pinimg.com/736x/31/c2/52/31c2528fd84debe2fee61804716de5cb.jpg',
          icon: ''
        },
        {
          id: 604,
          name: ' Serum',
          slug: 'serum',
          description: '',
          image_url: 'https://i.pinimg.com/736x/bf/78/59/bf7859003e47d036a1f93d40bc20bf52.jpg',
          icon: ''
        },
        {
          id: 605,
          name: 'Mask',
          slug: 'mask',
          description: '',
          image_url: 'https://i.pinimg.com/736x/a8/1f/7c/a81f7cc17c713370d9b2ed40db82fe65.jpg',
          icon: ''
        }
      ],
      created_at: '2026-08-21T15:20:34.241Z'
    },
    {
      id: 7,
      name: 'Bath and body',
      slug: 'bath-and-body',
      description: '',
      image_url: 'https://i.pinimg.com/736x/4a/60/32/4a60323ec9ee00f401fbfb7b3ef0878a.jpg',
      status: 'active',
      subcategories: [
        {
          id: 701,
          name: 'Shower gel',
          slug: 'shower-gel',
          description: '',
          image_url: 'https://i.pinimg.com/1200x/0c/51/9a/0c519a0318f112a545f48e732c7a1795.jpg',
          icon: ''
        },
        {
          id: 702,
          name: ' Lotion or Cream',
          slug: 'lotion-or-cream',
          description: '',
          image_url: 'https://i.pinimg.com/1200x/54/f5/c8/54f5c8ec94c8fbe9d1963454e8043016.jpg',
          icon: ''
        },
        {
          id: 703,
          name: 'Roll ons',
          slug: 'roll-ons',
          description: '',
          image_url: 'https://i.pinimg.com/736x/f8/83/95/f8839532ef2261b6576d6647f429b615.jpg',
          icon: ''
        },
        {
          id: 704,
          name: 'Scrub',
          slug: 'scrub',
          description: '',
          image_url: 'https://i.pinimg.com/736x/a8/d0/9e/a8d09e90bb6725a547c8fde600098045.jpg',
          icon: ''
        }
      ],
      created_at: '2026-08-21T15:49:22.262Z'
    }
  ],
  brands: [
    { id: 1, name: 'GlowLab', slug: 'glowlab', logo_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200', created_at: new Date().toISOString() },
    { id: 2, name: 'Botanical Lux', slug: 'botanical-lux', logo_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200', created_at: new Date().toISOString() },
    { id: 3, name: 'Aura Derm', slug: 'aura-derm', logo_url: 'https://images.unsplash.com/photo-1608248597261-e4d0450cbf1c?w=200', created_at: new Date().toISOString() },
    { id: 4, name: 'PureRadiance', slug: 'pureradiance', logo_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200', created_at: new Date().toISOString() },
    { id: 5, name: 'ZenSkin', slug: 'zenskin', logo_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=200', created_at: new Date().toISOString() }
  ],
  products: [
    {
      id: 2,
      sku: 'GLOW-1994',
      name: 'Lancome Idole Eau De Parfum Best Seller Luxury Perfume With Four Roses, Jasmine and Chypre Accord',
      slug: 'lancome-idole-eau-de-parfum-best-seller-luxury-perfume-with-four-roses-jasmine-and-chypre-accord',
      brand_id: 1,
      category_id: 5,
      sub_category: 'Women',
      sub_category_slug: 'women',
      original_price: 10500,
      discounted_price: null,
      stock_qty: 20,
      rating_avg: 5,
      review_count: 0,
      main_image: 'https://images-static.nykaa.com/media/catalog/product/6/6/66e95e6LANCO00000281_1x.jpg?tr=w-344,h-344,cm-pad_resize',
      description: '',
      ingredients: '',
      benefits: '',
      how_to_use: '',
      suitable_skin_types: 'Oily,Dry,Combination,Sensitive,Normal',
      skin_concerns: 'Dryness,Redness',
      is_featured: false,
      is_bestseller: false,
      is_new_arrival: false,
      status: 'active',
      created_at: '2026-08-21T17:45:35.293Z'
    },
    {
      id: 3,
      sku: 'GLOW-4029',
      name: 'Moi Cherry Bomb Long-Lasting Eau De Parfum For Women (Sweet, Juicy, Gourmand, Smoky, Day+Night)',
      slug: 'moi-cherry-bomb-long-lasting-eau-de-parfum-for-women-sweet-juicy-gourmand-smoky-day-night',
      brand_id: 1,
      category_id: 5,
      sub_category: 'Women',
      sub_category_slug: 'women',
      original_price: 809,
      discounted_price: null,
      stock_qty: 25,
      rating_avg: 5,
      review_count: 0,
      main_image: 'https://images-static.nykaa.com/media/catalog/product/f/0/f07a22bNYKAF00000028_r1.jpg',
      description: '',
      ingredients: '',
      benefits: '',
      how_to_use: '',
      suitable_skin_types: 'Oily,Dry,Combination,Sensitive,Normal',
      skin_concerns: 'Dryness,Redness',
      is_featured: false,
      is_bestseller: false,
      is_new_arrival: false,
      status: 'active',
      created_at: '2026-08-22T04:31:50.721Z'
    },
    {
      id: 4,
      sku: 'GLOW-2645',
      name: 'Yves Saint Laurent Libre Eau De Parfum With Lavender Essence, Orange Blossom, Musk & Warm Vanilla',
      slug: 'yves-saint-laurent-libre-eau-de-parfum-with-lavender-essence-orange-blossom-musk-warm-vanilla',
      brand_id: 1,
      category_id: 5,
      sub_category: 'Minis',
      sub_category_slug: 'minis',
      original_price: 2800,
      discounted_price: null,
      stock_qty: 50,
      rating_avg: 5,
      review_count: 0,
      main_image: 'https://images-static.nykaa.com/media/catalog/product/8/1/81e24abYVESS00000024_1.jpg?tr=w-344,h-344,cm-pad_resize',
      description: '',
      ingredients: '',
      benefits: '',
      how_to_use: '',
      suitable_skin_types: 'Oily,Dry,Combination,Sensitive,Normal',
      skin_concerns: 'Dryness,Redness',
      is_featured: false,
      is_bestseller: false,
      is_new_arrival: false,
      status: 'active',
      created_at: '2026-08-22T08:22:26.661Z'
    },
    {
      id: 5,
      sku: 'GLOW-5093',
      name: "Moi Raison D'Etre Sensual Floral Mini Perfume | Travel Size Long-Lasting Vanilla EDP For Women",
      slug: 'moi-raison-d-etre-sensual-floral-mini-perfume-travel-size-long-lasting-vanilla-edp-for-women',
      brand_id: 1,
      category_id: 5,
      sub_category: 'Minis',
      sub_category_slug: 'minis',
      original_price: 400,
      discounted_price: null,
      stock_qty: 30,
      rating_avg: 5,
      review_count: 0,
      main_image: 'https://images-static.nykaa.com/media/catalog/product/d/3/d3289988904245710729_0.jpg',
      description: '',
      ingredients: '',
      benefits: '',
      how_to_use: '',
      suitable_skin_types: 'Oily,Dry,Combination,Sensitive,Normal',
      skin_concerns: 'Dryness,Redness',
      is_featured: false,
      is_bestseller: false,
      is_new_arrival: false,
      status: 'active',
      created_at: '2026-08-22T08:23:46.328Z'
    },
    {
      id: 6,
      sku: 'GLOW-4371',
      name: 'Kayali Eden Plush Pear Eau De Parfum',
      slug: 'kayali-eden-plush-pear-eau-de-parfum',
      brand_id: 1,
      category_id: 5,
      sub_category: 'Minis',
      sub_category_slug: 'minis',
      original_price: 2600,
      discounted_price: null,
      stock_qty: 25,
      rating_avg: 5,
      review_count: 0,
      main_image: 'https://images-static.nykaa.com/media/catalog/product/4/c/4c306a86294018408680_1.jpg',
      description: '',
      ingredients: '',
      benefits: '',
      how_to_use: '',
      suitable_skin_types: 'Oily,Dry,Combination,Sensitive,Normal',
      skin_concerns: 'Dryness,Redness',
      is_featured: false,
      is_bestseller: false,
      is_new_arrival: false,
      status: 'active',
      created_at: '2026-08-22T08:24:32.994Z'
    },
    {
      id: 7,
      sku: 'GLOW-1480',
      name: 'Plum BodyLovin Vanilla Vibes Eau De Parfum - Long Lasting Warm Vanilla Perfume',
      slug: 'plum-bodylovin-vanilla-vibes-eau-de-parfum-long-lasting-warm-vanilla-perfume',
      brand_id: 1,
      category_id: 5,
      sub_category: 'Minis',
      sub_category_slug: 'minis',
      original_price: 300,
      discounted_price: null,
      stock_qty: 25,
      rating_avg: 5,
      review_count: 0,
      main_image: 'https://images-static.nykaa.com/media/catalog/product/d/4/d4efa8aPLUMX00000286_01.jpg',
      description: '',
      ingredients: '',
      benefits: '',
      how_to_use: '',
      suitable_skin_types: 'Oily,Dry,Combination,Sensitive,Normal',
      skin_concerns: 'Dryness,Redness',
      is_featured: false,
      is_bestseller: false,
      is_new_arrival: false,
      status: 'active',
      created_at: '2026-08-22T08:25:09.074Z'
    }
  ],
  reviews: [],
  wishlists: [],
  cart: [],
  addresses: [],
  orders: [],
  order_items: [],
  coupons: [
    { id: 1, code: 'GLOW20', discount_type: 'percentage', discount_value: 20, min_order_amount: 30, max_usage: 1000, times_used: 0, expires_at: '2027-12-31T23:59:59Z', status: 'active' },
    { id: 2, code: 'SKIN10', discount_type: 'fixed', discount_value: 10, min_order_amount: 40, max_usage: 500, times_used: 0, expires_at: '2027-12-31T23:59:59Z', status: 'active' },
    { id: 3, code: 'WELCOME15', discount_type: 'percentage', discount_value: 15, min_order_amount: 25, max_usage: 200, times_used: 0, expires_at: '2027-12-31T23:59:59Z', status: 'active' }
  ],
  skin_profiles: [],
  skin_analyses: []
};

export class Db {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Sync categories, brands, subcategories, and products if missing
        let migrated = false;
        if (!this.data.categories || this.data.categories.length === 0) {
          this.data.categories = JSON.parse(JSON.stringify(initialData.categories));
          migrated = true;
        } else {
          // Merge any categories present in initialData that are missing in db.json
          initialData.categories.forEach(initCat => {
            const exists = this.data.categories.find(c => c.id === initCat.id);
            if (!exists) {
              this.data.categories.push(JSON.parse(JSON.stringify(initCat)));
              migrated = true;
            }
          });

          // Ensure each category has subcategories array and sync default subcategories if missing
          this.data.categories.forEach(cat => {
            const initCat = initialData.categories.find(ic => ic.id === cat.id);
            if (!cat.subcategories || cat.subcategories.length === 0) {
              if (initCat && initCat.subcategories && initCat.subcategories.length > 0) {
                cat.subcategories = JSON.parse(JSON.stringify(initCat.subcategories));
                migrated = true;
              } else if (!cat.subcategories) {
                cat.subcategories = [];
                migrated = true;
              }
            } else if (initCat && initCat.subcategories && initCat.subcategories.length > 0) {
              initCat.subcategories.forEach(initSub => {
                if (!cat.subcategories!.some(s => s.id === initSub.id || s.name.trim().toLowerCase() === initSub.name.trim().toLowerCase())) {
                  cat.subcategories!.push(JSON.parse(JSON.stringify(initSub)));
                  migrated = true;
                }
              });
            }
          });
        }
        if (!this.data.brands || this.data.brands.length === 0) {
          this.data.brands = JSON.parse(JSON.stringify(initialData.brands));
          migrated = true;
        }
        if (!this.data.products) {
          this.data.products = JSON.parse(JSON.stringify(initialData.products));
          migrated = true;
        }
        if (!this.data.store_settings) {
          this.data.store_settings = { ...initialData.store_settings! };
          migrated = true;
        }
        if (this.data.admins && this.data.admins.length > 0) {
          if (!this.data.admins[0].full_name) {
            this.data.admins[0].full_name = 'Store Owner & Administrator';
            this.data.admins[0].phone = '+91 98765 43210';
            this.data.admins[0].avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
            migrated = true;
          }
        }
        if (migrated) {
          this.save();
        }
      } catch (err) {
        console.error('Error reading db.json, reinitializing seed data:', err);
        this.data = initialData;
        this.save();
      }
    } else {
      this.data = initialData;
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db.json:', err);
    }
  }

  // Getters
  getUsers() { return this.data.users; }
  getAdmins() { return this.data.admins; }
  getCategories() { return this.data.categories; }
  getBrands() { return this.data.brands; }
  getProducts() { return this.data.products; }
  getReviews() { return this.data.reviews; }
  getWishlists() { return this.data.wishlists; }
  getCart() { return this.data.cart; }
  getAddresses() { return this.data.addresses; }
  getOrders() { return this.data.orders; }
  getOrderItems() { return this.data.order_items; }
  getCoupons() { return this.data.coupons; }
  getSkinProfiles() { return this.data.skin_profiles; }
  getSkinAnalyses() { return this.data.skin_analyses; }
  getNewsletterSubscribers() {
    if (!this.data.newsletter_subscribers) {
      this.data.newsletter_subscribers = [];
    }
    return this.data.newsletter_subscribers;
  }

  addNewsletterSubscriber(email: string, source: string = 'footer_newsletter') {
    const subs = this.getNewsletterSubscribers();
    const cleanEmail = email.toLowerCase().trim();
    const existing = subs.find(s => s.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'active';
        this.save();
      }
      return { subscriber: existing, isNew: false };
    }
    const id = subs.length > 0 ? Math.max(...subs.map(s => s.id)) + 1 : 1;
    const newSub: NewsletterSubscriber = {
      id,
      email: cleanEmail,
      source,
      status: 'active',
      created_at: new Date().toISOString()
    };
    subs.push(newSub);
    this.save();
    return { subscriber: newSub, isNew: true };
  }

  // User Actions
  findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: Omit<User, 'id' | 'created_at'>) {
    const id = this.data.users.length > 0 ? Math.max(...this.data.users.map(u => u.id)) + 1 : 1;
    const newUser: User = { ...user, id, created_at: new Date().toISOString() };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id: number, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  // Admin Actions
  findAdminByEmailOrUsername(term: string) {
    const t = term.toLowerCase();
    return this.data.admins.find(a => a.email.toLowerCase() === t || a.username.toLowerCase() === t);
  }

  getAdminById(id: number) {
    return this.data.admins.find(a => a.id === id);
  }

  updateAdmin(id: number, updates: Partial<Admin>) {
    const idx = this.data.admins.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.admins[idx] = { ...this.data.admins[idx], ...updates };
      this.save();
      return this.data.admins[idx];
    }
    return null;
  }

  // Store Settings Actions
  getStoreSettings(): StoreSettings {
    if (!this.data.store_settings) {
      this.data.store_settings = { ...initialData.store_settings! };
      this.save();
    }
    return this.data.store_settings;
  }

  updateStoreSettings(updates: Partial<StoreSettings>): StoreSettings {
    const current = this.getStoreSettings();
    this.data.store_settings = { ...current, ...updates };
    this.save();
    return this.data.store_settings;
  }

  // Product Actions
  addProduct(prod: Omit<Product, 'id' | 'created_at'>) {
    const id = this.data.products.length > 0 ? Math.max(...this.data.products.map(p => p.id)) + 1 : 1;
    const newProd: Product = { ...prod, id, created_at: new Date().toISOString() };
    this.data.products.push(newProd);
    this.save();
    return newProd;
  }

  updateProduct(id: number, updates: Partial<Product>) {
    const numId = Number(id);
    const idx = this.data.products.findIndex(p => Number(p.id) === numId);
    if (idx !== -1) {
      const sanitizedUpdates = { ...updates };
      delete (sanitizedUpdates as any).id;
      this.data.products[idx] = {
        ...this.data.products[idx],
        ...sanitizedUpdates,
        id: numId
      };
      this.save();
      return this.data.products[idx];
    }
    return null;
  }

  deleteProduct(id: number) {
    const numId = Number(id);
    this.data.products = this.data.products.filter(p => Number(p.id) !== numId);
    if (this.data.cart) {
      this.data.cart = this.data.cart.filter(c => Number(c.product_id) !== numId);
    }
    if (this.data.wishlists) {
      this.data.wishlists = this.data.wishlists.filter(w => Number(w.product_id) !== numId);
    }
    this.save();
    return true;
  }

  // Category Actions
  addCategory(cat: Omit<Category, 'id' | 'created_at'>) {
    const id = this.data.categories.length > 0 ? Math.max(...this.data.categories.map(c => c.id)) + 1 : 1;
    const newCat: Category = { ...cat, id, created_at: new Date().toISOString() };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  updateCategory(id: number, updates: Partial<Category>) {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
      this.save();
      return this.data.categories[idx];
    }
    return null;
  }

  deleteCategory(id: number) {
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    const fallbackCatId = this.data.categories.length > 0 ? this.data.categories[0].id : 1;
    this.data.products.forEach(p => {
      if (p.category_id === id) {
        p.category_id = fallbackCatId;
        p.sub_category = null;
        p.sub_category_slug = null;
      }
    });
    this.save();
    return true;
  }

  // SubCategory Actions
  addSubCategory(categoryId: number, subCat: { name: string; slug?: string; description?: string; image_url?: string; icon?: string }) {
    const cat = this.data.categories.find(c => c.id === categoryId);
    if (!cat) return null;
    if (!cat.subcategories) cat.subcategories = [];
    const maxId = cat.subcategories.length > 0 ? Math.max(...cat.subcategories.map(s => s.id)) : categoryId * 100;
    const newSub: SubCategory = {
      id: maxId + 1,
      name: subCat.name,
      slug: subCat.slug || subCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: subCat.description || '',
      image_url: subCat.image_url || cat.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
      icon: subCat.icon || ''
    };
    cat.subcategories.push(newSub);
    this.save();
    return newSub;
  }

  deleteSubCategory(categoryId: number, subCategoryId: number) {
    const cat = this.data.categories.find(c => c.id === categoryId);
    if (!cat || !cat.subcategories) return false;
    cat.subcategories = cat.subcategories.filter(s => s.id !== subCategoryId);
    this.save();
    return true;
  }

  // Cart Actions
  getCartForUser(userId?: number, sessionId?: string) {
    return this.data.cart.filter(item => {
      if (userId && item.user_id === userId) return true;
      if (sessionId && item.session_id === sessionId) return true;
      return false;
    });
  }

  addToCart(item: Omit<CartItem, 'id' | 'created_at'>) {
    const existing = this.data.cart.find(c => {
      if (item.user_id && c.user_id === item.user_id && c.product_id === item.product_id) return true;
      if (item.session_id && c.session_id === item.session_id && c.product_id === item.product_id) return true;
      return false;
    });

    if (existing) {
      existing.quantity += item.quantity;
      this.save();
      return existing;
    } else {
      const id = this.data.cart.length > 0 ? Math.max(...this.data.cart.map(c => c.id)) + 1 : 1;
      const newItem: CartItem = { ...item, id, created_at: new Date().toISOString() };
      this.data.cart.push(newItem);
      this.save();
      return newItem;
    }
  }

  updateCartQuantity(cartId: number, qty: number) {
    const idx = this.data.cart.findIndex(c => c.id === cartId);
    if (idx !== -1) {
      if (qty <= 0) {
        this.data.cart.splice(idx, 1);
      } else {
        this.data.cart[idx].quantity = qty;
      }
      this.save();
      return true;
    }
    return false;
  }

  removeFromCart(cartId: number) {
    this.data.cart = this.data.cart.filter(c => c.id !== cartId);
    this.save();
    return true;
  }

  clearCart(userId?: number, sessionId?: string) {
    this.data.cart = this.data.cart.filter(item => {
      if (userId && item.user_id === userId) return false;
      if (sessionId && item.session_id === sessionId) return false;
      return true;
    });
    this.save();
  }

  // Wishlist Actions
  toggleWishlist(userId: number, productId: number) {
    const existingIdx = this.data.wishlists.findIndex(w => w.user_id === userId && w.product_id === productId);
    if (existingIdx !== -1) {
      this.data.wishlists.splice(existingIdx, 1);
      this.save();
      return { inWishlist: false };
    } else {
      const id = this.data.wishlists.length > 0 ? Math.max(...this.data.wishlists.map(w => w.id)) + 1 : 1;
      this.data.wishlists.push({ id, user_id: userId, product_id: productId, created_at: new Date().toISOString() });
      this.save();
      return { inWishlist: true };
    }
  }

  // Order Actions
  createOrder(orderData: Omit<Order, 'id' | 'created_at'>, items: Omit<OrderItem, 'id' | 'order_id'>[]) {
    const orderId = this.data.orders.length > 0 ? Math.max(...this.data.orders.map(o => o.id)) + 1 : 1;
    const newOrder: Order = { ...orderData, id: orderId, created_at: new Date().toISOString() };
    this.data.orders.push(newOrder);

    let itemIdCounter = this.data.order_items.length > 0 ? Math.max(...this.data.order_items.map(i => i.id)) + 1 : 1;
    const createdItems: OrderItem[] = items.map(item => ({
      ...item,
      id: itemIdCounter++,
      order_id: orderId
    }));
    this.data.order_items.push(...createdItems);
    this.save();

    return { ...newOrder, items: createdItems };
  }

  updateOrderStatus(orderId: number, status: Order['order_status'], trackingNumber?: string) {
    const idx = this.data.orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      this.data.orders[idx].order_status = status;
      if (trackingNumber) this.data.orders[idx].tracking_number = trackingNumber;
      this.save();
      return this.data.orders[idx];
    }
    return null;
  }

  // Reviews
  addReview(review: Omit<ProductReview, 'id' | 'created_at'>) {
    const id = this.data.reviews.length > 0 ? Math.max(...this.data.reviews.map(r => r.id)) + 1 : 1;
    const newReview: ProductReview = { ...review, id, created_at: new Date().toISOString() };
    this.data.reviews.push(newReview);

    // Recalculate product rating
    const prodReviews = this.data.reviews.filter(r => r.product_id === review.product_id && r.status === 'approved');
    const prodIdx = this.data.products.findIndex(p => p.id === review.product_id);
    if (prodIdx !== -1 && prodReviews.length > 0) {
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      this.data.products[prodIdx].rating_avg = Math.round(avg * 100) / 100;
      this.data.products[prodIdx].review_count = prodReviews.length;
    }
    this.save();
    return newReview;
  }

  updateReviewStatus(id: number, status: ProductReview['status']) {
    const idx = this.data.reviews.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.reviews[idx].status = status;
      this.save();
      return this.data.reviews[idx];
    }
    return null;
  }

  deleteReview(id: number) {
    this.data.reviews = this.data.reviews.filter(r => r.id !== id);
    this.save();
    return true;
  }

  // Coupons
  addCoupon(coupon: Omit<Coupon, 'id'>) {
    const id = this.data.coupons.length > 0 ? Math.max(...this.data.coupons.map(c => c.id)) + 1 : 1;
    const newCoupon: Coupon = { ...coupon, id, times_used: 0 };
    this.data.coupons.push(newCoupon);
    this.save();
    return newCoupon;
  }

  deleteCoupon(id: number) {
    this.data.coupons = this.data.coupons.filter(c => c.id !== id);
    this.save();
    return true;
  }

  toggleCouponStatus(id: number) {
    const idx = this.data.coupons.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.coupons[idx].status = this.data.coupons[idx].status === 'active' ? 'disabled' : 'active';
      this.save();
      return this.data.coupons[idx];
    }
    return null;
  }

  // Skin Analysis
  addSkinAnalysis(analysis: Omit<SkinAnalysis, 'id' | 'created_at'>) {
    const id = this.data.skin_analyses.length > 0 ? Math.max(...this.data.skin_analyses.map(a => a.id)) + 1 : 1;
    const newAnalysis: SkinAnalysis = { ...analysis, id, created_at: new Date().toISOString() };
    this.data.skin_analyses.push(newAnalysis);
    this.save();
    return newAnalysis;
  }
}

export const db = new Db();
