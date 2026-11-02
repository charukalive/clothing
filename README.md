# Mandara Fashion (මන්දාරා) • Ceylon Living & Contemporary Apparel

> **Mandara Fashion** is a premier Sri Lankan apparel boutique and e-commerce platform built with a high-performance zero-build static architecture (`React 18`, `ReactDOM`, `Tailwind CSS`, inline SVG icons) and a resilient dual-projection Firebase backend.

![Mandara Fashion Banner](web/assets/logo.svg)

---

## 🌺 Brand Identity & Vision
- **Brand Name**: **Mandara Fashion** (Inspired by the mythical *Mandara* celestial bloom, representing elegance, timeless royalty, and contemporary Sri Lankan grace).
- **Atelier Location**: 14 Guildford Crescent, Colombo 07, Western Province, Sri Lanka.
- **Craftsmanship**: 100% pure organic Ceylon linen, handloom textiles woven on heritage wooden looms, and breathable combed cottons tailored for tropical island living.
- **Currency**: Sri Lankan Rupees (**LKR / Rs.**).
- **Delivery**: Same-day/next-day Colombo dispatch and islandwide courier coverage across all 25 districts via **Pronto Logistics** & **Koombiyo Delivery**.

---

## 🏗 Architecture & Repository Structure

Zero-build portability allows instant deployment to standard static web hosts (cPanel, ServerByte, Netlify, Vercel, Firebase Hosting, or GitHub Pages) without build breakages. When Firebase is not yet connected, an instant in-browser data engine seamlessly handles all products, cart transactions, and order tracking.

```text
├── web/
│   ├── index.html              # Customer storefront & dual checkout (Online COD & WhatsApp)
│   ├── admin.html              # Administrator management portal & courier dispatch
│   ├── product-editor.html     # Dedicated standalone apparel studio (opens in new window)
│   ├── maintenance.html        # Private showcase & staging launch countdown
│   └── assets/
│       ├── logo.svg            # Mandara Fashion luxury brand vector logo
│       ├── favicon.svg         # Mandara circular medallion favicon
│       └── placeholder.svg     # Elegant photo staging placeholder
├── functions/
│   ├── index.js                # Cloud Functions: createGuestOrder, updateOrderStatus, syncPublicProduct
│   └── package.json            # Node.js 22 runtime dependencies
├── scripts/
│   ├── test-babel-admin.js     # Validates inline Babel JSX across all HTML files using @babel/parser
│   ├── verify-ux-clothing.js   # Automated assertions for sizes, colour swatches, and flows
│   └── create-desktop-package.js # Generates release archive ZIP on the Desktop
├── firestore.rules             # Role-based read/write rules & dual-projection guards
├── storage.rules               # Apparel photo upload limits (5MB, image/* MIME check)
├── firebase.json               # Emulator suite & hosting routing
└── package.json                # Project scripts & preflight tools
```

---

## 🛍 Key Features

### 1. Customer Storefront (`web/index.html`)
- **Interactive Colour Swatches**: Hex swatch dots (`w-6 h-6 rounded-full`) with active ring highlights (`ring-2 ring-offset-1 scale-110`) and dynamic label (e.g. `Colour: Olive Grove`).
- **Clothing Size Chips**: Sizes `XS`, `S`, `M`, `L`, `XL`, `XXL` with selection feedback and stock-out alerts.
- **Variant Selection Modal**: Automatically intercepts clicks when an item is added without choosing a size or colour.
- **Two Distinct Checkout Flows**:
  1. **Online Checkout (Cash on Delivery / Direct Bank Transfer)**: Comprehensive delivery form for Colombo and islandwide districts. Submits with an idempotency key, returns unique **Order ID** (`ORD-XXXX`) and **Access Token** (`AT-XXXX`).
  2. **1-Click WhatsApp Direct Ordering**: Bypasses forms completely. Pre-fills order details (sizes, colours, quantities, LKR subtotal) and launches `wa.me/94779824567`.
- **5-Step Live Order Tracking**: `Order Placed` ➔ `Confirmed` ➔ `Tailoring/Packing` ➔ `Dispatched` ➔ `Delivered` with live courier waybill details.
- **Multi-Language Support**: Switch between **English (EN)**, **Sinhala (සිංහල)**, and **Tamil (தமிழ்)** with `localStorage` persistence.
- **Mobile First**: Sticky bottom ordering bar and minimum 44px touch targets.

### 2. Administrator Portal (`web/admin.html`)
- **Protected Access**: Master Staff PIN (`1234`) with session control.
- **Key Metrics**: Gross Sales (LKR), Pending Confirmations, Dispatched Parcels, and Low-Stock Warnings.
- **Order Pipeline**: Filter by status, assign couriers (Pronto, Koombiyo, Domex, Trans Express), and enter waybill IDs.
- **1-Click WhatsApp Customer Updates**: Automatically launches WhatsApp with personalized notifications in English or Sinhala.
- **Printable Invoices & Packing Slips**: Formatted print layout for parcel dispatch.
- **Inventory Management**: Toggle published/draft/archived states and view cost vs. retail margins.

### 3. Standalone Product Editor (`web/product-editor.html`)
- Dedicated full-screen studio for modifying or creating apparel items.
- Opens in a **separate browser window** (`target="_blank"`).
- Dual-write projection writes private master (`products/{id}`) and public projection (`publicProducts/{id}`) simultaneously.
- Cross-window communication via `window.opener.postMessage` and `storage` event triggers so the admin table refreshes instantly with zero reloads.
- Guard against accidental tab closing with `beforeunload`.

---

## 🔒 Firebase Backend & Security

### Collections Schema:
- `/products/{productId}`: **Private Master Product** (contains cost price, internal notes, supplier information). Readable only by admins.
- `/publicProducts/{productId}`: **Public Projection** (sanitized, contains only customer-facing attributes without cost price). Publicly readable.
- `/orders/{orderId}`: Orders containing items, sizes, colours, customer delivery details, and status.
- `/idempotencyKeys/{key}`: Idempotency registry to eliminate duplicate order submissions.

### How to Connect to Firebase Later:
1. Initialize or select your Firebase project:
   ```bash
   firebase login
   firebase use --add
   ```
2. Deploy Firestore & Storage Security Rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```
3. Deploy Cloud Functions:
   ```bash
   cd functions && npm install && cd ..
   firebase deploy --only functions
   ```
4. Deploy Hosting:
   ```bash
   firebase deploy --only hosting
   ```

---

## 🧪 Automated Preflight Verification

Run the complete test suite:
```bash
npm test
```

Or run individual checks:
```bash
# 1. Parse all inline Babel JSX scripts to guarantee 0 syntax errors
npm run test:babel

# 2. Assert UX touch targets, apparel sizes, colours, WhatsApp and currency
npm run test:ux

# 3. Create verified distribution ZIP on Desktop with SHA-256 digest
npm run package
```

---

© 2026 Mandara Fashion (Pvt) Ltd. Colombo 07, Sri Lanka. Handcrafted with Island Grace.
