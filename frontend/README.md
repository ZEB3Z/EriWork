# EriWork — website (React 19 + Vite 8)

This folder is the EriWork storefront and admin dashboard. It is deployed to
Render as a **Static Site**.

Setup, environment variables and deployment are covered in the main
[README](../README.md). The short version:

```bash
cp .env.example .env    # set VITE_API_URL (and Firebase keys if you use social login)
npm install
npm run dev             # http://localhost:5173
npm run build           # production build in dist/
npm run lint            # ESLint
```

State lives in Redux (`src/redux`), API calls go through `src/api.js`, and
`VITE_*` variables are baked in at build time — rebuild after changing them.
