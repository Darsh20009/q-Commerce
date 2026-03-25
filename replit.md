# Gen M&Z - Fashion E-commerce Platform

## Overview

Gen M&Z is a full-featured bilingual (Arabic/English) fashion e-commerce platform targeting Saudi Arabia's Gen M and Gen Z consumers. The platform features a minimalist, luxury aesthetic inspired by Zara and Everlane, with complete storefront functionality, shopping cart, user authentication, and an admin dashboard for managing products, orders, and customers.

The application follows a monorepo structure with a React frontend (Vite), Express backend, and PostgreSQL database using Drizzle ORM. It supports RTL layout for Arabic, dark/light themes, and is designed mobile-first with responsive breakpoints.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom plugins for Replit integration
- **Routing**: Wouter (lightweight React router)
- **State Management**: 
  - TanStack Query for server state (products, orders, auth)
  - Zustand for client state (shopping cart with persistence)
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Icons**: Lucide React + react-icons for social media icons

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Authentication**: Passport.js with local strategy, express-session with memory store
- **Password Hashing**: Node crypto scrypt with salt
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod validation
- **Security**: Helmet security headers, express-rate-limit (20 req/15min on auth, 500/15min global), no hardcoded secrets, SESSION_SECRET from env

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: shared/schema.ts (shared between frontend and backend)
- **Migrations**: drizzle-kit for schema management
- **Key Tables**: users, products, orders, categories
- **Product Variants**: Stored as JSONB for flexibility (color, size, sku, stock)

### Project Structure
```
├── client/src/           # React frontend
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route pages (Home, Products, Cart, Admin, etc.)
│   ├── hooks/           # Custom hooks (auth, cart, products)
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── routes.ts        # API endpoint definitions
│   ├── storage.ts       # Database access layer
│   ├── auth.ts          # Authentication setup
│   └── seed.ts          # Initial data seeding
├── shared/              # Shared code
│   ├── schema.ts        # Drizzle database schemas
│   └── routes.ts        # API route definitions with Zod schemas
└── attached_assets/     # Static assets and reference materials
```

### Design System
- **Typography**: Cairo font for Arabic/body text, with display and body font variables
- **Color Scheme**: Black/white minimalist luxury theme with CSS custom properties
- **RTL Support**: Full right-to-left layout with dir="rtl" attribute
- **Theme Toggle**: Dark/light mode with localStorage persistence

### User Roles
The system supports four roles: admin, employee, customer, and support. Admins have full access to the dashboard for managing products, orders, and customers.

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via DATABASE_URL environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### Authentication
- **Passport.js**: Authentication middleware with local username/password strategy
- **express-session**: Session management with configurable memory store
- **SESSION_SECRET**: Environment variable for session encryption

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **zustand**: Client-side state with localStorage persistence for cart
- **shadcn/ui**: Pre-built accessible UI components (Radix primitives)
- **framer-motion**: Animation library for transitions
- **react-hook-form + zod**: Form handling with validation

### Build and Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Fonts
- **Google Fonts**: Cairo (Arabic support), Manrope, Cormorant Garamond (per design guidelines)

### Image Storage
- Design specifies Cloudinary/S3 integration for product images (not yet implemented)
- Currently using static assets and external URLs