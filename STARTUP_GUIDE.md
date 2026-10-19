# EriWork — Startup Guide

EriWork is a networking-products store (routers, mesh WiFi, switches, cables)
built with MongoDB, Express, React and Node.js.

Total time on a fresh computer: about 30 minutes, mostly downloads.

---

## 1. Install the tools (one time)

1. **Node.js** — download the **LTS** version from https://nodejs.org and
   install with the default options. Restart your computer afterwards.
2. **MongoDB Community Server** — download from
   https://www.mongodb.com/try/download/community (Windows, msi).
   Choose **Complete**, keep **"Install MongoDB as a Service"** checked, and
   keep **"Install MongoDB Compass"** checked.

Check that Node works. Open PowerShell and run:

```powershell
node --version
npm --version
```

Both should print a version number.

> **Compass is only a viewer.** The database itself is the "MongoDB Server"
> service. If Compass can't connect to `mongodb://localhost:27017`, open the
> **Services** app, find **MongoDB Server**, and click **Start**.

---

## 2. Unzip the project

Unzip `EriWork.zip`, for example to `C:\Users\<you>\Downloads\EriWork`.
Inside you'll find a `vindri` folder that contains `backend` and `frontend`.

All commands below are run from that `vindri` folder unless stated otherwise.
Open PowerShell there:

```powershell
cd "C:\Users\<you>\Downloads\EriWork\vindri"
```

> If the path contains spaces or brackets, like `EriWork (1)`, keep the quotes.

---

## 3. Create the two `.env` files

The settings files are not included in the zip, so create them from the examples:

```powershell
Copy-Item backend\config\.env.example backend\config\.env
Copy-Item frontend\.env.example frontend\.env
```

Then open **`backend\config\.env`** in Notepad and change:

- `JWT_SECRET` — any long random text.
- `SMTP_EMAIL` and `SMTP_PASSWORD` — your Mailtrap username and password
  (see section 7). You can leave these for later; the store works without
  email, it just won't send any.

The frontend `.env` already has the right value. Check both files exist:

```powershell
Get-Content backend\config\.env
Get-Content frontend\.env
```

> **Windows tip:** make sure the files are named exactly `.env`, not `.env.txt`.
> In File Explorer, turn on **View → File name extensions** to check.

---

## 4. Install, seed and start

You need **two PowerShell windows**, both kept open.

**Window 1 — backend (port 4001)**

```powershell
cd "C:\Users\<you>\Downloads\EriWork\vindri\backend"
npm install
npm run seed
npm start
```

`npm run seed` prints the accounts and products it created. Wait until
`npm start` shows:

```
Server started on port 4001 in DEVELOPMENT mode
MongoDB Database connected with HOST: localhost
```

**Window 2 — frontend (port 5173)**

```powershell
cd "C:\Users\<you>\Downloads\EriWork\vindri\frontend"
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

Next time you only need `npm start` (window 1) and `npm run dev` (window 2).

---

## 5. Logins

| Role     | Email                 | Password       |
|----------|-----------------------|----------------|
| Admin    | admin@eriwork.local   | admin1234      |
| Customer | juan@eriwork.local    | customer1234   |
| Customer | maria@eriwork.local   | customer1234   |

The admin area is in the account menu → **Admin dashboard** (or go to `/admin`).

---

## 6. Where to find each feature

| Feature | Where |
|---|---|
| Product CRUD in data tables, multiple photos | Admin → Products (New product / edit icon) |
| Bulk delete with checkboxes | Admin → Products: tick rows → **Delete selected** |
| Price, category and rating filters | Home page, left panel (the **Filters** button on phones) |
| Infinite scroll | Home page: more products load as you scroll |
| Review filter | Product page → Customer reviews: star buttons, rating bars, sort; Admin → Reviews filters |
| Only buyers can review; edit own review | Product page, after buying it (e.g. log in as Juan) |
| Bad words masked | Post a review with a swear word — it is shown as `****` |
| Admin deletes a review | Admin → Reviews → delete icon |
| Admin updates order status | Admin → Orders → **Manage** → **Update & email customer** |
| Email with items, subtotals, grand total + PDF receipt | Sent on checkout and on every status change (check Mailtrap) |
| Form validation (React Hook Form + Yup) | Login, register, profile, password, shipping, payment, product and user forms |
| Sales chart with date range | Admin → Dashboard: From/To dates, 7/30/90-day presets, line/bar toggle |
| Google login (Firebase) | Login page, after setting up section 8 |

The demo payment accepts any correctly formatted card, e.g.
`4242 4242 4242 4242`, `12/30`, `123`. Nothing is charged.

---

## 7. Email with Mailtrap

1. Sign up free at https://mailtrap.io.
2. Go to **Email Testing → Inboxes** and open your inbox.
3. Under **SMTP Settings**, copy the **Username** and **Password** into
   `backend\config\.env`:

   ```
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_EMAIL=<username>
   SMTP_PASSWORD=<password>
   ```
4. Restart the backend (window 1: `Ctrl + C`, then `npm start`).

Emails are sent when:

- a customer places an order (confirmation + PDF receipt),
- an admin changes an order's status (update + PDF receipt),
- someone uses **Forgot password?** (reset link).

All of them appear in your Mailtrap inbox. The reset link is also printed in
the backend window.

---

## 8. Google sign-in with Firebase (optional)

1. Go to https://console.firebase.google.com and click **Create a project**
   (any name, Google Analytics not needed).
2. In the left menu open **Build → Authentication → Get started**.
   On the **Sign-in method** tab, choose **Google**, switch it **on**, pick a
   support email and **Save**.
3. Still in Authentication, open **Settings → Authorized domains** and make sure
   `localhost` is in the list (it is by default).
4. Click the gear icon → **Project settings**. Under **Your apps**, click the
   **web icon `</>`**, give it a name, and click **Register app**.
   Firebase shows a `firebaseConfig` with `apiKey`, `authDomain`, `projectId`
   and `appId`.
5. Put those values in **`frontend\.env`**:

   ```
   VITE_FIREBASE_API_KEY=<apiKey>
   VITE_FIREBASE_AUTH_DOMAIN=<authDomain>
   VITE_FIREBASE_PROJECT_ID=<projectId>
   VITE_FIREBASE_APP_ID=<appId>
   ```
6. Put the same project ID in **`backend\config\.env`**:

   ```
   FIREBASE_PROJECT_ID=<projectId>
   ```
7. Restart **both** windows (`Ctrl + C`, then `npm start` / `npm run dev`).

The **Continue with Google** button now appears on the login and register
pages. The first Google sign-in creates a customer account automatically.

---

## 9. Troubleshooting

**Blank page, or "Cannot reach the server" messages**
The frontend can't find the backend. Check that `frontend\.env` exists and
contains `VITE_API=http://localhost:4001/api/v1`, that window 1 is still
running, then restart window 2. **Vite only reads `.env` when it starts.**

**`npm error enoent Could not read package.json`**
You ran the command in the wrong folder. `npm start` belongs in `backend`,
`npm run dev` in `frontend`.

**`Seeding failed: ... uri ... must be a string, got "undefined"`**
`backend\config\.env` is missing or empty. Recreate it (section 3).

**`Could not connect to MongoDB`**
The MongoDB Server service isn't running — start it in the **Services** app.

**Login says "Invalid email or password" for the demo accounts**
The database may hold older data. Start fresh (below).

**Emails don't arrive**
Check the SMTP values in `backend\config\.env` and restart the backend. The
admin's "Update & email customer" message also tells you if sending failed.

**Port already in use**
Close the other program, or change `PORT` in `backend\config\.env` and the
port in `VITE_API` in `frontend\.env` to match.

### Start completely fresh

1. Stop the backend (`Ctrl + C`).
2. In MongoDB Compass, connect to `mongodb://localhost:27017`, hover over the
   **eriwork** database and click the trash icon.
3. In the backend folder run `npm run seed`, then `npm start`.
4. In the browser, log out (or open a private window).
