# ENNIGMA PARIS

Storefront and admin portal for ENNIGMA PARIS.

- **client/**: React 19 + Vite + Tailwind storefront and admin UI
- **server/**: Express 5 + MongoDB (Mongoose) API
- **api/index.js**: Vercel serverless entry that mounts the Express app

## Getting started

Requires Node.js 20+ and a MongoDB database (local or Atlas).

```bash
npm run install:all
cp server/.env.example server/.env   # then fill in at least MONGODB_URI and JWT_SECRET
npm run dev                          # API on :3001, storefront on :5174 (proxied /api)
```

Generate a JWT secret with `openssl rand -hex 32`. The server refuses to start without one.

Seed the catalogue and create the first admin:

```bash
npm run seed --prefix server
ADMIN_PASSWORD='a-long-password' npm run reset-db --prefix server -- --yes   # deletes ALL products and users
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API and client with hot reload |
| `npm test` | API integration tests (starts an in-memory MongoDB) |
| `npm run lint` | Lints the client |
| `npm run build` | Production build of the client into `client/dist` |
| `npm run migrate:orders --prefix server` | Dry-run of the one-off order schema migration (add `-- --apply` to write) |

## Configuration

Every variable is documented in [`server/.env.example`](server/.env.example). The most important:

| Variable | Notes |
| --- | --- |
| `MONGODB_URI` | Required |
| `JWT_SECRET` | Required, at least 32 random characters in production |
| `FRONTEND_URL` | Public storefront URL, used for CORS and payment return URLs |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Enables card payments via Stripe Checkout. Point a webhook at `/api/payments/webhook` for `checkout.session.completed` |
| `PAYHERE_MERCHANT_ID`, `PAYHERE_SECRET`, `PAYHERE_SANDBOX` | Enables PayHere. PayHere calls `/api/payments/payhere/notify` |
| `CLOUDINARY_URL` | Recommended. Without it, uploads are stored inside MongoDB |
| `FREE_SHIPPING_THRESHOLD`, `FLAT_SHIPPING_RATE`, `STORE_CURRENCY` | Pricing rules enforced by the server |

## How checkout works

1. The client sends only product ids, sizes and quantities.
2. The server loads prices from the database, checks sizes, reserves stock atomically, applies and claims the discount code, and computes shipping and the total.
3. Orders start as `Pending`. Card and PayHere orders redirect to the gateway's hosted page; only the gateway's signed callback (Stripe webhook / PayHere notify) marks them paid, and only when the amount and currency match.
4. Bank transfers require an uploaded slip and are verified manually in the admin portal.
5. Cancelling an order in the admin portal returns its stock.

## Authentication

Sessions are httpOnly cookies (`ennigma_session`), so page scripts cannot read the token. Guests get a signed `ennigma_orders` cookie listing the orders that browser placed, which is what lets them view the order and its invoice. Every state-changing API request must send `X-Requested-With: XMLHttpRequest` (the client sets this globally) as CSRF protection.

## Deployment

- **Vercel**: `vercel.json` installs all three packages, builds the client, and routes `/api/*` and `/uploads/*` to the Express app. Set the environment variables above in the Vercel project.
- **Docker**: `JWT_SECRET=... docker compose up --build` runs the API, the built storefront and MongoDB on port 3001.
