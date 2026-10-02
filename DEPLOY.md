# Deploying Baskit: Frontend on Vercel, Backend on Render

Total time: about 30 minutes. Everything here works on the free tiers.

```
Browser -> Vercel (React app)
              |  /api/*  is proxied by vercel.json
              v
           Render (Express API) -> MongoDB Atlas, Cloudinary, Gemini, Brevo
```

The browser only talks to your Vercel domain. `vercel.json` forwards `/api/*` to Render.
This keeps the login cookie first-party, so login also works in Safari, iOS and incognito
(cross-site cookies get blocked there).

---

## Step 0: Rotate your secrets (do this first)

The original repo had `backend/.env` committed to a public GitHub repo, so those keys are
compromised. This zip does NOT contain your `.env`. Generate new values for everything:

| Secret | Where to rotate |
|---|---|
| MongoDB password | Atlas -> Database Access -> edit user |
| `JWT_SECRET` | run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| Cloudinary API secret | Cloudinary dashboard -> API Keys -> generate new |
| `GEMINI_API_KEY` | Google AI Studio -> delete old key, create new |
| SMTP password | your mail provider (not needed if you use Brevo below) |

Easiest clean start: create a **new GitHub repo** and push this folder to it (history won't
contain the old secrets). If you keep the old repo, run `git rm --cached backend/.env`, commit,
and still rotate everything, because the old commits stay public.

---

## Step 1: MongoDB Atlas (database)

1. Create a free cluster at https://cloud.mongodb.com
2. Database Access -> Add user (username + password, "Read and write to any database").
3. **Network Access -> Add IP Address -> Allow access from anywhere (`0.0.0.0/0`)**.
   Render's free tier has no fixed IP, so without this the backend cannot connect.
4. Connect -> Drivers -> copy the connection string and add the DB name:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/baskit?retryWrites=true&w=majority`
   (URL-encode special characters in the password.)

## Step 2: Brevo (verification emails)

Render's free tier **blocks SMTP ports 25/465/587**, so Gmail/SMTP via Nodemailer times out
in production. The code now sends through Brevo's HTTPS API instead (free: 300 emails/day).

1. Sign up at https://www.brevo.com
2. Senders & IP -> Senders -> add and verify the email address you want to send from.
3. SMTP & API -> API Keys -> generate a key (starts with `xkeysib-`).
4. You'll set `EMAIL_FROM="Baskit <that-verified-address>"` and `BREVO_API_KEY` on Render.

Skip this step if you don't need seller email verification. Everything else still works.

## Step 3: Push the project to GitHub

```bash
cd baskit-fixed
git init
git add .
git commit -m "Baskit: deploy-ready"
git branch -M main
git remote add origin https://github.com/<you>/baskit.git
git push -u origin main
```
Check that `.env` does NOT show up in the repo on GitHub (it's in `.gitignore`).

## Step 4: Deploy the backend on Render

Render dashboard -> **New + -> Web Service** -> connect your repo, then:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path (Advanced) | `/health` |

Add these under **Environment**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | your Atlas string from Step 1 |
| `JWT_SECRET` | your new random string |
| `FRONTEND_URL` | `https://placeholder.vercel.app` (you'll fix this in Step 7) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary |
| `GEMINI_API_KEY` | your new Gemini key |
| `GEMINI_MODEL` | `gemini-3.5-flash` |
| `EMAIL_FROM` | `Baskit <your-verified-sender@example.com>` |
| `BREVO_API_KEY` | from Step 2 |

(Alternatively: New + -> Blueprint uses the included `render.yaml` and asks you for the secret values.)

Click **Create Web Service**. When the deploy is live, open `https://<your-service>.onrender.com/health`.
It should say `ok`. **Copy your Render URL.**

## Step 5: Point the frontend at your backend

Open `frontend/vercel.json` and replace `YOUR-BACKEND-NAME` with your real Render hostname:

```json
{ "source": "/api/:path*", "destination": "https://baskit-api.onrender.com/api/:path*" }
```
Commit and push:
```bash
git add frontend/vercel.json && git commit -m "Set backend URL" && git push
```

## Step 6: Deploy the frontend on Vercel

Vercel -> **Add New -> Project** -> import the repo, then:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build / Output | defaults (`npm run build` / `dist`) |
| Environment Variables | **none needed** (leave `VITE_API_URL` unset) |

Deploy. **Copy your Vercel URL** (e.g. `https://baskit.vercel.app`).

## Step 7: Tell the backend your frontend URL

Render -> your service -> Environment -> set
`FRONTEND_URL=https://baskit.vercel.app` (no trailing slash) -> Save (it redeploys).
This is used for CORS and for the link inside seller verification emails.
To also allow local dev, comma-separate: `https://baskit.vercel.app,http://localhost:5173`.

## Step 8: Smoke test

1. Open your Vercel URL, sign up as a buyer, then refresh the page. You should still be logged in.
2. Sign up as a seller, add a product with images (tests Cloudinary).
3. As the buyer: add to cart, check out, then view the order.
4. As the seller: update the order status, and open the dashboard charts.
5. Seller profile -> send verification email -> click the link in the email.
6. Leave a review, then open the product's Details / Care tabs (tests Gemini).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| First load after a while is very slow or errors once | Render's free tier sleeps after ~15 min idle and takes up to ~1 min to wake. Refresh once. Optional: a free UptimeRobot monitor pinging `/health` every 5 min keeps it awake. |
| Login succeeds but you're logged out on refresh | Check `NODE_ENV=production` is set on Render and that `vercel.json` has your real Render URL. |
| Render logs: `MongooseServerSelectionError` | Atlas Network Access must allow `0.0.0.0/0`, and check the password/URI. |
| `CORS blocked for origin` in Render logs | `FRONTEND_URL` doesn't exactly match your Vercel URL (no trailing slash, https). |
| Page refresh on `/market` gives 404 | `frontend/vercel.json` missing, or Root Directory isn't `frontend`. |
| Images fail to upload | Check the 3 Cloudinary vars. |
| Verification email never arrives | Check `BREVO_API_KEY`, and that `EMAIL_FROM` uses your verified Brevo sender. Look at Render logs for `Brevo API error`. |
| AI summaries say "Failed to generate" / logs show 404 model not found | Google retires models often. Set `GEMINI_MODEL` on Render to a current model id from https://ai.google.dev/gemini-api/docs/models (no code change). Note `gemini-2.5-flash` is scheduled to retire on 2026-10-16. |

---

## Running locally

```bash
# backend
cd backend
cp .env.example .env      # fill in values; set NODE_ENV=development and FRONTEND_URL=http://localhost:5173
npm install
npm run dev               # http://localhost:3000

# frontend (new terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173  (uses .env.development -> localhost:3000)
```

---

## What was fixed

**Deployment blockers**
- `localhost:3000` was hardcoded in two frontend files. The API URL is now configurable, and `/api` is proxied to Render via `vercel.json`.
- Auth cookie was `SameSite=Strict`, which never works across Vercel and Render. It is now `None; Secure` in production and `Lax` locally, with `trust proxy` enabled for Render.
- CORS was hardcoded to localhost. It now reads `FRONTEND_URL` (supports several origins).
- `App.jsx` imported `navigationBar.jsx` but the file is `NavigationBar.jsx`. That works on Windows/Mac and fails on Vercel's Linux builds.
- Backend had no `start` script, which Render needs. Added `start`, `engines`, and a `/health` endpoint. The server now listens before connecting to the DB, and exits loudly if Mongo is unreachable.
- Added `vercel.json` (API proxy + SPA fallback) and `render.yaml`.
- Email: Render's free tier blocks SMTP, so added a Brevo HTTPS path (SMTP kept as fallback).
- Gemini model `gemini-1.5-flash` is shut down; the model is now an env var defaulting to a current one.

**Security**
- `backend/.env` was committed to the public repo and `.gitignore` had a corrupted `.env` rule. Fixed, and a safe `.env.example` is provided.
- Gemini and Perplexity API keys were used in browser code (`VITE_*`), so anyone could read them from the bundle. AI calls now go through new backend endpoints (`/api/ai/...`) using only the Gemini key. The Perplexity key is no longer needed.
- Signup/login/profile responses returned the bcrypt password hash. Models now strip it from all JSON.
- Any seller could edit or delete any other seller's product. Added ownership checks.

**Bugs**
- `review.remove()` doesn't exist in Mongoose 8, so deleting a review crashed. Fixed, and ratings are recalculated.
- The review unique index meant a user could only ever review one seller. Fixed with partial indexes.
- Removed unused dependencies (`bcrypt`, `openai`, `node-fetch`, frontend `@google/genai`).
- `package-lock.json` files were gitignored. They're now included for reproducible installs.
