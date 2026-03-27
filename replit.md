# Qirox Studio - E-commerce & POS Platform

## Overview

Qirox Studio is a comprehensive bilingual (Arabic/English) e-commerce and Point of Sale (POS) platform for the Saudi Arabian fashion market. It includes a customer storefront, admin dashboard, and POS system for physical branch management. The platform is fully localized with RTL support, ZATCA-compliant invoice placeholders, and Saudi-specific payment methods.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7 with Replit plugins (cartographer, dev-banner, runtime-error-modal)
- **Routing**: Wouter (lightweight React router)
- **State Management**: 
  - TanStack Query for server state (products, orders, auth)
  - Zustand for client state (cart, language preference)
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion
- **Icons**: Lucide React + react-icons
- **Charts**: Recharts for admin analytics
- **Maps**: Leaflet / react-leaflet for branch locations

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules (tsx for dev)
- **Authentication**: Passport.js with local strategy, express-session with memorystore
- **API Design**: RESTful endpoints in server/routes.ts with Zod validation (shared/routes.ts)
- **Security**: Helmet headers, express-rate-limit (20/15min auth, 500/15min global)
- **Real-time**: WebSocket server (ws) on /ws path for notifications
- **File Uploads**: Multer for product images stored in /uploads/
- **Email**: SMTP2Go service (configured via SMTP2GO_API_KEY env var)
- **AI Features**: OpenAI integration for product descriptions (OPENAI_API_KEY)

### Database Layer
- **Database**: MongoDB via Mongoose
- **Connection**: MONGODB_URI environment variable (MongoDB Atlas)
- **Models**: server/models.ts — users, products, orders, categories, branches, etc.
- **Seeding**: server/seed.ts — auto-seeds admin user on startup

### Project Structure
```
├── client/src/           # React frontend
│   ├── components/       # Reusable UI components (shadcn/ui, layout, etc.)
│   ├── pages/           # Route pages (Home, Products, Cart, Admin, POS, etc.)
│   ├── hooks/           # Custom hooks (auth, cart, language, notifications)
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── index.ts         # Server entry point, WebSocket setup
│   ├── routes.ts        # API endpoint definitions
│   ├── models.ts        # Mongoose schemas
│   ├── storage.ts       # Database access layer
│   ├── auth.ts          # Passport authentication setup
│   ├── seed.ts          # Database seeding
│   ├── ai.ts            # OpenAI integration
│   ├── email.ts         # Email service
│   ├── notifications.ts # WebSocket notifications
│   └── payment-simulator.ts  # Tamara/Tabby/STC Pay/Apple Pay simulation
├── shared/              # Shared code (frontend + backend)
│   ├── schema.ts        # Zod schemas and TypeScript types
│   └── routes.ts        # API route definitions with Zod schemas
├── uploads/             # Uploaded product images
└── attached_assets/     # Static reference assets
```

### Key Features
- **Storefront**: Product catalog, cart, checkout with multiple Saudi payment methods
- **Wishlist**: Add/remove products to wishlist with heart button on cards; accessible at `/profile/wishlist`
- **Product Reviews**: Star ratings (1–5) + comments per product; average rating shown on product detail page
- **Admin Dashboard**: Analytics (real daily revenue 30 days, order status, vendor stats, return counts, revenue growth %), product management, order management, staff roles (RBAC)
- **Low Stock Alerts**: Admin overview panel shows products with stock ≤ 5 units automatically
- **Shipping Companies**: Full CRUD admin panel for shipping providers (`/api/shipping-companies`)
- **Invoice PDF**: Print/download ZATCA-compliant invoices from the customer profile invoices page
- **POS System**: Cashier interface, cash drawer management, branch inventory
- **Multi-branch**: Branch-specific inventory tracking with map view
- **PWA**: Service worker, web app manifest, installable
- **Multi-Vendor Marketplace**: Sellers apply at `/vendor/apply`, manage store at `/vendor/dashboard`; admin approves/rejects via "البائعون" tab; public store pages at `/stores/:id`; products tagged with "بائع مستقل" badge; vendor role added to userRoles
- **Flash Deals System**: Admin creates time-limited flash deals (discountPercent, start/end time, maxQuantity); `FlashDeal` model in MongoDB; `/api/flash-deals` public endpoint + `/api/admin/flash-deals` CRUD; homepage shows active deals with real countdown timers tied to actual endTime; "عروض فلاش" tab in admin sidebar
- **Returns Management**: Customers request returns from completed orders at `/orders` page with reason + detail + refund method; `ReturnRequest` model in MongoDB; `/api/returns` customer route + `/api/admin/returns` admin route; admin approves/rejects with wallet auto-credit on approval; "المرتجعات" tab in admin sidebar with filter by status
- **Loyalty Points Redemption**: Points earned on order completion; `/api/user/loyalty` endpoint returns tier info (bronze/silver/gold/platinum), point balance, progress to next tier; profile page shows loyalty card with tier badge and progress bar; checkout allows redeeming points for SAR discount (100 points = 1 SAR, max 50 SAR per order)
- **Enhanced Admin Analytics**: OverviewPanel uses real `dailyRevenue30` data from API; new Quick Action Stats row shows pending returns, active vendors, new customers (30 days), and daily revenue growth %

### User Roles
- **admin**: Full access to all features including vendor management
- **employee**: Configurable permissions (pos.access, staff.manage, settings.manage, reports.view, etc.)
- **vendor**: Approved sellers - access to vendor dashboard, product/order management
- **customer**: Storefront, cart, orders, profile, wishlist


## Environment Variables

| Variable | Purpose |
|----------|---------|
| MONGODB_URI | MongoDB Atlas connection string |
| PORT | Server port (default: 5000) |
| SESSION_SECRET | Express session encryption key |
| SMTP2GO_API_KEY | Email service API key |
| SMTP2GO_SENDER | Sender email address |
| SMTP2GO_SENDER_NAME | Sender display name |
| OPENAI_API_KEY | OpenAI API key for AI features |
| VAPID_PUBLIC_KEY | Web push notifications public key |
| VAPID_PRIVATE_KEY | Web push notifications private key |

## Development

- **Start**: `npm run dev` — runs tsx server/index.ts + Vite in middleware mode on port 5000
- **Build**: `npm run build` — runs script/build.ts (esbuild + Vite)
- **Production**: `npm start` — runs dist/index.js

## Deployment

- Build command: `npm run build`
- Run command: `node ./dist/index.cjs`
- Target: Autoscale
