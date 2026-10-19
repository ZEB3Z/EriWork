# EriWork

A networking-products store — routers, mesh WiFi, switches, adapters and cables —
built for ITCP318 with **MongoDB, Express, React and Node.js**.
Payments are simulated; no real card is charged.

➡ **Setup:** see [`STARTUP_GUIDE.md`](STARTUP_GUIDE.md).

## Features

**Shop**
- Product list with **infinite scroll** and filters for **price, category and rating**, plus search
- Product page with a photo gallery, stock status and quantity picker
- Cart → shipping → confirm → demo payment, with server-side price calculation
- Reviews: only customers who **bought** a product can review it; they can **edit** their review;
  profanity is masked with the **bad-words** package; reviews can be **filtered** by stars and sorted
- Google sign-in through **Firebase** (optional)

**Admin**
- Dashboard with stats and a **sales chart** (line or bar) with a **date range filter**
- Products in a **MUI DataGrid**: create / edit / delete, **multiple photos**, **bulk delete with checkboxes**
- Orders: update the status (Processing → Shipped → Delivered / Cancelled); the customer is **emailed**
  the list of products, subtotals and grand total with a **PDF receipt attached**
- Users (edit role / delete) and Reviews (filter / delete)

**Quality**
- Form validation with **React Hook Form + Yup** on every form
- UI built with **Material UI**; responsive down to phone size
- Stock is reserved when an order is placed and returned if it's cancelled

## Project structure

```
backend/
  controllers/   auth, product, order logic
  models/        User, Product, Order (Mongoose)
  routes/        API routes (/api/v1/...)
  utils/         email, PDF receipt, pricing, bad-words, image storage, Firebase
  seeds/seed.js  demo accounts, products, orders and reviews
  uploads/       product photos and avatars
frontend/
  src/Components/  pages and UI components (Admin, Cart, Order, Product, Review, User, Common, Layout)
  src/Utils/       helpers and Yup validation schemas
  src/api.js       axios client (adds the login token automatically)
  src/theme.js     MUI theme (EriWork colours and typography)
```
