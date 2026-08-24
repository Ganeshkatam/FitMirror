# FitMirror

FitMirror is a modern, high-performance eCommerce platform engineered to provide a seamless, next-generation shopping experience. It features immersive 3D virtual try-ons, multi-tenant architectural support (Customers, Sellers, and Admins), and a highly optimized modern web stack.

## ✨ Key Features

- **Virtual Try-On & 3D Previews:** Immersive shopping experience powered by `Three.js` and React Three Fiber.
- **Multi-Tenant Foundation:** Role-based access control and distinct workflows for Customers, Sellers, and Platform Admins.
- **AI-Powered Personalization:** Intelligent product recommendations and AI shopping assistant.
- **High Performance:** Built on Next.js 16 with Turbopack and React 19 for instantaneous page loads.
- **Real-Time Data:** Cart, inventory, and order status synchronized instantly via Supabase.
- **Reliable Transactions:** Secure payment processing with Razorpay and robust email notifications powered by Brevo.

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Radix UI, Framer Motion
- **Database & Auth:** Supabase (PostgreSQL + RLS)
- **3D Rendering:** `@react-three/fiber`, `@react-three/drei`
- **Email Delivery:** Brevo (formerly Sendinblue)
- **Payments:** Razorpay
- **Testing:** Vitest, Playwright

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js v20+** installed.

### 1. Installation

Because FitMirror utilizes an optimized, locked combination of modern peer dependencies (React 19, Next 16), it is **critical** to install dependencies strictly from the lockfile:

```bash
# Clone the repository
git clone https://github.com/Ganeshkatam/FitMirror.git
cd FitMirror

# Install exact dependencies
npm ci --legacy-peer-deps
```

### 2. Environment Configuration

Copy the example environment file and configure your local keys:

```bash
cp .env.example .env.local
```

You will need to fill in the following critical variables:
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Brevo**: `BREVO_API_KEY` (Required for email notifications)
- **Razorpay**: `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### 3. Database Migration

Ensure your Supabase project is up to date by applying the latest migrations (including the Phase 6 Platform Foundation):

```bash
npx supabase db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🧪 Testing

The project maintains a rigorous test suite using Vitest for unit/integration testing and Playwright for E2E testing.

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

## 🏗️ Architecture Notes

FitMirror was recently migrated to a streamlined **Phase 6 Platform Architecture**:
- The Next.js application strictly acts as the **Customer Storefront** (`FitMirror Official Store`).
- The database foundation natively supports **Admins** and **Sellers**, allowing future expansion into seller portals and admin dashboards without bloating the customer-facing frontend.
- Unused monolithic legacy components and dependencies have been purged for maximum performance and maintainability.

## 📄 License

This project is proprietary and confidential.
