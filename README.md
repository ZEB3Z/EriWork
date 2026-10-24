<div align="center">

# EriWork

**A full-stack networking equipment store built on the MERN stack**

Routers, mesh WiFi, switches and cables, with a customer storefront and a complete admin dashboard.

<br>

![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520.19-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Images-Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=flat-square&logo=render&logoColor=black)
![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)

![Course](https://img.shields.io/badge/Course-Integrative%20Programming%20and%20Technology-7C3AED?style=flat-square)
![School](https://img.shields.io/badge/TUP-Taguig-B91C1C?style=flat-square)
![Program](https://img.shields.io/badge/BSIT-Third%20Year-1F2937?style=flat-square)

<br>

[Overview](#overview) &nbsp;|&nbsp; [Architecture](#architecture) &nbsp;|&nbsp; [Getting started](#getting-started) &nbsp;|&nbsp; [Deployment](#deploy-to-render) &nbsp;|&nbsp; [Troubleshooting](#troubleshooting) &nbsp;|&nbsp; [Authors](#authors)

</div>

---

## Table of contents

| Section | Topic |
|---|---|
| [Overview](#overview) | What EriWork is and what it can do |
| [Architecture](#architecture) | How the pieces connect |
| [Tech stack](#tech-stack) | Every library and what it does |
| [Project structure](#project-structure) | Folder layout |
| [Academic context](#academic-context) | Course, program and institution |
| [Authors](#authors) | The team behind the project |
| [Getting started](#getting-started) | Setup, deployment and fixes, in order |
| [Prerequisites](#prerequisites) | Tools and free accounts you need |
| [Clone and install](#clone-and-install) | Get the code and its dependencies |
| [Set up MongoDB Atlas](#set-up-mongodb-atlas) | Cloud database |
| [Set up Cloudinary](#set-up-cloudinary) | Image storage |
| [Set up email (Mailtrap)](#set-up-email-mailtrap) | Test email inbox |
| [Google and Facebook login (optional)](#google-and-facebook-login-optional) | Social sign-in through Firebase |
| [Configure environment variables](#configure-environment-variables) | The `.env` files |
| [Seed the database (optional)](#seed-the-database-optional) | Demo data and logins |
| [Run locally](#run-locally) | Start the API and the website |
| [Deploy to Render](#deploy-to-render) | Put the project online |
| [Push to GitHub](#push-to-github) | Upload your code |
| [Troubleshooting](#troubleshooting) | Fixes for common problems |

---

## Overview

EriWork is an online store for home and office networking equipment. Customers browse and filter products, check out with a demo card, and receive an email with a PDF receipt. Administrators manage the catalog, orders, users and reviews from a dashboard with data tables and a sales chart.

> [!NOTE]
> Payments are simulated. No real card is ever charged.

### Storefront

- Product list with **infinite scroll**, search, and **price, category and rating** filters
- Product pages with a photo gallery, stock status and reviews
- Only customers who **purchased** a product can review it, and they can **edit** their review. **Profanity is masked** automatically
- Sign in with email and password, **Google**, or **Facebook**

### Admin dashboard

- Product CRUD in an **MUI DataGrid** with **multi-photo upload** and **bulk delete** through checkboxes
- Order status updates (Processing → Shipped → Delivered / Cancelled) that **email the customer** an itemized summary with subtotal, grand total and a **PDF receipt**
- **Sales chart** with a date-range filter, user management, and a filterable review table

> [!TIP]
> Demo logins and a guided tour of where each feature lives are in [`STARTUP_GUIDE.md`](STARTUP_GUIDE.md).

---

## Architecture

```mermaid
flowchart LR
    User["Customer or Admin<br/>(browser)"]

    subgraph Render["Render"]
        Web["React + Vite website<br/>(Static Site)"]
        API["Express API<br/>(Web Service, /api/v1)"]
    end

    DB[("MongoDB Atlas")]
    Img["Cloudinary<br/>(photos and avatars)"]
    Mail["Mailtrap SMTP<br/>(order emails, PDF receipts)"]
    Auth["Firebase Auth<br/>(Google and Facebook)"]

    User --> Web
    Web -->|"Axios + session cookie"| API
    API --> DB
    API --> Img
    API --> Mail
    Web -.->|"sign-in popup"| Auth
    API -.->|"verifies sign-in token"| Auth
```

- The **website** is a static React build that talks to the API only through `/api/v1`.
- The **API** owns all data access: it reads and writes MongoDB, streams uploads to Cloudinary and sends email.
- **Firebase** is used only to prove who a Google or Facebook user is. After that, the API issues its own JWT session cookie.

---

## Tech stack

| Layer | Library | Purpose |
|---|---|---|
| Database | **MongoDB Atlas** + **Mongoose 9** | Cloud database and data models |
| Server | **Node.js** + **Express 5** | REST API under `/api/v1` |
| Auth | **jsonwebtoken** · **bcryptjs** · **cookie-parser** | JWT in an httpOnly cookie, hashed passwords |
| Social login | **Firebase Auth** (+ `firebase-admin`) | Google and Facebook sign-in, verified once, then the app's own JWT takes over |
| Images | **Cloudinary** + **Multer** | Uploads received in memory and streamed to Cloudinary, nothing on disk |
| Email | **Nodemailer** over **SMTP (Mailtrap)** · **pdfkit** | Order emails with a PDF receipt attached |
| Validation | **validator** (API) · **Yup + React Hook Form** (website) | Checks every input on both sides |
| Config | **dotenv** · **cors** · **nodemon** (dev) | Environment variables, cross-origin access, auto-restart |
| Frontend | **React 19** + **Vite 8** | The website and its build tool |
| State | **Redux 5** · **react-redux** · **redux-thunk** | Login session, cart and product list/filters |
| Routing | **React Router 7** | Pages and protected routes |
| UI | **MUI 9** · **@mui/x-data-grid** · **React-Bootstrap** | Components, admin tables, footer grid and dashboard status bar |
| HTTP | **Axios** | API calls (sends the session cookie) |
| Charts | **Recharts** | Admin sales chart |
| Alerts | **react-toastify** · **SweetAlert2** | Toasts and delete confirmations |
| SEO | **react-helmet** | Per-page titles and meta tags |
| Data | **countries-list** | Country picker at checkout |
| Quality | **ESLint** · **bad-words** | Linting, profanity masking in reviews |
| Hosting | **Render** | API as a Web Service, website as a Static Site |

---

## Project structure

```
eriwork/
├── render.yaml              Render Blueprint (both services)
├── backend/                 Express API  → Render Web Service
│   ├── config/              database.js, cloudinary.js
│   ├── controllers/         auth, product, order logic
│   ├── middlewares/         auth.js (JWT cookie), upload.js (Multer)
│   ├── models/              User, Product, Order (Mongoose)
│   ├── routes/              /api/v1/... endpoints
│   ├── seeds/               seed.js + demo product images
│   ├── utils/               email, PDF receipt, pricing, bad-words, validate, firebase
│   └── .env.example
└── frontend/                React + Vite → Render Static Site
    ├── src/redux/           store, reducers (auth, cart, products), thunks
    ├── src/Components/      pages: Admin, Cart, Order, Product, Review, User, Layout, Common
    ├── src/Utils/           helpers, Yup schemas, SweetAlert2 dialogs
    ├── src/api.js           Axios client (withCredentials)
    ├── src/firebase.js      Google / Facebook popups
    └── .env.example
```

---

## Academic context

This project was developed as a requirement for the course **Integrative Programming and Technology** by third year Bachelor of Science in Information Technology students of the Technological University of the Philippines, Taguig.

| Field | Details |
|---|---|
| **Course** | Integrative Programming and Technology (ITCP318) |
| **Program** | Bachelor of Science in Information Technology, third year |
| **Section** | BSIT-S-3A |
| **School year** | A.Y. 2026-2027 |
| **Institution** | Technological University of the Philippines, Taguig |

---

## Authors

| Author | GitHub |
|---|---|
| **Vincent Andri V. Barliso** | [@vincent-github-username](https://github.com/Vizsaa) |
| **Ericksson B. Brutas** | [@ericksson-github-username](https://github.com/ZEB3Z) |

---

## Getting started

The sections below walk through the full setup in order: accounts, local installation, configuration, deployment and troubleshooting.

---

## Prerequisites

Every account below has a free tier, and none of them need a credit card for this project.

| You need | Why | Get it |
|---|---|---|
| **Node.js 20.19+** (22 LTS recommended) | Runs the API and builds the website | [nodejs.org](https://nodejs.org) |
| **Git** | Downloads the code and pushes it to GitHub | [git-scm.com](https://git-scm.com) |
| **MongoDB Atlas** account | The database, hosted in the cloud | [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register) |
| **Cloudinary** account | Stores product photos and avatars | [cloudinary.com](https://cloudinary.com/users/register_free) |
| **Mailtrap** account | Catches test emails (order updates, password resets) | [mailtrap.io](https://mailtrap.io/register/signup) |
| **Render** account | Hosts the live website and API | [render.com](https://dashboard.render.com/register) |
| **GitHub** account | Render deploys straight from your GitHub repository | [github.com](https://github.com/signup) |
| *Optional:* **Firebase** project | Only for "Continue with Google / Facebook" | [console.firebase.google.com](https://console.firebase.google.com) |

Check that Node is installed. Both commands should print a version number:

```bash
node --version
```

```bash
npm --version
```

---

## Clone and install

Download the code. If you received a zip instead, unzip it, open a terminal in the `eriwork` folder and skip the `git clone` line.

```bash
git clone https://github.com/<your-username>/eriwork.git
```

```bash
cd eriwork
```

Install the API's packages:

```bash
cd backend
npm install
```

Then the website's packages:

```bash
cd ../frontend
npm install
```

> [!TIP]
> `npm install` reads `package.json` and downloads every library the project uses into a `node_modules` folder. You only need to repeat it when dependencies change.

---

## Set up MongoDB Atlas

Atlas hosts the database in the cloud, so both your computer and Render can reach the same data.

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com) and create a **project** (any name, for example `EriWork`).
2. Click **Create** (or **Build a Database**) and choose the **Free** cluster tier. Pick a region near you and click **Create Deployment**.
3. Atlas asks you to create a **database user**. Choose a username and a password. *Write the password down*, because you will need it in step 6.
   > **Note:** Use letters and numbers only in the password. Symbols like `@` or `/` break the connection string unless they are URL-encoded.
4. Go to **Security → Network Access → Add IP Address**, choose **Allow Access from Anywhere** (`0.0.0.0/0`) and **Confirm**.
   > **Note:** Render's free tier has no fixed IP address, so Atlas must accept connections from anywhere. Your database is still protected by the username and password.
5. Go to **Database → Clusters → Connect → Drivers** and copy the connection string. It looks like this:
   ```
   mongodb+srv://myuser:<db_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
6. Edit it in two places. Replace `<db_password>` with your real password, and add the database name **`eriwork`** right after `.mongodb.net/`:
   ```
   mongodb+srv://myuser:MyPassword123@cluster0.abcde.mongodb.net/eriwork?retryWrites=true&w=majority&appName=Cluster0
   ```
   This full string is your **`MONGO_URI`**. The `eriwork` database is created automatically the first time the app writes to it.

---

## Set up Cloudinary

Cloudinary stores every product photo and avatar. This matters because Render wipes a server's disk on every deploy and restart, so images saved there would disappear.

1. Create a free account at [cloudinary.com](https://cloudinary.com/users/register_free) and verify your email.
2. Open the **Cloudinary Console**. On the **Dashboard** (or **Settings → API Keys**) you will find three values:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** (click the eye icon to reveal it) → `CLOUDINARY_API_SECRET`
3. That is all. There are no folders to create. The app places everything under an `eriwork/` folder in your **Media Library** automatically.

> [!CAUTION]
> The API Secret is a password. Never commit it to GitHub or paste it into the frontend.

---

## Set up email (Mailtrap)

The app sends email with Nodemailer over SMTP: an order confirmation, a status update with a PDF receipt each time an admin changes an order, and password-reset links. Mailtrap provides a **sandbox inbox** that catches all of them.

1. Sign up at [mailtrap.io](https://mailtrap.io/register/signup).
2. Open **Email Testing** (also called **Sandboxes**) and open your default inbox.
3. Find the **SMTP credentials** under **Integration → SMTP** (or the **SMTP Settings** tab) and copy:
   - **Host** → `SMTP_HOST` (usually `sandbox.smtp.mailtrap.io`)
   - **Port** → `SMTP_PORT`, use **`2525`**
   - **Username** → `SMTP_USER`
   - **Password** → `SMTP_PASS`

> [!NOTE]
> **Mailtrap is a safe testing sandbox.** Emails land in your Mailtrap inbox and never reach real people. To email real customers in production, swap these four values for a real SMTP provider's (for example Brevo, SendGrid, Postmark or Amazon SES). No code changes are needed.

> [!WARNING]
> Keep port **2525**. Render's free tier blocks outgoing email on ports 25, 465 and 587, and most real providers also offer 2525.

The app keeps working without email. Orders still go through, and the admin simply sees an "email not sent" note.

---

## Google and Facebook login (optional)

Skip this whole section if you only want email and password login. The social buttons simply stay hidden.

**How it works:** Firebase opens the Google or Facebook popup and proves who the user is. The API checks that proof once, then logs the user in with the app's own session cookie, exactly like a normal login.

### Firebase project and Google

1. Go to the [Firebase console](https://console.firebase.google.com) and click **Create a project** (Google Analytics is not needed).
2. Open **Build → Authentication → Get started**. On the **Sign-in method** tab choose **Google**, switch it **on**, pick a support email and **Save**.
3. Click the gear icon, then **Project settings**. Under **Your apps** click the web icon **`</>`**, give the app a name and **Register app**. Copy these values from the `firebaseConfig` shown:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID` (frontend) **and** `FIREBASE_PROJECT_ID` (backend)
   - `appId` → `VITE_FIREBASE_APP_ID`

> [!NOTE]
> The backend only needs the project ID. No service-account key file is required, because verifying a sign-in token only checks Google's public signing keys.

### Facebook

Facebook also needs an app on Meta's side:

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App**. Choose the use case **Authenticate and request data from users with Facebook Login**.
2. In the app, open **App settings → Basic** and copy the **App ID** and **App Secret**.
3. In Firebase, go to **Authentication → Sign-in method → Add new provider → Facebook**. Switch it on, paste the App ID and App Secret, and copy the **OAuth redirect URI** Firebase shows (it ends in `/__/auth/handler`). **Save**.
4. Back on Meta, go to **Facebook Login → Settings → Valid OAuth Redirect URIs**, paste that URI and save.
5. While the Meta app is in **Development** mode, only people listed under **App roles** (you and your testers) can log in. To let anyone log in, switch the app to **Live**. Meta asks for a privacy policy URL first.

> [!NOTE]
> If someone already signed in with Google using the same email, Firebase blocks the Facebook sign-in by default. The app shows a message telling them to use Google instead.

### Allow your website's address

Go to **Authentication → Settings → Authorized domains**. `localhost` is there by default. After deploying, also add your Render website domain (for example `eriwork-web.onrender.com`). Without it, the popup fails with "unauthorized domain".

---

## Configure environment variables

Settings and secrets live in `.env` files, which are **gitignored** and never get uploaded to GitHub. Each folder has a `.env.example` template to copy.

**macOS / Linux / Git Bash**, from the `eriwork` folder:

```bash
cp backend/.env.example backend/.env
```

```bash
cp frontend/.env.example frontend/.env
```

**Windows PowerShell**, from the `eriwork` folder:

```powershell
Copy-Item backend\.env.example backend\.env
```

```powershell
Copy-Item frontend\.env.example frontend\.env
```

Open both `.env` files in a text editor and fill in the values from the sections above. Every line in the templates has a comment explaining it.

You can generate a strong `JWT_SECRET` with this command:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

<details>
<summary><b>Full list of environment variables (click to expand)</b></summary>

<br>

#### `backend/.env`

| Variable | Example | What it is for |
|---|---|---|
| `PORT` | `4001` | Port the API listens on locally. Render sets this itself. |
| `NODE_ENV` | `development` | Use `production` on Render (turns on secure cross-site cookies). |
| `MONGO_URI` | `mongodb+srv://…/eriwork?…` | Atlas connection string ([setup](#set-up-mongodb-atlas)). |
| `JWT_SECRET` | long random string | Signs login tokens. Keep it secret. |
| `JWT_EXPIRE` | `7d` | How long a login lasts. |
| `COOKIE_EXPIRE` | `7` | Session-cookie lifetime in **days** (match `JWT_EXPIRE`). |
| `FRONTEND_URL` | `http://localhost:5173` | The website's address, used for CORS and password-reset links. Several can be comma-separated. No trailing slash. |
| `CLOUDINARY_CLOUD_NAME` | `dxyz123` | From the Cloudinary dashboard. |
| `CLOUDINARY_API_KEY` | `123456789012345` | From the Cloudinary dashboard. |
| `CLOUDINARY_API_SECRET` | `abcDEF…` | From the Cloudinary dashboard. |
| `SMTP_HOST` | `sandbox.smtp.mailtrap.io` | Mailtrap SMTP host. |
| `SMTP_PORT` | `2525` | Keep 2525 (works on Render's free tier). |
| `SMTP_USER` | Mailtrap username | Mailtrap SMTP username. |
| `SMTP_PASS` | Mailtrap password | Mailtrap SMTP password. |
| `SMTP_FROM` | `EriWork <noreply@eriwork.local>` | Sender shown on emails. |
| `FIREBASE_PROJECT_ID` | `eriwork-12345` | Optional. Empty means social login is off on the server. |

#### `frontend/.env`

| Variable | Example | What it is for |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4001/api/v1` | Where the API is. Must end in `/api/v1`. |
| `VITE_FIREBASE_API_KEY` | Firebase `apiKey` | Optional. Firebase web app config. |
| `VITE_FIREBASE_AUTH_DOMAIN` | `eriwork-12345.firebaseapp.com` | Optional. |
| `VITE_FIREBASE_PROJECT_ID` | `eriwork-12345` | Optional. |
| `VITE_FIREBASE_APP_ID` | `1:123…:web:abc…` | Optional. Leave all four empty to hide the social buttons. |

> [!WARNING]
> `VITE_*` values are public. They are built into the website's JavaScript, so never put a secret in one.

</details>

---

## Seed the database (optional)

The seed script fills the database with demo data: an admin account, two customers, 12 products (their photos are uploaded to your Cloudinary), 60 days of orders for the sales chart, and some reviews. It is safe to run more than once, because it skips anything that already exists.

It needs `MONGO_URI` and the three `CLOUDINARY_*` values in `backend/.env`. From the `backend` folder:

```bash
npm run seed
```

Demo logins it creates:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@eriwork.local` | `admin1234` |
| Customer | `juan@eriwork.local` | `customer1234` |
| Customer | `maria@eriwork.local` | `customer1234` |

> [!IMPORTANT]
> Because the database lives on Atlas, seeding once from your computer also fills the database your Render deployment uses. Change the admin password before sharing your live site.

---

## Run locally

You need **two terminal windows** open at the same time, one for the API and one for the website.

**Terminal 1: the API** (from the `backend` folder)

```bash
npm run dev
```

Wait until it prints `MongoDB Database connected`. (`npm run dev` restarts automatically when you edit code. `npm start` runs it once, as Render does.)

**Terminal 2: the website** (from the `frontend` folder)

```bash
npm run dev
```

Now open **<http://localhost:5173>** in your browser.

To stop either one, click its terminal and press `Ctrl + C`.

---

## Deploy to Render

You will create two services on Render:

| Service | Render type | Folder | What it does |
|---|---|---|---|
| `eriwork-api` | **Web Service** (Node) | `backend/` | The Express API |
| `eriwork-web` | **Static Site** | `frontend/` | The React website (built files served from a CDN) |

They live at two different addresses, for example `https://eriwork-api.onrender.com` and `https://eriwork-web.onrender.com`, and each one needs to know the other's address.

### Step 1: Put your code on GitHub

Render deploys from a GitHub repository. If your code is not there yet, follow [Push to GitHub](#push-to-github) first, then come back.

### Step 2: Create both services

<details open>
<summary><b>Option A (recommended): one click with the Blueprint</b></summary>

<br>

The repository includes a `render.yaml` file that describes both services.

1. In the [Render dashboard](https://dashboard.render.com) click **New → Blueprint**.
2. Connect your GitHub account and pick your `eriwork` repository.
3. Render shows the two services it will create and asks for each secret value. Fill them in from your `.env` files, with two exceptions:
   - `FRONTEND_URL` (API) → `https://eriwork-web.onrender.com`
   - `VITE_API_URL` (website) → `https://eriwork-api.onrender.com/api/v1`

   These are the addresses Render normally assigns. If a name is already taken, Render adds a suffix, and you will correct them in Step 3.
4. Click **Apply** (or **Deploy Blueprint**). The first build takes a few minutes.

</details>

<details>
<summary><b>Option B: create the two services by hand</b></summary>

<br>

**The API: New → Web Service.** Connect your repository, then use these settings:

| Setting | Value |
|---|---|
| Name | `eriwork-api` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path *(Advanced)* | `/api/v1/health` |

Under **Environment**, add every variable from `backend/.env`, with these changes:

- `NODE_ENV` = `production`
- `NODE_VERSION` = `22`
- `FRONTEND_URL` = your website's address
- Leave out `PORT`, because Render sets it.

**The website: New → Static Site.** Connect the same repository, then use these settings:

| Setting | Value |
|---|---|
| Name | `eriwork-web` |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Under **Environment**, add `NODE_VERSION` = `22`, `VITE_API_URL` = `https://<your-api>.onrender.com/api/v1`, and the four `VITE_FIREBASE_*` values if you use social login.

Then open **Redirects/Rewrites** and add one rule so page refreshes work:

| Source | Destination | Action |
|---|---|---|
| `/*` | `/index.html` | **Rewrite** |

</details>

### Step 3: Point the two services at each other

Once both services finish their first deploy:

1. Copy the website's real address from the top of the `eriwork-web` page, for example `https://eriwork-web.onrender.com`.
2. Open **eriwork-api → Environment** and make sure `FRONTEND_URL` is exactly that address, with `https` and no trailing slash. Save, and the API redeploys by itself.
3. Copy the API's real address and open **eriwork-web → Environment**. Set `VITE_API_URL` to that address plus `/api/v1`. Save, then click **Manual Deploy → Deploy latest commit**.
   > **Note:** The website must be **rebuilt** after changing a `VITE_*` variable, because Vite bakes them into the JavaScript at build time.
4. Check that the API is alive by opening `https://<your-api>.onrender.com/api/v1/health`. It should show `{"status":"ok"}`.
5. If you use Google or Facebook login, add the website's domain under Firebase **Authentication → Settings → Authorized domains**.

Open your website's address and log in. You are live.

> [!NOTE]
> **Free-tier behavior:** Render puts a free Web Service to sleep after about 15 minutes without visits. The first request afterwards can take around a minute while it wakes up, which is normal. The Static Site never sleeps.

---

## Push to GitHub

If you have never used Git, here is the whole process. Run these commands from the `eriwork` folder.

1. On [github.com/new](https://github.com/new), create a **new empty repository** called `eriwork`. Do not add a README, `.gitignore` or license, because the project already has them.
2. Tell Git who you are (only needed once per computer):
   ```bash
   git config --global user.name "Your Name"
   ```
   ```bash
   git config --global user.email "you@example.com"
   ```
3. Turn the folder into a Git repository:
   ```bash
   git init
   ```
4. Stage every file:
   ```bash
   git add .
   ```
5. **Safety check.** Make sure no `.env` file is listed (only `.env.example` should appear):
   ```bash
   git status
   ```
6. Save a snapshot (a "commit"):
   ```bash
   git commit -m "EriWork: initial commit"
   ```
7. Name the main branch:
   ```bash
   git branch -M main
   ```
8. Connect to your GitHub repository (use your own username):
   ```bash
   git remote add origin https://github.com/<your-username>/eriwork.git
   ```
9. Upload:
   ```bash
   git push -u origin main
   ```

> [!IMPORTANT]
> Your `.env` files are listed in `.gitignore`, so your database password, Cloudinary secret and other keys **never** get uploaded. If you ever commit a secret by accident, change it at the provider (Atlas, Cloudinary, Mailtrap) right away. Deleting the file later does not remove it from Git history.

To ship a change later, run `git add .`, then `git commit -m "describe the change"`, then `git push`. Render redeploys automatically.

---

## Troubleshooting

<details>
<summary><b>"Cannot reach the server" or the browser console shows a CORS error</b></summary>

<br>

The API is refusing the website's address. Make sure the API's `FRONTEND_URL` matches the website's address **exactly**: the same `https://`, no trailing `/`, and no `/api/v1`. Then check that the website's `VITE_API_URL` ends in `/api/v1`, and redeploy the website after changing it. The API's Render logs print `CORS: blocked request from …` with the address it saw.

</details>

<details>
<summary><b>I log in, but a refresh logs me out (cookies not sticking)</b></summary>

<br>

The website and API are on different domains, so the session cookie must be "cross-site". That needs **`NODE_ENV=production`** on the API, which makes the cookie `Secure` and `SameSite=None`. Also check that both addresses use `https`.

Safari blocks cross-site cookies entirely. The app falls back to sending the token in a header for the current tab, so you stay logged in until the tab closes. For permanent sessions on Safari, put both services on subdomains of one custom domain (for example `shop.example.com` and `api.example.com`).

</details>

<details>
<summary><b>The site takes about a minute to load the first time</b></summary>

<br>

That is the free Render Web Service waking up after about 15 minutes of no traffic. Give it a moment, or open `https://<your-api>.onrender.com/api/v1/health` to wake it before a demo. A paid instance never sleeps.

</details>

<details>
<summary><b>The build or deploy fails</b></summary>

<br>

Open the failing deploy's **Logs** on Render. The usual causes are:

- **`MONGO_URI is not set`**: an environment variable is missing on the API service.
- **`Could not connect to MongoDB`**: the password in the URI is wrong, or Atlas **Network Access** does not include `0.0.0.0/0`.
- **Vite build errors on the website**: make sure `NODE_VERSION` is `22` and Root Directory is `frontend`.

The `sync: false` values from `render.yaml` are only requested when the Blueprint is first created. Add any you skipped under the service's **Environment** tab.

</details>

<details>
<summary><b>Image upload says "not configured" or fails</b></summary>

<br>

One of the three `CLOUDINARY_*` values is missing or has a typo (watch for extra spaces). Images must be PNG, JPG or WEBP and 5 MB or smaller.

</details>

<details>
<summary><b>Emails do not arrive</b></summary>

<br>

With Mailtrap, emails only ever show up in your **Mailtrap inbox**, never in a real mailbox. This is by design. If nothing shows up there:

- Check `SMTP_USER` and `SMTP_PASS`.
- Keep `SMTP_PORT=2525`, because Render's free tier blocks 25, 465 and 587.

The admin's order-update message also tells you when sending failed.

</details>

<details>
<summary><b>Refreshing a page like <code>/admin</code> shows "Not Found"</b></summary>

<br>

The website is missing its rewrite rule. Add `/*` → `/index.html` (Action: **Rewrite**) under the Static Site's **Redirects/Rewrites**. The Blueprint adds it for you.

</details>

<details>
<summary><b>Google or Facebook popup errors</b></summary>

<br>

- **"unauthorized domain"**: add your website's domain in Firebase → Authentication → Settings → Authorized domains.
- **"isn't enabled yet"**: switch the provider on under Sign-in method.
- **Facebook works only for you**: the Meta app is still in Development mode. Switch it to Live.
- **No buttons at all**: the `VITE_FIREBASE_*` values were empty when the website was built.

</details>

---

<div align="center">

**EriWork**

A project for *Integrative Programming and Technology*<br>
Technological University of the Philippines, Taguig

Made by [Vincent Andri V. Barliso](https://github.com/Vizsaa) and [Ericksson B. Brutas](https://github.com/ZEB3Z)

<sub>Academic project. Demo payments only, no real card is ever charged.</sub>

</div>
