> This is a personal project by Dioman Keita, originally inspired by next-ecommerce-shopco but completely rebuilt for modern, high-performance standards.

# Ika Sugu - Modern E-Commerce Platform

**Ika Sugu** is a high-performance, full-stack Next.js 16 e-commerce platform built on Bun. It emphasizes a **Variant-first philosophy**, blistering fast **Optimistic UI**, and a complete, highly-functional **Admin Dashboard**.

## Overview

Based on industry standards, Ika Sugu bridges the gap between premium design and cutting-edge web development. It leverages a highly optimized data-fetching layer with TanStack Query and implements rock-solid authentication with BetterAuth.

## Core Features

- **Storefront & Admin Dashboard**: Complete end-to-end management of products, variants, orders, and users.
- **Variant-First Philosophy**: Deep integration of product variants (color/size) natively tied to unique SKUs.
- **Optimistic UI**: Instantaneous user feedback backed by resilient TanStack Query mutations.
- **Authentication**: Modern and secure auth flows powered by BetterAuth.
- **Payment Processing**: Stripe integration designed and architected (implementation upcoming).

## Technology Stack

- **Framework**: Next.js 16 (Full App Router)
- **Runtime**: [Bun](https://bun.sh/)
- **State Management & Data Fetching**: TanStack Query
- **Styling**: Tailwind CSS v4 + Framer Motion
- **UI Components**: ShadCN UI
- **Database & ORM**: PostgreSQL with Prisma
- **Auth**: BetterAuth
- **Code Quality**: Prettier, TypeScript
- **Hosting**: Vercel

## Getting Started

To run Ika Sugu locally, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Dioman-Keita/ika-sugu.git
   cd ika-sugu
   ```

2. **Install dependencies (using Bun):**

   ```bash
   bun install
   ```

3. **Set up Environment Variables:**
   Configure your Database and BetterAuth keys in `.env`.

4. **Initialize Prisma & Seed Database:**

   ```bash
   bun run generate-prisma-client
   bun run seed
   ```

5. **Run the development server:**
   ```bash
   bun run dev
   ```

Navigate to [http://localhost:3000](http://localhost:3000) to view the app!

## Project Structure Highlights

- `src/app/` - Next.js 16 App Router (Storefront & `/admin` dashboard)
- `src/app/actions/` - Server Actions handling secure mutations
- `src/components/` - ShadCN reusable UI and domain components
- `src/lib/` - Auth configurations, database setup, and core utilities
- `src/hooks/` - TanStack Query custom hooks

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Push to the branch (`git push origin feature/your-feature-name`).
5. Open a pull request.

## Issues

Feel free to submit issues for any bugs, feature requests, or general questions related to the project.

## License

This project is licensed under the MIT License.
