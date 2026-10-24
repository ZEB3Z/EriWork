# EriWork — Quick Start (Windows) & Feature Tour

This page is the short version for running EriWork on a Windows PC, plus where
to find every feature. For account setup (MongoDB Atlas, Cloudinary, Mailtrap,
Firebase) and deploying to Render, see the main [README](README.md).

---

## 1. Unzip and open PowerShell

Unzip `EriWork.zip`, for example to `C:\Users\<you>\Downloads\EriWork`.
Inside you'll find an `eriwork` folder that contains `backend` and `frontend`.

All commands below start from that `eriwork` folder:

```powershell
cd "C:\Users\<you>\Downloads\EriWork\eriwork"
```

> If the path contains spaces or brackets, like `EriWork (1)`, keep the quotes.

---

## 2. Create the two `.env` files

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Open **`backend\.env`** in Notepad and fill in at least:

- `MONGO_URI` — your MongoDB Atlas connection string (README, section 4)
- `JWT_SECRET` — any long random text
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (README, section 5)
- `SMTP_USER`, `SMTP_PASS` — your Mailtrap credentials (README, section 6).
  You can leave these for later; the store works without email, it just won't send any.

`frontend\.env` already points at the local API (`http://localhost:4001/api/v1`).

> **Windows tip:** the files must be named exactly `.env`, not `.env.txt`.
> In File Explorer, turn on **View → Show → File name extensions** to check.

---

## 3. Install, seed and start

You need **two PowerShell windows**, both kept open.

**Window 1 — API (port 4001)**

```powershell
cd "C:\Users\<you>\Downloads\EriWork\eriwork\backend"
npm install
npm run seed
npm run dev
```

`npm run seed` uploads the demo product photos to Cloudinary and prints the
accounts it created. Wait until the API shows:

```
Server started on port 4001 in development mode
MongoDB Database connected with HOST: ...mongodb.net
```

**Window 2 — website (port 5173)**

```powershell
cd "C:\Users\<you>\Downloads\EriWork\eriwork\frontend"
npm install
npm run dev
```

Open **http://localhost:5173**. Next time you only need `npm run dev` in each window.

---

## 4. Logins

| Role     | Email                 | Password       |
|----------|-----------------------|----------------|
| Admin    | admin@eriwork.local   | admin1234      |
| Customer | juan@eriwork.local    | customer1234   |
| Customer | maria@eriwork.local   | customer1234   |

The admin area is in the account menu → **Admin dashboard** (or go to `/admin`).

---

## 5. Where to find each feature

| Feature | Where |
|---|---|
| Product CRUD in data tables, multiple photos (stored on Cloudinary) | Admin → Products (New product / edit icon) |
| Bulk delete with checkboxes | Admin → Products: tick rows → **Delete selected** (SweetAlert2 confirmation) |
| Price, category and rating filters | Home page, left panel (the **Filters** button on phones) |
| Infinite scroll | Home page: more products load as you scroll |
| Review filter | Product page → Customer reviews; Admin → Reviews filters |
| Only buyers can review; edit own review | Product page, after buying it (e.g. log in as Juan) |
| Bad words masked | Post a review with a swear word — it is shown as `****` |
| Admin deletes a review | Admin → Reviews → delete icon |
| Admin updates order status | Admin → Orders → **Manage** → **Update & email customer** |
| Email with items, subtotals, grand total + PDF receipt | Sent on checkout and on every status change (check your Mailtrap inbox) |
| Form validation (React Hook Form + Yup, plus `validator` on the API) | Login, register, profile, password, shipping, payment, product and user forms |
| Sales chart with date range | Admin → Dashboard: From/To dates, 7/30/90-day presets, line/bar toggle |
| Orders-by-status bar (React-Bootstrap) | Admin → Dashboard |
| Google and Facebook login (Firebase) | Login and register pages, after README section 7 |

The demo payment accepts any correctly formatted card, e.g.
`4242 4242 4242 4242`, `12/30`, `123`. Nothing is charged.

---

## 6. Troubleshooting (local)

**"Cannot reach the server" messages** — the API isn't running, or
`frontend\.env` is wrong. Check window 1, then restart window 2: **Vite only
reads `.env` when it starts.**

**`npm error enoent Could not read package.json`** — wrong folder. Run the
API commands in `backend` and the website commands in `frontend`.

**`MONGO_URI is not set` / `Seeding failed: MONGO_URI is missing`** —
`backend\.env` is missing or empty. Recreate it (section 2).

**`Could not connect to MongoDB`** — check the password inside `MONGO_URI`
and that Atlas **Network Access** allows your IP (or `0.0.0.0/0`).

**`Cloudinary keys are missing`** while seeding, or photo uploads fail — fill
in the three `CLOUDINARY_*` values in `backend\.env` and restart window 1.

**Port already in use** — close the other program, or change `PORT` in
`backend\.env` and the port inside `VITE_API_URL` in `frontend\.env` to match.

### Start completely fresh

1. Stop the API (`Ctrl + C`).
2. In MongoDB Atlas open **Browse Collections**, pick the **eriwork** database
   and choose **Drop database**.
3. In the `backend` folder run `npm run seed`, then `npm run dev`.
4. In the browser, log out (or open a private window).
