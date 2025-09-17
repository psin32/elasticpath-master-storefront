# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an **Elastic Path Master Storefront** - a Next.js 14 e-commerce application built as a headless commerce starter using:
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI, Radix UI primitives
- **Commerce Platform**: Elastic Path Commerce Cloud (EPCC)
- **State Management**: TanStack React Query, custom React hooks
- **Search**: Algolia, Klevu, Elastic Path native search
- **Payments**: Stripe, PayPal
- **CMS**: Storyblok (optional)
- **Testing**: Vitest (unit), Playwright (E2E)

## Development Commands

### Core Development
```bash
# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Type checking
yarn type:check
```

### Code Quality
```bash
# Lint code
yarn lint

# Fix linting issues
yarn lint:fix

# Check code formatting
yarn format:check

# Fix code formatting
yarn format:fix
```

### Testing
```bash
# Run unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run end-to-end tests (requires build first)
yarn test:e2e

# Full E2E pipeline (build + start + test + cleanup)
yarn test:ci:e2e
```

### Environment Setup
```bash
# Initialize environment variables
yarn dotenv
```

### Single Test Execution
```bash
# Run a specific test file
yarn vitest run src/path/to/test.test.ts

# Run specific test pattern
yarn vitest run --grep "test pattern"

# Run E2E test by file
yarn playwright test tests/e2e/specific-test.spec.ts
```

## Architecture Overview

### App Router Structure (Next.js 14)
- **Route Groups**: `(store)`, `(auth)`, `(checkout)`, `(admin)` - organize routes without affecting URL structure
- **Server Components**: Default rendering mode with selective client components
- **Middleware**: Handles implicit auth and cart cookie management across all requests

### Key Architectural Patterns

#### 1. React Shopper Hooks System
Located in `src/react-shopper-hooks/`, this is the core state management layer:
- **ElasticPathProvider**: Root provider for EPCC client and React Query
- **StoreProvider**: Manages global store state (currency, catalog, etc.)
- **AccountProvider**: Handles account member authentication state
- **CartProvider**: Manages shopping cart state with automatic persistence

#### 2. Shopper Common Layer
`src/shopper-common/` contains reusable business logic:
- Product utilities (bundles, variations, images)
- Navigation builders
- Type definitions shared across the application

#### 3. Service Layer Architecture
- **EPCC Clients**: Multiple client configurations for different contexts
  - `epcc-implicit-client.ts`: Client-side implicit auth
  - `epcc-server-client.ts`: Server-side with full credentials
  - `epcc-server-side-implicit-client.ts`: Server-side implicit auth
- **API Routes**: Next.js API routes for server-side operations (`/api/*`)

#### 4. Component Architecture
- **Compound Components**: Complex UI elements like cart, checkout, product displays
- **Headless UI Integration**: Accessible components with Tailwind styling
- **Search Components**: Modular search implementation supporting multiple providers

### State Management Flow
1. **Initial State**: Server-side rendered state via `getStoreInitialState()`
2. **Client Hydration**: React Query rehydrates with server state
3. **Real-time Updates**: Optimistic updates with automatic error handling
4. **Persistence**: Cart state persisted via HTTP-only cookies managed by middleware

### Multi-Provider Search Architecture
The application supports pluggable search providers:
- **Algolia**: `SearchResultsAlgolia.tsx`, `HitsAlgolia.tsx`
- **Klevu**: `SearchResultsKlevu.tsx`, `HitsKlevu.tsx`
- **Elastic Path**: `SearchResultsElasticPath.tsx`, `HitsElasticPath.tsx`

Configuration via environment variables determines active provider.

### Product Type Handling
Sophisticated product architecture supporting:
- **Simple Products**: Basic product with options
- **Product Variations**: Child products with different attributes
- **Bundle Products**: Composite products with configurable components
- **Component Products**: Individual parts of bundles

## Environment Configuration

### Required Variables
```bash
NEXT_PUBLIC_EPCC_CLIENT_ID=<your-client-id>
EPCC_CLIENT_SECRET=<your-client-secret>
NEXT_PUBLIC_EPCC_ENDPOINT_URL=<euwest.api.elasticpath.com|useast.api.elasticpath.com>
NEXT_PUBLIC_AUTHENTICATION_REALM_ID=<realm-id>
NEXT_PUBLIC_PASSWORD_PROFILE_ID=<password-profile-id>
```

### Environment Setup Helper
Run `yarn dotenv` for interactive environment configuration - this script will:
- Connect to your EPCC instance
- Create required authentication profiles
- Generate a complete `.env` file
- Set up Stripe payment gateway

## Development Guidelines

### Adding New Features
1. **Server Actions**: Place in `actions.ts` files within route directories
2. **Client Components**: Mark with `"use client"` when needed for interactivity
3. **API Routes**: Use for server-side operations that need EPCC secret credentials
4. **React Hooks**: Extend the shopper hooks system in `src/react-shopper-hooks/`

### Working with Products
- Use `ProductProvider` components for product-specific state
- Leverage `product-helper.ts` utilities for common operations
- Handle variations through the variation provider system

### Cart Operations
- Cart operations are optimistically updated via React Query mutations
- Cart persistence is automatic through middleware
- Support for multiple carts per account

### Authentication Flow
- Account members use realm-based authentication
- Admin users use NextAuth.js with custom providers
- Authentication state managed through React context

### Search Integration
- Search components are provider-agnostic
- Configure via `NEXT_PUBLIC_ENABLE_ALGOLIA`, `NEXT_PUBLIC_ENABLE_KLEVU` etc.
- Custom search implementations should follow the established pattern

### Checkout Process
- Multi-step checkout with state persistence
- Support for guest and authenticated checkout
- Configurable payment methods (Stripe, PayPal, Purchase Order)
- Shipping calculations with multiple delivery options

### Admin Features
- Separate admin interface at `/admin` routes
- Quote management and order approval workflows
- Account impersonation for customer support
- Role-based access control

## Testing Strategy

### Unit Tests (Vitest)
- Focus on utility functions and React hooks
- Mock EPCC API calls using Vitest mocks
- Test business logic in isolation

### E2E Tests (Playwright)
Located in `e2e/` directory:
- `home-page.spec.ts`: Homepage functionality
- `product-details-page.spec.ts`: PDP interactions
- `product-list-page.spec.ts`: Search and filtering
- `checkout-flow.spec.ts`: End-to-end purchase flow

### Test Environment
E2E tests use `NODE_ENV=test` with separate build configuration.

## Common Issues & Solutions

### Environment Variables
- Use `.env_template.example` as reference
- Server vs. client variables: `NEXT_PUBLIC_*` for client-side access
- Run `yarn dotenv` for guided setup

### Cart Issues
- Cart state managed by middleware - check cookie settings
- Multiple cart support requires proper cart ID handling
- Cart persistence survives browser sessions

### Search Not Working
- Verify search provider environment variables
- Check API keys and index configuration
- Ensure search provider is enabled in environment

### Authentication Problems
- Verify realm and password profile configuration
- Check EPCC authentication settings
- Ensure proper cookie domain settings

### Build Issues
- TypeScript errors: Run `yarn type:check`
- Missing environment variables cause build failures
- Image optimization can be disabled for development

## File Structure Notes

- **Route Groups**: Parentheses in folder names `(store)` don't affect URLs
- **Server Components**: Default in App Router - minimize client components
- **Barrel Exports**: Use `index.ts` files for clean imports
- **Colocation**: Keep related components, hooks, and utilities together