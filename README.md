This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Razorpay setup (online payments + automated payouts)

XEROXMATE collects customer payments through [Razorpay Checkout](https://razorpay.com/docs/checkout/) and pays the shopkeeper's share using **Route linked accounts** (automated transfers). The flow is:

1. Shopkeepers enable payouts in **Shop → Settings → Razorpay Payouts**.
2. On submit, the server creates a linked account + stakeholder + `route` product configuration on Razorpay, records the ids on the shop document, and tracks KYC activation.
3. When a customer places an order with a full/advance payment method, the server creates a Razorpay order (with an inline Route transfer for the shopkeeper's share, after platform commission) and opens Checkout.
4. `checkout/verify` and the `/api/webhooks/razorpay` webhook mark the order as captured and record transfer ids.

### Steps

1. Create a Razorpay account and get **Key ID / Key Secret** from [the keys dashboard](https://dashboard.razorpay.com/app/keys).
2. Add the environment variables from `.env.local` (scroll to the "Razorpay" section):
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (server SDK)
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (client Checkout; same value)
   - `RAZORPAY_WEBHOOK_SECRET` (any random string)
   - `FIREBASE_SERVICE_ACCOUNT` — a Firebase Admin service-account JSON (single line) so the server can write payment state to Firestore
   - `PLATFORM_COMMISSION_PERCENT` — percentage of each online payment kept by the platform before the shopkeeper transfer (default `15`)
3. Deploy, then register a webhook at [dashboard.razorpay.com/app/webhooks](https://dashboard.razorpay.com/app/webhooks) pointing to `https://<your-domain>/api/webhooks/razorpay` with the secret above and at least these events: `payment.captured`, `transfer.processed`, `product.route.activated`, `product.route.needs_clarification`, `product.route.under_review`.
4. Deploy `firestore.rules` (`firebase deploy --only firestore:rules`). They prevent clients from forging Razorpay state; the Admin SDK and webhooks bypass rules.

### How payouts work

- Platform keeps `commissionPercent` (min ₹0.01) of every captured payment so the Route transfer never equals the captured amount (a Razorpay Rule).
- The shopkeeper's share is transferred to their linked account; `transfer.processed` webhooks update `razorpayTransferIds` / `razorpayPayoutStatus` on the order.
- Only shops with `payoutEnabled === true` (activated linked account) get transfers; otherwise the platform holds funds manually.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
