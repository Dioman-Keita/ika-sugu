# 📦 Ika Sugu - High-Performance E-Commerce

> **Ika Sugu** (Malinke for "Your Market") is a state-of-the-art, full-stack e-commerce platform built with **Next.js 16**, **Bun**, and **Turbopack**. It focuses on **Variant-first** product management and **Atomic** payment processing.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Bun](https://img.shields.io/badge/Bun-Runtime-black?style=for-the-badge&logo=bun)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Atomic-6772E5?style=for-the-badge&logo=stripe&logoColor=white)

---

## 📂 Project Structure

```text
├── 📜 admin-product-authoring.md
├── 📄 bun.lock
├── 🗂️ components.json
├── 📜 currency-philosophy.md
├── 📜 developer-profile.md
├── 📜 emmergency.md
├── 📄 eslint.config.mjs
├── 📜 GEMINI.md
├── 📜 kimi-suggestion.md
├── 📄 LICENSE
├── 🟨 next-env.d.ts
├── 📄 next.config.mjs
├── 🗂️ package.json
├── 📄 postcss.config.mjs
├── 📜 PR.md
├── 📁 prisma
│ ├── 📁 migrations
│ ├── 📄 schema.prisma
├── 🟨 prisma.config.ts
├── 📁 public
│ ├── 📁 icons
│ ├── 📁 images
│ ├── 🖼️ next.svg
│ ├── 🖼️ vercel.svg
├── 📜 README.md
├── 📁 src
│ ├── 📁 app
│ │ ├── 📁 actions (Server Actions - Core Logic)
│ │ ├── 📁 admin (Dashboard)
│ │ ├── 📁 api (Webhooks & API Routes)
│ │ ├── 📁 shop (Storefront)
│ ├── 📁 components
│ │ ├── 📁 admin
│ │ ├── 📁 shop-page
│ │ ├── 📁 ui (ShadCN UI)
│ ├── 📁 generated (Prisma Client)
│ ├── 📁 hooks (TanStack Query)
│ ├── 📁 lib (Auth, DB, Stripe, I18n)
│ ├── 📁 styles (Tailwind CSS v4)
├── 📄 tailwind.config.mjs
├── 🗂️ tsconfig.json
```

---

## 🛡️ Architecture: Server-First Philosophy

Ika Sugu adheres to a **Server-First** approach. Most business logic, data validation, and security checks are handled in **Server Actions** (`src/app/actions`) or **Route Handlers**. This ensures:
- **Security**: Database secrets never leak to the client.
- **Performance**: Reduced bundle size by keeping heavy logic on the server.
- **Stability**: Centralized error handling and revalidation.

---

## 💳 Local Payment Testing (Stripe CLI)

To test payments locally, you **MUST** use the Stripe CLI. Follow these steps:

### 1. Install Stripe CLI
- **macOS (Homebrew)**: `brew install stripe/stripe-cli/stripe`
- **Windows (Scoop)**: `scoop bucket add stripe; scoop install stripe` (or use Chocolatey: `choco install stripe-cli`)
- **Linux**: See official [apt/rpm guides](https://docs.stripe.com/stripe-cli).

### 2. Login & Link Account
Before any test payment, you must authenticate:
```bash
stripe login
```

### 3. Forward Webhooks
Open a dedicated terminal and run:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
> [!IMPORTANT]
> Copy the `whsec_...` secret provided by this command and paste it into your `.env` as `STRIPE_WEBHOOK_SECRET`. **The payment flow will fail if this is missing or incorrect.**

---

## ☁️ Supabase Storage Setup

Ika Sugu uses Supabase for product image hosting with a "Drag & Drop" interface in the Admin panel.

### 1. Create Bucket
In your Supabase Dashboard, create a **Public** bucket named `products`.

### 2. Security Policies (RLS)
By default, **RLS is enabled**. To allow admins to manage images safely, run this SQL in your Supabase SQL Editor:

```sql
-- 1. Give public read access to everyone
create policy "Public Read Access" on storage.objects for select 
using ( bucket_id = 'products' );

-- 2. Allow authenticated users to upload/manage images
create policy "Authenticated Admin Management" on storage.objects 
for all using (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);
```

### 3. Service Role Bypass
For critical cleanup operations (deleting files when a product is deleted), the server uses the `SUPABASE_SERVICE_ROLE_KEY`. This key bypasses RLS to ensure database integrity. **NEVER expose this key to the client.**

---

## 🚦 Quick Start
1. `bun install`
2. Configure `.env.examples` -> `.env`
3. `bun run generate-prisma-client`
4. `bun run seed`
5. `bun run dev`

---

## 📜 License
MIT License. Developed with ❤️ by **Dioman Keita**.
