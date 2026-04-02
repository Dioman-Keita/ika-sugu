# Gemini CLI Context: Ika Sugu

This project is a modern, full-stack e-commerce platform called **Ika sugu**, built with Next.js 16 and Bun. It is a feature-rich fork of `next-ecommerce-shopco`, optimized for performance, scalability, and internationalization.

## Project Overview

- **Name:** Ika sugu
- **Type:** Full-stack E-commerce Application (Next.js 16 App Router)
- **Runtime:** [Bun](https://bun.sh/)
- **Core Technologies:**
  - **Framework:** Next.js 16 (React 19)
  - **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/)
  - **Authentication:** [Better Auth](https://www.better-auth.com/)
  - **Styling:** Tailwind CSS v4, Framer Motion, ShadCN UI
  - **State Management & Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
  - **I18n:** Multi-locale support (English, French)

## Architectural Patterns

- **Server-First Data Flow:** Extensive use of Next.js **Server Actions** (`src/app/actions`) for both queries and mutations.
- **Database Architecture:**
  - Schema defined in `prisma/schema.prisma`.
  - Prisma Client is generated to `src/generated/prisma`.
  - Comprehensive models for `User`, `Product`, `ProductVariant`, `Category`, `Order`, `Review`, and `Cart`.
  - **Internationalization:** Translations for products and categories are stored in dedicated translation tables (e.g., `ProductTranslation`) and retrieved based on the `locale`.
- **Component Organization:**
  - `src/components`: Organized by feature (e.g., `admin`, `cart-page`, `shop-page`).
  - `src/components/ui`: ShadCN UI atomic components.
- **Hooks:** Custom business logic encapsulated in `src/hooks` (e.g., `use-cart.ts`, `use-auth.ts`).
- **Resilience:** Database operations often use retry/fallback wrappers (`withDbRetry`, `withDbFallback`) to handle transient connection issues.

## Key Commands

- `bun dev`: Starts the development server.
- `bun run generate-prisma-client`: Generates the Prisma client (output: `src/generated/prisma`).
- `bun run build`: Generates the Prisma client and builds the Next.js application.
- `bun run start`: Starts the production server.
- `bun run seed`: Seeds the database using `src/scripts/seed.ts`.
- `bun run typecheck`: Runs TypeScript compiler check.
- `bun run lint`: Runs ESLint for code quality.
- `bun run format`: Runs Prettier to format the codebase.

## Development Conventions

- **Server Actions:** Always use `"use server"` directives for files in `src/app/actions`.
- **Type Safety:** Adhere to types defined in `src/types` (e.g., `product.types.ts`).
- **Database Access:** Use the shared Prisma instance from `@/lib/db`.
- **Internationalization:** Use the `Locale` type from `@/lib/i18n/messages` and pass `locale` to actions/components that require translated content.
- **UI Consistency:** Use existing ShadCN UI components and Tailwind utility classes.
- **Error Handling:** Use custom error classes from `src/lib/errors` where appropriate.

## Directory Structure Highlights

- `src/app`: Next.js App Router pages and layouts.
- `src/app/actions`: Server Actions for business logic and data fetching.
- `src/components`: Reusable UI components organized by domain.
- `src/generated/prisma`: Generated Prisma client and types.
- `src/lib`: Core utilities (auth, db, i18n, storage).
- `prisma/`: Database schema and migrations.
- `.antigravity/`: Custom agent instructions and architectural guidelines.
