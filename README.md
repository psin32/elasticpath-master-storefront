# elasticpath-master-storefront Elastic Path storefront starter

This project was generated with [Composable CLI](https://www.npmjs.com/package/composable-cli).

This storefront accelerates the development of a direct-to-consumer ecommerce experience using Elastic Path's modular products.

## Tech Stack

- [Elastic Path](https://www.elasticpath.com/products): A family of composable products for businesses that need to quickly & easily create unique experiences and next-level customer engagements that drive revenue.

- [Next.js](https://nextjs.org/): a React framework for building static and server-side rendered applications

- [Tailwind CSS](https://tailwindcss.com/): enabling you to get started with a range of out the box components that are
  easy to customize

- [Headless UI](https://headlessui.com/): completely unstyled, fully accessible UI components, designed to integrate
  beautifully with Tailwind CSS.

- [Radix UI Primitives](https://www.radix-ui.com/primitives): Unstyled, accessible, open source React primitives for high-quality web apps and design systems.

- [Typescript](https://www.typescriptlang.org/): a typed superset of JavaScript that compiles to plain JavaScript

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page will hot reload as you edit the file.

## Deployment

Deployment is typical for a Next.js site. We recommend using a provider
like [Netlify](https://www.netlify.com/blog/2020/11/30/how-to-deploy-next.js-sites-to-netlify/)
or [Vercel](https://vercel.com/docs/frameworks/nextjs) to get full Next.js feature support.

## Storefront Features

### For Customers

- **Product Discovery & Browsing**

  - Product Listing Pages (PLP) with filters, search, and category navigation
  - Product Display Pages (PDP) with detailed product info, images, variations, and bundles
  - Hierarchy-based navigation menu (driven by Elastic Path PXM hierarchy)
  - Collections, featured products, and all-products listing

- **Cart & Checkout**

  - Add to cart, edit cart, remove items, and view cart sidebar
  - Bulk order and quick order support
  - Manage multiple carts
  - Checkout flow with address, shipping, and payment selection
  - Support for payment capture/authorization modes

- **Account Management**

  - Registration, login, and account summary
  - Manage addresses, cards, and subscriptions
  - View and manage orders, including order details, reorder, and order status tracking
  - View and manage quotes and shared lists
  - Settings page for preferences (e.g., payment mode)

- **Order Approval Workflow**

  - Approval Queue tab for orders requiring approval (role-based, with multi-role support)
  - Approve, Reject (with rejection notes), and Escalate actions for approvers
  - Approval status, approval member, and rejection notes displayed on order details
  - Orders placed by the logged-in user or cancelled are excluded from approval queue/actions

- **Other Features**
  - Search with Algolia/Elastic Path, including instant search and modal UI
  - Responsive, modern UI with Tailwind CSS and Headless UI
  - Localization and multi-language support

---

### For Admin Users

- **Admin Dashboard**

  - Overview dashboard for store management

- **Order Management**

  - View all orders, filter/search, and manage order status
  - Access to order details, including approval and rejection notes

- **Account Management**

  - View and manage all customer accounts
  - Impersonate users for support or troubleshooting

- **Quote Management**

  - View, create, and manage quotes for customers
  - Assign sales agents, track quote status, and manage quote details

- **Advanced Features**
  - Access to all customer and order data for reporting and support
  - Role-based access and approval workflows

---
