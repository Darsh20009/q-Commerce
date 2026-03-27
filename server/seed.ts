import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { CategoryModel, UserModel } from "./models";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buffer = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buffer.toString("hex")}.${salt}`;
}

export async function seed() {
  // Remove old phone numbers if exist
  await UserModel.deleteMany({ phone: "0532441566" });
  await UserModel.deleteMany({ phone: "0552469643" });
  await UserModel.deleteMany({ phone: "0567326086" });
  await UserModel.deleteMany({ phone: "567326086" });
  await UserModel.deleteMany({ phone: "567891011" });
  
  // Create Qirox Studio admin user
  console.log("Seeding Qirox Studio admin user...");
  const password = await hashPassword("123456");
  await storage.createUser({
    phone: "567891011",
    password,
    role: "admin",
    name: "Qirox Studio",
    username: "567891011",
    email: "qiroxsystem@gmail.com",
    walletBalance: "0",
    addresses: [],
    permissions: [
      "orders.view", "orders.edit", "orders.refund",
      "products.view", "products.edit",
      "customers.view", "wallet.adjust",
      "reports.view", "staff.manage",
      "pos.access", "settings.manage"
    ],
    loginType: "both",
    isActive: true,
    mustChangePassword: false,
    loyaltyPoints: 0,
    loyaltyTier: "bronze",
    totalSpent: 0,
    phoneDiscountEligible: false
  });
  console.log("Admin user created with phone 567891011 and password 123456");

  const defaultCategoryData: Record<string, { nameAr: string; image: string }> = {
    men:         { nameAr: "رجال",      image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&h=500&fit=crop&auto=format" },
    women:       { nameAr: "نساء",      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop&auto=format" },
    kids:        { nameAr: "أطفال",     image: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400&h=500&fit=crop&auto=format" },
    accessories: { nameAr: "إكسسوار",  image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop&auto=format" },
    perfumes:    { nameAr: "عطور",      image: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=500&fit=crop&auto=format" },
  };

  const categories = await storage.getCategories();
  if (categories.length === 0) {
    await CategoryModel.insertMany([
      { name: "Men",         slug: "men",         nameAr: "رجال",     image: defaultCategoryData.men.image },
      { name: "Women",       slug: "women",       nameAr: "نساء",     image: defaultCategoryData.women.image },
      { name: "Kids",        slug: "kids",        nameAr: "أطفال",    image: defaultCategoryData.kids.image },
      { name: "Accessories", slug: "accessories", nameAr: "إكسسوار", image: defaultCategoryData.accessories.image },
      { name: "Perfumes",    slug: "perfumes",    nameAr: "عطور",     image: defaultCategoryData.perfumes.image },
    ]);
    console.log("Categories seeded");
  } else {
    // Migrate existing categories: add nameAr and image if missing
    for (const cat of categories) {
      const def = defaultCategoryData[cat.slug];
      if (def && (!cat.image || !cat.nameAr)) {
        await storage.updateCategory(cat.id, {
          nameAr: cat.nameAr || def.nameAr,
          image: cat.image || def.image,
        });
      }
    }
  }

  // Seed featured products
  const products = await storage.getProducts();
  if (products.length === 0) {
    await storage.createProduct({
      name: "Burgundy Hoodie",
      description: "Premium quality burgundy hoodie with comfortable fit",
      price: "299.99",
      cost: "150",
      images: [
        "https://images.unsplash.com/photo-1556821552-7f41c5d440db?auto=format&fit=crop&q=80",
      ],
      isFeatured: true,
      printBarcode: true,
      categoryIds: [],
      variants: [
        { color: "Burgundy", size: "S", sku: "BURG-S", stock: 10, cost: 150 },
        { color: "Burgundy", size: "M", sku: "BURG-M", stock: 15, cost: 150 },
        { color: "Burgundy", size: "L", sku: "BURG-L", stock: 12, cost: 150 },
        { color: "Burgundy", size: "XL", sku: "BURG-XL", stock: 8, cost: 150 },
      ]
    });

    await storage.createProduct({
      name: "Teal Jacket",
      description: "Stylish teal jacket perfect for any season",
      price: "399.99",
      cost: "200",
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16ebc5?auto=format&fit=crop&q=80",
      ],
      isFeatured: true,
      printBarcode: true,
      categoryIds: [],
      variants: [
        { color: "Teal", size: "S", sku: "TEAL-S", stock: 8, cost: 200 },
        { color: "Teal", size: "M", sku: "TEAL-M", stock: 12, cost: 200 },
        { color: "Teal", size: "L", sku: "TEAL-L", stock: 10, cost: 200 },
      ]
    });

    await storage.createProduct({
      name: "Grey Sweater",
      description: "Cozy grey sweater made from premium materials",
      price: "249.99",
      cost: "120",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80",
      ],
      isFeatured: true,
      printBarcode: true,
      categoryIds: [],
      variants: [
        { color: "Grey", size: "XS", sku: "GREY-XS", stock: 6, cost: 120 },
        { color: "Grey", size: "S", sku: "GREY-S", stock: 10, cost: 120 },
        { color: "Grey", size: "M", sku: "GREY-M", stock: 14, cost: 120 },
        { color: "Grey", size: "L", sku: "GREY-L", stock: 9, cost: 120 },
        { color: "Grey", size: "XL", sku: "GREY-XL", stock: 7, cost: 120 },
      ]
    });

    await storage.createProduct({
      name: "Blue Hoodie",
      description: "Classic blue hoodie with modern design",
      price: "279.99",
      cost: "140",
      images: [
        "https://images.unsplash.com/photo-1543163521-9efcc062db33?auto=format&fit=crop&q=80",
      ],
      isFeatured: true,
      printBarcode: true,
      categoryIds: [],
      variants: [
        { color: "Blue", size: "S", sku: "BLUE-S", stock: 11, cost: 140 },
        { color: "Blue", size: "M", sku: "BLUE-M", stock: 16, cost: 140 },
        { color: "Blue", size: "L", sku: "BLUE-L", stock: 13, cost: 140 },
      ]
    });

    console.log("Featured products seeded");
  }

  // Seed shipping companies
  const companies = await storage.getShippingCompanies();
  if (companies.length === 0) {
    await storage.createShippingCompany({
      name: "Storage Station",
      price: 20,
      estimatedDays: 3,
      isActive: true,
      storageXCode: "SS20"
    });
    console.log("Storage Station shipping seeded");
  }
}
